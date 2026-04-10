import { useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { ArrowLeft, ChevronRight, Mic, Paperclip } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { useImageUpload } from '../../lib/hooks/useImageUpload';
import { useMicRecording } from '../../lib/hooks/useMicRecording';
import { useApiMutation, useApiQuery } from '../../lib/react-query/use-api-hooks';
import { OUTLET_KEYS } from '../../lib/types/outlet';
import { TASK_KEYS, type Task, type TaskStatus } from '../../lib/types/task';
import { Button } from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { WhatsAppAudioPlayer } from '../common/WhatsAppAudioPlayer';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
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

function formatDeadlineDate(dueDate: string) {
  return dayjs(dueDate).format('MMM D, YYYY');
}

function getPriorityPillClass(priority: Task['priority']) {
  if (priority === 'high') return 'bg-rose-50 text-rose-700 ring-rose-200';
  if (priority === 'medium') return 'bg-amber-50 text-amber-700 ring-amber-200';
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const disableActions = task.status === 'completed';
  const [preview, setPreview] = useState<{
    title: string;
    kind: AttachmentKind;
    sourceUrl: string | null;
    forceVideoForAudio?: boolean;
  } | null>(null);
  const [pendingObjectUrls, setPendingObjectUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const nextUrls: Record<string, string> = {};
    attachments.forEach((attachment) => {
      nextUrls[attachment.id] = URL.createObjectURL(attachment.file);
    });
    setPendingObjectUrls(nextUrls);

    return () => {
      Object.values(nextUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  const uploadedNonAudioAttachments = uploadedAttachments.filter((item) => item.kind !== 'audio');
  const uploadedAudioAttachments = uploadedAttachments.filter((item) => item.kind === 'audio');

  const pendingNonAudioAttachments = attachments.filter((item) => item.kind !== 'audio');
  const pendingAudioAttachments = attachments.filter((item) => item.kind === 'audio');

  const completeDisabled = completeMutation.isPending || isCompleting || mic.isRecording;

  return (
    <div className='-mx-6 -mb-6 flex min-h-0 flex-col gap-6 bg-[#F8F9FA]'>
      <div className='shrink-0 bg-[#F8F9FA] px-6 pt-6 pb-1 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <Link
            to='/outlet-tasks'
            className='inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700'
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Tasks
          </Link>
          <h1 className='mt-3 text-2xl font-extrabold text-[#1F2937] sm:text-[2.125rem]'>
            Task Details
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            Review owner instructions and submit manager updates with attachments.
          </p>
        </div>
      </div>

      <div className='overflow-y-auto overflow-x-hidden px-6 pb-10 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='rounded-4xl border border-slate-300/80 bg-white p-4 shadow-sm sm:p-6'>
            <section className='rounded-3xl border border-slate-300 bg-[#FAFAFA] p-4 sm:p-5'>
              <div className='flex flex-wrap items-center gap-3'>
                {categoryLabel ? (
                  <span className='inline-flex rounded-lg bg-amber-400/90 px-3 py-1 text-lg font-semibold text-black'>
                    {categoryLabel.charAt(0) + categoryLabel.slice(1).toLowerCase()}
                  </span>
                ) : null}
                <h2 className='text-2xl font-bold tracking-tight text-black'>{headlineName}</h2>
              </div>

              <div className='mt-4 space-y-3 text-slate-900'>
                <div className='flex flex-wrap items-center gap-3'>
                  <span className='w-28 text-2xl font-bold leading-none'>Deadline</span>
                  <span className='text-xl font-medium'>{formatDeadlineDate(task.dueDate)}</span>
                </div>
                <div className='flex flex-wrap items-center gap-3'>
                  <span className='w-28 text-2xl font-bold leading-none'>Assigned</span>
                  <div className='flex flex-wrap gap-2'>
                    {(task.assigneeNames ?? []).map((name, idx) => (
                      <span
                        key={`assignee-${idx}-${name}`}
                        className='inline-flex min-w-18 items-center justify-center rounded-md border border-slate-500 bg-white px-2.5 py-0.5 text-base'
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className='flex gap-3'>
                  <span className='w-28 pt-0.5 text-2xl font-bold leading-none'>Description</span>
                  <p className='flex-1 text-xl leading-snug text-slate-800'>{task.description}</p>
                </div>
              </div>

              <div className='mt-4 space-y-2'>
                <p className='text-sm font-bold uppercase tracking-wide text-slate-600'>
                  Owner audio
                </p>
                {task.adminAudioUrl && task.adminAudioUrl.length > 0 ? (
                  task.adminAudioUrl.map((url, idx) => (
                    <WhatsAppAudioPlayer
                      key={`owner-audio-${idx}-${url}`}
                      src={url}
                      className='w-full max-w-107.5'
                      fitContainer
                    />
                  ))
                ) : (
                  <p className='text-sm text-slate-500'>No owner audio attached.</p>
                )}
              </div>

              <div className='mt-4 flex flex-wrap items-center gap-2'>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ring-1 ${badge.className}`}
                >
                  {badge.label}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${getPriorityPillClass(task.priority)}`}
                >
                  {task.priority}
                </span>
              </div>
            </section>

            <section className='mt-5 rounded-3xl border border-slate-300 bg-[#FAFAFA] p-4 sm:p-5'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <h3 className='text-xl font-bold text-slate-900'>Attachments</h3>
                {task.status === 'completed' && task.updatedAt ? (
                  <p className='text-xs font-semibold text-slate-600'>
                    Completed on {dayjs(task.updatedAt).format('MMM D, YYYY hh:mm A')}
                  </p>
                ) : null}
              </div>

              <input
                ref={fileInputRef}
                type='file'
                multiple
                className='hidden'
                accept='.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.m4a,.aac,.ogg,.oga,.flac,.pdf,.doc,.docx,.txt'
                onChange={(e) => {
                  addAttachments(e.target.files);
                  e.target.value = '';
                }}
              />

              <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {uploadedNonAudioAttachments.map((attachment) => (
                  <button
                    key={attachment.id}
                    type='button'
                    onClick={() =>
                      setPreview({
                        title: attachment.name,
                        kind: attachment.kind,
                        sourceUrl: attachment.url,
                      })
                    }
                    className='h-20 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50'
                  >
                    {attachment.kind.toUpperCase()}
                  </button>
                ))}
                {pendingNonAudioAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className='relative h-20 rounded-2xl border border-dashed border-slate-400 bg-white px-3 py-2'
                  >
                    <button
                      type='button'
                      onClick={() =>
                        setPreview({
                          title: attachment.file.name,
                          kind: attachment.kind,
                          sourceUrl: pendingObjectUrls[attachment.id] ?? null,
                        })
                      }
                      className='text-left text-sm font-semibold text-slate-800'
                    >
                      {attachment.kind.toUpperCase()}
                    </button>
                    <button
                      type='button'
                      onClick={() => removeAttachment(attachment.id)}
                      className='absolute right-2 top-2 rounded-md px-2 py-0.5 text-xs font-semibold text-rose-600 hover:bg-rose-50'
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {uploadedNonAudioAttachments.length === 0 &&
                pendingNonAudioAttachments.length === 0 ? (
                  <p className='col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500'>
                    No manager attachments yet.
                  </p>
                ) : null}
              </div>

              <div className='mt-4 space-y-2'>
                <p className='text-sm font-bold uppercase tracking-wide text-slate-600'>Audio</p>
                {uploadedAudioAttachments.map((attachment, idx) => (
                  <WhatsAppAudioPlayer
                    key={`manager-uploaded-audio-${idx}-${attachment.id}`}
                    src={attachment.url}
                    className='w-full max-w-107.5'
                    fitContainer
                  />
                ))}
                {pendingAudioAttachments.map((attachment) => {
                  const sourceUrl = pendingObjectUrls[attachment.id] ?? null;
                  return sourceUrl ? (
                    <div key={attachment.id} className='flex items-start gap-2'>
                      <WhatsAppAudioPlayer
                        src={sourceUrl}
                        className='w-full max-w-107.5'
                        fitContainer
                      />
                      <button
                        type='button'
                        onClick={() => removeAttachment(attachment.id)}
                        className='rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50'
                      >
                        Remove
                      </button>
                    </div>
                  ) : null;
                })}
                {uploadedAudioAttachments.length === 0 && pendingAudioAttachments.length === 0 ? (
                  <p className='text-sm text-slate-500'>No manager audio attached.</p>
                ) : null}
              </div>

              <div className='mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder='Type manager notes...'
                  rows={5}
                  disabled={disableActions}
                  className='w-full resize-none border-0 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'
                />
              </div>

              <div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
                <div className='flex items-center gap-2'>
                  {mic.isRecording ? (
                    <span className='inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-100'>
                      <span className='relative flex h-2 w-2'>
                        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75' />
                        <span className='relative inline-flex h-2 w-2 rounded-full bg-rose-600' />
                      </span>
                      Recording…
                    </span>
                  ) : null}
                  <button
                    type='button'
                    disabled={disableActions}
                    onClick={() => fileInputRef.current?.click()}
                    className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40'
                    aria-label='Attach file'
                  >
                    <Paperclip size={20} aria-hidden />
                  </button>
                  <button
                    type='button'
                    disabled={disableActions}
                    onClick={mic.toggleRecording}
                    aria-pressed={mic.isRecording}
                    aria-label={mic.isRecording ? 'Stop recording' : 'Start voice recording'}
                    className={`rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      mic.isRecording
                        ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-300 ring-offset-1'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    <Mic size={20} aria-hidden />
                  </button>
                </div>

                {task.status !== 'completed' ? (
                  <Button
                    variant='admin-primary'
                    disabled={completeDisabled}
                    onClick={() => void handleCompleteTask()}
                    endIcon={<ChevronRight size={16} aria-hidden />}
                  >
                    {isCompleting ? 'Uploading...' : 'Complete task'}
                  </Button>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>

      <AttachmentPreviewModal
        title={preview?.title ?? ''}
        open={!!preview}
        onClose={() => setPreview(null)}
        kind={preview?.kind ?? 'file'}
        sourceUrl={preview?.sourceUrl ?? null}
        forceVideoForAudio={preview?.forceVideoForAudio}
      />
    </div>
  );
}
