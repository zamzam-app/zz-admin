import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import dayjs from 'dayjs';
import { Chip } from '@mui/material';
import { Clock3, Plus } from 'lucide-react';
import { useAuth } from '../lib/context/AuthContext';
import { useImageUpload } from '../lib/hooks/useImageUpload';
import { useApiQuery, useApiMutation } from '../lib/react-query/use-api-hooks';
import { usersApi } from '../lib/services/api/users.api';
import {
  TASK_KEYS,
  type CreateTaskPayload,
  type Task,
  type TaskStatus,
  type UpdateTaskPayload,
} from '../lib/types/task';
import { OUTLET_KEYS } from '../lib/types/outlet';
import { MANAGER_KEYS } from '../lib/types/manager';
import { Button } from '../components/common/Button';
import Card from '../components/common/Card';
import { TaskFormModal, type TaskFormState } from '../components/tasks/TaskFormModal';
import { TaskCard } from '../components/tasks/TaskCard';

const STATUS_BADGE: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#1F2937', bg: '#F8FAFC' },
  in_progress: { label: 'In Progress', color: '#9A3412', bg: '#FFF7ED' },
  completed: { label: 'Completed', color: '#065F46', bg: '#ECFDF3' },
};

const EMPTY_FORM: TaskFormState = {
  description: '',
  priority: 'medium',
  dueDate: dayjs(),
  outletId: '',
  category: '',
  assigneeIds: [],
  adminAudioFiles: [],
};

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? 'staff';
  const userId = user?.id ?? user?._id ?? '';
  const canDeleteTask = role.toLowerCase() === 'admin' || role.toLowerCase() === 'manager';

  const taskListQueryKey = ['tasks', 'list', 'all', 'all', role, userId] as const;

  const { data: tasks = [] } = useApiQuery(
    [...taskListQueryKey],
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
    { enabled: role === 'admin' || !!userId },
  );
  const { data: managers = [] } = useApiQuery(MANAGER_KEYS, usersApi.getManagers);
  const { data: outlets = [] } = useApiQuery(OUTLET_KEYS, () =>
    import('../lib/services/api/outlet.api').then((m) => m.outletApi.getOutletsList()),
  );

  const [modalOpen, setModalOpen] = useState(false);
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
    let filtered = tasks;
    if (role !== 'admin' && assignedOutletIds && assignedOutletIds.length > 0) {
      filtered = tasks.filter((t) => !t.outletId || assignedOutletIds.includes(t.outletId));
    }
    return filtered.filter((t) => t.status !== 'in_progress');
  }, [tasks, role, assignedOutletIds]);

  const openTasks = useMemo(() => {
    return boardTasks.filter((t) => t.status === 'open');
  }, [boardTasks]);

  const completedTasks = useMemo(() => {
    return boardTasks.filter((t) => t.status === 'completed');
  }, [boardTasks]);

  const pendingTasks = useMemo(() => {
    if (role === 'admin' || !userId) return [];
    return boardTasks.filter((task) => task.status !== 'completed');
  }, [boardTasks, role, userId]);

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
      category: task.category ?? '',
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
    if (!form.category) {
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
          category: form.category,
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
      category: form.category,
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

  /**
   * Max height for the task grid scroll area only (not a fixed full-viewport block), so short lists
   * don’t leave a large empty band below the cards. Header sits above this region.
   */
  const taskListScrollClass =
    role === 'admin'
      ? 'max-h-[calc(100dvh-12rem)] sm:max-h-[calc(100dvh-10rem)]'
      : 'max-h-[calc(100dvh-25rem)] sm:max-h-[calc(100dvh-21rem)]';

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
                    <Chip
                      label={STATUS_BADGE[task.status].label}
                      size='small'
                      sx={{
                        bgcolor: STATUS_BADGE[task.status].bg,
                        color: STATUS_BADGE[task.status].color,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: 10,
                      }}
                    />
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
              <Button
                variant='admin-primary'
                onClick={handleOpenCreate}
                className='shrink-0 rounded-xl px-5 py-3 font-semibold shadow-sm'
              >
                <Plus size={18} /> Assign Task
              </Button>
            )}
          </div>

        </div>

        <div
          className={`overflow-y-auto overflow-x-hidden overscroll-contain bg-[#f9fafb] px-6 pt-4 pb-3 [scrollbar-gutter:stable] lg:px-8 ${taskListScrollClass}`}
        >
          {/* Open Tasks Section */}
          <div className='mb-8'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-bold text-slate-900'>
                Open Tasks <span className='ml-2 text-sm font-normal text-slate-500'>({openTasks.length})</span>
              </h2>
            </div>

            {openTasks.length > 0 ? (
              <div className='flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-4'>
                {openTasks.map((task) => (
                  <div key={task.id} className='w-full shrink-0 md:w-96'>
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
            ) : (
              <div className='rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center text-slate-500'>
                <p className='text-base font-medium'>No open tasks</p>
                <p className='mt-1 text-sm'>All caught up! New tasks will appear here.</p>
              </div>
            )}
          </div>

          {/* Completed Tasks Section */}
          <div className='mt-8'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-bold text-slate-900'>
                Completed Tasks <span className='ml-2 text-sm font-normal text-slate-500'>({completedTasks.length})</span>
              </h2>
            </div>

            {completedTasks.length > 0 ? (
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
            ) : (
              <div className='rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center text-slate-500'>
                <p className='text-base font-medium'>No completed tasks</p>
                <p className='mt-1 text-sm'>Tasks you finish will be listed here.</p>
              </div>
            )}
          </div>

          {boardTasks.length === 0 && (
            <div className='py-16 text-center text-slate-500'>
              <p className='text-lg font-medium'>No tasks found</p>
              <p className='mt-1 text-sm'>Try assigning a new task to get started.</p>
            </div>
          )}
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
    </div>
  );
}
