import { useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { ArrowLeft, ChevronRight, Image as ImageIcon, Mic, Video, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { useApiMutation, useApiQuery } from '../../lib/react-query/use-api-hooks';
import { TASK_KEYS, type Task, type TaskStatus } from '../../lib/types/task';
import { OUTLET_KEYS } from '../../lib/types/outlet';
import LoadingSpinner from '../common/LoadingSpinner';

const STATUS_BADGE: Record<TaskStatus, { label: string; className: string }> = {
  open: {
    label: 'ASSIGNED',
    className: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100',
  },
  in_progress: {
    label: 'IN PROGRESS',
    className: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-100',
  },
  completed: {
    label: 'COMPLETED',
    className: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100',
  },
};

function formatCategoryLabel(category: string | undefined) {
  if (!category) return '';
  const lower = category.toLowerCase();
  if (['hygiene', 'maintenance', 'inventory', 'staffing'].includes(lower)) {
    return lower.toUpperCase();
  }
  return category.toUpperCase();
}

function formatDeadlineLine(dueDate: string) {
  const d = dayjs(dueDate);
  const now = dayjs();
  let datePart: string;
  if (d.isSame(now, 'day')) datePart = 'Today';
  else if (d.isSame(now.add(1, 'day'), 'day')) datePart = 'Tomorrow';
  else datePart = d.format('MMM D, YYYY');
  return `${datePart}, ${d.format('hh:mm A')}`;
}

function deadlineHint(dueDate: string) {
  const d = dayjs(dueDate);
  const now = dayjs();
  if (d.isBefore(now)) return 'This deadline has passed';
  if (d.isSame(now, 'day')) return 'Delivery window closing soon';
  return 'Plan delivery before the deadline';
}

type AttachmentKind = 'image' | 'video' | 'audio';

type PendingAttachment = {
  id: string;
  file: File;
  kind: AttachmentKind;
};

const KIND_LABEL: Record<AttachmentKind, string> = {
  image: 'IMAGE',
  video: 'VIDEO',
  audio: 'AUDIO',
};

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: PendingAttachment;
  onRemove: () => void;
}) {
  const Icon = attachment.kind === 'image' ? ImageIcon : attachment.kind === 'video' ? Video : Mic;
  return (
    <div className='flex max-w-[220px] min-w-0 items-center gap-2 rounded-lg bg-slate-100 py-1.5 pl-1.5 pr-1 ring-1 ring-slate-200/90'>
      <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-500 text-white'>
        <Icon size={18} className='text-white' aria-hidden />
      </div>
      <div className='min-w-0 flex-1 py-0.5'>
        <p className='truncate text-sm font-bold text-slate-800' title={attachment.file.name}>
          {attachment.file.name}
        </p>
        <p className='text-[10px] font-semibold uppercase tracking-wide text-slate-500'>
          {KIND_LABEL[attachment.kind]}
        </p>
      </div>
      <button
        type='button'
        onClick={onRemove}
        className='shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-700'
        aria-label={`Remove ${attachment.file.name}`}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}

export default function OutletTaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? 'staff';
  const userId = user?.id ?? user?._id ?? '';

  const listQueryKey: unknown[] = ['tasks', 'outlet-tasks', userId, 'all'];

  const { data: tasks = [], isLoading } = useApiQuery(
    listQueryKey,
    () =>
      import('../../lib/services/api/task.api').then((m) =>
        m.tasksApi.findAll(
          m.buildTaskListQuery({
            role,
            userId,
            filterOutletId: 'all',
            filterStatus: 'all',
          }),
        ),
      ),
    { enabled: !!userId && !!taskId },
  );

  const { data: outlets = [] } = useApiQuery(OUTLET_KEYS, () =>
    import('../../lib/services/api/outlet.api').then((mod) => mod.outletApi.getOutletsList()),
  );

  const assignedOutletIds = useMemo(() => {
    if (!user) return null;
    if (Array.isArray(user.outletId) && user.outletId.length > 0) return user.outletId;
    if (!userId) return [];
    return outlets
      .filter((outlet) => outlet.managerIds?.includes(userId) || outlet.managerId === userId)
      .map((outlet) => outlet.id);
  }, [outlets, user, userId]);

  const boardTasks = useMemo(() => {
    if (!assignedOutletIds || assignedOutletIds.length === 0) return tasks;
    return tasks.filter((t) => !t.outletId || assignedOutletIds.includes(t.outletId));
  }, [tasks, assignedOutletIds]);

  const task = useMemo(() => boardTasks.find((t) => t.id === taskId), [boardTasks, taskId]);

  const [note, setNote] = useState('');

  const completeMutation = useApiMutation(
    (id: string) => import('../../lib/services/api/task.api').then((m) => m.tasksApi.complete(id)),
    [TASK_KEYS, listQueryKey],
    {
      onSuccess: () => {
        message.success('Task marked as completed.');
        navigate('/outlet-tasks');
      },
      onError: (e) =>
        void import('../../lib/services/api/task.api').then((m) =>
          message.error(m.getTaskApiErrorMessage(e)),
        ),
    },
  );

  if (!taskId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[40vh] items-center justify-center -mx-6 -mb-6'>
        <LoadingSpinner />
      </div>
    );
  }

  if (!task) {
    return (
      <div className='flex min-h-0 flex-col gap-6 -mx-6 -mb-6 bg-[#F8F9FA] px-6 pb-8 lg:px-8'>
        <div className='rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm'>
          <p className='text-slate-700 font-semibold'>Task not found</p>
          <p className='mt-1 text-sm text-slate-500'>
            It may have been removed or you may not have access.
          </p>
          <Link
            to='/outlet-tasks'
            className='mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#705E0C] hover:underline'
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <OutletTaskDetailContent
      task={task}
      note={note}
      setNote={setNote}
      completeMutation={completeMutation}
    />
  );
}

