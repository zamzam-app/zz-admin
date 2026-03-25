import type { CreateTaskPayload, Task, UpdateTaskPayload, TaskStatus } from '../../types/task';

const STORAGE_KEY = 'zz_tasks_v1';

function readTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Task[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTasks(tasks: Task[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function nowIso() {
  return new Date().toISOString();
}

export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    return readTasks().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getByAssignee: async (assigneeId: string): Promise<Task[]> => {
    return readTasks()
      .filter((task) => task.assigneeIds.includes(assigneeId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  create: async (payload: CreateTaskPayload & { createdBy?: string }): Promise<Task> => {
    const tasks = readTasks();
    const task: Task = {
      id: crypto.randomUUID(),
      title: payload.title.trim(),
      description: payload.description.trim(),
      priority: payload.priority,
      dueDate: payload.endDate ?? payload.dueDate,
      startDate: payload.startDate,
      endDate: payload.endDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      department: payload.department,
      repeat: payload.repeat,
      validations: payload.validations,
      validationEvidence: payload.validationEvidence,
      validationSubmittedAt: payload.validationSubmittedAt ?? null,
      validationSubmittedBy: payload.validationSubmittedBy ?? null,
      outletId: payload.outletId,
      outletName: payload.outletName,
      status: payload.status ?? 'open',
      assigneeIds: payload.assigneeIds,
      assigneeNames: payload.assigneeNames,
      createdAt: nowIso(),
      createdBy: payload.createdBy,
      updatedAt: nowIso(),
      completedAt: null,
      completedBy: null,
    };
    writeTasks([task, ...tasks]);
    return task;
  },

  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    const tasks = readTasks();
    const next = tasks.map((task) => {
      if (task.id !== id) return task;
      return {
        ...task,
        ...payload,
        updatedAt: nowIso(),
      };
    });
    writeTasks(next);
    const updated = next.find((task) => task.id === id);
    if (!updated) throw new Error('Task not found');
    return updated;
  },

  remove: async (id: string): Promise<void> => {
    const tasks = readTasks().filter((task) => task.id !== id);
    writeTasks(tasks);
  },

  complete: async (id: string, completedBy?: string): Promise<Task> => {
    const tasks = readTasks();
    const next = tasks.map((task) => {
      if (task.id !== id) return task;
      return {
        ...task,
        status: 'completed' as TaskStatus,
        completedAt: nowIso(),
        completedBy: completedBy ?? null,
        updatedAt: nowIso(),
      };
    });
    writeTasks(next);
    const updated = next.find((task) => task.id === id);
    if (!updated) throw new Error('Task not found');
    return updated;
  },

  getUnreadCount: async (assigneeId: string): Promise<number> => {
    return readTasks().filter(
      (task) => task.assigneeIds.includes(assigneeId) && task.status !== 'completed',
    ).length;
  },

  getNewAssignmentsSince: async (assigneeId: string, sinceIso: string): Promise<Task[]> => {
    return readTasks().filter(
      (task) =>
        task.assigneeIds.includes(assigneeId) &&
        task.status !== 'completed' &&
        task.createdAt > sinceIso,
    );
  },
};
