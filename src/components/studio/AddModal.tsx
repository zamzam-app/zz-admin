import { useState, useMemo, useEffect } from 'react';
import { message, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { Loader2 } from 'lucide-react';
import { Button } from '../common/Button';
import Input from '../common/Input';
import { Modal } from '../common/Modal';
import { productApi } from '../../lib/services/api/product.api';
import type { Product, CreateProductRequest } from '../../lib/types/product';
import { useApiMutation } from '../../lib/react-query/use-api-hooks';
import { useImageUpload } from '../../lib/hooks/useImageUpload';

type AddModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (product: Product) => void;
};

const initialFormState: CreateProductRequest = {
  name: '',
  price: 1,
  description: '',
  images: [],
};

export const AddModal: React.FC<AddModalProps> = ({ open, onClose, onSuccess }) => {
  const [newProduct, setNewProduct] = useState(initialFormState);

  const createMutation = useApiMutation(
    (payload: CreateProductRequest) => productApi.create(payload),
    [['products']],
    {
      onSuccess: (savedProduct) => {
        setNewProduct(initialFormState);
        onSuccess(savedProduct);
        onClose();
      },
    },
  );

  const {
    upload,
    loading: uploadLoading,
    error: uploadError,
    clearError: clearUploadError,
  } = useImageUpload('products');

  useEffect(() => {
    if (uploadError) message.error(uploadError.message);
  }, [uploadError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newProduct.name || !newProduct.description || newProduct.price == null) {
      message.error('Please fill all required fields');
      return;
    }

    if (!newProduct.images?.length) {
      message.error('Please upload at least one image');
      return;
    }

    const payload: CreateProductRequest = {
      name: newProduct.name,
      price: newProduct.price,
      description: newProduct.description ?? '',
      images: newProduct.images ?? [],
    };

    try {
      await createMutation.mutateAsync(payload);
    } catch (err: unknown) {
      const data =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
          ? (err.response.data as { message?: string | string[] }).message
          : undefined;
      const msg = data;
      const firstError = Array.isArray(msg)
        ? msg[0]
        : typeof msg === 'string'
          ? msg
          : 'Something went wrong';
      message.error(firstError);
    }
  };

  const uploadFileList: UploadFile[] = useMemo(
    () =>
      (newProduct.images ?? []).map((url, i) => ({
        uid: `${i}-${url}`,
        name: url.split('/').pop() ?? 'image',
        status: 'done' as const,
        url,
      })),
    [newProduct.images],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='New Inventory Item'
      titleAlign='center'
      maxWidth='lg'
      contentClassName='pt-2 px-8 pb-8'
    >
      <div className='max-h-[70vh] overflow-y-auto -mx-2 px-2 pt-4'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <Input
              label='Product Title'
              value={newProduct.name || ''}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
          </div>

          <div>
            <Input
              label='Description'
              value={newProduct.description ?? ''}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            />
          </div>

          <div>
            <Input
              label='Price'
              value={newProduct.price ?? ''}
              onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
            />
          </div>

          {/* Image upload */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Upload Images</label>
            <Upload
              accept='image/*'
              multiple
              maxCount={4}
              listType='picture-card'
              fileList={uploadFileList}
              disabled={uploadLoading}
              customRequest={({ file, onSuccess, onError }) => {
                clearUploadError();
                upload(file as File)
                  .then((url) => {
                    setNewProduct((prev) => ({
                      ...prev,
                      images: [...(prev.images ?? []), url],
                    }));
                    onSuccess?.(url);
                  })
                  .catch((err) =>
                    onError?.(err instanceof Error ? err : new Error('Upload failed')),
                  );
              }}
              onRemove={(file) => {
                setNewProduct((prev) => ({
                  ...prev,
                  images: (prev.images ?? []).filter((u) => u !== file.url),
                }));
              }}
              showUploadList={{ showPreviewIcon: false }}
            >
              {uploadFileList.length >= 4 ? null : uploadLoading ? (
                <span className='inline-flex flex-col items-center justify-center gap-2 text-gray-400 pointer-events-none'>
                  <Loader2 size={24} className='animate-spin' />
                  <span className='text-xs'>Uploading…</span>
                </span>
              ) : (
                '+ Upload'
              )}
            </Upload>
          </div>

          <div className='flex justify-end gap-6'>
            <Button
              type='button'
              variant='ghost'
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='admin-primary'
              className='rounded-2xl px-10 inline-flex items-center gap-2'
              disabled={createMutation.isPending || uploadLoading}
            >
              {createMutation.isPending || uploadLoading ? (
                <>
                  <Loader2 size={18} className='animate-spin shrink-0 text-white' />
                  <span className='text-white'>Saving…</span>
                </>
              ) : (
                'Launch Item'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
