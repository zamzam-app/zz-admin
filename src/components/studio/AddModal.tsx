import { useState, useMemo, useEffect, useCallback } from 'react';
import { message, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { Button } from '../common/Button';
import Input from '../common/Input';
import { Modal } from '../common/Modal';
import { productApi } from '../../lib/services/api/product.api';
import type { Product, CreateProductRequest, UpdateProductDto } from '../../lib/types/product';
import { useApiMutation, useApiQuery } from '../../lib/react-query/use-api-hooks';
import { useImageUpload } from '../../lib/hooks/useImageUpload';
import { categoryApi } from '../../lib/services/api/category.api';
import { CATEGORY_KEYS } from '../../lib/types/category';
import type { Category } from '../../lib/types/category';

type AddModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (product: Product) => void;
  productToEdit?: Product | null;
};

const initialFormState: CreateProductRequest = {
  name: '',
  price: 1,
  description: '',
  images: [],
  categoryList: [],
};

export const AddModal: React.FC<AddModalProps> = ({
  open,
  onClose,
  onSuccess,
  productToEdit = null,
}) => {
  const [newProduct, setNewProduct] = useState(initialFormState);
  const [priceInput, setPriceInput] = useState('1');
  const isEditMode = !!productToEdit;
  const { data: categoriesData } = useApiQuery(CATEGORY_KEYS, () =>
    categoryApi.getCategories({ page: 1, limit: 100 }),
  );
  const categories: Category[] = categoriesData?.data ?? [];

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

  const updateMutation = useApiMutation(
    ({ id, payload }: { id: string; payload: UpdateProductDto }) => productApi.update(id, payload),
    [['products']],
    {
      onSuccess: (savedProduct) => {
        setNewProduct(initialFormState);
        onSuccess(savedProduct);
        onClose();
      },
    },
  );

  // Clear form when modal closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setNewProduct(initialFormState);
        setPriceInput(String(initialFormState.price ?? ''));
      }, 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Sync form state when modal opens (add vs edit) so form shows correct initial values
  useEffect(() => {
    if (!open) return;
    const next = productToEdit
      ? {
          name: productToEdit.name,
          price: productToEdit.price,
          description: productToEdit.description ?? '',
          images: productToEdit.images ?? [],
          categoryList: productToEdit.categoryList ?? [],
        }
      : initialFormState;
    const t = setTimeout(() => {
      setNewProduct(next);
      setPriceInput(next.price == null || Number.isNaN(next.price) ? '' : String(next.price));
    }, 0);
    return () => clearTimeout(t);
  }, [open, productToEdit]);

  const isPending = createMutation.isPending || updateMutation.isPending;

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

    if (Number.isNaN(newProduct.price) || newProduct.price < 0) {
      message.error('Price must be zero or more');
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
      categoryList: newProduct.categoryList ?? [],
    };

    try {
      if (isEditMode && productToEdit) {
        await updateMutation.mutateAsync({
          id: productToEdit._id,
          payload: {
            name: payload.name,
            price: payload.price,
            description: payload.description,
            images: payload.images,
            categoryList: payload.categoryList,
          },
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
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

  const compressImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return file;
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1280,
        maxSizeMB: 9.5,
        initialQuality: 0.7,
        useWebWorker: true,
      });
      if (compressed.size > 10 * 1024 * 1024) {
        message.error('Image is too large even after compression. Please choose a smaller image.');
        return null;
      }
      if (compressed instanceof File) return compressed;
      return new File([compressed], file.name, {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      });
    } catch {
      return file;
    }
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Product' : 'New Inventory Item'}
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
              multiline
              rows={5}
              value={newProduct.description ?? ''}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
            />
            <p className='mt-1 text-right text-xs text-gray-500'>
              {(newProduct.description ?? '').length} / 1000
            </p>
          </div>

          <div>
            <Input
              label='Price'
              value={priceInput}
              onChange={(e) => {
                const value = e.target.value;
                if (!/^\d*\.?\d*$/.test(value)) return;
                setPriceInput(value);
                if (value.trim() === '') {
                  setNewProduct({ ...newProduct, price: undefined as unknown as number });
                  return;
                }
                const parsed = Number(value);
                setNewProduct({ ...newProduct, price: Number.isNaN(parsed) ? parsed : parsed });
              }}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Cake Categories</label>
            {categories.length === 0 ? (
              <div className='text-sm text-gray-400'>No categories available.</div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {categories.map((category) => {
                  const selected = (newProduct.categoryList ?? []).includes(category._id);
                  return (
                    <label
                      key={category._id}
                      className='flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer hover:border-gray-200'
                    >
                      <input
                        type='checkbox'
                        checked={selected}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...(newProduct.categoryList ?? []), category._id]
                            : (newProduct.categoryList ?? []).filter((id) => id !== category._id);
                          setNewProduct({ ...newProduct, categoryList: next });
                        }}
                        className='w-4 h-4 rounded border-gray-300 text-[#1F2937] focus:ring-[#1F2937]'
                      />
                      <span className='text-sm font-medium text-gray-700'>{category.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
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
                const targetFile = file as File;
                compressImage(targetFile)
                  .then((compressed) => {
                    if (!compressed) return;
                    return upload(compressed);
                  })
                  .then((url) => {
                    if (!url) return;
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
            <Button type='button' variant='ghost' onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type='submit'
              variant='admin-primary'
              className='rounded-2xl px-10 inline-flex items-center gap-2'
              disabled={isPending || uploadLoading}
            >
              {isPending || uploadLoading ? (
                <>
                  <Loader2 size={18} className='animate-spin shrink-0 text-white' />
                  <span className='text-white'>Saving…</span>
                </>
              ) : isEditMode ? (
                'Save changes'
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
