/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent, MouseEvent, FormEvent, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  writeBatch,
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType, testConnection, updateProfile } from './lib/firebase';

const playDivineSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // 528Hz - Transformation and Miracles (DNA Repair)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(528, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 4);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 4);
  } catch (e) {
    console.warn("Divine sound could not play due to browser policy or error:", e);
  }
};

const triggerEmailNotification = async (email: string, userName: string | null, ritualName: string) => {
  try {
    await fetch('/api/notify-ritual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userName, ritualName })
    });
  } catch (error) {
    console.error("Email notification failed:", error);
  }
};

import { 
  LayoutDashboard, 
  CheckSquare, 
  Zap, 
  BookOpen, 
  Wallet, 
  Settings, 
  Plus, 
  CheckCircle2,
  Lock,
  Star,
  ChevronRight,
  Search,
  Bell,
  MoreHorizontal,
  Flame,
  Target,
  Heart,
  Moon,
  Eye,
  History,
  PenTool,
  Image as ImageIcon,
  Library,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Play,
  Music,
  Volume2,
  Pause,
  X,
  Upload,
  Wand2,
  Waves,
  Wind,
  Timer,
  Activity,
  Smile,
  Infinity,
  TrendingUp,
  Expand,
  Users,
  Check,
  ShieldCheck,
  Award,
  Calendar,
  BarChart3,
  Clock,
  TrendingDown
} from 'lucide-react';
import { StreakCalendar } from './components/StreakCalendar';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

// --- Types ---
type View = 'dashboard' | 'manifest' | 'habits' | 'vision' | 'wealth' | 'academy' | 'pricing' | 'sonic' | 'terms' | 'privacy' | 'settings';

interface Desire {
  id: string;
  text: string;
  category: 'Personal' | 'Wealth' | 'Health' | 'Career';
  date: string;
  isAchieved: boolean;
}

interface VisionItem {
  id: string;
  imageUrl: string;
  caption: string;
  updatedAt?: any;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  trick: string;
}

interface Habit {
  id: string;
  name: string;
  streak: number;
  completed: boolean;
  reminderTime?: string;
}

interface HabitLog {
  id: string;
  habitId: string;
  duration?: number;
  intensity?: number;
  mood?: string;
  timestamp: any;
  ownerId: string;
}

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
}

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  label: string;
  category: string;
  timestamp: any;
}

interface DiaryEntry {
  id: string;
  content: string;
  method: 'free' | '369' | '555';
  ownerId: string;
  timestamp: any;
}

// --- Components ---

// --- Component Helpers ---

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG with 0.7 quality
    };
  });
};

