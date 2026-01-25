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
  branchIds?: string[]; // IDs of stores where this cake is available
  isNew?: boolean; // Flag for new menu items
}

export interface Feedback {
  id: string;
  customerName?: string;
  storeName: string;
  cakeId?: string; // Link feedback to a specific product
  rating: number; // 1-5
  description: string;
  date: string;
  serviceType?: string;
  serviceCategory?: string;
  avatar?: string;
}

export interface Store {
  id: string;
  name: string;
  category: StoreCategory;
  rating: number;
  totalFeedback: number;
  image?: string;
  address?: string;
  managerPhone?: string;
  managerId?: string;
  managerName?: string;
  qrToken?: string;
}
