import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { productApi } from '../lib/services/api/product.api';
import type { Product } from '../lib/types/product';
import { Modal } from '../components/common/Modal';

interface Cake {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  images: string[];
  type: 'premade' | 'custom';
}

const Studio = () => {
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cakeToDelete, setCakeToDelete] = useState<Cake | null>(null);

  const [newCake, setNewCake] = useState<Partial<Cake>>({
    name: '',
    price: undefined,
    category: '',
    description: '',
    images: [],
    type: 'premade',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // For file uploads

  // Map API Product to Cake
  const mapProductToCake = (apiData: Product): Cake => ({
    id: apiData._id,
    name: apiData.name,
    price: apiData.price,
    category: apiData.description || 'General',
    description: apiData.description || '',
    images:
      apiData.images?.length && apiData.images[0] !== ''
        ? apiData.images
        : ['https://images.unsplash.com/photo-1578985545062-69928b1d9587'],
    type: apiData.type === 'custom' ? 'custom' : 'premade',
  });

  // Load products
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await productApi.getAll();
        setCakes(data.map(mapProductToCake));
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
      setCakes((prev) => prev.filter((cake) => cake.id !== id));
      setCakeToDelete(null);
    } catch {
      alert('Could not delete product');
    }
  };

  // Add new product
 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!newCake.name || !newCake.price) {
    alert('Please fill all required fields');
    return;
  }

  try {
    const payload = {
      name: newCake.name,
      price: newCake.price,
      description: newCake.description || '',
      ratingsId: '60d5ecb86217152c9043e02d', // ⚠ replace with real one if dynamic
      images: selectedFiles.map((file) => file.name),
      type: newCake.type || 'premade',
    };

    const savedProduct = await productApi.create(payload);

    setCakes((prev) => [...prev, mapProductToCake(savedProduct)]);
    setIsModalOpen(false);
    setSelectedFiles([]);

    setNewCake({
      name: '',
      price: undefined,
      category: '',
      description: '',
      images: [],
      type: 'premade',
    });
  }catch (error: unknown) {
  if (error instanceof Error) {
    console.error('Save failed:', error.message);
  } else {
    console.error('Save failed:', error);
  }
}

};


  if (isLoading)
    return <div className="p-10 text-center font-bold">Loading Catalog...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-black text-3xl text-[#1F2937] tracking-tight">
            Product Catalog
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Manage custom cake availability
          </p>
        </div>
        <Button
          variant="admin-primary"
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl py-4 shadow-xl shadow-gray-900/10"
        >
          <div className="flex items-center gap-2">
            <Plus size={20} /> Add New Listing
          </div>
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] text-gray-400 text-[10px] uppercase font-black tracking-[0.2em]">
            <tr>
              <th className="px-8 py-6">Reference</th>
              <th className="px-8 py-6">Details</th>
              <th className="px-8 py-6 text-center">Price</th>
              <th className="px-8 py-6 text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-[#1F2937]">
            {cakes.map((cake) => (
              <tr
                key={cake.id}
                className="hover:bg-[#F9FAFB]/50 transition-colors"
              >
                <td className="px-8 py-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-[#F9FAFB]">
                    <img
                      src={
                        cake.images?.[0] ||
                        'https://images.unsplash.com/photo-1578985545062-69928b1d9587'
                      }
                      alt={cake.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="font-bold mb-1">{cake.name}</div>
                  <div className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                    {cake.category}
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="inline-block px-3 py-1 bg-emerald-50 text-[#10B981] rounded-lg font-black text-sm">
                    ${cake.price}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button
                    onClick={() => setCakeToDelete(cake)}
                    className="p-3 text-gray-400 hover:text-[#E11D48] hover:bg-white rounded-xl transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg px-12 py-12 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-black mb-6 text-[#1F2937]">
              New Inventory Item
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                label="Product Title"
                value={newCake.name || ''}
                onChange={(e) =>
                  setNewCake({ ...newCake, name: e.target.value })
                }
                required
              />
              </div>
              

              <div className="grid grid-cols-2 gap-8">
                <Input
                  label="Price ($)"
                  type="number"
                  value={newCake.price ?? ''}
                  onChange={(e) =>
                    setNewCake({ ...newCake, price: Number(e.target.value) })
                  }
                  required
                />
                <Select
                  label="Type"
                  options={['premade', 'custom']}
                  value={newCake.category || ''}
                  onChange={(e) =>
                    setNewCake({ ...newCake, category: e.target.value })
                  }
                />

              </div>

<div>
  <Input
                label="Description"
                value={newCake.description || ''}
                onChange={(e) =>
                  setNewCake({ ...newCake, description: e.target.value })
                }
              />

</div>
              
              {/* File Upload */}
              <div>
                
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (!e.target.files) return;
                    setSelectedFiles(Array.from(e.target.files));
                  }}
                  className="block w-full text-sm text-gray-500 file:py-2 file:px-4 file:border file:border-gray-300 file:rounded-lg file:text-sm file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                {/* Preview */}
                <div className="flex gap-2 mt-2">
                  {selectedFiles.map((file, idx) => (
                    <img
                      key={idx}
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>

              
              <div className="flex justify-end gap-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="admin-primary"
                  className="rounded-2xl px-10"
                >
                  Launch Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <Modal open={!!cakeToDelete} onClose={() => setCakeToDelete(null)} title="Delete Product?">
        <div className="flex flex-col items-center text-center -mt-2">
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Are you sure you want to delete{' '}
            <span className="font-bold text-[#1F2937]">"{cakeToDelete?.name}"</span>? <br />
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setCakeToDelete(null)}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                if (cakeToDelete) handleDelete(cakeToDelete.id);
              }}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100 transition-all active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Studio;
