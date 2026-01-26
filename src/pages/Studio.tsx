import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

interface Cake {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

const initialCakes: Cake[] = [
  {
    id: '1',
    name: 'Vanilla Dream',
    price: 45,
    category: 'Birthday',
    image:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Chocolate Bliss',
    price: 55,
    category: 'Anniversary',
    image:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Red Velvet',
    price: 50,
    category: 'Wedding',
    image:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=200&auto=format&fit=crop',
  },
];

const Studio = () => {
  const [cakes, setCakes] = useState<Cake[]>(initialCakes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCake, setNewCake] = useState<Partial<Cake>>({
    name: '',
    price: 0,
    category: '',
  });

  const handleDelete = (id: string) => {
    setCakes(cakes.filter((cake) => cake.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCake.name || !newCake.price || !newCake.category) return;

    const cake: Cake = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCake.name,
      price: newCake.price,
      category: newCake.category,
      image:
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=200&auto=format&fit=crop', // generic placeholder
    };

    setCakes([...cakes, cake]);
    setIsModalOpen(false);
    setNewCake({ name: '', price: 0, category: '' });
  };

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
          <div className='bg-white rounded-[32px] w-full max-w-lg p-10 max-h-[90vh] overflow-y-auto shadow-2xl'>
            <h3 className='text-2xl font-black mb-2 text-[#1F2937]'>New Inventory Item</h3>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <Input
                label='Product Title'
                value={newCake.name || ''}
                onChange={(e) => setNewCake({ ...newCake, name: e.target.value })}
                required
              />
              <div className='grid grid-cols-2 gap-6'>
                <Input
                  label='Price ($)'
                  type='number'
                  value={newCake.price || ''}
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
              <div className='flex justify-end gap-4 pt-4'>
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
