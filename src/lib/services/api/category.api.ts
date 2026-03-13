import api from './axios';
import { CATEGORY } from './endpoints';
import type {
  Category,
  CategoryListResponse,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../../types/category';

export const categoryApi = {
  /** GET /category — returns paginated list of categories (query: page, limit) */
  getCategories: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<CategoryListResponse> => {
    const res = await api.get<CategoryListResponse>(CATEGORY.BASE, { params });
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

  /** POST /category — create category */
  create: async (data: CreateCategoryPayload): Promise<Category> => {
    const res = await api.post<Category>(CATEGORY.BASE, data);
    return res.data;
  },

  /** PATCH /category/:id — update category */
  update: async (id: string, data: UpdateCategoryPayload): Promise<Category> => {
    const res = await api.patch<Category>(CATEGORY.BY_ID(id), data);
    return res.data;
  },

  /** DELETE /category/:id — delete category */
  delete: async (id: string): Promise<void> => {
    await api.delete(CATEGORY.BY_ID(id));
  },
};
