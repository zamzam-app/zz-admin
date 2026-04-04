import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/context/AuthContext';

/** Only users with role `manager` may access the child route. */
export default function ManagerOnlyRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if ((user?.role ?? '').toLowerCase() !== 'manager') {
    return <Navigate to='/overview' replace />;
  }
  return <>{children}</>;
}
