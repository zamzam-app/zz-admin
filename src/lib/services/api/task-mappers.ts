import type {
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TaskSubmission,
} from '../../types/task';

/** Backend enum strings (NestJS class-validator / Swagger) */
export type ApiTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ApiTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export interface ApiTaskRaw {
  _id?: string;
  id?: string;
  description?: string;
  comment?: string;
  category?: string;
  taskCategoryId?: string | { _id?: string; id?: string; name?: string };
  taskCategory?: string | { _id?: string; id?: string; name?: string };
  taskCategoryName?: string;
  priority?: string;
  status?: string;
  dueDate?: string | Date;
  outletId?: string | { _id?: string; name?: string };
  /** Populated outlet from GET /tasks list (Nest populate) */
  outlet?: { _id?: string; name?: string };
  outletName?: string;
  assigneeIds?: Array<string | { _id?: string }>;
  assigneeNames?: string[];
  /** Populated assignees from GET /tasks list */
  assignees?: Array<{ _id?: string; name?: string }>;
  imageUrls?: string[];
  videoUrls?: string[];
  adminAudioUrl?: string[];
  managerAudioUrl?: string[];
  managerComments?: string;
  /** @deprecated backend legacy */
  audioUrls?: string[];
  createdBy?: string | { _id?: string; name?: string };
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  completedBy?: string | null;

  adminSubmission?: TaskSubmission;
  managerSubmission?: TaskSubmission;
}

const PRIORITY_TO_API: Record<TaskPriority, ApiTaskPriority> = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
};

const STATUS_TO_API: Record<TaskStatus, ApiTaskStatus> = {
  open: 'OPEN',
  in_progress: 'IN_PROGRESS',
  completed: 'COMPLETED',
};

function parseApiCategory(v: string | undefined): TaskCategory | undefined {
  return v?.trim() || undefined;
}

function extractEntityId(
  input?: string | { _id?: string; id?: string; name?: string } | null,
): string | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') return input;
  if (typeof input === 'object') {
    if (input._id) return String(input._id);
    if (input.id) return String(input.id);
  }
  return undefined;
}

function extractEntityName(
  input?: string | { _id?: string; id?: string; name?: string } | null,
): string | undefined {
  if (!input || typeof input === 'string') return undefined;
  if (typeof input.name === 'string' && input.name.trim()) return input.name.trim();
  return undefined;
}

function parseApiPriority(v: string | undefined): TaskPriority {
  if (!v) return 'medium';
  const u = v.toUpperCase();
  const map: Record<string, TaskPriority> = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'high',
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

function extractAssignees(raw: ApiTaskRaw): { ids: string[]; names: string[] } {
  if (Array.isArray(raw.assignees) && raw.assignees.length > 0) {
    const ids: string[] = [];
    const names: string[] = [];
    for (const a of raw.assignees) {
      if (!a || typeof a !== 'object') continue;
      if (a._id) ids.push(String(a._id));
      if (typeof a.name === 'string' && a.name.trim()) names.push(a.name.trim());
    }
    return { ids, names };
  }
  const ids = normalizeAssigneeIds(raw.assigneeIds);
  const names = Array.isArray(raw.assigneeNames) ? raw.assigneeNames.filter(Boolean) : [];
  return { ids, names };
}

function resolveOutletId(raw: ApiTaskRaw): string | undefined {
  if (raw.outlet && typeof raw.outlet === 'object' && raw.outlet._id) {
    return String(raw.outlet._id);
  }
  return extractOutletId(raw.outletId);
}

function resolveOutletName(raw: ApiTaskRaw): string | undefined {
  if (raw.outletName?.trim()) return raw.outletName.trim();
  if (raw.outlet && typeof raw.outlet === 'object' && typeof raw.outlet.name === 'string') {
    return raw.outlet.name;
  }
  return extractOutletName(raw.outletId);
}

function resolveTaskCategoryId(raw: ApiTaskRaw): string | undefined {
  return extractEntityId(raw.taskCategoryId) ?? extractEntityId(raw.taskCategory);
}

function resolveTaskCategoryName(raw: ApiTaskRaw): string | undefined {
  if (raw.taskCategoryName?.trim()) return raw.taskCategoryName.trim();
  return (
    extractEntityName(raw.taskCategoryId) ??
    extractEntityName(raw.taskCategory) ??
    parseApiCategory(raw.category)
  );
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

  const { ids: assigneeIds, names: assigneeNames } = extractAssignees(raw);

  // Fallback Logic
  const adminSubmission = raw.adminSubmission;
  const managerSubmission = raw.managerSubmission;

  const imageUrls =
    adminSubmission || managerSubmission
      ? [
          ...(adminSubmission?.attachments?.images ?? []),
          ...(managerSubmission?.attachments?.images ?? []),
        ]
      : raw.imageUrls;

  const videoUrls =
    adminSubmission || managerSubmission
      ? [
          ...(adminSubmission?.attachments?.videos ?? []),
          ...(managerSubmission?.attachments?.videos ?? []),
        ]
      : raw.videoUrls;

  const adminAudioUrl = adminSubmission
    ? (adminSubmission.attachments?.audios ?? [])
    : raw.adminAudioUrl;

  const managerAudioUrl = managerSubmission
    ? (managerSubmission.attachments?.audios ?? [])
    : raw.managerAudioUrl;

  const fileUrls =
    adminSubmission || managerSubmission
      ? [
          ...(adminSubmission?.attachments?.files ?? []),
          ...(managerSubmission?.attachments?.files ?? []),
        ]
      : [];

  const managerComments = managerSubmission ? managerSubmission.text : raw.managerComments;

  const comment = adminSubmission ? adminSubmission.text : raw.comment;

  const firstImg = Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls[0] : undefined;

  return {
    id,
    title,
    description,
    comment,
    priority: parseApiPriority(raw.priority),
    dueDate: due,
    category: resolveTaskCategoryName(raw),
    taskCategoryId: resolveTaskCategoryId(raw),
    outletId: resolveOutletId(raw),
    outletName: resolveOutletName(raw),
    imageUrl: firstImg,
    imageUrls,
    videoUrls,
    adminAudioUrl,
    managerAudioUrl,
    fileUrls,
    managerComments,
    audioUrls: raw.audioUrls,
    status: parseApiStatus(raw.status),
    assigneeIds,
    assigneeNames: assigneeNames.length > 0 ? assigneeNames : raw.assigneeNames,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    createdBy: raw.createdBy
      ? typeof raw.createdBy === 'string'
        ? raw.createdBy
        : String((raw.createdBy as { _id?: string })._id ?? '')
      : undefined,
    updatedAt: raw.updatedAt,
    completedAt: raw.completedAt ?? null,
    completedBy: raw.completedBy ?? null,
    adminSubmission,
    managerSubmission,
  };
}

export function toApiPriority(p: TaskPriority): ApiTaskPriority {
  return PRIORITY_TO_API[p];
}

export function toApiStatus(s: TaskStatus): ApiTaskStatus {
  return STATUS_TO_API[s];
}
