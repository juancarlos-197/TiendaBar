export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'annual';
  features: string[];
  badge: string;
  popular?: boolean;
  active: boolean;
  colorTheme: string;
}

export interface UserSubscription {
  id?: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  price: number;
  startDate: string;
  nextBillingDate: string;
  perks: string[];
}
