import React from 'react';
import { FileText, PlusCircle, Edit3 } from 'lucide-react';
import { Form } from '../../lib/types/forms';

interface Props {
  savedForms: Form[];
  onCreateNew: () => void;
  onEdit: (form: Form) => void;
  onOpen: (form: Form) => void;
}

const FormDashboard: React.FC<Props> = ({ savedForms, onCreateNew, onEdit, onOpen }) => {
  return (
    <div className='min-h-screen bg-gray-50 p-8 font-sans'>
      <div className='max-w-5xl mx-auto'>
        <div className='flex justify-between items-center mb-10'>
          <h1 className='text-3xl font-black text-gray-800 tracking-tight'>Form Studio</h1>
          <button
            onClick={onCreateNew}
            className='bg-[#D4AF37] hover:bg-[#B5952F] text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2'
          >
            <PlusCircle size={20} /> New Form
          </button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {savedForms.map((form) => (
            <div
              key={form.id}
              className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all'
            >
              <div className='w-12 h-12 bg-[#F5E6CA] rounded-lg flex items-center justify-center text-[#D4AF37] mb-4'>
                <FileText />
              </div>
              <h3 className='font-bold text-xl mb-4 truncate text-gray-800'>{form.title}</h3>
              <div className='flex gap-2'>
                <button
                  onClick={() => onOpen(form)}
                  className='flex-1 bg-[#F9F5E3] text-[#D4AF37] py-2.5 rounded-lg font-bold hover:bg-[#F5E6CA]'
                >
                  Open
                </button>
                <button
                  onClick={() => onEdit(form)}
                  className='p-2.5 text-gray-400 hover:text-[#D4AF37] hover:bg-[#F9F5E3] rounded-lg'
                >
                  <Edit3 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormDashboard;
