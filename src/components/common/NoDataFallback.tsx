import { Inbox } from 'lucide-react';

type NoDataFallbackProps = {
  /** Primary message shown below the icon */
  title?: string;
  /** Optional secondary description */
  description?: string;
  /** Optional action slot (e.g. a button) */
  action?: React.ReactNode;
  /** Optional custom icon; defaults to Inbox */
  icon?: React.ReactNode;
  /** Optional class name for the root container */
  className?: string;
};

export function NoDataFallback({
  title = 'No data found',
  description,
  action,
  icon,
  className = '',
}: NoDataFallbackProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
      role='status'
      aria-label={title}
    >
      <div className='flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 mb-4'>
        {icon ?? <Inbox size={28} strokeWidth={1.5} />}
      </div>
      <h3 className='text-lg font-bold text-[#1F2937] tracking-tight'>{title}</h3>
      {description && <p className='mt-1 text-sm text-gray-500 max-w-sm'>{description}</p>}
      {action && <div className='mt-6'>{action}</div>}
    </div>
  );
}
