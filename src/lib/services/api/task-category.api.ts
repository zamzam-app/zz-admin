import api from './axios';
import { TASKS } from './endpoints';
import type { TaskCategory } from '../../types/task';

export const taskCategoryApi = {
  /** GET /tasks/categories — returns list of task categories */
  findAll: async (): Promise<TaskCategory[]> => {
    const res = await api.get<TaskCategory[]>(TASKS.CATEGORIES);
    return res.data || [];
  },
};
