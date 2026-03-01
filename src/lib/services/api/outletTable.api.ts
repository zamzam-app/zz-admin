import api from './axios';
import {
  CreateOutletTableDto,
  UpdateOutletTableDto,
  OutletTableListResponse,
  IOutletTable,
} from '../../types/outletTable';

/* --------------------------------
   CREATE
--------------------------------- */
export const createOutletTable = (payload: CreateOutletTableDto) => {
  return api.post<IOutletTable>('/api/outlet-table', payload);
};

/* --------------------------------
   LIST (with filters)
--------------------------------- */
export const getOutletTables = (params?: {
  page?: number;
  limit?: number;
  outletId?: string;
  status?: string;
  name?: string;
}) => {
  return api.get<OutletTableListResponse>('/api/outlet-table', {
    params,
  });
};

/* --------------------------------
   GET BY ID
--------------------------------- */
export const getOutletTableById = (id: string) => {
  return api.get<IOutletTable>(`/api/outlet-table/${id}`);
};

/* --------------------------------
   UPDATE
--------------------------------- */
export const updateOutletTable = (
  id: string,
  payload: UpdateOutletTableDto
) => {
  return api.patch<IOutletTable>(`/api/outlet-table/${id}`, payload);
};

/* --------------------------------
   DELETE (Soft delete)
--------------------------------- */
export const deleteOutletTable = (id: string) => {
  return api.delete(`/api/outlet-table/${id}`);
};