import { useEffect, useMemo, useRef, useState } from 'react';
import { message, Modal } from 'antd';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  ChevronRight,
  Image as ImageIcon,
  Mic,
  Pause,
  Play,
  Video,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { useImageUpload } from '../../lib/hooks/useImageUpload';
import { useMicRecording } from '../../lib/hooks/useMicRecording';
import { useApiMutation, useApiQuery } from '../../lib/react-query/use-api-hooks';
import { TASK_KEYS, type Task, type TaskStatus } from '../../lib/types/task';
import { OUTLET_KEYS } from '../../lib/types/outlet';
import { Button } from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

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

function formatCategoryLabel(category: string | undefined) {
  if (!category) return '';
  const lower = category.toLowerCase();
  if (['hygiene', 'maintenance', 'inventory', 'staffing'].includes(lower)) {
    return lower.toUpperCase();
  }
  return category.toUpperCase();
}

function formatDeadlineLine(dueDate: string) {
  const d = dayjs(dueDate);
  const now = dayjs();
  let datePart: string;
  if (d.isSame(now, 'day')) datePart = 'Today';
  else if (d.isSame(now.add(1, 'day'), 'day')) datePart = 'Tomorrow';
  else datePart = d.format('MMM D, YYYY');
  return `${datePart}, ${d.format('hh:mm A')}`;
}

function deadlineHint(dueDate: string) {
  const d = dayjs(dueDate);
  const now = dayjs();
  if (d.isBefore(now)) return 'This deadline has passed';
  if (d.isSame(now, 'day')) return 'Delivery window closing soon';
  return 'Plan delivery before the deadline';
}

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

function getPlayableDuration(audio: HTMLAudioElement) {
  if (Number.isFinite(audio.duration) && audio.duration > 0) return audio.duration;
  if (audio.seekable.length > 0) {
    const end = audio.seekable.end(audio.seekable.length - 1);
    if (Number.isFinite(end) && end > 0) return end;
  }
  return 0;
}

function WhatsAppAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bars, setBars] = useState<number[]>(
    Array.from({ length: 36 }, (_, idx) => {
      const seed = ((idx + 3) * 37) % 97;
      return 7 + (seed % 16);
    }),
  );

  useEffect(() => {
    let mounted = true;

    const decodeWaveform = async () => {
      try {
        const response = await fetch(src);
        const buffer = await response.arrayBuffer();
        const AudioCtx =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return;

        const audioContext = new AudioCtx();
        const decoded = await audioContext.decodeAudioData(buffer.slice(0));
        const raw = decoded.getChannelData(0);
        const sampleCount = 36;
        const blockSize = Math.floor(raw.length / sampleCount) || 1;
        const nextBars = new Array(sampleCount).fill(0).map((_, i) => {
          let sum = 0;
          const start = i * blockSize;
          const end = Math.min(start + blockSize, raw.length);
          for (let j = start; j < end; j += 1) sum += Math.abs(raw[j]);
          const avg = sum / Math.max(1, end - start);
          return Math.max(6, Math.min(24, Math.round(avg * 64)));
        });

        await audioContext.close();
        if (mounted) setBars(nextBars);
      } catch {
        // Keep fallback bars if waveform decode is blocked or unsupported.
      }
    };

    void decodeWaveform();
    return () => {
      mounted = false;
    };
  }, [src]);

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <div className='inline-block max-w-full rounded-2xl border border-slate-200 bg-white p-3'>
      <audio
        ref={audioRef}
        src={src}
        preload='metadata'
        onLoadedMetadata={(e) => setDuration(getPlayableDuration(e.currentTarget))}
        onDurationChange={(e) => setDuration(getPlayableDuration(e.currentTarget))}
        onCanPlay={(e) => setDuration(getPlayableDuration(e.currentTarget))}
        onTimeUpdate={(e) => {
          const audioEl = e.currentTarget;
          setCurrentTime(audioEl.currentTime || 0);
          setDuration((prev) => {
            const next = getPlayableDuration(audioEl);
            return next > 0 ? next : prev;
          });
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onEnded={() => setIsPlaying(false)}
      />
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={() => void togglePlayback()}
          className='flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200'
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className='ml-0.5' />}
        </button>

        <button
          type='button'
          onClick={(event) => {
            const audio = audioRef.current;
            const waveform = waveformRef.current;
            if (!audio || !waveform || duration <= 0) return;
            const rect = waveform.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const ratio = Math.min(1, Math.max(0, x / rect.width));
            const nextTime = duration * ratio;
            audio.currentTime = nextTime;
            setCurrentTime(nextTime);
          }}
          className='group w-[min(360px,calc(100vw-12rem))] min-w-0'
          aria-label='Audio progress'
        >
          <div ref={waveformRef} className='flex items-center gap-1.5'>
            {bars.map((height, idx) => {
              const barProgress = ((idx + 1) / bars.length) * 100;
              const played = barProgress <= progressPercent;
              return (
                <span
                  key={`wave-${idx}-${height}`}
                  className={`w-1 shrink-0 rounded-full transition-colors ${
                    played ? 'bg-[#2BA1F9]' : 'bg-slate-300'
                  }`}
                  style={{ height }}
                  aria-hidden
                />
              );
            })}
          </div>
        </button>
      </div>

      <div className='mt-1 flex items-center px-11 text-[11px] text-slate-500'>
        <span>{formatAudioTime(currentTime)}</span>
      </div>
    </div>
  );
}

