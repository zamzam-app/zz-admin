import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { message } from 'antd';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import Input from '../common/Input';
import { usersApi } from '../../lib/services/api/users.api';
import { useApiMutation } from '../../lib/react-query/use-api-hooks';
import { MANAGER_KEYS, User, CreateUserPayload, UpdateUserPayload } from '../../lib/types/manager';

type AddModalProps = {
  open: boolean;
  onClose: () => void;
  editing: User | null;
  onSuccess: () => void;
  existingUsers: User[];
};

const initialForm: Partial<User> & { password?: string } = {};

function getUserId(u: User | null | undefined): string | undefined {
  return u ? (u._id ?? u.id) : undefined;
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const responseMessage = (err as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;
  if (responseMessage) return responseMessage;
  const generic = (err as Error | undefined)?.message;
  return generic || fallback;
}

export function AddModal({ open, onClose, editing, onSuccess, existingUsers }: AddModalProps) {
  const [form, setForm] = useState<Partial<User> & { password?: string }>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useApiMutation(
    (data: CreateUserPayload) => usersApi.create(data),
    [MANAGER_KEYS],
    {
      onSuccess: () => onSuccess(),
      onError: (err) => {
        const msg = getApiErrorMessage(err, 'Failed to create employee');
        setError(msg);
        message.error(msg);
      },
    },
  );

  const updateMutation = useApiMutation(
    (data: { id: string; payload: UpdateUserPayload }) => usersApi.update(data.id, data.payload),
    [MANAGER_KEYS],
    {
      onSuccess: () => onSuccess(),
      onError: (err) => {
        const msg = getApiErrorMessage(err, 'Failed to update employee');
        setError(msg);
        message.error(msg);
      },
    },
  );

  useEffect(() => {
    if (open) {
      const next = editing ? { ...editing } : initialForm;
      const t = setTimeout(() => {
        setForm(next);
        setError(null);
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setForm(initialForm);
      setError(null);
    }, 0);
    return () => clearTimeout(t);
  }, [open, editing]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name?.trim() || !form.userName?.trim()) return;
    const normalizedUsername = form.userName.trim().toLowerCase();
    const editingId = getUserId(editing);
    const duplicateUser = existingUsers.find((u) => {
      const existingName = u.userName?.trim().toLowerCase();
      if (!existingName) return false;
      if (editingId && getUserId(u) === editingId) return false;
      return existingName === normalizedUsername;
    });
    if (duplicateUser) {
      const msg = 'Username is already taken.';
      setError(msg);
      message.error(msg);
      return;
    }
    const id = getUserId(editing);

    if (editing && id) {
      updateMutation.mutate({
        id,
        payload: {
          name: form.name,
          userName: form.userName,
          email:
            form.email ||
            (form.userName.includes('@')
              ? form.userName
              : `${form.userName.replace(/[^a-zA-Z0-9]/g, '') || 'employee'}@zamzam.com`),
          role: 'manager',
        },
      });
    } else {
      createMutation.mutate({
        name: form.name!,
        userName: form.userName!,
        email:
          form.email ||
          (form.userName.includes('@')
            ? form.userName
            : `${form.userName.replace(/[^a-zA-Z0-9]/g, '') || 'employee'}@zamzam.com`),
        role: 'manager',
        password: form.password,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Employee' : 'Add Employee'}
      maxWidth='md'
    >
      <form onSubmit={handleSave} className='flex flex-col gap-8'>
        {error && (
          <p
            className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3'
            role='alert'
          >
            {error}
          </p>
        )}
        <div className='flex flex-col gap-6'>
          <Input
            label='Full Name'
            placeholder='Enter name'
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label='Username'
            placeholder='test-manager-01'
            value={form.userName || ''}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            required
          />
          {!editing && (
            <Input
              label='Password'
              type='password'
              placeholder='password123'
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          )}
        </div>

        <div className='flex justify-end items-center gap-4 pt-6 border-t border-gray-100'>
          <Button
            type='button'
            variant='ghost'
            onClick={onClose}
            className='font-bold text-gray-400'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            variant='admin-primary'
            disabled={isPending}
            className='px-12 py-3.5 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2'
          >
            {isPending ? (
              <>
                <Loader2 size={18} className='animate-spin' />
                Processing...
              </>
            ) : editing ? (
              'Update Employee'
            ) : (
              'Save Employee'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
