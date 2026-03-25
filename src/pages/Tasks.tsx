import { useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Autocomplete,
  FormControlLabel,
  MenuItem,
  Select as MuiSelect,
  TextField,
  Tooltip,
  Checkbox,
} from '@mui/material';
import {
  Plus,
  CheckCircle2,
  Bell,
  Calendar,
  Clock3,
  Camera,
  Image,
  Video,
  Mic,
  FolderOpen,
  StopCircle,
  FileText,
  ListChecks,
  HelpCircle,
  AlignLeft,
} from 'lucide-react';
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

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: '#0EA5E9',
  medium: '#6366F1',
  high: '#F97316',
  urgent: '#EF4444',
};

const STATUS_BADGE: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Scheduled', color: '#92400E', bg: '#FEF3C7' },
  in_progress: { label: 'Ongoing', color: '#1D4ED8', bg: '#DBEAFE' },
  completed: { label: 'Completed', color: '#166534', bg: '#DCFCE7' },
};

const DEPARTMENT_OPTIONS = [
  { label: 'Admin', value: 'Admin' },
  { label: 'Staff', value: 'Staff' },
  { label: 'Kitchen', value: 'Kitchen' },
  { label: 'Housekeeping', value: 'Housekeeping' },
  { label: 'Maintenance', value: 'Maintenance' },
];

const REPEAT_OPTIONS = [
  { label: 'Does not repeat', value: 'Does not repeat' },
  { label: 'Daily', value: 'Daily' },
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Monthly', value: 'Monthly' },
];

const VALIDATION_OPTIONS = [
  { key: 'video', label: 'Video', icon: Video },
  { key: 'audio', label: 'Audio', icon: Mic },
  { key: 'image', label: 'Image', icon: Image },
  { key: 'description', label: 'Description', icon: AlignLeft },
  { key: 'file', label: 'File', icon: FileText },
  { key: 'checklist', label: 'Checklist', icon: ListChecks },
  { key: 'qna', label: 'Question & Answer', icon: HelpCircle },
] as const;

type ValidationKey = (typeof VALIDATION_OPTIONS)[number]['key'];

type Attachment = { name: string; type: string; dataUrl: string };

type EvidenceState = {
  image: Attachment[];
  video: Attachment[];
  audio: Attachment[];
  file: Attachment[];
  checklist: string;
  qna: string;
  description: string;
};

type TaskFormState = {
  title: string;
  description: string;
  priority: TaskPriority;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  startTime: string;
  endTime: string;
  outletId: string;
  status: TaskStatus;
  assigneeIds: string[];
  assignAll: boolean;
  department: string;
  repeat: string;
  validations: Record<ValidationKey, boolean>;
};

const EMPTY_FORM: TaskFormState = {
  title: '',
  description: '',
  priority: 'medium',
  startDate: dayjs(),
  endDate: dayjs(),
  startTime: '09:00',
  endTime: '18:00',
  outletId: '',
  status: 'open',
  assigneeIds: [],
  assignAll: false,
  department: 'Admin',
  repeat: 'Does not repeat',
  validations: {
    video: false,
    audio: false,
    image: true,
    description: true,
    file: false,
    checklist: false,
    qna: false,
  },
};

const EMPTY_EVIDENCE: EvidenceState = {
  image: [],
  video: [],
  audio: [],
  file: [],
  checklist: '',
  qna: '',
  description: '',
};