type AttachmentKind = 'image' | 'video' | 'audio';

type PendingAttachment = {
  id: string;
  file: File;
  kind: AttachmentKind;
};

type UploadedAttachment = {
  id: string;
  url: string;
  kind: AttachmentKind;
  name: string;
};

const KIND_LABEL: Record<AttachmentKind, string> = {
  image: 'IMAGE',
  video: 'VIDEO',
  audio: 'AUDIO',
};

function mediaNameFromUrl(url: string, fallback: string) {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split('/').pop()?.trim();
    return name || fallback;
  } catch {
    return fallback;
  }
}

function AttachmentPreviewCard({
  attachment,
  onRemove,
}: {
  attachment: PendingAttachment;
  onRemove: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(attachment.file);
    queueMicrotask(() => setObjectUrl(url));
    return () => {
      URL.revokeObjectURL(url);
      queueMicrotask(() => setObjectUrl(null));
    };
  }, [attachment.id, attachment.file]);

  const Icon = attachment.kind === 'image' ? ImageIcon : attachment.kind === 'video' ? Video : Mic;

  const closePreview = () => {
    setPreviewOpen(false);
  };

  /** WebM mic recordings are often `video/webm`; <audio> fails — use <video> for preview. */
  const useVideoForAudioPreview =
    attachment.kind === 'audio' &&
    (attachment.file.type.includes('webm') || /\.webm$/i.test(attachment.file.name));

  return (
    <>
      <div className='flex max-w-47.5 min-w-0 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-100 py-1 pl-1 pr-1 ring-1 ring-slate-200/90'>
        <button
          type='button'
          onClick={() => setPreviewOpen(true)}
          className='flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-md text-left transition-colors hover:bg-slate-200/60'
          aria-label={`Preview ${attachment.file.name}`}
        >
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-500 text-white'>
            <Icon size={16} className='text-white' aria-hidden />
          </div>
          <div className='min-w-0 flex-1 py-0.5 leading-tight'>
            <p className='truncate text-xs font-bold text-slate-800' title={attachment.file.name}>
              {attachment.file.name}
            </p>
            <p className='mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500'>
              {KIND_LABEL[attachment.kind]}
            </p>
          </div>
        </button>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className='shrink-0 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-700'
          aria-label={`Remove ${attachment.file.name}`}
        >
          <X size={12} aria-hidden />
        </button>
      </div>

      <Modal
        title={attachment.file.name}
        open={previewOpen}
        onCancel={closePreview}
        footer={null}
        width={attachment.kind === 'audio' ? 420 : 720}
        centered
        destroyOnHidden
      >
        {objectUrl && attachment.kind === 'image' && (
          <div className='flex justify-center bg-slate-50 py-2'>
            <img src={objectUrl} alt='' className='max-h-[70vh] max-w-full object-contain' />
          </div>
        )}
        {objectUrl && attachment.kind === 'video' && (
          <video
            key={objectUrl}
            src={objectUrl}
            className='max-h-[70vh] w-full bg-black object-contain'
            controls
            playsInline
            preload='auto'
          />
        )}
        {objectUrl && attachment.kind === 'audio' && (
          <div className='flex flex-col items-center gap-4 py-4'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500'>
              <Mic size={28} aria-hidden />
            </div>
            {useVideoForAudioPreview ? (
              <video
                key={objectUrl}
                src={objectUrl}
                controls
                playsInline
                preload='auto'
                className='w-full bg-black'
              />
            ) : (
              <audio key={objectUrl} src={objectUrl} controls className='w-full' preload='auto' />
            )}
          </div>
        )}
        {!objectUrl && (
          <div className='py-8 text-center text-sm text-slate-500'>Preparing preview…</div>
        )}
      </Modal>
    </>
  );
}

