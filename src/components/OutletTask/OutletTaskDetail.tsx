import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { useImageUpload } from '../../lib/hooks/useImageUpload';
import { useMicRecording } from '../../lib/hooks/useMicRecording';
import { useApiMutation, useApiQuery } from '../../lib/react-query/use-api-hooks';
import { OUTLET_KEYS } from '../../lib/types/outlet';
import { TASK_KEYS, type Task, type TaskStatus } from '../../lib/types/task';
import LoadingSpinner from '../common/LoadingSpinner';
import { AdminAudioSection } from './AdminAudioSection';
import { NotesAttachmentsSection } from './NotesAttachmentsSection';
import { TaskMetaHeader } from './TaskMetaHeader';
import type {
  AttachmentKind,
  PendingAttachment,
  UploadedAttachment,
} from './outletTaskAttachment.types';
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  inferAttachmentKind,
  isAllowedAttachmentFile,
  mediaNameFromUrl,
} from './outletTaskAttachment.utils';

const STATUS_BADGE: Record<TaskStatus, { label: string; className: string }> = {
  open: {
    label: 'ASSIGNED',
    className: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100',
  },
  in_progress: {
    label: 'IN PROGRESS',
    className: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-100',
  },
  completed: {
    label: 'COMPLETED',
    className: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100',
  },
};

type CompletePayload = {
  id: string;
  managerComments: string;
  imageUrls: string[];
  videoUrls: string[];
  managerAudioUrl: string[];
};

function formatCategoryLabel(category: string | undefined) {
  if (!category) return '';
  const lower = category.toLowerCase();
  if (['hygiene', 'maintenance', 'inventory', 'staffing'].includes(lower)) {
    return lower.toUpperCase();
  }
  return category.toUpperCase();
}

export default function OutletTaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? 'staff';
  const userId = user?.id ?? user?._id ?? '';

  const listQueryKey: unknown[] = ['tasks', 'outlet-tasks', userId, 'all'];

  const { data: tasks = [], isLoading } = useApiQuery(
    listQueryKey,
    () =>
      import('../../lib/services/api/task.api').then((m) =>
        m.tasksApi.findAll(
          m.buildTaskListQuery({
            role,
            userId,
            filterOutletId: 'all',
            filterStatus: 'all',
          }),
        ),
      ),
    { enabled: !!userId && !!taskId },
  );

  const { data: outlets = [] } = useApiQuery(OUTLET_KEYS, () =>
    import('../../lib/services/api/outlet.api').then((mod) => mod.outletApi.getOutletsList()),
  );

  const assignedOutletIds = useMemo(() => {
    if (!user) return null;
    if (Array.isArray(user.outletId) && user.outletId.length > 0) return user.outletId;
    if (!userId) return [];
    return outlets
      .filter((outlet) => outlet.managerIds?.includes(userId) || outlet.managerId === userId)
      .map((outlet) => outlet.id);
  }, [outlets, user, userId]);

  const boardTasks = useMemo(() => {
    if (!assignedOutletIds || assignedOutletIds.length === 0) return tasks;
    return tasks.filter((t) => !t.outletId || assignedOutletIds.includes(t.outletId));
  }, [tasks, assignedOutletIds]);

  const task = useMemo(() => boardTasks.find((t) => t.id === taskId), [boardTasks, taskId]);

  const [note, setNote] = useState('');
  const { upload, clearError: clearUploadError } = useImageUpload('tasks');
  const taskNoteSource = task?.managerComments ?? '';
  const currentTaskId = task?.id ?? '';

  useEffect(() => {
    if (!currentTaskId) return;
    setNote(taskNoteSource);
  }, [currentTaskId, taskNoteSource]);

  const completeMutation = useApiMutation(
    (payload: CompletePayload) =>
      import('../../lib/services/api/task.api').then((m) =>
        m.tasksApi.update(payload.id, {
          status: 'completed',
          managerComments: payload.managerComments,
          imageUrls: payload.imageUrls,
          videoUrls: payload.videoUrls,
          managerAudioUrl: payload.managerAudioUrl,
        }),
      ),
    [TASK_KEYS, listQueryKey],
    {
      onSuccess: () => {
        message.success('Task marked as completed.');
        navigate('/outlet-tasks');
      },
      onError: (e) =>
        void import('../../lib/services/api/task.api').then((m) =>
          message.error(m.getTaskApiErrorMessage(e)),
        ),
    },
  );

  if (!taskId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className='-mx-6 -mb-6 flex min-h-[40vh] items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  if (!task) {
    return (
      <div className='-mx-6 -mb-6 flex min-h-0 flex-col gap-6 bg-[#F8F9FA] px-6 pb-8 lg:px-8'>
        <div className='rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm'>
          <p className='font-semibold text-slate-700'>Task not found</p>
          <p className='mt-1 text-sm text-slate-500'>
            It may have been removed or you may not have access.
          </p>
          <Link
            to='/outlet-tasks'
            className='mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#705E0C] hover:underline'
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <OutletTaskDetailContent
      task={task}
      note={note}
      setNote={setNote}
      completeMutation={completeMutation}
      upload={upload}
      clearUploadError={clearUploadError}
    />
  );
}

