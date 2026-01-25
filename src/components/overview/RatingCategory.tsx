import { BarChart3 } from 'lucide-react';
import Card from '../common/Card';

// const categoryData = [
//   { name: 'Cafe', rating: 4.5 },
//   { name: 'Restaurant', rating: 4.2 },
//   { name: 'Bar', rating: 4.0 },
// ];

const branchCount = 5;
const RatingCategory = () => {
  return (
    <Card className='lg:col-span-2 p-6 flex flex-col h-[300px] rounded-3xl'>
      <div className='flex justify-between items-center mb-6'>
        <h4 className='font-bold text-[#1F2937] flex items-center gap-2'>
          <BarChart3 size={18} className='text-blue-500' />
          Rating by Category
        </h4>
        <span className='text-[10px] text-gray-400 font-bold uppercase tracking-wider'>
          Across {branchCount} Branches
        </span>
      </div>
     
    </Card>
  );
};

export default RatingCategory;
