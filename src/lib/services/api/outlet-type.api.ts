import api from './axios';
import { OUTLET_TYPE } from './endpoints';
import type {
  OutletType,
  OutletTypeListResponse,
  CreateOutletTypePayload,
} from '../../types/outlet-type';

export const outletTypeApi = {
  /** GET /outlet-type — returns paginated list of outlet types (query: page, limit) */
  getOutletTypes: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<OutletTypeListResponse> => {
    const res = await api.get<OutletTypeListResponse>(OUTLET_TYPE.BASE, { params });
    return {
      data: res.data?.data ?? [],
      meta: res.data?.meta ?? {
        total: 0,
        currentPage: 1,
        hasPrevPage: false,
        hasNextPage: false,
        limit: 10,
      },
    };
  },

  /** POST /outlet-type — create outlet type */
  create: async (data: CreateOutletTypePayload): Promise<OutletType> => {
    const res = await api.post<OutletType>(OUTLET_TYPE.BASE, data);
    return res.data;
  },
};
