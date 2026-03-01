import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Store, MapPin, QrCode, Trash2, User, Layers } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { Outlet } from '../lib/types/outlet';
import { Button } from '../components/common/Button';
import Card from '../components/common/Card';
import { DeleteModal } from '../components/common/DeleteModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { NoDataFallback } from '../components/common/NoDataFallback';
import { OutletModal, OutletTypesModal, QrCodeModal } from '../components/outlet';
import { outletApi } from '../lib/services/api/outlet.api';
import { formsApi } from '../lib/services/api/forms.api';
import { OUTLET_KEYS } from '../lib/types/outlet';
import { FORM_KEYS } from '../lib/types/forms';
import { usersApi } from '../lib/services/api/users.api';
import { useApiQuery } from '../lib/react-query/use-api-hooks';
import { MANAGER_KEYS, User as ManagerUser } from '../lib/types/manager';
import type { ManagerOption } from '../components/outlet';
import { TablesModal } from '../components/outlet';
import { AddTableModal } from '../components/outlet/AddTableModal'; 
// import {
//   getOutletTables,
//   createOutletTable,
//   deleteOutletTable,
// } from '../lib/services/api/outletTable.api';

// import type { IOutletTable } from '../lib/types/outletTable';

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
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedQrStore, setSelectedQrStore] = useState<Outlet | null>(null);
  const [outletToDelete, setOutletToDelete] = useState<Outlet | null>(null);
  const [outletTypesModalOpen, setOutletTypesModalOpen] = useState(false);
  const [tablesOpen, setTablesOpen] = useState(false);
const [addTableOpen, setAddTableOpen] = useState(false);
const [selectedOutletForTables, setSelectedOutletForTables] =
  useState<Outlet | null>(null);

const [tables, setTables] = useState([
  { id: '1', name: 'Table 1' },
  { id: '2', name: 'Table 2' },
]);

  const { data: formsData } = useApiQuery(FORM_KEYS, () => formsApi.getForms(), { enabled: true });
  const availableForms = formsData ?? [];

  const handleEdit = (store: Outlet) => {
    setEditingOutlet(store);
    setOutletModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingOutlet(null);
    setOutletModalOpen(true);
  };

  const handleOpenTables = (store: Outlet) => {
  setSelectedOutletForTables(store);
  setTablesOpen(true);
};

  const setStoresInCache = (updater: (prev: Outlet[]) => Outlet[]) => {
    queryClient.setQueryData<Outlet[]>(OUTLET_KEYS, (prev) => updater(prev ?? []));
  };

  const handleOutletSuccess = () => {
    setOutletModalOpen(false);
    setEditingOutlet(null);
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
    setStoresInCache((prev) => prev.filter((s) => s.id !== id));
    setOutletToDelete(null);
  };

  const header = (
    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
      <div>
        <h1 className='text-3xl font-black text-[#1F2937]'>Outlet Infrastructure</h1>
        <p className='text-gray-500 text-sm'>Manage all physical outlets and QR points</p>
      </div>
      <div className='flex flex-wrap gap-3'>
        <Button
          type='button'
          variant='outline'
          onClick={() => setOutletTypesModalOpen(true)}
          className='rounded-2xl px-6 py-4'
        >
          <Layers size={18} className='mr-2' />
          Outlet Types
        </Button>
        <Button variant='admin-primary' onClick={handleOpenAdd} className='rounded-2xl px-6 py-4'>
          <Plus size={18} /> Add Outlet
        </Button>
      </div>
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
          onSuccess={handleOutletSuccess}
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
        <OutletTypesModal
          open={outletTypesModalOpen}
          onClose={() => setOutletTypesModalOpen(false)}
          availableForms={availableForms}
          managers={managers}
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
                    {store.outletTypeName}
                  </p>
                </div>
              </div>

              <div className='flex gap-2'>
                <button
                  onClick={() => setOutletToDelete(store)}
                  className='p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer'
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
                {store.managerName ?? 'No Manager Assigned'}
              </div>
            </div>

            <div className='flex gap-3 mt-6'>
              <button
                onClick={() => handleGenerateQr(store)}
                className='flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer'
              >
                <QrCode size={16} /> QR Code
              </button>
              <button
  onClick={() => handleOpenTables(store)}
                className='flex-1 py-3 bg-[#1F2937] text-white rounded-xl hover:bg-gray-800 cursor-pointer'
              >
                Tables
              </button>
              <button
                onClick={() => handleEdit(store)}
                className='flex-1 py-3 bg-[#1F2937] text-white rounded-xl hover:bg-gray-800 cursor-pointer'
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
        onSuccess={handleOutletSuccess}
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
      <OutletTypesModal
        open={outletTypesModalOpen}
        onClose={() => setOutletTypesModalOpen(false)}
        availableForms={availableForms}
        managers={managers}
      />
      <TablesModal
  open={tablesOpen}
  outletName={selectedOutletForTables?.name}
  tables={tables}
  onClose={() => setTablesOpen(false)}
  onAddClick={() => setAddTableOpen(true)}
  onEdit={(table) => {
    console.log('Edit table', table);
  }}
  onDelete={(table) => {
    setTables((prev) => prev.filter((t) => t.id !== table.id));
  }}
/>
<AddTableModal
  open={addTableOpen}
  onClose={() => setAddTableOpen(false)}
  onSave={(payload) => {
    if (!selectedOutletForTables) return;

    setTables((prev) => [
      ...prev,
      { id: Date.now().toString(), name: payload.name },
    ]);

    setAddTableOpen(false);
  }}
/>
    </div>
  );
}
