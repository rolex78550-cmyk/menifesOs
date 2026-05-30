import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin: boolean;
  isSubscribed: boolean;
  createdAt: any;
  trialStart?: any;
  trialEnd?: any;
  trialExpiresAt?: any;
  subscriptionTier?: 'free' | 'pro' | 'max';
  tier?: 'Novice' | 'Sovereign';
  status?: 'trial' | 'active_monthly' | 'active_yearly' | 'lifetime' | 'expired' | 'cancelled' | 'payment_pending';
  billingCycle?: 'monthly' | 'yearly' | 'lifetime';
  currency?: string;
  country?: string;
  subscriptionStart?: any;
  subscriptionEnd?: any;
  paymentId?: string;
  orderId?: string;
  fcmToken?: string;
  hasCompletedOnboarding?: boolean;
  manifestationGoal?: string;
  lastCheckinScore?: number;
  lastOracleDrawDate?: string;
  currentOracleCard?: {
    cardName: string;
    theme: string;
    affirmation: string;
    cosmicAction: string;
    color: string;
    symbol: string;
    completed?: boolean;
  } | null;
  lastPositiveDrawDate?: string;
  currentPositiveCard?: {
    cardName: string;
    theme: string;
    affirmation: string;
    feelingBoost: string;
    sacredAction: string;
    color: string;
    symbol: string;
    completed?: boolean;
  } | null;
  cosmicXP?: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  duration?: number;
  intensity?: number;
  mood?: string;
  timestamp: any;
  ownerId: string;
}

export interface DailyCheckin {
  score: 1 | 2 | 3 | 4 | 5;
  timestamp: Timestamp;
  date: string;
}

