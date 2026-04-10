import api from './axios';
import { TASK_CATEGORY } from './endpoints';
import type {
  CreateTaskCategoryPayload,
  TaskCategory,
  TaskCategoryListResponse,
  UpdateTaskCategoryPayload,
} from '../../types/task-category';

export const taskCategoryApi = {
  /** GET /task-category — returns paginated list of task categories (query: page, limit) */
  getTaskCategories: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<TaskCategoryListResponse> => {
    const res = await api.get<TaskCategoryListResponse>(TASK_CATEGORY.BASE, { params });
    return {
      data: res.data?.data ?? [],
      meta: res.data?.meta ?? {
        total: 0,
        currentPage: 1,
        hasPrevPage: false,
        hasNextPage: false,
        limit: 10,
      },
    };
  },

  /** POST /task-category — create task category */
  create: async (data: CreateTaskCategoryPayload): Promise<TaskCategory> => {
    const res = await api.post<TaskCategory>(TASK_CATEGORY.BASE, data);
    return res.data;
  },

  /** PATCH /task-category/:id — update task category */
  update: async (id: string, data: UpdateTaskCategoryPayload): Promise<TaskCategory> => {
    const res = await api.patch<TaskCategory>(TASK_CATEGORY.BY_ID(id), data);
    return res.data;
  },

  /** DELETE /task-category/:id — delete task category */
  delete: async (id: string): Promise<void> => {
    await api.delete(TASK_CATEGORY.BY_ID(id));
  },
};
