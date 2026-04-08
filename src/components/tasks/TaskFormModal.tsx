import { useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Autocomplete, MenuItem, Select as MuiSelect, TextField } from '@mui/material';
import { Mic, Paperclip, X } from 'lucide-react';
import { useMicRecording } from '../../lib/hooks/useMicRecording';
import type { Outlet } from '../../lib/types/outlet';
import type { User } from '../../lib/types/manager';
import type { Task, TaskCategory, TaskPriority } from '../../lib/types/task';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DateWheelPicker } from '../common/DateWheelPicker';

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high'];

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

function filterManagersForOutlet(outlet: Outlet | undefined, allManagers: User[]): User[] {
  if (!outlet) return [];
  return allManagers.filter((m) => {
    const mid = m._id ?? m.id ?? '';
    if (!mid) return false;
    if (outlet.managerIds?.includes(mid)) return true;
    if (outlet.managerId === mid) return true;
    const uo = m.outletId ?? [];
    return uo.includes(outlet.id) || uo.includes(outlet.outletId);
  });
}

export type TaskFormState = {
  description: string;
  priority: TaskPriority;
  dueDate: Dayjs | null;
  /** '' = not selected yet, 'all' = all outlets, else outlet id */
  outletId: '' | 'all' | string;
  category: TaskCategory | '';
  assigneeIds: string[];
  /** Uploaded to Cloudinary only when user clicks Assign Task */
  adminAudioFiles: File[];
};

type TaskFormModalProps = {
  open: boolean;
  onClose: () => void;
  editing: Task | null;
  form: TaskFormState;
  setForm: Dispatch<SetStateAction<TaskFormState>>;
  onSubmit: () => void;
  isSubmitting?: boolean;
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
  isSubmitting,
  outlets,
  managers,
}: TaskFormModalProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);

  const mic = useMicRecording({
    fileNamePrefix: 'task-admin-audio',
    onRecordingComplete: (file) =>
      setForm((prev) => ({
        ...prev,
        adminAudioFiles: [...prev.adminAudioFiles, file],
      })),
  });

  const outletSelectValue = form.outletId === '' ? '' : form.outletId;

  const assigneesDisabled = !editing && (form.outletId === '' || form.outletId === 'all');

  const assigneeOptions = useMemo(() => {
    const outletId =
      editing?.outletId ?? (form.outletId !== '' && form.outletId !== 'all' ? form.outletId : null);
    if (!outletId) return [];

    const outlet =
      outlets.find((o) => o.id === outletId) ?? outlets.find((o) => o.outletId === outletId);
    if (outlet) return filterManagersForOutlet(outlet, managers);

    return managers.filter((m) => (m.outletId ?? []).includes(outletId));
  }, [editing?.outletId, form.outletId, outlets, managers]);

  const addAudioFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const incoming: File[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (file) incoming.push(file);
    }
    if (!incoming.length) return;
    setForm((prev) => ({
      ...prev,
      adminAudioFiles: [...prev.adminAudioFiles, ...incoming],
    }));
  };

  const removeAudioFile = (index: number) => {
    setForm((prev) => ({
      ...prev,
      adminAudioFiles: prev.adminAudioFiles.filter((_, i) => i !== index),
    }));
  };

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
                className='flex min-h-10 items-center rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800'
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
                    setForm({ ...form, outletId: '', assigneeIds: [] });
                  } else if (v === 'all') {
                    setForm({ ...form, outletId: 'all', assigneeIds: [] });
                  } else {
                    const o = outlets.find((x) => x.id === v);
                    const allowed = new Set(
                      filterManagersForOutlet(o, managers)
                        .map((m) => m._id ?? m.id ?? '')
                        .filter(Boolean),
                    );
                    setForm({
                      ...form,
                      outletId: v,
                      assigneeIds: form.assigneeIds.filter((id) => allowed.has(id)),
                    });
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
          <label className={fieldLabelClass}>Admin audio</label>
          <input
            ref={audioInputRef}
            type='file'
            accept='audio/*'
            multiple
            className='hidden'
            onChange={(e) => {
              addAudioFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className='rounded-xl border border-slate-200 bg-white p-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <button
                type='button'
                onClick={mic.toggleRecording}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  mic.isRecording
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Mic size={16} aria-hidden />
                {mic.isRecording ? 'Stop recording' : 'Record audio'}
              </button>
              <button
                type='button'
                onClick={() => audioInputRef.current?.click()}
                className='inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100'
              >
                <Paperclip size={16} aria-hidden />
                Import audio
              </button>
            </div>
            {form.adminAudioFiles.length > 0 ? (
              <div className='mt-3 flex flex-wrap gap-2'>
                {form.adminAudioFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${file.size}-${idx}`}
                    className='inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700'
                  >
                    <span className='truncate' title={file.name}>
                      {file.name}
                    </span>
                    <button
                      type='button'
                      onClick={() => removeAudioFile(idx)}
                      className='rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={12} aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className='mt-3 text-xs text-slate-500'>
                Record or import audio files. They will be uploaded when you click Assign Task.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={fieldLabelClass} htmlFor='task-assignees'>
            Assignees
          </label>
          <Autocomplete
            multiple
            id='task-assignees'
            disabled={assigneesDisabled}
            options={assigneeOptions}
            value={assigneeOptions.filter((m) => form.assigneeIds.includes(m._id ?? m.id ?? ''))}
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
                placeholder={assigneesDisabled ? 'Select an outlet first' : 'Select managers'}
                sx={{
                  ...muiFieldSx,
                  '& .MuiOutlinedInput-root': {
                    ...muiFieldSx['& .MuiOutlinedInput-root'],
                    bgcolor: assigneesDisabled ? '#F3F4F6' : '#F9FAFB',
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
          <Button variant='ghost' onClick={onClose} disabled={!!isSubmitting}>
            Cancel
          </Button>
          <Button variant='admin-primary' onClick={onSubmit} disabled={!!isSubmitting}>
            {isSubmitting ? 'Please wait...' : editing ? 'Update Task' : 'Assign Task'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
