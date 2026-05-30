
export type Tier = 'Free' | 'Pro' | 'Sovereign';
export type BillingCycle = 'monthly' | 'yearly' | 'lifetime';
export type Currency = 'INR' | 'USD';

export interface PlanPricing {
  amount: number;
  currency: Currency;
  displayPrice: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  pricing: Record<Currency, Record<BillingCycle, number>>;
}

export interface UserSubscription {
  userId: string;
  tier: Tier;
  planId: string;
  billingCycle: BillingCycle;
  country: string;
  currency: Currency;
  amount: number;
  paymentId: string;
  orderId: string;
  status: 'active' | 'expired' | 'cancelled' | 'trialing';
  startDate: string;
  expiryDate: string | null;
  createdAt: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'sovereign_plan',
    name: 'Sovereign',
    description: 'The ultimate alignment for serious practitioners.',
    benefits: [
      'Unlimited AI Orchestrations',
      'Quantum-State Audio Synthesis',
      'Multi-Device Sync',
      'Priority Neuron Processing',
      'Exclusive Beta Access',
      '24/7 Priority Support'
    ],
    pricing: {
      INR: {
        monthly: 99,
        yearly: 999,
        lifetime: 2999
      },
      USD: {
        monthly: 5,
        yearly: 49,
        lifetime: 149
      }
    }
  }
];
