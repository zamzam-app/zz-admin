export const TASK_CATEGORY_KEYS = ['task-categories'];

export interface TaskCategoryListMeta {
  total: number;
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  limit: number;
}

export interface TaskCategory {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskCategoryListResponse {
  data: TaskCategory[];
  meta: TaskCategoryListMeta;
}

export interface CreateTaskCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateTaskCategoryPayload {
  name?: string;
  description?: string;
}
