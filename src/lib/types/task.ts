export const TASK_KEYS = ['tasks'];

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'open' | 'in_progress' | 'completed';
export type TaskCategory = string;

export interface Task {
  id: string;
  title: string;
  description: string;
  comment?: string;
  priority: TaskPriority;
  dueDate: string;
  category?: TaskCategory;
  taskCategoryId?: string;
  outletId?: string;
  outletName?: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  adminAudioUrl?: string[];
  managerAudioUrl?: string[];
  managerComments?: string;
  /** @deprecated Use adminAudioUrl / managerAudioUrl */
  audioUrls?: string[];
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
  comment?: string;
  priority: TaskPriority;
  dueDate: string;
  taskCategoryId?: string;
  outletId?: string;
  outletName?: string;
  status?: TaskStatus;
  assigneeIds: string[];
  assigneeNames?: string[];
  imageUrls?: string[];
  videoUrls?: string[];
  adminAudioUrl?: string[];
  managerAudioUrl?: string[];
  managerComments?: string;
}

export interface UpdateTaskPayload {
  description?: string;
  comment?: string;
  priority?: TaskPriority;
  dueDate?: string;
  taskCategoryId?: string;
  status?: TaskStatus;
  assigneeIds?: string[];
  imageUrls?: string[];
  videoUrls?: string[];
  adminAudioUrl?: string[];
  managerAudioUrl?: string[];
  managerComments?: string;
}
