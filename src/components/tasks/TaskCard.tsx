import { useMemo, useState } from 'react';
import { Dropdown, Image } from 'antd';
import type { MenuProps } from 'antd';
import { Camera, CheckCircle2, File, Mic, Pencil, Trash2, Video } from 'lucide-react';
import type { Task, TaskPriority } from '../../lib/types/task';
import { WhatsAppAudioPlayer } from '../common/WhatsAppAudioPlayer';

const STATUS_ROW = {
  in_progress: {
    label: 'In progress',
    className: 'border border-sky-200/90 bg-sky-100 text-sky-900',
  },
};

const CATEGORY_PILL = 'border border-emerald-200/90 bg-emerald-50 text-emerald-900';
const MEDIA_ICON_CLASS =
  'box-content cursor-pointer rounded-lg p-1.5 text-slate-500 transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-900/10 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400';
const PRIORITY_BACKGROUND: Record<TaskPriority, string> = {
  low: '#ecfdf5',
  medium: '#fefce8',
  high: '#fef2f2',
};

type Props = {
  task: Task;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onOpen?: () => void;
};

export function TaskCard({ task, isAdmin, onEdit, onDelete, onComplete, onOpen }: Props) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isAudioDropdownOpen, setIsAudioDropdownOpen] = useState(false);
  const showComplete = !isAdmin && task.status !== 'completed' && onComplete;
  const statusCfg = task.status === 'in_progress' ? STATUS_ROW.in_progress : null;
  const title = task.title?.trim() || task.description?.trim() || 'Task';
  const outletName = task.outletName?.trim();
  const backgroundColor = PRIORITY_BACKGROUND[task.priority] ?? PRIORITY_BACKGROUND.medium;
  const categoryLabel = task.category
    ? task.category.charAt(0).toUpperCase() + task.category.slice(1)
    : null;
  const assigneeLabel =
    task.assigneeNames && task.assigneeNames.length > 0
      ? task.assigneeNames.join(', ')
      : 'Unassigned';
  const imageUrls = useMemo(() => {
    const urls = task.imageUrls ?? (task.imageUrl ? [task.imageUrl] : []);
    return Array.from(new Set(urls.filter(Boolean)));
  }, [task.imageUrl, task.imageUrls]);
  const rawMediaUrls = useMemo(
    () => Array.from(new Set((task.videoUrls ?? []).filter(Boolean))),
    [task.videoUrls],
  );
  const videoUrls = useMemo(
    () => rawMediaUrls.filter((url) => !/\.(mp3|wav|m4a|aac|ogg|oga|flac)(\?|#|$)/i.test(url)),
    [rawMediaUrls],
  );
  const audioUrls = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...(task.adminAudioUrl ?? []),
            ...(task.managerAudioUrl ?? []),
            ...(task.audioUrls ?? []),
            ...rawMediaUrls.filter((url) => /\.(mp3|wav|m4a|aac|ogg|oga|flac)(\?|#|$)/i.test(url)),
          ].filter(Boolean),
        ),
      ),
    [rawMediaUrls, task.adminAudioUrl, task.audioUrls, task.managerAudioUrl],
  );
  const fileUrls = useMemo(() => {
    const fromSubmissions = [
      ...(task.adminSubmission?.attachments?.files ?? []),
      ...(task.managerSubmission?.attachments?.files ?? []),
    ];
    if (fromSubmissions.length > 0) return Array.from(new Set(fromSubmissions));

    const files =
      (task as Task & { fileUrls?: string[]; attachmentUrls?: string[]; files?: string[] })
        .fileUrls ??
      (task as Task & { fileUrls?: string[]; attachmentUrls?: string[]; files?: string[] })
        .attachmentUrls ??
      (task as Task & { fileUrls?: string[]; attachmentUrls?: string[]; files?: string[] }).files ??
      [];
    return Array.from(new Set(files.filter(Boolean)));
  }, [task]);

  const imageMenuItems = useMemo<MenuProps['items']>(() => {
    if (imageUrls.length === 0) {
      return [
        {
          key: 'no-images',
          label: <span className='text-slate-500'>No images to show</span>,
          disabled: true,
        },
      ];
    }

    return imageUrls.map((_, index) => ({
      key: String(index),
      label: (
        <span className='block max-w-55 truncate' title={`Image ${index + 1}`}>
          Image {index + 1}
        </span>
      ),
      onClick: (e) => {
        e.domEvent.stopPropagation();
        setPreviewIndex(index);
        setIsPreviewOpen(true);
      },
    }));
  }, [imageUrls]);
  const videoMenuItems = useMemo<MenuProps['items']>(() => {
    if (videoUrls.length === 0) {
      return [
        {
          key: 'no-videos',
          label: <span className='text-slate-500'>No videos to show</span>,
          disabled: true,
        },
      ];
    }

    return videoUrls.map((url, index) => ({
      key: String(index),
      label: (
        <span className='block max-w-55 truncate' title={`Video ${index + 1}`}>
          Video {index + 1}
        </span>
      ),
      onClick: (e) => {
        e.domEvent.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    }));
  }, [videoUrls]);
  const fileMenuItems = useMemo<MenuProps['items']>(() => {
    if (fileUrls.length === 0) {
      return [
        {
          key: 'no-files',
          label: <span className='text-slate-500'>No files to show</span>,
          disabled: true,
        },
      ];
    }

    return fileUrls.map((url, index) => ({
      key: String(index),
      label: (
        <span className='block max-w-55 truncate' title={`File ${index + 1}`}>
          File {index + 1}
        </span>
      ),
      onClick: (e) => {
        e.domEvent.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    }));
  }, [fileUrls]);
  return (
    <div
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (!onOpen) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`flex h-full flex-col gap-4 rounded-2xl border border-slate-200 p-5 shadow-sm ${
        onOpen
          ? 'cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400'
          : ''
      }`}
      style={{ backgroundColor }}
    >
      <div className='flex items-center justify-between gap-3'>
        {statusCfg ? (
          <span
            className={`inline-flex max-w-[65%] items-center rounded-full px-3 py-1 text-[11px] font-semibold leading-none ${statusCfg.className}`}
          >
            {statusCfg.label}
          </span>
        ) : (
          <span aria-hidden />
        )}
        <span aria-hidden />
      </div>

      {(categoryLabel || outletName) && (
        <div className='flex flex-wrap items-center gap-2'>
          {categoryLabel && (
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize leading-none ${CATEGORY_PILL}`}
            >
              {categoryLabel}
            </span>
          )}
          {outletName && <p className='text-sm font-medium text-slate-500'>{outletName}</p>}
        </div>
      )}

      <div>
        <h3 className='text-base font-bold leading-snug text-slate-900'>{title}</h3>
      </div>

      <div>
        <p className='text-sm leading-relaxed text-slate-600'>
          <span className='mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500'>
            Comments
          </span>
          {task.description}
        </p>
      </div>

      <div className='mt-auto flex flex-col gap-4'>
        <p className='text-sm text-slate-500'>
          Assigned to: <span className='font-bold text-slate-900'>{assigneeLabel}</span>
        </p>

        <div className='flex items-center justify-between gap-3 border-t border-slate-100 pt-4'>
          <div className='flex items-center gap-1'>
            <Dropdown trigger={['click']} menu={{ items: imageMenuItems }}>
              <button
                type='button'
                className={MEDIA_ICON_CLASS}
                onClick={(e) => e.stopPropagation()}
                aria-label='View photos'
                title='View photos'
              >
                <Camera size={16} />
              </button>
            </Dropdown>
            <Dropdown trigger={['click']} menu={{ items: videoMenuItems }}>
              <button
                type='button'
                className={MEDIA_ICON_CLASS}
                onClick={(e) => e.stopPropagation()}
                aria-label='View videos'
              >
                <Video size={16} />
              </button>
            </Dropdown>
            <Dropdown trigger={['click']} menu={{ items: fileMenuItems }}>
              <button
                type='button'
                className={MEDIA_ICON_CLASS}
                onClick={(e) => e.stopPropagation()}
                aria-label='View files'
              >
                <File size={16} />
              </button>
            </Dropdown>
            <Dropdown
              trigger={['click']}
              open={isAudioDropdownOpen}
              onOpenChange={setIsAudioDropdownOpen}
              popupRender={() => (
                <div
                  className='w-75 overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-lg'
                  onClick={(e) => e.stopPropagation()}
                >
                  {audioUrls.length === 0 ? (
                    <p className='px-2 py-1.5 text-sm text-slate-500'>No audio to show</p>
                  ) : (
                    <div className='flex flex-col gap-2'>
                      {audioUrls.map((url, index) => (
                        <div key={`${url}-${index}`}>
                          <p className='mb-1 truncate text-xs font-semibold text-slate-600'>
                            Audio {index + 1}
                          </p>
                          <WhatsAppAudioPlayer
                            src={url}
                            className='w-full max-w-full'
                            fitContainer
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            >
              <button
                type='button'
                className={MEDIA_ICON_CLASS}
                onClick={(e) => e.stopPropagation()}
                aria-label='Listen to audio'
              >
                <Mic size={16} />
              </button>
            </Dropdown>
          </div>

          {(showComplete || (isAdmin && onEdit) || onDelete) && (
            <div className='flex flex-wrap items-center justify-end gap-1'>
              {showComplete && (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete?.();
                  }}
                  className='inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100'
                >
                  <CheckCircle2 size={14} /> Complete
                </button>
              )}
              {isAdmin && onEdit && (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className='cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800'
                  title='Edit'
                >
                  <Pencil size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className='cursor-pointer rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50'
                  title='Delete'
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {imageUrls.length > 0 ? (
        <div className='hidden' onClick={(e) => e.stopPropagation()}>
          <Image.PreviewGroup
            preview={{
              visible: isPreviewOpen,
              current: previewIndex,
              onVisibleChange: (visible) => setIsPreviewOpen(visible),
              onChange: (current) => setPreviewIndex(current),
            }}
          >
            {imageUrls.map((url, idx) => (
              <Image key={`${url}-${idx}`} src={url} alt={`Task image ${idx + 1}`} />
            ))}
          </Image.PreviewGroup>
        </div>
      ) : null}
    </div>
  );
}
