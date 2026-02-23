import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../common/Button';
import Input from '../common/Input';
import { Modal } from '../common/Modal';
import { outletTypeApi } from '../../lib/services/api/outlet-type.api';
import { OUTLET_TYPE_KEYS } from '../../lib/types/outlet-type';
import type { CreateOutletTypePayload } from '../../lib/types/outlet-type';
import type { Form } from '../../lib/types/forms';
import type { ManagerOption } from './OutletModal';

export type AddOutletTypeModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableForms: Form[];
  managers: ManagerOption[];
};

export function AddOutletTypeModal({ open, onClose, onSuccess }: AddOutletTypeModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [menuIds, setMenuIds] = useState('');
  const [formId, setFormId] = useState('');
  const [defaultManager, setDefaultManager] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setMenuIds('');
    setFormId('');
    setDefaultManager('');
    setError(null);
  };

  useEffect(() => {
    if (open) resetForm();
  }, [open]);

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
    const payload: CreateOutletTypePayload = {
      name: name.trim(),
      description: description.trim(),
    };
    const menu = menuIds
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (menu.length > 0) payload.menu = menu;
    if (formId) payload.formId = formId;
    if (defaultManager) payload.defaultManager = defaultManager;

    setIsSubmitting(true);
    try {
      await outletTypeApi.create(payload);
      await queryClient.invalidateQueries({ queryKey: OUTLET_TYPE_KEYS });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create outlet type');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title='Add Outlet Type' maxWidth='md'>
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
