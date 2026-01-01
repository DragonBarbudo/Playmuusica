export interface User {
  id: string;
  email: string;
  jellyfinUserId: string;
  jellyfinUsername: string;
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'past_due';
  subscriptionType: 'monthly' | 'annual' | null;
  subscriptionId: string | null;
  subscriptionEndDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'monthly' | 'annual';
  price: number;
  currency: string;
  stripePriceId: string;
  features: string[];
}
