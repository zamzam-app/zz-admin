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
    if (!form.name?.trim() || !form.email?.trim() || !form.userName?.trim()) return;
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
    const phone = form.phoneNumber?.trim();
    if (!editing && !phone) {
      setError('Phone number is required.');
      return;
    }

    const id = getUserId(editing);

    if (editing && id) {
      updateMutation.mutate({
        id,
        payload: {
          name: form.name,
          userName: form.userName,
          email: form.email,
          role: 'manager',
          phoneNumber: phone ?? form.phoneNumber,
        },
      });
    } else {
      createMutation.mutate({
        name: form.name!,
        userName: form.userName!,
        email: form.email!,
        role: 'manager',
        phoneNumber: phone ?? '',
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
        <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8'>
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
          <Input
            label='Email'
            type='email'
            placeholder='testmanager01@zamzam.com'
            value={form.email || ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label='Phone Number'
            placeholder='+1234567890'
            value={form.phoneNumber || ''}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            required
          />
          <Input
            label='Password'
            type='password'
            placeholder='password123'
            value={form.password || ''}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing}
          />
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