function OutletTaskDetailContent({
  task,
  note,
  setNote,
  completeMutation,
}: {
  task: Task;
  note: string;
  setNote: (v: string) => void;
  completeMutation: ReturnType<typeof useApiMutation<Task, string>>;
}) {
  const badge = STATUS_BADGE[task.status];
  const headlineName = task.outletName?.trim() || task.title;
  const categoryLabel = formatCategoryLabel(task.category);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);

  const addAttachments = (files: FileList | null, kind: AttachmentKind) => {
    if (!files?.length) return;
    const next: PendingAttachment[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (file) next.push({ id: `${Date.now()}-${i}-${file.name}`, file, kind });
    }
    if (next.length) setAttachments((prev) => [...prev, ...next]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCompleteTask = () => {
    if (task.status === 'completed') return;
    // Upload + task update API will run here later; completion only for now.
    completeMutation.mutate(task.id);
  };

  return (
    <div className='flex min-h-0 flex-col gap-6 -mx-6 -mb-6 bg-[#F8F9FA]'>
      <div className='shrink-0 border-b border-slate-200/70 bg-[#F8F9FA] px-6 py-5 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='flex flex-wrap items-center gap-2 text-sm'>
            <Link
              to='/outlet-tasks'
              className='inline-flex items-center gap-1.5 font-medium text-slate-500 transition-colors hover:text-slate-700'
            >
              <ArrowLeft size={16} aria-hidden />
              Back to Tasks
            </Link>
            <span className='hidden h-4 w-px bg-slate-300 sm:block' aria-hidden />
            <span className='font-semibold tracking-tight text-[#8B6914]'>Task Details</span>
          </div>
        </div>
      </div>

      <div className='overflow-y-auto overflow-x-hidden px-6 pb-10 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
            <div className='min-w-0 flex-1 space-y-4'>
              <div className='flex flex-wrap items-center gap-2'>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${badge.className}`}
                >
                  {badge.label}
                </span>
                {categoryLabel ? (
                  <span className='inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-600 ring-1 ring-inset ring-slate-200/80'>
                    {categoryLabel}
                  </span>
                ) : null}
              </div>

              <h1 className='text-2xl font-bold tracking-tight text-black sm:text-3xl'>
                {headlineName}
              </h1>
              <p className='max-w-2xl text-base leading-relaxed text-slate-600'>
                {task.description}
              </p>
            </div>

            <div className='flex w-full shrink-0 flex-col gap-3 sm:max-w-[280px] lg:items-stretch'>
              <div className='rounded-xl bg-[#F5F0E6] px-5 py-4 shadow-sm ring-1 ring-[#E8DFD0]'>
                <p className='text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C4A2A]'>
                  Deadline
                </p>
                <p className='mt-1 text-lg font-bold text-[#3D2F1A]'>
                  {formatDeadlineLine(task.dueDate)}
                </p>
                <p className='mt-2 text-xs text-[#6B5A40]'>{deadlineHint(task.dueDate)}</p>
              </div>
            </div>
          </div>

          <section className='mt-10 rounded-xl border border-slate-200/90 bg-slate-100/80 p-6 shadow-sm'>
            <h2 className='text-lg font-bold text-slate-900'>Notes &amp; Attachments</h2>
            <p className='mt-1 text-sm text-slate-500'>
              Provide delivery notes and required documentation
            </p>

            <div className='mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
              <input
                ref={imageInputRef}
                type='file'
                accept='image/*'
                multiple
                className='hidden'
                onChange={(e) => {
                  addAttachments(e.target.files, 'image');
                  e.target.value = '';
                }}
              />
              <input
                ref={audioInputRef}
                type='file'
                accept='audio/*'
                multiple
                className='hidden'
                onChange={(e) => {
                  addAttachments(e.target.files, 'audio');
                  e.target.value = '';
                }}
              />
              <input
                ref={videoInputRef}
                type='file'
                accept='video/*'
                multiple
                className='hidden'
                onChange={(e) => {
                  addAttachments(e.target.files, 'video');
                  e.target.value = '';
                }}
              />

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Type your delivery notes here...'
                rows={6}
                disabled={task.status === 'completed'}
                className='w-full resize-none border-0 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'
              />

              <div className='flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
                <div className='flex min-h-[44px] min-w-0 flex-1 flex-wrap items-center gap-2'>
                  {attachments.map((a) => (
                    <AttachmentChip
                      key={a.id}
                      attachment={a}
                      onRemove={() => removeAttachment(a.id)}
                    />
                  ))}
                </div>

                <div className='flex shrink-0 items-center justify-end gap-2'>
                  <button
                    type='button'
                    disabled={task.status === 'completed'}
                    onClick={() => imageInputRef.current?.click()}
                    className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-40'
                    aria-label='Attach image'
                  >
                    <ImageIcon size={20} aria-hidden />
                  </button>
                  <button
                    type='button'
                    disabled={task.status === 'completed'}
                    onClick={() => audioInputRef.current?.click()}
                    className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-40'
                    aria-label='Attach audio'
                  >
                    <Mic size={20} aria-hidden />
                  </button>
                  <button
                    type='button'
                    disabled={task.status === 'completed'}
                    onClick={() => videoInputRef.current?.click()}
                    className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-40'
                    aria-label='Attach video'
                  >
                    <Video size={20} aria-hidden />
                  </button>
                  {task.status !== 'completed' && (
                    <button
                      type='button'
                      disabled={completeMutation.isPending}
                      onClick={handleCompleteTask}
                      className='ml-1 inline-flex items-center gap-1.5 rounded-xl bg-[#705E0C] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#5c4d0a] disabled:opacity-50'
                    >
                      Complete task
                      <ChevronRight size={16} className='shrink-0' aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
