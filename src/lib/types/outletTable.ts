export enum OutletTableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
}

export interface IOutletTable {
  _id?: string;
  outletId: string;
  createdBy: string;
  name: string;
  tableToken: string;
  capacity?: number;
  status?: OutletTableStatus;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/* ---------- API DTOs ---------- */

export interface CreateOutletTableDto {
  outletId: string;
  createdBy: string;
  name: string;
  capacity?: number;
  status?: OutletTableStatus;
}

export interface UpdateOutletTableDto {
  name?: string;
  capacity?: number;
  status?: OutletTableStatus;
  isActive?: boolean;
}

export interface OutletTableListResponse {
  data: IOutletTable[];
  meta: {
    total: number;
    currentPage: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    limit: number;
  };
}