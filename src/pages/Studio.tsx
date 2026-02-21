import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { productApi } from '../lib/services/api/product.api';
import type { Product } from '../lib/types/product';
import { AddModal } from '../components/studio/AddModal';
import { DeleteModal } from '../components/studio/DeleteModal';

const Studio = () => {
  const [cakes, setCakes] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cakeToDelete, setCakeToDelete] = useState<Product | null>(null);

  // Load products
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await productApi.getAll();
        setCakes(data);
      } catch (error) {
        console.error('Failed to load products', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Delete product
  const handleDelete = async (id: string) => {
    try {
      await productApi.delete(id);
      setCakes((prev) => prev.filter((product) => product._id !== id));
      setCakeToDelete(null);
    } catch {
      alert('Could not delete product');
    }
  };

  if (isLoading) return <div className='p-10 text-center font-bold'>Loading Catalog...</div>;

  return (
    <div>
      {/* Header */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h3 className='font-black text-3xl text-[#1F2937] tracking-tight'>Product Catalog</h3>
          <p className='text-gray-500 text-sm mt-1'>Manage custom cake availability</p>
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
            {cakes.map((product) => (
              <tr key={product._id} className='hover:bg-[#F9FAFB]/50 transition-colors'>
                <td className='px-8 py-6'>
                  <div className='w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-[#F9FAFB]'>
                    <img
                      src={
                        product.images?.[0] ||
                        'https://images.unsplash.com/photo-1578985545062-69928b1d9587'
                      }
                      alt={product.name}
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
                    onClick={() => setCakeToDelete(product)}
                    className='p-3 text-gray-400 hover:text-[#E11D48] hover:bg-white rounded-xl transition-all cursor-pointer'
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(product) => {
          setCakes((prev) => [...prev, product]);
          setIsModalOpen(false);
        }}
      />

      <DeleteModal
        open={!!cakeToDelete}
        onClose={() => setCakeToDelete(null)}
        product={cakeToDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Studio;
