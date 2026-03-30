import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Store, MapPin, Trash2, User, Layers } from 'lucide-react';
import { QrcodeOutlined, EditOutlined } from '@ant-design/icons';
import { nanoid } from 'nanoid';

import type { Outlet } from '../lib/types/outlet';
import type { ManagerOption } from '../components/outlet';
import { User as ManagerUser } from '../lib/types/manager';

import { Button } from '../components/common/Button';
import Card from '../components/common/Card';
import { DeleteModal } from '../components/common/DeleteModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { NoDataFallback } from '../components/common/NoDataFallback';

import { OutletModal, OutletTypesModal, QrCodeModal } from '../components/outlet';

import { outletApi } from '../lib/services/api/outlet.api';
import { formsApi } from '../lib/services/api/forms.api';
import { usersApi } from '../lib/services/api/users.api';

import { useApiQuery, useApiMutation } from '../lib/react-query/use-api-hooks';
import { OUTLET_KEYS } from '../lib/types/outlet';
import { FORM_KEYS } from '../lib/types/forms';
import { MANAGER_KEYS } from '../lib/types/manager';

function toManagerOption(user: ManagerUser): ManagerOption {
  return {
    id: user._id ?? user.id ?? '',
    name: user.name,
    phone: user.phoneNumber,
  };
}

function getManagerNames(store: Outlet): string[] {
  if (store.managerNames && store.managerNames.length > 0) return store.managerNames;
  if (store.managerName) return [store.managerName];
  return [];
}

export default function Infrastructure() {
  const queryClient = useQueryClient();
  const {
    data: stores = [],
    isLoading,
    error,
  } = useApiQuery(OUTLET_KEYS, () => outletApi.getOutletsList());

  const { data: managersList = [] } = useApiQuery(MANAGER_KEYS, usersApi.getManagers);
  const { data: formsData } = useApiQuery(FORM_KEYS, () => formsApi.getForms(), { enabled: true });

  const managers: ManagerOption[] = managersList.map(toManagerOption);
  const availableForms = formsData ?? [];

  const [outletModalOpen, setOutletModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedQrStore, setSelectedQrStore] = useState<Outlet | null>(null);
  const [outletToDelete, setOutletToDelete] = useState<Outlet | null>(null);
  const [outletTypesModalOpen, setOutletTypesModalOpen] = useState(false);

  const deleteMutation = useApiMutation((id: string) => outletApi.delete(id), [OUTLET_KEYS], {
    onSuccess: () => setOutletToDelete(null),
  });

  const setStoresInCache = (updater: (prev: Outlet[]) => Outlet[]) => {
    queryClient.setQueryData<Outlet[]>(OUTLET_KEYS, (prev) => updater(prev ?? []));
  };

  const handleEdit = (store: Outlet) => {
    setEditingOutlet(store);
    setOutletModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingOutlet(null);
    setOutletModalOpen(true);
  };

  const handleGenerateQr = (store: Outlet) => {
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
    deleteMutation.mutate(id);
  };

  const header = (
    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
      <div>
        <div className='inline-flex items-center gap-2 rounded-full bg-[#FFF7E6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9A6B1E]'>
          Operations
        </div>
        <h1 className='mt-3 text-3xl font-black text-[#0F172A]'>Outlet Infrastructure</h1>
        <p className='mt-1 text-sm text-slate-500'>
          Manage outlets, QR access, and table inventory.
        </p>
      </div>
      <div className='flex flex-wrap gap-3'>
        <Button
          type='button'
          variant='outline'
          onClick={() => setOutletTypesModalOpen(true)}
          className='rounded-2xl px-6 py-4 bg-white'
        >
          <Layers size={18} className='mr-2' /> Outlet Types
        </Button>
        <Button
          variant='admin-primary'
          onClick={handleOpenAdd}
          className='rounded-2xl px-6 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.15)]'
        >
          <Plus size={18} /> Add Outlet
        </Button>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className='space-y-8'>
        {header}
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

  return (
    <div className='space-y-8'>
      {header}

      {/* Outlet Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
        {stores.map((store) => {
          const managerNames = getManagerNames(store);
          return (
            <Card
              key={store.id}
              className='group relative overflow-hidden p-4 border border-slate-200/70 bg-white rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.08)] hover:-translate-y-[2px] hover:border-[#D4AF37] transition-all'
            >
              <div className='flex items-start justify-between gap-4 mb-3'>
                <div className='flex items-center gap-4'>
                  {store.images?.[0] ? (
                    <img
                      src={store.images[0]}
                      alt={store.name}
                      className='w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-sm'
                    />
                  ) : (
                    <div className='w-12 h-12 rounded-2xl bg-[#111827] text-[#D4AF37] flex items-center justify-center shadow-sm'>
                      <Store size={22} />
                    </div>
                  )}
                  <div>
                    <h4 className='font-black text-lg text-[#0F172A]'>{store.name}</h4>
                    <p className='text-[10px] text-gray-400 uppercase font-bold tracking-widest'>
                      {store.outletTypeName || 'Outlet'}
                    </p>
                  </div>
                </div>
                <div />
              </div>

              <div className='space-y-2.5 text-sm text-gray-600'>
                <div className='flex items-start gap-2'>
                  <MapPin size={14} className='mt-0.5 text-slate-400' />
                  <span>{store.address || 'No address provided'}</span>
                </div>
                <div className='flex items-start gap-2'>
                  <User size={14} className='mt-0.5 text-slate-400' />
                  <div>
                    <div className='text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold'>
                      Managers
                    </div>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {managerNames.length > 0 ? (
                        managerNames.map((name) => (
                          <span
                            key={name}
                            className='inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700'
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className='text-sm text-gray-400'>No managers assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className='mt-4 flex items-center gap-2'>
                <button
                  onClick={() => handleGenerateQr(store)}
                  aria-label='Generate QR code'
                  title='QR Code'
                  className='flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-700 hover:bg-gray-50 hover:text-slate-900 transition'
                >
                  <QrcodeOutlined />
                </button>
                <button
                  onClick={() => handleEdit(store)}
                  aria-label='Edit outlet'
                  title='Edit'
                  className='flex h-9 w-9 items-center justify-center rounded-lg bg-[#111827] text-white hover:bg-[#0B1220] transition'
                >
                  <EditOutlined />
                </button>
                <button
                  onClick={() => setOutletToDelete(store)}
                  aria-label='Delete outlet'
                  title='Delete'
                  className='flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 hover:bg-red-50 transition'
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MODALS */}
      <OutletModal
        open={outletModalOpen}
        onClose={() => {
          setOutletModalOpen(false);
          setEditingOutlet(null);
        }}
        editing={editingOutlet}
        onSuccess={() => {
          setOutletModalOpen(false);
          setEditingOutlet(null);
        }}
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
        isPending={deleteMutation.isPending}
      />

      <OutletTypesModal
        open={outletTypesModalOpen}
        onClose={() => setOutletTypesModalOpen(false)}
      />
    </div>
  );
}
