import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Autocomplete,
  Chip,
  FormControlLabel,
  MenuItem,
  Select as MuiSelect,
  TextField,
  Tooltip,
  Checkbox,
} from '@mui/material';
import { Plus, CheckCircle2, Clock3 } from 'lucide-react';
import { useAuth } from '../lib/context/AuthContext';
import { useApiQuery, useApiMutation } from '../lib/react-query/use-api-hooks';
import { tasksApi } from '../lib/services/api/task.api';
import { usersApi } from '../lib/services/api/users.api';
import { outletApi } from '../lib/services/api/outlet.api';
import { TASK_KEYS, type Task, type TaskPriority, type TaskStatus } from '../lib/types/task';
import { OUTLET_KEYS } from '../lib/types/outlet';
import { MANAGER_KEYS } from '../lib/types/manager';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { DateWheelPicker } from '../components/common/DateWheelPicker';

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const STATUS_OPTIONS: TaskStatus[] = ['open', 'in_progress', 'completed'];

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: '#0EA5E9',
  medium: '#6366F1',
  high: '#F97316',
  urgent: '#EF4444',
};

const STATUS_BADGE: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#1F2937', bg: '#F8FAFC' },
  in_progress: { label: 'In Progress', color: '#9A3412', bg: '#FFF7ED' },
  completed: { label: 'Completed', color: '#065F46', bg: '#ECFDF3' },
};

type TaskFormState = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: Dayjs | null;
  outletId: string;
  status: TaskStatus;
  assigneeIds: string[];
  assignAll: boolean;
};

const EMPTY_FORM: TaskFormState = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: dayjs(),
  outletId: '',
  status: 'open',
  assigneeIds: [],
  assignAll: false,
};

