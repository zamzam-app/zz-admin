import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import Card from '../components/common/Card';
import { storesList } from '../__mocks__/managers';

export default function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find store from mock data
  const store = storesList.find((s) => s.id === id);

  if (!store) return <div className='p-8'>Store not found</div>;

  const trendData = [
    { name: 'Jan', val: 3.5 },
    { name: 'Feb', val: 4.2 },
    { name: 'Mar', val: 3.8 },
    { name: 'Apr', val: 4.5 },
    { name: 'May', val: 4.8 },
  ];

  return (
    <div className='space-y-8 max-w-4xl mx-auto pb-10'>
      <div className='flex items-center gap-4 mb-6'>
        <button
          onClick={() => navigate('/overview')}
          className='p-2 hover:bg-gray-100 rounded-full transition-colors'
        >
          <ArrowLeft size={24} className='text-[#1F2937]' />
        </button>
        <h2 className='text-2xl font-bold text-[#1F2937]'>{store.name}</h2>
      </div>

      <section>
        <h3 className='font-bold text-lg mb-4 text-[#1F2937]'>Overall Satisfaction</h3>
        <div className='flex flex-col md:flex-row gap-8 items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100'>
          <div className='text-center md:text-left'>
            <div className='text-6xl font-black text-[#1F2937]'>{store.rating}</div>
            <div className='flex text-[#D4AF37] justify-center md:justify-start my-3 gap-1'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < Math.floor(store.rating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <div className='text-gray-400 text-xs font-bold uppercase tracking-wider'>
              {store.totalFeedback} total reviews
            </div>
          </div>
          <div className='flex-1 w-full space-y-3'>
            {[40, 30, 15, 10, 5].map((val, idx) => (
              <div key={5 - idx} className='flex items-center gap-4 text-xs'>
                <span className='w-2 font-black text-gray-400'>{5 - idx}</span>
                <div className='flex-1 h-2.5 bg-[#F9FAFB] rounded-full overflow-hidden'>
                  <div
                    className='h-full rounded-full bg-[#10B981]'
                    style={{ width: `${val}%` }}
                  ></div>
                </div>
                <span className='w-8 text-right font-bold text-gray-500'>{val}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3 className='font-bold text-lg mb-4 text-[#1F2937]'>Feedback Trends</h3>
        <Card className='h-80 p-8 rounded-3xl'>
          <div className='mb-6 flex justify-between items-start'>
            <div>
              <div className='text-xs text-gray-400 font-bold uppercase tracking-widest mb-1'>
                Performance Track
              </div>
              <div className='text-3xl font-black text-[#1F2937]'>{store.rating}</div>
            </div>
          </div>
          <ResponsiveContainer width='100%' height='70%'>
            <LineChart data={trendData}>
              <Line
                type='monotone'
                dataKey='val'
                stroke='#D4AF37'
                strokeWidth={4}
                dot={{ r: 4, fill: '#1F2937', strokeWidth: 2, stroke: '#fff' }}
              />
              <XAxis
                dataKey='name'
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#1F2937', fontSize: 10, fontWeight: 'bold' }}
              />
              <RechartsTooltip />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <section>
        <h3 className='font-bold text-lg mb-4 text-[#1F2937]'>Service Breakdown</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-white border border-gray-100 p-8 rounded-3xl shadow-sm'>
            <div className='text-xs text-gray-400 mb-2 font-black uppercase tracking-[0.2em]'>
              Ambience
            </div>
            <div className='text-4xl font-black text-[#1F2937]'>4.5</div>
            <div className='w-full bg-[#F9FAFB] h-2 rounded-full mt-6 overflow-hidden'>
              <div className='bg-[#10B981] h-full w-[90%]'></div>
            </div>
          </div>
          <div className='bg-white border border-gray-100 p-8 rounded-3xl shadow-sm'>
            <div className='text-xs text-gray-400 mb-2 font-black uppercase tracking-[0.2em]'>
              Taste & Quality
            </div>
            <div className='text-4xl font-black text-[#1F2937]'>4.7</div>
            <div className='w-full bg-[#F9FAFB] h-2 rounded-full mt-6 overflow-hidden'>
              <div className='bg-[#10B981] h-full w-[94%]'></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
