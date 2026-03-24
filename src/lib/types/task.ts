export const TASK_KEYS = ['tasks'];

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'open' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  outletId?: string;
  outletName?: string;
  status: TaskStatus;
  assigneeIds: string[];
  assigneeNames?: string[];
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  completedAt?: string | null;
  completedBy?: string | null;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  outletId?: string;
  outletName?: string;
  status?: TaskStatus;
  assigneeIds: string[];
  assigneeNames?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  outletId?: string;
  outletName?: string;
  status?: TaskStatus;
  assigneeIds?: string[];
  assigneeNames?: string[];
  completedAt?: string | null;
  completedBy?: string | null;
}
