import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';
import Card from '../common/Card';
import type { IOutletTable } from '../../lib/types/outletTable';

interface TablesModalProps {
  open: boolean;
  outletName?: string;
  tables: IOutletTable[];
  onClose: () => void;
  onAddClick: () => void;
  onEdit?: (table: IOutletTable) => void;
  onDelete: (table: IOutletTable) => void;
}

export function TablesModal({
  open,
  outletName,
  tables,
  onClose,
  onAddClick,
  onEdit,
  onDelete,
}: TablesModalProps) {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center'>
      <Card className='w-full max-w-3xl rounded-3xl p-6'>
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-black text-[#1F2937]'>Tables</h1>
              {outletName && <p className='text-sm text-gray-500'>{outletName}</p>}
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='admin-primary'
                onClick={onAddClick}
                className='rounded-2xl px-5 py-3'
              >
                <Plus size={16} className='mr-2' />
                Add Table
              </Button>

              <button onClick={onClose} className='p-2 rounded-xl hover:bg-gray-100'>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* List */}
          <Card className='rounded-2xl p-2'>
            <div className='flex justify-between px-3 pb-2'>
              <span className='text-xs font-semibold text-gray-500 uppercase'>Table</span>
              <span className='text-xs font-semibold text-gray-500 uppercase'>Actions</span>
            </div>

            <div className='border-t border-gray-200 mb-1' />

            {tables.length === 0 ? (
              <p className='text-sm text-gray-500 text-center py-8'>No tables added yet</p>
            ) : (
              <div className='max-h-[260px] overflow-y-auto divide-y divide-gray-200'>
                {tables.map((table) => (
                  <div
                    key={table.name}
                    className='flex items-center justify-between px-3 py-3 hover:bg-gray-50'
                  >
                    <span className='text-sm font-medium text-[#1F2937]'>{table.name}</span>

                    <div className='flex gap-1'>
                      {onEdit && (
  <button
    onClick={() => onEdit(table)}
    className="p-2 rounded-lg hover:bg-gray-100"
  >
    <Edit2 size={14} />
  </button>
)}
                      <button
                        onClick={() => onDelete(table)}
                        className='p-2 rounded-lg hover:bg-red-50 text-red-500'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Card>
    </div>
  );
}
