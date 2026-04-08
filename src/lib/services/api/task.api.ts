import axios from 'axios';
import api from './axios';
import { TASKS } from './endpoints';
import type { QueryTaskDto } from '../../types/task-query';
import type {
  CreateTaskPayload,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskPayload,
} from '../../types/task';
import {
  mapApiTaskToTask,
  toApiCategory,
  toApiPriority,
  toApiStatus,
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

/** POST /tasks body — matches backend CreateTaskDto */
interface CreateTaskDtoBody {
  description: string;
  comment?: string;
  category: string;
  priority?: string;
  status?: string;
  dueDate: string;
  outletId: string;
  assigneeIds?: string[];
  imageUrls?: string[];
  videoUrls?: string[];
  adminAudioUrl?: string[];
  managerAudioUrl?: string[];
  managerComments?: string;
}

function buildCreateBody(payload: CreateTaskPayload): CreateTaskDtoBody {
  if (!payload.outletId) {
    throw new Error('outletId is required');
  }
  if (!payload.category) {
    throw new Error('category is required');
  }
  const body: CreateTaskDtoBody = {
    description: payload.description.trim(),
    category: toApiCategory(payload.category),
    dueDate: payload.dueDate,
    outletId: payload.outletId,
  };
  body.priority = toApiPriority(payload.priority);
  if (payload.status) {
    body.status = toApiStatus(payload.status);
  }
  if (payload.assigneeIds.length > 0) {
    body.assigneeIds = payload.assigneeIds;
  }
  if (payload.comment?.trim()) body.comment = payload.comment.trim();
  if (payload.imageUrls && payload.imageUrls.length > 0) body.imageUrls = payload.imageUrls;
  if (payload.videoUrls && payload.videoUrls.length > 0) body.videoUrls = payload.videoUrls;
  if (payload.adminAudioUrl && payload.adminAudioUrl.length > 0) {
    body.adminAudioUrl = payload.adminAudioUrl;
  }
  if (payload.managerAudioUrl && payload.managerAudioUrl.length > 0) {
    body.managerAudioUrl = payload.managerAudioUrl;
  }
  if (payload.managerComments !== undefined) body.managerComments = payload.managerComments;
  return body;
}

function buildUpdateBody(payload: UpdateTaskPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.description !== undefined) body.description = payload.description.trim();
  if (payload.comment !== undefined) body.comment = payload.comment.trim();
  if (payload.category !== undefined) body.category = toApiCategory(payload.category);
  if (payload.priority !== undefined) body.priority = toApiPriority(payload.priority);
  if (payload.status !== undefined) body.status = toApiStatus(payload.status);
  if (payload.dueDate !== undefined) body.dueDate = payload.dueDate;
  if (payload.assigneeIds !== undefined) body.assigneeIds = payload.assigneeIds;
  if (payload.imageUrls !== undefined) body.imageUrls = payload.imageUrls;
  if (payload.videoUrls !== undefined) body.videoUrls = payload.videoUrls;
  if (payload.adminAudioUrl !== undefined) body.adminAudioUrl = payload.adminAudioUrl;
  if (payload.managerAudioUrl !== undefined) body.managerAudioUrl = payload.managerAudioUrl;
  if (payload.managerComments !== undefined) body.managerComments = payload.managerComments;
  return body;
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
  filterPriority?: 'all' | TaskPriority;
}): QueryTaskDto {
  const q: QueryTaskDto = { page: 1, limit: 100 };
  if (input.filterOutletId !== 'all') {
    q.outletId = input.filterOutletId;
  }
  if (input.filterStatus !== 'all') {
    q.status = toApiStatus(input.filterStatus as TaskStatus);
  }
  if (input.filterPriority && input.filterPriority !== 'all') {
    q.priority = toApiPriority(input.filterPriority);
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

  /** @deprecated Prefer findAll with explicit query */
  getAll: async (): Promise<Task[]> => {
    return tasksApi.findAll({ page: 1, limit: 100 });
  },

  getByAssignee: async (assigneeId: string): Promise<Task[]> => {
    return tasksApi.findAll({ assigneeId, page: 1, limit: 100 });
  },

  create: async (payload: CreateTaskPayload & { createdBy?: string }): Promise<Task> => {
    const body = buildCreateBody(payload);
    const res = await api.post<ApiTaskRaw>(TASKS.BASE, body);
    return mapApiTaskToTask(res.data);
  },

  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    const body = buildUpdateBody(payload);
    if (Object.keys(body).length === 0) {
      const all = await tasksApi.findAll({ page: 1, limit: 500 });
      const found = all.find((t) => t.id === id);
      if (!found) throw new Error('Task not found');
      return found;
    }
    const res = await api.patch<ApiTaskRaw>(TASKS.BY_ID(id), body);
    return mapApiTaskToTask(res.data);
  },

  updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    const res = await api.patch<ApiTaskRaw>(TASKS.STATUS(id), { status: toApiStatus(status) });
    return mapApiTaskToTask(res.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(TASKS.BY_ID(id));
  },

  complete: async (id: string): Promise<Task> => {
    return tasksApi.updateStatus(id, 'completed');
  },

  getUnreadCount: async (assigneeId: string): Promise<number> => {
    const list = await tasksApi.findAll({ assigneeId, page: 1, limit: 200 });
    return list.filter((task) => task.status !== 'completed').length;
  },

  getNewAssignmentsSince: async (assigneeId: string, sinceIso: string): Promise<Task[]> => {
    const list = await tasksApi.findAll({ assigneeId, page: 1, limit: 200 });
    return list.filter((task) => task.status !== 'completed' && task.createdAt > sinceIso);
  },
};
