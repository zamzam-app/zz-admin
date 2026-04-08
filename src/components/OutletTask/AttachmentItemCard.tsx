import { Image as ImageIcon, Mic, Paperclip, Video, X } from 'lucide-react';
import type { AttachmentKind } from './outletTaskAttachment.types';
import { KIND_LABEL } from './outletTaskAttachment.utils';

type AttachmentItemCardProps = {
  name: string;
  kind: AttachmentKind;
  onOpen: () => void;
  onRemove?: () => void;
};

export function AttachmentItemCard({ name, kind, onOpen, onRemove }: AttachmentItemCardProps) {
  const Icon =
    kind === 'image' ? ImageIcon : kind === 'video' ? Video : kind === 'audio' ? Mic : Paperclip;

  return (
    <div className='flex max-w-47.5 min-w-0 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-100 py-1 pl-1 pr-1 ring-1 ring-slate-200/90'>
      <button
        type='button'
        onClick={onOpen}
        className='flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-md text-left transition-colors hover:bg-slate-200/60'
        aria-label={`Preview ${name}`}
      >
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-500 text-white'>
          <Icon size={16} className='text-white' aria-hidden />
        </div>
        <div className='min-w-0 flex-1 py-0.5 leading-tight'>
          <p className='truncate text-xs font-bold text-slate-800' title={name}>
            {name}
          </p>
          <p className='mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500'>
            {KIND_LABEL[kind]}
          </p>
        </div>
      </button>

      {onRemove ? (
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className='shrink-0 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-700'
          aria-label={`Remove ${name}`}
        >
          <X size={12} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
