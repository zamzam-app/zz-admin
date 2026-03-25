export const TASK_KEYS = ['tasks'];

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'open' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  department?: string;
  repeat?: string;
  validations?: {
    image?: boolean;
    video?: boolean;
    audio?: boolean;
    file?: boolean;
    checklist?: boolean;
    qna?: boolean;
    description?: boolean;
  };
  validationEvidence?: {
    image?: Array<{ name: string; type: string; dataUrl: string }>;
    video?: Array<{ name: string; type: string; dataUrl: string }>;
    audio?: Array<{ name: string; type: string; dataUrl: string }>;
    file?: Array<{ name: string; type: string; dataUrl: string }>;
    checklist?: string[];
    qna?: Array<{ question: string; answer: string }>;
    description?: string;
  };
  validationSubmittedAt?: string | null;
  validationSubmittedBy?: string | null;
  outletId?: string;
  outletName?: string;
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
  priority: TaskPriority;
  dueDate: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  department?: string;
  repeat?: string;
  validations?: {
    image?: boolean;
    video?: boolean;
    audio?: boolean;
    file?: boolean;
    checklist?: boolean;
    qna?: boolean;
    description?: boolean;
  };
  validationEvidence?: {
    image?: Array<{ name: string; type: string; dataUrl: string }>;
    video?: Array<{ name: string; type: string; dataUrl: string }>;
    audio?: Array<{ name: string; type: string; dataUrl: string }>;
    file?: Array<{ name: string; type: string; dataUrl: string }>;
    checklist?: string[];
    qna?: Array<{ question: string; answer: string }>;
    description?: string;
  };
  validationSubmittedAt?: string | null;
  validationSubmittedBy?: string | null;
  outletId?: string;
  outletName?: string;
  status?: TaskStatus;
  assigneeIds: string[];
  assigneeNames?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  department?: string;
  repeat?: string;
  validations?: {
    image?: boolean;
    video?: boolean;
    audio?: boolean;
    file?: boolean;
    checklist?: boolean;
    qna?: boolean;
    description?: boolean;
  };
  validationEvidence?: {
    image?: Array<{ name: string; type: string; dataUrl: string }>;
    video?: Array<{ name: string; type: string; dataUrl: string }>;
    audio?: Array<{ name: string; type: string; dataUrl: string }>;
    file?: Array<{ name: string; type: string; dataUrl: string }>;
    checklist?: string[];
    qna?: Array<{ question: string; answer: string }>;
    description?: string;
  };
  validationSubmittedAt?: string | null;
  validationSubmittedBy?: string | null;
  outletId?: string;
  outletName?: string;
  status?: TaskStatus;
  assigneeIds?: string[];
  assigneeNames?: string[];
  completedAt?: string | null;
  completedBy?: string | null;
}
