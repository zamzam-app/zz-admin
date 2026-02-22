import api from './axios';
import { OUTLET } from './endpoints';
import { StoreCategory } from '../../types/types';
import type {
  Outlet,
  OutletListResponse,
  CreateOutletPayload,
  UpdateOutletPayload,
} from '../../types/outlet';

/** Shape of populated refs in the API response (e.g. outletType, managerId) */
interface ApiPopulatedRef {
  _id: string;
  name?: string;
}

/** Raw outlet item as returned by the API (GET /outlet) */
export interface ApiOutletItem {
  _id: string;
  isActive?: boolean;
  isDeleted?: boolean;
  outletType?: ApiPopulatedRef | string | null;
  name: string;
  description?: string | null;
  images?: string[] | null;
  managerId?: ApiPopulatedRef | string | null;
  formId?: string | null;
  formTitle?: string | null;
  qrToken?: string | null;
  address?: string | null;
  menuItems?: unknown[];
  tables?: unknown[];
  createdAt?: string;
  updatedAt?: string;
  // optional when backend sends different shapes
  outletId?: string;
  category?: string;
  rating?: number;
  totalFeedback?: number;
  managerPhone?: string | null;
}

function parseRef(ref: ApiOutletItem['outletType']): {
  id: string | undefined;
  name: string | undefined;
};
function parseRef(ref: ApiOutletItem['managerId']): {
  id: string | undefined;
  name: string | undefined;
};
function parseRef(ref: unknown): { id: string | undefined; name: string | undefined } {
  if (ref == null) return { id: undefined, name: undefined };
  if (typeof ref === 'string') return { id: ref, name: undefined };
  if (typeof ref === 'object' && ref !== null && '_id' in ref) {
    const obj = ref as ApiPopulatedRef;
    return {
      id: String(obj._id),
      name: typeof obj.name === 'string' ? obj.name : undefined,
    };
  }
  return { id: undefined, name: undefined };
}

/** Map API response item to Outlet (flat id/name for outletType and managerId) */
function toOutlet(item: ApiOutletItem): Outlet {
  const id = item._id;
  const outletType = parseRef(item.outletType);
  const manager = parseRef(item.managerId);
  const images = Array.isArray(item.images) ? item.images : undefined;
  const formId = item.formId ?? undefined;
  const address = item.address ?? undefined;
  const description = item.description ?? undefined;
  const qrToken = item.qrToken ?? undefined;

  return {
    id,
    name: String(item.name ?? ''),
    outletId: item.outletId ?? id,
    category: (item.category as Outlet['category']) ?? StoreCategory.CAFE,
    rating: Number(item.rating) || 0,
    totalFeedback: Number(item.totalFeedback) || 0,
    address: address || undefined,
    managerPhone: item.managerPhone ?? undefined,
    managerId: manager.id,
    managerName: manager.name,
    formId: formId || undefined,
    formTitle: item.formTitle ?? undefined,
    qrToken: qrToken || undefined,
    outletTypeId: outletType.id,
    outletTypeName: outletType.name,
    description: description || undefined,
    images,
  };
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
      data: rawData.map((item) => toOutlet(item as unknown as ApiOutletItem)),
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
    return rawData.map((item) => toOutlet(item as unknown as ApiOutletItem));
  },

  /** POST /outlet — create outlet */
  create: async (data: CreateOutletPayload): Promise<Outlet> => {
    const res = await api.post<ApiOutletItem>(OUTLET.BASE, data);
    return toOutlet(res.data);
  },

  /** PATCH /outlet/:id — update outlet */
  update: async (id: string, data: UpdateOutletPayload): Promise<Outlet> => {
    const res = await api.patch<ApiOutletItem>(OUTLET.BY_ID(id), data);
    return toOutlet(res.data);
  },
};
