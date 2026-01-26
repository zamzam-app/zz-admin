import { Construction } from 'lucide-react';

const Validation = () => {
  return (
    <div className='flex flex-col items-center justify-center h-[60vh] text-center p-8'>
      <div className='bg-amber-50 p-6 rounded-full mb-6'>
        <Construction size={64} className='text-[#D4AF37]' />
      </div>
      <h2 className='text-3xl font-black text-[#1F2937] mb-3 tracking-tight'>
        Validation Module Coming Soon
      </h2>
      <p className='text-gray-500 max-w-md text-lg'>
        We're working hard to bring you advanced validation tools. Stay tuned for updates!
      </p>
    </div>
  );
};

export default Validation;
