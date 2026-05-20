export interface HabitLog {
  id: string;
  habitId: string;
  duration?: number;
  intensity?: number;
  mood?: string;
  timestamp: any;
  ownerId: string;
}
