import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Box, Select, MenuItem } from '@mui/material';
import { storesList } from '../__mocks__/managers';
import Card from '../components/common/Card';

const mockReviews = [
  { id: 1, name: 'Bob', rating: 2, comment: 'Not great.' },
  { id: 2, name: 'Charlie', rating: 4, comment: 'Nice store.' },
  { id: 3, name: 'Alice', rating: 5, comment: 'Excellent service!' },
  { id: 4, name: 'Carls', rating: 3, comment: 'Nice store.' },
  { id: 5, name: 'Andria', rating: 2, comment: 'Excellent service!' },
  { id: 6, name: 'Calvin', rating: 4, comment: 'Nice store.' },
  { id: 7, name: 'Diana', rating: 1, comment: 'Excellent service!' },
  { id: 8, name: 'Roma', rating: 4, comment: 'Nice store.' },
  { id: 9, name: 'Ali', rating: 5, comment: 'Excellent service!' },
];

export default function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedReviews = useMemo(() => {
    const sorted = [...mockReviews];

    if (sortOrder === 'desc') {
      return sorted.sort((a, b) => b.rating - a.rating);
    }

    return sorted.sort((a, b) => a.rating - b.rating);
  }, [sortOrder]);

  const store = storesList.find((s) => s.id === id);
  if (!store) return <div className='p-8'>Store not found</div>;

  const trendData = [
    { name: 'Jan', val: 4.4 },
    { name: 'Feb', val: 4.6 },
    { name: 'Mar', val: 4.5 },
    { name: 'Apr', val: 4.7 },
    { name: 'May', val: 4.8 },
  ];

  return (
    <div className='max-w-7xl mx-auto space-y-8'>
      {/* ✅ HEADER FULL WIDTH */}
      <div className='flex items-center gap-4'>
        <button
          onClick={() => navigate('/overview')}
          className='p-2 hover:bg-gray-200 rounded-full transition'
        >
          <ArrowLeft size={22} className='text-[#1F2937]' />
        </button>
        <h2 className='text-2xl font-bold text-[#1F2937]'>{store.name}</h2>
      </div>

      {/* ✅ MAIN GRID STARTS AFTER HEADER */}
      <div className='grid grid-cols-12 gap-8 items-start'>
        {/* LEFT COLUMN */}
        <div className='col-span-8 space-y-10'>
          {/* Overall Satisfaction */}
          <section>
            <h3 className='font-bold text-lg mb-4 text-[#1F2937] ml-5'>Overall Satisfaction</h3>

            <div className='flex flex-col md:flex-row gap-8 items-center bg-white p-8 rounded-4xl shadow-sm border border-gray-100'>
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
                      />
                    </div>
                    <span className='w-8 text-right font-bold text-gray-500'>{val}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Feedback Trends */}

          <section>
            <h3 className='font-bold text-lg mb-4 text-[#1F2937] ml-5'>Feedback Trends</h3>
            <Card
              disablePadding
              sx={{
                p: 3,
                borderRadius: '32px',
                border: '1px solid #F3F4F6',
                bgcolor: 'white',
              }}
            >
              <Box sx={{ width: '100%', height: 200, margin: '0 auto' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={trendData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <XAxis
                      dataKey='name'
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: '#1F2937',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                      padding={{ left: 20, right: 20 }}
                    />
                    <RechartsTooltip />
                    <Line
                      type='monotone'
                      dataKey='val'
                      stroke='#D4AF37'
                      strokeWidth={4}
                      dot={{ r: 5, fill: '#1F2937' }}
                      activeDot={{ r: 6, fill: '#D4AF37' }}
                      strokeLinecap='round'
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </section>

          {/* Service Breakdown */}
          <section>
            <h3 className='font-bold text-lg mb-4 text-[#1F2937] ml-5'>Service Breakdown</h3>

            <div className='grid grid-cols-2 gap-6'>
              <div className='bg-white p-8 rounded-4xl shadow-sm border border-gray-100'>
                <div className='text-xs text-gray-400 mb-2 font-black uppercase tracking-[0.2em]'>
                  Ambience
                </div>
                <div className='text-4xl font-black text-[#1F2937]'>4.5</div>
                <div className='w-full bg-[#F9FAFB] h-2 rounded-full mt-6 overflow-hidden'>
                  <div className='bg-[#10B981] h-full w-[90%]' />
                </div>
              </div>

              <div className='bg-white p-8 rounded-4xl shadow-sm border border-gray-100'>
                <div className='text-xs text-gray-400 mb-2 font-black uppercase tracking-[0.2em]'>
                  Taste & Quality
                </div>
                <div className='text-4xl font-black text-[#1F2937]'>4.7</div>
                <div className='w-full bg-[#F9FAFB] h-2 rounded-full mt-6 overflow-hidden'>
                  <div className='bg-[#10B981] h-full w-[94%]' />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className='col-span-4 space-y-10'>
          {/* Manager Details */}
          <section>
            <h3 className='font-bold text-lg mb-4 text-[#1F2937] ml-5'>Manager Details</h3>

            <div className='bg-white p-8 rounded-4xl shadow-sm border border-gray-100'>
              <div className='space-y-3 text-sm text-gray-700'>
                <p>
                  <span className='font-semibold text-gray-900'>Name:</span> {store.managerName}
                </p>
                <p>
                  <span className='font-semibold text-gray-900'>Phone:</span> {store.managerPhone}
                </p>
                <p>
                  <span className='font-semibold text-gray-900'>Outlet ID:</span> {store.id}
                </p>
              </div>
            </div>
          </section>

          {/* Reviews */}

          <section>
            <div className='flex justify-between items-center mb-4 ml-5 '>
              <h3 className='font-bold text-lg text-[#1F2937]'>Reviews</h3>

              <Select
                size='small'
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <MenuItem value='desc'>Highest to Lowest</MenuItem>
                <MenuItem value='asc'>Lowest to Highest</MenuItem>
              </Select>
            </div>

            <div className='bg-white p-4 rounded-4xl shadow-sm border border-gray-100'>
              <div
                className='space-y-4 max-h-105 overflow-y-auto pr-2'
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {sortedReviews.map((review) => (
                  <div key={review.id} className='border border-gray-200 rounded-xl p-4'>
                    <div className='flex justify-between items-center'>
                      <h4 className='font-semibold text-[#1F2937]'>{review.name}</h4>
                      <span className='text-[#D4AF37] font-bold'>{review.rating}★</span>
                    </div>
                    <p className='text-gray-600 text-sm mt-2'>{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
