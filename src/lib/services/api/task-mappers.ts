import type { Task, TaskCategory, TaskPriority, TaskStatus } from '../../types/task';

/** Backend enum strings (NestJS class-validator / Swagger) */
export type ApiTaskCategory = 'HYGIENE' | 'MAINTENANCE' | 'INVENTORY' | 'STAFFING';
export type ApiTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ApiTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export interface ApiTaskRaw {
  _id?: string;
  id?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  dueDate?: string | Date;
  outletId?: string | { _id?: string; name?: string };
  outletName?: string;
  assigneeIds?: Array<string | { _id?: string }>;
  assigneeNames?: string[];
  imageUrls?: string[];
  videoUrls?: string[];
  createdBy?: string | { _id?: string };
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  completedBy?: string | null;
}

const CATEGORY_TO_API: Record<TaskCategory, ApiTaskCategory> = {
  hygiene: 'HYGIENE',
  maintenance: 'MAINTENANCE',
  inventory: 'INVENTORY',
  staffing: 'STAFFING',
};

const PRIORITY_TO_API: Record<TaskPriority, ApiTaskPriority> = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  urgent: 'URGENT',
};

const STATUS_TO_API: Record<TaskStatus, ApiTaskStatus> = {
  open: 'OPEN',
  in_progress: 'IN_PROGRESS',
  completed: 'COMPLETED',
};

function parseApiCategory(v: string | undefined): TaskCategory | undefined {
  if (!v) return undefined;
  const u = v.toUpperCase();
  const map: Record<string, TaskCategory> = {
    HYGIENE: 'hygiene',
    MAINTENANCE: 'maintenance',
    INVENTORY: 'inventory',
    STAFFING: 'staffing',
  };
  return (
    map[u] ??
    (['hygiene', 'maintenance', 'inventory', 'staffing'].includes(v.toLowerCase())
      ? (v.toLowerCase() as TaskCategory)
      : undefined)
  );
}

function parseApiPriority(v: string | undefined): TaskPriority {
  if (!v) return 'medium';
  const u = v.toUpperCase();
  const map: Record<string, TaskPriority> = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  };
  return map[u] ?? 'medium';
}

function parseApiStatus(v: string | undefined): TaskStatus {
  if (!v) return 'open';
  const u = v.toUpperCase().replace(/-/g, '_');
  if (u === 'OPEN') return 'open';
  if (u === 'IN_PROGRESS') return 'in_progress';
  if (u === 'COMPLETED') return 'completed';
  return 'open';
}

function extractOutletId(outletId: ApiTaskRaw['outletId']): string | undefined {
  if (outletId == null) return undefined;
  if (typeof outletId === 'string') return outletId;
  if (typeof outletId === 'object' && '_id' in outletId && outletId._id) {
    return String(outletId._id);
  }
  return undefined;
}

function extractOutletName(
  outletId: ApiTaskRaw['outletId'],
  fallback?: string,
): string | undefined {
  if (fallback) return fallback;
  if (
    typeof outletId === 'object' &&
    outletId &&
    'name' in outletId &&
    typeof outletId.name === 'string'
  ) {
    return outletId.name;
  }
  return undefined;
}

function normalizeAssigneeIds(ids: ApiTaskRaw['assigneeIds']): string[] {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((x) => {
      if (typeof x === 'string') return x;
      if (x && typeof x === 'object' && '_id' in x && x._id) return String(x._id);
      return '';
    })
    .filter(Boolean);
}

export function mapApiTaskToTask(raw: ApiTaskRaw): Task {
  const id = String(raw._id ?? raw.id ?? '');
  const description = String(raw.description ?? '');
  const title = description.split('\n')[0]?.trim().slice(0, 120) || 'Task';
  const due =
    raw.dueDate instanceof Date
      ? raw.dueDate.toISOString()
      : typeof raw.dueDate === 'string'
        ? raw.dueDate
        : new Date().toISOString();

  const imgs = raw.imageUrls;
  const firstImg = Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : undefined;

  return {
    id,
    title,
    description,
    priority: parseApiPriority(raw.priority),
    dueDate: due,
    category: parseApiCategory(raw.category),
    outletId: extractOutletId(raw.outletId),
    outletName: raw.outletName ?? extractOutletName(raw.outletId),
    imageUrl: firstImg,
    imageUrls: imgs,
    status: parseApiStatus(raw.status),
    assigneeIds: normalizeAssigneeIds(raw.assigneeIds),
    assigneeNames: raw.assigneeNames,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    createdBy: raw.createdBy
      ? typeof raw.createdBy === 'string'
        ? raw.createdBy
        : String((raw.createdBy as { _id?: string })._id ?? '')
      : undefined,
    updatedAt: raw.updatedAt,
    completedAt: raw.completedAt ?? null,
    completedBy: raw.completedBy ?? null,
  };
}

export function toApiCategory(c: TaskCategory): ApiTaskCategory {
  return CATEGORY_TO_API[c];
}

export function toApiPriority(p: TaskPriority): ApiTaskPriority {
  return PRIORITY_TO_API[p];
}

export function toApiStatus(s: TaskStatus): ApiTaskStatus {
  return STATUS_TO_API[s];
}
