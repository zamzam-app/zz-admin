import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Autocomplete, MenuItem, Select as MuiSelect, TextField } from '@mui/material';
import { FileText, Image as ImageIcon, Mic, Paperclip, Video, X } from 'lucide-react';
import { useMicRecording } from '../../lib/hooks/useMicRecording';
import type { Outlet } from '../../lib/types/outlet';
import type { User } from '../../lib/types/manager';
import type { Task, TaskPriority } from '../../lib/types/task';
import { useApiQuery } from '../../lib/react-query/use-api-hooks';
import { taskCategoryApi } from '../../lib/services/api/task-category.api';
import { TASK_CATEGORY_KEYS } from '../../lib/types/task-category';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DateWheelPicker } from '../common/DateWheelPicker';
import { AttachmentPreviewModal } from '../OutletTask/AttachmentPreviewModal';
import type { AttachmentKind } from '../OutletTask/outletTaskAttachment.types';
import { WhatsAppAudioPlayer } from '../common/WhatsAppAudioPlayer';

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high'];

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
  taskCategoryId: string;
  assigneeIds: string[];
  /** Uploaded to Cloudinary only when user clicks Assign Task */
  adminAudioFiles: File[];
  imageFiles: File[];
  videoFiles: File[];
  otherFiles: File[];
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

type FormAttachmentSection = 'videos' | 'images' | 'voices' | 'files';

type PendingFormAttachment = {
  id: string;
  name: string;
  kind: AttachmentKind;
  file: File;
  section: FormAttachmentSection;
};

type AttachmentPreviewState = {
  name: string;
  kind: AttachmentKind;
  sourceUrl: string;
};

type PendingAudioAttachmentRowProps = {
  item: PendingFormAttachment;
  onRemove: () => void;
};

function inferAttachmentKind(file: File): AttachmentKind {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'pdf';
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword' ||
    /\.(doc|docx)$/i.test(file.name)
  ) {
    return 'doc';
  }
  return 'file';
}

function getAttachmentSection(kind: AttachmentKind): FormAttachmentSection {
  if (kind === 'video') return 'videos';
  if (kind === 'image') return 'images';
  if (kind === 'audio') return 'voices';
  return 'files';
}

function getAttachmentButtonIcon(kind: AttachmentKind) {
  if (kind === 'image') return ImageIcon;
  if (kind === 'video') return Video;
  if (kind === 'audio') return Mic;
  return FileText;
}

