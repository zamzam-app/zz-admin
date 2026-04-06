export const PRODUCT_KEYS = ['products'];

export interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  categoryList?: string[];
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
  categoryList?: string[];
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  description?: string;
  images?: string[];
  categoryList?: string[];
  isActive?: boolean;
}

export interface GeneratedCake {
  _id: string;
  imageUrl: string;
  userId: {
    _id: string;
    name?: string;
    phoneNumber?: string;
    gender?: string;
    dob?: string;
    role?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  prompt: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomCakesResponse {
  data: GeneratedCake[];
  meta: {
    total: number;
    currentPage: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    limit: number;
  };
}

export interface UploadedCake {
  _id: string;
  userId: {
    _id: string;
    name?: string;
    phoneNumber?: string;
  };
  name?: string;
  phone?: string;
  referenceImageUrl: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface UploadedCakesResponse {
  data: UploadedCake[];
  meta: {
    total: number;
    currentPage: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    limit: number;
  };
}
