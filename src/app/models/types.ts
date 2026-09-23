export type ItemType = 'tienda' | 'bar';

export type UserRole = 'admin' | 'operador' | 'cliente';

export type LoanStatus = 'activo' | 'devuelto' | 'vencido';

export type MovementType =
  | 'loan_created'
  | 'loan_returned'
  | 'item_created'
  | 'item_updated'
  | 'item_deleted'
  | 'stock_adjusted';

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  createdAt: string;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  author: string; // Autor / Marca / Bodega / Fabricante
  category: string;
  isbn: string; // ISBN / Código de barras / Ref / SKU
  availableCopies: number; // Ejemplares disponibles
  totalCopies: number; // Ejemplares totales
  coverUrl: string; // Foto de portada
  description?: string;
  location?: string; // e.g. "Estantería A-3", "Nevera Bar 1"
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  itemId: string;
  itemTitle: string;
  itemType: ItemType;
  itemCoverUrl?: string;
  itemIsbn?: string;
  userId: string;
  userName: string;
  userEmail: string;
  loanDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD (fecha límite)
  returnDate?: string; // YYYY-MM-DD (fecha en que devolvió)
  status: LoanStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  id: string;
  type: MovementType;
  title: string;
  description: string;
  performedBy: string;
  timestamp: string;
  relatedId?: string;
}

export interface DashboardStats {
  tiendaAvailable: number;
  tiendaTotal: number;
  barAvailable: number;
  barTotal: number;
  activeLoans: number;
  overdueLoans: number;
  nearDueLoans: number; // within 48 hours
  totalReturned: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export type SubscriptionStatus = 'activa' | 'pausada' | 'cancelada' | 'expirada';
export type SubscriptionTier = 'basico_bar' | 'club_gourmet' | 'vip_coleccionista' | 'sommelier_premium';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  maxActiveLoans: number;
  discountPercentage: number;
  badgeColor: string;
}

export interface Subscription {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  planId: string;
  planName: string;
  tier: SubscriptionTier;
  priceMonthly: number;
  status: SubscriptionStatus;
  startDate: string; // YYYY-MM-DD
  renewalDate: string; // YYYY-MM-DD
  paymentMethod: 'tarjeta' | 'bizum' | 'transferencia' | 'domiciliacion';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
