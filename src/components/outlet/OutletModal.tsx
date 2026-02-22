import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { Outlet } from '../../lib/types/outlet';
import { Button } from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { Modal } from '../common/Modal';
import { Form } from '../../lib/types/forms';
import { outletApi } from '../../lib/services/api/outlet.api';
import { outletTypeApi } from '../../lib/services/api/outlet-type.api';
import { OUTLET_KEYS } from '../../lib/types/outlet';
import { OUTLET_TYPE_KEYS } from '../../lib/types/outlet-type';
import { useApiQuery, useApiMutation } from '../../lib/react-query/use-api-hooks';
import type { CreateOutletPayload, UpdateOutletPayload } from '../../lib/types/outlet';

export type ManagerOption = { id: string; name: string; phone?: string };

export type OutletModalProps = {
  open: boolean;
  onClose: () => void;
  editing: Outlet | null;
  onSuccess: () => void;
  availableForms: Form[];
  managers: ManagerOption[];
};

function getOutletId(outlet: Outlet | null | undefined): string | undefined {
  return outlet ? (outlet.id ?? (outlet as { _id?: string })._id) : undefined;
}

export function OutletModal({
  open,
  onClose,
  editing,
  onSuccess,
  availableForms,
  managers,
}: OutletModalProps) {
  const [form, setForm] = useState<Partial<Outlet>>({});
  const [error, setError] = useState<string | null>(null);

  const { data: outletTypesData } = useApiQuery(
    OUTLET_TYPE_KEYS,
    () => outletTypeApi.getOutletTypes({ page: 1, limit: 100 }),
    { enabled: open },
  );
  const outletTypes = outletTypesData?.data ?? [];

  const createMutation = useApiMutation(
    (data: CreateOutletPayload) => outletApi.create(data),
    [OUTLET_KEYS],
    {
      onSuccess: () => onSuccess(),
      onError: (err) => setError(err.message ?? 'Failed to create outlet'),
    },
  );

  const updateMutation = useApiMutation(
    (data: { id: string; payload: UpdateOutletPayload }) => outletApi.update(data.id, data.payload),
    [OUTLET_KEYS],
    {
      onSuccess: () => onSuccess(),
      onError: (err) => setError(err.message ?? 'Failed to update outlet'),
    },
  );

  useEffect(() => {
    if (open) {
      const next = editing ? { ...editing } : {};
      const t = setTimeout(() => {
        setForm(next);
        setError(null);
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setForm({});
      setError(null);
    }, 0);
    return () => clearTimeout(t);
  }, [open, editing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name?.trim() || !form.outletTypeId) return;

    const payload = {
      name: form.name.trim(),
      address: form.address?.trim() ?? undefined,
      outletType: form.outletTypeId,
      managerId: form.managerId || undefined,
      formId: form.formId || undefined,
    };

    const id = getOutletId(editing);

    if (editing && id) {
      updateMutation.mutate({ id, payload });
    } else {
      createMutation.mutate(payload as CreateOutletPayload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Outlet' : 'Register Outlet'}
      maxWidth='md'
    >
      <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
        {error && (
          <p
            className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3'
            role='alert'
          >
            {error}
          </p>
        )}
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
            options={outletTypes.map((ot) => ({ label: ot.name, value: ot._id }))}
            value={form.outletTypeId || ''}
            onChange={(e) => {
              const selected = outletTypes.find((ot) => ot._id === e.target.value);
              setForm({
                ...form,
                outletTypeId: selected?._id,
                outletTypeName: selected?.name,
              });
            }}
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
            className='px-10 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2'
          >
            {isPending ? (
              <>
                <Loader2 size={18} className='animate-spin' />
                Processing...
              </>
            ) : editing ? (
              'Update Outlet'
            ) : (
              'Save Outlet'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