function UploadedAttachmentCard({ attachment }: { attachment: UploadedAttachment }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const Icon = attachment.kind === 'image' ? ImageIcon : attachment.kind === 'video' ? Video : Mic;

  return (
    <>
      <button
        type='button'
        onClick={() => setPreviewOpen(true)}
        className='flex max-w-47.5 min-w-0 items-center gap-1.5 rounded-lg bg-slate-100 py-1 pl-1 pr-1 ring-1 ring-slate-200/90 transition-colors hover:bg-slate-200/60'
      >
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-500 text-white'>
          <Icon size={16} className='text-white' aria-hidden />
        </div>
        <div className='min-w-0 flex-1 py-0.5 text-left leading-tight'>
          <p className='truncate text-xs font-bold text-slate-800' title={attachment.name}>
            {attachment.name}
          </p>
          <p className='mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500'>
            {KIND_LABEL[attachment.kind]}
          </p>
        </div>
      </button>

      <Modal
        title={attachment.name}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={attachment.kind === 'audio' ? 420 : 720}
        centered
        destroyOnHidden
      >
        {attachment.kind === 'image' && (
          <div className='flex justify-center bg-slate-50 py-2'>
            <img src={attachment.url} alt='' className='max-h-[70vh] max-w-full object-contain' />
          </div>
        )}
        {attachment.kind === 'video' && (
          <video
            key={attachment.url}
            src={attachment.url}
            className='max-h-[70vh] w-full bg-black object-contain'
            controls
            playsInline
            preload='auto'
          />
        )}
        {attachment.kind === 'audio' && (
          <div className='flex flex-col items-center gap-4 py-4'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500'>
              <Mic size={28} aria-hidden />
            </div>
            <audio
              key={attachment.url}
              src={attachment.url}
              controls
              className='w-full'
              preload='auto'
            />
          </div>
        )}
      </Modal>
    </>
  );
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
    (payload: {
      id: string;
      managerComments: string;
      imageUrls: string[];
      videoUrls: string[];
      managerAudioUrl: string[];
    }) =>
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
      <div className='flex min-h-[40vh] items-center justify-center -mx-6 -mb-6'>
        <LoadingSpinner />
      </div>
    );
  }

  if (!task) {
    return (
      <div className='flex min-h-0 flex-col gap-6 -mx-6 -mb-6 bg-[#F8F9FA] px-6 pb-8 lg:px-8'>
        <div className='rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm'>
          <p className='text-slate-700 font-semibold'>Task not found</p>
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
  completeMutation: ReturnType<
    typeof useApiMutation<
      Task,
      {
        id: string;
        managerComments: string;
        imageUrls: string[];
        videoUrls: string[];
        managerAudioUrl: string[];
      }
    >
  >;
  upload: (file: File) => Promise<string>;
  clearUploadError: () => void;
}) {
  const badge = STATUS_BADGE[task.status];
  const headlineName = task.outletName?.trim() || task.title;
  const categoryLabel = formatCategoryLabel(task.category);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
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
        kind: 'image',
        name: mediaNameFromUrl(url, `Image ${idx + 1}`),
      });
    });

    (task.videoUrls ?? []).forEach((url, idx) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      items.push({
        id: `uploaded-video-${idx}-${url}`,
        url,
        kind: 'video',
        name: mediaNameFromUrl(url, `Video ${idx + 1}`),
      });
    });

    (task.managerAudioUrl ?? []).forEach((url, idx) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      items.push({
        id: `uploaded-audio-${idx}-${url}`,
        url,
        kind: 'audio',
        name: mediaNameFromUrl(url, `Audio ${idx + 1}`),
      });
    });

    return items;
  }, [task.imageUrls, task.videoUrls, task.managerAudioUrl]);

  const mic = useMicRecording({
    onRecordingComplete: (file) => {
      setAttachments((prev) => [
        ...prev,
        { id: `${Date.now()}-${file.name}`, file, kind: 'audio' },
      ]);
    },
    onError: (msg) => message.error(msg),
  });

  const addAttachments = (files: FileList | null, kind: AttachmentKind) => {
    if (!files?.length) return;
    const next: PendingAttachment[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (file) next.push({ id: `${Date.now()}-${i}-${file.name}`, file, kind });
    }
    if (next.length) setAttachments((prev) => [...prev, ...next]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCompleteTask = async () => {
    if (task.status === 'completed') return;
    if (!note.trim()) {
      message.error('Enter your delivery notes before marking the task complete.');
      return;
    }
    if (isCompleting) return;

    setIsCompleting(true);
    try {
      clearUploadError();

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
      const uploadedAudios = uploaded.filter((x) => x.kind === 'audio').map((x) => x.url);

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
    <div className='flex min-h-0 flex-col gap-6 -mx-6 -mb-6 bg-[#F8F9FA]'>
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
          <div className='relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
            <div className='min-w-0 flex-1 space-y-4'>
              <div className='flex flex-wrap items-center gap-2'>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${badge.className}`}
                >
                  {badge.label}
                </span>
                {categoryLabel ? (
                  <span className='inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-600 ring-1 ring-inset ring-slate-200/80'>
                    {categoryLabel}
                  </span>
                ) : null}
              </div>

              <h1 className='text-2xl font-bold tracking-tight text-black sm:text-3xl'>
                {headlineName}
              </h1>
              <p className='max-w-2xl text-base leading-relaxed text-slate-600'>
                {task.description}
              </p>
              {task.adminAudioUrl && task.adminAudioUrl.length > 0 && (
                <div className='w-fit max-w-full rounded-xl border border-slate-200 bg-white p-3'>
                  <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                    Admin audio
                  </p>
                  <div className='space-y-2'>
                    {task.adminAudioUrl.map((url, idx) => (
                      <WhatsAppAudioPlayer key={`admin-audio-${idx}-${url}`} src={url} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className='flex w-full shrink-0 flex-col gap-3 sm:max-w-70 lg:items-stretch'>
              <div className='rounded-xl bg-[#F5F0E6] px-5 py-4 shadow-sm ring-1 ring-[#E8DFD0]'>
                <p className='text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C4A2A]'>
                  Deadline
                </p>
                <p className='mt-1 text-lg font-bold text-[#3D2F1A]'>
                  {formatDeadlineLine(task.dueDate)}
                </p>
                <p className='mt-2 text-xs text-[#6B5A40]'>{deadlineHint(task.dueDate)}</p>
              </div>
            </div>
          </div>

          <section className='mt-10 rounded-xl border border-slate-200/90 bg-slate-100/80 p-6 shadow-sm'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <h2 className='text-lg font-bold text-slate-900'>Notes &amp; Attachments</h2>
                <p className='mt-1 text-sm text-slate-500'>
                  Provide notes or required documentation
                </p>
              </div>
              {task.status === 'completed' && task.updatedAt && (
                <p className='text-xs font-semibold text-slate-600'>
                  Completed on {dayjs(task.updatedAt).format('MMM D, YYYY hh:mm A')}
                </p>
              )}
            </div>

            <div className='mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
              <input
                ref={imageInputRef}
                type='file'
                accept='image/*'
                multiple
                className='hidden'
                onChange={(e) => {
                  addAttachments(e.target.files, 'image');
                  e.target.value = '';
                }}
              />
              <input
                ref={videoInputRef}
                type='file'
                accept='video/*'
                multiple
                className='hidden'
                onChange={(e) => {
                  addAttachments(e.target.files, 'video');
                  e.target.value = '';
                }}
              />

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Type your delivery notes here...'
                rows={6}
                disabled={task.status === 'completed'}
                className='w-full resize-none border-0 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'
              />

              <div className='flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
                <div className='flex min-h-11 min-w-0 flex-1 flex-wrap items-start gap-3'>
                  {uploadedAttachments.map((attachment) => (
                    <UploadedAttachmentCard key={attachment.id} attachment={attachment} />
                  ))}
                  {attachments.map((a) => (
                    <AttachmentPreviewCard
                      key={a.id}
                      attachment={a}
                      onRemove={() => removeAttachment(a.id)}
                    />
                  ))}
                </div>

                <div className='flex shrink-0 flex-wrap items-center justify-end gap-2'>
                  {mic.isRecording && (
                    <span className='mr-1 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-100'>
                      <span className='relative flex h-2 w-2'>
                        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75' />
                        <span className='relative inline-flex h-2 w-2 rounded-full bg-rose-600' />
                      </span>
                      Recording… tap mic to stop
                    </span>
                  )}
                  <button
                    type='button'
                    disabled={task.status === 'completed'}
                    onClick={() => imageInputRef.current?.click()}
                    className='cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40'
                    aria-label='Attach image'
                  >
                    <ImageIcon size={20} aria-hidden />
                  </button>
                  <button
                    type='button'
                    disabled={task.status === 'completed'}
                    onClick={mic.toggleRecording}
                    aria-pressed={mic.isRecording}
                    aria-label={mic.isRecording ? 'Stop recording' : 'Start voice recording'}
                    className={`cursor-pointer rounded-lg p-2 transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 ${
                      mic.isRecording
                        ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-300 ring-offset-1'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    <Mic size={20} aria-hidden />
                  </button>
                  <button
                    type='button'
                    disabled={task.status === 'completed'}
                    onClick={() => videoInputRef.current?.click()}
                    className='cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40'
                    aria-label='Attach video'
                  >
                    <Video size={20} aria-hidden />
                  </button>
                  {task.status !== 'completed' && (
                    <Button
                      variant='admin-primary'
                      disabled={completeMutation.isPending || isCompleting || mic.isRecording}
                      onClick={() => void handleCompleteTask()}
                      title={
                        mic.isRecording
                          ? 'Stop recording before completing the task'
                          : isCompleting
                            ? 'Uploading attachments...'
                            : undefined
                      }
                      endIcon={<ChevronRight size={16} aria-hidden />}
                    >
                      {isCompleting ? 'Uploading...' : 'Complete task'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
