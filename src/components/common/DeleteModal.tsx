import { Loader2 } from 'lucide-react';
import { Modal } from './Modal';

export type DeleteModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  entityName?: string | null;
  confirmId: string | undefined;
  onConfirm: (id: string) => void;
  isPending?: boolean;
};

export function DeleteModal({
  open,
  onClose,
  title,
  entityName,
  confirmId,
  onConfirm,
  isPending = false,
}: DeleteModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth='sm'>
      <div className='flex flex-col items-center text-center -mt-2'>
        <p className='text-gray-500 leading-relaxed mb-8'>
          Are you sure you want to delete
          {entityName != null && entityName !== '' ? (
            <>
              {' '}
              <span className='font-bold text-[#1F2937]'>&quot;{entityName}&quot;</span>?
            </>
          ) : (
            <> this item?</>
          )}
        </p>

        <div className='flex gap-3 w-full'>
          <button
            onClick={onClose}
            className='flex-1 py-3 rounded-xl font-bold text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer'
          >
            Cancel
          </button>

          <button
            onClick={() => confirmId && onConfirm(confirmId)}
            disabled={isPending}
            className='flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer'
          >
            {isPending ? (
              <>
                <Loader2 size={16} className='animate-spin' />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
