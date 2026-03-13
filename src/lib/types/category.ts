export const CATEGORY_KEYS = ['categories'];

export interface CategoryListMeta {
  total: number;
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  limit: number;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryListResponse {
  data: Category[];
  meta: CategoryListMeta;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
}
