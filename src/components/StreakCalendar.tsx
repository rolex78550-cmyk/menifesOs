import { memo } from 'react';
import { HabitLog } from '../types';

export const StreakCalendar = memo(({ habitId, logs }: { habitId: string, logs: HabitLog[] }) => {
  // Get last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toDateString();
  }).reverse();

  // Filter logs for this habit and map to dates
  const completedDates = logs
    .filter(log => log.habitId === habitId)
    .map(log => {
        // Handle Firestore Timestamp or Date
        const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        return date.toDateString();
    });

  return (
    <div className="flex gap-1.5 mt-3 items-center group/calendar">
      {last7Days.map(date => {
        const isCompleted = completedDates.includes(date);
        return (
          <div 
            key={date}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              isCompleted 
                ? 'bg-emerald-400 ring-2 ring-emerald-400/20 shadow-[0_0_8px_rgba(52,211,153,0.4)]' 
                : 'bg-white/5 border border-white/10 hover:border-white/20'
            }`}
            title={date}
          />
        );
      })}
    </div>
  );
});
