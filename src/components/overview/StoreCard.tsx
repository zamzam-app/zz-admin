import { useNavigate } from 'react-router-dom';
import { ChevronRight, Coffee, Star, Store as StoreIcon } from 'lucide-react';
import Card from '../common/Card';

type Props = {
  store: {
    id: string;
    name: string;
    category: string;
    rating: number;
    totalFeedback: number;
  };
};

const StoreCard = ({ store }: Props) => {
  const navigate = useNavigate();
  const isBunCafe = store.name.toLowerCase().includes('bun cafe');

  return (
    <Card className='p-6 border border-gray-100 hover:border-[#D4AF37] transition-colors group relative overflow-hidden rounded-3xl'>
      <div className='flex justify-between items-start mb-4'>
        <div className='flex items-center gap-3'>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isBunCafe ? 'bg-[#F5E6CA] text-[#D4AF37]' : 'bg-[#1F2937] text-[#F5E6CA]'
            }`}
          >
            {isBunCafe ? <Coffee size={20} /> : <StoreIcon size={20} />}
          </div>
          <div>
            <h4 className='font-bold text-[#1F2937] text-lg group-hover:text-[#D4AF37] transition-colors'>
              {store.name}
            </h4>
            <p className='text-[10px] text-gray-400 font-bold uppercase tracking-wider'>
              {store.category}
            </p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4 mb-6'>
        <div className='bg-[#F9FAFB] p-4 rounded-xl'>
          <p className='text-[10px] text-gray-400 font-bold uppercase mb-1'>Rating</p>
          <div className='flex items-end gap-1'>
            <span className='text-3xl font-black text-[#1F2937] leading-none'>{store.rating}</span>
            <Star size={14} className='text-[#D4AF37] mb-1' fill='currentColor' />
          </div>
        </div>
        <div className='bg-[#F9FAFB] p-4 rounded-xl'>
          <p className='text-[10px] text-gray-400 font-bold uppercase mb-1'>Feedback</p>
          <div className='text-3xl font-black text-[#1F2937] leading-none'>
            {store.totalFeedback}
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate(`/analytics/${store.id}`)}
        className='w-full py-3 bg-[#1F2937] text-white hover:bg-gray-800 font-bold rounded-xl transition-all flex items-center justify-center gap-2'
      >
        Deep Analytics <ChevronRight size={14} />
      </button>
    </Card>
  );
};

export default StoreCard;
