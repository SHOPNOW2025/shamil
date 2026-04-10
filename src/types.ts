export type UserRole = 'USER' | 'MERCHANT' | 'DRIVER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletBalance: number;
  avatar?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL' | 'BANNED';
  // Merchant specific
  storeName?: string;
  storeCategory?: string;
  storeImage?: string;
  location?: { lat: number; lng: number; address: string };
  // Driver specific
  vehicleType?: string;
  plateNumber?: string;
  driverLicenseImage?: string;
  vehicleRegistrationImage?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'FOOD' | 'DRINK' | 'GROCERY' | 'VEGETABLES_FRUITS';
  image: string;
  merchantId: string;
  description: string;
}

export interface Order {
  id: string;
  userId: string;
  merchantId: string;
  driverId?: string;
  items: { productId: string; quantity: number; name?: string }[];
  totalPrice: number;
  status: 'PENDING' | 'PREPARING' | 'WAITING_FOR_DRIVER' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

export interface RideRequest {
  id: string;
  userId: string;
  driverId?: string;
  startLocation: { lat?: number; lng?: number; address: string };
  endLocation: { lat?: number; lng?: number; address: string };
  maxPrice: number;
  estimatedPrice: number;
  status: 'PENDING' | 'ACCEPTED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  type: 'PASSENGER' | 'ITEM';
  itemDetails?: {
    type: string;
    size: string;
  };
  distance?: number; // in km
  duration?: number; // in minutes
  createdAt: string;
}

export interface EmployeeSubscription {
  id: string;
  userId: string;
  driverId?: string;
  startLocation: string;
  endLocation: string;
  isRoundTrip: boolean;
  daysOfWeek: number[]; // 0-6
  holidayDay: number;
  times: string[]; // e.g. ["08:00", "16:00"]
  paymentType: 'WEEKLY' | 'MONTHLY';
  price: number;
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED';
  createdAt: Date;
}
