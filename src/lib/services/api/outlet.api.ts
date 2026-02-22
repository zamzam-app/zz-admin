import api from './axios';
import { OUTLET } from './endpoints';
import type { Store } from '../../types/types';
import type { OutletListResponse } from '../../types/outlet';

/** Normalize API item to Store (e.g. _id -> id) */
function toStore(item: Record<string, unknown>): Store {
  const id = String(item.id ?? item._id ?? '');
  return {
    ...item,
    id,
    name: String(item.name ?? ''),
    outletId: String(item.outletId ?? id),
    category: item.category as Store['category'],
    rating: Number(item.rating) || 0,
    totalFeedback: Number(item.totalFeedback) || 0,
    address: item.address as string | undefined,
    managerPhone: item.managerPhone as string | undefined,
    managerId: item.managerId as string | undefined,
    managerName: item.managerName as string | undefined,
    formId: item.formId as string | undefined,
    formTitle: item.formTitle as string | undefined,
    qrToken: item.qrToken as string | undefined,
  } as Store;
}

export const outletApi = {
  /** GET /api/outlet — returns paginated list of outlets */
  getOutlets: async (params?: {
    currentPage?: number;
    limit?: number;
  }): Promise<OutletListResponse> => {
    const res = await api.get<OutletListResponse>(OUTLET.BASE, { params });
    const rawData = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      data: rawData.map((item) => toStore(item as unknown as Record<string, unknown>)),
      meta: res.data?.meta ?? {
        total: 0,
        currentPage: 1,
        hasPrevPage: false,
        hasNextPage: false,
        limit: 10,
      },
    };
  },

  /** GET /api/outlet — returns outlets list (data array), for use with useApiQuery like getManagers */
  getOutletsList: async (params?: { currentPage?: number; limit?: number }): Promise<Store[]> => {
    const res = await api.get<OutletListResponse>(OUTLET.BASE, { params });
    const rawData = Array.isArray(res.data?.data) ? res.data.data : [];
    return rawData.map((item) => toStore(item as unknown as Record<string, unknown>));
  },
};
