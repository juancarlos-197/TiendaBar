export interface Category {
  id?: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  active: boolean;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  imageUrl: string;
  stock: number;
  barId?: string;
  barName?: string;
  active: boolean;
  volumeOrServing?: string;
  whatsappNumber?: string;
  ingredients?: string[];
  alcoholPercentage?: string;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'DELIVERED' | 'CANCELLED';
export type DeliveryMethod = 'TABLE' | 'BAR_PICKUP' | 'VIP_LOUNGE';

export interface Order {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  tableNumber?: string;
  notes?: string;
  createdAt: string;
}
