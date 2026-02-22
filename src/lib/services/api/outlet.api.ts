import api from './axios';
import { OUTLET } from './endpoints';
import { StoreCategory } from '../../types/types';
import type {
  Outlet,
  OutletListResponse,
  CreateOutletPayload,
  UpdateOutletPayload,
} from '../../types/outlet';

/** Normalize API item to Outlet (e.g. _id -> id, outletType -> outletTypeId) */
function toOutlet(item: Record<string, unknown>): Outlet {
  const id = String(item.id ?? item._id ?? '');
  const outletTypeId = item.outletType as string | undefined;
  return {
    ...item,
    id,
    name: String(item.name ?? ''),
    outletId: String(item.outletId ?? id),
    category: (item.category as Outlet['category']) ?? StoreCategory.CAFE,
    rating: Number(item.rating) || 0,
    totalFeedback: Number(item.totalFeedback) || 0,
    address: item.address as string | undefined,
    managerPhone: item.managerPhone as string | undefined,
    managerId: item.managerId as string | undefined,
    managerName: item.managerName as string | undefined,
    formId: item.formId as string | undefined,
    formTitle: item.formTitle as string | undefined,
    qrToken: item.qrToken as string | undefined,
    outletTypeId: outletTypeId ?? (item.outletTypeId as string | undefined),
    outletTypeName: item.outletTypeName as string | undefined,
  } as Outlet;
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
      data: rawData.map((item) => toOutlet(item as unknown as Record<string, unknown>)),
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
  getOutletsList: async (params?: { currentPage?: number; limit?: number }): Promise<Outlet[]> => {
    const res = await api.get<OutletListResponse>(OUTLET.BASE, { params });
    const rawData = Array.isArray(res.data?.data) ? res.data.data : [];
    return rawData.map((item) => toOutlet(item as unknown as Record<string, unknown>));
  },

  /** POST /outlet — create outlet */
  create: async (data: CreateOutletPayload): Promise<Outlet> => {
    const res = await api.post<Record<string, unknown>>(OUTLET.BASE, data);
    return toOutlet(res.data);
  },

  /** PATCH /outlet/:id — update outlet */
  update: async (id: string, data: UpdateOutletPayload): Promise<Outlet> => {
    const res = await api.patch<Record<string, unknown>>(OUTLET.BY_ID(id), data);
    return toOutlet(res.data);
  },
};
