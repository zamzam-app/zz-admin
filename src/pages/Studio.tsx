import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { productApi } from '../lib/services/api/product.api';
import type { Product } from '../lib/types/product';

// This is what your UI uses
interface Cake {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

const Studio = () => {
  // 1. Restore the missing state hooks
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newCake, setNewCake] = useState<Partial<Cake>>({
    name: '',
    price: undefined,
    category: '',
  });

  // MAPPER: Translates API (Product) to UI (Cake)
  const mapProductToCake = (apiData: Product): Cake => ({
    id: apiData._id,
    name: apiData.name,
    price: apiData.price,
    category: apiData.description || 'General',
    image: apiData.images?.[0] || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587',
  });

  // 1. Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await productApi.getAll();
        // Transform the array of Products into an array of Cakes
        const mappedCakes = data.map(mapProductToCake);
        setCakes(mappedCakes);
      } catch (error) {
        console.error('Failed to load products', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Delete logic
  const handleDelete = async (id: string) => {
    try {
      await productApi.delete(id);
      setCakes((prev) => prev.filter((cake) => cake.id !== id));
    } catch {
      alert('Could not delete product');
    }
  };

  // 3. Submit logic
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newCake.name || !newCake.price || !newCake.category) {
      alert('Please fill all fields');
      return;
    }

    try {
      const savedProduct = await productApi.create({
        name: newCake.name,
        price: Number(newCake.price),
        description: newCake.category,
        images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587'],
        type: 'premade',
      });

      setCakes((prev) => [...prev, mapProductToCake(savedProduct)]);
      setIsModalOpen(false);
      setNewCake({ name: '', price: 0, category: '' });
    } catch (error) {
      console.error('Save failed', error);
    }
  };

  if (isLoading) return <div className='p-10 text-center font-bold'>Loading Catalog...</div>;

  return (
    <div>
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
            {cakes.map((cake) => (
              <tr key={cake.id} className='hover:bg-[#F9FAFB]/50 transition-colors'>
                <td className='px-8 py-6'>
                  <div className='w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-[#F9FAFB]'>
                    <img src={cake.image} alt='' className='w-full h-full object-cover' />
                  </div>
                </td>
                <td className='px-8 py-6'>
                  <div className='font-bold mb-1'>{cake.name}</div>
                  <div className='text-[10px] font-black text-[#D4AF37] uppercase tracking-widest'>
                    {cake.category}
                  </div>
                </td>
                <td className='px-8 py-6 text-center'>
                  <div className='inline-block px-3 py-1 bg-emerald-50 text-[#10B981] rounded-lg font-black text-sm'>
                    ${cake.price}
                  </div>
                </td>
                <td className='px-8 py-6 text-right'>
                  <button
                    onClick={() => handleDelete(cake.id)}
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

      {/* Add Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-[32px] w-full max-w-lg px-12 py-12 max-h-[90vh] overflow-y-auto shadow-2xl'>
            <h3 className='text-2xl font-black mb-6 text-[#1F2937]'>New Inventory Item</h3>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <Input
                label='Product Title'
                value={newCake.name || ''}
                onChange={(e) => setNewCake({ ...newCake, name: e.target.value })}
                required
              />
              <div className='grid grid-cols-2 gap-8'>
                <Input
                  label='Price ($)'
                  type='number'
                  value={newCake.price ?? ''}
                  onChange={(e) => setNewCake({ ...newCake, price: Number(e.target.value) })}
                  required
                />
                <Select
                  label='Collection'
                  options={['Wedding', 'Birthday', 'Anniversary']}
                  value={newCake.category}
                  onChange={(e) => setNewCake({ ...newCake, category: e.target.value })}
                />
              </div>
              <div className='flex justify-end gap-6 pt-8'>
                <Button type='button' variant='ghost' onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit' variant='admin-primary' className='rounded-2xl px-10'>
                  Launch Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Studio;
