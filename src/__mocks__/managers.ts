import { Store as StoreType, StoreCategory } from '../lib/types/types';

export const MANAGERS = [
  { id: '1', name: 'John Doe', phone: '123-456-7890' },
  { id: '2', name: 'Jane Smith', phone: '098-765-4321' },
];

export const storesList: StoreType[] = [
  {
    id: '1',
    name: 'Outlet 1',
    category: StoreCategory.SUPERMARKET,
    address: '123 Main St',
    rating: 4,
    totalFeedback: 10,
    managerPhone: '123-456-7890',
    managerId: '1',
    managerName: 'John Doe',
    qrToken: 'mock-qr-token-1',
  },
  {
    id: '2',
    name: 'Outlet 2',
    category: StoreCategory.FASHION,
    address: '456 Elm St',
    rating: 3,
    totalFeedback: 5,
    managerPhone: '098-765-4321',
    managerId: '2',
    managerName: 'Jane Smith',
    qrToken: 'mock-qr-token-2',
  },
];