const PAGE_SIZE = 6;

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
  const [outletFilter, setOutletFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [completeTask, setCompleteTask] = useState<Task | null>(null);
  const [evidence, setEvidence] = useState<EvidenceState>(EMPTY_EVIDENCE);
  const imageCameraRef = useRef<HTMLInputElement | null>(null);
  const imageLibraryRef = useRef<HTMLInputElement | null>(null);
  const videoCameraRef = useRef<HTMLInputElement | null>(null);
  const videoLibraryRef = useRef<HTMLInputElement | null>(null);
  const audioMicRef = useRef<HTMLInputElement | null>(null);
  const audioLibraryRef = useRef<HTMLInputElement | null>(null);
  const fileLibraryRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleStatusFilterChange = (value: 'all' | TaskStatus) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePriorityFilterChange = (value: 'all' | TaskPriority) => {
    setPriorityFilter(value);
    setCurrentPage(1);
  };

  const handleOutletFilterChange = (value: string) => {
    setOutletFilter(value);
    setCurrentPage(1);
  };

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
      startDate: task.startDate ? dayjs(task.startDate) : dayjs(task.dueDate),
      endDate: task.endDate ? dayjs(task.endDate) : dayjs(task.dueDate),
      startTime: task.startTime ?? '09:00',
      endTime: task.endTime ?? '18:00',
      outletId: task.outletId ?? '',
      status: task.status,
      assigneeIds: task.assigneeIds,
      assignAll: false,
      department: task.department ?? 'Admin',
      repeat: task.repeat ?? 'Does not repeat',
      validations: {
        video: task.validations?.video ?? false,
        audio: task.validations?.audio ?? false,
        image: task.validations?.image ?? true,
        description: task.validations?.description ?? true,
        file: task.validations?.file ?? false,
        checklist: task.validations?.checklist ?? false,
        qna: task.validations?.qna ?? false,
      },
    });
    setModalOpen(true);
  };

  const openCompleteModal = (task: Task) => {
    setCompleteTask(task);
    setEvidence(EMPTY_EVIDENCE);
  };

  const closeCompleteModal = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setCompleteTask(null);
    setEvidence(EMPTY_EVIDENCE);
  };

  const readFilesAsDataUrl = (files: FileList | null): Promise<Attachment[]> => {
    if (!files || files.length === 0) return Promise.resolve([]);
    const fileArray = Array.from(files);
    return Promise.all(
      fileArray.map(
        (file) =>
          new Promise<Attachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                name: file.name,
                type: file.type || 'application/octet-stream',
                dataUrl: String(reader.result),
              });
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      ),
    );
  };

  const handleEvidenceUpload = async (
    key: 'image' | 'video' | 'audio' | 'file',
    files: FileList | null,
  ) => {
    try {
      const uploaded = await readFilesAsDataUrl(files);
      if (uploaded.length === 0) return;
      setEvidence((prev) => ({ ...prev, [key]: [...prev[key], ...uploaded] }));
    } catch {
      message.error('Unable to read file. Please try again.');
    }
  };

  const parseChecklist = (raw: string) =>
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

  const parseQna = (raw: string) =>
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.includes('|') ? line.split('|') : line.split('-');
        const question = parts[0]?.trim() ?? '';
        const answer = parts.slice(1).join('-').trim();
        return { question, answer };
      })
      .filter((item) => item.question && item.answer);

  const startAudioRecording = async () => {
    if (isRecording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      message.error('Audio recording is not supported in this browser.');
      audioMicRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      mediaStreamRef.current = stream;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          setEvidence((prev) => ({
            ...prev,
            audio: [
              ...prev.audio,
              {
                name: `audio-${Date.now()}.webm`,
                type: blob.type || 'audio/webm',
                dataUrl: String(reader.result),
              },
            ],
          }));
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      message.error('Microphone permission denied.');
    }
  };

  const stopAudioRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
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
    const endDate = form.endDate?.toISOString();
    if (!endDate) {
      message.error('Please select an end date.');
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
      dueDate: endDate,
      startDate: form.startDate?.toISOString(),
      endDate,
      startTime: form.startTime,
      endTime: form.endTime,
      department: form.department,
      repeat: form.repeat,
      validations: form.validations,
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

  const handleCompleteSubmit = () => {
    if (!completeTask) return;
    const required = completeTask.validations ?? {};
    if (required.image && evidence.image.length === 0) {
      message.error('Please upload at least one image.');
      return;
    }
    if (required.video && evidence.video.length === 0) {
      message.error('Please upload at least one video.');
      return;
    }
    if (required.audio && evidence.audio.length === 0) {
      message.error('Please upload at least one audio clip.');
      return;
    }
    if (required.file && evidence.file.length === 0) {
      message.error('Please upload a file.');
      return;
    }
    if (required.description && !evidence.description.trim()) {
      message.error('Please add a description.');
      return;
    }
    const checklistItems = parseChecklist(evidence.checklist);
    if (required.checklist && checklistItems.length === 0) {
      message.error('Please add checklist items.');
      return;
    }
    const qnaItems = parseQna(evidence.qna);
    if (required.qna && qnaItems.length === 0) {
      message.error('Please add at least one Q&A.');
      return;
    }

    updateMutation.mutate({
      id: completeTask.id,
      data: {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy: userId || undefined,
        validationEvidence: {
          image: evidence.image,
          video: evidence.video,
          audio: evidence.audio,
          file: evidence.file,
          checklist: checklistItems,
          qna: qnaItems,
          description: evidence.description.trim() || undefined,
        },
        validationSubmittedAt: new Date().toISOString(),
        validationSubmittedBy: userId || undefined,
      },
    });
    closeCompleteModal();
  };

  const filteredManagerTasks = useMemo(() => {
    if (!assignedOutletIds || assignedOutletIds.length === 0) return managerTasks;
    return managerTasks.filter((task) =>
      task.outletId ? assignedOutletIds.includes(task.outletId) : true,
    );
  }, [assignedOutletIds, managerTasks]);

  const filteredTasks = useMemo(() => {
    let base = role === 'admin' ? tasks : filteredManagerTasks;
    if (role === 'admin' && outletFilter !== 'all') {
      base = base.filter((task) => task.outletId === outletFilter);
    }
    if (statusFilter !== 'all') {
      base = base.filter((task) => task.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      base = base.filter((task) => task.priority === priorityFilter);
    }
    return base;
  }, [filteredManagerTasks, outletFilter, priorityFilter, role, statusFilter, tasks]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTasks = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, safePage]);

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'completed'),
    [tasks],
  );

  const header = (
    <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
      <div>
        <div className='inline-flex items-center gap-2 rounded-full bg-[#EAF4EE] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2F6B4F]'>
          Tasks
        </div>
        <h1 className='mt-3 text-3xl font-semibold text-[#1F2937]'>Task Management</h1>
        <p className='mt-1 text-sm text-slate-500'>
          {role === 'admin'
            ? 'Create, assign, and review tasks with real-time validations.'
            : 'Complete tasks assigned to you with required validations.'}
        </p>
      </div>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-500'>
          <Bell size={16} />
          <span className='text-xs font-semibold'>
            {role === 'admin' ? filteredTasks.length : pendingTasks.length} tasks
          </span>
        </div>
        {role === 'admin' && (
          <button
            onClick={handleOpenCreate}
            className='inline-flex items-center gap-2 rounded-xl bg-[#2F6B4F] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#285D44]'
          >
            <Plus size={16} />
            Create New Task
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className='space-y-6'>
      {header}

      <Card className='overflow-hidden border border-slate-200 bg-white'>
        <div className='flex flex-col gap-2 border-b border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-[#1F2937]'>
              {role === 'admin' ? 'All Tasks' : 'My Tasks'}
            </h3>
            <p className='text-xs text-slate-500'>
              {role === 'admin'
                ? 'Monitor assignments, priorities, and validation requirements.'
                : 'Track tasks, complete validations, and mark done.'}
            </p>
          </div>
          <div className='flex items-center gap-3 text-xs text-slate-500'>
            <span className='flex items-center gap-1'>
              <Calendar size={14} /> {dayjs().format('DD MMM YYYY')}
            </span>
            <span className='flex items-center gap-1'>
              <Clock3 size={14} /> {dayjs().format('hh:mm A')}
            </span>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <div className='min-w-[840px]'>
            <div className='flex flex-wrap items-center gap-3 border-b border-slate-100 px-6 py-3 text-xs text-slate-500'>
              <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2'>
                <span>Status</span>
                <MuiSelect
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | TaskStatus)}
                  size='small'
                  variant='standard'
                  disableUnderline
                  sx={{ minWidth: 120, fontSize: 13, fontWeight: 600, color: '#1F2937' }}
                >
                  <MenuItem value='all'>All</MenuItem>
                  <MenuItem value='open'>Scheduled</MenuItem>
                  <MenuItem value='in_progress'>Ongoing</MenuItem>
                  <MenuItem value='completed'>Completed</MenuItem>
                </MuiSelect>
              </div>
              <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2'>
                <span>Priority</span>
                <MuiSelect
                  value={priorityFilter}
                  onChange={(e) =>
                    handlePriorityFilterChange(e.target.value as 'all' | TaskPriority)
                  }
                  size='small'
                  variant='standard'
                  disableUnderline
                  sx={{ minWidth: 120, fontSize: 13, fontWeight: 600, color: '#1F2937' }}
                >
                  <MenuItem value='all'>All</MenuItem>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority.toUpperCase()}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </div>
              {role === 'admin' && (
                <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2'>
                  <span>Outlet</span>
                  <MuiSelect
                    value={outletFilter}
                    onChange={(e) => handleOutletFilterChange(String(e.target.value))}
                    size='small'
                    variant='standard'
                    disableUnderline
                    sx={{ minWidth: 160, fontSize: 13, fontWeight: 600, color: '#1F2937' }}
                  >
                    <MenuItem value='all'>All Outlets</MenuItem>
                    {outlets.map((outlet) => (
                      <MenuItem key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </div>
              )}
              <button
                className='rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50'
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setOutletFilter('all');
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </button>
            </div>
            <div className='grid grid-cols-[2.4fr_1.2fr_1fr_1fr_1.1fr] gap-4 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400'>
              <div>Task Name</div>
              <div>Assignee</div>
              <div>Department</div>
              <div>Status</div>
              <div className='text-right'>Action</div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className='px-6 py-8 text-sm text-slate-500'>No tasks found.</div>
            ) : (
              paginatedTasks.map((task) => {
                const assigneeLabel = task.assigneeNames?.[0] ?? 'Unassigned';
                return (
                  <div
                    key={task.id}
                    className='grid grid-cols-[2.4fr_1.2fr_1fr_1fr_1.1fr] gap-4 border-b border-slate-100 px-6 py-4 text-sm'
                  >
                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='font-semibold text-[#1F2937]'>{task.title}</p>
                        <span
                          className='rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase'
                          style={{
                            backgroundColor: `${PRIORITY_COLOR[task.priority]}1A`,
                            color: PRIORITY_COLOR[task.priority],
                          }}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p className='mt-1 text-xs text-slate-500 line-clamp-2'>{task.description}</p>
                      <div className='mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400'>
                        <span>Due {dayjs(task.dueDate).format('DD MMM')}</span>
                        {task.outletName && <span>• {task.outletName}</span>}
                        {task.startTime && task.endTime && (
                          <span>
                            • {task.startTime} - {task.endTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF4EE] text-xs font-semibold text-[#2F6B4F]'>
                        {assigneeLabel.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className='font-medium text-[#1F2937]'>{assigneeLabel}</p>
                        <p className='text-xs text-slate-400'>Manager</p>
                      </div>
                    </div>
                    <div className='flex items-center text-sm text-slate-600'>
                      {task.department ?? 'General'}
                    </div>
                    <div className='flex items-center'>
                      <span
                        className='rounded-full px-3 py-1 text-xs font-semibold'
                        style={{
                          backgroundColor: STATUS_BADGE[task.status].bg,
                          color: STATUS_BADGE[task.status].color,
                        }}
                      >
                        {STATUS_BADGE[task.status].label}
                      </span>
                    </div>
                    <div className='flex items-center justify-end gap-2'>
                      {role === 'admin' ? (
                        <>
                          <Tooltip title='Edit Task'>
                            <button
                              onClick={() => handleOpenEdit(task)}
                              className='rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50'
                            >
                              Edit
                            </button>
                          </Tooltip>
                          <Tooltip title='Delete Task'>
                            <button
                              onClick={() => deleteMutation.mutate(task.id)}
                              className='rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50'
                            >
                              Delete
                            </button>
                          </Tooltip>
                        </>
                      ) : (
                        task.status !== 'completed' && (
                          <Button
                            variant='primary-feedback'
                            className='rounded-lg px-4 py-2 text-xs'
                            onClick={() => openCompleteModal(task)}
                          >
                            <CheckCircle2 size={14} className='mr-1' /> Complete
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className='flex flex-col gap-3 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between'>
          <span>
            Showing {paginatedTasks.length} of {filteredTasks.length} tasks
          </span>
          <div className='flex items-center gap-1'>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 rounded-lg border text-[11px] font-semibold transition ${
                  page === safePage
                    ? 'border-[#2F6B4F] bg-[#EAF4EE] text-[#2F6B4F]'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {role === 'admin' && (
        <Card className='overflow-hidden border border-slate-200 bg-white'>
          <div className='flex flex-col gap-2 border-b border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-[#1F2937]'>Completed Task Reviews</h3>
              <p className='text-xs text-slate-500'>
                Review submitted validations with real-time evidence.
              </p>
            </div>
            <span className='rounded-full bg-[#EAF4EE] px-3 py-1 text-xs font-semibold text-[#2F6B4F]'>
              {completedTasks.length} completed
            </span>
          </div>
          <div className='space-y-4 px-6 py-4'>
            {completedTasks.length === 0 ? (
              <p className='text-sm text-slate-500'>No completed tasks to review yet.</p>
            ) : (
              completedTasks.map((task) => {
                const evidencePack = task.validationEvidence;
                return (
                  <div
                    key={task.id}
                    className='rounded-2xl border border-slate-200 bg-[#F9FAFB] p-4'
                  >
                    <div className='flex flex-wrap items-start justify-between gap-4'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <h4 className='text-sm font-semibold text-[#1F2937]'>{task.title}</h4>
                          <span
                            className='rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase'
                            style={{
                              backgroundColor: `${PRIORITY_COLOR[task.priority]}1A`,
                              color: PRIORITY_COLOR[task.priority],
                            }}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p className='mt-1 text-xs text-slate-500'>{task.description}</p>
                        <div className='mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400'>
                          <span>{task.outletName ?? 'All Outlets'}</span>
                          {task.assigneeNames?.[0] && <span>• {task.assigneeNames[0]}</span>}
                          {task.validationSubmittedAt && (
                            <span>
                              • Submitted{' '}
                              {dayjs(task.validationSubmittedAt).format('DD MMM, hh:mm A')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className='rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#166534]'>
                        Completed
                      </span>
                    </div>

                    <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2'>
                      <div className='space-y-3'>
                        {evidencePack?.description && (
                          <div className='rounded-xl border border-slate-200 bg-white p-3'>
                            <p className='text-xs font-semibold text-slate-400'>Description</p>
                            <p className='mt-1 text-sm text-slate-600'>
                              {evidencePack.description}
                            </p>
                          </div>
                        )}
                        {evidencePack?.checklist && evidencePack.checklist.length > 0 && (
                          <div className='rounded-xl border border-slate-200 bg-white p-3'>
                            <p className='text-xs font-semibold text-slate-400'>Checklist</p>
                            <ul className='mt-2 list-disc pl-4 text-sm text-slate-600'>
                              {evidencePack.checklist.map((item, index) => (
                                <li key={`${task.id}-check-${index}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evidencePack?.qna && evidencePack.qna.length > 0 && (
                          <div className='rounded-xl border border-slate-200 bg-white p-3'>
                            <p className='text-xs font-semibold text-slate-400'>Q&A</p>
                            <div className='mt-2 space-y-2 text-sm text-slate-600'>
                              {evidencePack.qna.map((qa, index) => (
                                <div key={`${task.id}-qna-${index}`}>
                                  <p className='font-semibold'>{qa.question}</p>
                                  <p className='text-slate-500'>{qa.answer}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className='space-y-3'>
                        {evidencePack?.image && evidencePack.image.length > 0 && (
                          <div className='rounded-xl border border-slate-200 bg-white p-3'>
                            <p className='text-xs font-semibold text-slate-400'>Images</p>
                            <div className='mt-2 flex flex-wrap gap-2'>
                              {evidencePack.image.map((img, index) => (
                                <img
                                  key={`${task.id}-img-${index}`}
                                  src={img.dataUrl}
                                  alt={img.name}
                                  className='h-20 w-24 rounded-lg border border-slate-200 object-cover'
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {evidencePack?.video && evidencePack.video.length > 0 && (
                          <div className='rounded-xl border border-slate-200 bg-white p-3'>
                            <p className='text-xs font-semibold text-slate-400'>Videos</p>
                            <div className='mt-2 space-y-2'>
                              {evidencePack.video.map((vid, index) => (
                                <video
                                  key={`${task.id}-vid-${index}`}
                                  src={vid.dataUrl}
                                  controls
                                  className='w-full rounded-lg border border-slate-200'
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {evidencePack?.audio && evidencePack.audio.length > 0 && (
                          <div className='rounded-xl border border-slate-200 bg-white p-3'>
                            <p className='text-xs font-semibold text-slate-400'>Audio</p>
                            <div className='mt-2 space-y-2'>
                              {evidencePack.audio.map((aud, index) => (
                                <audio
                                  key={`${task.id}-aud-${index}`}
                                  src={aud.dataUrl}
                                  controls
                                  className='w-full'
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {evidencePack?.file && evidencePack.file.length > 0 && (
                          <div className='rounded-xl border border-slate-200 bg-white p-3'>
                            <p className='text-xs font-semibold text-slate-400'>Files</p>
                            <div className='mt-2 flex flex-col gap-2'>
                              {evidencePack.file.map((file, index) => (
                                <a
                                  key={`${task.id}-file-${index}`}
                                  href={file.dataUrl}
                                  download={file.name}
                                  className='rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50'
                                >
                                  {file.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Task' : 'Create Task'}
        maxWidth='xl'
        scrollableContent
        className='rounded-[28px]'
        contentClassName='p-6 bg-[#F8FAFB]'
      >
        <div className='space-y-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <label className='mb-2 block text-sm font-medium text-slate-600'>Select Outlet</label>
              <MuiSelect
                fullWidth
                value={form.outletId}
                onChange={(e) => setForm({ ...form, outletId: String(e.target.value) })}
                size='small'
                displayEmpty
                sx={{
                  borderRadius: 3,
                  bgcolor: 'white',
                }}
              >
                <MenuItem value=''>All Outlets</MenuItem>
                {outlets.map((outlet) => (
                  <MenuItem key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </div>
            <Input
              label='Task Name'
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Select
              label='Department'
              options={DEPARTMENT_OPTIONS}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <div>
              <label className='mb-2 block text-sm font-medium text-slate-600'>Assign Task</label>
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
                  <TextField {...params} label='Select managers' placeholder='Managers' />
                )}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: '#FFFFFF',
                    '&:hover fieldset': { borderColor: '#2F6B4F' },
                    '&.Mui-focused fieldset': { borderColor: '#2F6B4F' },
                  },
                  '& .MuiChip-root': {
                    bgcolor: '#EEF2F3',
                    fontWeight: 600,
                  },
                }}
              />
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
                sx={{ mt: 1 }}
              />
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white p-5'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-semibold text-[#1F2937]'>Date & Time</h4>
            </div>
            <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-600'>
                  Start Date and Time
                </label>
                <div className='space-y-3'>
                  <DateWheelPicker
                    value={form.startDate}
                    onChange={(date) => setForm({ ...form, startDate: date })}
                    maxYear={dayjs().year() + 5}
                  />
                  <input
                    type='time'
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className='w-full rounded-xl border border-slate-200 bg-[#F9FAFB] px-3 py-2 text-sm'
                  />
                </div>
              </div>
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-600'>
                  End Date and Time
                </label>
                <div className='space-y-3'>
                  <DateWheelPicker
                    value={form.endDate}
                    onChange={(date) => setForm({ ...form, endDate: date })}
                    maxYear={dayjs().year() + 5}
                  />
                  <input
                    type='time'
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className='w-full rounded-xl border border-slate-200 bg-[#F9FAFB] px-3 py-2 text-sm'
                  />
                </div>
              </div>
            </div>
            <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Select
                label='Repeat Task'
                options={REPEAT_OPTIONS}
                value={form.repeat}
                onChange={(e) => setForm({ ...form, repeat: e.target.value })}
              />
              <Select
                label='Set Priority'
                options={PRIORITY_OPTIONS.map((priority) => ({
                  label: priority.toUpperCase(),
                  value: priority,
                }))}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
              />
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white p-5'>
            <h4 className='text-sm font-semibold text-[#1F2937]'>Add SOP / Description</h4>
            <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]'>
              <div>
                <Input
                  multiline
                  rows={5}
                  label='Write task description here'
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <div className='mt-3 flex items-center gap-2 text-xs text-slate-500'>
                  <span className='rounded-full bg-[#F3F4F6] px-2 py-1'>Attachments</span>
                  <span className='rounded-full bg-[#F3F4F6] px-2 py-1'>Photos</span>
                  <span className='rounded-full bg-[#F3F4F6] px-2 py-1'>Checklist</span>
                </div>
              </div>
              <div className='rounded-2xl border border-slate-200 bg-[#F9FAFB] p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>
                  Validations
                </p>
                <div className='mt-3 space-y-2'>
                  {VALIDATION_OPTIONS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <label
                        key={item.key}
                        className='flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600'
                      >
                        <span className='flex items-center gap-2'>
                          <Icon size={16} className='text-slate-400' />
                          {item.label}
                        </span>
                        <input
                          type='checkbox'
                          checked={form.validations[item.key]}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              validations: {
                                ...form.validations,
                                [item.key]: e.target.checked,
                              },
                            })
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div className='flex items-center gap-2 text-xs text-slate-500'>
              <span className='rounded-full bg-[#EAF4EE] px-2 py-1 text-[#2F6B4F]'>
                {editing ? 'Editing task' : 'New task'}
              </span>
              <span>All fields are saved for admin review.</span>
            </div>
            <div className='flex justify-end gap-3'>
              <Button variant='ghost' onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <button
                onClick={handleSubmit}
                className='rounded-xl bg-[#2F6B4F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#285D44]'
              >
                {editing ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(completeTask)}
        onClose={closeCompleteModal}
        title='Submit Task Validation'
        maxWidth='lg'
        scrollableContent
        className='rounded-[24px]'
        contentClassName='p-6 bg-[#F8FAFB]'
      >
        {completeTask && (
          <div className='space-y-5'>
            <div className='rounded-2xl border border-slate-200 bg-white p-4'>
              <p className='text-sm font-semibold text-[#1F2937]'>{completeTask.title}</p>
              <p className='text-xs text-slate-500'>{completeTask.description}</p>
              <div className='mt-3 flex flex-wrap gap-2 text-xs text-slate-500'>
                <span className='rounded-full bg-[#F3F4F6] px-2 py-1'>
                  Outlet: {completeTask.outletName ?? 'All Outlets'}
                </span>
                <span className='rounded-full bg-[#F3F4F6] px-2 py-1'>
                  Date: {dayjs(completeTask.dueDate).format('DD MMM YYYY')}
                </span>
                {completeTask.startTime && completeTask.endTime && (
                  <span className='rounded-full bg-[#F3F4F6] px-2 py-1'>
                    Time: {completeTask.startTime} - {completeTask.endTime}
                  </span>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
              {completeTask.validations?.image && (
                <div className='rounded-2xl border border-slate-200 bg-white p-5'>
                  <p className='text-xs font-semibold uppercase text-slate-400'>Images</p>
                  <div className='mt-2 flex flex-wrap gap-3'>
                    <input
                      ref={imageCameraRef}
                      type='file'
                      accept='image/*'
                      capture='environment'
                      className='hidden'
                      onChange={(e) => handleEvidenceUpload('image', e.target.files)}
                    />
                    <input
                      ref={imageLibraryRef}
                      type='file'
                      accept='image/*'
                      multiple
                      className='hidden'
                      onChange={(e) => handleEvidenceUpload('image', e.target.files)}
                    />
                    <button
                      className='flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50'
                      onClick={() => imageCameraRef.current?.click()}
                    >
                      <Camera size={14} /> Take Photo
                    </button>
                    <button
                      className='flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50'
                      onClick={() => imageLibraryRef.current?.click()}
                    >
                      <Image size={14} /> Choose Photo
                    </button>
                  </div>
                  {evidence.image.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {evidence.image.map((img, index) => (
                        <img
                          key={`ev-img-${index}`}
                          src={img.dataUrl}
                          alt={img.name}
                          className='h-16 w-20 rounded-lg border border-slate-200 object-cover'
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {completeTask.validations?.video && (
                <div className='rounded-2xl border border-slate-200 bg-white p-5'>
                  <p className='text-xs font-semibold uppercase text-slate-400'>Video</p>
                  <div className='mt-2 flex flex-wrap gap-3'>
                    <input
                      ref={videoCameraRef}
                      type='file'
                      accept='video/*'
                      capture='environment'
                      className='hidden'
                      onChange={(e) => handleEvidenceUpload('video', e.target.files)}
                    />
                    <input
                      ref={videoLibraryRef}
                      type='file'
                      accept='video/*'
                      multiple
                      className='hidden'
                      onChange={(e) => handleEvidenceUpload('video', e.target.files)}
                    />
                    <button
                      className='flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50'
                      onClick={() => videoCameraRef.current?.click()}
                    >
                      <Video size={14} /> Record Video
                    </button>
                    <button
                      className='flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50'
                      onClick={() => videoLibraryRef.current?.click()}
                    >
                      <FolderOpen size={14} /> Choose Video
                    </button>
                  </div>
                  {evidence.video.length > 0 && (
                    <div className='mt-2 space-y-2'>
                      {evidence.video.map((vid, index) => (
                        <video
                          key={`ev-vid-${index}`}
                          src={vid.dataUrl}
                          controls
                          className='w-full rounded-lg border border-slate-200'
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {completeTask.validations?.audio && (
                <div className='rounded-2xl border border-slate-200 bg-white p-5'>
                  <p className='text-xs font-semibold uppercase text-slate-400'>Audio</p>
                  <div className='mt-2 flex flex-wrap gap-3'>
                    <input
                      ref={audioMicRef}
                      type='file'
                      accept='audio/*'
                      capture='user'
                      className='hidden'
                      onChange={(e) => handleEvidenceUpload('audio', e.target.files)}
                    />
                    <input
                      ref={audioLibraryRef}
                      type='file'
                      accept='audio/*'
                      multiple
                      className='hidden'
                      onChange={(e) => handleEvidenceUpload('audio', e.target.files)}
                    />
                    <button
                      className='flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60'
                      onClick={startAudioRecording}
                      disabled={isRecording}
                    >
                      <Mic size={14} /> {isRecording ? 'Recording...' : 'Use Microphone'}
                    </button>
                    <button
                      className='flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60'
                      onClick={stopAudioRecording}
                      disabled={!isRecording}
                    >
                      <StopCircle size={14} /> Stop Recording
                    </button>
                    <button
                      className='flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50'
                      onClick={() => audioLibraryRef.current?.click()}
                    >
                      <FolderOpen size={14} /> Choose Audio
                    </button>
                  </div>
                  {evidence.audio.length > 0 && (
                    <div className='mt-2 space-y-2'>
                      {evidence.audio.map((aud, index) => (
                        <audio
                          key={`ev-aud-${index}`}
                          src={aud.dataUrl}
                          controls
                          className='w-full'
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {completeTask.validations?.file && (
                <div className='rounded-2xl border border-slate-200 bg-white p-5'>
                  <p className='text-xs font-semibold uppercase text-slate-400'>Files</p>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    <input
                      ref={fileLibraryRef}
                      type='file'
                      multiple
                      className='hidden'
                      onChange={(e) => handleEvidenceUpload('file', e.target.files)}
                    />
                    <button
                      className='rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50'
                      onClick={() => fileLibraryRef.current?.click()}
                    >
                      Choose File
                    </button>
                  </div>
                  {evidence.file.length > 0 && (
                    <div className='mt-2 flex flex-col gap-2'>
                      {evidence.file.map((file, index) => (
                        <span
                          key={`ev-file-${index}`}
                          className='rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600'
                        >
                          {file.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {(completeTask.validations?.description ||
              completeTask.validations?.checklist ||
              completeTask.validations?.qna) && (
              <div className='rounded-2xl border border-slate-200 bg-white p-4 space-y-4'>
                {completeTask.validations?.description && (
                  <div>
                    <label className='text-xs font-semibold uppercase text-slate-400'>
                      Description
                    </label>
                    <textarea
                      className='mt-2 w-full rounded-xl border border-slate-200 bg-[#F9FAFB] px-3 py-2 text-sm'
                      rows={3}
                      value={evidence.description}
                      onChange={(e) =>
                        setEvidence((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </div>
                )}
                {completeTask.validations?.checklist && (
                  <div>
                    <label className='text-xs font-semibold uppercase text-slate-400'>
                      Checklist
                    </label>
                    <textarea
                      className='mt-2 w-full rounded-xl border border-slate-200 bg-[#F9FAFB] px-3 py-2 text-sm'
                      rows={3}
                      placeholder='One item per line'
                      value={evidence.checklist}
                      onChange={(e) =>
                        setEvidence((prev) => ({ ...prev, checklist: e.target.value }))
                      }
                    />
                  </div>
                )}
                {completeTask.validations?.qna && (
                  <div>
                    <label className='text-xs font-semibold uppercase text-slate-400'>Q&A</label>
                    <textarea
                      className='mt-2 w-full rounded-xl border border-slate-200 bg-[#F9FAFB] px-3 py-2 text-sm'
                      rows={3}
                      placeholder='Question | Answer (one per line)'
                      value={evidence.qna}
                      onChange={(e) => setEvidence((prev) => ({ ...prev, qna: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            )}

            <div className='flex justify-end gap-3'>
              <Button variant='ghost' onClick={closeCompleteModal}>
                Cancel
              </Button>
              <button
                onClick={handleCompleteSubmit}
                className='rounded-xl bg-[#2F6B4F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#285D44]'
              >
                Submit & Complete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
