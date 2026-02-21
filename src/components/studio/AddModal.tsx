import { useState } from 'react';
import { Button } from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { Modal } from '../common/Modal';
import { productApi } from '../../lib/services/api/product.api';
import type { Product, CreateProductRequest } from '../../lib/types/product';
import { useImageUpload } from '../../lib/hooks/useImageUpload';

type AddModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (product: Product) => void;
};

const initialFormState: Partial<Product> & { type?: 'premade' | 'custom' } = {
  name: '',
  price: undefined,
  description: '',
  images: [],
  type: 'premade',
};

export const AddModal: React.FC<AddModalProps> = ({ open, onClose, onSuccess }) => {
  const [newCake, setNewCake] = useState(initialFormState);

  const {
    upload,
    loading: uploadLoading,
    error: uploadError,
    clearError: clearUploadError,
  } = useImageUpload('products');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newCake.name || !newCake.price) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const payload = {
        name: newCake.name,
        price: newCake.price,
        description: newCake.description || '',
        ratingsId: '60d5ecb86217152c9043e02d', // ⚠ replace with real one if dynamic
        images: newCake.images ?? [],
        type: newCake.type || 'premade',
      };

      const savedProduct = await productApi.create(payload as CreateProductRequest);
      onSuccess(savedProduct);
      setNewCake(initialFormState);
      onClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Save failed:', error.message);
      } else {
        console.error('Save failed:', error);
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title='New Inventory Item' maxWidth='lg'>
      <div className='max-h-[70vh] overflow-y-auto -mx-2 px-2'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <Input
              label='Product Title'
              value={newCake.name || ''}
              onChange={(e) => setNewCake({ ...newCake, name: e.target.value })}
              required
            />
          </div>

          <div className='grid grid-cols-2 gap-8'>
            <Input
              label='Price ($)'
              type='number'
              value={newCake.price ?? ''}
              onChange={(e) => setNewCake({ ...newCake, price: Number(e.target.value) })}
              required
            />
            <Select
              label='Type'
              options={['premade', 'custom']}
              value={newCake.type || 'premade'}
              onChange={(e) =>
                setNewCake({ ...newCake, type: e.target.value as 'premade' | 'custom' })
              }
            />
          </div>

          <div>
            <Input
              label='Description'
              value={newCake.description || ''}
              onChange={(e) => setNewCake({ ...newCake, description: e.target.value })}
            />
          </div>

          {/* Cloudinary image upload */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Upload Images</label>
            <input
              type='file'
              multiple
              accept='image/*'
              disabled={uploadLoading}
              onChange={async (e) => {
                const files = e.target.files;
                if (!files?.length) return;
                clearUploadError();
                try {
                  const urls = await Promise.all(Array.from(files).map((file) => upload(file)));
                  setNewCake((prev) => ({
                    ...prev,
                    images: [...(prev.images ?? []), ...urls],
                  }));
                } catch {
                  // error already set in hook
                }
                e.target.value = '';
              }}
              className='block w-full text-sm text-gray-500 file:py-2 file:px-4 file:border file:border-gray-300 file:rounded-lg file:text-sm file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none'
            />
            {uploadLoading && <p className='mt-1 text-sm text-gray-500'>Uploading…</p>}
            {uploadError && <p className='mt-1 text-sm text-red-600'>{uploadError.message}</p>}
            {/* Preview */}
            <div className='flex flex-wrap gap-2 mt-2'>
              {(newCake.images ?? []).map((url, idx) => (
                <div key={idx} className='relative'>
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className='w-16 h-16 object-cover rounded-lg'
                  />
                  <button
                    type='button'
                    onClick={() =>
                      setNewCake((prev) => ({
                        ...prev,
                        images: (prev.images ?? []).filter((_, i) => i !== idx),
                      }))
                    }
                    className='absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600'
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className='flex justify-end gap-6'>
            <Button type='button' variant='ghost' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' variant='admin-primary' className='rounded-2xl px-10'>
              Launch Item
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