export default function Tasks() {
  const { user } = useAuth();
  const role = user?.role ?? 'staff';
  const userId = user?.id ?? user?._id ?? '';

  const { data: tasks = [] } = useApiQuery(TASK_KEYS, () => tasksApi.getAll());
  const { data: managers = [] } = useApiQuery(MANAGER_KEYS, usersApi.getManagers);
  const { data: outlets = [] } = useApiQuery(OUTLET_KEYS, () => outletApi.getOutletsList());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);

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
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: dayjs(task.dueDate),
      outletId: task.outletId ?? '',
      status: task.status,
      assigneeIds: task.assigneeIds,
      assignAll: false,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      message.error('Please add a task title.');
      return;
    }
    if (!form.description.trim()) {
      message.error('Please add a description.');
      return;
    }
    const dueDate = form.dueDate?.toISOString();
    if (!dueDate) {
      message.error('Please select a due date.');
      return;
    }

    const selectedManagers = form.assignAll
      ? managers
      : managers.filter((m) => form.assigneeIds.includes(m._id ?? m.id ?? ''));

    const assigneeIds = selectedManagers.map((m) => m._id ?? m.id ?? '').filter(Boolean);
    if (assigneeIds.length === 0) {
      message.error('Select at least one manager.');
      return;
    }

    const outlet = outlets.find((o) => o.id === form.outletId || o.outletId === form.outletId);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      dueDate,
      outletId: outlet?.id ?? (form.outletId || undefined),
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

  const header = (
    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
      <div>
        <div className='inline-flex items-center gap-2 rounded-full bg-[#EEF2FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#4338CA]'>
          Tasks
        </div>
        <h1 className='mt-3 text-3xl font-black text-[#0F172A]'>Task Management</h1>
        <p className='mt-1 text-sm text-slate-500'>
          Assign tasks to managers and track completion in real time.
        </p>
      </div>
      {role === 'admin' && (
        <Button
          variant='admin-primary'
          onClick={handleOpenCreate}
          className='rounded-2xl px-6 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.15)]'
        >
          <Plus size={18} /> New Task
        </Button>
      )}
    </div>
  );

  const notifications = useMemo(() => {
    if (!userId) return [];
    const lastSeen = localStorage.getItem(`zz_task_last_seen_${userId}`) ?? '';
    return pendingTasks.map((task) => ({
      ...task,
      isNew: lastSeen ? task.createdAt > lastSeen : false,
    }));
  }, [pendingTasks, userId]);

  const filteredManagerTasks = useMemo(() => {
    if (!assignedOutletIds || assignedOutletIds.length === 0) return managerTasks;
    return managerTasks.filter((task) =>
      task.outletId ? assignedOutletIds.includes(task.outletId) : true,
    );
  }, [assignedOutletIds, managerTasks]);

  return (
    <div className='space-y-8'>
      {header}

      {role !== 'admin' && (
        <Card className='p-0 overflow-hidden border border-slate-200'>
          <div className='px-6 py-5 border-b border-slate-100'>
            <div className='flex items-center gap-2'>
              <Clock3 size={16} className='text-[#F97316]' />
              <h3 className='font-bold text-lg text-[#0F172A]'>Notifications</h3>
              <span className='ml-2 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#92400E]'>
                {notifications.length} pending
              </span>
            </div>
          </div>
          <div className='px-6 py-4 space-y-3'>
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
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card className='p-0 overflow-hidden border border-slate-200'>
          <div className='px-6 py-5 border-b border-slate-100'>
            <h3 className='font-bold text-lg text-[#0F172A]'>
              {role === 'admin' ? 'All Tasks' : 'My Tasks'}
            </h3>
            <p className='text-xs text-slate-500 mt-1'>
              {role === 'admin'
                ? 'View, edit, and manage every task across outlets.'
                : 'Track tasks assigned to you and mark them complete.'}
            </p>
          </div>
          <div className='px-6 py-4 space-y-3'>
            {(role === 'admin' ? tasks : filteredManagerTasks).length === 0 ? (
              <p className='text-sm text-slate-500'>No tasks found.</p>
            ) : (
              (role === 'admin' ? tasks : filteredManagerTasks).map((task) => (
                <div
                  key={task.id}
                  className='rounded-2xl border border-slate-100 bg-white px-4 py-4'
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <h4 className='font-semibold text-[#0F172A]'>{task.title}</h4>
                        <span
                          className='rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide'
                          style={{
                            backgroundColor: `${PRIORITY_COLOR[task.priority]}1A`,
                            color: PRIORITY_COLOR[task.priority],
                          }}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p className='mt-1 text-sm text-slate-500'>{task.description}</p>
                      <div className='mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400'>
                        <span>Due {dayjs(task.dueDate).format('DD MMM YYYY')}</span>
                        {task.outletName && <span>• {task.outletName}</span>}
                        {task.assigneeNames &&
                          task.assigneeNames.length > 0 &&
                          role === 'admin' && <span>• {task.assigneeNames.join(', ')}</span>}
                      </div>
                    </div>
                    <div className='flex flex-col items-end gap-2'>
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
                      {role !== 'admin' && task.status !== 'completed' && (
                        <Button
                          variant='primary-feedback'
                          className='rounded-xl px-4 py-2 text-xs'
                          onClick={() => completeMutation.mutate(task.id)}
                        >
                          <CheckCircle2 size={14} className='mr-1' /> Complete
                        </Button>
                      )}
                      {role === 'admin' && (
                        <div className='flex items-center gap-2'>
                          <Tooltip title='Edit Task'>
                            <button
                              onClick={() => handleOpenEdit(task)}
                              className='px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50'
                            >
                              Edit
                            </button>
                          </Tooltip>
                          <Tooltip title='Delete Task'>
                            <button
                              onClick={() => deleteMutation.mutate(task.id)}
                              className='px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-100 text-red-500 hover:bg-red-50'
                            >
                              Delete
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {role === 'admin' && (
          <Card className='p-0 overflow-hidden border border-slate-200'>
            <div className='px-6 py-5 border-b border-slate-100'>
              <h3 className='font-bold text-lg text-[#0F172A]'>Assignment Summary</h3>
              <p className='text-xs text-slate-500 mt-1'>
                Track workloads by manager to keep delivery balanced.
              </p>
            </div>
            <div className='px-6 py-4 space-y-3'>
              {managers.length === 0 ? (
                <p className='text-sm text-slate-500'>No managers found.</p>
              ) : (
                managers.map((manager) => {
                  const managerId = manager._id ?? manager.id ?? '';
                  const activeCount = tasks.filter(
                    (task) => task.assigneeIds.includes(managerId) && task.status !== 'completed',
                  ).length;
                  return (
                    <div
                      key={managerId}
                      className='flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3'
                    >
                      <div>
                        <p className='font-semibold text-[#0F172A]'>{manager.name}</p>
                        <p className='text-xs text-slate-500'>{manager.email}</p>
                      </div>
                      <span className='rounded-full bg-[#E0F2FE] px-2.5 py-1 text-xs font-semibold text-[#0369A1]'>
                        {activeCount} active
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Task' : 'Assign Task'}
        maxWidth='lg'
        scrollableContent
      >
        <div className='space-y-6'>
          <Input
            label='Task Title'
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label='Description'
            multiline
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className='mt-2 grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Select
              label='Priority'
              options={PRIORITY_OPTIONS.map((priority) => ({
                label: priority.toUpperCase(),
                value: priority,
              }))}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
            />
            <Select
              label='Status'
              options={STATUS_OPTIONS.map((status) => ({
                label: status.replace('_', ' ').toUpperCase(),
                value: status,
              }))}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Due Date</label>
            <DateWheelPicker
              value={form.dueDate}
              onChange={(date) => setForm({ ...form, dueDate: date })}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.assignAll}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assignAll: e.target.checked,
                      assigneeIds: e.target.checked ? [] : form.assigneeIds,
                    })
                  }
                />
              }
              label='Assign to all managers'
            />
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Outlet</label>
              <MuiSelect
                fullWidth
                value={form.outletId}
                onChange={(e) => setForm({ ...form, outletId: String(e.target.value) })}
                size='small'
                displayEmpty
                sx={{ borderRadius: 3, bgcolor: 'white' }}
              >
                <MenuItem value=''>All Outlets</MenuItem>
                {outlets.map((outlet) => (
                  <MenuItem key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </div>
          </div>

          <div>
            <Autocomplete
              multiple
              disabled={form.assignAll}
              options={managers}
              value={managers.filter((m) => form.assigneeIds.includes(m._id ?? m.id ?? ''))}
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
                <TextField {...params} label='Assignees' placeholder='Select managers' />
              )}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: '#F9FAFB',
                  '&:hover fieldset': { borderColor: '#D4AF37' },
                  '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
                },
                '& .MuiChip-root': {
                  bgcolor: '#F3F4F6',
                  fontWeight: 600,
                },
              }}
            />
          </div>

          <div className='flex justify-end gap-3'>
            <Button variant='ghost' onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant='admin-primary' onClick={handleSubmit}>
              {editing ? 'Update Task' : 'Assign Task'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