function OutletTaskDetailContent({
  task,
  note,
  setNote,
  completeMutation,
  upload,
  clearUploadError,
}: {
  task: Task;
  note: string;
  setNote: (v: string) => void;
  completeMutation: ReturnType<typeof useApiMutation<Task, CompletePayload>>;
  upload: (file: File) => Promise<string>;
  clearUploadError: () => void;
}) {
  const badge = STATUS_BADGE[task.status];
  const headlineName = task.outletName?.trim() || task.title;
  const categoryLabel = formatCategoryLabel(task.category);

  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  const uploadedAttachments = useMemo<UploadedAttachment[]>(() => {
    const items: UploadedAttachment[] = [];
    const seen = new Set<string>();

    (task.imageUrls ?? []).forEach((url, idx) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      items.push({
        id: `uploaded-image-${idx}-${url}`,
        url,
        kind: inferAttachmentKind(undefined, url),
        name: mediaNameFromUrl(url, `Image ${idx + 1}`),
      });
    });

    (task.videoUrls ?? []).forEach((url, idx) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      items.push({
        id: `uploaded-video-${idx}-${url}`,
        url,
        kind: inferAttachmentKind(undefined, url),
        name: mediaNameFromUrl(url, `Video ${idx + 1}`),
      });
    });

    (task.managerAudioUrl ?? []).forEach((url, idx) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      items.push({
        id: `uploaded-audio-${idx}-${url}`,
        url,
        kind: inferAttachmentKind(undefined, url),
        name: mediaNameFromUrl(url, `Attachment ${idx + 1}`),
      });
    });

    return items;
  }, [task.imageUrls, task.videoUrls, task.managerAudioUrl]);

  const mic = useMicRecording({
    onRecordingComplete: (file) => {
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        message.error(
          `Recorded audio exceeds ${MAX_ATTACHMENT_SIZE_LABEL}. Please record a shorter clip.`,
        );
        return;
      }
      setAttachments((prev) => [
        ...prev,
        { id: `${Date.now()}-${file.name}`, file, kind: 'audio' },
      ]);
    },
    onError: (msg) => message.error(msg),
  });

  const addAttachments = (files: FileList | null) => {
    if (!files?.length) return;

    const next: PendingAttachment[] = [];
    const rejectedBySize: string[] = [];
    const rejectedByType: string[] = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (!file) continue;

      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        rejectedBySize.push(file.name);
        continue;
      }

      if (!isAllowedAttachmentFile(file)) {
        rejectedByType.push(file.name);
        continue;
      }

      next.push({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        kind: inferAttachmentKind(file.type, file.name),
      });
    }

    if (rejectedBySize.length > 0) {
      const names = rejectedBySize.slice(0, 3).join(', ');
      const suffix = rejectedBySize.length > 3 ? ` and ${rejectedBySize.length - 3} more` : '';
      message.error(`File size limit is ${MAX_ATTACHMENT_SIZE_LABEL}. Skipped: ${names}${suffix}.`);
    }

    if (rejectedByType.length > 0) {
      const names = rejectedByType.slice(0, 3).join(', ');
      const suffix = rejectedByType.length > 3 ? ` and ${rejectedByType.length - 3} more` : '';
      message.error(
        `Unsupported file type. Only images, videos, PDFs, and docs are allowed. Skipped: ${names}${suffix}.`,
      );
    }

    if (next.length > 0) {
      setAttachments((prev) => [...prev, ...next]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  };

  const handleCompleteTask = async () => {
    if (task.status === 'completed') return;
    if (!note.trim()) {
      message.error('Enter your notes before marking the task complete.');
      return;
    }
    if (isCompleting) return;

    setIsCompleting(true);
    try {
      clearUploadError();
      const oversized = attachments.find(
        (attachment) => attachment.file.size > MAX_ATTACHMENT_SIZE_BYTES,
      );
      if (oversized) {
        message.error(
          `${oversized.file.name} exceeds ${MAX_ATTACHMENT_SIZE_LABEL}. Remove it before completing the task.`,
        );
        return;
      }

      let uploaded: Array<{ kind: AttachmentKind; url: string }> = [];
      try {
        uploaded = await Promise.all(
          attachments.map(async (attachment) => ({
            kind: attachment.kind,
            url: await upload(attachment.file),
          })),
        );
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message || 'Failed to upload attachments.');
        } else {
          message.error('Failed to upload attachments.');
        }
        return;
      }

      const uploadedImages = uploaded.filter((x) => x.kind === 'image').map((x) => x.url);
      const uploadedVideos = uploaded.filter((x) => x.kind === 'video').map((x) => x.url);
      const uploadedAudios = uploaded
        .filter((x) => x.kind === 'audio' || x.kind === 'pdf' || x.kind === 'doc')
        .map((x) => x.url);

      await completeMutation.mutateAsync({
        id: task.id,
        managerComments: note.trim(),
        imageUrls: [...(task.imageUrls ?? []), ...uploadedImages],
        videoUrls: [...(task.videoUrls ?? []), ...uploadedVideos],
        managerAudioUrl: [...(task.managerAudioUrl ?? []), ...uploadedAudios],
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className='-mx-6 -mb-6 flex min-h-0 flex-col gap-6 bg-[#F8F9FA]'>
      <div className='shrink-0 border-b border-slate-200/70 bg-[#F8F9FA] px-6 py-5 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='flex flex-wrap items-center gap-2 text-sm'>
            <Link
              to='/outlet-tasks'
              className='inline-flex items-center gap-1.5 font-medium text-slate-500 transition-colors hover:text-slate-700'
            >
              <ArrowLeft size={16} aria-hidden />
              Back to Tasks
            </Link>
            <span className='hidden h-4 w-px bg-slate-300 sm:block' aria-hidden />
            <span className='font-semibold tracking-tight text-[#8B6914]'>Task Details</span>
          </div>
        </div>
      </div>

      <div className='overflow-y-auto overflow-x-hidden px-6 pb-10 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <TaskMetaHeader
            badgeLabel={badge.label}
            badgeClassName={badge.className}
            categoryLabel={categoryLabel}
            headlineName={headlineName}
            description={task.description}
            dueDate={task.dueDate}
            audioSection={<AdminAudioSection audioUrls={task.adminAudioUrl} />}
          />

          <NotesAttachmentsSection
            task={task}
            note={note}
            onNoteChange={setNote}
            uploadedAttachments={uploadedAttachments}
            pendingAttachments={attachments}
            onAddAttachments={addAttachments}
            onRemovePendingAttachment={removeAttachment}
            onToggleRecording={mic.toggleRecording}
            isRecording={mic.isRecording}
            onCompleteTask={handleCompleteTask}
            isCompleting={isCompleting}
            isPending={completeMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
