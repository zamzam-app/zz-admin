import dayjs from 'dayjs';
import type { ReactNode } from 'react';

function formatDeadlineLine(dueDate: string) {
  const d = dayjs(dueDate);
  const now = dayjs();
  if (d.isSame(now, 'day')) return 'Today';
  if (d.isSame(now.add(1, 'day'), 'day')) return 'Tomorrow';
  return d.format('MMM D, YYYY');
}

type TaskMetaHeaderProps = {
  badgeLabel: string;
  badgeClassName: string;
  categoryLabel: string;
  headlineName: string;
  description: string;
  dueDate: string;
  audioSection?: ReactNode;
};

export function TaskMetaHeader({
  badgeLabel,
  badgeClassName,
  categoryLabel,
  headlineName,
  description,
  dueDate,
  audioSection,
}: TaskMetaHeaderProps) {
  return (
    <div className='relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
      <div className='min-w-0 flex-1 space-y-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${badgeClassName}`}
          >
            {badgeLabel}
          </span>
          {categoryLabel ? (
            <span className='inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-600 ring-1 ring-inset ring-slate-200/80'>
              {categoryLabel}
            </span>
          ) : null}
        </div>

        <h1 className='text-2xl font-bold tracking-tight text-black sm:text-3xl'>{headlineName}</h1>
        <p className='max-w-2xl text-base leading-relaxed text-slate-600'>{description}</p>
        {audioSection}
      </div>

      <div className='flex w-full shrink-0 flex-col gap-3 sm:max-w-35 lg:items-stretch'>
        <div className='rounded-xl bg-[#F5F0E6] px-5 py-4 shadow-sm ring-1 ring-[#E8DFD0]'>
          <p className='text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C4A2A]'>
            Deadline
          </p>
          <p className='mt-1 text-lg font-bold text-[#3D2F1A]'>{formatDeadlineLine(dueDate)}</p>
        </div>
      </div>
    </div>
  );
}
