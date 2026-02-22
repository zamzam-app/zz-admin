import { useState, useEffect, useMemo } from 'react';
import { message, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
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
import { useImageUpload } from '../../lib/hooks/useImageUpload';
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

  const {
    upload,
    loading: uploadLoading,
    error: uploadError,
    clearError: clearUploadError,
  } = useImageUpload('outlets');

  useEffect(() => {
    if (uploadError) message.error(uploadError.message);
  }, [uploadError]);

  useEffect(() => {
    if (open) {
      const next = editing
        ? {
            ...editing,
            description: editing.description ?? '',
            images: editing.images ?? [],
          }
        : {};
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
      description: form.description?.trim() || undefined,
      images: form.images?.length ? form.images : undefined,
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

  const uploadFileList: UploadFile[] = useMemo(
    () =>
      (form.images ?? []).map((url, i) => ({
        uid: `${i}-${url}`,
        name: url.split('/').pop() ?? 'image',
        status: 'done' as const,
        url,
      })),
    [form.images],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Outlet' : 'Register Outlet'}
      titleAlign='center'
      maxWidth='lg'
      contentClassName='pt-2 px-8 pb-8 max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
    >
      <div className='-mx-2 px-2 pt-4'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {error && (
            <p
              className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3'
              role='alert'
            >
              {error}
            </p>
          )}

          <div>
            <Input
              label='Outlet Name'
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Input
              label='Description'
              multiline
              rows={5}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
            />
            <p className='mt-1 text-right text-xs text-gray-500'>
              {(form.description ?? '').length} / 1000
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6'>
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
          </div>

          <div>
            <Input
              label='Address'
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div>
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

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Upload Images</label>
            <Upload
              accept='image/*'
              multiple
              maxCount={4}
              listType='picture-card'
              fileList={uploadFileList}
              disabled={uploadLoading}
              customRequest={({ file, onSuccess, onError }) => {
                clearUploadError();
                upload(file as File)
                  .then((url) => {
                    setForm((prev) => ({
                      ...prev,
                      images: [...(prev.images ?? []), url],
                    }));
                    onSuccess?.(url);
                  })
                  .catch((err) =>
                    onError?.(err instanceof Error ? err : new Error('Upload failed')),
                  );
              }}
              onRemove={(file) => {
                setForm((prev) => ({
                  ...prev,
                  images: (prev.images ?? []).filter((u) => u !== file.url),
                }));
              }}
              showUploadList={{ showPreviewIcon: false }}
            >
              {uploadFileList.length >= 4 ? null : uploadLoading ? (
                <span className='inline-flex flex-col items-center justify-center gap-2 text-gray-400 pointer-events-none'>
                  <Loader2 size={24} className='animate-spin' />
                  <span className='text-xs'>Uploading…</span>
                </span>
              ) : (
                '+ Upload'
              )}
            </Upload>
          </div>

          <div className='flex justify-end gap-6'>
            <Button type='button' variant='ghost' onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type='submit'
              variant='admin-primary'
              className='rounded-2xl px-10 inline-flex items-center gap-2'
              disabled={isPending || uploadLoading}
            >
              {isPending || uploadLoading ? (
                <>
                  <Loader2 size={18} className='animate-spin shrink-0 text-white' />
                  <span className='text-white'>Saving…</span>
                </>
              ) : editing ? (
                'Update Outlet'
              ) : (
                'Save Outlet'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
