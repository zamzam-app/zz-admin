import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/context/AuthContext';
import { useApiQuery } from '../lib/react-query/use-api-hooks';
import { TaskCard } from '../components/tasks/TaskCard';
import { OUTLET_KEYS } from '../lib/types/outlet';

export default function OutletTasks() {
  const navigate = useNavigate();
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
            <TaskCard
              key={task.id}
              task={task}
              onOpen={() => navigate(`/outlet-tasks/${task.id}`)}
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
