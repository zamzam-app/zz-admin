export const OUTLET_TYPE_KEYS = ['outlet-types'];

export interface OutletTypeListMeta {
  total: number;
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  limit: number;
}

export interface OutletType {
  _id: string;
  name: string;
  description: string;
  menu?: string[];
  formId?: string;
  defaultManager?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface OutletTypeListResponse {
  data: OutletType[];
  meta: OutletTypeListMeta;
}

export interface CreateOutletTypePayload {
  name: string;
  description: string;
  menu?: string[];
  formId?: string;
  defaultManager?: string;
}
