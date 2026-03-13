import type { Outlet } from '../../lib/types/outlet';

export const getStoresByOutletId = (outletIds: string[], allOutlets: Outlet[]): Outlet[] => {
  return allOutlets.filter(
    (outlet) => outletIds.includes(outlet.outletId) || outletIds.includes(outlet.id),
  );
};
