import { Star, Users } from 'lucide-react';
import Card from '../../components/common/Card';

type Props = {
  avgRating: string;
  totalFeedback: number;
};

const AggregateRating = ({ avgRating, totalFeedback }: Props) => {
  console.log(avgRating, totalFeedback);
  return (
    <Card
      className=' text-center p-8  text-white overflow-hidden relative rounded-3xl'
      style={{
        backgroundColor: '#1F2937 !important',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div className='absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-10 rounded-full -mr-16 -mt-16'></div>
      <Users className='text-[#D4AF37] mb-4' size={32} />
      <h5 className='text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2'>
        Aggregate Rating
      </h5>
      <div className='text-6xl font-black mb-2'>{4}</div>
      <div className='flex text-[#D4AF37] gap-1'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            fill={i < Math.floor(parseFloat('4')) ? 'currentColor' : 'none'}
          />
        ))}
      </div>
      <p className='text-gray-500 text-xs mt-6'>Based on {500} customer touchpoints</p>
    </Card>
  );
};

export default AggregateRating;
