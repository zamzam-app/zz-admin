import dayjs from 'dayjs';
import { Calendar, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import type { Task, TaskStatus } from '../../lib/types/task';

const STATUS_ROW: Record<TaskStatus, { label: string; className: string }> = {
  OPEN: {
    label: 'Open',
    className: 'border border-slate-200 bg-slate-100 text-slate-700',
  },
  ASSIGNED: {
    label: 'Assigned',
    className: 'border border-slate-200 bg-slate-100 text-slate-700',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'border border-sky-200/90 bg-sky-100 text-sky-900',
  },
  READY_FOR_REVIEW: {
    label: 'Ready for review',
    className: 'border border-sky-200/90 bg-sky-100 text-sky-900',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'border border-emerald-200 bg-emerald-50 text-emerald-900',
  },
};

const CATEGORY_PILL = 'border border-emerald-200/90 bg-emerald-50 text-emerald-900';

type Props = {
  task: Task;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onOpen?: () => void;
};

export function TaskCard({ task, isAdmin, onEdit, onDelete, onComplete, onOpen }: Props) {
  const showComplete = !isAdmin && task.status !== 'COMPLETED' && onComplete;
  const statusCfg = STATUS_ROW[task.status] || STATUS_ROW.OPEN;
  const headlineName = task.outlet?.name?.trim() || task.title;
  const assigneeLabel =
    task.assignees && task.assignees.length > 0
      ? task.assignees.map((a) => a.name).join(', ')
      : 'Unassigned';

  const firstImageUrl = task.adminSubmission?.attachments?.images?.[0];

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
      className={`flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.06)] ${
        onOpen
          ? 'cursor-pointer transition-shadow hover:shadow-[0_4px_14px_rgba(15,23,42,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400'
          : ''
      }`}
    >
      <div className='flex items-center justify-between gap-3'>
        <span
          className={`inline-flex max-w-[65%] items-center rounded-full px-3 py-1 text-[11px] font-semibold leading-none ${statusCfg.className}`}
        >
          {statusCfg.label}
        </span>
        <div className='flex shrink-0 items-center gap-1.5 text-xs text-slate-400'>
          <Calendar className='h-3.5 w-3.5' strokeWidth={2} aria-hidden />
          <time dateTime={task.dueDate}>{dayjs(task.dueDate).format('YYYY-MM-DD')}</time>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        {task.taskCategory?.name && (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize leading-none ${CATEGORY_PILL}`}
          >
            {task.taskCategory.name}
          </span>
        )}
        <span className='text-base font-bold leading-snug text-slate-900'>{headlineName}</span>
      </div>

      <p className='text-sm leading-relaxed text-slate-600'>{task.description}</p>

      {firstImageUrl ? (
        <div className='overflow-hidden rounded-lg'>
          <img
            src={firstImageUrl}
            alt=''
            className='aspect-video w-full object-cover'
            loading='lazy'
          />
        </div>
      ) : null}

      <div className='mt-auto flex flex-col gap-4'>
        <p className='text-sm text-slate-500'>
          Assigned to: <span className='font-bold text-slate-900'>{assigneeLabel}</span>
        </p>

        {(showComplete || (isAdmin && onEdit) || onDelete) && (
          <div className='flex flex-wrap items-center justify-end gap-1 border-t border-slate-100 pt-4'>
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
  );
}
