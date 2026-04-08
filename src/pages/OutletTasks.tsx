import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/context/AuthContext';
import { useApiQuery } from '../lib/react-query/use-api-hooks';
import { type TaskPriority } from '../lib/types/task';
import { TaskCard } from '../components/tasks/TaskCard';
import { OUTLET_KEYS } from '../lib/types/outlet';

export default function OutletTasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? 'staff';
  const userId = user?.id ?? user?._id ?? '';

  const listQueryKey: unknown[] = ['tasks', 'outlet-tasks', userId, 'all'];

  const { data: tasks = [] } = useApiQuery(
    listQueryKey,
    () =>
      import('../lib/services/api/task.api').then((m) =>
        m.tasksApi.findAll(
          m.buildTaskListQuery({
            role,
            userId,
            filterOutletId: 'all',
            filterStatus: 'all',
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

  const openTasks = useMemo(() => {
    const today = dayjs();
    const priorityRank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    const list = boardTasks.filter((task) => task.status !== 'completed');

    const withMeta = list.map((task) => {
      const isHigh = task.priority === 'high';
      const isDueToday = dayjs(task.dueDate).isSame(today, 'day');
      const group = isHigh ? 0 : isDueToday ? 1 : 2;
      return { task, group };
    });

    withMeta.sort((a, b) => {
      if (a.group !== b.group) return a.group - b.group;
      if (a.group === 0) {
        const byDue = dayjs(a.task.dueDate).valueOf() - dayjs(b.task.dueDate).valueOf();
        if (byDue !== 0) return byDue;
        return dayjs(b.task.createdAt).valueOf() - dayjs(a.task.createdAt).valueOf();
      }
      if (a.group === 1) {
        const byPriority = priorityRank[a.task.priority] - priorityRank[b.task.priority];
        if (byPriority !== 0) return byPriority;
        return dayjs(a.task.dueDate).valueOf() - dayjs(b.task.dueDate).valueOf();
      }
      const byDue = dayjs(a.task.dueDate).valueOf() - dayjs(b.task.dueDate).valueOf();
      if (byDue !== 0) return byDue;
      return dayjs(b.task.createdAt).valueOf() - dayjs(a.task.createdAt).valueOf();
    });

    return withMeta.map((entry) => entry.task);
  }, [boardTasks]);

  const completedTasks = useMemo(() => {
    const list = boardTasks.filter((task) => task.status === 'completed');
    return [...list].sort((a, b) => {
      const aCompletedAt = a.completedAt
        ? dayjs(a.completedAt).valueOf()
        : dayjs(a.updatedAt ?? a.createdAt).valueOf();
      const bCompletedAt = b.completedAt
        ? dayjs(b.completedAt).valueOf()
        : dayjs(b.updatedAt ?? b.createdAt).valueOf();
      return bCompletedAt - aCompletedAt;
    });
  }, [boardTasks]);

  const completedListScrollClass = 'max-h-[calc(100dvh-24rem)] sm:max-h-[calc(100dvh-21rem)]';

  return (
    <div className='flex min-h-0 flex-col gap-6 -mx-6 -mb-6'>
      <div className='shrink-0 bg-[#f9fafb] px-6 pt-6 pb-1 lg:px-8'>
        <div className='mx-auto w-full max-w-6xl'>
          <h1 className='text-2xl font-extrabold text-[#1F2937] sm:text-[2.125rem]'>My Tasks</h1>
          <p className='mt-1 text-sm text-slate-500'>Complete assigned tasks</p>
        </div>
      </div>

      <div className='space-y-5 bg-[#f9fafb] px-6 pb-8 lg:px-8'>
        <div className='mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h2 className='mb-3 text-base font-bold text-slate-900'>Open Tasks</h2>
          <div className='scrollbar-hide overflow-x-auto overflow-y-hidden pb-2 [scrollbar-gutter:stable]'>
            <div className='flex min-w-max gap-4'>
              {openTasks.map((task) => (
                <div key={task.id} className='w-[320px] shrink-0 md:w-85'>
                  <TaskCard task={task} onOpen={() => navigate(`/outlet-tasks/${task.id}`)} />
                </div>
              ))}
            </div>
          </div>
          {openTasks.length === 0 && (
            <div className='py-10 text-center text-slate-500'>
              <p className='text-sm font-medium'>No open tasks found</p>
            </div>
          )}
        </div>

        <div className='mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h2 className='mb-3 text-base font-bold text-slate-900'>Completed Tasks</h2>
          <div
            className={`scrollbar-hide overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable] ${completedListScrollClass}`}
          >
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onOpen={() => navigate(`/outlet-tasks/${task.id}`)}
                />
              ))}
            </div>
          </div>
          {completedTasks.length === 0 && (
            <div className='py-10 text-center text-slate-500'>
              <p className='text-sm font-medium'>No completed tasks found</p>
            </div>
          )}
        </div>

        {boardTasks.length === 0 && (
          <div className='mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm'>
            <p className='text-lg font-medium text-slate-700'>No tasks found</p>
            <p className='mt-1 text-sm'>Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
