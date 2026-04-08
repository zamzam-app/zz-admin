import { useMemo, useState } from 'react';
import { Modal } from 'antd';
import dayjs from 'dayjs';
import { ArrowLeft, Image as ImageIcon, Mic, Video } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { useApiQuery } from '../../lib/react-query/use-api-hooks';
import { type Task, type TaskStatus } from '../../lib/types/task';
import { OUTLET_KEYS } from '../../lib/types/outlet';
import LoadingSpinner from '../common/LoadingSpinner';

type MediaKind = 'image' | 'video' | 'audio';

type MediaItem = {
  id: string;
  url: string;
  kind: MediaKind;
  name: string;
};

const STATUS_BADGE: Record<TaskStatus, { label: string; className: string }> = {
  open: {
    label: 'OPEN',
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

function isAudioUrl(url: string) {
  return /\.(mp3|wav|m4a|aac|ogg|oga|flac)(\?|#|$)/i.test(url);
}

function mediaNameFromUrl(url: string, fallback: string) {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split('/').pop()?.trim();
    return name || fallback;
  } catch {
    return fallback;
  }
}

function buildMediaItems(task: Task): MediaItem[] {
  const items: MediaItem[] = [];
  const seen = new Set<string>();
  const imageUrls = task.imageUrls ?? (task.imageUrl ? [task.imageUrl] : []);

  imageUrls.forEach((url, idx) => {
    if (seen.has(url)) return;
    seen.add(url);
    items.push({
      id: `image-${idx}-${url}`,
      url,
      kind: 'image',
      name: mediaNameFromUrl(url, `Image ${idx + 1}`),
    });
  });

  (task.videoUrls ?? []).forEach((url, idx) => {
    if (seen.has(url)) return;
    seen.add(url);
    const kind: MediaKind = isAudioUrl(url) ? 'audio' : 'video';
    items.push({
      id: `video-${idx}-${url}`,
      url,
      kind,
      name: mediaNameFromUrl(url, kind === 'audio' ? `Audio ${idx + 1}` : `Video ${idx + 1}`),
    });
  });

  const audioUrls = [
    ...(task.adminAudioUrl ?? []),
    ...(task.managerAudioUrl ?? []),
    ...(task.audioUrls ?? []),
  ];

  audioUrls.forEach((url, idx) => {
    if (seen.has(url)) return;
    seen.add(url);
    items.push({
      id: `audio-${idx}-${url}`,
      url,
      kind: 'audio',
      name: mediaNameFromUrl(url, `Audio ${idx + 1}`),
    });
  });

  return items;
}

function MediaCard({ item, onOpen }: { item: MediaItem; onOpen: () => void }) {
  const Icon = item.kind === 'image' ? ImageIcon : item.kind === 'video' ? Video : Mic;

  return (
    <button
      type='button'
      onClick={onOpen}
      className='flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-left transition-colors hover:bg-slate-100'
    >
      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-500 text-white'>
        <Icon size={16} aria-hidden />
      </div>
      <div className='min-w-0'>
        <p className='truncate text-xs font-bold text-slate-800'>{item.name}</p>
        <p className='text-[10px] font-semibold uppercase tracking-wide text-slate-500'>
          {item.kind}
        </p>
      </div>
    </button>
  );
}

export default function TaskMediaDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const role = user?.role ?? 'staff';
  const userId = user?.id ?? user?._id ?? '';

  const listQueryKey: unknown[] = ['tasks', 'list', 'all', 'all', role, userId];

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
    { enabled: !!taskId && (role === 'admin' || !!userId) },
  );

  const { data: outlets = [] } = useApiQuery(OUTLET_KEYS, () =>
    import('../../lib/services/api/outlet.api').then((mod) => mod.outletApi.getOutletsList()),
  );

  const assignedOutletIds = useMemo(() => {
    if (!user || role === 'admin') return null;
    if (Array.isArray(user.outletId) && user.outletId.length > 0) return user.outletId;
    if (!userId) return [];
    return outlets
      .filter((outlet) => outlet.managerIds?.includes(userId) || outlet.managerId === userId)
      .map((outlet) => outlet.id);
  }, [outlets, role, user, userId]);

  const boardTasks = useMemo(() => {
    if (role === 'admin') return tasks;
    if (!assignedOutletIds || assignedOutletIds.length === 0) return tasks;
    return tasks.filter((t) => !t.outletId || assignedOutletIds.includes(t.outletId));
  }, [tasks, role, assignedOutletIds]);

  const task = useMemo(() => boardTasks.find((t) => t.id === taskId), [boardTasks, taskId]);
  const mediaItems = useMemo(() => (task ? buildMediaItems(task) : []), [task]);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  if (!taskId) return null;

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
          <p className='font-semibold text-slate-700'>Task not found</p>
          <p className='mt-1 text-sm text-slate-500'>
            It may have been removed or you may not have access.
          </p>
          <Link
            to='/tasks'
            className='mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#705E0C] hover:underline'
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[task.status];
  const headlineName = task.outletName?.trim() || task.title;

  return (
    <div className='flex min-h-0 flex-col gap-6 -mx-6 -mb-6 bg-[#F8F9FA]'>
      <div className='shrink-0 bg-[#F8F9FA] px-6 pt-6 pb-1 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <Link
            to='/tasks'
            className='inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700'
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Tasks
          </Link>
          <h1 className='mt-3 text-2xl font-extrabold text-[#1F2937] sm:text-[2.125rem]'>
            Task Media
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            Review task details and uploaded attachments.
          </p>
        </div>
      </div>

      <div className='overflow-y-auto overflow-x-hidden px-6 pb-10 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm'>
            <div className='flex flex-wrap items-center gap-2'>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${badge.className}`}
              >
                {badge.label}
              </span>
              <time className='text-xs text-slate-500' dateTime={task.dueDate}>
                Due {dayjs(task.dueDate).format('MMM D, YYYY hh:mm A')}
              </time>
            </div>

            <h1 className='mt-3 text-2xl font-bold tracking-tight text-black sm:text-3xl'>
              {headlineName}
            </h1>
            <p className='mt-3 max-w-2xl text-base leading-relaxed text-slate-600'>
              {task.description}
            </p>
          </div>

          <section className='mt-6 rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm'>
            <h2 className='text-lg font-bold text-slate-900'>Attachments</h2>
            <p className='mt-1 text-sm text-slate-500'>
              Preview uploaded image, audio, and video files.
            </p>

            {mediaItems.length === 0 ? (
              <p className='mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500'>
                No media attachments available for this task.
              </p>
            ) : (
              <div className='mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                {mediaItems.map((item) => (
                  <MediaCard key={item.id} item={item} onOpen={() => setSelectedMedia(item)} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Modal
        title={selectedMedia?.name}
        open={!!selectedMedia}
        onCancel={() => setSelectedMedia(null)}
        footer={null}
        width={selectedMedia?.kind === 'audio' ? 420 : 720}
        centered
        destroyOnHidden
      >
        {selectedMedia?.kind === 'image' && (
          <div className='flex justify-center bg-slate-50 py-2'>
            <img
              src={selectedMedia.url}
              alt=''
              className='max-h-[70vh] max-w-full object-contain'
            />
          </div>
        )}
        {selectedMedia?.kind === 'video' && (
          <video
            key={selectedMedia.url}
            src={selectedMedia.url}
            className='max-h-[70vh] w-full bg-black object-contain'
            controls
            playsInline
            preload='metadata'
          />
        )}
        {selectedMedia?.kind === 'audio' && (
          <div className='flex flex-col items-center gap-4 py-4'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500'>
              <Mic size={28} aria-hidden />
            </div>
            <audio
              key={selectedMedia.url}
              src={selectedMedia.url}
              controls
              className='w-full'
              preload='metadata'
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
