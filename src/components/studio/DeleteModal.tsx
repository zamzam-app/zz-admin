import React from 'react';
import { Modal } from '../common/Modal';
import type { Product } from '../../lib/types/product';

type DeleteModalProps = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (id: string) => void;
};

export const DeleteModal: React.FC<DeleteModalProps> = ({ open, onClose, product, onConfirm }) => (
  <Modal open={open} onClose={onClose} title='Delete Product?'>
    <div className='flex flex-col items-center text-center -mt-2'>
      <p className='text-gray-500 text-sm leading-relaxed mb-8'>
        Are you sure you want to delete{' '}
        <span className='font-bold text-[#1F2937]'>"{product?.name}"</span>? <br />
      </p>

      <div className='flex gap-3 w-full'>
        <button
          onClick={onClose}
          className='flex-1 py-3 rounded-xl font-bold text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all'
        >
          Cancel
        </button>

        <button
          onClick={() => {
            if (product) onConfirm(product._id);
          }}
          className='flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100 transition-all active:scale-95'
        >
          Delete
        </button>
      </div>
    </div>
  </Modal>
);
