import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../common/Button';
import Input from '../common/Input';
import { Modal } from '../common/Modal';
import { categoryApi } from '../../lib/services/api/category.api';
import { CATEGORY_KEYS } from '../../lib/types/category';
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../../lib/types/category';

export type AddCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editing?: Category | null;
  existingNames?: string[];
};

export function AddCategoryModal({
  open,
  onClose,
  onSuccess,
  editing,
  existingNames = [],
}: AddCategoryModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName(editing?.name ?? '');
    setDescription(editing?.description ?? '');
    setError(null);
  }, [editing]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    const normalized = name.trim().toLowerCase();
    const duplicate = existingNames.some((existing) => {
      const existingNormalized = existing.trim().toLowerCase();
      if (editing && existingNormalized === (editing.name ?? '').trim().toLowerCase()) {
        return false;
      }
      return existingNormalized === normalized;
    });
    if (duplicate) {
      setError('Category name already exists.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        const payload: UpdateCategoryPayload = {
          name: name.trim(),
          description: description.trim() || undefined,
        };
        await categoryApi.update(editing._id, payload);
      } else {
        const payload: CreateCategoryPayload = {
          name: name.trim(),
          description: description.trim() || undefined,
        };
        await categoryApi.create(payload);
      }
      await queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${editing ? 'update' : 'create'} category`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editing ? 'Edit Cake Category' : 'Add Cake Category'}
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
          placeholder='e.g. Chocolate'
        />
        <Input
          label='Description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Optional description'
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
            {isSubmitting ? 'Saving...' : 'Save Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
