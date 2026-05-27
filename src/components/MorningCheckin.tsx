import { useState } from 'react';
import { motion } from 'motion/react';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface MorningCheckinProps {
  userId: string;
  isGuest: boolean;
  onComplete: (score: number) => void;
  dateString: string;
}

export function getISTDate(): { year: string; month: string; day: string; dateString: string; hour: number } {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  let year = '2026';
  let month = '05';
  let day = '26';
  let hour = 12;
  
  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    else if (part.type === 'month') month = part.value;
    else if (part.type === 'day') day = part.value;
    else if (part.type === 'hour') hour = parseInt(part.value, 10);
  }
  
  return {
    year,
    month,
    day,
    dateString: `${year}-${month}-${day}`,
    hour
  };
}

const CHECKIN_OPTIONS = [
  { score: 1, color: '#dc2626', emoji: '😴', label: 'Exhausted' },
  { score: 2, color: '#ea580c', emoji: '😐', label: 'Low Energy' },
  { score: 3, color: '#ca8a04', emoji: '🙂', label: 'Balanced' },
  { score: 4, color: '#16a34a', emoji: '⚡', label: 'High Vibe' },
  { score: 5, color: '#15803d', emoji: '🔥', label: 'Invincible' }
];

export default function MorningCheckin({ userId, isGuest, onComplete, dateString }: MorningCheckinProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = async (score: number) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (isGuest) {
        // Save to guest local storage
        const saved = localStorage.getItem('vibe_os_guest_checkins');
        const checkins = saved ? JSON.parse(saved) : {};
        checkins[dateString] = {
          score,
          timestamp: new Date().toISOString(),
          date: dateString
        };
        localStorage.setItem('vibe_os_guest_checkins', JSON.stringify(checkins));
        
        // Update user profile lastCheckinScore in localStorage
        const profileSaved = localStorage.getItem('vibe_os_guest_user');
        if (profileSaved) {
          const profile = JSON.parse(profileSaved);
          profile.lastCheckinScore = score;
          localStorage.setItem('vibe_os_guest_user', JSON.stringify(profile));
        }
      } else {
        // Create Firestore document in subcollection
        const checkinRef = doc(db, 'users', userId, 'checkins', dateString);
        await setDoc(checkinRef, {
          score,
          timestamp: serverTimestamp(),
          date: dateString
        });

        // Update top-level user doc profile
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          lastCheckinScore: score,
          updatedAt: serverTimestamp()
        });
      }

      onComplete(score);
    } catch (error) {
      console.error('Error during morning check-in saving:', error);
      if (!isGuest) {
        handleFirestoreError(error, OperationType.WRITE, `users/${userId}/checkins/${dateString}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 text-white select-none overflow-hidden font-sans">
      <div className="relative flex flex-col items-center max-w-md w-full px-6 text-center">
        
        {/* Pulsing circle with glowing ring */}
        <div className="relative w-40 h-40 mb-10 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full bg-indigo-500/10 border border-indigo-500/20"
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              boxShadow: "0 0 40px rgba(99, 102, 241, 0.2)"
            }}
          />
          <div className="relative z-10 text-4xl">🌅</div>
        </div>

        {/* Text Headers */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
          Good morning. How's your energy?
        </h1>
        <p className="text-sm font-semibold text-white/40 uppercase tracking-[0.2em] mb-12">
          3 seconds. Your rituals are waiting.
        </p>

        {/* Five score buttons row */}
        <div className="flex justify-between w-full max-w-sm gap-2">
          {CHECKIN_OPTIONS.map((opt) => (
            <div key={opt.score} className="flex flex-col items-center gap-3 flex-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => handleSelect(opt.score)}
                disabled={submitting}
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black font-mono text-white cursor-pointer transition-all border border-white/10"
                style={{
                  backgroundColor: opt.color,
                  boxShadow: `0 4px 15px ${opt.color}40`,
                  opacity: submitting ? 0.5 : 1
                }}
              >
                {opt.score}
              </motion.button>
              
              <span className="text-2xl mt-1 select-none pointer-events-none filter drop-shadow">
                {opt.emoji}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-white/30 truncate max-w-full">
                {opt.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
