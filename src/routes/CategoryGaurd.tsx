import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../lib/context/AuthContext';
import { getStoresByOutletId } from '../lib/utils/getStores';
import { checkRole } from '../lib/utils/checkRole';

type Props = {
  allowed: string[];
  children: ReactNode;
};

export default function CategoryGaurd({ allowed, children }: Props) {
  const { isAuthenticated, user } = useAuth();
  if (user?.role === 'admin') {
    return <>{children}</>;
  }
  //check stores based on user outlet id
  const stores = getStoresByOutletId(user?.outletId || []);
  const storeCategories = checkRole(stores);
  const isAllowed = allowed.some((role) => storeCategories.includes(role));

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  if (!isAllowed) {
    return <Navigate to='/' replace />;
  }

  return <>{children}</>;
}
