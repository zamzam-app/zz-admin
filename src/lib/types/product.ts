export const PRODUCT_KEYS = ['products'];

export interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  description: string;
  images: string[];
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  description?: string;
  images?: string[];
  isActive?: boolean;
}
