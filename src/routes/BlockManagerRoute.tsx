import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/context/AuthContext';

/** Redirects users with role `manager` away (e.g. routes hidden from managers in the sidebar). */
export default function BlockManagerRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if ((user?.role ?? '').toLowerCase() === 'manager') {
    return <Navigate to='/overview' replace />;
  }
  return <>{children}</>;
}
