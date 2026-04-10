import { useMemo, useState } from 'react';
import { Modal } from 'antd';
import dayjs from 'dayjs';
import { ArrowLeft, FileText, Image as ImageIcon, Paperclip, Video } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { useApiQuery } from '../../lib/react-query/use-api-hooks';
import { type Task, type TaskStatus } from '../../lib/types/task';
import { OUTLET_KEYS } from '../../lib/types/outlet';
import LoadingSpinner from '../common/LoadingSpinner';
import { WhatsAppAudioPlayer } from '../common/WhatsAppAudioPlayer';

type MediaKind = 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'file';

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

function inferMediaKind(url: string): MediaKind {
  if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(url)) return 'image';
  if (/\.(mp4|webm|mov|m4v|avi|mkv)(\?|#|$)/i.test(url)) return 'video';
  if (isAudioUrl(url)) return 'audio';
  if (/\.pdf(\?|#|$)/i.test(url)) return 'pdf';
  if (/\.(doc|docx|txt|rtf)(\?|#|$)/i.test(url)) return 'doc';
  return 'file';
}

function formatCategoryLabel(category: string | undefined) {
  if (!category) return '';
  const lower = category.toLowerCase();
  if (['hygiene', 'maintenance', 'inventory', 'staffing'].includes(lower)) {
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return category;
}

function getPriorityPillClass(priority: Task['priority']) {
  if (priority === 'high') return 'bg-rose-50 text-rose-700 ring-rose-200';
  if (priority === 'medium') return 'bg-amber-50 text-amber-700 ring-amber-200';
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
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
    const kind = inferMediaKind(url);
    items.push({
      id: `video-${idx}-${url}`,
      url,
      kind,
      name: mediaNameFromUrl(url, kind === 'audio' ? `Audio ${idx + 1}` : `Attachment ${idx + 1}`),
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
    const kind = inferMediaKind(url);
    items.push({
      id: `audio-${idx}-${url}`,
      url,
      kind,
      name: mediaNameFromUrl(url, `Audio ${idx + 1}`),
    });
  });

  return items;
}

function AttachmentTile({ item, onOpen }: { item: MediaItem; onOpen: () => void }) {
  const Icon =
    item.kind === 'image'
      ? ImageIcon
      : item.kind === 'video'
        ? Video
        : item.kind === 'pdf' || item.kind === 'doc'
          ? FileText
          : Paperclip;

  return (
    <button
      type='button'
      onClick={onOpen}
      className='aspect-square w-12.5 cursor-pointer rounded-2xl border border-slate-300 bg-white transition-colors hover:bg-slate-50'
    >
      <div className='flex h-full items-center justify-center'>
        <Icon size={20} className='text-slate-500' aria-hidden />
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

  const adminMedia = useMemo(() => {
    if (!task) return [];
    if (task.adminSubmission) {
      const items: MediaItem[] = [];
      const att = task.adminSubmission.attachments ?? {
        images: [],
        videos: [],
        audios: [],
        files: [],
      };
      att.images.forEach((url, i) =>
        items.push({ id: `admin-img-${i}`, url, kind: 'image', name: `Image ${i + 1}` }),
      );
      att.videos.forEach((url, i) =>
        items.push({ id: `admin-vid-${i}`, url, kind: 'video', name: `Video ${i + 1}` }),
      );
      att.audios.forEach((url, i) =>
        items.push({ id: `admin-aud-${i}`, url, kind: 'audio', name: `Audio ${i + 1}` }),
      );
      att.files.forEach((url, i) =>
        items.push({
          id: `admin-file-${i}`,
          url,
          kind: inferMediaKind(url),
          name: `File ${i + 1}`,
        }),
      );
      return items;
    }
    // Legacy fallback: if no submission objects exist, show available media in top box.
    if (!task.managerSubmission) return mediaItems;
    return [];
  }, [task, mediaItems]);

  const managerMedia = useMemo(() => {
    if (!task) return [];
    if (task.managerSubmission) {
      const items: MediaItem[] = [];
      const att = task.managerSubmission.attachments ?? {
        images: [],
        videos: [],
        audios: [],
        files: [],
      };
      att.images.forEach((url, i) =>
        items.push({ id: `mgr-img-${i}`, url, kind: 'image', name: `Image ${i + 1}` }),
      );
      att.videos.forEach((url, i) =>
        items.push({ id: `mgr-vid-${i}`, url, kind: 'video', name: `Video ${i + 1}` }),
      );
      att.audios.forEach((url, i) =>
        items.push({ id: `mgr-aud-${i}`, url, kind: 'audio', name: `Audio ${i + 1}` }),
      );
      att.files.forEach((url, i) =>
        items.push({ id: `mgr-file-${i}`, url, kind: inferMediaKind(url), name: `File ${i + 1}` }),
      );
      return items;
    }
    // Bottom box should only show managerSubmission attachments.
    return [];
  }, [task]);

  const adminAudioItems = adminMedia.filter((m) => m.kind === 'audio');
  const adminOtherItems = adminMedia.filter((m) => m.kind !== 'audio');
  const managerAudioItems = managerMedia.filter((m) => m.kind === 'audio');
  const managerOtherItems = managerMedia.filter((m) => m.kind !== 'audio');

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
  const outletHeadline = task.outletName?.trim() || task.outletId?.trim() || '';
  const categoryLabel = formatCategoryLabel(task.category);
  const assigneeNames =
    task.assigneeNames && task.assigneeNames.length > 0 ? task.assigneeNames : [];

  return (
    <div className='flex min-h-0 flex-col gap-6 -mx-6 -mb-6 bg-[#F8F9FA]'>
      <div className='shrink-0 bg-[#F8F9FA] px-6 pt-6 pb-1 lg:px-8'>
        <div className='relative mt-3 min-h-11'>
          <Link
            to='/tasks'
            className='absolute left-0 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700'
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Tasks
          </Link>
          <h1 className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-extrabold text-[#1F2937] sm:text-[2.125rem]'>
            Task Details
          </h1>
        </div>
        <div className='mx-auto max-w-4xl'>
          <p className='mt-1 text-center text-sm text-slate-500'>
            Review task details and uploaded attachments.
          </p>
        </div>
      </div>

      <div className='overflow-y-auto overflow-x-hidden px-6 pb-10 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='rounded-4xl border border-slate-300/80 bg-white p-4 shadow-sm sm:p-6'>
            <div className='mb-5 flex flex-wrap items-start justify-between gap-3 px-1'>
              <div className='flex min-w-0 flex-wrap items-center gap-3'>
                {categoryLabel ? (
                  <span className='inline-flex rounded-lg bg-amber-400/90 px-3 py-1 text-lg font-semibold text-black'>
                    {categoryLabel}
                  </span>
                ) : null}
                {outletHeadline ? (
                  <h2 className='text-2xl font-bold tracking-tight text-black'>{outletHeadline}</h2>
                ) : null}
              </div>
              <div className='flex flex-wrap items-center gap-2'>
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
            </div>

            <section className='rounded-3xl border border-slate-300 bg-[#FAFAFA] p-4 sm:p-5'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                <div className='min-w-0 flex-1'>
                  <div className='space-y-3 text-slate-900'>
                    <div className='flex flex-wrap items-center gap-3'>
                      <span className='w-32 text-2xl font-bold leading-none'>Deadline</span>
                      <span className='text-xl font-medium leading-none text-slate-600'>
                        {dayjs(task.dueDate).format('MMM D, YYYY')}
                      </span>
                    </div>
                    <div className='flex flex-wrap items-center gap-3'>
                      <span className='w-32 text-2xl font-bold leading-none'>Assigned</span>
                      {assigneeNames.length > 0 ? (
                        <span className='text-xl text-slate-600'>{assigneeNames.join(', ')}</span>
                      ) : (
                        <span className='text-sm text-slate-500'>Unassigned</span>
                      )}
                    </div>
                    <div className='flex items-start gap-3'>
                      <span className='w-32 shrink-0 text-2xl font-bold leading-none'>
                        Description
                      </span>
                      <p className='text-xl leading-snug text-slate-600'>{task.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {adminAudioItems.length > 0 ? (
                <div className='mt-4 space-y-2'>
                  <p className='text-sm font-bold uppercase tracking-wide text-slate-600'>
                    Admin audio
                  </p>
                  {adminAudioItems.map((item) => (
                    <WhatsAppAudioPlayer
                      key={item.id}
                      src={item.url}
                      className='w-full max-w-107.5'
                      fitContainer
                    />
                  ))}
                </div>
              ) : null}

              {adminOtherItems.length > 0 ? (
                <div className='mt-4'>
                  <p className='mb-2 text-sm font-bold uppercase tracking-wide text-slate-600'>
                    Admin Attachments
                  </p>
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                    {adminOtherItems.map((item) => (
                      <AttachmentTile
                        key={item.id}
                        item={item}
                        onOpen={() => setSelectedMedia(item)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section className='mt-5 rounded-3xl border border-slate-300 bg-[#FAFAFA] p-4 sm:p-5'>
              <h3 className='text-xl font-bold text-slate-900'>Manager Submission</h3>
              {task.managerSubmission?.text && (
                <div className='mt-2'>
                  <p className='text-sm font-bold uppercase tracking-wide text-slate-600'>
                    Comments
                  </p>
                  <p className='mt-1 text-slate-800'>{task.managerSubmission.text}</p>
                </div>
              )}
              <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {managerOtherItems.map((item) => (
                  <AttachmentTile key={item.id} item={item} onOpen={() => setSelectedMedia(item)} />
                ))}
                {managerOtherItems.length === 0 && !managerAudioItems.length && (
                  <p className='col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500'>
                    No manager attachments available.
                  </p>
                )}
              </div>

              {managerAudioItems.length > 0 ? (
                <div className='mt-4 space-y-2'>
                  <p className='text-sm font-bold uppercase tracking-wide text-slate-600'>Audio</p>
                  {managerAudioItems.map((item) => (
                    <WhatsAppAudioPlayer
                      key={item.id}
                      src={item.url}
                      className='w-full max-w-107.5'
                      fitContainer
                    />
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>

      <Modal
        title={selectedMedia?.name}
        open={!!selectedMedia}
        onCancel={() => setSelectedMedia(null)}
        footer={null}
        width={720}
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
        {selectedMedia?.kind === 'pdf' && (
          <div className='space-y-3'>
            <iframe
              src={selectedMedia.url}
              title={selectedMedia.name}
              className='h-[70vh] w-full rounded-md border border-slate-200'
            />
            <a
              href={selectedMedia.url}
              target='_blank'
              rel='noreferrer'
              className='inline-flex text-sm font-semibold text-[#705E0C] hover:underline'
            >
              Open in new tab
            </a>
          </div>
        )}
        {(selectedMedia?.kind === 'doc' || selectedMedia?.kind === 'file') && (
          <div className='space-y-3 py-4'>
            <p className='text-sm text-slate-600'>
              Inline preview is not available for this file type.
            </p>
            <a
              href={selectedMedia.url}
              target='_blank'
              rel='noreferrer'
              className='inline-flex text-sm font-semibold text-[#705E0C] hover:underline'
            >
              Open or download file
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
