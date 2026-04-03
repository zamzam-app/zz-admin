import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { Chip } from '@mui/material';
import { Clock3, Plus } from 'lucide-react';
import { useAuth } from '../lib/context/AuthContext';
import { useApiQuery, useApiMutation } from '../lib/react-query/use-api-hooks';
import { tasksApi } from '../lib/services/api/task.api';
import { usersApi } from '../lib/services/api/users.api';
import { outletApi } from '../lib/services/api/outlet.api';
import { TASK_KEYS, type Task, type TaskStatus } from '../lib/types/task';
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
  status: 'open',
  assigneeIds: [],
};

function isMockTaskId(id: string) {
  return id.startsWith('mock-');
}

export default function Tasks() {
  const { user } = useAuth();
  const role = user?.role ?? 'staff';
  const userId = user?.id ?? user?._id ?? '';

  const { data: tasks = [] } = useApiQuery(TASK_KEYS, () => tasksApi.getAll());
  const { data: managers = [] } = useApiQuery(MANAGER_KEYS, usersApi.getManagers);
  const { data: outlets = [] } = useApiQuery(OUTLET_KEYS, () => outletApi.getOutletsList());

  const [mockTasks, setMockTasks] = useState<Task[]>([]);
  const [hiddenMockIds, setHiddenMockIds] = useState<Set<string>>(() => new Set());
  const [filterOutlet, setFilterOutlet] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);

  useEffect(() => {
    fetch('/mockdata-task.json')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setMockTasks(data as Task[]);
      })
      .catch(() => {});
  }, []);

  const assignedOutletIds = useMemo(() => {
    if (!user || role === 'admin') return null;
    if (Array.isArray(user.outletId) && user.outletId.length > 0) return user.outletId;
    if (!userId) return [];
    return outlets
      .filter((outlet) => outlet.managerIds?.includes(userId) || outlet.managerId === userId)
      .map((outlet) => outlet.id);
  }, [outlets, role, user, userId]);

  const managerTasks = useMemo(() => {
    if (!userId) return [];
    return tasks.filter((task) => task.assigneeIds.includes(userId));
  }, [tasks, userId]);

  const pendingTasks = useMemo(
    () => managerTasks.filter((task) => task.status !== 'completed'),
    [managerTasks],
  );

  const tasksForBoard = useMemo(() => {
    const apiIds = new Set(tasks.map((t) => t.id));
    const merged =
      role === 'admin'
        ? [...tasks, ...mockTasks.filter((m) => !apiIds.has(m.id) && !hiddenMockIds.has(m.id))]
        : tasks.filter((t) => !hiddenMockIds.has(t.id));
    return merged;
  }, [tasks, mockTasks, role, hiddenMockIds]);

  const filteredManagerTasks = useMemo(() => {
    if (!assignedOutletIds || assignedOutletIds.length === 0) return managerTasks;
    return managerTasks.filter((task) =>
      task.outletId ? assignedOutletIds.includes(task.outletId) : true,
    );
  }, [assignedOutletIds, managerTasks]);

  const sourceTasks = role === 'admin' ? tasksForBoard : filteredManagerTasks;

  const outletFilterOptions = useMemo(() => {
    const names = new Set<string>();
    for (const t of sourceTasks) {
      if (t.outletName) names.add(t.outletName);
    }
    return ['all', ...Array.from(names).sort()];
  }, [sourceTasks]);

  const filteredTasks = useMemo(() => {
    return sourceTasks.filter((t) => {
      if (filterOutlet !== 'all' && t.outletName !== filterOutlet) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [sourceTasks, filterOutlet, filterStatus]);

  useEffect(() => {
    if (role === 'admin') return;
    if (!userId) return;
    const key = `zz_task_last_seen_${userId}`;
    localStorage.setItem(key, new Date().toISOString());
  }, [role, userId]);

  const createMutation = useApiMutation(
    (payload: Parameters<typeof tasksApi.create>[0]) => tasksApi.create(payload),
    [TASK_KEYS, ['tasks', 'unread', userId]],
    {
      onSuccess: () => {
        message.success('Task assigned successfully.');
        setModalOpen(false);
        setEditing(null);
        setForm(EMPTY_FORM);
      },
    },
  );

  const updateMutation = useApiMutation(
    (payload: { id: string; data: Parameters<typeof tasksApi.update>[1] }) =>
      tasksApi.update(payload.id, payload.data),
    [TASK_KEYS, ['tasks', 'unread', userId]],
    {
      onSuccess: () => {
        message.success('Task updated successfully.');
        setModalOpen(false);
        setEditing(null);
        setForm(EMPTY_FORM);
      },
    },
  );

  const deleteMutation = useApiMutation(
    (id: string) => tasksApi.remove(id),
    [TASK_KEYS, ['tasks', 'unread', userId]],
    {
      onSuccess: () => message.success('Task deleted.'),
    },
  );

  const completeMutation = useApiMutation(
    (id: string) => tasksApi.complete(id, userId),
    [TASK_KEYS, ['tasks', 'unread', userId]],
    {
      onSuccess: () => message.success('Task marked as completed.'),
    },
  );

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    if (isMockTaskId(task.id)) {
      message.info('Demo tasks from mockdata-task.json are read-only.');
      return;
    }
    setEditing(task);
    setForm({
      description: task.description,
      priority: task.priority,
      dueDate: dayjs(task.dueDate),
      outletId: task.outletId ? task.outletId : 'all',
      category: task.category ?? '',
      status: task.status,
      assigneeIds: task.assigneeIds,
    });
    setModalOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    if (isMockTaskId(task.id)) {
      setHiddenMockIds((prev) => new Set(prev).add(task.id));
      message.success('Demo task removed from the board.');
      return;
    }
    deleteMutation.mutate(task.id);
  };

  const handleCompleteTask = (task: Task) => {
    if (isMockTaskId(task.id)) {
      message.info('Complete demo tasks by using real tasks from Assign Task.');
      return;
    }
    completeMutation.mutate(task.id);
  };

  const handleSubmit = () => {
    if (!form.description.trim()) {
      message.error('Please add a description.');
      return;
    }
    if (form.outletId === '') {
      message.error('Please select an outlet.');
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

    const outlet =
      form.outletId === 'all'
        ? undefined
        : outlets.find((o) => o.id === form.outletId || o.outletId === form.outletId);
    const desc = form.description.trim();
    const titleFromDescription = desc.split('\n')[0].trim().slice(0, 120) || 'Task';
    const payload = {
      title: titleFromDescription,
      description: desc,
      priority: form.priority,
      dueDate,
      category: form.category,
      outletId: outlet?.id ?? (form.outletId !== 'all' ? form.outletId : undefined),
      outletName: outlet?.name,
      status: form.status,
      assigneeIds,
      assigneeNames: selectedManagers.map((m) => m.name).filter(Boolean),
      createdBy: userId || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
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

  /**
   * Max height for the task grid scroll area only (not a fixed full-viewport block), so short lists
   * don’t leave a large empty band below the cards. Header sits above this region.
   */
  const taskListScrollClass =
    role === 'admin'
      ? 'max-h-[calc(100dvh-15rem)] sm:max-h-[calc(100dvh-12.5rem)]'
      : 'max-h-[calc(100dvh-28rem)] sm:max-h-[calc(100dvh-24rem)]';

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

          <div className='mt-4 flex flex-wrap gap-3'>
            <select
              className={selectClass}
              value={filterOutlet}
              onChange={(e) => setFilterOutlet(e.target.value)}
              aria-label='Filter by outlet'
            >
              {outletFilterOptions.map((o) => (
                <option key={o} value={o}>
                  {o === 'all' ? 'All outlets' : o}
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
              <option value='in_progress'>In progress</option>
              <option value='completed'>Completed</option>
            </select>
          </div>
        </div>

        <div
          className={`overflow-y-auto overflow-x-hidden overscroll-contain bg-[#f9fafb] px-6 pt-4 pb-3 [scrollbar-gutter:stable] lg:px-8 ${taskListScrollClass}`}
        >
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isAdmin={role === 'admin'}
                onEdit={role === 'admin' ? () => handleOpenEdit(task) : undefined}
                onDelete={role === 'admin' ? () => handleDeleteTask(task) : undefined}
                onComplete={role !== 'admin' ? () => handleCompleteTask(task) : undefined}
              />
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className='py-16 text-center text-slate-500'>
              <p className='text-lg font-medium'>No tasks found</p>
              <p className='mt-1 text-sm'>Try adjusting your filters or assign a new task.</p>
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
        onSubmit={handleSubmit}
        outlets={outlets}
        managers={managers}
      />
    </div>
  );
}
