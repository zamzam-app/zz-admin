import type { StoreCategory } from './types';

export const OUTLET_KEYS = ['outlets'];

export interface OutletMenuItem {
  productId: string;
  isAvailable?: boolean;
}

export interface Outlet {
  id: string;
  name: string;
  outletId: string;
  category: StoreCategory;
  rating: number;
  totalFeedback: number;
  image?: string;
  images?: string[];
  description?: string;
  address?: string;
  managerPhone?: string;
  formId?: string;
  formTitle?: string;
  managerId?: string;
  managerName?: string;
  qrToken?: string;
  outletTypeId?: string;
  outletTypeName?: string;
  menuItems?: OutletMenuItem[];
}

export interface OutletListMeta {
  total: number;
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  limit: number;
}

export interface OutletListResponse {
  data: Outlet[];
  meta: OutletListMeta;
}

/** Payload for POST /outlet (create) */
export interface CreateOutletPayload {
  name: string;
  description?: string;
  images?: string[];
  address?: string;
  outletType: string;
  managerId?: string | null;
  formId?: string | null;
  productTemplateId?: string | null;
  menuItems?: OutletMenuItem[];
}

/** Payload for PATCH /outlet/:id (update) */
export interface UpdateOutletPayload {
  name?: string;
  description?: string;
  images?: string[];
  address?: string;
  outletType?: string;
  managerId?: string | null;
  formId?: string | null;
  productTemplateId?: string | null;
  menuItems?: OutletMenuItem[];
}
