import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { ChevronRight, Mic, Paperclip } from 'lucide-react';
import type { Task } from '../../lib/types/task';
import { Button } from '../common/Button';
import { AttachmentItemCard } from './AttachmentItemCard';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import type { PendingAttachment, UploadedAttachment } from './outletTaskAttachment.types';
import { ACCEPTED_ATTACHMENT_INPUT } from './outletTaskAttachment.utils';

type PendingAttachmentListItemProps = {
  attachment: PendingAttachment;
  onRemove: () => void;
};

function PendingAttachmentListItem({ attachment, onRemove }: PendingAttachmentListItemProps) {
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

  const useVideoForAudioPreview =
    attachment.kind === 'audio' &&
    (attachment.file.type.includes('webm') || /\.webm$/i.test(attachment.file.name));

  return (
    <>
      <AttachmentItemCard
        name={attachment.file.name}
        kind={attachment.kind}
        onOpen={() => setPreviewOpen(true)}
        onRemove={onRemove}
      />
      <AttachmentPreviewModal
        title={attachment.file.name}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        kind={attachment.kind}
        sourceUrl={objectUrl}
        forceVideoForAudio={useVideoForAudioPreview}
      />
    </>
  );
}

function UploadedAttachmentListItem({ attachment }: { attachment: UploadedAttachment }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <AttachmentItemCard
        name={attachment.name}
        kind={attachment.kind}
        onOpen={() => setPreviewOpen(true)}
      />
      <AttachmentPreviewModal
        title={attachment.name}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        kind={attachment.kind}
        sourceUrl={attachment.url}
      />
    </>
  );
}

type NotesAttachmentsSectionProps = {
  task: Task;
  note: string;
  onNoteChange: (value: string) => void;
  uploadedAttachments: UploadedAttachment[];
  pendingAttachments: PendingAttachment[];
  onAddAttachments: (files: FileList | null) => void;
  onRemovePendingAttachment: (id: string) => void;
  onToggleRecording: () => void;
  isRecording: boolean;
  onCompleteTask: () => Promise<void> | void;
  isCompleting: boolean;
  isPending: boolean;
};

export function NotesAttachmentsSection({
  task,
  note,
  onNoteChange,
  uploadedAttachments,
  pendingAttachments,
  onAddAttachments,
  onRemovePendingAttachment,
  onToggleRecording,
  isRecording,
  onCompleteTask,
  isCompleting,
  isPending,
}: NotesAttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const disableActions = task.status === 'completed';

  const completeDisabled = isPending || isCompleting || isRecording;
  const completeTitle = isRecording
    ? 'Stop recording before completing the task'
    : isCompleting
      ? 'Uploading attachments...'
      : undefined;

  return (
    <section className='mt-10 rounded-xl border border-slate-200/90 bg-slate-100/80 p-6 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h2 className='text-lg font-bold text-slate-900'>Notes &amp; Attachments</h2>
          <p className='mt-1 text-sm text-slate-500'>Provide notes or required documentation</p>
        </div>
        {task.status === 'completed' && task.updatedAt ? (
          <p className='text-xs font-semibold text-slate-600'>
            Completed on {dayjs(task.updatedAt).format('MMM D, YYYY hh:mm A')}
          </p>
        ) : null}
      </div>

      <div className='mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
        <input
          ref={fileInputRef}
          type='file'
          accept={ACCEPTED_ATTACHMENT_INPUT}
          multiple
          className='hidden'
          onChange={(e) => {
            onAddAttachments(e.target.files);
            e.target.value = '';
          }}
        />

        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder='Type your delivery notes here...'
          rows={6}
          disabled={disableActions}
          className='w-full resize-none border-0 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'
        />

        <div className='flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
          <div className='flex min-h-11 min-w-0 flex-1 flex-wrap items-start gap-3'>
            {uploadedAttachments.map((attachment) => (
              <UploadedAttachmentListItem key={attachment.id} attachment={attachment} />
            ))}
            {pendingAttachments.map((attachment) => (
              <PendingAttachmentListItem
                key={attachment.id}
                attachment={attachment}
                onRemove={() => onRemovePendingAttachment(attachment.id)}
              />
            ))}
          </div>

          <div className='flex shrink-0 flex-wrap items-center justify-end gap-2'>
            {isRecording ? (
              <span className='mr-1 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-100'>
                <span className='relative flex h-2 w-2'>
                  <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75' />
                  <span className='relative inline-flex h-2 w-2 rounded-full bg-rose-600' />
                </span>
                Recording… tap mic to stop
              </span>
            ) : null}

            <button
              type='button'
              disabled={disableActions}
              onClick={() => fileInputRef.current?.click()}
              className='cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40'
              aria-label='Attach file'
            >
              <Paperclip size={20} aria-hidden />
            </button>
            <button
              type='button'
              disabled={disableActions}
              onClick={onToggleRecording}
              aria-pressed={isRecording}
              aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
              className={`cursor-pointer rounded-lg p-2 transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 ${
                isRecording
                  ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-300 ring-offset-1'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Mic size={20} aria-hidden />
            </button>

            {task.status !== 'completed' ? (
              <Button
                variant='admin-primary'
                disabled={completeDisabled}
                onClick={() => void onCompleteTask()}
                title={completeTitle}
                endIcon={<ChevronRight size={16} aria-hidden />}
              >
                {isCompleting ? 'Uploading...' : 'Complete task'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
