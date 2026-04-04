import { useMemo, useState } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/context/AuthContext';
import { useApiMutation, useApiQuery } from '../lib/react-query/use-api-hooks';
import { TASK_KEYS, type Task, type TaskStatus } from '../lib/types/task';
import { OUTLET_KEYS } from '../lib/types/outlet';

const STATUS_BADGE: Record<TaskStatus, { label: string; className: string }> = {
  open: {
    label: 'Assigned',
    className: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100',
  },
  in_progress: {
    label: 'In progress',
    className: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-100',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100',
  },
};

function formatCategoryLabel(category: string | undefined) {
  if (!category) return '';
  const lower = category.toLowerCase();
  if (['hygiene', 'maintenance', 'inventory', 'staffing'].includes(lower)) {
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return category;
}

export default function OutletTasks() {
  const { user } = useAuth();
  const role = user?.role ?? 'staff';
  const userId = user?.id ?? user?._id ?? '';

  const [filterStatus, setFilterStatus] = useState<string>('all');

  const listQueryKey: unknown[] = ['tasks', 'outlet-tasks', userId, filterStatus];

  const { data: tasks = [] } = useApiQuery(
    listQueryKey,
    () =>
      import('../lib/services/api/task.api').then((m) =>
        m.tasksApi.findAll(
          m.buildTaskListQuery({
            role,
            userId,
            filterOutletId: 'all',
            filterStatus,
          }),
        ),
      ),
    { enabled: !!userId },
  );

  const { data: outlets = [] } = useApiQuery(OUTLET_KEYS, () =>
    import('../lib/services/api/outlet.api').then((mod) => mod.outletApi.getOutletsList()),
  );

  const assignedOutletIds = useMemo(() => {
    if (!user) return null;
    if (Array.isArray(user.outletId) && user.outletId.length > 0) return user.outletId;
    if (!userId) return [];
    return outlets
      .filter((outlet) => outlet.managerIds?.includes(userId) || outlet.managerId === userId)
      .map((outlet) => outlet.id);
  }, [outlets, user, userId]);

  /** Same as Tasks.tsx: API scopes by assignee for non-admins; narrow by managed outlets when set */
  const boardTasks = useMemo(() => {
    if (!assignedOutletIds || assignedOutletIds.length === 0) return tasks;
    return tasks.filter((t) => !t.outletId || assignedOutletIds.includes(t.outletId));
  }, [tasks, assignedOutletIds]);

  const completeMutation = useApiMutation(
    (id: string) => import('../lib/services/api/task.api').then((m) => m.tasksApi.complete(id)),
    [TASK_KEYS, [...listQueryKey]],
    {
      onSuccess: () => message.success('Task marked as completed.'),
      onError: (e) =>
        void import('../lib/services/api/task.api').then((m) =>
          message.error(m.getTaskApiErrorMessage(e)),
        ),
    },
  );

  const selectClass =
    'h-10 w-full max-w-[200px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400';

  return (
    <div className='flex min-h-0 flex-col gap-6 -mx-6 -mb-6'>
      <div className='shrink-0 border-b border-slate-200/70 bg-[#f9fafb] px-6 py-6 lg:px-8'>
        <div className='mx-auto max-w-2xl text-center'>
          <h1 className='text-2xl font-bold tracking-tight text-[#0F172A]'>My Tasks</h1>
          <p className='mt-1 text-sm text-slate-500'>Complete assigned tasks</p>
        </div>

        <div className='mx-auto mt-6 flex max-w-2xl justify-center'>
          <select
            className={selectClass}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label='Filter by status'
          >
            <option value='all'>All statuses</option>
            <option value='open'>Open</option>
            <option value='in_progress'>In progress</option>
            <option value='completed'>Completed</option>
          </select>
        </div>
      </div>

      <div className='overflow-y-auto overflow-x-hidden overscroll-contain bg-[#f9fafb] px-6 pb-8 [scrollbar-gutter:stable] lg:px-8'>
        <div className='mx-auto w-full max-w-2xl space-y-4'>
          {boardTasks.map((task) => (
            <MyTaskCard
              key={task.id}
              task={task}
              onComplete={
                task.status !== 'completed' ? () => completeMutation.mutate(task.id) : undefined
              }
              completing={completeMutation.isPending}
            />
          ))}
        </div>

        {boardTasks.length === 0 && (
          <div className='mx-auto max-w-2xl py-16 text-center text-slate-500'>
            <p className='text-lg font-medium text-slate-700'>No tasks found</p>
            <p className='mt-1 text-sm'>Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MyTaskCard({
  task,
  onComplete,
  completing,
}: {
  task: Task;
  onComplete?: () => void;
  completing?: boolean;
}) {
  const badge = STATUS_BADGE[task.status];
  const headlineName = task.outletName?.trim() || task.title;
  const categoryLabel = formatCategoryLabel(task.category);

  return (
    <article
      className='rounded-lg border border-slate-200/90 bg-white p-5 shadow-sm'
      aria-label={headlineName}
    >
      <div className='flex items-start justify-between gap-3'>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
        <time className='shrink-0 text-xs text-slate-400' dateTime={task.dueDate}>
          {dayjs(task.dueDate).format('YYYY-MM-DD')}
        </time>
      </div>

      <h2 className='mt-3 text-base font-bold leading-snug text-[#0F172A]'>{headlineName}</h2>

      {categoryLabel ? (
        <p className='mt-1.5 text-sm font-medium capitalize text-blue-600'>{categoryLabel}</p>
      ) : null}

      <p className='mt-2 text-sm leading-relaxed text-slate-600'>{task.description}</p>

      {onComplete && (
        <div className='mt-4 flex justify-end border-t border-slate-100 pt-4'>
          <button
            type='button'
            disabled={completing}
            onClick={onComplete}
            className='inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50'
          >
            <CheckCircle2 size={14} aria-hidden />
            Mark complete
          </button>
        </div>
      )}
    </article>
  );
}