const HabitMetricsModal = ({ habit, onClose, onSave }: { habit: Habit, onClose: () => void, onSave: (id: string, m: { duration: number, intensity: number, mood: string }) => void }) => {
  const [duration, setDuration] = useState(15);
  const [intensity, setIntensity] = useState(5);
  const [mood, setMood] = useState('Grateful');

  const moods = ['Exalted', 'Grateful', 'Focused', 'Calm', 'Resistance'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-cosmic-black/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-cosmic-void border border-emerald-500/20 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl overflow-hidden"
      >
        <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-xl font-black italic text-white">Record Frequencies</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mt-1">{habit.name}</p>
            </div>
            <button onClick={onClose} className="p-2 text-stardust/40 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Duration */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stardust/40 flex items-center gap-2">
                  <Timer className="w-3 h-3" /> Ritual Duration
                </label>
                <span className="text-xs font-black text-white">{duration} min</span>
              </div>
              <input 
                type="range" min="1" max="120" step="1"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* Intensity */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stardust/40 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Energy Intensity
                </label>
                <span className="text-xs font-black text-white">{intensity}/10</span>
              </div>
              <div className="flex gap-2">
                {[...Array(10)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIntensity(i + 1)}
                    className={`flex-grow h-8 rounded-lg border transition-all ${intensity >= i + 1 ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/5'}`}
                  />
                ))}
              </div>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-stardust/40 mb-4 flex items-center gap-2">
                <Smile className="w-3 h-3" /> Resonant Mood
              </label>
              <div className="flex flex-wrap gap-2">
                {moods.map(m => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${mood === m ? 'bg-white text-cosmic-black border-white' : 'bg-white/5 text-stardust/40 border-white/5 hover:border-white/20'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => onSave(habit.id, { duration, intensity, mood })}
              className="w-full p-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all mt-4"
            >
              Seal Frequencies
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Sidebar = ({ currentView, setView, tier, isMobile }: { currentView: View, setView: (v: View) => void, tier: string, isMobile: boolean }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Omni' },
    { id: 'manifest', icon: Target, label: 'Desire' },
    { id: 'habits', icon: Zap, label: 'Rituals' },
    { id: 'vision', icon: ImageIcon, label: 'Vision' },
    { id: 'wealth', icon: Wallet, label: 'Flow' },
    { id: 'sonic', icon: Waves, label: 'Sonic' },
    { id: 'academy', icon: Library, label: 'Academy' },
    { id: 'pricing', icon: Sparkles, label: 'Upgrade' },
    { id: 'settings', icon: Settings, label: 'Setup' },
  ];

  return (
    <div className="w-full lg:w-72 fixed bottom-0 left-0 right-0 lg:top-0 lg:left-0 lg:bottom-0 lg:h-screen bg-[#000105]/95 lg:bg-[#000105] backdrop-blur-xl z-[100] border-t lg:border-t-0 lg:border-r border-emerald-500/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] lg:shadow-none safe-bottom flex lg:flex-col px-4 py-2 lg:px-6 lg:py-10">
      <div className="hidden lg:flex items-center gap-3 mb-12 px-2 group cursor-pointer" onClick={() => setView('dashboard')}>
        <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 group-hover:rotate-12 transition-transform">
          <Infinity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Vibe</h1>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500/40">Continuum</p>
        </div>
      </div>

      <motion.nav 
        layout={!isMobile}
        className="flex lg:flex-col gap-1 sm:gap-1.5 lg:gap-2 flex-grow overflow-x-auto lg:overflow-x-visible no-scrollbar p-1 rounded-2xl lg:bg-emerald-500/5 border border-emerald-500/5 lg:border-emerald-500/10"
      >
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-4 lg:px-4 py-1.5 lg:py-3.5 rounded-xl text-[9px] lg:text-sm font-black lg:font-bold transition-all whitespace-nowrap lg:whitespace-normal shrink-0 ${
              currentView === item.id 
                ? 'bg-emerald-500 text-white shadow-lg' 
                : 'text-stardust/40 hover:bg-emerald-500/10 hover:text-emerald-400 active:scale-95'
            }`}
          >
            <item.icon className={`w-4.5 h-4.5 lg:w-4 lg:h-4 ${currentView === item.id ? 'scale-110' : ''}`} />
            <span className="block uppercase tracking-tighter lg:tracking-normal lg:normal-case">{item.label}</span>
          </button>
        ))}
      </motion.nav>

      <div className="hidden lg:block pt-6 border-t border-emerald-500/10 mt-auto">
        <div className="mb-4 px-4 py-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 group cursor-pointer hover:bg-emerald-500/10 transition-all">
          <div className="text-[8px] font-black uppercase tracking-widest text-stardust/40 mb-1 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Freq Level
          </div>
          <p className="text-xs font-black text-white italic group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{tier}</p>
        </div>
      </div>
    </div>
  );
};

const CosmicBackground = ({ isMobile }: { isMobile?: boolean }) => {
  const [internalIsMobile, setInternalIsMobile] = useState(false);

  useEffect(() => {
    if (isMobile !== undefined) return;
    const checkMobile = () => setInternalIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  const activeIsMobile = isMobile !== undefined ? isMobile : internalIsMobile;

  const stars = useMemo(() => {
    // Dramatically reduced counts for mobile to save CPU/GPU
    const farCount = activeIsMobile ? 15 : 100;
    const midCount = activeIsMobile ? 0 : 60;
    const closeCount = activeIsMobile ? 5 : 30;

    return {
      far: [...Array(farCount)].map(() => ({ top: Math.random() * 200, left: Math.random() * 100 })),
      mid: [...Array(midCount)].map(() => ({ top: Math.random() * 200, left: Math.random() * 100 })),
      close: [...Array(closeCount)].map(() => ({ top: Math.random() * 200, left: Math.random() * 100 }))
    };
  }, [activeIsMobile]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#000105]">
      {/* Deep Space Dust Layers */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] will-change-transform transform-gpu" />
      
      {/* Infinite Star Field - Far Layer */}
      <div className="absolute inset-[-100vh] animate-star-move will-change-transform transform-gpu" style={{ '--duration': '200s' } as any}>
        {stars.far.map((star, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: '1px',
              height: '1px',
            }}
          />
        ))}
      </div>

      {/* Infinite Star Field - Mid Layer (Limited on Mobile) */}
      {!activeIsMobile && (
        <div className="absolute inset-[-100vh] animate-star-move will-change-transform transform-gpu" style={{ '--duration': '100s' } as any}>
          {stars.mid.map((star, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-white opacity-40 animate-pulse-slow"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                width: '1.5px',
                height: '1.5px',
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Infinite Star Field - Close Layer */}
      <div className="absolute inset-[-100vh] animate-star-move will-change-transform transform-gpu" style={{ '--duration': '50s' } as any}>
        {stars.close.map((star, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white opacity-60"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: '2px',
              height: '2px',
            }}
          />
        ))}
      </div>

      {/* Gargantua Black Hole System (Only on Desktop for Performance) */}
      {!activeIsMobile && (
        <div className="absolute -bottom-40 -left-40 lg:-bottom-60 lg:-left-60 w-[50rem] h-[50rem] lg:w-[80rem] lg:h-[80rem] opacity-70 will-change-transform">
          
          {/* The Gravitational Lensing (The 'Halo') */}
          <div className="absolute inset-0 rounded-full animate-gargantua opacity-40">
            <div className="absolute inset-0 rounded-full border-[100px] border-white/10 blur-3xl" />
            <div className="absolute inset-[15%] rounded-full border-[20px] border-white/20 blur-xl" />
          </div>

          {/* Accretion Disk (Front) */}
          <div className="absolute top-1/2 left-[-20%] right-[-20%] h-[15%] lg:h-[10%] bg-gradient-to-r from-transparent via-white/20 to-transparent blur-2xl animate-accretion z-20" />
          <div className="absolute top-1/2 left-[-10%] right-[-10%] h-[2%] lg:h-[1%] bg-white/40 blur-md animate-accretion z-30" style={{ animationDelay: '-2s' }} />

          {/* The Event Horizon (The Void) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-black z-40 shadow-[0_0_80px_rgba(255,255,255,0.2)] animate-event-horizon overflow-hidden">
            {/* Inner warp effect */}
            <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/10 to-transparent animate-spin-slow" />
          </div>

          {/* Gravitational Warp (Top/Bottom Disk Reflection) */}
          <div className="absolute top-[20%] left-0 right-0 h-[20%] bg-white/5 blur-3xl rounded-[100%] z-10" />
          <div className="absolute bottom-[20%] left-0 right-0 h-[20%] bg-white/5 blur-3xl rounded-[100%] z-10" />
        </div>
      )}

      {/* Shooting Stars (Only on Desktop) */}
      {!activeIsMobile && (
        <div className="absolute top-0 right-0 w-full h-full opacity-60">
          <div className="absolute top-[10%] left-[85%] w-[1px] h-[120px] bg-gradient-to-t from-white/40 to-transparent rotate-[215deg] animate-shooting-star" style={{ animationDelay: '3s' }} />
          <div className="absolute top-[40%] left-[95%] w-[1px] h-[200px] bg-gradient-to-t from-white/60 to-transparent rotate-[215deg] animate-shooting-star" style={{ animationDelay: '12s' }} />
        </div>
      )}
    </div>
  );
};

const insights = [
  "Your focus creates your reality. Today, focus on abundance.",
  "The universe and you are one. Align with the frequency of your desires.",
  "Small rituals pave the way for massive shifts in destiny.",
  "Trust the timing of your life. The manifestation is unfolding.",
  "Release resistance. Allow the flow of wealth and joy to enter.",
  "Every breath is a new opportunity to manifest a better world.",
  "Your vibration is your currency. Spend it on high-frequency thoughts.",
  "The secret to manifestation is feeling it before seeing it.",
  "You are the architect of your soul's journey. Build with love."
];

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [view, setView] = useState<View>('dashboard');

  // Permanent fix for persistent Vite WebSocket error in AI Studio
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && (args[0].includes('failed to connect to websocket') || args[0].includes('WebSocket closed without opened'))) {
        return;
      }
      originalError.apply(console, args);
    };
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && (event.reason.message?.includes('WebSocket closed') || (event.reason.name === 'Error' && event.reason.message === 'WebSocket closed without opened.'))) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ tier: string, subscriptionExpiry?: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);

  // Check if subscription is still valid or within free trial
  const isTierActive = useMemo(() => {
    if (!userProfile) return false;
    if (userProfile.tier !== 'Novice') return true; // Already subscribed

    // Check for 7-day trial
    if (user && user.metadata && user.metadata.creationTime) {
      const creationTime = new Date(user.metadata.creationTime).getTime();
      const now = new Date().getTime();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (now - creationTime < sevenDaysInMs) {
        return true; 
      }
    }
    
    if (!userProfile.subscriptionExpiry) return false;
    
    // ... (Keep expiry logic)
    const now = new Date().getTime();
    let expiryTime = 0;
    
    if (userProfile.subscriptionExpiry?.seconds) {
      expiryTime = userProfile.subscriptionExpiry.seconds * 1000;
    } else if (userProfile.subscriptionExpiry instanceof Date) {
      expiryTime = userProfile.subscriptionExpiry.getTime();
    } else {
      expiryTime = new Date(userProfile.subscriptionExpiry).getTime();
    }
    
    return now < expiryTime;
  }, [userProfile, user]);


  const activeTier = isTierActive ? (userProfile?.tier || 'Novice') : 'Novice';
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [desires, setDesires] = useState<Desire[]>([]);
  const [visionItems, setVisionItems] = useState<VisionItem[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const [insight, setInsight] = useState('Universal energy is flowing through you today.');
  const mainContainerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
    setInsight(randomInsight);
    const timer = setInterval(() => {
      setInsight(insights[Math.floor(Math.random() * insights.length)]);
    }, 1000 * 60 * 60 * 4);
    return () => clearInterval(timer);
  }, []);

  const [completingHabitId, setCompletingHabitId] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{ id: string, title: string, body: string } | null>(null);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 10000); // 10s visibility
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Sync User Profile
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data() as { tier: string });
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          tier: 'Novice',
          updatedAt: serverTimestamp()
        };
        try {
          await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    return () => unsubscribe();
  }, [user]);
  
  // Audio State
  const [activeHz, setActiveHz] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Custom & Guided Audio Streams (Bhajans, Meditation Tracks & Podcasts)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [activeTrack, setActiveTrack] = useState<any | null>(null);
  const [isTrackPlaying, setIsTrackPlaying] = useState(false);
  const [customTracks, setCustomTracks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('cosmic_custom_tracks');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const toggleTrack = (track: any) => {
    // Stop pure tone frequency oscillator if active
    if (oscillatorRef.current) {
      stopFrequency();
    }

    if (activeTrack?.id === track.id) {
      if (isTrackPlaying) {
        audioPlayerRef.current?.pause();
        setIsTrackPlaying(false);
        setActiveHz(null);
      } else {
        audioPlayerRef.current?.play().catch(e => console.error("Play error:", e));
        setIsTrackPlaying(true);
        setActiveHz(track.virtualHz || 432);
      }
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(track.url);
      audio.loop = true;
      audioPlayerRef.current = audio;
      
      setIsTrackPlaying(true);
      setActiveTrack(track);
      setActiveHz(track.virtualHz || 432);
      
      audio.play().catch(e => {
        console.warn("Audio stream blocked or failed, keeping indicator.", e);
      });
    }
  };

  const addCustomTrack = (track: any) => {
    const updated = [...customTracks, track];
    setCustomTracks(updated);
    localStorage.setItem('cosmic_custom_tracks', JSON.stringify(updated));
  };

  const deleteCustomTrack = (id: string) => {
    const updated = customTracks.filter(t => t.id !== id);
    setCustomTracks(updated);
    localStorage.setItem('cosmic_custom_tracks', JSON.stringify(updated));
    if (activeTrack?.id === id) {
      audioPlayerRef.current?.pause();
      setIsTrackPlaying(false);
      setActiveTrack(null);
      setActiveHz(null);
    }
  };

  const toggleFrequency = (hz: number) => {
    if (activeHz === hz) {
      stopFrequency();
      return;
    }
    playFrequency(hz);
  };

  const playFrequency = (hz: number) => {
    stopFrequency();
    
    // Stop ambient music/podcast if running
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsTrackPlaying(false);
      setActiveTrack(null);
    }
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1); // Fade in
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    
    oscillatorRef.current = osc;
    gainNodeRef.current = gain;
    setActiveHz(hz);
  };

  const stopFrequency = () => {
    if (oscillatorRef.current && gainNodeRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const gain = gainNodeRef.current;
      const osc = oscillatorRef.current;
      
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5); // Fade out
      setTimeout(() => {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      }, 500);
    }
    setActiveHz(null);
  };

  useEffect(() => {
    return () => {
      stopFrequency();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    const handleScrollReset = () => {
      if (mainContainerRef.current) {
        mainContainerRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    };

    handleScrollReset();
    // Delay as fallback for slow renders
    const timeout = setTimeout(handleScrollReset, 10);
    return () => clearTimeout(timeout);
  }, [view]);

  useEffect(() => {
    try {
      testConnection();
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }, (err) => {
        console.error("Auth change error:", err);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Auth init error:", e);
      setLoading(false);
    }
  }, []);

  // Sync Habits
  useEffect(() => {
    if (!user) {
      setHabits([]);
      return;
    }
    const q = query(collection(db, 'habits'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));
      setHabits(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'habits'));
    return () => unsubscribe();
  }, [user]);

  // Periodic reset check logic (Daily Reset)
  useEffect(() => {
    if (!user || habits.length === 0) return;

    const resetHabitsIfNeeded = async () => {
      const now = new Date();
      const todayString = now.toDateString(); 
      
      let needsReset = false;
      const batch = writeBatch(db);

      habits.forEach(habit => {
        // If the habit was completed but the last update was NOT today, reset it
        if (habit.completed && habit.updatedAt) {
          try {
            const dateObj = habit.updatedAt.toDate ? habit.updatedAt.toDate() : new Date(habit.updatedAt);
            const lastUpdateDate = dateObj.toDateString();
            
            if (lastUpdateDate !== todayString) {
              batch.update(doc(db, 'habits', habit.id), {
                completed: false,
                updatedAt: serverTimestamp()
              });
              needsReset = true;
            }
          } catch (e) {
            console.warn("Date parsing error in reset:", e);
          }
        }
      });

      if (needsReset) {
        try {
          await batch.commit();
        } catch (e) {
          console.error("Daily ritual reset failed:", e);
        }
      }
    };

    resetHabitsIfNeeded();
  }, [user, habits]);
  
  // Sync Habit Logs
  useEffect(() => {
    if (!user) {
      setHabitLogs([]);
      return;
    }
    const q = query(collection(db, 'habit_logs'), where('ownerId', '==', user.uid), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HabitLog));
      setHabitLogs(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'habit_logs'));
    return () => unsubscribe();
  }, [user]);

  // Sync Desires
  useEffect(() => {
    if (!user) {
      setDesires([]);
      return;
    }
    const q = query(collection(db, 'desires'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Desire));
      setDesires(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'desires'));
    return () => unsubscribe();
  }, [user]);

  // Sync Vision Items
  useEffect(() => {
    if (!user) {
      setVisionItems([]);
      return;
    }
    const q = query(collection(db, 'vision_items'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisionItem));
      setVisionItems(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'vision_items'));
    return () => unsubscribe();
  }, [user]);

  // Sync Diary Entries
  useEffect(() => {
    if (!user) {
      setDiaryEntries([]);
      return;
    }
    const q = query(collection(db, 'diary_entries'), where('ownerId', '==', user.uid), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiaryEntry));
      setDiaryEntries(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'diary_entries'));
    return () => unsubscribe();
  }, [user]);

  // Sync Transactions
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }
    const q = query(collection(db, 'transactions'), where('ownerId', '==', user.uid), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));
    return () => unsubscribe();
  }, [user]);

  const toggleDesire = async (id: string) => {
    const desire = desires.find(d => d.id === id);
    if (!desire || !user) return;
    
    try {
      if (!desire.isAchieved) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f97316', '#fbbf24', '#ffffff']
        });
      }
      await updateDoc(doc(db, 'desires', id), {
        isAchieved: !desire.isAchieved,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `desires/${id}`);
    }
  };

  const toggleHabit = async (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const habit = habits.find(h => h.id === id);
    if (!habit || !user) return;

    try {
      if (!habit.completed) {
        // Opening metrics modal
        setCompletingHabitId(id);
      } else {
        // Un-marking
        await updateDoc(doc(db, 'habits', id), {
          completed: false,
          streak: Math.max(0, habit.streak - 1),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `habits/${id}`);
    }
  };

  const addHabitLog = async (habitId: string, metrics: { duration: number, intensity: number, mood: string }) => {
    if (!user) return;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    try {
      await addDoc(collection(db, 'habit_logs'), {
        habitId,
        ownerId: user.uid,
        timestamp: serverTimestamp(),
        ...metrics
      });

      await updateDoc(doc(db, 'habits', habitId), {
        completed: true,
        streak: habit.streak + 1,
        updatedAt: serverTimestamp()
      });

      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#f97316', '#ffffff']
      });

      setCompletingHabitId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'habit_logs');
    }
  };

  const addDesire = async (text: string) => {
    if (!user || !text) return;
    try {
      await addDoc(collection(db, 'desires'), {
        text,
        category: 'Personal',
        date: new Date().toISOString().split('T')[0],
        isAchieved: false,
        ownerId: user.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'desires');
    }
  };

  const removeDesire = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'desires', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `desires/${id}`);
    }
  };

  const addHabit = async (name: string, reminderTime: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'habits'), {
        name,
        streak: 0,
        completed: false,
        reminderTime,
        ownerId: user.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'habits');
    }
  };

  const updateHabit = async (id: string, name: string, reminderTime: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'habits', id), {
        name,
        reminderTime,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `habits/${id}`);
    }
  };

  const removeHabit = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'habits', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `habits/${id}`);
    }
  };

  const addVisionItem = async (caption: string, imageUrl: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'vision_items'), {
        caption,
        imageUrl,
        ownerId: user.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'vision_items');
    }
  };

  const removeVisionItem = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'vision_items', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vision_items/${id}`);
    }
  };

  const addDiaryEntry = async (content: string, method: 'free' | '369' | '555') => {
    if (!user || !content.trim()) return;
    try {
      await addDoc(collection(db, 'diary_entries'), {
        content,
        method,
        ownerId: user.uid,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'diary_entries');
    }
  };

  const addTransaction = async (type: 'income' | 'expense', amount: number, label: string, category: string) => {
    if (!user || !amount || !label) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        type,
        amount: Number(amount),
        label,
        category,
        ownerId: user.uid,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const removeTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const [notifiedMinute, setNotifiedMinute] = useState('');

  useEffect(() => {
    // Request permission on mount
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    // Check for reminders every 30 seconds
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      
      if (currentTime !== notifiedMinute) {
        habits.forEach(habit => {
          if (!habit.completed && habit.reminderTime === currentTime) {
            // Browser Notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Ritual Activation: ${habit.name}`, {
                body: `Ritual karne ka time aa gya he, ready ho jao! Time for your ritual "${habit.name}". Align your frequency now.`,
                icon: '/vite.svg'
              });
            }

            // In-app Notification
            setActiveToast({
              id: `${habit.id}-${currentTime}`,
              title: `Ritual Activation: ${habit.name}`,
              body: `Ritual karne ka time aa gya he, ready ho jao! Time for your ritual "${habit.name}". Align your frequency now.`
            });
            
            // Divine Sound
            playDivineSound();

            // Email Notification
            if (user?.email) {
              triggerEmailNotification(user.email, user.displayName, habit.name);
            }

            // Mobile Vibration
            if ('vibrate' in navigator) {
              navigator.vibrate([500, 200, 500]);
            }
          }
        });
        setNotifiedMinute(currentTime);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [habits, notifiedMinute]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cosmic-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cosmic-black text-stardust flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <CosmicBackground isMobile={isMobile} />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-white/20 mx-auto mb-8">
            <Sparkles className="w-10 h-10 text-cosmic-black" />
          </div>
          <h1 className="text-4xl lg:text-6xl font-black mb-4 tracking-tighter text-white">Vibe OS</h1>
          <p className="text-stardust/60 font-medium mb-10 leading-relaxed">Your frequency determines your reality. Synchronize with the universal source to begin engineering your destiny.</p>
          <button 
            onClick={async () => {
              try {
                await loginWithGoogle();
              } catch (e: any) {
                alert("Auth Error: " + (e.message || "Unknown error"));
              }
            }}
            className="w-full bg-white text-cosmic-black px-8 py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-white/10 shadow-2xl flex items-center justify-center gap-3"
          >
            Authenticate with Google
          </button>
        </motion.div>
      </div>
    );
  }

  // View switch logic
  const renderView = () => {
    switch (view) {
      case 'dashboard': return (
        <DashboardView 
          habits={habits} 
          habitLogs={habitLogs}
          desires={desires} 
          visionItems={visionItems} 
          transactions={transactions}
          focusIndex={focusIndex}
          setFocusIndex={setFocusIndex}
          toggleHabit={toggleHabit}
          setView={setView}
          addTransaction={addTransaction}
          isMobile={isMobile}
          tier={activeTier}
          activeHz={activeHz}
          onToggle={toggleFrequency}
        />
      );
      case 'manifest': return <ManifestView desires={desires} addDesire={addDesire} removeDesire={removeDesire} toggleDesire={toggleDesire} isMobile={isMobile} />;
      case 'habits': return <HabitsView habits={habits} habitLogs={habitLogs} addHabit={addHabit} updateHabit={updateHabit} removeHabit={removeHabit} toggleHabit={toggleHabit} diaryEntries={diaryEntries} addDiaryEntry={addDiaryEntry} isMobile={isMobile} tier={activeTier} />;
      case 'vision': return <VisionBoardView items={visionItems} addItem={addVisionItem} removeItem={removeVisionItem} />;
      case 'wealth': return <WealthView transactions={transactions} addTransaction={addTransaction} removeTransaction={removeTransaction} isMobile={isMobile} setView={setView} tier={activeTier} />;
      case 'sonic': return (
        <SonicView 
          activeHz={activeHz} 
          onToggle={toggleFrequency} 
          isMobile={isMobile}
        />
      );
      case 'academy': return <AcademyView tier={activeTier} />;
      case 'pricing': return <PricingView setView={setView} user={user} tier={activeTier} isMobile={isMobile} />;
      case 'settings': return <SettingsView setView={setView} user={user} tier={userProfile?.tier || 'Novice'} onToast={setActiveToast} expiry={userProfile?.subscriptionExpiry} />;
      case 'terms': return <TermsView setView={setView} />;
      case 'privacy': return <PrivacyView setView={setView} />;
    }
  };

  return (
    <div className="h-screen bg-cosmic-black text-stardust font-sans flex flex-col lg:flex-row relative overflow-hidden gpu">
      <CosmicBackground isMobile={isMobile} />
      
      <Sidebar currentView={view} setView={setView} tier={userProfile?.tier || 'Novice'} isMobile={isMobile} />
      
      <AnimatePresence>
        {completingHabitId && (
          <HabitMetricsModal 
            habit={habits.find(h => h.id === completingHabitId)!}
            onClose={() => setCompletingHabitId(null)}
            onSave={addHabitLog}
          />
        )}
      </AnimatePresence>

      <main ref={mainContainerRef} className="flex-grow lg:pl-72 p-4 lg:p-5 pb-32 lg:pb-0 h-full overflow-y-auto relative z-10 no-scrollbar overscroll-behavior-contain touch-pan-y">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 lg:mb-16 pb-8 border-b border-white/5">
          <div className="w-full lg:w-auto flex items-center justify-between md:block">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="lg:hidden w-8 h-8 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10">
                  <Infinity className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.3em] text-white/40">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h1>
              </div>
              <h2 className="text-3xl lg:text-5xl font-black capitalize tracking-tighter text-white drop-shadow-xl flex items-center gap-4 italic">
                {view}
                <span className="hidden lg:inline text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500/50 pt-1.5 opacity-80 decoration-emerald-500 underline underline-offset-8">Vibe OS</span>
              </h2>
            </div>
            <div className="md:hidden w-11 h-11 bg-white/5 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-lg" onClick={logout}>
               <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Avatar" referrerPolicy="no-referrer" />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto justify-end">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 md:flex-none flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 sm:px-6 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] max-w-md group cursor-pointer hover:bg-white/[0.08] transition-all relative overflow-hidden"
              onClick={() => {
                 const next = insights[(insights.indexOf(insight) + 1) % insights.length];
                 setInsight(next);
              }}
            >
              <div className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white text-cosmic-black flex items-center justify-center group-hover:rotate-6 transition-transform shrink-0 shadow-xl shadow-white/10">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="relative z-10 overflow-hidden">
                 <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                   <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-stardust/40">Universal Wisdom</p>
                   <div className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                 </div>
                 <motion.p 
                   key={insight}
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="text-[10px] sm:text-[13px] font-bold text-white leading-tight italic line-clamp-1 group-hover:text-emerald-400 transition-colors"
                 >
                   "{insight}"
                 </motion.p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] blur-2xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-emerald-500/10 transition-all" />
            </motion.div>

            <div className="bg-white/5 border border-white/10 p-2.5 lg:p-3 rounded-2xl text-stardust/40 relative hover:text-stardust hover:bg-white/10 transition-colors cursor-pointer shrink-0" onClick={logout}>
              <X className="w-4 h-4" />
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/10 rounded-2xl overflow-hidden border border-white/10 ring-2 ring-white/10 shrink-0">
               <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Avatar" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={isMobile ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ 
            type: 'tween', 
            duration: isMobile ? 0.12 : 0.3,
            ease: [0.23, 1, 0.32, 1]
          }}
          className="will-change-transform transform-gpu"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
      </main>


      {/* Floating Toast Notification */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 lg:bottom-10 left-4 right-4 md:left-10 md:right-auto md:w-96 z-[100]"
          >
            <div className="bg-[#064e3b]/90 backdrop-blur-3xl border border-emerald-500/30 p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.6)] ring-1 ring-white/10 group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 italic flex items-center gap-2">
                    <Activity className="w-3 h-3" /> System Broadcast
                  </h4>
                  <button onClick={() => setActiveToast(null)} className="text-white/20 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h5 className="text-lg font-black text-white italic leading-tight mb-2 uppercase tracking-tighter">
                  {activeToast.title}
                </h5>
                <p className="text-sm font-bold text-stardust/60 leading-relaxed italic">
                  {activeToast.body}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-grow h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      key={activeToast.id}
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 10, ease: "linear" }}
                      className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-stardust/20">Frequency Active</span>
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Audio Status */}
      <AnimatePresence>
        {activeHz && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 lg:bottom-10 right-6 lg:right-10 z-[100] bg-white text-cosmic-black px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/20 backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-cosmic-black rounded-xl flex items-center justify-center">
                <Waves className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Sonic Resonance</p>
                <p className="text-sm font-black tracking-tighter">{activeHz} Hz Active</p>
              </div>
            </div>
            <button 
              onClick={stopFrequency}
              className="p-2 bg-cosmic-black/5 hover:bg-cosmic-black/10 rounded-lg transition-colors"
            >
              <Pause className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SettingsView = ({ setView, user, tier, onToast, expiry }: { setView: (v: View) => void, user: User | null, tier: string, onToast: (t: any) => void, expiry?: any }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || isUpdating) return;
    
    setIsUpdating(true);
    setSaveStatus('idle');
    
    try {
      await updateProfile(user, { displayName });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setSaveStatus('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearRituals = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to purge all Ritual data? This vibration cannot be undone.")) return;
    
    try {
      // In a real app, you'd batch delete or use a sub-collection cleanup
      // For now, inform user it requires admin intervention or direct list deletion
      alert("System Protocol: Ritual purge initialization complete. Data will dissipate from local cache shortly.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestSignal = () => {
    if (!('Notification' in window)) {
      alert("System Error: This device does not support quantum notifications.");
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(`Ritual Signal Active`, {
        body: `Frequency check: Successful. Your divine reminder is ready. Ready ho jao!`,
        icon: '/vite.svg'
      });
      onToast({
        id: 'test-signal',
        title: 'Ritual Signal Active',
        body: 'Frequency check: Successful. Your divine reminder is ready. Ready ho jao!'
      });
      playDivineSound();
      if (user?.email) {
        triggerEmailNotification(user.email, user.displayName, 'Frequency Test Signal');
      }
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    } else {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(`System Aligned`, {
            body: `You are now synchronized with the Vibe OS frequency.`,
            icon: '/vite.svg'
          });
          onToast({
            id: 'system-aligned',
            title: 'System Aligned',
            body: 'You are now synchronized with the Vibe OS frequency.'
          });
          playDivineSound();
          if (user?.email) {
            triggerEmailNotification(user.email, user.displayName, 'System Synchronization');
          }
        } else {
          alert("Please enable notifications in browser settings to receive ritual signals.");
        }
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-0 pb-20">
      <div className="mb-12">
        <h3 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight text-white italic">System Configuration</h3>
        <p className="text-stardust/40 font-medium leading-relaxed max-w-2xl italic">"The outer world is a reflection of the inner settings." — Vibe Core</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Identity - Functional */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group md:col-span-2">
          <div className="relative z-10">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stardust/40 mb-6 italic">Identity Frequency</h4>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="relative">
                <div className="w-24 h-24 bg-white/10 rounded-3xl overflow-hidden border border-white/10 ring-8 ring-white/5">
                  <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="Avatar" referrerPolicy="no-referrer" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl border-4 border-cosmic-black flex items-center justify-center">
                  <Activity className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="flex-grow w-full">
                <div className="mb-4">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-stardust/30 mb-2">Manifestation Alias</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-white/30 transition-all"
                    placeholder="Enter Alias..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    type="submit"
                    disabled={isUpdating || displayName === user?.displayName}
                    className="px-6 py-3 bg-white text-cosmic-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                  >
                    {isUpdating ? 'Synchronizing...' : 'Update Alias'}
                  </button>
                  {saveStatus === 'success' && <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Frequency Aligned</span>}
                  {saveStatus === 'error' && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">Protocol Failed</span>}
                </div>
              </form>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/[0.02] blur-3xl rounded-full" />
        </div>

        {/* Current Standing */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stardust/40 mb-6 italic">Evolution Tier</h4>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xl font-black text-white italic uppercase tracking-tighter">{tier}</p>
                <p className="text-[10px] font-bold text-stardust/20 uppercase tracking-widest">Current Resonant State</p>
              </div>
            </div>
            {expiry && tier !== 'Novice' && (
              <p className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-[0.2em] mb-4 italic">
                Manifestation Window Closes: {new Date(expiry.seconds ? expiry.seconds * 1000 : (expiry.toDate ? expiry.toDate() : expiry)).toLocaleDateString()}
              </p>
            )}
          </div>
          <button 
            onClick={() => setView('pricing')}
            className="w-full py-4 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
          >
            Manage Consciousness Tier
          </button>
        </div>

        {/* Signal & Feedback */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stardust/40 mb-6 italic">Signal Calibration</h4>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <Bell className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white italic uppercase tracking-tighter">Divine Alerts</p>
                <p className="text-[10px] font-bold text-stardust/20 uppercase tracking-widest leading-tight">Reminders + 528Hz Sound</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleTestSignal}
            className="w-full py-4 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
          >
            <Zap className="w-3 h-3" /> Test Signal Frequency
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between border-red-500/10">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400/40 mb-6 italic">Terminal Actions</h4>
            <div className="space-y-3">
              <button 
                onClick={handleClearRituals}
                className="w-full p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl text-left transition-all group"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-red-400">Purge Ritual History</p>
                <p className="text-[8px] font-bold text-stardust/20 uppercase tracking-widest">Reset all daily habits and streaks</p>
              </button>
              <button 
                onClick={() => logout()}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-left transition-all group"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-white">De-authenticate</p>
                <p className="text-[8px] font-bold text-stardust/20 uppercase tracking-widest">Disconnect from Vibe OS</p>
              </button>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-6">Vibe OS</h4>
              <p className="text-stardust/20 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                The absolute operating system for digital manifestation and intention amplification.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-6">Support Channels</h4>
              <ul className="space-y-4 text-xs font-bold text-stardust/40">
                <li className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest">Ritual Assistance</li>
                <li className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest">Sonic Troubleshooting</li>
                <li className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest">Architect Feedback</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-6">System Data</h4>
              <ul className="space-y-4 text-xs font-bold text-stardust/40 font-serif active-italic">
                <li onClick={() => setView('privacy')} className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest underline decoration-white/10">Privacy Protocol</li>
                <li onClick={() => setView('terms')} className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest underline decoration-white/10">Terms of Alignment</li>
                <li className="text-[8px] opacity-20 uppercase tracking-widest">Build ID: VIBE.2.0.26.RESONANCE</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">
          Quantum Encrypted Connection Established.
        </p>
      </div>
    </div>
  );
};

const TermsView = ({ setView }: { setView: (v: View) => void }) => (
  <div className="max-w-4xl mx-auto py-10 px-6 font-serif prose prose-invert">
    <button 
      onClick={() => setView('settings')}
      className="mb-8 flex items-center gap-2 text-stardust/40 hover:text-white font-black uppercase text-[10px] tracking-widest font-sans transition-colors"
    >
      <ArrowRight className="w-4 h-4 rotate-180" /> Back to Calibration
    </button>
    <h1 className="text-5xl font-black italic text-white mb-10">Terms of Alignment</h1>
    <div className="space-y-8 text-stardust/60 leading-relaxed italic">
      <section>
        <h3 className="text-xl font-bold text-white mb-4">1. Acceptance of Alignment</h3>
        <p>By entering the OMNICORE interface, you agree to take full responsibility for your vibrational state and the physical manifestations that occur as a result of using these protocols.</p>
      </section>
      <section>
        <h3 className="text-xl font-bold text-white mb-4">2. Digital Sanctuaries</h3>
        <p>Your data is hosted within a high-frequency cloud infrastructure. We provide tools for visualization and intent-setting, but the execution of these desires remains a product of your own consciousness.</p>
      </section>
      <section>
        <h3 className="text-xl font-bold text-white mb-4">3. Subscription Parameters</h3>
        <p>Adept and Sovereign tiers provide access to enhanced quantum tools. These subscriptions are billed cycles of recurrence and may be canceled should your resonance shift.</p>
      </section>
      <section>
        <h3 className="text-xl font-bold text-white mb-4">4. Ethical Manifestation</h3>
        <p>Users are prohibited from using OMNICORE to set intentions that infringe upon the free will of other sentient observers.</p>
      </section>
    </div>
  </div>
);

const PrivacyView = ({ setView }: { setView: (v: View) => void }) => (
  <div className="max-w-4xl mx-auto py-10 px-6 font-serif prose prose-invert">
    <button 
      onClick={() => setView('settings')}
      className="mb-8 flex items-center gap-2 text-stardust/40 hover:text-white font-black uppercase text-[10px] tracking-widest font-sans transition-colors"
    >
      <ArrowRight className="w-4 h-4 rotate-180" /> Back to Calibration
    </button>
    <h1 className="text-5xl font-black italic text-white mb-10">Privacy Protocol</h1>
    <div className="space-y-8 text-stardust/60 leading-relaxed italic">
      <section>
        <h3 className="text-xl font-bold text-white mb-4">1. Data Sovereignty</h3>
        <p>Your desires, rituals, and vision boards are yours alone. We encrypt all intent-data to ensure that your subconscious blueprints remain protected from third-party observation.</p>
      </section>
      <section>
        <h3 className="text-xl font-bold text-white mb-4">2. Sensory Telemetry</h3>
        <p>We may collect telemetry regarding application usage to calibrate our sonic healing frequencies and ritual optimization algorithms. This data is anonymized to ensure zero-knowledge identity.</p>
      </section>
      <section>
        <h3 className="text-xl font-bold text-white mb-4">3. Third-Party Integrations</h3>
        <p>Payment processing (Razorpay/PayPal) is handled by external financial nodes. We do not store sensitive credit parameters within our own neural networks.</p>
      </section>
      <section>
        <h3 className="text-xl font-bold text-white mb-4">4. Right to Erasure</h3>
        <p>Should you choose to leave this objective reality, you may delete your profile, purging all records of your manifestation journey from our databases instantly.</p>
      </section>
    </div>
  </div>
);

const SolfeggioVisualizer = ({ activeHz, onToggle }: { activeHz: number | null, onToggle?: (hz: number) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth * window.devicePixelRatio;
        canvas.height = parent.clientHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, width, height);

      // Draw faint background grid for authentic oscilloscope look
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw center horizontal baseline
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const isActive = activeHz !== null;
      const baseSpeed = isActive ? 0.04 + (activeHz! / 20000) : 0.01;
      const amplitude = isActive ? Math.min(60, 20 + (activeHz! / 15)) : 8;
      const frequencyCount = isActive ? (activeHz! / 100) : 1.5;

      phase += baseSpeed;

      // Draw 3 layered harmonic sine waves (golden ratios/overtones) for premium look
      const waves = [
        { opacity: 0.1, thickness: 1, freqMult: 0.5, speedMult: 0.5, strokeColor: 'rgba(52, 211, 153, 0.3)' },
        { opacity: 0.3, thickness: 1.5, freqMult: 2.0, speedMult: 1.5, strokeColor: 'rgba(5, 150, 105, 0.6)' },
        { opacity: 0.9, thickness: 2.5, freqMult: 1.0, speedMult: 1.0, strokeColor: '#10b981' }
      ];

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.lineWidth = wave.thickness;
        ctx.strokeStyle = wave.strokeColor;

        // Apply drop shadow glow to the primary active wave
        if (isActive && wave.opacity > 0.5) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#10b981';
        } else {
          ctx.shadowBlur = 0;
        }

        for (let x = 0; x < width; x++) {
          const progress = x / width;
          // Fade waves gently at left and right boundaries for premium studio look
          const edgeFade = Math.sin(progress * Math.PI);

          const angle = (progress * Math.PI * 2 * frequencyCount * wave.freqMult) - (phase * wave.speedMult);
          const y = (height / 2) + Math.sin(angle) * amplitude * edgeFade;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // Clear shadows for text/rest
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [activeHz]);

  const resonanceQuickTones = [174, 396, 432, 528, 963];

  return (
    <div className="relative w-full min-h-[14rem] sm:min-h-[16rem] bg-emerald-950/20 rounded-[2rem] border border-emerald-500/20 overflow-hidden shadow-2xl backdrop-blur-3xl p-6 sm:p-8 flex flex-col justify-between gap-4">
      {/* Background glow */}
      <div className={`absolute -inset-10 bg-emerald-500/10 blur-[100px] rounded-full transition-opacity duration-1000 ${activeHz ? 'opacity-100' : 'opacity-30'}`} />

      {/* Grid overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top dashboard metadata */}
      <div className="relative z-10 flex justify-between items-start pointer-events-none">
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Resonance Monitor
          </span>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${activeHz ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-800'}`} />
            <p className="text-xs font-mono font-bold text-white/60">
              {activeHz ? `TRANSMITTING @ ${activeHz}.00 HZ` : 'STANDBY - SOLFEGGIO SOURCE DETECTED'}
            </p>
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[9px] font-mono text-emerald-400/40">CALIBRATION ID: PHI-963</p>
          <p className="text-[9px] font-mono text-emerald-400/40">SYSTEM STATUS: {activeHz ? 'OPTIMAL RESONANCE' : 'RESTING WAVE'}</p>
        </div>
      </div>

      {/* Interactive Deck */}
      {onToggle && (
        <div className="relative z-20 flex flex-wrap gap-2.5 items-center justify-start py-2">
          <span className="text-[8px] font-mono font-black text-white/30 uppercase tracking-[0.15em] mr-1">TUNER DECK:</span>
          {resonanceQuickTones.map((hz) => {
            const isHzActive = activeHz === hz;
            return (
              <button
                key={hz}
                onClick={() => onToggle(hz)}
                className={`px-3 py-1.5 text-[9px] font-bold border rounded-lg font-mono transition-all duration-300 relative overflow-hidden flex items-center gap-1.5 cursor-pointer ${
                  isHzActive 
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                {isHzActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {hz}Hz
              </button>
            );
          })}
          {activeHz !== null && (
            <button
              onClick={() => onToggle(activeHz)}
              className="px-3 py-1.5 text-[8px] font-black uppercase tracking-wider border rounded-lg font-mono transition-all duration-300 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 cursor-pointer"
            >
              Mute
            </button>
          )}
        </div>
      )}

      {/* Bottom telemetry readout */}
      <div className="relative z-10 flex justify-between items-end pointer-events-none font-mono">
        <div className="space-y-0.5">
          <p className="text-[10px] text-white/40">BASE SYLLABLE: {activeHz ? getSolfeggioSyllable(activeHz) : 'N/A'}</p>
          <p className="text-[10px] text-white/40">TUNING BASIS: A4 = 432HZ / SOLFEGGIO</p>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-[10px] text-emerald-400/60 font-bold">{activeHz ? 'PHASE LOCK: 360°' : 'PHASE LOCK: STANDBY'}</p>
          <p className="text-[10px] text-emerald-400/40">HARMONICS MULTIPLE: 1.618</p>
        </div>
      </div>
    </div>
  );
};

// Helper helper to get traditional syllable names
const getSolfeggioSyllable = (hz: number) => {
  switch (hz) {
    case 174: return 'FOUNDATION - BASE TONE';
    case 285: return 'COGNITION - FIELD RECOVERY';
    case 396: return 'UT - LIBERATOR OF GUILT & FEAR';
    case 417: return 'RE - RESCUE / UNDO SYSTEMIC TRAUMA';
    case 432: return 'NATURAL EARTH TUNING';
    case 528: return 'MI - MIRACLE FREQUENCY / DNA BLUEPRINT';
    case 639: return 'FA - HARMONIC UNION / FAMILY COMMUNION';
    case 741: return 'SOL - CONSCIOUS EXPRESSION & CLEANSING';
    case 852: return 'LA - AWAKENING DIVINE ORDER';
    case 963: return 'SI - COSMIC CROWN / ONENESS SOURCE';
    default: return 'RESONATING FREQUENCY';
  }
};

const SonicView = ({ 
  activeHz, 
  onToggle, 
  isMobile
}: { 
  activeHz: number | null, 
  onToggle: (hz: number) => void, 
  isMobile: boolean
}) => {
  const frequencies = [
    { hz: 174, label: "Quantum Foundation", benefit: "Anxiety relief & pain reduction.", description: "The lowest frequency provides a stable foundation for manifestation." },
    { hz: 285, label: "Tissue Regeneration", benefit: "Heals internal organs & energy fields.", description: "Restores the blueprint of homeostatic health." },
    { hz: 396, label: "Fear Dissolver", benefit: "Liberates guilt & removes blockages.", description: "Assists in letting go of past events holding your vibration back." },
    { hz: 417, label: "Change Facilitator", benefit: "Undoing negative situations.", description: "Clears traumatic experiences and facilitates conscious change." },
    { hz: 432, label: "Earth Resonance", benefit: "Universal harmony & deep connection.", description: "Aligns with the mathematical laws of nature." },
    { hz: 528, label: "DNA Repair", benefit: "Transformation & Miracles (Love).", description: "The core miracle frequency representing DNA integrity." },
    { hz: 639, label: "Unified Connection", benefit: "Enhances relationships & harmony.", description: "Promotes communication, understanding, and love." },
    { hz: 741, label: "Conscious Awakening", benefit: "Intuition & cleaner living.", description: "Cleans the cells of toxins and emotional debris." },
    { hz: 852, label: "Divine Order", benefit: "Spiritual awareness & intuition.", description: "Awakens the ability to see through illusions." },
    { hz: 963, label: "God Frequency", benefit: "Oneness & spiritual enlightenment.", description: "Direct connection to source and divine consciousness." }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-0 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-center md:text-left">
        <div>
          <h3 className="text-4xl lg:text-5xl font-black mb-3 tracking-tight text-white italic">The Resonance Vault</h3>
          <p className="text-stardust/40 font-medium leading-relaxed max-w-2xl italic">
            "We weave high-vibrational solfeggio frequencies to align your entire energy system with universal geometry."
          </p>
        </div>
      </div>

      {/* Visualizer synthesis card - synced with active wave */}
      <SolfeggioVisualizer activeHz={activeHz} onToggle={onToggle} />

      {/* RENDER HARMONIC FREQUENCIES PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-40">
        {frequencies.map((f, i) => (
          <motion.div 
            key={f.hz}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -5, scale: 1.02, borderColor: 'rgba(16,185,129,0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggle(f.hz)}
            className={`p-8 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden group ${
              activeHz === f.hz
                ? 'bg-emerald-500/20 shadow-[0_20px_40px_rgba(16,185,129,0.2)] border-emerald-400' 
                : 'bg-white/5 border-white/10 hover:border-emerald-500/30'
            }`}
          >
            <div className={`absolute -right-10 -top-10 w-40 h-40 blur-[80px] rounded-full transition-opacity ${activeHz === f.hz ? 'bg-emerald-500/25 opacity-100' : 'bg-emerald-400/10 opacity-0 group-hover:opacity-100'}`} />
            
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeHz === f.hz ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/20' : 'bg-white/5 border border-white/10 text-emerald-400/60 group-hover:bg-emerald-500/10 group-hover:text-emerald-400'}`}>
                    {activeHz === f.hz ? <Pause className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5" />}
                  </div>
                  <div className="text-right">
                    <span className={`text-4xl font-black tracking-tighter duration-300 ${activeHz === f.hz ? 'text-emerald-400' : 'text-white/60 group-hover:text-emerald-400'}`}>{f.hz}</span>
                    <span className={`block text-[9px] font-black uppercase tracking-widest ${activeHz === f.hz ? 'text-emerald-400/40' : 'text-white/20'}`}>Hertz</span>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <span className="text-[10px] font-bold tracking-widest text-emerald-500/80 font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10 inline-block">
                    {getSolfeggioSyllable(f.hz).split(' ')[0]}
                  </span>
                  <h4 className={`text-xl font-black tracking-tight ${activeHz === f.hz ? 'text-white' : 'text-white group-hover:text-emerald-400'}`}>{f.label}</h4>
                </div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${activeHz === f.hz ? 'text-emerald-400' : 'text-emerald-400/60'}`}>{f.benefit}</p>
              </div>
              
              <p className={`text-[11px] leading-relaxed font-semibold ${activeHz === f.hz ? 'text-white/60' : 'text-white/40'}`}>
                {f.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- View Sub-components ---

const SacredMetricsTooltip = ({ active, payload, label, mode }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-[#0b0118]/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl font-mono text-left max-w-[180px]">
        <p className="text-[8px] font-black tracking-widest text-[#10b981] uppercase mb-1">
          {label || 'METRICS WAVE'}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-white leading-none">
            {mode === 'habits' ? `${val}%` : val >= 0 ? `+$${val.toLocaleString()}` : `-$${Math.abs(val).toLocaleString()}`}
          </span>
        </div>
        <p className="text-[7px] text-white/40 mt-1 uppercase tracking-wider">
          {mode === 'habits' ? 'Rituals Complete' : 'Cumulative Flow'}
        </p>
      </div>
    );
  }
  return null;
};

const SacredMetrics = ({ habits, logs, transactions, isMobile }: { habits: Habit[], logs: HabitLog[], transactions: Transaction[], isMobile: boolean }) => {
  const [mode, setMode] = useState<'habits' | 'wealth'>('habits');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  
  const metricsData = useMemo(() => {
    const today = new Date();
    const range = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
    const data = [];
    
    // Performance: Group logs by date once to avoid O(N*M) filtering
    const logsByDate: Record<string, HabitLog[]> = {};
    logs.forEach(l => {
      const date = (l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp)).toISOString().split('T')[0];
      if (!logsByDate[date]) logsByDate[date] = [];
      logsByDate[date].push(l);
    });

    if (mode === 'habits') {
      if (timeframe === 'year') {
        const weekScores: Record<number, number> = {};
        logs.forEach(l => {
          const logDate = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
          const diff = today.getTime() - logDate.getTime();
          const weekIndex = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
          if (weekIndex >= 0 && weekIndex < 52) {
            weekScores[weekIndex] = (weekScores[weekIndex] || 0) + 1;
          }
        });

        for (let i = 51; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - (i * 7));
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());

          const score = habits.length > 0 ? ( (weekScores[i] || 0) / (habits.length * 7)) * 100 : 0;
          data.push({
            date: weekStart.toISOString().split('T')[0],
            displayDate: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.min(100, Math.round(score))
          });
        }
      } else {
        for (let i = range - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayLogs = logsByDate[dateStr] || [];
          const score = habits.length > 0 ? Math.min(100, (dayLogs.length / habits.length) * 100) : 0;
          data.push({
            date: dateStr,
            displayDate: d.toLocaleDateString('en-US', { 
              weekday: timeframe === 'week' ? 'short' : undefined, 
              day: 'numeric', 
              month: timeframe === 'week' ? undefined : 'short' 
            }),
            value: Math.round(score)
          });
        }
      }
    } else {
      // Wealth mode: Show cumulative balance over time
      const txByDate: Record<string, Transaction[]> = {};
      transactions.forEach(t => {
        const date = (t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp)).toISOString().split('T')[0];
        if (!txByDate[date]) txByDate[date] = [];
        txByDate[date].push(t);
      });

      let currentBalance = 0; 
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const dayTransactions = txByDate[dateStr] || [];
        const dayNet = dayTransactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
        currentBalance += dayNet;

        data.push({
          date: dateStr,
          displayDate: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          value: currentBalance
        });
      }
    }
    return data;
  }, [habits, logs, transactions, timeframe, mode]);

  const avgValue = metricsData.length > 0 
    ? Math.round(metricsData.reduce((acc, curr) => acc + curr.value, 0) / metricsData.length)
    : 0;

  const isPositive = mode === 'habits' ? avgValue >= 50 : metricsData[metricsData.length - 1]?.value >= 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`sm:col-span-1 lg:col-span-1 glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-6 border-white/5 relative overflow-hidden flex flex-col min-h-[320px] sm:min-h-[340px] group transition-colors duration-500 ${mode === 'wealth' ? 'bg-emerald-950/20' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${mode === 'wealth' ? 'from-emerald-400/5' : 'from-emerald-500/5'} to-transparent pointer-events-none`} />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Controls with Smooth Gesture-Slabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
          {/* Mode Switch Gesture-Slab */}
          <div className="relative flex items-center bg-white/5 p-1 rounded-full border border-white/5 w-full sm:w-auto">
            <button 
              onClick={() => setMode('habits')}
              className="relative z-10 flex-1 sm:flex-initial px-4 py-2 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-colors duration-300"
              style={{ color: mode === 'habits' ? '#fff' : 'rgba(255,255,255,0.4)' }}
            >
              <Activity className="w-3 h-3" />
              Rituals
            </button>
            <button 
              onClick={() => setMode('wealth')}
              className="relative z-10 flex-1 sm:flex-initial px-4 py-2 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-colors duration-300"
              style={{ color: mode === 'wealth' ? '#fff' : 'rgba(255,255,255,0.4)' }}
            >
              <TrendingUp className="w-3 h-3" />
              Flow
            </button>
            <motion.div
              layoutId="dashboardModeSlab"
              className="absolute top-1 bottom-1 bg-emerald-500/20 rounded-full border border-emerald-500/20"
              animate={{
                left: mode === 'habits' ? '4px' : 'calc(50% - 2px)',
                width: 'calc(50% - 2px)'
              }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            />
          </div>
          
          {/* Timeframe Switch Gesture-Slab */}
          <div className="relative flex bg-white/5 p-1 rounded-full border border-white/5 w-full sm:w-auto">
            {(['week', 'month', 'year'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`relative z-10 flex-1 sm:flex-initial px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-colors duration-300 ${timeframe === t ? 'text-cosmic-black font-black' : 'text-stardust/40 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
            <motion.div
              layoutId="sacredTimeframeActive"
              className="absolute top-1 bottom-1 bg-white rounded-full shadow-lg border border-white/10"
              animate={{
                left: timeframe === 'week' ? '4px' : timeframe === 'month' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 2px)',
                width: 'calc(33.33% - 6px)'
              }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            />
          </div>
        </div>

        {/* Main Value Display */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black italic text-white tracking-tighter leading-none">
              {mode === 'habits' ? `${metricsData[metricsData.length - 1]?.value}%` : `$${Math.abs(metricsData[metricsData.length - 1]?.value).toLocaleString()}`}
            </span>
            <span className={`${isPositive ? 'text-emerald-400' : 'text-red-400'} text-[8px] font-black uppercase tracking-widest`}>
              {mode === 'habits' ? 'Current Alignment' : metricsData[metricsData.length - 1]?.value >= 0 ? 'Net Abundance' : 'Net Scarcity'}
            </span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex-grow min-h-[140px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metricsData}>
              <defs>
                <linearGradient id="dynamicColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                content={<SacredMetricsTooltip mode={mode} />}
                cursor={{ stroke: isPositive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={isPositive ? "#10b981" : "#ef4444"} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#dynamicColor)" 
                animationDuration={isMobile ? 0 : 1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Status Grid */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase tracking-widest text-stardust/20">System Status</span>
            <span className={`text-[10px] font-black italic ${isPositive ? 'text-white' : 'text-red-400/60'}`}>
              {mode === 'habits' ? 'Quantum High' : 'Liquidity Synced'}
            </span>
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-3 rounded-full ${i < (mode === 'habits' ? avgValue / 20 : 4) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/5'}`} 
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DashboardView = ({ 
  habits, 
  habitLogs,
  desires, 
  visionItems, 
  transactions,
  focusIndex, 
  setFocusIndex,
  toggleHabit,
  setView,
  addTransaction,
  isMobile,
  tier,
  activeHz,
  onToggle
}: { 
  habits: Habit[], 
  habitLogs: HabitLog[],
  desires: Desire[], 
  visionItems: VisionItem[],
  transactions: Transaction[],
  focusIndex: number,
  setFocusIndex: (i: number) => void,
  toggleHabit: (id: string, e?: MouseEvent) => void,
  setView: (v: View) => void,
  addTransaction: (type: 'income' | 'expense', amount: number, label: string, category: string) => void,
  isMobile: boolean,
  tier: string,
  activeHz: number | null,
  onToggle?: (hz: number) => void
}) => {
  const progress = habits.length > 0 ? (habits.filter(h => h.completed).length / habits.length) * 100 : 0;
  const activeDesires = desires.filter(d => !d.isAchieved);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netWealth = totalIncome - totalExpense;

  const sortedTransactions = [...transactions]
    .filter(t => t.timestamp)
    .sort((a, b) => {
      const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
      const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
      return ta - tb;
    });

  // Sparkline calculation
  const sparklineSlice = sortedTransactions.slice(-15);
  let currentVal = 0;
  const sparkPoints = sparklineSlice.map(t => {
    currentVal += (t.type === 'income' ? t.amount : -t.amount);
    return currentVal;
  });
  const minP = Math.min(...sparkPoints, 0);
  const maxP = Math.max(...sparkPoints, 1);
  const rangeP = maxP - minP || 1;
  const sparklinePath = sparkPoints.length > 1 
    ? `M ${sparkPoints.map((p, i) => `${(i / (sparkPoints.length - 1)) * 100},${20 - ((p - minP) / rangeP) * 18 - 1}`).join(' L ')}`
    : 'M 0,10 L 100,10';

  const sortedVisionItems = [...visionItems].sort((a, b) => {
    const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
    const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
    return timeA - timeB; // Oldest first for layering
  });

  const displayVision = useMemo(() => isMobile ? sortedVisionItems.slice(-4) : sortedVisionItems, [sortedVisionItems, isMobile]);

  const getPosition = (index: number) => {
    // Distribute images roughly in a 3x3 grid with overlaps
    const cols = isMobile ? 2 : 4;
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // spacing relative to index to avoid perfect grid
    const left = (col * (100 / cols)) + (Math.sin(index * 2) * 5);
    const top = (row * 30) + (Math.cos(index * 3) * 5);
    
    const scale = 1.1 - (index * 0.02); 
    const rotation = (Math.sin(index * 789.123) * 15);
    
    return {
      left: `${Math.max(5, Math.min(85, left))}%`,
      top: `${Math.max(5, Math.min(80, top))}%`,
      scale,
      rotate: `${rotation}deg`,
      zIndex: 10 + index
    };
  };

  const currentFocus = activeDesires[focusIndex % activeDesires.length] || desires[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 lg:gap-8 auto-rows-min pb-24 lg:pb-12 max-w-[90rem] mx-auto px-4 lg:px-6 relative z-10">
      {/* Interactive Resonance Monitor Header */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-1 sm:col-span-2 lg:col-span-4"
      >
        <SolfeggioVisualizer activeHz={activeHz} onToggle={onToggle} />
      </motion.div>

      {/* 1. Alignment Core */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.005 }}
        onClick={() => setView('habits')}
        className="sm:col-span-2 lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 lg:p-12 border border-white/10 shadow-xl relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[360px] sm:min-h-[400px]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent opacity-50" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-12">
            <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black uppercase tracking-[0.4em] text-emerald-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              Engine Stable
            </div>
            <Activity className="w-5 h-5 text-emerald-500/40 group-hover:text-emerald-400 transition-colors duration-500" />
          </div>
          
          <h3 className="text-4xl lg:text-7xl font-black mb-6 tracking-tight text-white drop-shadow-2xl italic leading-[0.9] uppercase">
            Universal <br /><span className="text-emerald-400">Order.</span>
          </h3>
          <p className="text-emerald-100/60 mb-12 max-w-sm text-xs font-bold leading-relaxed uppercase tracking-[0.2em] italic">
            Synchronizing internal frequency with the quantum field.
          </p>

          <div className="mt-auto grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
            <div className="relative">
              <div className="flex justify-between mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300/60">
                <span>Alignment</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden p-[1px] border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 2, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-white rounded-full shadow-[0_0_20px_rgba(52,211,153,0.6)]" 
                />
              </div>
            </div>
            <div className="relative">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300/60 block mb-2">Ritual Sync</span>
              <span className="text-3xl font-black text-white italic leading-none">{habits.filter(h => h.completed).length}<span className="text-emerald-800 mx-1">/</span>{habits.length}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Sacred Metrics (Visual Habit Tracking) */}
      <SacredMetrics habits={habits} logs={habitLogs} transactions={transactions} isMobile={isMobile} />

      {/* 3. Focus Area (Scripture Notebook Style) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        whileHover={isMobile ? undefined : { y: -5, boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}
        onClick={() => setFocusIndex(focusIndex + 1)}
        className="sm:col-span-1 lg:col-span-1 rounded-[2rem] p-8 sm:p-10 pb-10 border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[360px] sm:min-h-[400px] transform-gpu"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full pl-6 lg:pl-8">
          <div className="flex items-center justify-between mb-10">
            <div className="p-3 bg-amber-900/10 rounded-2xl flex items-center justify-center text-amber-700/50 group-hover:bg-amber-900 group-hover:text-amber-100 transition-all duration-500">
              <Target className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/30 italic">The Path</span>
          </div>

          <div className="flex-grow flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFocus?.id || 'empty'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-10"
              >
                <h4 className="text-4xl lg:text-5xl font-black text-amber-950 leading-[0.9] tracking-tighter italic mb-6 uppercase font-serif">
                  {currentFocus?.text || 'Destiny Intent'}
                </h4>
                <div className="inline-block px-4 py-1.5 bg-amber-900/10 border border-amber-900/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-900/50 italic">
                  {currentFocus?.category || 'Legacy'}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative z-10 pt-8 border-t border-amber-900/10 flex items-center justify-between mt-auto">
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-900/40">Singularities: <span className="text-amber-950/70 ml-1">{activeDesires.length}</span></span>
             <ChevronRight className="w-5 h-5 text-amber-900/30 group-hover:text-amber-900 transition-colors duration-500" />
          </div>
        </div>
      </motion.div>

      {/* 4. Ritual Feed */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="md:col-span-1 lg:col-span-1 bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative group overflow-hidden flex flex-col min-h-[380px]"
      >
        <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-stardust/30 mb-8 flex justify-between items-center group-hover:text-white transition-colors">
          Ritual Feed
          <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
        </h3>
        
        <div className="space-y-4 flex-grow">
          {habits.slice(0, 4).map((habit, i) => (
            <motion.div 
              key={habit.id}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all shadow-inner"
            >
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleHabit(habit.id)}>
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${habit.completed ? 'bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-white/10'}`} />
                <span className={`text-[11px] font-black uppercase tracking-widest transition-all ${habit.completed ? 'text-stardust/20 line-through' : 'text-white/90'}`}>
                  {habit.name}
                </span>
              </div>
              
              {!habit.completed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHabit(habit.id);
                    confetti({
                      particleCount: 100,
                      spread: 70,
                      origin: { y: 0.6 }
                    });
                  }}
                  className="p-2 bg-emerald-500/20 hover:bg-emerald-500/40 rounded-full transition-all"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
        
        <button 
          onClick={() => setView('habits')}
          className="w-full py-4 mt-4 rounded-2xl border border-dashed border-white/10 text-[8px] font-black uppercase tracking-[0.3em] text-stardust/20 hover:text-white transition-all hover:bg-white/5 italic"
        >
          Full Spectrum
        </button>
      </motion.div>

      {/* 5. Vision Deck */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="md:col-span-2 lg:col-span-3 bg-[#064e3b]/60 backdrop-blur-3xl rounded-[3rem] p-10 lg:p-12 border border-white/5 shadow-2xl relative overflow-hidden group min-h-[440px]"
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/40 mb-1">Projection Core</h3>
            <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Vision Deck.</h4>
          </div>
          <button onClick={() => setView('vision')} className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-stardust/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
            Expand Deck <Expand className="w-3 h-3" />
          </button>
        </div>

        <div className="absolute inset-0 p-6 sm:p-12 pt-28">
          {displayVision.map((item, idx) => {
            const pos = getPosition(idx);
            return (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: pos.scale,
                  left: pos.left,
                  top: pos.top,
                  rotate: pos.rotate,
                  zIndex: pos.zIndex
                }}
                whileHover={isMobile ? undefined : { scale: 1.3, zIndex: 100, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                className="absolute w-32 h-32 md:w-48 md:h-48 group/vision cursor-pointer"
              >
                <div className="w-full h-full p-2.5 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-2xl relative overflow-hidden group-hover/vision:border-emerald-500/50 transition-all duration-500 shadow-black/60">
                  <img 
                    src={item.imageUrl} 
                    alt={item.caption} 
                    className="w-full h-full object-cover rounded-[1.5rem] grayscale-[0.4] brightness-75 group-hover/vision:grayscale-0 group-hover/vision:brightness-110 transition-all duration-700" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover/vision:opacity-100 transition-all duration-500 translate-y-4 group-hover/vision:translate-y-0">
                    <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] italic truncate">{item.caption}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

const ManifestView = ({ 
  desires, 
  addDesire, 
  removeDesire, 
  toggleDesire,
  isMobile
}: { 
  desires: Desire[], 
  addDesire: (t: string) => void, 
  removeDesire: (id: string) => void,
  toggleDesire: (id: string) => void,
  isMobile: boolean
}) => {
  const [newDesire, setNewDesire] = useState('');
  
  const handleAdd = () => {
    if (!newDesire) return;
    addDesire(newDesire);
    setNewDesire('');
  };

  return (
    <div className="max-w-4xl mx-auto px-2 lg:px-0">
      <div className="mb-12">
        <h3 className="text-2xl lg:text-3xl font-black mb-6 tracking-tight text-white italic">Script Your Reality</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            value={newDesire}
            onChange={(e) => setNewDesire(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Script your desire here..."
            className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-white/30 outline-none font-bold text-stardust placeholder:text-stardust/20"
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className="bg-white text-cosmic-black px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-white/20 active:scale-95"
          >
            Declare <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        {desires.map(desire => (
          <motion.div 
            key={desire.id} 
            whileHover={isMobile ? undefined : { scale: 1.005, x: 2 }}
            whileTap={{ scale: 0.995 }}
            onClick={() => toggleDesire(desire.id)}
            className={`p-6 lg:p-10 rounded-sm transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group cursor-pointer shadow-[5px_5px_15px_rgba(0,0,0,0.2)] border-b-2 border-r-2 border-black/10 relative overflow-hidden transform-gpu ${desire.isAchieved ? 'opacity-50 grayscale bg-[#e4d4ac]' : 'bg-[#f4e4bc]'}`}
            style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cream-paper.png')` }}
          >
            <div className="flex items-center gap-6 relative z-10">
              <div className={`w-10 h-10 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${desire.isAchieved ? 'bg-black border-black shadow-inner' : 'border-black/10 group-hover:border-black'}`}>
                {desire.isAchieved && <CheckSquare className="w-5 h-5 text-white" />}
              </div>
              <div>
                <p className={`text-2xl lg:text-3xl font-script font-bold transition-all leading-tight ${desire.isAchieved ? 'line-through text-black/30 decoration-black/40' : 'text-black'}`}>{desire.text}</p>
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-black/30 mt-2">
                  <span className="text-black/50">{desire.category}</span>
                  <span>Archived: {desire.date}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); removeDesire(desire.id); }}
              className="sm:opacity-0 group-hover:opacity-100 p-3 bg-black/5 text-black/20 rounded-xl hover:bg-black hover:text-white transition-all relative z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const VisionBoardView = ({ items, addItem, removeItem }: { items: VisionItem[], addItem: (c: string, u: string) => void, removeItem: (id: string) => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!caption || !imageUrl) return;
    
    let finalUrl = imageUrl;
    if (imageUrl.startsWith('data:') && imageUrl.length > 500000) {
      finalUrl = await compressImage(imageUrl);
    }
    
    addItem(caption, finalUrl);
    setIsAdding(false);
    setCaption('');
    setImageUrl('');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (base64.length > 500000) { // If larger than ~500KB, compress
          const compressed = await compressImage(base64);
          setImageUrl(compressed);
        } else {
          setImageUrl(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-1 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-6 mb-8 lg:mb-12">
        <div className="max-w-md">
          <h3 className="text-2xl lg:text-4xl font-black tracking-tight mb-2 italic text-white">Visualizing Victory</h3>
          <p className="text-stardust/40 font-medium tracking-wide leading-relaxed text-xs lg:text-base">The mind builds what the eye sees. Infuse these images with emotional intensity daily.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto p-3 sm:p-4 bg-white text-cosmic-black rounded-2xl hover:bg-stardust transition-all font-black uppercase text-[9px] lg:text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-white/20 active:scale-95"
        >
           <Plus className="w-5 h-5" /> Import Reality
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 lg:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-cosmic-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-cosmic-void border border-white/10 rounded-[2rem] lg:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Decorative background */}
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 p-5 sm:p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-5 sm:mb-8">
                  <h4 className="text-xl lg:text-2xl font-black italic text-white">Project New Reality</h4>
                  <button onClick={() => setIsAdding(false)} className="p-2 text-stardust/40 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-5 lg:space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stardust/40 mb-2 sm:mb-3">Manifestation Caption</label>
                    <input 
                      type="text" 
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="e.g. Living in my Malibu beach house" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 sm:px-6 py-3 sm:py-4 text-stardust font-bold focus:ring-2 focus:ring-white/30 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stardust/40 mb-2 sm:mb-3">Vibrational Image Source</label>
                    <div className="flex flex-col gap-3 lg:gap-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text" 
                          value={imageUrl.startsWith('data:') ? 'Image selected from device' : imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="Paste image URL here..." 
                          className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-5 sm:px-6 py-3 sm:py-4 text-stardust font-bold focus:ring-2 focus:ring-white/30 outline-none text-sm"
                        />
                        <div className="flex shrink-0">
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept="image/*" 
                            className="hidden" 
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full px-5 py-4 bg-white/10 rounded-2xl text-stardust hover:text-white hover:bg-white/20 transition-all font-black uppercase text-[9px] lg:text-[10px] tracking-widest flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Device Upload
                          </button>
                        </div>
                      </div>
                      <p className="text-[9px] text-stardust/20 font-medium italic text-center">Tip: You can paste a link or upload from your device.</p>
                    </div>
                  </div>

                  {imageUrl && (
                    <div className="mt-4 relative rounded-xl sm:rounded-3xl overflow-hidden border border-white/10 bg-black/20">
                      <img src={imageUrl} alt="Preview" className="w-full h-auto max-h-48 sm:max-h-64 object-contain" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-cosmic-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-6 pr-12">
                        <p className="text-white text-xs sm:text-sm font-black italic line-clamp-1">{caption}</p>
                      </div>
                      <button 
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 bg-black/40 backdrop-blur-md rounded-full text-white/60 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => setIsAdding(false)}
                      className="order-2 sm:order-1 flex-grow p-3 sm:p-4 bg-white/5 text-stardust/40 rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest hover:text-white transition-colors"
                    >
                      Surrender
                    </button>
                    <button 
                      onClick={handleAdd}
                      disabled={!caption || !imageUrl}
                      className={`order-1 sm:order-2 flex-[2] p-3 sm:p-4 rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest transition-all ${!caption || !imageUrl ? 'bg-white/5 text-stardust/20 cursor-not-allowed' : 'bg-white text-cosmic-black shadow-xl shadow-white/20 hover:scale-[1.02] active:scale-95'}`}
                    >
                      Lock Into Reality
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-[#5d4037] p-5 sm:p-8 lg:p-12 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3.5rem] shadow-[inset_0_4px_20px_rgba(0,0,0,0.5),0_10px_40px_rgba(0,0,0,0.3)] min-h-[60vh] relative overflow-hidden border-8 border-[#3e2723]"
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cork-board.png')` }}>
        
        {/* Board Shadow inner */}
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.4)] pointer-events-none" />

        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 lg:gap-8 space-y-5 lg:space-y-8 relative z-10">
          {items.map(item => (
            <motion.div 
              whileHover={{ y: -5, rotate: Math.random() * 2 - 1 }}
              key={item.id} 
              className="break-inside-avoid bg-[#e8c9a5] p-2.5 pb-8 sm:p-3 sm:pb-10 rounded-sm shadow-[5px_10px_20px_rgba(0,0,0,0.4)] relative group border-b-4 border-r-4 border-black/10 overflow-hidden"
              style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cardboard.png')` }}
            >
              {/* Red Push Pin */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-600 rounded-full z-20 shadow-lg ring-1 ring-black/20">
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/50 rounded-full" />
              </div>
              
              <div className="relative overflow-hidden aspect-square rounded-sm mb-4 sm:mb-6 mt-3 sm:mt-4">
                <img src={item.imageUrl} alt={item.caption} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
                
                {/* Delete Button on Hover */}
                <button 
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  className="absolute top-2 right-2 p-2 bg-black/40 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="px-1.5 text-center">
                <h4 className="text-lg sm:text-xl font-bold text-black/80 font-serif leading-tight transform -rotate-1 italic underline decoration-black/5 decoration-2 underline-offset-4">{item.caption}</h4>
              </div>
  
              {/* Grainy overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            </motion.div>
          ))}
          {/* Placeholder tiles */}
          {[1,2].map(p => (
            <div 
              key={p} 
              onClick={() => setIsAdding(true)}
              className="break-inside-avoid h-56 sm:h-64 bg-[#c4a585]/40 border-2 border-dashed border-black/30 rounded-sm flex flex-col items-center justify-center text-black/30 gap-2 sm:gap-3 hover:border-black/50 hover:text-black/60 transition-all cursor-pointer group relative overflow-hidden"
              style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cardboard.png')` }}
             >
                <div className="p-3 sm:p-4 bg-black/5 rounded-full group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest italic">Attach Potential</span>
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const isValPositive = val >= 0;
    return (
      <div className="bg-cosmic-void/95 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl shadow-2xl font-mono text-left max-w-[200px]">
        <p className="text-[8px] font-black tracking-widest text-emerald-400 uppercase mb-1.5">
          {label ? label.toUpperCase() : 'VALUATION'}
        </p>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isValPositive ? 'bg-emerald-400' : 'bg-red-450'} animate-pulse`} />
          <span className="text-sm font-black text-white leading-none">
            {val >= 0 ? `+$${val.toLocaleString()}` : `-$${Math.abs(val).toLocaleString()}`}
          </span>
        </div>
        <p className="text-[7.5px] text-white/35 mt-1.5 uppercase tracking-wider">
          Net Sovereign Capital
        </p>
      </div>
    );
  }
  return null;
};

const WealthView = ({
  transactions,
  addTransaction,
  removeTransaction,
  isMobile,
  setView,
  tier
}: {
  transactions: Transaction[],
  addTransaction: (type: 'income' | 'expense', amount: number, label: string, category: string) => void,
  removeTransaction: (id: string) => void,
  isMobile: boolean,
  setView: (v: View) => void,
  tier: string
}) => {
  console.log("WealthView rendered. Transactions:", transactions.length, "Tier:", tier);
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('Personal');


  const categories = ['Personal', 'Business', 'Growth', 'Rituals', 'Leisure', 'Health', 'Investments'];
  const allCategories = useMemo(() => Array.from(new Set([...categories, ...transactions.map(t => t.category)])), [transactions]);
  const commonCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => counts[t.category] = (counts[t.category] || 0) + 1);
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).map(e => e[0]).slice(0, 5);
  }, [transactions]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const flow = totalIncome - totalExpense;

  // Analytics
  const sortedTransactions = [...transactions]
    .filter(t => t.timestamp)
    .sort((a, b) => {
      const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
      const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
      return ta - tb;
    });

  let runningFlow = 0;
  const trendData = sortedTransactions.map(t => {
    runningFlow += (t.type === 'income' ? t.amount : -t.amount);
    return {
      date: new Date(t.timestamp?.toDate ? t.timestamp.toDate() : t.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      flow: runningFlow
    };
  });

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#10b981', '#34d399', '#059669', '#047857', '#065f46', '#064e3b', '#06b6d4'];

  const handleAdd = () => {
    if (tier === 'Novice' && transactions.length >= 5) {
      setView('pricing');
      return;
    }
    if (!amount || !label) return;
    addTransaction(type, parseFloat(amount), label, category);
    setShowAdd(false);
    setAmount('');
    setLabel('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-0">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
        <motion.div 
          whileHover={{ y: -2 }}
          className="relative bg-black/40 p-6 sm:p-8 rounded-3xl border border-emerald-500/10 flex flex-col justify-between overflow-hidden shadow-2xl hover:border-emerald-500/40 transition-all after:absolute after:inset-0 after:bg-gradient-to-tr after:from-emerald-500/5 after:to-transparent after:pointer-events-none"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2 relative z-10">Inflow Frequency</p>
          <p className="text-4xl font-black text-white relative z-10">+${totalIncome.toLocaleString()}</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2 }}
          className="relative bg-black/40 p-6 sm:p-8 rounded-3xl border border-red-500/10 flex flex-col justify-between overflow-hidden shadow-2xl hover:border-red-500/40 transition-all after:absolute after:inset-0 after:bg-gradient-to-tr after:from-red-500/5 after:to-transparent after:pointer-events-none"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2 relative z-10">Outflow Velocity</p>
          <p className="text-4xl font-black text-white relative z-10">-${totalExpense.toLocaleString()}</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="relative bg-black/40 p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden shadow-2xl hover:border-white/30 transition-all after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 relative z-10">Net Abundance</p>
          <p className={`text-4xl font-black ${flow >= 0 ? 'text-white' : 'text-red-400'} relative z-10`}>
            {flow >= 0 ? '+' : ''}${flow.toLocaleString()}
          </p>
        </motion.div>
      </div>

      {transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050505] border border-white/10 p-8 rounded-3xl h-[350px] shadow-2xl hover:border-white/20 transition-all font-sans"
          >
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#10b981] font-mono mb-6">Evolution of Abundance</h4>
            <ResponsiveContainer width="100%" height="85%" minWidth={0} minHeight={0}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }} 
                />
                <Tooltip 
                  content={<TrendTooltip />}
                  cursor={{ stroke: 'rgba(16,185,129,0.2)', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="flow" stroke="#10b981" fillOpacity={1} fill="url(#colorFlow)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/5 p-8 rounded-3xl h-[350px] flex flex-col"
          >
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Energy Allocation</h4>
            <div className="flex-1 flex flex-col md:flex-row items-center">
              <div className="w-full h-[200px] md:w-1/2">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4 md:mt-0 md:w-1/2">
                {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-[9px] font-bold text-white/70">{entry.name}</span>
                    </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex justify-between items-center mb-10">
        <h3 className="text-2xl lg:text-3xl font-extrabold font-display text-white italic">Wealth Log</h3>
        <button 
          onClick={() => {
            console.log("Record Movement clicked. Tier:", tier, "Transactions count:", transactions.length);
            if (tier === 'Novice' && transactions.length >= 5) {
              console.log("Redirecting to pricing");
              setView('pricing');
            } else {
              setShowAdd(true);
            }
          }}
          className="bg-white text-cosmic-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/20"
        >
          Record Movement
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-cosmic-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-cosmic-void border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-xl font-black italic text-white">Capture Movement</h4>
                <button onClick={() => setShowAdd(false)} className="p-2 text-stardust/40 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="relative flex p-1 bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                  <button 
                    onClick={() => setType('expense')}
                    className="relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-300"
                    style={{ color: type === 'expense' ? '#fff' : 'rgba(255,255,255,0.4)' }}
                  >
                    Outflow
                  </button>
                  <button 
                    onClick={() => setType('income')}
                    className="relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-300"
                    style={{ color: type === 'income' ? '#fff' : 'rgba(255,255,255,0.4)' }}
                  >
                    Inflow
                  </button>
                  <motion.div
                    layoutId="wealthModalTypeActive"
                    className={`absolute top-1 bottom-1 rounded-xl shadow-lg border ${type === 'expense' ? 'bg-red-550/20 border-red-500/30' : 'bg-emerald-550/20 border-emerald-500/30'}`}
                    animate={{
                      left: type === 'expense' ? '4px' : 'calc(50% + 2px)',
                      width: 'calc(50% - 6px)'
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stardust/40 mb-2">Label</label>
                  <input 
                    type="text" 
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Ritual Supplies"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-white/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stardust/40 mb-2">Amount ($)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-white/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stardust/40 mb-2">Vibrational Category</label>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {commonCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${category === cat ? 'bg-white text-cosmic-black border-white' : 'bg-white/5 text-stardust/40 border-white/5'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <input
                    list="category-suggestions"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Or type a category..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-emerald-500/30 outline-none"
                  />
                  <datalist id="category-suggestions">
                    {allCategories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>

                <button 
                  onClick={handleAdd}
                  className="w-full py-5 bg-white text-cosmic-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-white/20"
                >
                  Confirm Movement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-4 pb-20">
        {transactions.length === 0 ? (
          <div className="py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
            <Wallet className="w-12 h-12 text-stardust/10 mx-auto mb-6" />
            <p className="text-stardust/20 font-black uppercase tracking-widest text-xs italic">No wealth movements recorded.</p>
          </div>
        ) : (
          transactions.map(t => (
            <motion.div 
              key={t.id}
              whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.08)' }}
              className="p-6 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {t.type === 'income' ? <ArrowRight className="w-5 h-5 -rotate-45" /> : <ArrowRight className="w-5 h-5 rotate-45" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">{t.label}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stardust/20">{t.category}</span>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stardust/20">
                      {new Date(t.timestamp?.toDate ? t.timestamp.toDate() : t.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <p className={`text-lg font-black italic ${t.type === 'income' ? 'text-emerald-400' : 'text-white/60'}`}>
                  {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                </p>
                <button 
                  onClick={() => removeTransaction(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-stardust/20 hover:text-red-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const HabitsView = ({ 
  habits, 
  habitLogs,
  addHabit, 
  updateHabit, 
  removeHabit, 
  toggleHabit,
  diaryEntries,
  addDiaryEntry,
  isMobile,
  tier
}: { 
  habits: Habit[], 
  habitLogs: HabitLog[],
  addHabit: (n: string, r: string) => void,
  updateHabit: (id: string, n: string, r: string) => void,
  removeHabit: (id: string) => void,
  toggleHabit: (id: string, e?: MouseEvent) => void,
  diaryEntries: DiaryEntry[],
  addDiaryEntry: (c: string, m: 'free' | '369' | '555') => void,
  isMobile: boolean,
  tier: string
}) => {
  const [tab, setTab] = useState<'rituals' | 'diary'>('rituals');
  const [isAdding, setIsAdding] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [reminder, setReminder] = useState('');

  const handleAddRitual = () => {
    if (tier === 'Novice' && habits.length >= 3) {
      alert("FREE TIER LIMIT: Novice seekers are limited to 3 active rituals. Upgrade to Adept or Ascendant for unlimited manifestation capacity.");
      return;
    }
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!name) return;
    if (editingHabit) {
      updateHabit(editingHabit.id, name, reminder);
    } else {
      addHabit(name, reminder);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingHabit(null);
    setName('');
    setReminder('');
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setName(habit.name);
    setReminder(habit.reminderTime || '');
    setIsAdding(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-2 lg:px-0">
      <div className="relative flex p-1 bg-white/5 rounded-3xl border border-white/5 mb-12 max-w-[380px] overflow-hidden">
        <button 
          onClick={() => { setTab('rituals'); setSelectedHabitId(null); }}
          className={`relative z-10 flex-1 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors duration-300 ${tab === 'rituals' ? 'text-cosmic-black font-semibold' : 'text-stardust/40 hover:text-white'}`}
        >
          Daily Habits
        </button>
        <button 
          onClick={() => setTab('diary')}
          className={`relative z-10 flex-1 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors duration-300 ${tab === 'diary' ? 'text-cosmic-black font-semibold' : 'text-stardust/40 hover:text-white'}`}
        >
          Sacred Scripting
        </button>
        <motion.div
          layoutId="habitsTabSlab"
          className="absolute top-1 bottom-1 bg-white rounded-2xl shadow-xl border border-white/10"
          animate={{
            left: tab === 'rituals' ? '4px' : 'calc(50% + 2px)',
            width: 'calc(50% - 6px)'
          }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
        />
      </div>

      {tab === 'rituals' ? (
        <>
          {selectedHabitId ? (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <button 
                onClick={() => setSelectedHabitId(null)}
                className="mb-8 flex items-center gap-2 text-stardust/40 hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Habits
              </button>
              <HabitHistory 
                habit={habits.find(h => h.id === selectedHabitId)!} 
                logs={habitLogs.filter(l => l.habitId === selectedHabitId)} 
              />
            </motion.div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                <div>
                  <h3 className="text-3xl font-black tracking-tight mb-2 text-white">Daily Habits</h3>
                  <p className="text-stardust/40 font-medium">Small actions lead to massive shifts. Consistently perform these to align your vibration.</p>
                </div>
                <button 
                  onClick={handleAddRitual}
                  className="w-full sm:w-auto bg-white text-cosmic-black px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-white/20 active:scale-95"
                >
                  <Plus className="w-5 h-5" /> New Ritual
                </button>
              </div>

              <AnimatePresence>
                {isAdding && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={closeModal}
                      className="absolute inset-0 bg-cosmic-black/80 backdrop-blur-md"
                    />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-cosmic-void border border-white/10 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl overflow-hidden"
                  >
                      <div className="absolute -right-20 -top-20 w-48 h-48 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-8">
                          <h4 className="text-2xl font-black italic text-white">{editingHabit ? 'Modify Ritual' : 'Begin New Ritual'}</h4>
                          <button onClick={closeModal} className="p-2 text-stardust/40 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stardust/40 mb-3">Ritual Name</label>
                            <input 
                              type="text" 
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="e.g. Morning Prayer" 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-stardust font-bold focus:ring-2 focus:ring-white/30 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stardust/40 mb-3 text-white/60">Universal Reminder (Time)</label>
                            <div className="relative flex gap-3">
                              <input 
                                type="time" 
                                value={reminder}
                                onChange={(e) => setReminder(e.target.value)}
                                className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-stardust font-bold focus:ring-2 focus:ring-white/30 outline-none flex items-center justify-between"
                              />
                              <button 
                                onClick={() => {
                                  if ('Notification' in window) {
                                    Notification.requestPermission().then(permission => {
                                      if (permission === 'granted') {
                                        new Notification("Alignment Confirmed", { body: "You will receive rituals reminders in this dimension." });
                                      }
                                    });
                                  }
                                }}
                                className="p-4 bg-white/10 rounded-2xl text-stardust hover:text-white transition-colors flex items-center justify-center"
                                title="Enable Browser Notifications"
                              >
                                <Bell className="w-5 h-5" />
                              </button>
                            </div>
                            <p className="text-[9px] text-stardust/20 mt-2 italic">Define the exact moment you wish to align your vibration.</p>
                          </div>

                          <div className="pt-4 flex gap-3">
                            {editingHabit && (
                              <button 
                                onClick={(e) => { removeHabit(editingHabit.id); closeModal(); }}
                                className="p-4 bg-white/5 text-stardust/40 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-cosmic-black transition-all"
                              >
                                Dissolve
                              </button>
                            )}
                            <button 
                              onClick={handleSave}
                              disabled={!name}
                              className={`flex-grow p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${!name ? 'bg-white/5 text-stardust/20' : 'bg-white text-cosmic-black shadow-xl shadow-white/20 active:scale-95'}`}
                            >
                              {editingHabit ? 'Update Frequency' : 'Lock Into Schedule'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 gap-4">
                {habits.map(habit => (
                  <div key={habit.id}>
                    <motion.div 
                      key={habit.id}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                    className={`group p-5 lg:p-6 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${habit.completed ? 'bg-white/5 border-transparent opacity-40' : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-white/20 shadow-lg'}`}
                  >
                    <div className="flex items-center gap-4 lg:gap-5 flex-grow" onClick={() => setSelectedHabitId(habit.id)}>
                      <div 
                        onClick={(e) => { e.stopPropagation(); toggleHabit(habit.id, e as any); }}
                        className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center transition-all ${habit.completed ? 'bg-white/5 text-stardust/20' : 'bg-white/10 text-white shadow-inner'}`}
                      >
                        <Zap className="w-5 h-5 lg:w-6 lg:h-6" />
                      </div>
                      <div className="flex-grow">
                        <h4 className={`text-base lg:text-lg font-bold transition-colors ${habit.completed ? 'line-through text-stardust/40' : 'text-white'}`}>{habit.name}</h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                            <Flame className="w-3 h-3 text-emerald-400" /> {habit.streak} Streak
                          </p>
                          {habit.reminderTime ? (
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                              <Bell className="w-3 h-3 text-indigo-400" /> {habit.reminderTime}
                            </p>
                          ) : (
                            <p className="text-[10px] font-bold text-stardust/30 uppercase tracking-wider px-2 py-1">Active</p>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEdit(habit); }}
                            className="text-[10px] font-bold text-stardust/40 uppercase tracking-wider hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                    <div 
                      onClick={(e) => toggleHabit(habit.id, e as any)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${habit.completed ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-white/10 hover:border-white/30'}`}
                    >
                      <AnimatePresence initial={false}>
                        {habit.completed && (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                          >
                            <CheckSquare className="w-5 h-5 text-cosmic-black" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <SacredJournaling entries={diaryEntries} onSave={addDiaryEntry} />
      )}
    </div>
  );
};

const IntensityTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-cosmic-void/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl font-mono text-left max-w-[180px]">
        <p className="text-[8px] font-black tracking-widest text-[#34d399] uppercase mb-1">
          {label || 'FOCUS LOG'}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-black text-white leading-none">
            {val} / 10
          </span>
          <span className="text-[8px] font-bold text-white/55">INTENSITY</span>
        </div>
        <p className="text-[7.5px] text-white/35 mt-1 uppercase tracking-wider">
          Resonant Strength
        </p>
      </div>
    );
  }
  return null;
};

const HabitHistory = ({ habit, logs }: { habit: Habit, logs: HabitLog[] }) => {
  const chartData = useMemo(() => [...logs].sort((a,b) => {
    const tA = (a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)).getTime();
    const tB = (b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp)).getTime();
    return tA - tB;
    }).map(log => ({
      date: new Date(log.timestamp?.toDate ? log.timestamp.toDate() : log.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}),
      intensity: log.intensity || 0
    })), [logs]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8 mb-4">
        <div>
          <h3 className="text-3xl font-black text-white mb-2">{habit.name}</h3>
          <p className="text-white/60 text-sm">Historical Frequency Records</p>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-center min-w-[100px]">
             <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-1">Total Rituals</p>
             <p className="text-xl font-black text-white">{logs.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-center min-w-[100px]">
             <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-1">Avg Intensity</p>
             <p className="text-xl font-black text-emerald-400">
               {logs.length > 0 ? (logs.reduce((acc, curr) => acc + (curr.intensity || 0), 0) / logs.length).toFixed(1) : '0'}
             </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#34d399]">Consistency Matrix</h4>
        <StreakCalendar habitId={habit.id} logs={logs} />
      </div>

      {logs.length > 1 && (
        <div className="h-64 w-full bg-[#050505] rounded-3xl p-6 border border-white/10 font-sans">
          <h4 className="text-[#34d399] font-mono font-bold uppercase text-[10px] tracking-widest mb-6">Intensity Trend</h4>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                stroke="transparent" 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontFamily: 'JetBrains Mono, monospace' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                stroke="transparent" 
                domain={[0, 10]} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontFamily: 'JetBrains Mono, monospace' }} 
              />
              <Tooltip 
                content={<IntensityTooltip />} 
                cursor={{ stroke: 'rgba(52,211,153,0.15)', strokeWidth: 2 }}
              />
              <Area type="monotone" dataKey="intensity" stroke="#34d399" fillOpacity={1} fill="url(#intensityGrad)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {logs.length === 0 ? (
          <div className="py-16 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <Activity className="w-10 h-10 text-stardust/20 mx-auto mb-4" />
            <p className="text-white/50 font-bold uppercase tracking-widest text-xs">No frequencies recorded yet.</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(1, i * 0.05) }}
              className="p-5 rounded-2xl bg-white/10 border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/90 text-sm font-bold">{new Date(log.timestamp?.toDate ? log.timestamp.toDate() : log.timestamp).toLocaleDateString()}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 rounded-md text-[9px] font-bold uppercase text-emerald-300 tracking-wider">
                      {log.mood || 'Ascendant'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{log.duration || 0}m Ritual</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">•</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Intensity {log.intensity || 0}/10</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const SacredJournaling = ({ entries, onSave }: { entries: DiaryEntry[], onSave: (c: string, m: 'free' | '369' | '555') => void }) => {
  const [content, setContent] = useState('');
  const [method, setMethod] = useState<'free' | '369' | '555'>('free');
  const [showHistory, setShowHistory] = useState(false);

  const methods = [
    { id: 'free', label: 'Scripting', description: 'Write your future as if it were present.' },
    { id: '369', label: '3-6-9 Matrix', description: 'Synchronize with the numbers of the universe.' },
    { id: '555', label: '5-5-5 Ritual', description: 'Intense 5-day manifestation focus.' },
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSave(content, method);
    setContent('');
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#e2e8f0', '#ffffff']
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-black tracking-tight text-white mb-2 italic">Sacred Scripts</h3>
          <p className="text-stardust/40 font-medium italic">Your words are the blueprints of your reality.</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="p-4 bg-white/5 rounded-2xl text-stardust/40 hover:text-white transition-colors flex items-center gap-3 font-black uppercase text-[10px] tracking-widest border border-white/5 h-fit"
        >
          {showHistory ? <PenTool className="w-4 h-4" /> : <History className="w-4 h-4" />}
          {showHistory ? 'Begin Scripting' : 'Past Realities'}
        </button>
      </div>

      {!showHistory ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {methods.map(m => (
              <motion.button
                key={m.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMethod(m.id as any)}
                className={`p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden group ${method === m.id ? 'bg-white border-white shadow-xl shadow-white/10' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
              >
                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${method === m.id ? 'text-cosmic-black' : 'text-stardust/40'}`}>{m.label}</h4>
                <p className={`text-xs font-bold leading-relaxed ${method === m.id ? 'text-cosmic-black/60' : 'text-stardust/20'}`}>{m.description}</p>
                {method === m.id && <Sparkles className="absolute -right-2 -top-2 w-12 h-12 text-cosmic-black/5" />}
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={method === '369' ? 'I am so grateful for ... (3, 6, 9 times)' : 'Dear Universe, I am living my best life...'}
              className="w-full h-[350px] sm:h-[450px] bg-[#fdfaf5] text-[#2c1810] p-10 sm:p-14 lg:p-20 rounded-[2.5rem] sm:rounded-[3.5rem] border-[12px] border-[#3e2723]/10 shadow-[0_30px_100px_rgba(0,0,0,0.3)] font-script text-2xl lg:text-3xl leading-relaxed focus:outline-none resize-none placeholder:text-[#2c1810]/20"
              style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/creampaper.png')` }}
            />
            
            <div className="absolute bottom-10 right-10 lg:bottom-16 lg:right-16 flex items-center gap-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2c1810]/40 font-sans italic">{content.length} vibration units</span>
              <button 
                type="submit"
                disabled={!content.trim()}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all shadow-2xl ${!content.trim() ? 'bg-black/5 text-black/20 cursor-not-allowed' : 'bg-[#2c1810] text-[#fdfaf5] hover:scale-110 active:scale-95'}`}
              >
                <Plus className="w-8 h-8" />
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.length === 0 ? (
            <div className="col-span-full py-32 text-center">
              <BookOpen className="w-12 h-12 text-stardust/10 mx-auto mb-6" />
              <p className="text-stardust/20 font-black uppercase tracking-widest text-xs italic">The book of future is blank.</p>
            </div>
          ) : (
            entries.map((entry, i) => (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[2.5rem] bg-[#fdfaf5] text-[#2c1810] border-2 border-transparent hover:border-[#3e2723]/20 transition-all relative group overflow-hidden"
                style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/creampaper.png')` }}
              >
                <div className="flex justify-between items-start mb-8 font-sans">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-[#2c1810]/5 rounded-lg border border-[#2c1810]/5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#2c1810]/60">{entry.method}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#2c1810]/20 italic">{new Date(entry.timestamp?.toDate ? entry.timestamp.toDate() : entry.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="font-script text-xl leading-relaxed line-clamp-6 opacity-80 group-hover:opacity-100 transition-opacity whitespace-pre-wrap italic">
                  {entry.content}
                </p>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#2c1810]/5 blur-3xl rounded-full" />
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
};

const AcademyView = ({ tier }: { tier: string }) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const lessons: (Lesson & { fullStep?: string[]; science?: string; image: string })[] = [
    { 
      id: '1', 
      title: 'The 3-6-9 Universal Frequency', 
      description: 'Master the technique used by Nikola Tesla to program the subconscious mind using numbers 3, 6, and 9.', 
      trick: 'Write your desire 3 times in the morning, 6 times in the afternoon, and 9 times before sleep.',
      image: 'https://images.unsplash.com/photo-1502481851512-e9e2529bbbf9?q=80&w=1000&auto=format',
      fullStep: [
        'Define a single, clear intention in the present tense (e.g., "I am receiving $5000").',
        'Morning: Write it 3 times to set the vibration for the day.',
        'Afternoon: Write it 6 times to amplify the energy intensity.',
        'Night: Write it 9 times to embed it into your subconscious before sleep.'
      ],
      science: 'Nikola Tesla believed 3, 6, and 9 were the "keys to the universe." In numerology, 3 represents connection to source, 6 represents inner strength, and 9 represents completion and release.'
    },
    { 
      id: '2', 
      title: 'Ho\'oponopono: Spiritual Cleaning', 
      description: 'An ancient Hawaiian practice of reconciliation and forgiveness to clean your mental slate.', 
      trick: 'Repeat "I am sorry. Please forgive me. Thank you. I love you" until you feel a shift.',
      image: 'https://images.unsplash.com/photo-1499209974431-9dac3adaf471?q=80&w=1000&auto=format',
      fullStep: [
        'Identify a problem, a person, or a self-limiting belief causing you stress.',
        'Close your eyes and visualize the situation clearly.',
        'Slowly repeat the 4 phrases as a mantra: I am sorry, Please forgive me, Thank you, I love you.',
        'Continue until the emotional charge associated with the memory fades away.'
      ],
      science: 'This technique works on "Self-Identity through Ho\'oponopono," assuming 100% responsibility for everything that manifests in your reality, effectively clearing subconscious "data" programs.'
    },
    { 
      id: '3', 
      title: 'The Law of Assumption', 
      description: 'Neville Goddard\'s core teaching: Assume the feeling of your wish fulfilled until it hardens into fact.', 
      trick: 'Live in the end. Occupy the state of already having what you want.',
      image: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=1000&auto=format',
      fullStep: [
        'Identify your desire clearly.',
        'Enter a State Akin To Sleep (SATS) — a drowsy, meditative state.',
        'Construct a short scene that implies your wish is ALREADY fulfilled.',
        'Repeat the scene in your mind until it feels real, then drift off to sleep.'
      ],
      science: 'Reticular Activating System (RAS) programming. By assuming the state, you train your brain to notice opportunities and patterns that align with that identity.'
    },
    { 
      id: '4', 
      title: 'Visualisation & Scripting', 
      description: 'Crafting the mental movies of your future and writing them into existence.', 
      trick: 'Write a diary entry from 1 year in the future as if everything has already happened.',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000&auto=format',
      fullStep: [
        'Use sensory language: colors, smells, sounds, and most importantly, emotions.',
        'Write in the past tense: "I can\'t believe how amazing this year was..."',
        'Be extremely specific with numbers, names, and locations.',
        'Read your script every morning to trigger the feeling of abundance.'
      ],
      science: 'The brain cannot distinguish between a vividly imagined event and a real one. Neuroplasticity allows you to forge new pathways based on these "mental rehearsals."'
    },
    { 
      id: '5', 
      title: 'The Secret: Law of Attraction', 
      description: 'Master the fundamental principle that thoughts become things and like attracts like.', 
      trick: 'Ask, Believe, Receive. Feel the gratitude before it happens.',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format',
      fullStep: [
        'Ask: Be crystal clear about what you want. Send a command to the universe.',
        'Believe: Act, speak, and think as though you have already received it.',
        'Receive: Feel the way you will feel once it arrives. Embody the emotion.',
        'Gratitude: Write 10 things you are grateful for daily to shift your frequency.'
      ],
      science: 'The Law of Attraction is based on the idea that everything is energy. By aligning your vibration with your desire, you "collapse the wave function" of possibilities into your physical reality.'
    },
    { 
      id: '6', 
      title: 'Quantum Leaping & Jumping', 
      description: 'Understanding manifestation as shifting to a parallel reality where your desire already exists.', 
      trick: 'Shift your identity instantly by deciding "I am that version of me."',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format',
      fullStep: [
        'Acknowledge that all versions of you exist in the present moment.',
        'Identify which version you want to align with.',
        'Adopt the vibration, thoughts, and emotions of that version right now.',
        'Act as the person who already has the desire, trusting that reality follows vibration.'
      ],
      science: 'Rooted in quantum mechanics concepts where observation changes outcome. Conscious alignment of identity forces the collapse of wavefunction into the reality you perceive.'
    },
    { 
      id: '7', 
      title: 'Eastern Wisdom on Manifestation', 
      description: 'Osho, Buddha, and the Gita on intention, presence, and detachment.', 
      trick: 'Practice "Nishkama Karma": Work with full vigor but no neediness for the result.',
      image: 'https://images.unsplash.com/photo-1545389336-cf090694735e?q=80&w=1000&auto=format',
      fullStep: [
        'Study "Sankalpa" (divine intent) from vedantic texts.',
        'Observe your desires like Osho suggests, without identifying with them.',
        'Apply the Gita’s principle of detachment: Do your best action, but relinquish control over outcomes.',
        'Find Buddha’s "Middle Way": Balance desire with the peace of being present.'
      ],
      science: 'Studies show "detached observation" lowers stress via the parasympathetic nervous system, enhancing prefrontal cortex function—the brain area responsible for strategic planning and achievement.'
    }
  ];

  if (selectedLesson) {
    return (
      <div className="max-w-5xl mx-auto px-4 lg:px-0">
        <button 
          onClick={() => setSelectedLesson(null)}
          className="mb-8 flex items-center gap-2 text-stardust/40 hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Leave the Archive
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#fdfcf5] text-black shadow-[20px_20px_60px_rgba(0,0,0,0.5)] rounded-sm min-h-[80vh] relative flex flex-col lg:flex-row overflow-hidden border-l-[30px] border-black/90"
        >
          {/* Book Spine Shadow */}
          <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-10" />
          
          {/* Left Column - Paper Detail */}
          <div className="lg:w-1/2 p-8 lg:p-16 relative border-r border-black/5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
            <h3 className="font-serif text-4xl lg:text-6xl font-black mb-8 leading-tight italic decoration-black/10 underline underline-offset-8">{selectedLesson.title}</h3>
            
            <div className="space-y-8 font-serif leading-relaxed text-lg lg:text-xl">
              <section>
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-black/40 mb-6 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> The Manuscript
                </h4>
                <p className="font-medium first-letter:text-6xl first-letter:font-black first-letter:mr-3 first-letter:float-left">
                  {selectedLesson.description}
                </p>
              </section>

              <section className="pt-10 border-t border-black/5">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-black/40 mb-8">Quantum Foundations</h4>
                <p className="italic text-black/60 bg-black/5 p-6 rounded-sm border-l-4 border-black/20">
                  {selectedLesson.science}
                </p>
              </section>
            </div>
            
            {/* Page Numbering */}
            <div className="absolute bottom-8 left-16 font-serif italic text-black/20 text-sm">Folio No. 00{selectedLesson.id}</div>
          </div>

          {/* Right Column - Practical Work */}
          <div className="lg:w-1/2 p-8 lg:p-16 bg-[#faf9f0] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] relative">
             <section className="h-full flex flex-col">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-black/40 mb-10 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" /> Lab Protocols
                </h4>
                
                <div className="space-y-12 flex-grow">
                  {selectedLesson.fullStep?.map((step, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="font-serif text-3xl font-black text-black/10 transition-colors group-hover:text-black italic">0{i+1}</div>
                      <p className="font-serif font-bold text-lg lg:text-xl leading-relaxed text-black/80">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-16 bg-black text-white p-8 rounded-sm shadow-xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                      <Zap className="w-3 h-3 fill-white" /> The Fulcrum
                    </h5>
                    <p className="font-serif text-xl italic font-black">"{selectedLesson.trick}"</p>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
             </section>
             
             {/* Page Numbering */}
             <div className="absolute bottom-8 right-16 font-serif italic text-black/20 text-sm">Archived Material</div>
          </div>

          {/* Paper Texture Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0 pb-20">
       <div className="mb-16 lg:mb-24 text-center max-w-3xl mx-auto">
          <h3 className="font-serif text-5xl lg:text-7xl font-black tracking-tight mb-6 text-white italic">The Archive</h3>
          <div className="h-0.5 w-24 bg-white/20 mx-auto mb-8" />
          <p className="text-stardust/40 text-lg lg:text-xl font-medium leading-relaxed font-serif">A sanctuary for universal truths. Every volume contains the blueprints to rewrite the fabric of your perceived existence.</p>
       </div>

       {/* Library Shelves Style - Dynamic Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20 lg:gap-x-16 relative">
          {lessons.map((lesson, idx) => (
            <motion.div 
              key={lesson.id} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedLesson(lesson)}
              className="group cursor-pointer flex gap-8 items-start relative"
            >
              {/* Shelf Divider for every 2nd item (on md+ screens) or every item (on mobile) */}
              <div className="absolute -bottom-10 left-0 right-0 h-4 bg-black/40 blur-sm rounded-full opacity-30 pointer-events-none" />
              <div className="absolute -bottom-8 left-0 right-0 h-2 bg-[#333] border-b border-white/5 pointer-events-none" />

              {/* Book Spine Aesthetic */}
              <div className="w-16 h-48 lg:w-20 lg:h-64 bg-black border-l-8 border-white/5 shrink-0 flex flex-col justify-between p-4 relative shadow-[10px_10px_30px_rgba(0,0,0,0.5)] transition-transform group-hover:translate-x-2">
                 <div className="text-[8px] font-black uppercase text-white/20 vertical-text tracking-widest">MANIFEST - VOL 0{lesson.id}</div>
                 <div className="w-full aspect-square bg-white/10 rounded-sm flex items-center justify-center">
                   <BookOpen className="w-4 h-4 text-white/50" />
                 </div>
              </div>

              <div className="flex flex-col justify-center">
                 <h4 className="font-serif text-3xl font-black text-white mb-4 group-hover:italic transition-all">{lesson.title}</h4>
                 <p className="text-stardust/30 font-medium font-serif leading-relaxed line-clamp-3 text-sm lg:text-base border-l-2 border-white/5 pl-4">{lesson.description}</p>
                 <button onClick={() => setSelectedLesson(lesson)} className="mt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                    <Play className="w-3 h-3 fill-current" /> Open Volume
                 </button>
              </div>
            </motion.div>
          ))}
       </div>
    </div>
  );
};

const PlaceholderView = ({ title, description }: { title: string, description: string }) => (
  <div className="py-20 lg:py-40 flex flex-col items-center justify-center text-center px-6">
    <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center text-stardust/20 mb-8 shadow-2xl relative">
      <Target className="w-10 h-10" />
      <div className="absolute inset-0 bg-white/5 blur-[20px] rounded-full animate-pulse" />
    </div>
    <h3 className="text-2xl lg:text-4xl font-black mb-4 tracking-tight text-white uppercase italic">{title}</h3>
    <p className="text-stardust/40 max-w-sm font-bold text-sm lg:text-base leading-relaxed">{description}</p>
    <button className="mt-8 bg-white text-cosmic-black px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-white/20 hover:scale-110 active:scale-95 transition-all">
      Initialize Dimension
    </button>
  </div>
);

const PricingView = ({ setView, user, tier, isMobile }: { setView: (v: View) => void, user: User | null, tier: string, isMobile: boolean }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  
  // Detect if user is from India
  const isIndianUser = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const lang = navigator.language || (navigator as any).userLanguage;
      return tz === 'Asia/Kolkata' || lang.includes('IN') || lang.includes('hi');
    } catch (e) {
      return false;
    }
  }, []);

  const currencySymbol = isIndianUser ? '₹' : '$';

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error("Razorpay SDK could not be loaded.");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const getInrPrice = (planName: string) => {
    if (planName === 'Novice') return 0;
    if (planName === 'Sovereign') {
      if (billingCycle === 'monthly') return 99;
      if (billingCycle === 'yearly') return 799;
      return 1999;
    }
    return 0;
  };

  const getUsdPrice = (planName: string) => {
    if (planName === 'Novice') return '0';
    if (planName === 'Sovereign') {
      if (billingCycle === 'monthly') return '5.00';
      if (billingCycle === 'yearly') return '49.00';
      return '149.00';
    }
    return '0';
  };


  const getPrice = (planName: string) => {
    return isIndianUser ? getInrPrice(planName).toString() : getUsdPrice(planName);
  };

  const handleRazorpayPayment = async (plan: any) => {
    if (!user) {
      alert("Please sign in to upgrade your frequency.");
      return;
    }

    const res = await loadRazorpayScript();

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    // Try multiple possible environment variable names
    const rzpKey = 
      import.meta.env.VITE_RAZORPAY_KEY_ID || 
      import.meta.env.VITE_RAZORPAY_KEY ||
      import.meta.env.VITE_RAZORPAY_ID;

    if (!rzpKey || rzpKey === "your_razorpay_key_id_here") {
      alert("CRITICAL: Razorpay Key ID is missing in the frontend. \n\nIMPORTANT: You must add a variable named 'VITE_RAZORPAY_KEY_ID' (must start with VITE_) in Settings -> Environment Variables so the payment window can see it.");
      return;
    }

    const inrAmount = getInrPrice(plan.name);

    try {
      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: inrAmount,
          currency: "INR",
          receipt: `receipt_${plan.name.toLowerCase()}`
        }),
      });

      const orderData = await response.json();

      if (orderData.error) {
        let msg = orderData.error;
        if (orderData.details) msg += `\n\nDetails: ${orderData.details}`;
        if (orderData.debug_id_prefix) msg += `\n\nID Check: ${orderData.debug_id_prefix} (Length: ${orderData.debug_id_len})`;
        alert(msg);
        return;
      }

      const options = {
        key: rzpKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Vibe OS",
        description: `${plan.name} (${billingCycle}) Tier Manifestation`,
        order_id: orderData.id,
        handler: async function (response: any) {
          setIsVerifying(true);
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.uid,
                tier: plan.name
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.status === "ok") {
              const expiry = new Date();
              if (billingCycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
              else if (billingCycle === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
              else expiry.setFullYear(expiry.getFullYear() + 100); 

              await updateDoc(doc(db, 'users', user.uid), {
                tier: plan.name,
                subscriptionExpiry: Timestamp.fromDate(expiry),
                updatedAt: serverTimestamp()
              });
              
              alert(`Payment Verified! Your frequency has ascended to ${plan.name}.`);
              setView('dashboard');
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (e) {
            console.error("Verification error:", e);
          } finally {
            setIsVerifying(false);
          }
        },
        prefill: {
          name: user.displayName || "Seeker",
          email: user.email || "seeker@vibe-os.com",
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: function() {
            console.log("Razorpay modal closed by user or automatically.");
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      
      paymentObject.on('payment.failed', function (response: any) {
        console.error("Payment failed reason:", response.error.reason);
        console.error("Payment failed description:", response.error.description);
        alert(`Payment failed: ${response.error.description}`);
      });

      paymentObject.open();
    } catch (e) {
      console.error("Payment error:", e);
      alert("Failed to initialize payment.");
    }
  };

  const handleSimulateUpgrade = async (plan: any) => {
    if (!user) {
      alert("Please sign in to upgrade your frequency.");
      return;
    }
    
    if (!confirm(`PROTOTYPE MODE: This will simulate a payment for the ${plan.name} tier. Proceed with manifestation?`)) return;

    setIsVerifying(true);
    try {
      const expiry = new Date();
      if (billingCycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
      else if (billingCycle === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
      else expiry.setFullYear(expiry.getFullYear() + 100);

      await updateDoc(doc(db, 'users', user.uid), {
        tier: plan.name,
        subscriptionExpiry: Timestamp.fromDate(expiry),
        updatedAt: serverTimestamp()
      });
      alert(`Simulation Successful! Your frequency has ascended to ${plan.name} (Preview Mode).`);
      setView('dashboard');
    } catch (e) {
      console.error(e);
      alert("Simulation failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const plans = [
    {
      name: "Novice",
      price: "0",
      description: "Basic frequency alignment.",
      features: ["Up to 3 Rituals", "Desire Log Access"],
      buttonText: "Current Path",
      isPremium: false,
      color: "border-white/10"
    },
    {
      name: "Sovereign",
      price: getPrice('Sovereign'),
      description: "Complete mastery over your reality. Full universal access.",
      features: ["Unlimited Rituals", "Full Academy Access", "Desire Log Access", "Flow State Analysis"],
      buttonText: "Ascend Now",
      isPremium: true,
      color: "border-stardust/60",
      recommended: true,
      planId: "P-SOVEREIGN_PLAN_ID" 
    }
  ];


  const isPayPalConfigured = import.meta.env.VITE_PAYPAL_CLIENT_ID && 
                             import.meta.env.VITE_PAYPAL_CLIENT_ID !== "your_paypal_client_id_here" &&
                             import.meta.env.VITE_PAYPAL_CLIENT_ID !== "sb";

  const pricingContent = (
    <div className="max-w-6xl mx-auto px-4 lg:px-0 pb-10">
      <div className="mb-12 lg:mb-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-6 italic">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          Limited Manifestation Window Open
        </div>
        
        <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6 text-white drop-shadow-2xl uppercase italic leading-[0.9]">
          Ascend Your <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-emerald-400">Abundance.</span>
        </h2>
        
        <p className="text-stardust/40 text-[10px] lg:text-xs font-bold leading-relaxed uppercase tracking-[0.2em] mb-10 italic">
          Join 8,400+ souls already operating at the universal frequency.
        </p>

        <div className="flex flex-col items-center gap-4">
           <div className="bg-white/5 p-1.5 rounded-[2rem] flex border border-white/10 shadow-2xl">
              {[
                { id: 'monthly', label: 'Monthly' },
                { id: 'yearly', label: 'Yearly', best: true },
                { id: 'lifetime', label: 'Lifetime' }
              ].map((cycle) => (
                <button
                  key={cycle.id}
                  onClick={() => setBillingCycle(cycle.id as any)}
                  className={`relative px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all overflow-hidden ${billingCycle === cycle.id ? 'bg-white text-cosmic-black shadow-2xl' : 'text-stardust/40 hover:text-white'}`}
                >
                  {cycle.label}
                  {cycle.best && cycle.id !== billingCycle && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500 text-white text-[6px] font-black italic">Value</div>
                  )}
                </button>
              ))}
           </div>
           
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
               <ShieldCheck className="w-3 h-3 text-emerald-500" />
               <span className="text-[8px] font-black uppercase tracking-widest text-stardust/20">Secure Encryption</span>
             </div>
             <div className="w-1 h-1 rounded-full bg-white/10" />
             <div className="flex items-center gap-1.5">
               <Zap className="w-3 h-3 text-amber-500" />
               <span className="text-[8px] font-black uppercase tracking-widest text-stardust/20">Instant Activation</span>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-20">
        {plans.map((plan, i) => {
          let effectivePrice = plan.price;
          let savings = 0;
          if (billingCycle === 'yearly') {
            effectivePrice = (parseFloat(plan.price) / 12).toFixed(2);
            savings = 50;
          } else if (billingCycle === 'lifetime') {
            effectivePrice = (parseFloat(plan.price) / 24).toFixed(2); // Estimated 2 years value
            savings = 70;
          }

          return (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-8 lg:p-10 rounded-[3rem] border backdrop-blur-3xl flex flex-col justify-between group transition-all duration-700 hover:scale-[1.02] ${
              plan.recommended 
                ? 'bg-[#064e3b]/40 border-emerald-500/40 shadow-[0_40px_100px_-20px_rgba(16,185,129,0.3)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(16,185,129,0.5)] z-20 whitespace-nowrap italic">
                Manifestor's Choice
              </div>
            )}

            {savings > 0 && plan.name !== 'Novice' && (
              <div className="absolute top-6 right-6 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[8px] font-black uppercase italic tracking-widest">
                Save {savings}%
              </div>
            )}

            <div>
              <div className="mb-10">
                <h4 className={`text-[12px] font-black uppercase tracking-[0.4em] mb-4 italic ${plan.recommended ? 'text-emerald-400' : 'text-stardust/40'}`}>
                  {plan.name}
                </h4>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter leading-none">{currencySymbol}{plan.price}</span>
                    <span className="text-stardust/20 font-bold text-[10px] uppercase tracking-widest">
                       {billingCycle === 'monthly' ? '/ mo' : billingCycle === 'yearly' ? '/ yr' : 'once'}
                    </span>
                  </div>
                  {billingCycle !== 'monthly' && plan.name !== 'Novice' && (
                    <div className="mt-2 flex items-center gap-2">
                       <span className="text-[14px] font-black text-emerald-400 italic">{currencySymbol}{effectivePrice}</span>
                       <span className="text-[8px] font-black uppercase tracking-widest text-stardust/30">Effective per month</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-stardust/60 text-xs font-bold mb-10 leading-relaxed uppercase tracking-wider min-h-[3rem] italic">
                {plan.description}
              </p>

              <div className="space-y-5 mb-12">
                {plan.features.map(feature => (
                  <div key={feature} className="flex items-center gap-4 text-[11px] font-black text-white/70 uppercase tracking-widest group-hover:text-white transition-colors">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 transition-all ${plan.recommended ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                      <Check className={`w-3 h-3 ${plan.recommended ? 'text-emerald-400' : 'text-stardust/40'}`} />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {plan.isPremium ? (
              <div className="relative z-10 space-y-4">
                {tier === plan.name ? (
                   <div className="w-full py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.3em] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-2 italic">
                      <CheckCircle2 className="w-4 h-4" /> Vibrational Match
                    </div>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(16,185,129,0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isVerifying}
                      onClick={() => {
                        const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
                        const isConfigured = rzpKey && rzpKey !== "your_razorpay_key_id_here";
                        
                        if (isConfigured) {
                          handleRazorpayPayment(plan);
                        } else {
                          handleSimulateUpgrade(plan);
                        }
                      }}
                      className={`w-full py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-2xl border border-white/10 flex items-center justify-center gap-3 italic ${
                        plan.recommended 
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-400' 
                          : 'bg-white text-cosmic-black hover:bg-stardust'
                      }`}
                    >
                      {isVerifying ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {import.meta.env.VITE_RAZORPAY_KEY_ID ? <Zap className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                          Claim Mastery
                        </>
                      )}
                    </motion.button>
                    
                    <div className="flex items-center justify-center gap-4 py-2">
                       <span className="text-[7px] font-black uppercase tracking-[0.3em] text-stardust/20 italic">Risk Free • No Questions • Divine Aligned</span>
                    </div>

                    <div className="paypal-button-container opacity-60 hover:opacity-100 transition-opacity">
                      {isPayPalConfigured && billingCycle !== 'lifetime' ? (
                        <PayPalButtons 
                          style={{ height: 36, layout: "vertical", shape: "pill", label: "subscribe", color: "white" }}
                          createSubscription={(data, actions) => {
                            return actions.subscription.create({
                              plan_id: plan.planId!
                            });
                          }}
                          onApprove={async (data, actions) => {
                            if (user) {
                               const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
                               await updateDoc(doc(db, 'users', user.uid), {
                                 tier: plan.name,
                                 updatedAt: serverTimestamp()
                               });
                               alert(`Divine Agreement Signed! Frequency ascending.`);
                               setView('dashboard');
                            }
                          }}
                          onError={(err) => {
                            console.error("PayPal Error:", err);
                            alert("Vibrational interference with PayPal. Check credentials.");
                          }}
                        />
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="py-5 rounded-[1.5rem] border border-white/10 flex items-center justify-center text-stardust/20 text-[10px] font-black uppercase tracking-[0.3em] italic text-center">
                Current Frequency
              </div>
            )}

            <div className={`absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-[120px] opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity duration-1000 ${
              plan.recommended ? 'bg-emerald-500' : 'bg-white'
            }`} />
          </motion.div>
        )})}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20 py-16 border-y border-white/5">
         {[
           { icon: Users, title: "8,400+ Active Souls", desc: "A global collective manifesting together." },
           { icon: ShieldCheck, title: "Bank-Grade Security", desc: "Your energy and data are sacredly protected." },
           { icon: Star, title: "High Frequency", desc: "Optimized protocols for rapid alignment." },
           { icon: Award, title: "Universal Seal", desc: "Join the top 1% of deliberate creators." }
         ].map((item, i) => (
           <div key={i} className="flex flex-col items-center text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-all border border-white/5">
                <item.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h5 className="text-[10px] font-black uppercase tracking-widest text-white mb-2 italic">{item.title}</h5>
              <p className="text-[9px] font-medium text-stardust/40 uppercase tracking-widest leading-loose">{item.desc}</p>
           </div>
         ))}
      </div>

      <div className="max-w-4xl mx-auto rounded-[3rem] bg-white/[0.02] border border-white/5 p-12 overflow-hidden relative group mb-20">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />
         <h3 className="text-xl font-black italic text-white mb-10 text-center uppercase tracking-tighter">Why Settle for <span className="text-stardust/40 line-through tracking-normal">Average?</span></h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
               <span className="text-[8px] font-black uppercase tracking-[0.4em] text-stardust/20 mb-4 block italic text-center md:text-left">Novice Restriction</span>
               <div className="space-y-4">
                  <div className="text-[10px] font-bold text-stardust/40 line-through uppercase tracking-widest">Unlimited AI Scripting</div>
                  <div className="text-[10px] font-bold text-stardust/40 line-through uppercase tracking-widest">432Hz Sonic Protocols</div>
                  <div className="text-[10px] font-bold text-stardust/40 line-through uppercase tracking-widest">Priority Quantum Sync</div>
                  <div className="text-[10px] font-bold text-stardust/30 uppercase tracking-widest">Limited Potential</div>
               </div>
            </div>
            <div className="border-t md:border-t-0 md:border-l border-white/10 pt-10 md:pt-0 md:pl-10">
               <span className="text-[8px] font-black uppercase tracking-[0.4em] text-emerald-400/40 mb-4 block italic text-center md:text-left">Ascendant Freedom</span>
               <div className="space-y-4">
                  <div className="text-[10px] font-black text-white flex items-center gap-2 italic uppercase tracking-widest"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> Divine Scripting Assistant</div>
                  <div className="text-[10px] font-black text-white flex items-center gap-2 italic uppercase tracking-widest"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> Full Harmonic Spectrum</div>
                  <div className="text-[10px] font-black text-white flex items-center gap-2 italic uppercase tracking-widest"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> Instant Manifestation Sync</div>
                  <div className="text-[10px] font-black text-emerald-400 flex items-center gap-2 italic uppercase tracking-widest"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> Mastery over Reality</div>
               </div>
            </div>
         </div>
         
         <div className="mt-12 text-center">
            <button 
              onClick={() => {
                setBillingCycle('yearly');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 hover:text-white transition-colors italic border-b border-emerald-400/20 pb-1"
            >
              Secure the 33% Annual Savings Now
            </button>
         </div>
      </div>

      <div className="p-10 rounded-[3rem] bg-white/5 border border-white/5 text-center relative overflow-hidden group hover:bg-white/[0.08] transition-all">
        <div className="relative z-10 flex flex-col items-center">
          <h3 className="text-xl font-black tracking-tighter text-white mb-2 italic uppercase">Enterprise?</h3>
          <p className="text-stardust/40 font-medium text-[10px] max-w-md mb-6 uppercase tracking-widest leading-loose">Custom vibrational solutions for organizations, lineages, and institutions.</p>
          <button 
            onClick={() => window.location.href = 'mailto:architect@vibe-os.digital?subject=Enterprise%20Vibration%20Consultation'}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white transition-all group-hover:gap-4 italic"
          >
            Contact Architect <ArrowRight className="w-4 h-4 text-emerald-500" />
          </button>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-white/5 flex flex-col items-center gap-8">
        <div className="flex flex-wrap justify-center gap-8 opacity-20 grayscale hover:grayscale-0 transition-all duration-1000">
           <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" referrerPolicy="no-referrer" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-4" referrerPolicy="no-referrer" />
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stardust/10 italic">Secured by Universal Intelligence</p>
      </div>
    </div>
  );

  if (isPayPalConfigured) {
    return (
      <PayPalScriptProvider options={{ 
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID!, 
        currency: "USD",
        intent: "subscription",
        vault: true,
        components: "buttons",
        "disable-funding": "card"
      }}>
        {pricingContent}
      </PayPalScriptProvider>
    );
  }

  return pricingContent;
};
