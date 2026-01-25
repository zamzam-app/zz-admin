import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';

const AuthLayout: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Outlet />
    </Suspense>
  );
};

export default AuthLayout;
