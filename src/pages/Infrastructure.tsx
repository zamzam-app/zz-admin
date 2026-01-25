import React, { useState } from 'react';
import { Plus, Store, Phone, MapPin, QrCode, Trash2 } from 'lucide-react';
import { Store as StoreType, StoreCategory } from '../lib/types/types';
import { Button } from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { Modal } from '../components/common/Modal';

const storesList = [
  {
    id: '1',
    name: 'Outlet 1',
    category: StoreCategory.SUPERMARKET,
    address: '123 Main St',
    rating: 4,
    totalFeedback: 10,
    managerPhone: '123-456-7890',
  },
  {
    id: '2',
    name: 'Outlet 2',
    category: StoreCategory.FASHION,
    address: '456 Elm St',
    rating: 3,
    totalFeedback: 5,
    managerPhone: '098-765-4321',
  },
];

export default function Infrastructure() {
  const [stores, setStores] = useState(storesList);
  const [open, setOpen] = useState(false);
  const [newStore, setNewStore] = useState<Partial<StoreType>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.name || !newStore.category) return;

    setStores([
      ...stores,
      {
        id: Date.now().toString(),
        name: newStore.name || '',
        category: newStore.category as StoreCategory,
        address: newStore.address || '',
        rating: 0,
        totalFeedback: 0,
        managerPhone: newStore.managerPhone || '',
      },
    ]);

    setOpen(false);
    setNewStore({});
  };

  const handleDelete = (id: string) => {
    setStores(stores.filter((store) => store.id !== id));
  };
  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-black text-[#1F2937]'>Outlet Infrastructure</h1>
          <p className='text-gray-500 text-sm'>Manage all physical outlets and QR points</p>
        </div>

        <Button
          variant='admin-primary'
          onClick={() => setOpen(true)}
          className='rounded-2xl px-6 py-4'
        >
          <Plus size={18} /> Add Outlet
        </Button>
      </div>

      {/* Outlet Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {stores.map((store) => (
          <Card
            key={store.id}
            className='p-6 border border-gray-100 rounded-[28px] hover:border-[#D4AF37] transition-all'
          >
            <div className='flex items-start justify-between mb-6'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 rounded-2xl bg-[#1F2937] text-[#D4AF37] flex items-center justify-center'>
                  <Store size={22} />
                </div>
                <div>
                  <h4 className='font-black text-lg text-[#1F2937]'>{store.name}</h4>
                  <p className='text-[10px] text-gray-400 uppercase font-bold tracking-widest'>
                    {store.category}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(store.id)}
                className='p-2 text-red-500 hover:bg-red-50 rounded-xl'
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className='space-y-3 text-sm text-gray-600'>
              <div className='flex items-center gap-2'>
                <MapPin size={14} />
                {store.address}
              </div>
              <div className='flex items-center gap-2'>
                <Phone size={14} />
                {store.managerPhone}
              </div>
            </div>

            <div className='flex gap-3 mt-6'>
              <button className='flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50'>
                <QrCode size={16} /> QR Code
              </button>
              <button className='flex-1 py-3 bg-[#1F2937] text-white rounded-xl hover:bg-gray-800'>
                View
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title='Register Outlet'>
        <form onSubmit={handleSubmit} className='space-y-5'>
          <Input
            label='Outlet Name'
            value={newStore.name || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewStore({ ...newStore, name: e.target.value })
            }
            required
          />

          <Select
            label='Outlet Type'
            options={Object.values(StoreCategory)}
            value={newStore.category}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewStore({
                ...newStore,
                category: e.target.value as StoreCategory,
              })
            }
          />

          <Input
            label='Address'
            value={newStore.address || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewStore({ ...newStore, address: e.target.value })
            }
          />

          <Input
            label='Manager Phone'
            value={newStore.managerPhone || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewStore({
                ...newStore,
                managerPhone: e.target.value,
              })
            }
          />

          <div className='flex justify-end gap-4 pt-4'>
            <Button variant='ghost' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' variant='admin-primary' className='px-8 rounded-2xl'>
              Save Outlet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
