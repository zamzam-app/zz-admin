import React, { useState } from 'react';
import { Plus, Store, MapPin, QrCode, Trash2, User, Download, Captions } from 'lucide-react';
import { nanoid } from 'nanoid';
import QRCode from 'react-qr-code';
import { Store as StoreType, StoreCategory } from '../lib/types/types';
import { Button } from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { storesList, MANAGERS } from '../__mocks__/managers';
import { Form } from '../lib/types/forms';

export default function Infrastructure() {
  const [stores, setStores] = useState(storesList);
  const [open, setOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedQrStore, setSelectedQrStore] = useState<StoreType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStore, setNewStore] = useState<Partial<StoreType>>({});
  const [availableForms] = useState<Form[]>(() => {
    try {
      const stored = localStorage.getItem('saved_forms');
      return stored ? (JSON.parse(stored) as Form[]) : [];
    } catch {
      return [];
    }
  });

  const handleEdit = (store: StoreType) => {
    setNewStore(store);
    setEditingId(store.id);
    setOpen(true);
  };

  const handleOpenAdd = () => {
    setNewStore({});
    setEditingId(null);
    setOpen(true);
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

  const handleDownloadQr = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');

        const downloadLink = document.createElement('a');
        downloadLink.download = `${selectedQrStore?.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.name || !newStore.category) return;

    if (editingId) {
      setStores((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, ...(newStore as StoreType) } : s)),
      );
    } else {
      setStores([
        ...stores,
        {
          id: Date.now().toString(),
          name: newStore.name || '',
          outletId: newStore.outletId || `outlet-${Date.now().toString()}`,
          category: newStore.category as StoreCategory,
          address: newStore.address || '',
          rating: 0,
          totalFeedback: 0,
          managerId: newStore.managerId,
          managerName: newStore.managerName,
          formId: newStore.formId,
          formTitle: newStore.formTitle,
          qrToken: nanoid(10),
        },
      ]);
    }

    setOpen(false);
    setNewStore({});
    setEditingId(null);
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
                  onClick={() => handleDelete(store.id)}
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? 'Edit Outlet' : 'Register Outlet'}
        maxWidth='md'
      >
        <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
          {/* Input Grid with 32px spacing (gap-8) to ensure they are never "stuck" */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8'>
            <div className='md:col-span-2'>
              <Input
                label='Outlet Name'
                value={newStore.name || ''}
                onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                required
              />
            </div>

            <Select
              label='Outlet Type'
              options={Object.values(StoreCategory)}
              value={newStore.category || ''}
              onChange={(e) =>
                setNewStore({ ...newStore, category: e.target.value as StoreCategory })
              }
            />

            <Select
              label='Choose Form'
              options={availableForms.map((form) => ({
                label: form.title,
                value: form._id,
              }))}
              value={newStore.formId || ''}
              onChange={(e) => {
                const form = availableForms.find((f) => f._id === e.target.value);
                setNewStore({
                  ...newStore,
                  formId: form?._id,
                  formTitle: form?.title,
                });
              }}
            />

            <div className='md:col-span-2'>
              <Input
                label='Address'
                value={newStore.address || ''}
                onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
              />
            </div>

            <div className='md:col-span-2'>
              <Select
                label='Assigned Manager'
                options={MANAGERS.map((m) => ({ label: m.name, value: m.id }))}
                value={newStore.managerId || ''}
                onChange={(e) => {
                  const manager = MANAGERS.find((m) => m.id === e.target.value);
                  setNewStore({
                    ...newStore,
                    managerId: manager?.id,
                    managerName: manager?.name,
                    managerPhone: manager?.phone,
                  });
                }}
              />
            </div>
          </div>

          {/* Footer with a separate border-t for a pro look */}
          <div className='flex justify-end gap-4 pt-6 border-t border-gray-100'>
            <Button
              variant='ghost'
              onClick={() => setOpen(false)}
              className='font-bold text-gray-400'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='admin-primary'
              className='px-10 py-3.5 rounded-2xl font-black'
            >
              {editingId ? 'Update Outlet' : 'Save Outlet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title={selectedQrStore?.name || 'Outlet QR Code'}
        className='text-center'
      >
        <div className='flex flex-col items-center justify-center p-4'>
          <div className='bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 mb-6'>
            {selectedQrStore?.qrToken && (
              <QRCode
                id='qr-code-svg'
                value={`${window.location.origin}/r/${selectedQrStore.qrToken}`}
                size={200}
              />
            )}
          </div>

          <p className='text-gray-500 text-sm mb-2'>Scan to access review page</p>
          <code className='bg-gray-100 px-3 py-1 rounded text-xs text-gray-600 break-all select-all mb-6 block'>
            {`${window.location.origin}/r/${selectedQrStore?.qrToken}`}
          </code>

          <Button onClick={handleDownloadQr} variant='admin-primary'>
            <Download size={16} className='mr-2' /> Download QR Code
          </Button>
        </div>
      </Modal>
    </div>
  );
}
