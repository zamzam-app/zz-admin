import type { Store } from './types';

export const OUTLET_KEYS = ['outlets'];

export interface OutletListMeta {
  total: number;
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  limit: number;
}

export interface OutletListResponse {
  data: Store[];
  meta: OutletListMeta;
}
