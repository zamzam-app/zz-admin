import { useState } from 'react';
import { Plus, Store, MapPin, QrCode, Trash2, User, Captions } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Store as StoreType, StoreCategory } from '../lib/types/types';
import { Button } from '../components/common/Button';
import Card from '../components/common/Card';
import { DeleteModal } from '../components/common/DeleteModal';
import { OutletModal, QrCodeModal } from '../components/infrastructure';
import { storesList, MANAGERS } from '../__mocks__/managers';
import { Form } from '../lib/types/forms';

export default function Infrastructure() {
  const [stores, setStores] = useState(storesList);
  const [outletModalOpen, setOutletModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<StoreType | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedQrStore, setSelectedQrStore] = useState<StoreType | null>(null);
  const [outletToDelete, setOutletToDelete] = useState<StoreType | null>(null);
  const [availableForms] = useState<Form[]>(() => {
    try {
      const stored = localStorage.getItem('saved_forms');
      return stored ? (JSON.parse(stored) as Form[]) : [];
    } catch {
      return [];
    }
  });

  const handleEdit = (store: StoreType) => {
    setEditingOutlet(store);
    setOutletModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingOutlet(null);
    setOutletModalOpen(true);
  };

  const handleSaveOutlet = (editingId: string | null, data: Partial<StoreType>) => {
    if (!data.name || !data.category) return;

    if (editingId) {
      setStores((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...data } : s)));
    } else {
      setStores((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: data.name || '',
          outletId: data.outletId || `outlet-${Date.now().toString()}`,
          category: data.category as StoreCategory,
          address: data.address || '',
          rating: 0,
          totalFeedback: 0,
          managerId: data.managerId,
          managerName: data.managerName,
          formId: data.formId,
          formTitle: data.formTitle,
          qrToken: nanoid(10),
        },
      ]);
    }
    setOutletModalOpen(false);
    setEditingOutlet(null);
  };

  const handleGenerateQr = (store: StoreType) => {
    if (!store.qrToken) {
      const updatedStore = { ...store, qrToken: nanoid(10) };
      setStores((prev) => prev.map((s) => (s.id === store.id ? updatedStore : s)));
      setSelectedQrStore(updatedStore);
    } else {
      setSelectedQrStore(store);
    }
    setQrOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    setStores((prev) => prev.filter((s) => s.id !== id));
    setOutletToDelete(null);
  };

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-black text-[#1F2937]'>Outlet Infrastructure</h1>
          <p className='text-gray-500 text-sm'>Manage all physical outlets and QR points</p>
        </div>

        <Button variant='admin-primary' onClick={handleOpenAdd} className='rounded-2xl px-6 py-4'>
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

              <div className='flex gap-2'>
                <button
                  onClick={() => setOutletToDelete(store)}
                  className='p-2 text-red-500 hover:bg-red-50 rounded-xl'
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className='space-y-3 text-sm text-gray-600'>
              <div className='flex items-center gap-2'>
                <MapPin size={14} />
                {store.address}
              </div>
              <div className='flex items-center gap-2'>
                <User size={14} />
                {store.managerName || 'No Manager Assigned'}
              </div>
              <div className='flex items-center gap-2'>
                <Captions size={14} />
                {store.formTitle || 'N/A'}
              </div>
            </div>

            <div className='flex gap-3 mt-6'>
              <button
                onClick={() => handleGenerateQr(store)}
                className='flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50'
              >
                <QrCode size={16} /> QR Code
              </button>
              <button
                onClick={() => handleEdit(store)}
                className='flex-1 py-3 bg-[#1F2937] text-white rounded-xl hover:bg-gray-800'
              >
                Edit
              </button>
            </div>
          </Card>
        ))}
      </div>

      <OutletModal
        open={outletModalOpen}
        onClose={() => {
          setOutletModalOpen(false);
          setEditingOutlet(null);
        }}
        editing={editingOutlet}
        onSave={handleSaveOutlet}
        availableForms={availableForms}
        managers={MANAGERS}
      />

      <QrCodeModal open={qrOpen} onClose={() => setQrOpen(false)} store={selectedQrStore} />

      <DeleteModal
        open={!!outletToDelete}
        onClose={() => setOutletToDelete(null)}
        title='Delete Outlet?'
        entityName={outletToDelete?.name}
        confirmId={outletToDelete?.id}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
