import apiClient from './axios';
import type { Product, CreateProductRequest, UpdateProductDto } from '../../types/product';

export const productApi = {
  getAll: async (): Promise<Product[]> => {
    const { data } = await apiClient.get<{ data: Product[]; meta?: unknown }>('/product');
    const list = data?.data;
    return Array.isArray(list) ? list : [];
  },

  create: async (payload: CreateProductRequest): Promise<Product> => {
    const { data } = await apiClient.post<Product>('/product', payload);
    return data;
  },

  update: async (id: string, payload: UpdateProductDto): Promise<Product> => {
    const { data } = await apiClient.patch<Product>(`/product/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/product/${id}`);
  },
};
