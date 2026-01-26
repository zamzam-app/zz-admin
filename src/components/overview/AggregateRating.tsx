import { Star, Users } from 'lucide-react';
import Card from '../../components/common/Card';

type Props = {
  avgRating: string;
  totalFeedback: number;
};

const AggregateRating = ({ avgRating, totalFeedback }: Props) => {
  const ratingValue = parseFloat(avgRating) || 0;

  return (
    <Card
      disablePadding
      className='text-center p-8 text-white overflow-hidden relative rounded-3xl'
      sx={{
        bgcolor: '#1F2937 !important',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        border: 'none',
        height: '100%',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Decorative Golden Glow */}
      <div className='absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-10 rounded-full -mr-16 -mt-16' />

      {/* Centered Users Icon */}
      <Users className='text-[#D4AF37] mb-4 mx-auto' size={32} />

      <h5 className='text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2 w-full mx-auto'>
        Aggregate Rating
      </h5>

      {/* Dynamic Rating Number */}
      <div className='text-6xl font-black mb-2 text-white w-full'>{avgRating}</div>

      {/* Centered Stars Section */}
      <div className='flex justify-center text-[#D4AF37] gap-1 w-full'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            fill={i < Math.floor(ratingValue) ? 'currentColor' : 'none'}
            color={i < Math.floor(ratingValue) ? '#D4AF37' : '#4B5563'}
          />
        ))}
      </div>

      {/* Dynamic Total Feedback Count */}
      <p className='text-gray-500 text-xs mt-6 w-full'>
        Based on {totalFeedback.toLocaleString()} customer touchpoints
      </p>
    </Card>
  );
};

export default AggregateRating;
