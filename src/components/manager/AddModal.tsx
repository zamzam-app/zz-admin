import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import Input from '../common/Input';
import { usersApi } from '../../lib/services/api/users.api';
import { useApiMutation } from '../../lib/react-query/use-api-hooks';
import type { User, CreateUserPayload, UpdateUserPayload } from '../../lib/types/manager';

const EMPLOYEE_KEYS: unknown[][] = [['employees']];

type AddModalProps = {
  open: boolean;
  onClose: () => void;
  editing: User | null;
  onSuccess: () => void;
};

const initialForm: Partial<User> & { password?: string } = {};

export function AddModal({ open, onClose, editing, onSuccess }: AddModalProps) {
  const [form, setForm] = useState<Partial<User> & { password?: string }>(initialForm);

  const createMutation = useApiMutation(
    (data: CreateUserPayload) => usersApi.create(data),
    EMPLOYEE_KEYS,
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    },
  );

  const updateMutation = useApiMutation(
    (data: { id: string; payload: UpdateUserPayload }) => usersApi.update(data.id, data.payload),
    EMPLOYEE_KEYS,
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    },
  );

  useEffect(() => {
    if (!open) return;
    const next = editing ? { ...editing } : initialForm;
    const t = setTimeout(() => setForm(next), 0);
    return () => clearTimeout(t);
  }, [open, editing]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.userName) return;

    const id = editing?._id || editing?.id;

    if (editing && id) {
      updateMutation.mutate({
        id,
        payload: {
          name: form.name,
          userName: form.userName,
          email: form.email,
          role: 'manager',
          phoneNumber: form.phoneNumber,
          password: form.password,
        },
      });
    } else {
      createMutation.mutate({
        name: form.name,
        userName: form.userName,
        email: form.email,
        role: 'manager',
        phoneNumber: form.phoneNumber ?? '',
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
