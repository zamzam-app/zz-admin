export const TASK_KEYS = ['tasks'];

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'COMPLETED';

export interface TaskAttachmentGroup {
  images: string[];
  videos: string[];
  audios: string[];
  files: string[];
}

export interface TaskUserRef {
  _id: string;
  name?: string;
}

export interface TaskSubmission {
  text?: string;
  attachments: TaskAttachmentGroup;
  createdBy: TaskUserRef;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCategory {
  _id: string;
  name: string;
  description?: string;
}

export interface Task {
  id: string;
  description: string;
  taskCategory: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  completedAt?: string | null;
  adminSubmission?: TaskSubmission;
  managerSubmission?: TaskSubmission;
  outlet: { _id: string; name: string } | null;
  assignees: TaskUserRef[];
  createdBy: TaskUserRef;
  createdAt: string;
  updatedAt: string;

  // Computed / UI helper fields (not from backend directly but often used in frontend)
  title: string;
}

export interface CreateTaskPayload {
  description: string;
  taskCategoryId: string;
  dueDate: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  outletId?: string;
  assigneeIds?: string[];
  adminSubmission?: {
    text?: string;
    attachments?: Partial<TaskAttachmentGroup>;
  };
  managerSubmission?: {
    text?: string;
    attachments?: Partial<TaskAttachmentGroup>;
  };
}

export interface UpdateTaskPayload {
  description?: string;
  taskCategoryId?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  outletId?: string;
  assigneeIds?: string[];
  adminSubmission?: {
    text?: string;
    attachments?: Partial<TaskAttachmentGroup>;
  };
  managerSubmission?: {
    text?: string;
    attachments?: Partial<TaskAttachmentGroup>;
  };
}
