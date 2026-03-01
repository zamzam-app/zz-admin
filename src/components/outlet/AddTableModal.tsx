import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../common/Button';
import Card from '../common/Card';

type CreateTablePayload = {
  name: string;
  capacity?: number;
};

interface AddTableModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreateTablePayload) => void;
}

export function AddTableModal({
  open,
  onClose,
  onSave,
}: AddTableModalProps) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      capacity: capacity ? Number(capacity) : undefined,
    });

    setName('');
    setCapacity('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
      <Card className="w-full max-w-md rounded-3xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1F2937]">
            Add Table
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Table name"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />

          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Capacity (optional)"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="admin-primary" onClick={handleSave}>
              Save Table
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}