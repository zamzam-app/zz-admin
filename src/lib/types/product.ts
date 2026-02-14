
export interface Product {
  _id: string;            
  name: string;
  price: number;
  description: string;
  ratingsId?: string;
  images: string[];
  type: 'premade' | 'custom';
  isActive?: boolean;
  isDeleted?: boolean;
}
export interface CreateProductRequest {
  name: string;
  price: number;
  description: string;
  images: string[];
  type: 'premade' | 'custom';
}
