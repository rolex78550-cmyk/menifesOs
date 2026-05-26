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
