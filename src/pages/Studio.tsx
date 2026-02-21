import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { NoDataFallback } from '../components/common/NoDataFallback';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '../lib/react-query/use-api-hooks';
import { productApi } from '../lib/services/api/product.api';
import type { Product } from '../lib/types/product';
import { AddModal } from '../components/studio/AddModal';
import { DeleteModal } from '../components/studio/DeleteModal';

const Studio = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { data, isLoading, error, refetch } = useApiQuery(['products'], () => productApi.getAll());
  const products = Array.isArray(data) ? data : [];

  const handleDelete = async (id: string) => {
    try {
      await productApi.delete(id);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductToDelete(null);
    } catch {
      alert('Could not delete product');
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
          onClick={() => setIsModalOpen(true)}
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
                        onClick={() => setIsModalOpen(true)}
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
                    <div className='w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-[#F9FAFB]'>
                      <img
                        src={product.images?.[0]}
                        alt='no image available'
                        className='w-full h-full object-cover'
                      />
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
                    <button
                      onClick={() => setProductToDelete(product)}
                      className='p-3 text-gray-400 hover:text-[#E11D48] hover:bg-white rounded-xl transition-all cursor-pointer'
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={async () => {
          await queryClient.invalidateQueries({ queryKey: ['products'] });
          setIsModalOpen(false);
        }}
      />

      <DeleteModal
        open={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        product={productToDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Studio;
