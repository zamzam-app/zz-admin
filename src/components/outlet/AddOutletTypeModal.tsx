import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { Modal } from '../common/Modal';
import { outletTypeApi } from '../../lib/services/api/outlet-type.api';
import { OUTLET_TYPE_KEYS } from '../../lib/types/outlet-type';
import type {
  CreateOutletTypePayload,
  OutletType,
  UpdateOutletTypePayload,
} from '../../lib/types/outlet-type';
import type { Form } from '../../lib/types/forms';
import type { ManagerOption } from './OutletModal';

export type AddOutletTypeModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableForms: Form[];
  managers: ManagerOption[];
  editing?: OutletType | null;
};

export function AddOutletTypeModal({
  open,
  onClose,
  onSuccess,
  availableForms,
  managers,
  editing,
}: AddOutletTypeModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [menuIds, setMenuIds] = useState('');
  const [formId, setFormId] = useState('');
  const [defaultManager, setDefaultManager] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName(editing?.name ?? '');
    setDescription(editing?.description ?? '');
    setMenuIds(editing?.menu?.join(', ') ?? '');
    setFormId(editing?.formId ?? '');
    setDefaultManager(editing?.defaultManager ?? '');
    setError(null);
  };

  useEffect(() => {
    if (open) resetForm();
  }, [open, editing]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !description.trim()) {
      setError('Name and description are required.');
      return;
    }
    const menu = menuIds
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      if (editing) {
        const payload: UpdateOutletTypePayload = {
          name: name.trim(),
          description: description.trim(),
          menu: menu.length > 0 ? menu : [],
          formId: formId || undefined,
          defaultManager: defaultManager || undefined,
        };
        await outletTypeApi.update(editing._id, payload);
      } else {
        const payload: CreateOutletTypePayload = {
          name: name.trim(),
          description: description.trim(),
        };
        if (menu.length > 0) payload.menu = menu;
        if (formId) payload.formId = formId;
        if (defaultManager) payload.defaultManager = defaultManager;
        await outletTypeApi.create(payload);
      }
      await queryClient.invalidateQueries({ queryKey: OUTLET_TYPE_KEYS });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${editing ? 'update' : 'create'} outlet type`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editing ? 'Edit Outlet Type' : 'Add Outlet Type'}
      maxWidth='md'
    >
      <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
        {error && (
          <p
            className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3'
            role='alert'
          >
            {error}
          </p>
        )}
        <Input
          label='Name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder='e.g. Restaurant'
        />
        <Input
          label='Description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder='e.g. A place where people can eat and dine'
        />
        <Input
          label='Menu Item IDs (comma separated)'
          value={menuIds}
          onChange={(e) => setMenuIds(e.target.value)}
          placeholder='e.g. id1, id2, id3'
        />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Select
            label='Default Form'
            options={availableForms.map((f) => ({ label: f.title, value: f._id }))}
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
          />
          <Select
            label='Default Manager'
            options={managers.map((m) => ({ label: m.name, value: m.id }))}
            value={defaultManager}
            onChange={(e) => setDefaultManager(e.target.value)}
          />
        </div>
        <div className='flex justify-end gap-4 pt-4 border-t border-gray-100'>
          <Button
            type='button'
            variant='ghost'
            onClick={handleClose}
            className='font-bold text-gray-400'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            variant='admin-primary'
            className='px-10 py-3.5 rounded-2xl font-black'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Outlet Type'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
