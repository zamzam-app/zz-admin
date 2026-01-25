import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div>
      <h1 className='text-3xl font-semibold mb-6'>Dashboard</h1>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white p-6 rounded-lg shadow'>
          <h3 className='text-gray-500 text-sm font-medium'>Total Users</h3>
          <p className='text-2xl font-bold mt-2'>1,234</p>
        </div>
        <div className='bg-white p-6 rounded-lg shadow'>
          <h3 className='text-gray-500 text-sm font-medium'>Total Revenue</h3>
          <p className='text-2xl font-bold mt-2'>$45,200</p>
        </div>
        <div className='bg-white p-6 rounded-lg shadow'>
          <h3 className='text-gray-500 text-sm font-medium'>Pending Approvals</h3>
          <p className='text-2xl font-bold mt-2'>12</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
