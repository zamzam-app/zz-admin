import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import LoadingSpinner from '../common/LoadingSpinner';

const MainLayout: React.FC = () => {
  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar />
      <main className='flex-1 p-8 overflow-auto'>
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default MainLayout;
