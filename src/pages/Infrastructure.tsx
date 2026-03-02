import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Store, MapPin, QrCode, Trash2, User, Layers } from 'lucide-react';
import { nanoid } from 'nanoid';

import type { Outlet } from '../lib/types/outlet';
import type { IOutletTable } from '../lib/types/outletTable';
import type { ManagerOption } from '../components/outlet';
import { User as ManagerUser } from '../lib/types/manager';

import { Button } from '../components/common/Button';
import Card from '../components/common/Card';
import { DeleteModal } from '../components/common/DeleteModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { NoDataFallback } from '../components/common/NoDataFallback';

import { OutletModal, OutletTypesModal, QrCodeModal, TablesModal } from '../components/outlet';
import { AddTableModal } from '../components/outlet/AddTableModal';

import { outletApi } from '../lib/services/api/outlet.api';
import { outletTableApi } from '../lib/services/api/outletTable.api';
import { formsApi } from '../lib/services/api/forms.api';
import { usersApi } from '../lib/services/api/users.api';

import { useApiQuery } from '../lib/react-query/use-api-hooks';
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

export default function Infrastructure() {
  const queryClient = useQueryClient();
  const CURRENT_USER_ID = JSON.parse(localStorage.getItem('user')!);

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

  const [tablesOpen, setTablesOpen] = useState(false);
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [selectedOutletForTables, setSelectedOutletForTables] = useState<Outlet | null>(null);
  const [editingTable, setEditingTable] = useState<IOutletTable | null>(null);

  const { data: tablesResponse } = useApiQuery(
    ['outlet-tables', selectedOutletForTables?.id],
    () => outletTableApi.getTables(selectedOutletForTables!.id),
    { enabled: !!selectedOutletForTables },
  );
  const tables: IOutletTable[] = tablesResponse?.data?.data ?? [];

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
    setStoresInCache((prev) => prev.filter((s) => s.id !== id));
    setOutletToDelete(null);
  };

  const handleOpenTables = (store: Outlet) => {
    setSelectedOutletForTables(store);
    setTablesOpen(true);
  };

  const createTable = async (payload: {
    outletId: string;
    createdBy: string;
    name: string;
    capacity?: number;
  }) => {
    await outletTableApi.createTable(payload);
    queryClient.invalidateQueries({ queryKey: ['outlet-tables', payload.outletId] });
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
          <Layers size={18} className='mr-2' /> Outlet Types
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

      <TablesModal
        open={tablesOpen}
        outletName={selectedOutletForTables?.name}
        tables={tables}
        onClose={() => setTablesOpen(false)}
        onAddClick={() => setAddTableOpen(true)}
        onEdit={(table) => {
          setEditingTable(table);
          setAddTableOpen(true);
        }}
        onDelete={async (table) => {
          if (!table._id || !selectedOutletForTables) return;
          await outletTableApi.deleteTable(table._id);
          queryClient.invalidateQueries({
            queryKey: ['outlet-tables', selectedOutletForTables.id],
          });
        }}
      />

      <AddTableModal
        open={addTableOpen}
        editing={editingTable}
        onClose={() => {
          setAddTableOpen(false);
          setEditingTable(null);
        }}
        onSave={async (payload) => {
          if (!selectedOutletForTables) return;

          if (editingTable) {
            await outletTableApi.updateTable(editingTable._id!, payload);
          } else {
            await createTable({
              outletId: selectedOutletForTables.id,
              createdBy: CURRENT_USER_ID.id,
              ...payload,
            });
          }

          queryClient.invalidateQueries({
            queryKey: ['outlet-tables', selectedOutletForTables.id],
          });

          setEditingTable(null);
          setAddTableOpen(false);
        }}
      />

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
