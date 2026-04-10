import axios from 'axios';
import api from './axios';
import { TASKS } from './endpoints';
import type { QueryTaskDto } from '../../types/task-query';
import type { CreateTaskPayload, Task, TaskStatus, UpdateTaskPayload } from '../../types/task';
import {
  mapApiTaskToTask,
  type ApiTaskRaw,
} from './task-mappers';

function unwrapTaskList(data: unknown): ApiTaskRaw[] {
  if (Array.isArray(data)) return data as ApiTaskRaw[];
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  const candidates = [o.data, o.items, o.tasks, o.results];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as ApiTaskRaw[];
  }
  return [];
}

/** Drop undefined so axios does not send empty query keys */
function cleanQueryParams(q: QueryTaskDto): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v as string | number;
  }
  return out;
}

export function getTaskApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const m = data?.message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.join(', ');
    if (error.response?.status === 404) return 'Not found';
    if (error.response?.status === 403) return 'Forbidden';
  }
  if (error instanceof Error) return error.message;
  return 'Request failed';
}

/**
 * Maps Tasks page / sidebar filters to GET /tasks query (QueryTaskDto).
 */
export function buildTaskListQuery(input: {
  role: string;
  userId: string;
  filterOutletId: string;
  filterStatus: string;
}): QueryTaskDto {
  const q: QueryTaskDto = { page: 1, limit: 100 };
  if (input.filterOutletId !== 'all') {
    q.outletId = input.filterOutletId;
  }
  if (input.filterStatus !== 'all') {
    q.status = input.filterStatus;
  }
  if (input.role !== 'admin' && input.userId) {
    q.assigneeId = input.userId;
  }
  return q;
}

export const tasksApi = {
  /**
   * GET /tasks — QueryTaskDto as query string (page, limit, outletId, status, assigneeId, …).
   */
  findAll: async (query: QueryTaskDto = {}): Promise<Task[]> => {
    const params = cleanQueryParams({ page: 1, limit: 100, ...query });
    const res = await api.get<unknown>(TASKS.BASE, { params });
    const list = unwrapTaskList(res.data);
    return list.map((item) => mapApiTaskToTask(item));
  },

  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const res = await api.post<ApiTaskRaw>(TASKS.BASE, payload);
    return mapApiTaskToTask(res.data);
  },

  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    const res = await api.patch<ApiTaskRaw>(TASKS.BY_ID(id), payload);
    return mapApiTaskToTask(res.data);
  },

  updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    const res = await api.patch<ApiTaskRaw>(TASKS.STATUS(id), { status });
    return mapApiTaskToTask(res.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(TASKS.BY_ID(id));
  },

  complete: async (id: string): Promise<Task> => {
    return tasksApi.updateStatus(id, 'COMPLETED');
  },

  getUnreadCount: async (assigneeId: string): Promise<number> => {
    const list = await tasksApi.findAll({ assigneeId, page: 1, limit: 200 });
    return list.filter((task) => task.status !== 'COMPLETED').length;
  },
};
