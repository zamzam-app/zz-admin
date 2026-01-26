import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../lib/context/AuthContext';

type Props = {
  allowed: string[];
  children: ReactNode;
};

export default function RoleGuard({ allowed, children }: Props) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.role || !allowed.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
