import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';

const AuthLayout: React.FC = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='w-full max-w-md bg-white p-8 rounded-lg shadow-md'>
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

export default AuthLayout;
