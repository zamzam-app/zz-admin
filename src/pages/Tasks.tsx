import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import dayjs from 'dayjs';
import { Chip } from '@mui/material';
import { Clock3, Plus, Tags } from 'lucide-react';
import { useAuth } from '../lib/context/AuthContext';
import { useImageUpload } from '../lib/hooks/useImageUpload';
import { useApiQuery, useApiMutation } from '../lib/react-query/use-api-hooks';
import { usersApi } from '../lib/services/api/users.api';
import {
  TASK_KEYS,
  type CreateTaskPayload,
  type TaskPriority,
  type Task,
  type UpdateTaskPayload,
} from '../lib/types/task';
import { OUTLET_KEYS } from '../lib/types/outlet';
import { MANAGER_KEYS } from '../lib/types/manager';
import { Button } from '../components/common/Button';
import Card from '../components/common/Card';
import { TaskFormModal, type TaskFormState } from '../components/tasks/TaskFormModal';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskCategoriesModal } from '../components/tasks/TaskCategoriesModal';

const STATUS_BADGE: Record<'open' | 'completed', { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#1F2937', bg: '#F8FAFC' },
  completed: { label: 'Completed', color: '#065F46', bg: '#ECFDF3' },
};

function getStatusBadge(status: Task['status']) {
  return status === 'completed' ? STATUS_BADGE.completed : STATUS_BADGE.open;
}

