import type { Dispatch, SetStateAction } from 'react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Autocomplete, MenuItem, Select as MuiSelect, TextField } from '@mui/material';
import type { Outlet } from '../../lib/types/outlet';
import type { User } from '../../lib/types/manager';
import type { Task, TaskCategory, TaskPriority } from '../../lib/types/task';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DateWheelPicker } from '../common/DateWheelPicker';

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

const TASK_CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: 'hygiene', label: 'Hygiene' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'staffing', label: 'Staffing' },
];

/** Same label style as “Select outlet” (uppercase via CSS) */
const fieldLabelClass =
  'mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400';

const muiFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    bgcolor: 'white',
    '&:hover fieldset': { borderColor: '#D4AF37' },
    '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
  },
} as const;

const descriptionFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: '#F9FAFB',
    '&:hover fieldset': { borderColor: '#D4AF37' },
    '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
  },
} as const;

export type TaskFormState = {
  description: string;
  priority: TaskPriority;
  dueDate: Dayjs | null;
  /** '' = not selected yet, 'all' = all outlets, else outlet id */
  outletId: '' | 'all' | string;
  category: TaskCategory | '';
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
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start'>
          <div>
            <label
              className={fieldLabelClass}
              htmlFor={editing ? 'task-outlet-readonly' : 'task-outlet-select'}
            >
              {editing ? 'Outlet' : 'Select outlet'}
            </label>
            {editing ? (
              <div
                id='task-outlet-readonly'
                className='flex min-h-[40px] items-center rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800'
              >
                {editing.outletName?.trim() ||
                  outlets.find((o) => o.id === editing.outletId)?.name ||
                  editing.outletId ||
                  '—'}
              </div>
            ) : (
              <MuiSelect
                id='task-outlet-select'
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
            )}
          </div>
          <div className='min-w-0'>
            <label className={fieldLabelClass} htmlFor='task-priority-select'>
              Priority
            </label>
            <MuiSelect
              id='task-priority-select'
              fullWidth
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
              size='small'
              sx={{ borderRadius: 3, bgcolor: 'white' }}
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority.toUpperCase()}
                </MenuItem>
              ))}
            </MuiSelect>
          </div>
        </div>

        <div>
          <label className={fieldLabelClass}>Task category</label>
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

        <div>
          <label className={fieldLabelClass} htmlFor='task-description'>
            Description
          </label>
          <TextField
            id='task-description'
            multiline
            rows={4}
            fullWidth
            variant='outlined'
            placeholder='Describe the task…'
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={descriptionFieldSx}
          />
        </div>

        <div>
          <label className={fieldLabelClass}>Due date</label>
          <DateWheelPicker
            value={form.dueDate}
            onChange={(date) => setForm({ ...form, dueDate: date })}
            minDate={dayjs().startOf('day')}
            maxYear={dayjs().year() + 10}
          />
        </div>

        <div>
          <label className={fieldLabelClass} htmlFor='task-assignees'>
            Assignees
          </label>
          <Autocomplete
            multiple
            id='task-assignees'
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
              <TextField
                {...params}
                hiddenLabel
                placeholder='Select managers'
                sx={{
                  ...muiFieldSx,
                  '& .MuiOutlinedInput-root': {
                    ...muiFieldSx['& .MuiOutlinedInput-root'],
                    bgcolor: '#F9FAFB',
                  },
                }}
              />
            )}
            sx={{
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
