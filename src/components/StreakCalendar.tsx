import { memo } from 'react';
import { HabitLog } from '../types';

export const StreakCalendar = memo(({ habitId, logs }: { habitId: string, logs: HabitLog[] }) => {
  // Get last 28 days (4 full weeks)
  const last28Days = Array.from({ length: 28 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }).reverse();

  // Filter logs for this habit and map to timestamps (start of day)
  const completedTimestamps = logs
    .filter(log => log.habitId === habitId)
    .map(log => {
        const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    });

  return (
    <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-stardust/40">Sacred 28-Day Cycle</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
          {completedTimestamps.filter(t => last28Days.includes(t)).length}/28 Alignment
        </span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {last28Days.map(ts => {
          const isCompleted = completedTimestamps.includes(ts);
          const date = new Date(ts);
          const isToday = new Date().toDateString() === date.toDateString();
          
          return (
            <div 
              key={ts}
              className={`aspect-square rounded-lg transition-all duration-500 relative flex items-center justify-center ${
                isCompleted 
                  ? 'bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.3)] border border-emerald-400' 
                  : isToday
                    ? 'bg-white/10 border-2 border-white/20'
                    : 'bg-white/5 border border-white/5 hover:border-white/20'
              }`}
              title={`${date.toDateString()}${isCompleted ? ' - Ritual Active' : ''}`}
            >
              <div className={`w-1 h-1 rounded-full ${isCompleted ? 'bg-white' : isToday ? 'bg-stardust/40 animate-pulse' : 'bg-transparent'}`} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 px-1">
         <span className="text-[8px] font-bold text-stardust/20 uppercase tracking-tighter">4 Weeks Ago</span>
         <span className="text-[8px] font-bold text-stardust/20 uppercase tracking-tighter">Current Orbit</span>
      </div>
    </div>
  );
});
