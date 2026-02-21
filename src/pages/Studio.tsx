import { useState } from 'react';
import { Image, Popconfirm, Switch } from 'antd';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { NoDataFallback } from '../components/common/NoDataFallback';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '../lib/react-query/use-api-hooks';
import { productApi } from '../lib/services/api/product.api';
import type { Product } from '../lib/types/product';
import { AddModal } from '../components/studio/AddModal';
import { DeleteModal } from '../components/common/DeleteModal';

const PRODUCT_KEYS = ['products'];

const Studio = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<{ id: string; list: boolean } | null>(null);

  const { data, isLoading, error, refetch } = useApiQuery(PRODUCT_KEYS, () => productApi.getAll());
  const products = Array.isArray(data) ? data : [];

  const deleteMutation = useApiMutation((id: string) => productApi.delete(id), [PRODUCT_KEYS]);
  const toggleMutation = useApiMutation(
    (payload: { id: string; isActive: boolean }) =>
      productApi.update(payload.id, { isActive: payload.isActive }),
    [PRODUCT_KEYS],
    { onSuccess: () => setToggleConfirm(null) },
  );

  const confirmDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setProductToDelete(null);
      },
    });
  };

  const handleToggleConfirm = () => {
    if (toggleConfirm) {
      toggleMutation.mutate({ id: toggleConfirm.id, isActive: toggleConfirm.list });
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div>
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h3 className='font-black text-3xl text-[#1F2937] tracking-tight'>Product Catalog</h3>
            <p className='text-gray-500 text-sm mt-1'>Create new products</p>
          </div>
        </div>
        <div className='bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden'>
          <NoDataFallback
            title='Failed to load products'
            description={error.message}
            action={
              <Button variant='admin-primary' onClick={() => refetch()} className='rounded-2xl'>
                Try again
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h3 className='font-black text-3xl text-[#1F2937] tracking-tight'>Product Catalog</h3>
          <p className='text-gray-500 text-sm mt-1'>Create new products</p>
        </div>
        <Button
          variant='admin-primary'
          onClick={() => {
            setProductToEdit(null);
            setIsModalOpen(true);
          }}
          className='rounded-2xl py-4 shadow-xl shadow-gray-900/10'
        >
          <div className='flex items-center gap-2'>
            <Plus size={20} /> Add New Listing
          </div>
        </Button>
      </div>

      {/* Table */}
      <div className='bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden'>
        <table className='w-full text-left'>
          <thead className='bg-[#F9FAFB] text-gray-400 text-[10px] uppercase font-black tracking-[0.2em]'>
            <tr>
              <th className='px-8 py-6'>Reference</th>
              <th className='px-8 py-6'>Details</th>
              <th className='px-8 py-6 text-center'>Price</th>
              <th className='px-8 py-6 text-right'>Control</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-50 text-[#1F2937]'>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className='px-8 py-0'>
                  <NoDataFallback
                    title='No products yet'
                    description='Add your first item to get started.'
                    action={
                      <Button
                        variant='admin-primary'
                        onClick={() => {
                          setProductToEdit(null);
                          setIsModalOpen(true);
                        }}
                        className='rounded-2xl'
                      >
                        <span className='flex items-center gap-2'>
                          <Plus size={18} /> Add New Listing
                        </span>
                      </Button>
                    }
                  />
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id} className='hover:bg-[#F9FAFB]/50 transition-colors'>
                  <td className='px-8 py-6'>
                    <div className='w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-[#F9FAFB] cursor-pointer'>
                      {product.images?.length ? (
                        <Image.PreviewGroup
                          preview={{
                            zIndex: 10000,
                            actionsRender: (_, { icons }) => (
                              <span className='ant-image-preview-operations'>
                                {icons.zoomInIcon}
                                {icons.zoomOutIcon}
                                {icons.prevIcon}
                                {icons.nextIcon}
                              </span>
                            ),
                          }}
                        >
                          {(product.images ?? []).map((src, i) => (
                            <Image
                              key={src}
                              src={src}
                              alt={`${product.name} ${i + 1}`}
                              style={i > 0 ? { display: 'none' } : undefined}
                              rootClassName={i === 0 ? '!block w-full h-full' : undefined}
                              classNames={
                                i === 0
                                  ? { root: '!w-full !h-full', image: '!w-16 !h-16 !object-cover' }
                                  : undefined
                              }
                              preview={{ mask: 'Preview' }}
                            />
                          ))}
                        </Image.PreviewGroup>
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-gray-400 text-xs'>
                          No image
                        </div>
                      )}
                    </div>
                  </td>
                  <td className='px-8 py-6'>
                    <div className='font-bold mb-1'>{product.name}</div>
                    <div className='text-[10px] font-black text-[#D4AF37] uppercase tracking-widest'>
                      {product.description
                        ? product.description.slice(0, 30) +
                          (product.description.length > 30 ? '…' : '')
                        : '—'}
                    </div>
                  </td>
                  <td className='px-8 py-6 text-center'>
                    <div className='inline-block px-3 py-1 bg-emerald-50 text-[#10B981] rounded-lg font-black text-sm'>
                      ${product.price}
                    </div>
                  </td>
                  <td className='px-8 py-6 text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      <Popconfirm
                        open={toggleConfirm?.id === product._id}
                        onOpenChange={(open) => !open && setToggleConfirm(null)}
                        title={
                          toggleConfirm?.list
                            ? 'Are you sure you want to list this product?'
                            : 'Are you sure you want to unlist this product?'
                        }
                        onConfirm={handleToggleConfirm}
                        okText='Yes'
                        cancelText='No'
                        okButtonProps={{ loading: toggleMutation.isPending }}
                      >
                        <span onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={product.isActive}
                            disabled={toggleMutation.isPending}
                            onChange={(checked) =>
                              setToggleConfirm({ id: product._id, list: checked })
                            }
                          />
                        </span>
                      </Popconfirm>
                      <button
                        onClick={() => {
                          setProductToEdit(product);
                          setIsModalOpen(true);
                        }}
                        className='p-3 text-gray-400 hover:text-[#1F2937] hover:bg-gray-100 rounded-xl transition-all cursor-pointer'
                        title='Edit'
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setProductToDelete(product)}
                        className='p-3 text-gray-400 hover:text-[#E11D48] hover:bg-white rounded-xl transition-all cursor-pointer'
                        title='Delete'
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddModal
        open={isModalOpen || !!productToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSuccess={async () => {
          await queryClient.invalidateQueries({ queryKey: ['products'] });
          setIsModalOpen(false);
          setProductToEdit(null);
        }}
      />

      <DeleteModal
        open={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title='Delete Product?'
        entityName={productToDelete?.name}
        confirmId={productToDelete?._id}
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

export default Studio;
