import { Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import type { User } from '../../lib/types/manager';

type DeleteModalProps = {
  open: boolean;
  onClose: () => void;
  employee: User | null;
  onConfirm: (id: string) => void;
  isPending?: boolean;
};

export function DeleteModal({
  open,
  onClose,
  employee,
  onConfirm,
  isPending = false,
}: DeleteModalProps) {
  const id = employee?._id || employee?.id;

  return (
    <Modal open={open} onClose={onClose} title='Delete Employee?' maxWidth='sm'>
      <div className='flex flex-col items-center text-center -mt-2'>
        <p className='text-gray-500 leading-relaxed mb-8'>
          Are you sure you want to delete{' '}
          <span className='font-bold text-[#1F2937]'>"{employee?.name}"</span>?
        </p>

        <div className='flex gap-3 w-full'>
          <button
            onClick={onClose}
            className='flex-1 py-3 rounded-xl font-bold text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all'
          >
            Cancel
          </button>

          <button
            onClick={() => id && onConfirm(id)}
            disabled={isPending}
            className='flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70'
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