function PendingAudioAttachmentRow({ item, onRemove }: PendingAudioAttachmentRowProps) {
  const sourceUrl = useMemo(() => URL.createObjectURL(item.file), [item.file]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  return (
    <div className='flex items-start gap-2'>
      <div className='min-w-0 flex-1'>
        <p className='mb-1 truncate text-sm font-medium text-slate-900'>{item.name}</p>
        <WhatsAppAudioPlayer src={sourceUrl} className='w-full' fitContainer />
      </div>
      <button
        type='button'
        onClick={onRemove}
        className='mt-7 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-slate-600'
        aria-label={`Remove ${item.name}`}
      >
        <X size={14} />
      </button>
    </div>
  );
}

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
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const { data: taskCategoriesResponse } = useApiQuery(
    TASK_CATEGORY_KEYS,
    () => taskCategoryApi.getTaskCategories({ page: 1, limit: 100 }),
    { enabled: open },
  );

  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentPreviewState | null>(null);

  const mic = useMicRecording({
    fileNamePrefix: 'task-admin-audio',
    onRecordingComplete: (file) =>
      setForm((prev) => ({
        ...prev,
        adminAudioFiles: [...prev.adminAudioFiles, file],
      })),
  });

  const outletSelectValue = form.outletId === '' || form.outletId === 'all' ? '' : form.outletId;

  const assigneesDisabled = false;

  const assigneeOptions = useMemo(() => {
    const outletId = editing?.outletId ?? (form.outletId !== '' ? form.outletId : null);
    if (!outletId) return managers;

    const outlet =
      outlets.find((o) => o.id === outletId) ?? outlets.find((o) => o.outletId === outletId);
    if (outlet) return filterManagersForOutlet(outlet, managers);

    return managers.filter((m) => (m.outletId ?? []).includes(outletId));
  }, [editing?.outletId, form.outletId, outlets, managers]);

  const categoryOptions = useMemo(
    () =>
      (taskCategoriesResponse?.data ?? [])
        .filter((category) => Boolean(category.name?.trim()))
        .map((category) => ({
          id: category._id,
          value: category.name.trim(),
        })),
    [taskCategoriesResponse?.data],
  );

  const selectedCategory = categoryOptions.find((category) => category.id === form.taskCategoryId);
  const selectedCategoryMissing = Boolean(form.taskCategoryId) && !selectedCategory;

  const removeFile = (index: number, type: 'image' | 'video' | 'audio' | 'other') => {
    setForm((prev) => {
      if (type === 'image')
        return { ...prev, imageFiles: prev.imageFiles.filter((_, i) => i !== index) };
      if (type === 'video')
        return { ...prev, videoFiles: prev.videoFiles.filter((_, i) => i !== index) };
      if (type === 'audio')
        return { ...prev, adminAudioFiles: prev.adminAudioFiles.filter((_, i) => i !== index) };
      return { ...prev, otherFiles: prev.otherFiles.filter((_, i) => i !== index) };
    });
  };

  const openAttachmentPreview = (item: PendingFormAttachment) => {
    if (item.kind === 'audio') return;
    const sourceUrl = URL.createObjectURL(item.file);
    setSelectedAttachment({
      name: item.name,
      kind: item.kind,
      sourceUrl,
    });
  };

  const closeAttachmentPreview = () => setSelectedAttachment(null);

  useEffect(() => {
    if (!selectedAttachment?.sourceUrl) return;
    return () => {
      URL.revokeObjectURL(selectedAttachment.sourceUrl);
    };
  }, [selectedAttachment]);

  const groupedAttachments = useMemo(() => {
    const items: PendingFormAttachment[] = [
      ...form.videoFiles.map((file, index) => ({
        id: `video-${index}-${file.name}-${file.size}`,
        name: file.name,
        kind: 'video' as const,
        file,
        section: 'videos' as const,
      })),
      ...form.imageFiles.map((file, index) => ({
        id: `image-${index}-${file.name}-${file.size}`,
        name: file.name,
        kind: 'image' as const,
        file,
        section: 'images' as const,
      })),
      ...form.adminAudioFiles.map((file, index) => ({
        id: `voice-${index}-${file.name}-${file.size}`,
        name: file.name,
        kind: 'audio' as const,
        file,
        section: 'voices' as const,
      })),
      ...form.otherFiles.map((file, index) => ({
        id: `file-${index}-${file.name}-${file.size}`,
        name: file.name,
        kind: inferAttachmentKind(file),
        file,
        section: getAttachmentSection(inferAttachmentKind(file)),
      })),
    ];

    return {
      videos: items.filter((item) => item.section === 'videos'),
      images: items.filter((item) => item.section === 'images'),
      voices: items.filter((item) => item.section === 'voices'),
      files: items.filter((item) => item.section === 'files'),
    };
  }, [form.adminAudioFiles, form.imageFiles, form.otherFiles, form.videoFiles]);

  const totalAttachmentCount =
    groupedAttachments.videos.length +
    groupedAttachments.images.length +
    groupedAttachments.voices.length +
    groupedAttachments.files.length;

  const handleAttachmentImport = (files: FileList | null) => {
    if (!files?.length) return;

    const images: File[] = [];
    const videos: File[] = [];
    const others: File[] = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (!file) continue;

      const kind = inferAttachmentKind(file);
      if (kind === 'image') {
        images.push(file);
        continue;
      }
      if (kind === 'video') {
        videos.push(file);
        continue;
      }
      others.push(file);
    }

    setForm((prev) => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...images],
      videoFiles: [...prev.videoFiles, ...videos],
      otherFiles: [...prev.otherFiles, ...others],
    }));
  };

  const attachmentSections: Array<{
    key: FormAttachmentSection;
    title: string;
    items: PendingFormAttachment[];
  }> = [
    { key: 'videos', title: 'Videos', items: groupedAttachments.videos },
    { key: 'images', title: 'Images', items: groupedAttachments.images },
    { key: 'voices', title: 'Voices', items: groupedAttachments.voices },
    { key: 'files', title: 'Files', items: groupedAttachments.files },
  ];
  const visibleAttachmentSections = attachmentSections.filter(
    (section) => section.items.length > 0,
  );

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
                  } else {
                    setForm({
                      ...form,
                      outletId: v,
                      assigneeIds: [],
                    });
                  }
                }}
                size='small'
                displayEmpty
                renderValue={(selected) => {
                  if (selected === '' || selected === undefined) {
                    return <span className='text-slate-400'>Choose outlet...</span>;
                  }
                  const o = outlets.find((x) => x.id === selected);
                  return o?.name ?? selected;
                }}
                sx={{ borderRadius: 3, bgcolor: 'white' }}
              >
                <MenuItem value='' disabled>
                  Choose outlet...
                </MenuItem>
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
            {categoryOptions.map(({ id, value }) => {
              const selected = id === form.taskCategoryId;
              return (
                <button
                  key={id}
                  type='button'
                  onClick={() => setForm({ ...form, taskCategoryId: id })}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                    selected
                      ? 'border-[#D4AF37] bg-[#FFFBF5] text-[#0F172A]'
                      : 'border-slate-200 bg-white text-[#0F172A] hover:border-slate-300'
                  }`}
                >
                  {value}
                </button>
              );
            })}
            {selectedCategoryMissing && (
              <button
                type='button'
                onClick={() => setForm({ ...form, taskCategoryId: '' })}
                className='rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 transition-colors hover:border-amber-400'
              >
                Unavailable category
              </button>
            )}
          </div>
          {categoryOptions.length === 0 && (
            <p className='mt-2 text-xs text-slate-500'>No task categories available.</p>
          )}
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
          <label className={fieldLabelClass}>Attachments</label>
          <div className='rounded-3xl border border-slate-200 bg-white p-4 sm:p-5'>
            <input
              ref={attachmentInputRef}
              type='file'
              accept='image/*,video/*,.pdf,.doc,.docx'
              multiple
              className='hidden'
              onChange={(e) => {
                handleAttachmentImport(e.target.files);
                e.target.value = '';
              }}
            />

            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='text-sm font-semibold text-slate-900'>Media attachments</p>
                <p className='mt-1 text-sm text-slate-500'>
                  Upload images, videos, PDFs, and Word documents or record voice notes.
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => attachmentInputRef.current?.click()}
                  className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100'
                  aria-label='Upload attachments'
                >
                  <Paperclip size={16} />
                </button>
                <button
                  type='button'
                  onClick={mic.toggleRecording}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                    mic.isRecording
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                  aria-label={mic.isRecording ? 'Stop recording' : 'Start recording'}
                >
                  <Mic size={16} />
                </button>
              </div>
            </div>

            {totalAttachmentCount === 0 ? (
              <div className='mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500'>
                Add attachments with the paper clip or record a voice note with the microphone.
              </div>
            ) : (
              <div className='mt-5 space-y-4'>
                {visibleAttachmentSections.map((section) => (
                  <div key={section.key}>
                    <h4 className='text-xs font-bold uppercase tracking-[0.18em] text-slate-500'>
                      {section.title}
                    </h4>
                    {section.key === 'voices' ? (
                      <div className='mt-2 space-y-3'>
                        {section.items.map((item, index) => (
                          <PendingAudioAttachmentRow
                            key={item.id}
                            item={item}
                            onRemove={() => removeFile(index, 'audio')}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className='mt-2 space-y-2'>
                        {section.items.map((item, index) => {
                          const Icon = getAttachmentButtonIcon(item.kind);
                          return (
                            <div
                              key={item.id}
                              className='flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'
                            >
                              <button
                                type='button'
                                onClick={() => openAttachmentPreview(item)}
                                className='flex min-w-0 flex-1 items-center gap-3 text-left'
                              >
                                <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600'>
                                  <Icon size={16} />
                                </span>
                                <span className='min-w-0'>
                                  <span className='block truncate text-sm font-medium text-slate-900'>
                                    {item.name}
                                  </span>
                                  <span className='block text-xs text-slate-500'>
                                    {section.title.slice(0, -1)} {index + 1}
                                  </span>
                                </span>
                              </button>
                              <button
                                type='button'
                                onClick={() => {
                                  if (section.key === 'images') removeFile(index, 'image');
                                  else if (section.key === 'videos') removeFile(index, 'video');
                                  else removeFile(index, 'other');

                                  if (selectedAttachment?.name === item.name)
                                    closeAttachmentPreview();
                                }}
                                className='inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-slate-600'
                                aria-label={`Remove ${item.name}`}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
          <Button variant='ghost' onClick={onClose} disabled={!!isSubmitting}>
            Cancel
          </Button>
          <Button variant='admin-primary' onClick={onSubmit} disabled={!!isSubmitting}>
            {isSubmitting ? 'Please wait...' : editing ? 'Update Task' : 'Assign Task'}
          </Button>
        </div>
      </div>

      <AttachmentPreviewModal
        title={selectedAttachment?.name ?? ''}
        open={!!selectedAttachment}
        onClose={closeAttachmentPreview}
        kind={selectedAttachment?.kind ?? 'file'}
        sourceUrl={selectedAttachment?.sourceUrl ?? null}
      />
    </Modal>
  );
}
