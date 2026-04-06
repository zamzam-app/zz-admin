import { useState, useMemo } from 'react';

import { Image, Popconfirm, Switch } from 'antd';
import { Plus, Trash2, Pencil, Layers, ChevronUp, ChevronDown } from 'lucide-react';

import { Button } from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { NoDataFallback } from '../components/common/NoDataFallback';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '../lib/react-query/use-api-hooks';
import { productApi } from '../lib/services/api/product.api';
import type { Product } from '../lib/types/product';
import { AddModal } from '../components/studio/AddModal';
import { DeleteModal } from '../components/common/DeleteModal';
import { CakeCategoriesModal } from '../components/studio/CakeCategoriesModal';
import { UserCreations } from '../components/studio/UserCreations';
import { UploadedCakes } from '../components/studio/UploadedCakes';
import { Sparkles, ShoppingBag } from 'lucide-react';

const PRODUCT_KEYS = ['products'];

const Studio = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<{ id: string; list: boolean } | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalogue' | 'creations' | 'uploaded'>('catalogue');
  const [sortConfig, setSortConfig] = useState<{
    field: 'details' | 'price' | null;
    order: 'asc' | 'desc' | null;
  }>({ field: null, order: null });

  const { data, isLoading, error, refetch } = useApiQuery<Product[]>(PRODUCT_KEYS, () =>
    productApi.getAll(),
  );

  const sortedProducts = useMemo(() => {
    const productsList = Array.isArray(data) ? data : [];
    if (!sortConfig.field) return productsList;

    return [...productsList].sort((a, b) => {
      if (sortConfig.field === 'details') {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (sortConfig.order === 'asc') return nameA.localeCompare(nameB);
        return nameB.localeCompare(nameA);
      }

      if (sortConfig.field === 'price') {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        if (sortConfig.order === 'desc') return priceB - priceA;
        return priceA - priceB;
      }

      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (field: 'details' | 'price') => {
    if (sortConfig.field === field) {
      setSortConfig({
        field,
        order: sortConfig.order === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setSortConfig({
        field,
        order: field === 'details' ? 'asc' : 'desc',
      });
    }
  };

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
            <h3 className='font-black text-3xl text-[#1F2937] tracking-tight'>Cake Catalog</h3>
            <p className='text-gray-500 text-sm mt-1'>Add your cakes</p>
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
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8'>
        <div>
          <div className='flex items-center gap-3 mb-1'>
            <div className='p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl'>
              <Layers size={24} />
            </div>
            <h3 className='font-black text-3xl text-[#1F2937] tracking-tight'>
              {activeTab === 'catalogue'
                ? 'Cake Studio'
                : activeTab === 'creations'
                  ? 'AI studio'
                  : 'Uploaded'}
            </h3>
          </div>
          <p className='text-gray-500 text-sm ml-12'>
            {activeTab === 'catalogue'
              ? 'Manage your physical cake catalog and pricing'
              : activeTab === 'creations'
                ? 'View and manage cakes generated by users using AI'
                : ''}
          </p>
        </div>

        <div className='flex items-center gap-3 self-end md:self-auto'>
          {activeTab === 'catalogue' ? (
            <>
              <Button
                variant='outline'
                onClick={() => setCategoriesOpen(true)}
                className='rounded-2xl py-4 h-12'
              >
                <Layers size={18} className='mr-2' />
                Cake Categories
              </Button>
              <Button
                variant='admin-primary'
                onClick={() => {
                  setProductToEdit(null);
                  setIsModalOpen(true);
                }}
                className='rounded-2xl py-4 h-12 shadow-xl shadow-gray-900/10'
              >
                <div className='flex items-center gap-2'>
                  <Plus size={20} /> Add New Listing
                </div>
              </Button>
            </>
          ) : activeTab === 'creations' ? (
            <Button variant='outline' onClick={() => refetch()} className='rounded-2xl py-4 h-12'>
              Refresh Gallery
            </Button>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-2 p-1.5 bg-[#F3F4F6] rounded-2xl w-fit mb-8 shadow-inner'>
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300 outline-none focus:outline-none cursor-pointer ${
            activeTab === 'catalogue'
              ? 'bg-white text-[#1F2937] shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ShoppingBag size={16} />
          Catalogue
        </button>
        <button
          onClick={() => setActiveTab('creations')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300 outline-none focus:outline-none cursor-pointer ${
            activeTab === 'creations'
              ? 'bg-white text-[#D4AF37] shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Sparkles size={16} />
          AI studio
        </button>
        <button
          onClick={() => setActiveTab('uploaded')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300 outline-none focus:outline-none cursor-pointer ${
            activeTab === 'uploaded'
              ? 'bg-white text-[#1F2937] shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Uploaded
        </button>
      </div>

      {activeTab === 'catalogue' ? (
        /* Table for Catalogue */
        <div className='bg-white rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500'>
          <table className='w-full text-left'>
            <thead className='bg-[#F9FAFB] text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] select-none border-b border-gray-100/50'>
              <tr>
                <th className='px-8 py-6 w-24'>Reference</th>
                <th
                  className='px-8 py-6 cursor-pointer group hover:bg-gray-100/50 outline-none select-none relative'
                  onClick={() => handleSort('details')}
                >
                  <div className='flex items-center justify-center gap-2 relative'>
                    <span>Details</span>
                    <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0'>
                      {sortConfig.field === 'details' ? (
                        sortConfig.order === 'asc' ? (
                          <ChevronUp size={14} className='text-[#D4AF37]' />
                        ) : (
                          <ChevronDown size={14} className='text-[#D4AF37]' />
                        )
                      ) : (
                        <ChevronUp size={14} className='text-gray-300' />
                      )}
                    </div>
                  </div>
                </th>
                <th
                  className='px-8 py-6 text-center cursor-pointer group hover:bg-gray-100/50 outline-none select-none relative border-l border-gray-100/50'
                  onClick={() => handleSort('price')}
                >
                  <div className='flex items-center justify-center gap-2 relative'>
                    <span>Price</span>
                    <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0'>
                      {sortConfig.field === 'price' ? (
                        sortConfig.order === 'desc' ? (
                          <ChevronDown size={14} className='text-[#D4AF37]' />
                        ) : (
                          <ChevronUp size={14} className='text-[#D4AF37]' />
                        )
                      ) : (
                        <ChevronDown size={14} className='text-gray-300' />
                      )}
                    </div>
                  </div>
                </th>

                <th className='px-8 py-6 text-right relative border-l border-gray-100/50'>
                  Control
                </th>
              </tr>
            </thead>

            <tbody className='text-[#1F2937]'>
              {sortedProducts.length === 0 ? (
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
                sortedProducts.map((product) => (
                  <tr
                    key={product._id}
                    className='hover:bg-[#F9FAFB]/50 border-b border-gray-100/50'
                  >
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
                                    ? {
                                        root: '!w-full !h-full',
                                        image: '!w-16 !h-16 !object-cover',
                                      }
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
                    <td className='px-8 py-6 text-center'>
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
                        ₹{product.price}
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
                          className='p-3 text-gray-400 hover:text-[#1F2937] hover:bg-gray-100 rounded-xl transition-all cursor-pointer outline-none focus:outline-none'
                          title='Edit'
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setProductToDelete(product)}
                          className='p-3 text-gray-400 hover:text-[#E11D48] hover:bg-white rounded-xl transition-all cursor-pointer outline-none focus:outline-none'
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
      ) : activeTab === 'creations' ? (
        <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
          <UserCreations />
        </div>
      ) : (
        <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
          <UploadedCakes />
        </div>
      )}

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

      <CakeCategoriesModal open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />
    </div>
  );
};

export default Studio;
