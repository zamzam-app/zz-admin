import { useMemo, useState } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { ArrowLeft, CheckCircle2, Image as ImageIcon, Mic, Send, Video } from 'lucide-react';
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

  const handleSendNote = () => {
    if (!note.trim()) {
      message.warning('Add a note before sending.');
      return;
    }
    message.success('Note recorded locally. Sync with your team as needed.');
    setNote('');
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

              {task.status !== 'completed' && (
                <button
                  type='button'
                  disabled={completeMutation.isPending}
                  onClick={() => completeMutation.mutate(task.id)}
                  className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D6A2E] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#256025] disabled:opacity-50'
                >
                  <span className='flex h-7 w-7 items-center justify-center rounded-full bg-white/20'>
                    <CheckCircle2 size={18} className='text-white' aria-hidden />
                  </span>
                  Mark Complete
                </button>
              )}
            </div>
          </div>

          <section className='mt-10 rounded-xl border border-slate-200/90 bg-slate-100/80 p-6 shadow-sm'>
            <h2 className='text-lg font-bold text-slate-900'>Notes &amp; Attachments</h2>
            <p className='mt-1 text-sm text-slate-500'>
              Provide delivery notes and required documentation
            </p>

            <div className='mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Type your delivery notes here...'
                rows={6}
                className='w-full resize-none border-0 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0'
              />
              <div className='flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2.5'>
                <button
                  type='button'
                  className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700'
                  aria-label='Attach image'
                >
                  <ImageIcon size={20} aria-hidden />
                </button>
                <button
                  type='button'
                  className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700'
                  aria-label='Voice note'
                >
                  <Mic size={20} aria-hidden />
                </button>
                <button
                  type='button'
                  className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700'
                  aria-label='Attach video'
                >
                  <Video size={20} aria-hidden />
                </button>
                <button
                  type='button'
                  onClick={handleSendNote}
                  className='ml-1 inline-flex items-center gap-1.5 rounded-xl bg-[#705E0C] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#5c4d0a]'
                >
                  <Send size={14} className='shrink-0' aria-hidden />
                  Send
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
