import { BarChart3 } from 'lucide-react';
import Card from '../common/Card';

const categoryData = [
  { name: 'Restaurant', rating: 4.8 },
  { name: 'Cafe', rating: 3.8 },
  { name: 'Ice Cream Parlour', rating: 4.5 },
  { name: 'Supermarket', rating: 3.9 },
  { name: 'Fashion', rating: 4.2 },
];

const branchCount = 5;
const RatingCategory = () => {
  return (
    <Card className='lg:col-span-2 p- flex flex-col h-[300px] rounded-3xl'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <h4 className='font-bold text-[#1F2937] flex items-center gap-1 text-[14px] mb-2'>
          <BarChart3 size={18} className='text-blue-500' />
          Rating by Category
        </h4>
        <span className='text-[10px] text-gray-400 font-bold uppercase tracking-wider'>
          Across {branchCount} Branches
        </span>
      </div>

      {/* Bar List */}
      <div className='flex-1 flex flex-col gap-2 py-5'>
        {categoryData.map((item) => {
          const widthPercent = (item.rating / 5) * 100;
          const barColor = item.rating >= 4 ? 'bg-[#10B981]' : 'bg-[#F3E8BB]';

          return (
            <div key={item.name} className='flex items-center group relative'>
              {/* Category label */}
              <div className='w-24 pr-3 text-right shrink-0'>
                <span
                  className='text-[12px] font-bold text-[#1F2937] leading-tight
               line-clamp-2 break-words block'
                >
                  {item.name}
                </span>
              </div>

              {/* Bar Track - Rectangular with uniform thickness */}
              <div className='flex-1 h-8 relative'>
                {/* The Bar - Sharp Rectangle */}
                <div
                  className={`h-full ${barColor} transition-all duration-1000 ease-out rounded-r-lg`}
                  style={{ width: `${widthPercent}%` }}
                />

                {/* EXACT WHITE HOVER CARD */}
                <div
                  className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                             opacity-0 group-hover:opacity-100 pointer-events-none 
                             transition-all duration-200 z-50'
                >
                  <div className='bg-white border border-gray-100 shadow-2xl rounded-2xl px-6 py-3 min-w-[140px] text-center'>
                    <p className='text-[11px] text-gray-400 font-medium mb-0.5'>{item.name}</p>
                    <p className='text-[13px] text-[#1F2937] font-bold'>rating : {item.rating}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default RatingCategory;
