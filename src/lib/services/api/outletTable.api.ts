import api  from './axios';
import { OUTLET_TABLE } from './endpoints';
import {
  CreateOutletTableDto,
  OutletTableListResponse,
  UpdateOutletTableDto,
} from '../../types/outletTable';

export const outletTableApi = {
  getTables: (outletId: string) =>
    api.get<OutletTableListResponse>(OUTLET_TABLE.BASE, {
      params: { outletId },
    }),

  createTable: (payload: CreateOutletTableDto) =>
    api.post(OUTLET_TABLE.BASE, payload),

  updateTable: (id: string, payload: UpdateOutletTableDto) =>
    api.patch(OUTLET_TABLE.BY_ID(id), payload),

  deleteTable: (id: string) =>
    api.delete(OUTLET_TABLE.BY_ID(id)),
};