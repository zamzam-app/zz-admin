import React from 'react';
import { Store as StoreType, StoreCategory } from '../../lib/types/types';
import { Button } from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { Modal } from '../common/Modal';
import { Form } from '../../lib/types/forms';

export type ManagerOption = { id: string; name: string; phone?: string };

export type OutletModalProps = {
  open: boolean;
  onClose: () => void;
  editing: StoreType | null;
  onSave: (editingId: string | null, data: Partial<StoreType>) => void;
  availableForms: Form[];
  managers: ManagerOption[];
};

export function OutletModal({
  open,
  onClose,
  editing,
  onSave,
  availableForms,
  managers,
}: OutletModalProps) {
  const [form, setForm] = React.useState<Partial<StoreType>>({});

  React.useEffect(() => {
    if (open) {
      setForm(editing ? { ...editing } : {});
    } else {
      setForm({});
    }
  }, [open, editing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category) return;

    if (editing?.id) {
      onSave(editing.id, form);
    } else {
      onSave(null, form);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Outlet' : 'Register Outlet'}
      maxWidth='md'
    >
      <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8'>
          <div className='md:col-span-2'>
            <Input
              label='Outlet Name'
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <Select
            label='Outlet Type'
            options={Object.values(StoreCategory)}
            value={form.category || ''}
            onChange={(e) => setForm({ ...form, category: e.target.value as StoreCategory })}
          />

          <Select
            label='Choose Form'
            options={availableForms.map((f) => ({ label: f.title, value: f._id }))}
            value={form.formId || ''}
            onChange={(e) => {
              const formItem = availableForms.find((f) => f._id === e.target.value);
              setForm({
                ...form,
                formId: formItem?._id,
                formTitle: formItem?.title,
              });
            }}
          />

          <div className='md:col-span-2'>
            <Input
              label='Address'
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className='md:col-span-2'>
            <Select
              label='Assigned Manager'
              options={managers.map((m) => ({ label: m.name, value: m.id }))}
              value={form.managerId || ''}
              onChange={(e) => {
                const manager = managers.find((m) => m.id === e.target.value);
                setForm({
                  ...form,
                  managerId: manager?.id,
                  managerName: manager?.name,
                  managerPhone: manager?.phone,
                });
              }}
            />
          </div>
        </div>

        <div className='flex justify-end gap-4 pt-6 border-t border-gray-100'>
          <Button variant='ghost' onClick={onClose} className='font-bold text-gray-400'>
            Cancel
          </Button>
          <Button
            type='submit'
            variant='admin-primary'
            className='px-10 py-3.5 rounded-2xl font-black'
          >
            {editing ? 'Update Outlet' : 'Save Outlet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
