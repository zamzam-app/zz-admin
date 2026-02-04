import { storesList } from '../../__mocks__/managers';
import { Store } from '../../lib/types/types';

export const getStoresByOutletId = (outletId: string[]) => {
  return storesList.filter((store: Store) => outletId.includes(store.outletId));
};
