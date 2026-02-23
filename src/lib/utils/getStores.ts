import { storesList } from '../../__mocks__/managers';
import type { Outlet } from '../../lib/types/outlet';

export const getStoresByOutletId = (outletId: string[]) => {
  return storesList.filter((outlet: Outlet) => outletId.includes(outlet.outletId));
};
