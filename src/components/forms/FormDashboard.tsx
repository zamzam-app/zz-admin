import React, { useState } from 'react';
import { Plus, Layout, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Form } from '../../lib/types/forms';
import { Button } from '../common/Button';
import Card from '../common/Card';
import { DeleteModal } from '../common/DeleteModal';
import { NoDataFallback } from '../common/NoDataFallback';

interface Props {
  savedForms: Form[];
  onCreateNew: () => void;
  onEdit: (form: Form) => void;
  onOpen: (form: Form) => void;
  onDelete: (form: Form) => void;
}

const FormDashboard: React.FC<Props> = ({ savedForms, onCreateNew, onEdit, onOpen, onDelete }) => {
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);

  return (
    <div className='space-y-8'>
      {/* Header Section */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-black text-[#1F2937]'>Form Builder</h1>
          <p className='text-gray-500 text-sm'>Manage all digital forms and customer touchpoints</p>
        </div>
        <Button
          variant='admin-primary'
          onClick={onCreateNew}
          className='rounded-2xl px-6 py-4 flex items-center gap-2'
        >
          <Plus size={18} /> Add Form
        </Button>
      </div>

      <Card className='overflow-hidden border border-gray-100 rounded-[28px] bg-white shadow-sm'>
        {savedForms.length === 0 ? (
          <NoDataFallback
            title='No forms yet'
            description='Create your first form to start collecting responses'
            action={
              <Button variant='admin-primary' onClick={onCreateNew} className='rounded-2xl'>
                <Plus size={18} /> Add Form
              </Button>
            }
          />
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='border-b border-gray-50'>
                  <th className='px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-left'>
                    Form Title
                  </th>
                  <th className='px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center'>
                    Questions
                  </th>
                  <th className='px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {savedForms.map((form) => (
                  <tr key={form._id} className='hover:bg-gray-50/50 transition-colors group'>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-4'>
                        <div className='w-10 h-10 rounded-xl bg-[#1F2937] text-[#D4AF37] flex items-center justify-center shrink-0'>
                          <Layout size={18} />
                        </div>
                        <span className='font-bold text-[#1F2937] text-md'>{form.title}</span>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-center'>
                      <span className='px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black'>
                        {form.questions.length} Questions
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center justify-end gap-2'>
                        <button
                          onClick={() => onOpen(form)}
                          className='flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors'
                        >
                          <ExternalLink size={14} /> Open
                        </button>
                        <button
                          onClick={() => onEdit(form)}
                          className='p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all'
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setFormToDelete(form)}
                          className='p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all'
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <DeleteModal
        open={!!formToDelete}
        onClose={() => setFormToDelete(null)}
        title='Delete Form?'
        entityName={formToDelete?.title}
        confirmId={formToDelete?._id}
        onConfirm={(id) => {
          const form = savedForms.find((f) => f._id === id);
          if (form) {
            onDelete(form);
            setFormToDelete(null);
          }
        }}
      />
    </div>
  );
};

export default FormDashboard;