const EMPTY_FORM: TaskFormState = {
  description: '',
  priority: 'medium',
  dueDate: dayjs(),
  outletId: '',
  taskCategoryId: '',
  assigneeIds: [],
  adminAudioFiles: [],
};

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? 'staff';
  const userId = user?.id ?? user?._id ?? '';
  const canDeleteTask = role.toLowerCase() === 'admin' || role.toLowerCase() === 'manager';

  const [filterOutletId, setFilterOutletId] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | TaskPriority>('all');

  const taskListQueryKey = [
    'tasks',
    'list',
    filterOutletId,
    filterStatus,
    filterPriority,
    role,
    userId,
  ] as const;

  const { data: tasks = [] } = useApiQuery(
    [...taskListQueryKey],
    () =>
      import('../lib/services/api/task.api').then((m) =>
        m.tasksApi.findAll(
          m.buildTaskListQuery({
            role,
            userId,
            filterOutletId,
            filterStatus,
            filterPriority,
          }),
        ),
      ),
    { enabled: role === 'admin' || !!userId },
  );
  const { data: managers = [] } = useApiQuery(MANAGER_KEYS, usersApi.getManagers);
  const { data: outlets = [] } = useApiQuery(OUTLET_KEYS, () =>
    import('../lib/services/api/outlet.api').then((m) => m.outletApi.getOutletsList()),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [taskCategoriesModalOpen, setTaskCategoriesModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);
  const {
    upload: uploadTaskMedia,
    loading: uploadTaskMediaLoading,
    clearError: clearUploadError,
  } = useImageUpload('tasks');

  const assignedOutletIds = useMemo(() => {
    if (!user || role === 'admin') return null;
    if (Array.isArray(user.outletId) && user.outletId.length > 0) return user.outletId;
    if (!userId) return [];
    return outlets
      .filter((outlet) => outlet.managerIds?.includes(userId) || outlet.managerId === userId)
      .map((outlet) => outlet.id);
  }, [outlets, role, user, userId]);

  /** GET /tasks already scopes by assignee for non-admins; narrow by managed outlets if needed */
  const boardTasks = useMemo(() => {
    if (role === 'admin') return tasks;
    if (!assignedOutletIds || assignedOutletIds.length === 0) return tasks;
    return tasks.filter((t) => !t.outletId || assignedOutletIds.includes(t.outletId));
  }, [tasks, role, assignedOutletIds]);

  const pendingTasks = useMemo(() => {
    if (role === 'admin' || !userId) return [];
    return boardTasks.filter((task) => task.status !== 'completed');
  }, [boardTasks, role, userId]);

  const openTasks = useMemo(() => {
    const today = dayjs();
    const priorityRank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    const tasks = boardTasks.filter((task) => task.status !== 'completed');

    const withMeta = tasks.map((task) => {
      const isHigh = task.priority === 'high';
      const isDueToday = dayjs(task.dueDate).isSame(today, 'day');
      const group = isHigh ? 0 : isDueToday ? 1 : 2;
      return { task, group, isDueToday };
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
    const tasks = boardTasks.filter((task) => task.status === 'completed');
    return [...tasks].sort((a, b) => {
      const aCompletedAt = a.completedAt
        ? dayjs(a.completedAt).valueOf()
        : dayjs(a.updatedAt ?? a.createdAt).valueOf();
      const bCompletedAt = b.completedAt
        ? dayjs(b.completedAt).valueOf()
        : dayjs(b.updatedAt ?? b.createdAt).valueOf();
      return bCompletedAt - aCompletedAt;
    });
  }, [boardTasks]);

  const outletsForFilter = useMemo(() => {
    if (role === 'admin') return outlets;
    const ids = new Set(assignedOutletIds ?? []);
    if (ids.size === 0) return outlets;
    return outlets.filter((o) => ids.has(o.id) || ids.has(o.outletId));
  }, [outlets, role, assignedOutletIds]);

  useEffect(() => {
    if (role === 'admin') return;
    if (!userId) return;
    const key = `zz_task_last_seen_${userId}`;
    localStorage.setItem(key, new Date().toISOString());
  }, [role, userId]);

  const createMutation = useApiMutation(
    (payload: CreateTaskPayload & { createdBy?: string }) =>
      import('../lib/services/api/task.api').then((m) => m.tasksApi.create(payload)),
    [TASK_KEYS, ['tasks', 'unread', userId]],
    {
      onSuccess: () => {
        message.success('Task assigned successfully.');
        setModalOpen(false);
        setEditing(null);
        setForm(EMPTY_FORM);
      },
      onError: (e) =>
        void import('../lib/services/api/task.api').then((m) =>
          message.error(m.getTaskApiErrorMessage(e)),
        ),
    },
  );

  const updateMutation = useApiMutation(
    (payload: { id: string; data: UpdateTaskPayload }) =>
      import('../lib/services/api/task.api').then((m) =>
        m.tasksApi.update(payload.id, payload.data),
      ),
    [TASK_KEYS, ['tasks', 'unread', userId]],
    {
      onSuccess: () => {
        message.success('Task updated successfully.');
        setModalOpen(false);
        setEditing(null);
        setForm(EMPTY_FORM);
      },
      onError: (e) =>
        void import('../lib/services/api/task.api').then((m) =>
          message.error(m.getTaskApiErrorMessage(e)),
        ),
    },
  );

  const deleteMutation = useApiMutation(
    (id: string) => import('../lib/services/api/task.api').then((m) => m.tasksApi.remove(id)),
    [TASK_KEYS, ['tasks', 'unread', userId]],
    {
      onSuccess: () => message.success('Task deleted.'),
      onError: (e) =>
        void import('../lib/services/api/task.api').then((m) =>
          message.error(m.getTaskApiErrorMessage(e)),
        ),
    },
  );

  const completeMutation = useApiMutation(
    (id: string) => import('../lib/services/api/task.api').then((m) => m.tasksApi.complete(id)),
    [TASK_KEYS, ['tasks', 'unread', userId]],
    {
      onSuccess: () => message.success('Task marked as completed.'),
      onError: (e) =>
        void import('../lib/services/api/task.api').then((m) =>
          message.error(m.getTaskApiErrorMessage(e)),
        ),
    },
  );

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditing(task);
    setForm({
      description: task.description,
      priority: task.priority,
      dueDate: dayjs(task.dueDate),
      outletId: task.outletId ? task.outletId : 'all',
      taskCategoryId: task.taskCategoryId ?? '',
      assigneeIds: task.assigneeIds,
      adminAudioFiles: [],
    });
    setModalOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    deleteMutation.mutate(task.id);
  };

  const handleCompleteTask = (task: Task) => {
    completeMutation.mutate(task.id);
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      message.error('Please add a description.');
      return;
    }
    if (!editing && (form.outletId === '' || form.outletId === 'all')) {
      message.error('Please select a specific outlet. Each task must be tied to one outlet.');
      return;
    }
    if (!form.taskCategoryId) {
      message.error('Please select a task category.');
      return;
    }
    const dueDate = form.dueDate?.toISOString();
    if (!dueDate) {
      message.error('Please select a due date.');
      return;
    }

    const selectedManagers = managers.filter((m) => form.assigneeIds.includes(m._id ?? m.id ?? ''));

    const assigneeIds = selectedManagers.map((m) => m._id ?? m.id ?? '').filter(Boolean);
    if (assigneeIds.length === 0) {
      message.error('Select at least one manager.');
      return;
    }

    const desc = form.description.trim();

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        data: {
          description: desc,
          priority: form.priority,
          dueDate,
          taskCategoryId: form.taskCategoryId,
          status: editing.status,
          assigneeIds,
        },
      });
      return;
    }

    let adminAudioUrl: string[] = [];
    if (form.adminAudioFiles.length > 0) {
      clearUploadError();
      try {
        adminAudioUrl = await Promise.all(
          form.adminAudioFiles.map((file) => uploadTaskMedia(file)),
        );
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : 'Failed to upload audio. Please try again.',
        );
        return;
      }
    }

    const outlet = outlets.find((o) => o.id === form.outletId || o.outletId === form.outletId);
    const titleFromDescription = desc.split('\n')[0].trim().slice(0, 120) || 'Task';
    const outletMongoId = outlet?.id ?? form.outletId;
    const payload = {
      title: titleFromDescription,
      description: desc,
      priority: form.priority,
      dueDate,
      taskCategoryId: form.taskCategoryId,
      outletId: outletMongoId,
      outletName: outlet?.name,
      status: 'open' as const,
      assigneeIds,
      assigneeNames: selectedManagers.map((m) => m.name).filter(Boolean),
      adminAudioUrl,
      createdBy: userId || undefined,
    };

    createMutation.mutate(payload);
  };

  const notifications = useMemo(() => {
    if (!userId) return [];
    const lastSeen = localStorage.getItem(`zz_task_last_seen_${userId}`) ?? '';
    return pendingTasks.map((task) => ({
      ...task,
      isNew: lastSeen ? task.createdAt > lastSeen : false,
    }));
  }, [pendingTasks, userId]);

  const selectClass =
    'h-10 w-full max-w-[200px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400';

  const completedListScrollClass =
    role === 'admin'
      ? 'max-h-[calc(100dvh-25rem)] sm:max-h-[calc(100dvh-22rem)]'
      : 'max-h-[calc(100dvh-36rem)] sm:max-h-[calc(100dvh-32rem)]';

  /** Full-bleed within MUI main (p:3 = 24px); flush top for admin so header uses full main width. */
  const pageBleedClass =
    role === 'admin'
      ? 'flex min-h-0 flex-col gap-0 -mx-6 -mt-6 -mb-6'
      : 'flex min-h-0 flex-col gap-4 -mx-6 -mb-6';

  return (
    <div className={pageBleedClass}>
      {role !== 'admin' && (
        <div className='px-6 pt-2 lg:px-8'>
          <Card className='overflow-hidden border border-slate-200 p-0'>
            <div className='border-b border-slate-100 px-6 py-5'>
              <div className='flex items-center gap-2'>
                <Clock3 size={16} className='text-[#F97316]' />
                <h3 className='text-lg font-bold text-[#0F172A]'>Notifications</h3>
                <span className='ml-2 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#92400E]'>
                  {notifications.length} pending
                </span>
              </div>
            </div>
            <div className='space-y-3 px-6 py-4'>
              {notifications.length === 0 ? (
                <p className='text-sm text-slate-500'>No pending tasks assigned yet.</p>
              ) : (
                notifications.map((task) => (
                  <div
                    key={task.id}
                    className='flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3'
                  >
                    <div>
                      <div className='flex items-center gap-2'>
                        <h4 className='font-semibold text-[#0F172A]'>{task.title}</h4>
                        {task.isNew && (
                          <span className='rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-semibold text-[#1D4ED8]'>
                            New
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-slate-500'>
                        Due {dayjs(task.dueDate).format('DD MMM YYYY')}
                      </p>
                    </div>
                    {(() => {
                      const badge = getStatusBadge(task.status);
                      return (
                        <Chip
                          label={badge.label}
                          size='small'
                          sx={{
                            bgcolor: badge.bg,
                            color: badge.color,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            fontSize: 10,
                          }}
                        />
                      );
                    })()}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      <section className='flex min-w-0 flex-col bg-[#f9fafb]' aria-label='Task board'>
        <div className='shrink-0 border-b border-slate-200/70 bg-[#f9fafb] px-6 py-5 lg:px-8'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-slate-900'>Operations Notice Board</h1>
              <p className='mt-1 text-sm text-slate-500'>
                Assign, track, and review operational tasks across all outlets.
              </p>
            </div>
            {role === 'admin' && (
              <div className='flex shrink-0 items-center gap-3'>
                <Button
                  variant='outline'
                  onClick={() => setTaskCategoriesModalOpen(true)}
                  className='rounded-xl px-5 py-3 font-semibold shadow-sm'
                >
                  <Tags size={18} /> Task Categories
                </Button>
                <Button
                  variant='admin-primary'
                  onClick={handleOpenCreate}
                  className='rounded-xl px-5 py-3 font-semibold shadow-sm'
                >
                  <Plus size={18} /> Assign Task
                </Button>
              </div>
            )}
          </div>

          <div className='mt-4 flex flex-wrap gap-3'>
            <select
              className={selectClass}
              value={filterOutletId}
              onChange={(e) => setFilterOutletId(e.target.value)}
              aria-label='Filter by outlet'
            >
              <option value='all'>All outlets</option>
              {outletsForFilter.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label='Filter by status'
            >
              <option value='all'>All statuses</option>
              <option value='open'>Open</option>
              <option value='completed'>Completed</option>
            </select>
            <select
              className={selectClass}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as 'all' | TaskPriority)}
              aria-label='Filter by priority'
            >
              <option value='all'>All priorities</option>
              <option value='low'>Low</option>
              <option value='medium'>Medium</option>
              <option value='high'>High</option>
            </select>
          </div>
        </div>

        <div className='space-y-5 bg-[#f9fafb] px-6 pt-4 pb-3 lg:px-8'>
          <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
            <h2 className='mb-3 text-base font-bold text-slate-900'>Open Tasks</h2>
            <div className='scrollbar-hide overflow-x-auto overflow-y-hidden pb-2 [scrollbar-gutter:stable]'>
              <div className='flex min-w-max gap-4'>
                {openTasks.map((task) => (
                  <div key={task.id} className='w-[320px] shrink-0 md:w-85'>
                    <TaskCard
                      task={task}
                      isAdmin={role === 'admin'}
                      onEdit={role === 'admin' ? () => handleOpenEdit(task) : undefined}
                      onDelete={canDeleteTask ? () => handleDeleteTask(task) : undefined}
                      onComplete={role !== 'admin' ? () => handleCompleteTask(task) : undefined}
                      onOpen={() => navigate(`/tasks/${task.id}`)}
                    />
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

          <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
            <h2 className='mb-3 text-base font-bold text-slate-900'>Completed Tasks</h2>
            <div
              className={`scrollbar-hide overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable] ${completedListScrollClass}`}
            >
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isAdmin={role === 'admin'}
                    onEdit={role === 'admin' ? () => handleOpenEdit(task) : undefined}
                    onDelete={canDeleteTask ? () => handleDeleteTask(task) : undefined}
                    onComplete={role !== 'admin' ? () => handleCompleteTask(task) : undefined}
                    onOpen={() => navigate(`/tasks/${task.id}`)}
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
        </div>
      </section>

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        form={form}
        setForm={setForm}
        onSubmit={() => void handleSubmit()}
        isSubmitting={
          createMutation.isPending || updateMutation.isPending || uploadTaskMediaLoading
        }
        outlets={outlets}
        managers={managers}
      />
      <TaskCategoriesModal
        open={taskCategoriesModalOpen}
        onClose={() => setTaskCategoriesModalOpen(false)}
      />
    </div>
  );
}
