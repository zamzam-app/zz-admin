import React, { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../common/Button';
import Input from '../common/Input';
import { Modal } from '../common/Modal';
import { taskCategoryApi } from '../../lib/services/api/task-category.api';
import { TASK_CATEGORY_KEYS } from '../../lib/types/task-category';
import type {
  CreateTaskCategoryPayload,
  TaskCategory,
  UpdateTaskCategoryPayload,
} from '../../lib/types/task-category';

export type AddTaskCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editing?: TaskCategory | null;
  existingNames?: string[];
};

export function AddTaskCategoryModal({
  open,
  onClose,
  onSuccess,
  editing,
  existingNames = [],
}: AddTaskCategoryModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName(editing?.name ?? '');
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

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    if (trimmedName.length > 120) {
      setError('Name cannot exceed 120 characters.');
      return;
    }

    const normalized = trimmedName.toLowerCase();
    const duplicate = existingNames.some((existing) => {
      const existingNormalized = existing.trim().toLowerCase();
      if (editing && existingNormalized === (editing.name ?? '').trim().toLowerCase()) {
        return false;
      }
      return existingNormalized === normalized;
    });
    if (duplicate) {
      setError('Task category name already exists.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        const payload: UpdateTaskCategoryPayload = {
          name: trimmedName,
        };
        await taskCategoryApi.update(editing._id, payload);
      } else {
        const payload: CreateTaskCategoryPayload = {
          name: trimmedName,
        };
        await taskCategoryApi.create(payload);
      }
      await queryClient.invalidateQueries({ queryKey: TASK_CATEGORY_KEYS });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${editing ? 'update' : 'create'} task category`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editing ? 'Edit Task Category' : 'Add Task Category'}
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
          placeholder='e.g. Hygiene'
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
            {isSubmitting ? 'Saving...' : 'Save Task Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
