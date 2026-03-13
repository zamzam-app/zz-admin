import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../lib/context/AuthContext';
import { getStoresByOutletId } from '../lib/utils/getStores';
import { checkRole } from '../lib/utils/checkRole';
import { useApiQuery } from '../lib/react-query/use-api-hooks';
import { outletApi } from '../lib/services/api/outlet.api';
import { OUTLET_KEYS } from '../lib/types/outlet';

type Props = {
  allowed: string[];
  children: ReactNode;
};

export default function CategoryGaurd({ allowed, children }: Props) {
  const { isAuthenticated, user } = useAuth();
  const { data: outlets, isLoading } = useApiQuery(OUTLET_KEYS, () => outletApi.getOutletsList());

  if (user?.role === 'admin') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  if (isLoading) {
    return <Navigate to='/' replace />;
  }

  const stores = getStoresByOutletId(user?.outletId || [], outlets ?? []);
  const storeCategories = checkRole(stores);
  const isAllowed = allowed.some((role) => storeCategories.includes(role));

  if (!isAllowed) {
    return <Navigate to='/' replace />;
  }

  return <>{children}</>;
}
