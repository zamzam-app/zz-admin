import { Modal } from 'antd';
import { Mic } from 'lucide-react';
import type { AttachmentKind } from './outletTaskAttachment.types';

type AttachmentPreviewModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  kind: AttachmentKind;
  sourceUrl: string | null;
  forceVideoForAudio?: boolean;
};

export function AttachmentPreviewModal({
  title,
  open,
  onClose,
  kind,
  sourceUrl,
  forceVideoForAudio = false,
}: AttachmentPreviewModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={null}
      width={kind === 'audio' ? 420 : 760}
      zIndex={2000}
      centered
      destroyOnHidden
    >
      {sourceUrl && kind === 'image' && (
        <div className='flex justify-center bg-slate-50 py-2'>
          <img src={sourceUrl} alt='' className='max-h-[70vh] max-w-full object-contain' />
        </div>
      )}
      {sourceUrl && kind === 'video' && (
        <video
          key={sourceUrl}
          src={sourceUrl}
          className='max-h-[70vh] w-full bg-black object-contain'
          controls
          playsInline
          preload='auto'
        />
      )}
      {sourceUrl && kind === 'audio' && (
        <div className='flex flex-col items-center gap-4 py-4'>
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500'>
            <Mic size={28} aria-hidden />
          </div>
          {forceVideoForAudio ? (
            <video
              key={sourceUrl}
              src={sourceUrl}
              controls
              playsInline
              preload='auto'
              className='w-full bg-black'
            />
          ) : (
            <audio key={sourceUrl} src={sourceUrl} controls className='w-full' preload='auto' />
          )}
        </div>
      )}
      {sourceUrl && kind === 'pdf' && (
        <div className='space-y-3'>
          <iframe
            src={sourceUrl}
            title={title}
            className='h-[70vh] w-full rounded-md border border-slate-200'
          />
          <a
            href={sourceUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex text-sm font-semibold text-[#705E0C] hover:underline'
          >
            Open in new tab
          </a>
        </div>
      )}
      {sourceUrl && (kind === 'doc' || kind === 'file') && (
        <div className='space-y-3 py-4'>
          <p className='text-sm text-slate-600'>
            Inline preview is not available for this file type.
          </p>
          <a
            href={sourceUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex text-sm font-semibold text-[#705E0C] hover:underline'
          >
            Open or download file
          </a>
        </div>
      )}
      {!sourceUrl && (
        <div className='py-8 text-center text-sm text-slate-500'>Preparing preview…</div>
      )}
    </Modal>
  );
}
