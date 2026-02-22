import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Store, MapPin, QrCode, Trash2, User, Captions } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Store as StoreType, StoreCategory } from '../lib/types/types';
import { Button } from '../components/common/Button';
import Card from '../components/common/Card';
import { DeleteModal } from '../components/common/DeleteModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { NoDataFallback } from '../components/common/NoDataFallback';
import { OutletModal, QrCodeModal } from '../components/infrastructure';
import { outletApi } from '../lib/services/api/outlet.api';
import { OUTLET_KEYS } from '../lib/types/outlet';
import { usersApi } from '../lib/services/api/users.api';
import { useApiQuery } from '../lib/react-query/use-api-hooks';
import { MANAGER_KEYS, User as ManagerUser } from '../lib/types/manager';
import type { ManagerOption } from '../components/infrastructure';
import { Form } from '../lib/types/forms';

function toManagerOption(user: ManagerUser): ManagerOption {
  return {
    id: user._id ?? user.id ?? '',
    name: user.name,
    phone: user.phoneNumber,
  };
}

export default function Infrastructure() {
  const queryClient = useQueryClient();
  const {
    data: stores = [],
    isLoading,
    error,
  } = useApiQuery(OUTLET_KEYS, () => outletApi.getOutletsList());
  const { data: managersList = [] } = useApiQuery(MANAGER_KEYS, usersApi.getManagers);
  const managers: ManagerOption[] = managersList.map(toManagerOption);
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

  const setStoresInCache = (updater: (prev: StoreType[]) => StoreType[]) => {
    queryClient.setQueryData<StoreType[]>(OUTLET_KEYS, (prev) => updater(prev ?? []));
  };

  const handleSaveOutlet = (editingId: string | null, data: Partial<StoreType>) => {
    if (!data.name || !data.category) return;

    if (editingId) {
      setStoresInCache((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...data } : s)));
    } else {
      setStoresInCache((prev) => [
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
      setStoresInCache((prev) => prev.map((s) => (s.id === store.id ? updatedStore : s)));
      setSelectedQrStore(updatedStore);
    } else {
      setSelectedQrStore(store);
    }
    setQrOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    setStoresInCache((prev) => prev.filter((s) => s.id !== id));
    setOutletToDelete(null);
  };

  const header = (
    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
      <div>
        <h1 className='text-3xl font-black text-[#1F2937]'>Outlet Infrastructure</h1>
        <p className='text-gray-500 text-sm'>Manage all physical outlets and QR points</p>
      </div>
      <Button variant='admin-primary' onClick={handleOpenAdd} className='rounded-2xl px-6 py-4'>
        <Plus size={18} /> Add Outlet
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className='space-y-8'>
        {header}
        <div className='rounded-2xl border border-gray-100 bg-white overflow-hidden'>
          <NoDataFallback
            title='No outlets found'
            description='Try adding a new outlet to get started'
            action={
              <Button variant='admin-primary' onClick={handleOpenAdd} className='rounded-2xl'>
                Add Outlet
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='space-y-8'>
        {header}
        <div className='min-h-[400px] relative'>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className='space-y-8'>
        {header}
        <div className='rounded-2xl border border-gray-100 bg-white overflow-hidden min-h-[400px] flex items-center justify-center'>
          <NoDataFallback
            title='No outlets found'
            description='Try adding a new outlet to get started'
            action={
              <Button
                type='button'
                variant='admin-primary'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenAdd();
                }}
                className='rounded-2xl'
              >
                Add Outlet
              </Button>
            }
          />
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
          managers={managers}
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

  return (
    <div className='space-y-8'>
      {header}

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
        managers={managers}
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
