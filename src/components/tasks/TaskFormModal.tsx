import type { Dispatch, SetStateAction } from 'react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Autocomplete, MenuItem, Select as MuiSelect, TextField } from '@mui/material';
import type { Outlet } from '../../lib/types/outlet';
import type { User } from '../../lib/types/manager';
import type { Task, TaskCategory, TaskPriority, TaskStatus } from '../../lib/types/task';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { DateWheelPicker } from '../common/DateWheelPicker';

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const STATUS_OPTIONS: TaskStatus[] = ['open', 'in_progress', 'completed'];

const TASK_CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: 'hygiene', label: 'Hygiene' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'staffing', label: 'Staffing' },
];

export type TaskFormState = {
  description: string;
  priority: TaskPriority;
  dueDate: Dayjs | null;
  /** '' = not selected yet, 'all' = all outlets, else outlet id */
  outletId: '' | 'all' | string;
  category: TaskCategory | '';
  status: TaskStatus;
  assigneeIds: string[];
};

type TaskFormModalProps = {
  open: boolean;
  onClose: () => void;
  editing: Task | null;
  form: TaskFormState;
  setForm: Dispatch<SetStateAction<TaskFormState>>;
  onSubmit: () => void;
  outlets: Outlet[];
  managers: User[];
};

export function TaskFormModal({
  open,
  onClose,
  editing,
  form,
  setForm,
  onSubmit,
  outlets,
  managers,
}: TaskFormModalProps) {
  const outletSelectValue = form.outletId === '' ? '' : form.outletId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Task' : 'Assign New Task'}
      maxWidth='lg'
      scrollableContent
    >
      <div className='space-y-6'>
        <div>
          <label className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400'>
            Select outlet
          </label>
          <MuiSelect
            fullWidth
            value={outletSelectValue}
            onChange={(e) => {
              const v = String(e.target.value);
              if (v === '') {
                setForm({ ...form, outletId: '' });
              } else if (v === 'all') {
                setForm({ ...form, outletId: 'all' });
              } else {
                setForm({ ...form, outletId: v });
              }
            }}
            size='small'
            displayEmpty
            renderValue={(selected) => {
              if (selected === '' || selected === undefined) {
                return <span className='text-slate-400'>Choose outlet...</span>;
              }
              if (selected === 'all') return 'All outlets';
              const o = outlets.find((x) => x.id === selected);
              return o?.name ?? selected;
            }}
            sx={{ borderRadius: 3, bgcolor: 'white' }}
          >
            <MenuItem value='' disabled>
              Choose outlet...
            </MenuItem>
            <MenuItem value='all'>All outlets</MenuItem>
            {outlets.map((outlet) => (
              <MenuItem key={outlet.id} value={outlet.id}>
                {outlet.name}
              </MenuItem>
            ))}
          </MuiSelect>
        </div>

        <div>
          <label className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400'>
            Task category
          </label>
          <div className='flex flex-wrap gap-2'>
            {TASK_CATEGORY_OPTIONS.map(({ value, label }) => {
              const selected = form.category === value;
              return (
                <button
                  key={value}
                  type='button'
                  onClick={() => setForm({ ...form, category: value })}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                    selected
                      ? 'border-[#D4AF37] bg-[#FFFBF5] text-[#0F172A]'
                      : 'border-slate-200 bg-white text-[#0F172A] hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label='Description'
          multiline
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className='mt-2 grid grid-cols-1 gap-6 md:grid-cols-2'>
          <Select
            label='Priority'
            options={PRIORITY_OPTIONS.map((priority) => ({
              label: priority.toUpperCase(),
              value: priority,
            }))}
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
          />
          <Select
            label='Status'
            options={STATUS_OPTIONS.map((status) => ({
              label: status.replace('_', ' ').toUpperCase(),
              value: status,
            }))}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
          />
        </div>

        <div>
          <label className='mb-2 block text-sm font-medium text-gray-700'>Due Date</label>
          <DateWheelPicker
            value={form.dueDate}
            onChange={(date) => setForm({ ...form, dueDate: date })}
            minDate={dayjs().startOf('day')}
            maxYear={dayjs().year() + 10}
          />
        </div>

        <div>
          <Autocomplete
            multiple
            options={managers}
            value={managers.filter((m) => form.assigneeIds.includes(m._id ?? m.id ?? ''))}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) =>
              (option._id ?? option.id) === (value._id ?? value.id)
            }
            onChange={(_, value) =>
              setForm({
                ...form,
                assigneeIds: value.map((v) => v._id ?? v.id ?? '').filter(Boolean),
              })
            }
            renderInput={(params) => (
              <TextField {...params} label='Assignees' placeholder='Select managers' />
            )}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: '#F9FAFB',
                '&:hover fieldset': { borderColor: '#D4AF37' },
                '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
              },
              '& .MuiChip-root': {
                bgcolor: '#F3F4F6',
                fontWeight: 600,
              },
            }}
          />
        </div>

        <div className='flex justify-end gap-3'>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button variant='admin-primary' onClick={onSubmit}>
            {editing ? 'Update Task' : 'Assign Task'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
