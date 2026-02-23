export enum StoreCategory {
  SUPERMARKET = 'Supermarket',
  FASHION = 'Fashion',
  ICE_CREAM = 'Ice Cream Parlour',
  CAFE = 'Cafe',
  RESTAURANT = 'Restaurant',
}

export interface Cake {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  branchIds?: string[];
  isNew?: boolean;
}

export interface Feedback {
  id: string;
  customerName?: string;
  storeName: string;
  cakeId?: string;
  rating: number;
  description: string;
  date: string;
  serviceType?: string;
  serviceCategory?: string;
  avatar?: string;
}
