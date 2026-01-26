import React from 'react';
import { AlertTriangle, Phone } from 'lucide-react';

type Props = {
  store: {
    name: string;
    rating: number;
    managerPhone?: string;
  };
};

const AlertBar = ({ store }: Props) => {
  const handleCall = (e: React.MouseEvent, phone?: string) => {
    e.stopPropagation();
    if (phone) window.open(`tel:${phone}`);
  };

  return (
    <div className='cursor-pointer rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-neutral-200 transition-all border bg-red-50 border-red-100 shadow-red-100/20 shadow-xl mt-8'>
      <div className='flex items-center gap-4'>
        <div className='p-4 rounded-2xl text-white shadow-lg bg-[#E11D48]'>
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className='text-xs font-bold uppercase tracking-widest mb-1 text-[#E11D48]'>
            Needs Attention
          </p>
          <h4 className='text-2xl font-bold text-[#1F2937]'>{store.name}</h4>
          <p className='text-gray-600 text-sm'>
            Branch score: <span className='font-bold text-[#E11D48]'>{store.rating}</span>
          </p>
        </div>
      </div>
      <div className='flex items-center gap-3 w-full md:w-auto'>
        <button
          onClick={(e) => handleCall(e, store.managerPhone)}
          className='flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-[#1F2937] px-6 py-3 rounded-xl font-bold border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm'
        >
          <Phone size={18} className='text-[#E11D48]' />
          Contact Manager
        </button>
      </div>
    </div>
  );
};

export default AlertBar;
