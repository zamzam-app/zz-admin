import type { Task, TaskPriority, TaskStatus, TaskSubmission } from '../../types/task';

export interface ApiTaskRaw {
  _id: string;
  description: string;
  taskCategory: { _id: string; name: string; description?: string };
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'COMPLETED';
  dueDate: string;
  completedAt?: string | null;
  adminSubmission?: {
    text?: string;
    attachments: {
      images: string[];
      videos: string[];
      audios: string[];
      files: string[];
    };
    createdBy: { _id: string; name?: string };
    createdAt: string;
    updatedAt: string;
  };
  managerSubmission?: {
    text?: string;
    attachments: {
      images: string[];
      videos: string[];
      audios: string[];
      files: string[];
    };
    createdBy: { _id: string; name?: string };
    createdAt: string;
    updatedAt: string;
  };
  outlet: { _id: string; name: string } | null;
  assignees: Array<{ _id: string; name?: string }>;
  createdBy: { _id: string; name?: string };
  createdAt: string;
  updatedAt: string;
}

function mapSubmission(sub?: ApiTaskRaw['adminSubmission']): TaskSubmission | undefined {
  if (!sub) return undefined;
  return {
    text: sub.text,
    attachments: {
      images: sub.attachments.images || [],
      videos: sub.attachments.videos || [],
      audios: sub.attachments.audios || [],
      files: sub.attachments.files || [],
    },
    createdBy: { _id: sub.createdBy._id, name: sub.createdBy.name },
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  };
}

export function mapApiTaskToTask(raw: ApiTaskRaw): Task {
  return {
    id: raw._id,
    description: raw.description,
    taskCategory: {
      _id: raw.taskCategory._id,
      name: raw.taskCategory.name,
      description: raw.taskCategory.description,
    },
    priority: raw.priority as TaskPriority,
    status: raw.status as TaskStatus,
    dueDate: raw.dueDate,
    completedAt: raw.completedAt,
    adminSubmission: mapSubmission(raw.adminSubmission),
    managerSubmission: mapSubmission(raw.managerSubmission),
    outlet: raw.outlet ? { _id: raw.outlet._id, name: raw.outlet.name } : null,
    assignees: raw.assignees.map(a => ({ _id: a._id, name: a.name })),
    createdBy: { _id: raw.createdBy._id, name: raw.createdBy.name },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    title: raw.description.split('\n')[0].trim().slice(0, 120) || 'Task',
  };
}

// These are simpler now since the backend uses the strings directly
export function toApiStatus(s: TaskStatus): string {
  return s;
}

export function toApiPriority(p: TaskPriority): string {
  return p;
}
