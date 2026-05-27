import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin: boolean;
  isSubscribed: boolean;
  createdAt: any;
  trialExpiresAt: any;
  subscriptionTier?: 'free' | 'pro' | 'max';
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

