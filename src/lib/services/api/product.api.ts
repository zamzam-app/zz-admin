import apiClient from './axios';
import type { Product, CreateProductRequest } from '../../types/product';

export const productApi = {
  getAll: async (): Promise<Product[]> => {
    const { data } = await apiClient.get<Product[]>('/product');
    return data;
  },

  create: async (payload: CreateProductRequest): Promise<Product> => {
    const { data } = await apiClient.post<Product>('/product', payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/product/${id}`);
  },
};
