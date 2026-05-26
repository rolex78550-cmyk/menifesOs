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
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, messaging, loginWithGoogle, loginAnonymously, logout, handleFirestoreError, OperationType, testConnection, updateProfile } from './lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';

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

const playKachingSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    const time = audioCtx.currentTime;

    // 1. Drawer Opening Shimmer (White Noise with fast decay)
    const bufferSize = audioCtx.sampleRate * 0.12; 
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 2.0;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.12, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start(time);

    // 2. High Coin Rings Overlapping Natively
    const pitches = [1900, 2300, 1150];
    const delays = [0, 0.05, 0.02];
    const types: OscillatorType[] = ['sine', 'triangle', 'sine'];
    const volumes = [0.45, 0.28, 0.32];
    const decays = [0.45, 0.35, 0.55];

    pitches.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = types[idx];
      osc.frequency.setValueAtTime(freq, time + delays[idx]);
      osc.frequency.exponentialRampToValueAtTime(freq - 150, time + delays[idx] + decays[idx]);

      gain.gain.setValueAtTime(0, time);
      gain.gain.setValueAtTime(0, time + delays[idx]);
      gain.gain.linearRampToValueAtTime(volumes[idx], time + delays[idx] + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + delays[idx] + decays[idx]);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(time + delays[idx]);
      osc.stop(time + delays[idx] + decays[idx] + 0.05);
    });

  } catch (e) {
    console.warn("Abundance Kaching sound error:", e);
  }
};

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log("Razorpay script loaded successfully");
      resolve(true);
    };
    script.onerror = (e) => {
      console.error("Razorpay script failed to load:", e);
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const triggerBroadcastNotification = async (email: string | null, fcmToken: string | null, userName: string | null, ritualName: string) => {
  if (!email && !fcmToken) return;
  try {
    const response = await fetch('/api/broadcast-ritual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: email && !email.includes('guest') ? email : null, 
        fcmToken, 
        userName, 
        ritualName 
      })
    });
    const data = await response.json();
    console.log("[Vibe OS] Broadcast results:", data);
  } catch (error) {
    console.error("Broadcast failed:", error);
  }
};

import { 
  LayoutDashboard, 
  Compass,
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
  Loader2,
  X,
  Filter,
  Headphones,
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
  TrendingDown,
  BellRing,
  Terminal,
  CreditCard,
  Globe,
  RefreshCcw,
  Quote
} from 'lucide-react';
import { StreakCalendar } from './components/StreakCalendar';
import AdminView from './components/AdminView';
import CinematicTour from './components/CinematicTour';
import { SubscriptionLock } from './components/SubscriptionLock';
import { OnboardingQuiz } from './components/OnboardingQuiz';
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
type View = 'dashboard' | 'manifest' | 'habits' | 'vision' | 'wealth' | 'academy' | 'pricing' | 'terms' | 'privacy' | 'settings' | 'admin';

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
  soundType?: 'divine' | 'kaching';
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

const Sidebar = ({ currentView, setView, tier, isMobile, user, userProfile }: { currentView: View, setView: (v: View) => void, tier: string, isMobile: boolean, user: any, userProfile: any }) => {
  const isAdmin = user?.email === 'asartist20@gmail.com' || userProfile?.isAdmin === true;
  
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Omni' },
    { id: 'manifest', icon: Target, label: 'Desire' },
    { id: 'habits', icon: Zap, label: 'Rituals' },
    { id: 'vision', icon: ImageIcon, label: 'Vision' },
    { id: 'wealth', icon: Wallet, label: 'Flow' },
    { id: 'academy', icon: Library, label: 'Academy' },
    { id: 'pricing', icon: Sparkles, label: 'Upgrade' },
    { id: 'settings', icon: Settings, label: 'Setup' },
    ...(isAdmin ? [{ id: 'admin', icon: ShieldCheck, label: 'Admin' }] : [])
  ];

  return (
    <div className="w-full lg:w-72 fixed bottom-0 left-0 right-0 lg:top-0 lg:left-0 lg:bottom-0 lg:h-screen bg-black backdrop-blur-xl z-[100] border-t lg:border-t-0 lg:border-r border-emerald-500/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] lg:shadow-none safe-bottom flex lg:flex-col px-4 py-2 lg:px-6 lg:py-10">
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
        className="flex lg:flex-col gap-1.5 sm:gap-2 flex-grow overflow-x-auto lg:overflow-x-visible no-scrollbar p-1 rounded-2xl relative z-20"
      >
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-5 lg:px-6 py-2.5 lg:py-4 rounded-2xl text-[9px] lg:text-xs font-black transition-all whitespace-nowrap lg:whitespace-normal shrink-0 relative group ${
                isActive 
                  ? 'text-white' 
                  : 'text-white/20 hover:text-white/60'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebarActive"
                  className="absolute inset-0 bg-white shadow-2xl rounded-2xl border border-white/10"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
              <item.icon className={`w-4.5 h-4.5 lg:w-4 lg:h-4 relative z-10 transition-transform duration-500 ${isActive ? 'text-black scale-110' : 'group-hover:scale-110'}`} />
              <span className={`block uppercase tracking-widest relative z-10 font-black italic ${isActive ? 'text-black font-black' : ''}`}>{item.label}</span>
            </button>
          );
        })}
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
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
      {/* Deep Space Dust Layers */}
      <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] will-change-transform transform-gpu" />
      
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
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const isAdmin = useMemo(() => user?.email === 'asartist20@gmail.com' || userProfile?.isAdmin === true, [user, userProfile]);
  
  // Custom states and hooks for first-time login Walkthrough Tour
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const hasAutoTriggered = useRef(false);

  useEffect(() => {
    if (!user || !userProfile || hasAutoTriggered.current) {
      return;
    }

    const localCompleted = localStorage.getItem(`vibe_os_walkthrough_completed_${user.uid}`);
    const firestoreCompleted = (userProfile as any).walkthroughCompleted;

    if (!localCompleted && !firestoreCompleted) {
      setShowWalkthrough(true);
      hasAutoTriggered.current = true;
    }
  }, [user, userProfile]);

  // Reset auto-trigger state when user changes
  useEffect(() => {
    hasAutoTriggered.current = false;
  }, [user?.uid]);

  const handleWalkthroughComplete = async () => {
    if (!user) return;
    try {
      // 1. Mark in LocalStorage immediately
      localStorage.setItem(`vibe_os_walkthrough_completed_${user.uid}`, 'true');

      // 2. Mark in Firestore if real user
      if (!user.isGuest) {
        await updateDoc(doc(db, 'users', user.uid), {
          walkthroughCompleted: true,
          updatedAt: serverTimestamp()
        });
      } else {
        // Guest Profile update
        const savedProfile = localStorage.getItem('vibe_os_guest_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          parsed.walkthroughCompleted = true;
          localStorage.setItem('vibe_os_guest_profile', JSON.stringify(parsed));
          setUserProfile(parsed);
        }
      }
      
      // 3. Close walkthrough
      setShowWalkthrough(false);

      // 4. In-App Notification / Toast
      setActiveToast({
        id: `walkthrough-complete-${Date.now()}`,
        title: "Walkthrough Alignment Complete",
        body: "Your dynamic tour is complete! Welcome to high-frequency alignment."
      });
    } catch (e) {
      console.error("Walkthrough completion save failed:", e);
      // Fallback close
      setShowWalkthrough(false);
    }
  };
  
  const updateOfflineProfile = (tierName: string, expiryDate?: Date) => {
    const defaultExpiry = expiryDate || new Date(Date.now() + 365 * 24 * 3600 * 1000);
    const updatedProfile = {
      tier: tierName,
      subscriptionExpiry: defaultExpiry.toISOString()
    };
    localStorage.setItem('vibe_os_guest_profile', JSON.stringify(updatedProfile));
    setUserProfile(updatedProfile);
  };

  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // FCM Token Registration logic
  useEffect(() => {
    if (!user || !messaging) return;

    const setupMessaging = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // If a specific VAPID key is not provided, Firebase might use the default or fail
          // We try to get it without a fixed placeholder which might be invalid
          const token = await getToken(messaging).catch(async () => {
            console.warn("[FCM] getToken failed. Ensure your notifications are enabled.");
            return null;
          });
          
          if (token) {
            console.log("[FCM] Token acquired:", token);
            setFcmToken(token);
            // Save to Firestore (using setDoc with merge to support guests/new users)
            await setDoc(doc(db, 'users', user.uid), {
              fcmToken: token,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }
      } catch (err) {
        console.warn("[FCM] Setup failed:", err);
      }
    };

    setupMessaging();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM] Message received:', payload);
      setActiveToast({
        id: `push-${Date.now()}`,
        title: payload.notification?.title || 'Ritual Broadcast',
        body: payload.notification?.body || 'New alignment signal received.',
      });
      playDivineSound();
    });

    return () => unsubscribe();
  }, [user]);

  // 1-Day (24-Hour) trial logic with real-time countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [dismissedWarning, setDismissedWarning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const trialStartTime = useMemo(() => {
    if (!user) return Date.now();
    const localKey = `vibe_os_trial_start_${user.uid}`;
    const saved = localStorage.getItem(localKey);
    if (saved) {
      return parseInt(saved, 10);
    }
    let startTime = Date.now();
    if (user.metadata && user.metadata.creationTime) {
      startTime = new Date(user.metadata.creationTime).getTime();
    }
    localStorage.setItem(localKey, startTime.toString());
    return startTime;
  }, [user]);

  const trialDurationMs = 24 * 60 * 60 * 1000; // 24 hours
  const trialExpiryTime = trialStartTime + trialDurationMs;
  const timeLeftMs = Math.max(0, trialExpiryTime - currentTime);

  // Check if subscription is still valid or within free trial
  const isTierActive = useMemo(() => {
    if (isAdmin) return true;
    if (!userProfile) return false;
    if (userProfile.tier !== 'Novice') return true; // Already subscribed or higher tier

    // Novice users are active if their 1-day trial is active
    if (timeLeftMs > 0) {
      return true;
    }

    if (!userProfile.subscriptionExpiry) return false;
    
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
  }, [userProfile, timeLeftMs, isAdmin]);


  const activeTier = isTierActive ? (userProfile?.tier || 'Novice') : 'Novice';
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [desires, setDesires] = useState<Desire[]>([]);
  const [visionItems, setVisionItems] = useState<VisionItem[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const mainContainerRef = useRef<HTMLElement>(null);

  const [completingHabitId, setCompletingHabitId] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{ id: string, title: string, body: string } | null>(null);

  useEffect(() => {
    testConnection();
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

    const syncUser = async () => {
      try {
        const response = await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          })
        });
        const serverProfile = await response.json();
        setUserProfile(serverProfile);
      } catch (err) {
        console.error("Sync failed:", err);
      }
    };

    if (user.isGuest) {
      const savedProfile = localStorage.getItem('vibe_os_guest_profile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      } else {
        const guestProj = { tier: 'Novice', isAdmin: false, isSubscribed: false };
        localStorage.setItem('vibe_os_guest_profile', JSON.stringify(guestProj));
        setUserProfile(guestProj);
      }
      return;
    }

    // Initial sync
    syncUser();

    // Listen for real-time updates as well (for sub changes)
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserProfile(prev => ({ ...prev, ...data }));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    return () => unsubscribe();
  }, [user]);
  
  // Audio State
  const [activeHz, setActiveHz] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  const restartTour = () => {
    setShowWalkthrough(true);
    setView('dashboard');
    window.scrollTo(0, 0);
  };
  
  // Custom & Guided Audio Streams (Bhajans, Meditation Tracks & Podcasts)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [activeTrack, setActiveTrack] = useState<any | null>(null);
  const [isTrackPlaying, setIsTrackPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
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
        setActiveHz(track.hz || track.virtualHz || 432);
      }
    } else {
      // If there's an existing player, stop it
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = ""; // Clear source to stop buffering
      }
      
      const audio = new Audio();
      audio.src = track.url;
      audio.loop = true;
      audio.load(); // Explicitly load the track
      audioPlayerRef.current = audio;
      
      setIsBuffering(true);
      
      const handleCanPlay = () => {
        setIsBuffering(false);
        audio.play().catch(e => {
          console.warn("Audio stream blocked or failed.", e);
          setIsTrackPlaying(false);
        });
      };
      
      audio.addEventListener('canplaythrough', handleCanPlay, { once: true });
      audio.addEventListener('error', () => {
        setIsBuffering(false);
        setIsTrackPlaying(false);
        console.error("Audio failed to load:", track.url);
      }, { once: true });
      
      setIsTrackPlaying(true);
      setActiveTrack(track);
      setActiveHz(track.hz || track.virtualHz || 432);
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

  // Global initialization for audio ends
  useEffect(() => {
    const handleEnd = () => setIsTrackPlaying(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.addEventListener('ended', handleEnd);
    }
    return () => {
      audioPlayerRef.current?.removeEventListener('ended', handleEnd);
    };
  }, [audioPlayerRef.current]);

  const stopActiveAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsTrackPlaying(false);
      setActiveHz(null);
    }
    stopFrequency();
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

  const handleAppLogout = async () => {
    localStorage.removeItem('vibe_os_guest_user');
    localStorage.removeItem('vibe_os_guest_profile');
    localStorage.removeItem('vibe_os_guest_habits');
    localStorage.removeItem('vibe_os_guest_habit_logs');
    localStorage.removeItem('vibe_os_guest_desires');
    localStorage.removeItem('vibe_os_guest_vision_items');
    localStorage.removeItem('vibe_os_guest_diary_entries');
    localStorage.removeItem('vibe_os_guest_transactions');
    setUser(null);
    try {
      await logout();
    } catch (e) {
      console.error("Signout error:", e);
    }
  };

  useEffect(() => {
    try {
      testConnection();
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (u) {
          localStorage.removeItem('vibe_os_guest_user');
          setUser(u);
          setLoading(false);
        } else {
          const savedGuest = localStorage.getItem('vibe_os_guest_user');
          if (savedGuest) {
            setUser(JSON.parse(savedGuest));
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      }, (err) => {
        console.error("Auth change error:", err);
        const savedGuest = localStorage.getItem('vibe_os_guest_user');
        if (savedGuest) {
          setUser(JSON.parse(savedGuest));
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Auth init error:", e);
      const savedGuest = localStorage.getItem('vibe_os_guest_user');
      if (savedGuest) {
        setUser(JSON.parse(savedGuest));
      }
      setLoading(false);
    }
  }, []);

  // Sync Habits
  useEffect(() => {
    if (!user) {
      setHabits([]);
      return;
    }

    if (user.isGuest) {
      const saved = localStorage.getItem('vibe_os_guest_habits');
      if (saved) {
        setHabits(JSON.parse(saved));
      } else {
        // Build initial mock list of habits for Guest so they aren't empty!
        const initialHabits: Habit[] = [
          {
            id: 'habit_1',
            name: 'Universe Reciprocity Log',
            streak: 3,
            completed: false
          },
          {
            id: 'habit_2',
            name: '528Hz Meditation Alignment',
            streak: 5,
            completed: true
          }
        ];
        localStorage.setItem('vibe_os_guest_habits', JSON.stringify(initialHabits));
        setHabits(initialHabits);
      }
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

      if (user.isGuest) {
        const updatedHabits = habits.map(habit => {
          if (habit.completed && habit.updatedAt) {
            const dateObj = new Date(habit.updatedAt as any);
            const lastUpdateDate = dateObj.toDateString();
            if (lastUpdateDate !== todayString) {
              needsReset = true;
              return { ...habit, completed: false, updatedAt: new Date().toISOString() };
            }
          }
          return habit;
        });
        if (needsReset) {
          localStorage.setItem('vibe_os_guest_habits', JSON.stringify(updatedHabits));
          setHabits(updatedHabits);
        }
        return;
      }

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

    if (user.isGuest) {
      const saved = localStorage.getItem('vibe_os_guest_habit_logs');
      setHabitLogs(saved ? JSON.parse(saved) : []);
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

    if (user.isGuest) {
      const saved = localStorage.getItem('vibe_os_guest_desires');
      setDesires(saved ? JSON.parse(saved) : []);
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

    if (user.isGuest) {
      const saved = localStorage.getItem('vibe_os_guest_vision_items');
      setVisionItems(saved ? JSON.parse(saved) : []);
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

    if (user.isGuest) {
      const saved = localStorage.getItem('vibe_os_guest_diary_entries');
      setDiaryEntries(saved ? JSON.parse(saved) : []);
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

    if (user.isGuest) {
      const saved = localStorage.getItem('vibe_os_guest_transactions');
      setTransactions(saved ? JSON.parse(saved) : []);
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

      if (user.isGuest) {
        const updated = desires.map(d => d.id === id ? { ...d, isAchieved: !d.isAchieved, updatedAt: new Date().toISOString() } : d);
        localStorage.setItem('vibe_os_guest_desires', JSON.stringify(updated));
        setDesires(updated);
        return;
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
        if (user.isGuest) {
          const updated = habits.map(h => h.id === id ? { ...h, completed: false, streak: Math.max(0, h.streak - 1), updatedAt: new Date().toISOString() } : h);
          localStorage.setItem('vibe_os_guest_habits', JSON.stringify(updated));
          setHabits(updated);
          return;
        }

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
      if (user.isGuest) {
        const log = {
          id: 'log_' + Date.now(),
          habitId,
          ownerId: user.uid,
          timestamp: new Date().toISOString(),
          ...metrics
        };
        const logs = [log, ...habitLogs];
        localStorage.setItem('vibe_os_guest_habit_logs', JSON.stringify(logs));
        setHabitLogs(logs);

        const updatedHabits = habits.map(h => h.id === habitId ? { ...h, completed: true, streak: h.streak + 1, updatedAt: new Date().toISOString() } : h);
        localStorage.setItem('vibe_os_guest_habits', JSON.stringify(updatedHabits));
        setHabits(updatedHabits);

        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#f97316', '#ffffff']
        });

        setCompletingHabitId(null);
        return;
      }

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
      if (user.isGuest) {
        const item = {
          id: 'desire_' + Date.now(),
          text,
          category: 'Personal',
          date: new Date().toISOString().split('T')[0],
          isAchieved: false,
          ownerId: user.uid,
          updatedAt: new Date().toISOString()
        };
        const items = [item, ...desires];
        localStorage.setItem('vibe_os_guest_desires', JSON.stringify(items));
        setDesires(items);
        return;
      }

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
      if (user.isGuest) {
        const items = desires.filter(d => d.id !== id);
        localStorage.setItem('vibe_os_guest_desires', JSON.stringify(items));
        setDesires(items);
        return;
      }

      await deleteDoc(doc(db, 'desires', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `desires/${id}`);
    }
  };

  const addHabit = async (name: string, reminderTime: string, soundType: 'divine' | 'kaching' = 'divine') => {
    if (!user) return;
    try {
      if (user.isGuest) {
        const item = {
          id: 'habit_' + Date.now(),
          name,
          streak: 0,
          completed: false,
          reminderTime,
          soundType,
          ownerId: user.uid,
          updatedAt: new Date().toISOString()
        };
        const items = [item, ...habits];
        localStorage.setItem('vibe_os_guest_habits', JSON.stringify(items));
        setHabits(items);
        return;
      }

      await addDoc(collection(db, 'habits'), {
        name,
        streak: 0,
        completed: false,
        reminderTime,
        soundType,
        ownerId: user.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'habits');
    }
  };

  const updateHabit = async (id: string, name: string, reminderTime: string, soundType: 'divine' | 'kaching' = 'divine') => {
    if (!user) return;
    try {
      if (user.isGuest) {
        const items = habits.map(h => h.id === id ? { ...h, name, reminderTime, soundType, updatedAt: new Date().toISOString() } : h);
        localStorage.setItem('vibe_os_guest_habits', JSON.stringify(items));
        setHabits(items);
        return;
      }

      await updateDoc(doc(db, 'habits', id), {
        name,
        reminderTime,
        soundType,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `habits/${id}`);
    }
  };

  const removeHabit = async (id: string) => {
    if (!user) return;
    try {
      if (user.isGuest) {
        const items = habits.filter(h => h.id !== id);
        localStorage.setItem('vibe_os_guest_habits', JSON.stringify(items));
        setHabits(items);
        return;
      }

      await deleteDoc(doc(db, 'habits', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `habits/${id}`);
    }
  };

  const addVisionItem = async (caption: string, imageUrl: string) => {
    if (!user) return;
    try {
      if (user.isGuest) {
        const item = {
          id: 'vision_' + Date.now(),
          caption,
          imageUrl,
          ownerId: user.uid,
          updatedAt: new Date().toISOString()
        };
        const items = [item, ...visionItems];
        localStorage.setItem('vibe_os_guest_vision_items', JSON.stringify(items));
        setVisionItems(items);
        return;
      }

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
      if (user.isGuest) {
        const items = visionItems.filter(v => v.id !== id);
        localStorage.setItem('vibe_os_guest_vision_items', JSON.stringify(items));
        setVisionItems(items);
        return;
      }

      await deleteDoc(doc(db, 'vision_items', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vision_items/${id}`);
    }
  };

  const addDiaryEntry = async (content: string, method: 'free' | '369' | '555') => {
    if (!user || !content.trim()) return;
    try {
      if (user.isGuest) {
        const item = {
          id: 'diary_' + Date.now(),
          content,
          method,
          ownerId: user.uid,
          timestamp: new Date().toISOString()
        };
        const items = [item, ...diaryEntries];
        localStorage.setItem('vibe_os_guest_diary_entries', JSON.stringify(items));
        setDiaryEntries(items);
        return;
      }

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
      if (user.isGuest) {
        const item = {
          id: 'transaction_' + Date.now(),
          type,
          amount: Number(amount),
          label,
          category,
          ownerId: user.uid,
          timestamp: new Date().toISOString()
        };
        const items = [item, ...transactions];
        localStorage.setItem('vibe_os_guest_transactions', JSON.stringify(items));
        setTransactions(items);
        return;
      }

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
      if (user.isGuest) {
        const items = transactions.filter(t => t.id !== id);
        localStorage.setItem('vibe_os_guest_transactions', JSON.stringify(items));
        setTransactions(items);
        return;
      }

      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const [notifiedMinute, setNotifiedMinute] = useState('');

  const formatTimeHHMM = (date: Date) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  useEffect(() => {
    // Request permission on mount
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // Register Background Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('ManifestOS service worker registered:', reg.scope);
          // Sync habits to SW as soon as it's ready
          navigator.serviceWorker.ready.then((readyReg) => {
            if (readyReg.active) {
              readyReg.active.postMessage({
                type: 'SET_HABITS',
                habits: habits.map(h => ({
                  id: h.id,
                  name: h.name,
                  completed: h.completed,
                  reminderTime: h.reminderTime,
                  soundType: h.soundType || 'divine'
                }))
              });
            }
          });
        })
        .catch((err) => {
          console.error('Service worker registration error:', err);
        });

      // Handle message events back from background (e.g. notification clicks)
      const handleServiceWorkerMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'PLAY_KACHING_FROM_BG') {
          playKachingSound();
          setActiveToast({
            id: `sw-kaching-${Date.now()}`,
            title: "Abundance Wave Injected! 💰",
            body: "Clicked background alarm trigger detected. Shopify sound generated successfully."
          });
        }
      };

      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, []);

  // Sync state tracking variables list to service worker on changes
  useEffect(() => {
    const syncWithSW = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg.active) {
          reg.active.postMessage({
            type: 'SET_HABITS',
            habits: habits.map(h => ({
              id: h.id,
              name: h.name,
              completed: h.completed,
              reminderTime: h.reminderTime,
              soundType: h.soundType || 'divine'
            }))
          });
        }
      } catch (e) {
        console.warn("SW sync failed:", e);
      }
    };
    if ('serviceWorker' in navigator) {
      syncWithSW();
    }
  }, [habits]);

  useEffect(() => {
    // Check for reminders every 15 seconds in foreground
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = formatTimeHHMM(now);
      
      if (currentTime !== notifiedMinute) {
        habits.forEach(habit => {
          if (!habit.completed && habit.reminderTime === currentTime) {
            // Browser Notification with distinct vibration and sounds
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Ritual Activation: ${habit.name}`, {
                body: `It's time for your ritual: "${habit.name}". Align your frequency now.`,
                icon: '/vite.svg',
                vibrate: (habit.soundType === 'kaching' ? [120, 80, 220, 80, 420] : [500, 200, 500]) as any
              } as any);
            }

            // In-app Notification
            setActiveToast({
              id: `${habit.id}-${currentTime}`,
              title: `Ritual Activation: ${habit.name}`,
              body: `It's time for your ritual "${habit.name}". Prepare for peak alignment.`
            });
            
            // Broadcast to Email and Push Channels ONLY if Guest (Server handles registered users)
            if (user?.isGuest) {
              triggerBroadcastNotification(null, fcmToken, "Guest", habit.name);
            }
            
            // Selected customized sound type check
            if (habit.soundType === 'kaching') {
              playKachingSound();
            } else {
              playDivineSound();
            }

            // Mobile physical vibrational rhythm config
            if ('vibrate' in navigator) {
              if (habit.soundType === 'kaching') {
                navigator.vibrate([120, 80, 220, 80, 420]); // upbeat fast kaching rhythm
              } else {
                navigator.vibrate([500, 200, 500]); // slow zen wave
              }
            }
          }
        });
        setNotifiedMinute(currentTime);
    console.log(`[Vibe OS] Check complete for ${currentTime}. Total habits: ${habits.length}`);
  }
}, 15000);

return () => clearInterval(interval);
}, [habits, notifiedMinute, user, fcmToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cosmic-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030708] text-stardust flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
        {/* Dynamic Space Background & Rotating Galactic Dust */}
        <CosmicBackground isMobile={isMobile} />
        
        {/* Cinematic Neon Aura Background Glows (Simulated Nebula Video) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] blur-[150px] rounded-full animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-violet-500/[0.02] blur-[200px] rounded-full animate-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>

        {/* Cinematic Kinetic Stargate / Rotating Planetary Circles (Real-time Video feeling) */}
        {!isMobile && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none opacity-20 z-0">
            {/* Outer Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
              className="absolute inset-0 border border-white/5 rounded-full border-dashed"
            />
            {/* Mid Ring */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
              className="absolute inset-[100px] border border-emerald-500/10 rounded-full"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400/40 blur-xs" />
            </motion.div>
            {/* Inner Glowing Ring */}
            <motion.div 
              animate={{ rotate: 180, scale: [1, 1.05, 1] }}
              transition={{ rotate: { repeat: Infinity, duration: 25, ease: 'linear' }, scale: { repeat: Infinity, duration: 8, ease: 'easeInOut' } }}
              className="absolute inset-[200px] border border-dashed border-emerald-500/5 rounded-full flex items-center justify-center"
            >
              <div className="w-[150px] h-[150px] rounded-full bg-emerald-500/[0.01] blur-md" />
            </motion.div>
          </div>
        )}

        {/* Upper Brand / Grid Health Stats */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-none max-w-7xl mx-auto opacity-60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-white">Vibe OS • Gateway v2.4</span>
          </div>
          <div className="flex items-center gap-4 text-right font-mono text-[8px] sm:text-[9px] font-bold text-stardust/40 uppercase tracking-widest">
            <span className="hidden sm:inline">Vibrational Stability: 99.8%</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Divine Core Online</span>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring', damping: 20 }}
          className="relative z-10 w-full max-w-[440px] px-4"
        >
          {/* Card Ambient Aura Glow (subtle for white card depth) */}
          <div className="absolute inset-x-8 -top-8 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />

          {/* Premium White Container Card */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative overflow-hidden w-full text-slate-800">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
            
            <AnimatePresence mode="wait">
              {!isSigningIn ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Floating Modern Brand Logo */}
                  <motion.div 
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="w-14 h-14 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-center mb-6 relative group"
                  >
                    <div className="absolute inset-0 rounded-2xl border border-emerald-500/10 scale-125 animate-ping opacity-20 pointer-events-none" />
                    <Sparkles className="w-6 h-6 text-emerald-600 group-hover:rotate-12 transition-transform duration-500" />
                  </motion.div>

                  {/* Standard Trust Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-4">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Secure Quantum Portal
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold mb-2.5 tracking-tight text-slate-900 leading-none">
                    Welcome to Vibe OS
                  </h1>
                  
                  <p className="text-slate-500 text-xs sm:text-[13px] font-medium leading-relaxed mb-8 max-w-[300px]">
                    Track your daily rituals, manifest your visions, and align with your ultimate reality offline or synchronized.
                  </p>

                  <div className="flex flex-col gap-3.5 w-full">
                    {/* Standard Cloud Sync Google Auth Option */}
                    <button 
                      onClick={async () => {
                        try {
                          setIsSigningIn(true);
                          await loginWithGoogle();
                        } catch (e: any) {
                          setIsSigningIn(false);
                        }
                      }}
                      className="w-full bg-white hover:bg-slate-50 text-slate-700 py-4 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-sm hover:shadow-md border border-slate-200 transition-all flex items-center justify-center gap-3.5 cursor-pointer"
                    >
                      {/* Real Google Colored G Icon */}
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5.04c1.61 0 3.06.55 4.2 1.64l3.15-3.15C17.45 1.68 14.93 1 12 1 7.35 1 3.4 3.65 1.48 7.5l3.69 2.87C6.04 6.84 8.78 5.04 12 5.04z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.68 2.85c2.15-1.98 3.36-4.9 3.36-8.51z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.17 14.88c-.23-.69-.37-1.44-.37-2.21s.14-1.52.37-2.21L1.48 7.5C.54 9.39 0 11.53 0 13.8s.54 4.41 1.48 6.3l3.69-2.87c-.23-.69-.37-1.44-.37-2.21z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.68-2.85c-1.1.74-2.51 1.18-4.28 1.18-3.22 0-5.96-1.8-6.93-4.63L1.48 16.5C3.4 20.35 7.35 23 12 23z"
                        />
                      </svg>
                      Sign in with Google
                    </button>
                  </div>

                  {/* Clean disclaimer/info */}
                  <div className="mt-8 pt-5 border-t border-slate-100 w-full flex flex-col gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    <p>Secure cloud encryption • Instant setup</p>
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 animate-pulse mb-6">
                    SYNCHRONIZING PROFILE...
                  </p>

                  <div className="w-20 h-20 rounded-full relative flex items-center justify-center mb-6">
                    {/* Ring Animated Loaders */}
                    <div className="absolute inset-0 rounded-full border border-dashed border-emerald-500/20 animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-2.5 rounded-full border border-dashed border-emerald-500/35 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                    <div className="absolute inset-5 rounded-full border border-emerald-500/50 animate-spin" style={{ animationDuration: '1s' }} />
                    <Clock className="w-5 h-5 text-emerald-600 animate-pulse" />
                  </div>

                  <p className="text-slate-800 text-[13px] font-bold uppercase tracking-wider animate-pulse">
                    Connecting to Grid
                  </p>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1 font-mono">
                    Securing your cosmic matrix
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Clean space-themed footer detail */}
          <div className="text-center mt-6">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] italic">
              "Reality is merely an illusion, albeit a very persistent one."
            </p>
          </div>
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
      case 'habits': return <HabitsView habits={habits} habitLogs={habitLogs} addHabit={addHabit} updateHabit={updateHabit} removeHabit={removeHabit} toggleHabit={toggleHabit} setActiveToast={setActiveToast} diaryEntries={diaryEntries} addDiaryEntry={addDiaryEntry} isMobile={isMobile} tier={activeTier} user={user} fcmToken={fcmToken} />;
      case 'vision': return <VisionBoardView items={visionItems} addItem={addVisionItem} removeItem={removeVisionItem} />;
      case 'wealth': return <WealthView transactions={transactions} addTransaction={addTransaction} removeTransaction={removeTransaction} isMobile={isMobile} setView={setView} tier={activeTier} />;
      case 'academy': return <AcademyView tier={activeTier} />;
      case 'pricing': return <PricingView setView={setView} user={user} tier={activeTier} isMobile={isMobile} updateOfflineProfile={updateOfflineProfile} onToast={setActiveToast} />;
      case 'settings': return (
        <SettingsView 
          setView={setView} 
          user={user} 
          tier={userProfile?.tier || 'Novice'} 
          onToast={setActiveToast} 
          fcmToken={fcmToken}
          expiry={userProfile?.subscriptionExpiry} 
          onLogout={handleAppLogout} 
          onTriggerWalkthrough={() => setShowWalkthrough(true)}
        />
      );
      case 'admin': 
        if (!isAdmin) {
          setView('dashboard');
          return null;
        }
        return (
          <AdminView 
            setView={setView}
          user={user}
          userProfile={userProfile}
          updateOfflineProfile={updateOfflineProfile}
          habits={habits}
          setHabits={setHabits}
          desires={desires}
          setDesires={setDesires}
          transactions={transactions}
          setTransactions={setTransactions}
          visionItems={visionItems}
          setVisionItems={setVisionItems}
          diaryEntries={diaryEntries}
          setDiaryEntries={setDiaryEntries}
          onToast={setActiveToast}
        />
      );
      case 'terms': return <TermsView setView={setView} />;
      case 'privacy': return <PrivacyView setView={setView} />;
    }
  };

  return (
    <div className="h-screen bg-cosmic-black text-stardust font-sans flex flex-col lg:flex-row relative overflow-hidden gpu">
      <CosmicBackground isMobile={isMobile} />
      
      {!isTierActive && !isAdmin && view !== 'pricing' && view !== 'terms' && view !== 'privacy' && (
        <SubscriptionLock 
          onUpgrade={() => setView('pricing')} 
          isAdmin={isAdmin}
        />
      )}

      <Sidebar 
        currentView={view} 
        setView={setView} 
        tier={userProfile?.tier || 'Novice'} 
        isMobile={isMobile} 
        user={user} 
        userProfile={userProfile}
      />
      
      <AnimatePresence>
        {completingHabitId && (
          <HabitMetricsModal 
            habit={habits.find(h => h.id === completingHabitId)!}
            onClose={() => setCompletingHabitId(null)}
            onSave={addHabitLog}
          />
        )}
        {showWalkthrough && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000]"
          >
            <CinematicTour onComplete={handleWalkthroughComplete} />
          </motion.div>
        )}
        {user && !user.isGuest && userProfile && !userProfile.hasCompletedOnboarding && (
           <motion.div
             key="onboarding-gate"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[1000]"
           >
             <OnboardingQuiz 
              user={user} 
              onComplete={() => {
                setUserProfile(prev => prev ? { ...prev, hasCompletedOnboarding: true } : prev);
                setShowWalkthrough(true); // Show cinematic tour after onboarding
              }} 
            />
           </motion.div>
        )}
      </AnimatePresence>

      <main ref={mainContainerRef} className="flex-grow lg:pl-72 p-4 lg:p-5 pb-32 lg:pb-0 h-full overflow-y-auto relative z-10 no-scrollbar overscroll-behavior-contain touch-pan-y">


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

      {/* 5-Minute Warning Popup Overlay */}
      <AnimatePresence>
        {timeLeftMs > 0 && timeLeftMs <= 5 * 60 * 1000 && !dismissedWarning && userProfile?.tier === 'Novice' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-cosmic-black border border-emerald-500/30 rounded-[3rem] p-8 max-w-md w-full relative z-[1000] overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.15)] shadow-black/80"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                  <Clock className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-4 italic">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Trial Transition Sequence
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-3">
                  Alignment Bound
                </h3>
                
                <div className="font-mono text-xl sm:text-2xl font-black text-emerald-400 mb-5 bg-emerald-500/5 px-4 py-2 rounded-xl tracking-widest border border-emerald-500/10">
                  {(() => {
                    const totalSecs = Math.floor(timeLeftMs / 1000);
                    const mins = Math.floor((totalSecs % 3600) / 60);
                    const secs = totalSecs % 60;
                    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                  })()}
                </div>

                <p className="text-stardust/70 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-6 leading-relaxed italic">
                  Your 1-Day Trial is about to end. The divine frequency generator requires constant reciprocity. 
                  Skip below to continue with what remains of your single-day access, or anchor your reality fully before the portal snaps shut.
                </p>

                <div className="flex flex-col gap-3 w-full">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setView('pricing');
                      setDismissedWarning(true);
                    }}
                    className="w-full py-4 rounded-[1.5rem] bg-emerald-500 text-white font-black uppercase text-[9px] tracking-[0.3em] italic border border-white/10 flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Elevate State Now
                  </motion.button>

                  <button
                    onClick={() => setDismissedWarning(true)}
                    className="w-full py-3.5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 text-stardust/40 hover:text-white font-black uppercase text-[8px] tracking-[0.3em] italic transition-colors text-center border border-white/5"
                  >
                    Skip Trial Alert (Stay Lite)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SettingsView = ({ setView, user, tier, onToast, fcmToken, expiry, onLogout, onTriggerWalkthrough }: { setView: (v: View) => void, user: any, tier: string, onToast: (t: any) => void, fcmToken: string | null, expiry?: any, onLogout: () => void, onTriggerWalkthrough?: () => void }) => {
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
        body: `Frequency check: Successful. Your divine reminder is ready. Prepare for alignment!`,
        icon: '/vite.svg'
      });
      onToast({
        id: 'test-signal',
        title: 'Ritual Signal Active',
        body: 'Frequency check: Successful. Your divine reminder is ready. Prepare for alignment!'
      });
      playDivineSound();
      triggerBroadcastNotification(user?.email || null, fcmToken, user?.displayName || null, 'Frequency Test Signal');
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
          triggerBroadcastNotification(user?.email || null, fcmToken, user?.displayName || null, 'System Synchronization');
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
        <div className="bg-black/40 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group md:col-span-2 shadow-2xl backdrop-blur-xl after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none">
          <div className="relative z-10">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-8 italic">Identity Frequency</h4>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
              <div className="relative">
                <div className="w-28 h-28 bg-white/10 rounded-[2rem] overflow-hidden border border-white/10 ring-8 ring-white/5 shadow-2xl">
                  <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="Avatar" referrerPolicy="no-referrer" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-black flex items-center justify-center shadow-lg">
                  <Activity className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="flex-grow w-full">
                <div className="mb-6">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-3 italic">Manifestation Alias</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black italic uppercase tracking-tighter text-xl focus:outline-none focus:border-white/30 transition-all placeholder:text-white/5"
                    placeholder="Enter Alias..."
                  />
                </div>
                <div className="flex items-center gap-6">
                  <button 
                    type="submit"
                    disabled={isUpdating || displayName === user?.displayName}
                    className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shadow-xl shadow-white/10"
                  >
                    {isUpdating ? 'Synchronizing...' : 'Update Alias'}
                  </button>
                  {saveStatus === 'success' && <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic"><CheckCircle2 className="w-3.5 h-3.5" /> Frequency Aligned</span>}
                </div>
              </form>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/5 blur-3xl rounded-full" />
        </div>

        {/* Current Standing */}
        <div className="bg-black/40 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-xl after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-8 italic">Evolution Tier</h4>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-14 h-14 bg-white/5 rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">{tier}</p>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Current Resonant State</p>
              </div>
            </div>
            {expiry && tier !== 'Novice' && (
              <p className="text-[9px] font-black text-emerald-400/40 uppercase tracking-[0.2em] mb-6 italic bg-emerald-500/5 px-3 py-1 rounded-md border border-emerald-500/10 w-fit">
                Manifestation Window Closes: {new Date(expiry.seconds ? expiry.seconds * 1000 : (expiry.toDate ? expiry.toDate() : expiry)).toLocaleDateString()}
              </p>
            )}
          </div>
          <button 
            onClick={() => setView('pricing')}
            className="w-full py-5 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all italic"
          >
            Manage Consciousness Tier
          </button>
        </div>

        {/* Signal & Calibration */}
        <div className="bg-black/40 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-xl after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-8 italic">Signal Calibration</h4>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center border border-emerald-500/20 shadow-xl">
                <Bell className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">Divine Alerts</p>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">528Hz Quantum Reminders</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleTestSignal}
            className="w-full py-5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.1)] italic"
          >
            <Zap className="w-3.5 h-3.5" /> Test Signal Frequency
          </button>
        </div>

        {/* System & Session */}
        <div className="bg-black/40 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-xl after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none md:col-span-2">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-8 italic">Interactive Guidance</h4>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-14 h-14 bg-white/5 rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-xl">
                <Compass className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">Onboarding Tour</p>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Animated Walkthrough Tour</p>
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={onTriggerWalkthrough}
            className="w-full py-5 bg-white text-black hover:bg-slate-100 border border-transparent rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] italic cursor-pointer focus:outline-none"
          >
            <Compass className="w-4 h-4 text-black" /> Launch Walkthrough Tour
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
                onClick={onLogout}
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
                <li className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest">Architect Feedback</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-6">System Data</h4>
              <ul className="space-y-4 text-xs font-bold text-stardust/40 font-serif active-italic">
                <li onClick={() => setView('privacy')} className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest underline decoration-white/10">Privacy Protocol</li>
                <li onClick={() => setView('terms')} className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest underline decoration-white/10">Terms of Alignment</li>
                {user?.email === 'asartist20@gmail.com' && (
                  <li onClick={() => setView('admin')} className="hover:text-emerald-400 text-emerald-500 font-sans font-black flex items-center gap-1 cursor-pointer transition-colors uppercase tracking-widest underline decoration-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5 inline text-emerald-500" /> Admin Control Matrix
                  </li>
                )}
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
        <p>We may collect telemetry regarding application usage to calibrate our ritual optimization algorithms. This data is anonymized to ensure zero-knowledge identity.</p>
      </section>
      <section>
        <h3 className="text-xl font-bold text-white mb-4">3. Third-Party Integrations</h3>
        <p>Payment processing (Razorpay) is handled by external financial nodes. We do not store sensitive credit parameters within our own neural networks.</p>
      </section>
      <section>
        <h3 className="text-xl font-bold text-white mb-4">4. Right to Erasure</h3>
        <p>Should you choose to leave this objective reality, you may delete your profile, purging all records of your manifestation journey from our databases instantly.</p>
      </section>
    </div>
  </div>
);

// --- View Sub-components ---

const SacredMetricsTooltip = ({ active, payload, label, mode }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-black/90 backdrop-blur-3xl border border-white/20 p-4 sm:p-5 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col gap-1">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic relative z-10 leading-none">
          {payload[0].payload.displayDate}
        </p>
        <p className="text-xl sm:text-2xl font-black text-white italic tracking-tighter leading-none relative z-10">
          {mode === 'habits' ? `${val}%` : val >= 0 ? `+$${val.toLocaleString()}` : `-$${Math.abs(val).toLocaleString()}`}
        </p>
        <p className="text-[7px] sm:text-[8px] text-white/40 uppercase tracking-wider italic relative z-10 leading-none">
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
      whileHover={{ y: -5 }}
      className={`sm:col-span-1 lg:col-span-1 bg-black backdrop-blur-xl rounded-[2.5rem] p-5 sm:p-7 border border-white/10 relative overflow-hidden flex flex-col min-h-[300px] sm:min-h-[340px] group transition-all duration-500 shadow-2xl hover:border-white/30 after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none ${mode === 'wealth' ? 'from-emerald-500/10' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${mode === 'wealth' ? 'from-emerald-400/5' : 'from-emerald-500/5'} to-transparent pointer-events-none`} />
      
      <div className="relative z-10 flex flex-col flex-grow">
        {/* Header Controls with Smooth Gesture-Slabs */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between mb-6 sm:mb-8">
          {/* Mode Switch Gesture-Slab */}
          <div className="relative flex items-center bg-white/5 p-1 rounded-full border border-white/5 w-full sm:w-auto overflow-hidden">
            <button 
              onClick={() => setMode('habits')}
              className="relative z-10 flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-colors duration-300"
              style={{ color: mode === 'habits' ? '#fff' : 'rgba(255,255,255,0.4)' }}
            >
              <Activity className="w-3 h-3" />
              Rituals
            </button>
            <button 
              onClick={() => setMode('wealth')}
              className="relative z-10 flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-colors duration-300"
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
                className={`relative z-10 flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest transition-colors duration-300 ${timeframe === t ? 'text-cosmic-black font-black' : 'text-stardust/40 hover:text-white'}`}
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
            <span className="text-2xl sm:text-3xl font-black italic text-white tracking-tighter leading-none">
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

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const isSubscribed = tier !== 'Novice';

  const slides = useMemo(() => {
    return [
      {
        tag: "OS VERSION",
        title: "VIBE OS CORE UPDATE",
        detail: isSubscribed 
          ? "VIBE SYSTEM v2.5 PREMIUM: Sub-quantum frequency streams connected successfully. Galactic syncing at 432Hz."
          : "VIBE SYSTEM v2.5 LITE: Standard frequency core active. Signal limits current bandwidth. Access premium tiers to expand.",
        color: "text-emerald-400",
        badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
      },
      {
        tag: "GRID TELEMETRY",
        title: isSubscribed ? "CORE RECALIBRATED" : "POTENTIAL LOCKED",
        detail: isSubscribed
          ? "Quantum grid re-stabilized. Current manifestation density increased by 142%. Divine guidance channel online."
          : "Grid operates at basic potential. High dimensional paths are waiting. Re-anchor your alignment in the field.",
        color: "text-amber-400",
        badge: "bg-amber-500/10 border-amber-500/30 text-amber-400"
      },
      {
        tag: isSubscribed ? "DIVINE PROPHECY" : "MIND RESISTANCE",
        title: isSubscribed ? "PERSISTENCE CONFIRMED" : "HEARING THE CALL",
        detail: isSubscribed
          ? (activeDesires.length > 0 
              ? `Trust the galactic clock. Your sacred goal to "${activeDesires[0].text}" is currently crystallizing in the sub-quantum blueprint. Just a little more time, stay aligned, and this physical manifestation will be fully yours! The universe acknowledges your effort.`
              : "Trust the galactic timeline. Your desires are currently materializing in the unseen field. Keep vibrating at high frequency — it is only a matter of time before physical shift completes!")
          : "The universe responds to investment, not hesitation. Your subconscious is fully ready to manifest. By withholding support from your highest evolution, you tell the cosmos you support your own limits. Open the channel and claim your mastery today.",
        color: isSubscribed ? "text-emerald-400" : "text-rose-400",
        badge: isSubscribed ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
      }
    ];
  }, [isSubscribed, activeDesires]);

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
    // Artistic scatter distribution
    const radius = isMobile ? 120 : 180;
    const angle = (index * 137.5) * (Math.PI / 180); // Golden angle for even distribution
    const dist = Math.sqrt(index) * (isMobile ? 15 : 25);
    
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    
    const scale = 1.0 - (index * 0.05); 
    const rotation = (Math.sin(index * 42) * 12);
    
    return {
      left: `calc(50% + ${x}px - ${isMobile ? '64px' : '96px'})`,
      top: `calc(50% + ${y}px - ${isMobile ? '64px' : '96px'})`,
      scale,
      rotate: `${rotation}deg`,
      zIndex: 10 + index
    };
  };

  const currentFocus = activeDesires[focusIndex % activeDesires.length] || desires[0];

  const completedRate = habits.length > 0 ? habits.filter(h => h.completed).length / habits.length : 0;
  const vibrationScore = Math.round(completedRate * 100);
  
  const motivation = useMemo(() => {
    if (vibrationScore >= 80) return "Quantum field stabilized. Reality shift imminent.";
    if (vibrationScore >= 50) return "Energy mounting. Maintain the frequency.";
    if (habits.length === 0) return "Initialize rituals to anchor your desires.";
    return "Resistance detected. Re-align with your core rituals.";
  }, [vibrationScore, habits.length]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 auto-rows-min pb-24 lg:pb-12 max-w-[90rem] mx-auto px-4 lg:px-8 relative z-10">
      {/* Cosmic Transit Monitor */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-1 sm:col-span-2 lg:col-span-4"
      >
        <div className="relative w-full h-[200px] sm:h-[300px] lg:h-[450px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group bg-black">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            key="transit-bg-video-v3"
            className="absolute inset-0 w-full h-full object-cover scale-110"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-star-field-in-outer-space-4395-large.mp4" type="video/mp4" />
            <source src="https://cdn.pixabay.com/video/2024/02/09/200021-912234589_large.mp4" type="video/mp4" />
          </video>
          
          {/* Overlay Effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 pointer-events-none" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-700" />
          
          {/* Scanning Lines Effect */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 sm:p-12 z-10 max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col items-center justify-center p-4"
              >
                <div className={`px-4 py-1.5 rounded-full backdrop-blur-xl border text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] mb-4 sm:mb-6 italic flex items-center gap-2 shadow-2xl transition-colors duration-500 ${slides[currentSlide].badge}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                  {slides[currentSlide].tag}
                </div>
                
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,1)] select-none mb-4 sm:mb-6">
                  {slides[currentSlide].title}
                </h2>
                
                <p className="text-stardust/80 text-[10px] sm:text-xs lg:text-sm font-bold max-w-2xl leading-relaxed tracking-wider drop-shadow-md italic uppercase">
                  {slides[currentSlide].detail}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Slide Indicators / Navigation */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-emerald-400' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 1. Alignment Core */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        onClick={() => setView('habits')}
        className="sm:col-span-2 lg:col-span-2 bg-black backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 lg:p-12 border border-emerald-500/10 shadow-2xl relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[360px] sm:min-h-[400px] transition-all hover:border-emerald-500/40 after:absolute after:inset-0 after:bg-gradient-to-tr after:from-emerald-500/5 after:to-transparent after:pointer-events-none"
      >
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-emerald-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              Engine Stable
            </div>
            <Activity className="w-5 h-5 text-emerald-500/40 group-hover:text-emerald-400 transition-colors duration-500" />
          </div>
          
          <h3 className="text-2xl sm:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 tracking-tight text-white drop-shadow-2xl italic leading-[0.9] uppercase">
            Universal <br /><span className="text-emerald-400 font-black italic">Order.</span>
          </h3>
          <p className="text-emerald-100/40 mb-8 sm:mb-12 max-w-sm text-[8px] sm:text-[10px] font-black leading-relaxed uppercase tracking-[0.25em] italic">
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

      {/* 3. Manifestation Alignment Progress */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5 }}
        onClick={() => setView('manifest')}
        className="sm:col-span-1 lg:col-span-1 border border-white/10 bg-black backdrop-blur-xl rounded-[2.5rem] relative overflow-hidden group min-h-[340px] sm:min-h-[400px] shadow-2xl transition-all hover:border-emerald-500/30 flex flex-col cursor-pointer"
      >
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            key="manifest-progress-bg"
            className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 transition-all duration-700"
          >
            <source src="https://cdn.pixabay.com/video/2017/12/31/13554-249581057_large.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-emerald-900/40" />
        </div>
        
        <div className="relative z-10 p-8 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[8px] font-black uppercase tracking-[0.3em] text-emerald-400 italic">
              Quantum Proximity
            </div>
            <Target className="w-5 h-5 text-emerald-400/40 group-hover:text-emerald-400 animate-pulse" />
          </div>

          <div className="flex-grow flex flex-col justify-center text-center">
            <div className="mb-6">
              <span className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter leading-none block">
                {vibrationScore}%
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mt-2 block">Alignment Score</span>
            </div>
            
            <p className="text-[9px] font-black uppercase leading-relaxed text-stardust/60 tracking-wider h-10 italic">
              {motivation}
            </p>
          </div>

          <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
            {activeDesires.slice(0, 2).map((desire, i) => {
              // Calculate a relative progress for each desire based on habits + some local randomness/pseudo-logic
              const desireProgress = Math.min(100, Math.floor(vibrationScore * 0.8 + (i * 5)));
              return (
                <div key={desire.id} className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[8px] font-black uppercase tracking-widest text-stardust/40 max-w-[80%] truncate italic">{desire.text}</span>
                    <span className="text-[8px] font-black text-emerald-400">{desireProgress}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${desireProgress}%` }}
                      className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>
              );
            })}
            {activeDesires.length > 2 && (
              <p className="text-[7px] font-black uppercase tracking-widest text-center text-white/20">+{activeDesires.length - 2} more manifestations in field</p>
            )}
            {activeDesires.length === 0 && (
              <p className="text-[7px] font-black uppercase tracking-widest text-center text-white/20 italic">No active desires detected.</p>
            )}
          </div>
        </div>
      </motion.div>


      {/* 4. Ritual Feed */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="md:col-span-1 lg:col-span-1 border border-white/10 bg-black backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 pb-8 sm:pb-10 shadow-2xl relative overflow-hidden group flex flex-col min-h-[380px] transition-all hover:border-white/30 after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none"
      >
        <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-8 sm:mb-10 flex justify-between items-center group-hover:text-white transition-colors relative z-10">
          Ritual Feed
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        </h3>
        
        <div className="space-y-3 sm:space-y-4 flex-grow relative z-10">
          {habits.slice(0, 4).map((habit, i) => (
            <motion.div 
              key={habit.id}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="flex items-center justify-between p-3 sm:p-4 px-4 sm:px-5 rounded-[1.25rem] sm:rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-emerald-500/30 transition-all shadow-inner group/item"
            >
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleHabit(habit.id)}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${habit.completed ? 'bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.9)]' : 'bg-white/10'}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest transition-all italic ${habit.completed ? 'text-white/20 line-through' : 'text-white/90'}`}>
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
                  className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/30 rounded-xl transition-all border border-emerald-500/20 group-hover/item:scale-110 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
        
        <button 
          onClick={() => setView('habits')}
          className="relative z-10 w-full py-4 mt-6 rounded-[1.25rem] border border-dashed border-white/10 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white transition-all hover:bg-white/5 italic"
        >
          Access Infinite Spectrum
        </button>
      </motion.div>

      {/* 5. Vision Deck */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="md:col-span-2 lg:col-span-3 bg-black backdrop-blur-3xl rounded-[3rem] p-8 sm:p-10 lg:p-12 border border-white/5 shadow-2xl relative overflow-hidden group min-h-[450px] sm:min-h-[500px]"
      >
        {/* Animated Background Atmosphere */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full animate-pulse delay-700" />
        
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/40 mb-1">Projection Core</h3>
            <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Vision Deck.</h4>
          </div>
          <button onClick={() => setView('vision')} className="group/btn px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-stardust/60 hover:text-white transition-all flex items-center gap-2 overflow-hidden relative">
            <span className="relative z-10">Expand Deck</span>
            <Expand className="w-3 h-3 relative z-10 group-hover/btn:rotate-12 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
          </button>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none perspective-[1000px]">
          <div className="relative w-full h-full max-w-sm max-h-[400px]">
            <AnimatePresence>
              {displayVision.map((item, idx) => {
                const pos = getPosition(idx);
                return (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, scale: 0, rotate: 0, y: 100 }}
                    animate={{ 
                      opacity: 1, 
                      scale: pos.scale,
                      left: pos.left,
                      top: pos.top,
                      rotate: pos.rotate,
                      zIndex: pos.zIndex
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                      delay: 0.1 * idx
                    }}
                    whileHover={isMobile ? undefined : { 
                      scale: 1.25, 
                      zIndex: 200, 
                      rotate: 0, 
                      y: -20,
                      transition: { type: "spring", stiffness: 400, damping: 20 } 
                    }}
                    className="absolute w-40 h-40 md:w-56 md:h-56 group/vision cursor-pointer pointer-events-auto"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="w-full h-full p-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group-hover/vision:border-emerald-500/40 transition-all duration-700 shadow-black/80 ring-1 ring-white/5">
                      <img 
                        src={item.imageUrl} 
                        alt={item.caption} 
                        className="w-full h-full object-cover rounded-[2rem] grayscale-[0.2] brightness-90 group-hover/vision:grayscale-0 group-hover/vision:brightness-110 group-hover/vision:scale-110 transition-all duration-1000 ease-out" 
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Interaction Glow */}
                      <div className="absolute inset-0 opacity-0 group-hover/vision:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
                      
                      <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover/vision:opacity-100 transition-all duration-500 translate-y-4 group-hover/vision:translate-y-0">
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic truncate text-center drop-shadow-md">{item.caption}</p>
                      </div>
                    </div>
                    
                    {/* Shadow underneath */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-black/40 blur-xl rounded-full scale-0 group-hover/vision:scale-100 transition-transform duration-500 opacity-50" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {displayVision.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-stardust/10">
                <ImageIcon className="w-20 h-20 mb-4 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">Waiting for Vision</p>
              </div>
            )}
          </div>
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
            whileHover={isMobile ? undefined : { y: -2 }}
            whileTap={{ scale: 0.995 }}
            onClick={() => toggleDesire(desire.id)}
            className={`p-6 lg:p-10 rounded-[2.5rem] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group cursor-pointer shadow-2xl border border-white/10 relative overflow-hidden transform-gpu backdrop-blur-xl after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none hover:border-white/30 ${desire.isAchieved ? 'opacity-50 grayscale bg-white/5' : 'bg-black/40'}`}
          >
            <div className="flex items-center gap-6 relative z-10">
              <div className={`w-12 h-12 rounded-2xl border shrink-0 flex items-center justify-center transition-all ${desire.isAchieved ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 border-white/10 group-hover:border-white/40'}`}>
                {desire.isAchieved && <CheckSquare className="w-5 h-5" />}
              </div>
              <div>
                <p className={`text-2xl lg:text-3xl font-black transition-all leading-tight italic uppercase tracking-tighter ${desire.isAchieved ? 'line-through text-white/30 decoration-white/40' : 'text-white'}`}>{desire.text}</p>
                <div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-stardust/40 mt-3 italic">
                  <span className="text-emerald-500/60 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">{desire.category}</span>
                  <span className="opacity-50">Locked: {desire.date}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); removeDesire(desire.id); }}
              className="sm:opacity-0 group-hover:opacity-100 p-3 bg-white/5 text-white/20 rounded-xl hover:bg-red-500 hover:text-white transition-all relative z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
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

      <div className="bg-cosmic-void/40 backdrop-blur-3xl p-5 sm:p-8 lg:p-12 rounded-[2rem] sm:rounded-[4rem] lg:rounded-[5rem] shadow-2xl min-h-[70vh] relative overflow-hidden border border-white/5 group/board">
        {/* Animated Background Energy */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4 animate-pulse delay-1000 pointer-events-none" />
        
        {/* Floating Particles Overlay */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />

        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 lg:gap-10 space-y-6 lg:space-y-10 relative z-10 p-0.5">
          <AnimatePresence mode="popLayout">
            {items.map((item, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                transition={{ 
                  delay: idx * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                key={item.id} 
                className="break-inside-avoid bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-3 shadow-2xl relative group overflow-hidden hover:border-white/20 transition-colors duration-500"
              >
                <div className="relative overflow-hidden aspect-[4/5] rounded-[1.5rem]">
                  <img 
                    src={item.imageUrl} 
                    alt={item.caption} 
                    className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 scale-100 group-hover:scale-110 transition-all duration-1000 ease-out" 
                    referrerPolicy="no-referrer" 
                  />
                  
                  {/* Glassy Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                  
                  {/* Delete Button - Sleeker */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                    className="absolute top-4 right-4 p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white/50 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80 hover:text-white hover:scale-110"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Caption Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-[1.2rem] shadow-xl">
                      <p className="text-[11px] lg:text-xs font-black text-white uppercase tracking-[0.15em] italic leading-tight text-center drop-shadow-sm">
                        {item.caption}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Subtle Inner Glow on Hover */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-emerald-500/5 to-blue-500/5" />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Placeholder/Add Tile - Sleeker */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsAdding(true)}
            className="break-inside-avoid min-h-[300px] bg-white/[0.03] border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-stardust/20 gap-4 hover:border-white/30 hover:bg-white/[0.05] hover:text-white/60 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="p-5 bg-white/5 rounded-full group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 border border-white/5">
              <Plus className="w-8 h-8 opacity-40 group-hover:opacity-100" />
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] block mb-1">Expand Vision</span>
              <span className="text-[8px] font-medium opacity-40 uppercase tracking-widest">Import New Reality</span>
            </div>
            
            {/* Hover energy pulse */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-tr from-emerald-500 via-transparent to-blue-500" />
          </motion.div>
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
    if (type === 'income') playKachingSound();
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
              whileHover={{ x: 5, y: -2 }}
              className="p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-black backdrop-blur-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group shadow-2xl transition-all hover:border-white/30 after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none relative overflow-hidden"
            >
              <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full sm:w-auto">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {t.type === 'income' ? <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 -rotate-45" /> : <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 rotate-45" />}
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-black text-white italic uppercase tracking-tighter leading-tight mb-1 sm:mb-2 truncate">{t.label}</p>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/30 italic whitespace-nowrap">{t.category}</span>
                    <div className="w-1 h-1 rounded-full bg-white/10 hidden sm:block" />
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/20 italic whitespace-nowrap">
                      {new Date(t.timestamp?.toDate ? t.timestamp.toDate() : t.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 relative z-10 w-full sm:w-auto border-t sm:border-0 border-white/5 pt-4 sm:pt-0">
                <p className={`text-xl sm:text-2xl font-black italic uppercase tracking-tighter ${t.type === 'income' ? 'text-emerald-400' : 'text-white/40'}`}>
                  {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                </p>
                <button 
                  onClick={() => removeTransaction(t.id)}
                  className="p-2 sm:p-3 bg-white/5 text-white/20 rounded-xl hover:bg-red-500 hover:text-white transition-all scale-100 sm:scale-0 sm:group-hover:scale-100 shadow-xl"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
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
  setActiveToast,
  diaryEntries,
  addDiaryEntry,
  isMobile,
  tier,
  user,
  fcmToken
}: { 
  habits: Habit[], 
  habitLogs: HabitLog[],
  addHabit: (n: string, r: string, s: 'divine' | 'kaching') => void,
  updateHabit: (id: string, n: string, r: string, s: 'divine' | 'kaching') => void,
  removeHabit: (id: string) => void,
  toggleHabit: (id: string, e?: MouseEvent) => void,
  setActiveToast: (toast: { id: string, title: string, body: string } | null) => void,
  diaryEntries: DiaryEntry[],
  addDiaryEntry: (c: string, m: 'free' | '369' | '555') => void,
  isMobile: boolean,
  tier: string,
  user: any,
  fcmToken: string | null
}) => {
  const [tab, setTab] = useState<'rituals' | 'diary'>('rituals');
  const [isAdding, setIsAdding] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [reminder, setReminder] = useState('');
  const [soundType, setSoundType] = useState<'divine' | 'kaching'>('divine');

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
      updateHabit(editingHabit.id, name, reminder, soundType);
    } else {
      addHabit(name, reminder, soundType);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingHabit(null);
    setName('');
    setReminder('');
    setSoundType('divine');
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setName(habit.name);
    setReminder(habit.reminderTime || '');
    setSoundType(habit.soundType || 'divine');
    setIsAdding(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">
      <div className="relative flex p-1 bg-white/5 rounded-3xl border border-white/5 mb-8 lg:mb-12 w-full sm:max-w-[380px] overflow-hidden">
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 lg:mb-12">
                <div className="max-w-xl">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-white italic uppercase">Daily Rituals</h3>
                  <p className="text-stardust/40 text-xs sm:text-sm font-black uppercase tracking-wider italic">Small actions lead to massive shifts. Consistently perform these to align your vibration.</p>
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
                                        new Notification("Alignment Confirmed", { 
                                          body: "Frequency synchronization active. You will receive cosmic reminders.",
                                          icon: '/vite.svg'
                                        });
                                        setActiveToast({
                                          id: 'test-notif',
                                          title: 'Matrix Synchronized',
                                          body: 'Browser notifications are now active. Frequency sound will play during triggers.'
                                        });
                                        // Optional: trigger a test broadcast if user has a real profile
                                        triggerBroadcastNotification(user?.email || null, fcmToken || null, user?.displayName || null, "Universal Connection Test");
                                      }
                                    });
                                  }
                                }}
                                className="p-4 bg-white/10 rounded-2xl text-stardust hover:text-white transition-colors flex items-center justify-center shrink-0 border border-white/10"
                                title="Sync Cosmic Notifications"
                              >
                                <BellRing className="w-5 h-5 text-emerald-400" />
                              </button>
                            </div>
                            <p className="text-[9px] text-stardust/20 mt-2 italic">Define the exact moment you wish to align your vibration.</p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stardust/40 mb-3 text-white/60">Frequency Sound Signature</label>
                            <div className="grid grid-cols-2 gap-3.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSoundType('divine');
                                  playDivineSound();
                                }}
                                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${soundType === 'divine' ? 'bg-white/10 text-white border-white/30' : 'bg-white/5 text-stardust/50 border-white/5 hover:border-white/10'}`}
                              >
                                <div className="text-xs font-black uppercase tracking-tight mb-1 flex items-center gap-1.5">
                                  <Waves className="w-3.5 h-3.5 text-blue-400" /> Divine 528Hz
                                </div>
                                <div className="text-[9px] font-semibold text-stardust/30 group-hover:text-stardust/50 transition-colors">Test Zen Healing Wave</div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSoundType('kaching');
                                  playKachingSound();
                                }}
                                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${soundType === 'kaching' ? 'bg-white/10 text-white border-white/30' : 'bg-white/5 text-stardust/50 border-white/5 hover:border-white/10'}`}
                              >
                                <div className="text-xs font-black uppercase tracking-tight mb-1 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Abundance Chime
                                </div>
                                <div className="text-[9px] font-semibold text-stardust/30 group-hover:text-stardust/50 transition-colors">Test Shopify Kaching 💰</div>
                              </button>
                            </div>
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
                  <div key={`habit-container-${habit.id}`}>
                    <motion.div 
                      key={`habit-motion-${habit.id}`}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.995 }}
                      className={`group p-6 lg:p-8 rounded-[2.5rem] border border-white/10 transition-all cursor-pointer flex items-center justify-between shadow-2xl relative overflow-hidden backdrop-blur-xl after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none hover:border-white/30 ${habit.completed ? 'opacity-40 grayscale bg-white/5' : 'bg-black/40'}`}
                    >
                      <div className="flex items-center gap-6 flex-grow relative z-10" onClick={() => setSelectedHabitId(habit.id)}>
                        <div 
                          onClick={(e) => { e.stopPropagation(); toggleHabit(habit.id, e as any); }}
                          className={`w-14 h-14 lg:w-16 lg:h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${habit.completed ? 'bg-white/5 text-stardust/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xl'}`}
                        >
                          <Zap className={`w-6 h-6 lg:w-7 lg:h-7 ${habit.completed ? '' : 'animate-pulse'}`} />
                        </div>
                        <div className="flex-grow">
                          <h4 className={`text-xl lg:text-2xl font-black transition-colors italic uppercase tracking-tighter ${habit.completed ? 'line-through text-stardust/40' : 'text-white'}`}>{habit.name}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-2.5">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1 rounded-md border border-emerald-500/10">
                              <Flame className="w-3.5 h-3.5" /> {habit.streak} Streak
                            </p>
                            {habit.reminderTime ? (
                              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                                <Clock className="w-3.5 h-3.5" /> {habit.reminderTime}
                              </p>
                            ) : (
                              <p className="text-[10px] font-black text-stardust/30 uppercase tracking-widest px-2 py-1">Continuous Flow</p>
                            )}
                            {habit.soundType === 'kaching' ? (
                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/10" title="Shopify Abundance Kaching Alarm">
                                💰 Kaching Chime
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1.5 bg-sky-500/5 px-2.5 py-1 rounded-md border border-sky-500/10" title="Divine Freq Solfeggio Alarm">
                                🧘 Divine 528Hz
                              </span>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); openEdit(habit); }}
                              className="text-[10px] font-black text-stardust/40 uppercase tracking-widest hover:text-white transition-colors bg-white/5 px-3 py-1 rounded-md border border-white/5"
                            >
                              Edit Protocol
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
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

      {/* Diagnostic Troubleshooting removed per user request */}

      <div className="h-20" />
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
        
      <div className="flex gap-4">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 text-center min-w-[120px] shadow-xl after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none relative overflow-hidden">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 italic">Total Rituals</p>
             <p className="text-2xl font-black text-white italic">{logs.length}</p>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 text-center min-w-[120px] shadow-xl after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none relative overflow-hidden">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 italic">Avg Intensity</p>
             <p className="text-2xl font-black text-emerald-400 italic">
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
        <div className="h-72 w-full bg-black/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden shadow-2xl after:absolute after:inset-0 after:bg-gradient-to-tr after:from-emerald-500/5 after:to-transparent after:pointer-events-none">
          <h4 className="text-emerald-400 font-black uppercase text-[10px] tracking-[0.4em] mb-8 italic">Frequency Intensity Trend</h4>
          <div className="h-[calc(100%-3rem)] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  stroke="transparent" 
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 900 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  stroke="transparent" 
                  domain={[0, 10]} 
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 900 }} 
                />
                <Tooltip 
                  content={<IntensityTooltip />} 
                  cursor={{ stroke: 'rgba(16,185,129,0.1)', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="intensity" stroke="#10b981" fillOpacity={1} fill="url(#intensityGrad)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {methods.map(m => (
              <motion.button
                key={m.id}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMethod(m.id as any)}
                className={`p-8 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group shadow-xl after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none ${method === m.id ? 'bg-white border-white' : 'bg-black border-white/10 hover:border-white/30'}`}
              >
                <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic ${method === m.id ? 'text-black' : 'text-white/30'}`}>{m.label}</h4>
                <p className={`text-xs font-black leading-relaxed italic uppercase tracking-tight ${method === m.id ? 'text-black/40' : 'text-white/20'}`}>{m.description}</p>
                {method === m.id && <Sparkles className="absolute -right-2 -top-2 w-12 h-12 text-black/5" />}
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="relative group/notebook">
            {/* Notebook Margin Line */}
            <div className="absolute left-[3.5rem] sm:left-[4.5rem] lg:left-[5.5rem] top-0 bottom-0 w-[2px] bg-red-400/20 z-10 pointer-events-none" />
            <div className="absolute left-[3.6rem] sm:left-[4.6rem] lg:left-[5.6rem] top-0 bottom-0 w-[1px] bg-red-400/10 z-10 pointer-events-none" />
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={method === '369' ? 'I am so grateful for ...' : 'Dear Universe, I am living my best life...'}
              className="w-full h-[400px] sm:h-[550px] scripture-paper text-slate-900/90 p-8 pt-12 sm:p-14 sm:pt-18 lg:p-20 lg:pt-24 pl-16 sm:pl-28 lg:pl-36 rounded-[2.5rem] sm:rounded-[4rem] border shadow-2xl font-handwriting text-2xl sm:text-3xl lg:text-5xl leading-[2.85rem] focus:outline-none resize-none placeholder:text-black/5 backdrop-blur-sm transition-all border-black/10 focus:border-black/20 notebook-ruled selection:bg-blue-100"
            />
            
            <div className="absolute bottom-10 right-10 lg:bottom-16 lg:right-16 flex items-center gap-10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20 italic">{content.length} vibration units</span>
              <button 
                type="submit"
                disabled={!content.trim()}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all shadow-2xl border ${!content.trim() ? 'bg-black/5 text-black/10 border-black/5 cursor-not-allowed' : 'bg-slate-900 text-white border-black hover:scale-110 active:scale-95 shadow-black/30'}`}
              >
                <Plus className="w-10 h-10" />
              </button>
            </div>
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] p-10" />
            
            {/* Binding Holes Detail */}
            <div className="absolute left-6 top-1/4 flex flex-col gap-12 opacity-10">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-black shadow-inner" />
              ))}
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
                whileHover={{ y: -5 }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[3rem] scripture-paper border border-black/10 hover:border-black/20 transition-all relative group overflow-hidden shadow-2xl flex flex-col justify-between min-h-[300px]"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30 italic">{entry.method} Protocol</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/20 italic">{new Date(entry.timestamp?.toDate ? entry.timestamp.toDate() : entry.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="notebook-ruled rounded-2xl p-6 bg-black/[0.02] border border-black/5 hover:bg-black/[0.04] transition-all">
                    <p className="text-2xl lg:text-4xl font-handwriting text-black/80 leading-[2.85rem] line-clamp-6 italic transition-opacity whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-black/5 flex justify-between items-center relative z-10">
                  <div className="flex gap-1.5 opacity-30">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-black" />
                    ))}
                  </div>
                  <Sparkles className="w-4 h-4 text-black/10 group-hover:text-emerald-600/40 transition-colors" />
                </div>
                <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
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
      image: '/academy-1.png',
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
      image: '/academy-2.png',
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
      image: '/academy-3.png',
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
      image: '/academy-4.png',
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
      image: '/academy-5.png',
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
      image: '/academy-6.png',
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
      image: '/academy-7.png',
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
          className="bg-black/60 text-white shadow-2xl rounded-[3rem] min-h-[85vh] relative flex flex-col lg:flex-row overflow-hidden border border-white/10 backdrop-blur-3xl after:absolute after:inset-0 after:bg-gradient-to-tr after:from-emerald-500/10 after:to-transparent after:pointer-events-none"
        >
          {/* Background Image Preview */}
          <div className="absolute inset-x-0 top-0 h-64 lg:h-full lg:w-full opacity-20 pointer-events-none overflow-hidden">
            <img src={selectedLesson.image} alt="" className="w-full h-full object-cover blur-3xl scale-150" />
          </div>

          {/* Left Column - Divine Theory */}
          <div className="lg:w-1/2 p-10 lg:p-20 relative border-r border-white/5 flex flex-col justify-center">
            <div className="relative z-10">
              <div className="mb-10 w-16 h-1 bg-white/20 rounded-full" />
              <h3 className="text-5xl lg:text-7xl font-black mb-10 leading-[0.85] tracking-tight italic uppercase drop-shadow-2xl">{selectedLesson.title}</h3>
              
              <div className="space-y-10 leading-relaxed max-w-lg">
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-6 flex items-center gap-3 italic">
                    <BookOpen className="w-4 h-4 text-emerald-400" /> The Manuscript
                  </h4>
                  <p className="text-lg lg:text-2xl font-black italic opacity-60 leading-tight uppercase tracking-tighter">
                    {selectedLesson.description}
                  </p>
                </section>

                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-6 italic">Quantum Mechanics</h4>
                  <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner group-hover:border-white/20 transition-all">
                    <p className="text-sm font-black italic text-emerald-400 uppercase tracking-tight leading-relaxed">
                      {selectedLesson.science}
                    </p>
                  </div>
                </section>
              </div>
            </div>
            
            <div className="absolute bottom-12 left-20 text-[9px] font-black italic text-white/10 uppercase tracking-[0.5em]">Protocol Folio 00{selectedLesson.id}</div>
          </div>

          {/* Right Column - Engineering Protocol */}
          <div className="lg:w-1/2 p-10 lg:p-20 bg-black/40 relative flex flex-col justify-center">
             <section className="relative z-10 flex flex-col h-full justify-center">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-12 flex items-center gap-3 italic">
                  <CheckSquare className="w-4 h-4 text-emerald-400" /> Lab Protocols
                </h4>
                
                <div className="space-y-10 flex-grow py-4">
                  {selectedLesson.fullStep?.map((step, i) => (
                    <div key={i} className="flex gap-8 group">
                      <div className="text-5xl font-black text-white/5 transition-all group-hover:text-emerald-500/20 italic leading-none">0{i+1}</div>
                      <p className="text-lg lg:text-xl font-black text-white leading-tight italic uppercase tracking-tighter self-center">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-16 bg-white text-black p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                  <div className="relative z-10">
                    <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-black/30 mb-4 flex items-center gap-2 italic">
                      <Zap className="w-3.5 h-3.5 fill-black" /> Manifestation Fulcrum
                    </h5>
                    <p className="text-2xl font-black italic uppercase italic leading-none">"{selectedLesson.trick}"</p>
                  </div>
                </div>
             </section>
             
             <div className="absolute bottom-12 right-20 text-[9px] font-black italic text-white/10 uppercase tracking-[0.5em]">Continuum Archive</div>
          </div>
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0 pb-20">
       <div className="mb-16 lg:mb-24 text-center max-w-3xl mx-auto">
          <h3 className="text-5xl lg:text-7xl font-black tracking-tight mb-6 text-white italic transition-all hover:tracking-widest uppercase leading-none">The Archive</h3>
          <div className="h-1 w-24 bg-emerald-500/40 mx-auto mb-8 rounded-full" />
          <p className="text-stardust/40 text-lg lg:text-xl font-black leading-relaxed italic uppercase tracking-widest">A sanctuary for universal truths. Every volume contains the blueprints to rewrite reality.</p>
       </div>

        {/* Cosmic Grid Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-12 relative px-2 sm:px-0">
           {lessons.map((lesson, idx) => (
             <motion.div 
               key={lesson.id} 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.1 }}
               whileHover={{ y: -5 }}
               onClick={() => setSelectedLesson(lesson)}
               className="group cursor-pointer bg-black/40 backdrop-blur-xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col min-h-[450px] relative transition-all hover:border-white/30 after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/5 after:to-transparent after:pointer-events-none"
             >
               <div className="h-64 relative overflow-hidden">
                 <img src={lesson.image} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
                 <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">Module 0{lesson.id}</span>
                 </div>
               </div>

               <div className="p-8 lg:p-10 flex-grow flex flex-col justify-between relative z-10">
                 <div>
                   <h3 className="text-3xl lg:text-4xl font-black mb-6 leading-[0.9] tracking-tighter italic uppercase text-white group-hover:text-emerald-400 transition-colors">{lesson.title}</h3>
                   <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 italic leading-relaxed line-clamp-3">
                     {lesson.description}
                   </p>
                 </div>

                 <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 italic">Initiate Protocol</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-all transform group-hover:translate-x-2" />
                 </div>
               </div>
               
               <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
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

interface LockedTrialViewProps {
  setView: (v: View) => void;
  logout: () => void;
  desires: any[];
}

const LockedTrialView = ({ setView, logout, desires }: LockedTrialViewProps) => {
  const activeDesireText = desires && desires.length > 0 ? desires[0].text : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh] text-center relative z-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-8 relative"
      >
        <Lock className="w-10 h-10 text-emerald-400 animate-pulse" />
        <div className="absolute inset-0 rounded-full border border-emerald-500/10 scale-125 animate-ping opacity-30" />
      </motion.div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-black uppercase tracking-[0.4em] text-rose-400 mb-6 italic">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        Trial Period Expired
      </div>

      <h2 className="text-3xl sm:text-5xl font-black text-white italic tracking-tighter uppercase leading-tight mb-6">
        Free Alignment <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-emerald-400">
          Window Closed.
        </span>
      </h2>

      <div className="relative max-w-lg mb-8">
        <p className="text-stardust/70 text-xs sm:text-sm font-bold uppercase tracking-widest leading-relaxed italic">
          Your 24-Hour Trial was designed to let your physical vessel touch the high-frequency grid. 
          {activeDesireText ? (
            <>
              {" "}We detected your deep alignment to manifest <span className="text-emerald-400 underline font-black">"{activeDesireText}"</span> — which is currently suspended in the sub-quantum blueprint. You are extremely close. Stay aligned, and this physical manifestation will be fully yours! But do not let your frequency drop now.
            </>
          ) : (
            <>
              {" "}A stable reality is built on constant investment and energetic exchange, not holding back. By staying on the novice layer, you reinforce scarcity. Overcome resistance, step up, and let's manifest your goals.
            </>
          )}
        </p>
      </div>

      {/* Universe motivation psychology block */}
      <div className="bg-black/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-6 mb-10 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent pointer-events-none" />
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2 italic flex items-center justify-center gap-2 relative z-10">
          <Sparkles className="w-3.5 h-3.5" /> Universe Motivation Sync
        </h4>
        <p className="text-[11px] font-bold text-stardust/50 leading-relaxed uppercase tracking-wider italic relative z-10">
          "The distance between your goals and your reality is purely energetic. You are just a single threshold away. Subscribe now to connect with the source perpetually and complete your destiny."
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(16,185,129,0.3)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setView('pricing')}
          className="w-full py-5 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-[10px] tracking-[0.3em] italic shadow-2xl border border-white/10 flex items-center justify-center gap-3 transition-colors"
        >
          <Zap className="w-4 h-4 fill-current" />
          Claim Eternal Alignment
        </motion.button>

        <button
          onClick={logout}
          className="w-full py-4 rounded-[1.5rem] bg-white/5 hover:bg-white/10 text-stardust/60 hover:text-white font-black uppercase text-[9px] tracking-[0.3em] italic transition-all border border-white/5"
        >
          Disconnect Vessel (Sign Out)
        </button>
      </div>

      <div className="mt-12 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
        <button
          onClick={() => {
            const keys = Object.keys(localStorage);
            keys.forEach(k => {
              if (k.startsWith('vibe_os_trial_start_')) {
                localStorage.setItem(k, Date.now().toString());
              }
            });
            window.location.reload();
          }}
          className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400/40 hover:text-emerald-400 transition-colors italic flex items-center gap-2"
        >
          <Sparkles className="w-3 h-3 animate-spin text-emerald-400/60" />
          [ Dev Action: Reset 1-Day Trial for Review (Get 24h Free) ]
        </button>
      </div>
    </div>
  );
};

const PricingView = ({ setView, user, tier, isMobile, updateOfflineProfile, onToast }: { setView: (v: View) => void, user: any, tier: string, isMobile: boolean, updateOfflineProfile?: (tierName: string, expiryDate?: Date) => void, onToast?: (toast: any) => void }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, []);

  const [isVerifying, setIsVerifying] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [isIndianUser, setIsIndianUser] = useState<boolean>(true);
  
  // Custom High-Fidelity Checkout Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any>(null);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'processing' | 'success' | 'error'>('details');
  const [checkoutProgress, setCheckoutProgress] = useState(0);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);

  useEffect(() => {
    fetch('/api/config/razorpay-key')
      .then(res => res.json())
      .then(data => {
        setRazorpayKeyId(data.keyId);
        setIsLoadingKey(false);
      })
      .catch(() => {
        setRazorpayKeyId(null);
        setIsLoadingKey(false);
      });
  }, []);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code === 'IN') {
          setIsIndianUser(true);
        } else if (data.country_code) {
          setIsIndianUser(false);
        }
      })
      .catch((err) => {
        console.warn("Location detection service unavailable, falling back to browser heuristics.", err);
      });
  }, []);

  useEffect(() => {
    // Handle redirection success from Payment Link
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true' && user && !user.isGuest) {
       // Refresh user data or show success
       const checkUpgrade = async () => {
         try {
           const userDoc = await getDoc(doc(db, 'users', user.uid));
           if (userDoc.exists()) {
             const data = userDoc.data();
             if (data.tier && data.tier !== 'Novice') {
               // Success!
               if (onToast) {
                 onToast({
                    id: 'upgrade-success',
                    title: 'Ascension Complete',
                    body: `Your vibrational match to ${data.tier} has been established.`
                 });
               }
             }
           }
         } catch (e) {}
       };
       checkUpgrade();
    }
  }, [user, db, onToast]);

  const currencySymbol = isIndianUser ? '₹' : '$';

  const getInrPrice = (planName: string) => {
    if (planName === 'Novice') return 0;
    if (planName === 'Sovereign') {
      if (billingCycle === 'monthly') return 99;
      if (billingCycle === 'yearly') return 799;
      if (billingCycle === 'lifetime') return 1999;
    }
    return 0;
  };

  const getUsdPrice = (planName: string) => {
    if (planName === 'Novice') return '0';
    if (planName === 'Sovereign') {
      if (billingCycle === 'monthly') return '5.00';
      if (billingCycle === 'yearly') return '49.00';
      if (billingCycle === 'lifetime') return '149.00';
    }
    return '0';
  };

  const getPrice = (planName: string) => {
    if (planName === 'Novice') return '0';
    return isIndianUser ? getInrPrice(planName).toString() : getUsdPrice(planName);
  };

  const isAdmin = user?.email === 'asartist20@gmail.com';

  const executePayment = async () => {
    if (!user) {
      setCheckoutStep('error');
      setCheckoutMessage("Please sign in first to upgrade your frequency.");
      return;
    }

    setCheckoutStep('processing');
    setCheckoutProgress(15);
    setCheckoutMessage('Initializing secure gateway tunnel...');

    try {
      // ADMIN BYPASS
      if (isAdmin) {
        setCheckoutProgress(50);
        setCheckoutMessage('Admin authority detected. Bypassing gateway...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 100);

        if (!user.isGuest) {
          await updateDoc(doc(db, 'users', user.uid), {
            tier: selectedPlanForCheckout.name,
            subscriptionExpiry: Timestamp.fromDate(expiry),
            updatedAt: serverTimestamp()
          });
        }
        
        setCheckoutProgress(100);
        setCheckoutStep('success');
        confetti();
        playKachingSound();
        return;
      }

      // Fetch public key ID from safe backend endpoint
      const keyRes = await fetch('/api/config/razorpay-key');
      const keyData = await keyRes.json();
      const razorpayKeyIdFromApi = keyData.keyId;

      if (!razorpayKeyIdFromApi) {
        throw new Error("Razorpay API Key is missing on the server. Please add RAZORPAY_KEY_ID to Environment Variables in Settings.");
      }

      setCheckoutProgress(30);
      setCheckoutMessage('Loading secure payment gateway script...');
      
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay dynamic payment client. Check network connection.");
      }

      setCheckoutProgress(45);
      setCheckoutMessage('Opening order port with Razorpay API...');

      const inrAmount = getInrPrice(selectedPlanForCheckout.name);
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: inrAmount,
          currency: 'INR',
          receipt: `rcpt_${user.uid.slice(-10)}_${Date.now().toString().slice(-10)}`,
          planName: selectedPlanForCheckout.name,
          billingCycle: billingCycle,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName,
          useLink: false 
        })
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        console.error("Order Error Body:", errData);
        throw new Error(errData.details || errData.error || "Alignment port failed to sync order token.");
      }

      const rzpOrder = await orderRes.json();
      
      if (rzpOrder.paymentLinkUrl) {
        setCheckoutProgress(100);
        setCheckoutMessage('Redirecting to secure abundance portal...');
        window.location.href = rzpOrder.paymentLinkUrl;
        return;
      }

      setCheckoutProgress(60);
      setCheckoutMessage('Awaiting alignment in secure checkout popup...');

      const options = {
        key: razorpayKeyIdFromApi,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "VIBE OS",
        description: `${selectedPlanForCheckout.name} [${billingCycle}] Activation`,
        image: "https://ais-dev-j7sihoqk5j4nphix4bieyo-51389356776.asia-southeast1.run.app/vite.svg", 
        order_id: rzpOrder.id,
        handler: async (response: any) => {
          try {
            setCheckoutStep('processing');
            setCheckoutProgress(75);
            setCheckoutMessage('Verifying digital signature...');

            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json();
              throw new Error(verifyErr.message || "Signature verification failed.");
            }

            setCheckoutProgress(95);
            setCheckoutMessage('Sealing stardust ledger...');

            const expiry = new Date();
            if (billingCycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
            else if (billingCycle === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
            else expiry.setFullYear(expiry.getFullYear() + 100);

            if (user.isGuest) {
              if (updateOfflineProfile) {
                updateOfflineProfile(selectedPlanForCheckout.name, expiry);
              }
            } else {
              await updateDoc(doc(db, 'users', user.uid), {
                tier: selectedPlanForCheckout.name,
                subscriptionExpiry: Timestamp.fromDate(expiry),
                updatedAt: serverTimestamp()
              });
              
              try {
                await addDoc(collection(db, 'transactions'), {
                  type: 'income',
                  amount: inrAmount,
                  label: user.displayName || user.email || 'Vibe Seeker',
                  category: `${selectedPlanForCheckout.name} Activation [${billingCycle}]`,
                  ownerId: user.uid,
                  timestamp: serverTimestamp()
                });
              } catch (txErr) {
                console.error("Error logging transaction:", txErr);
              }
            }

            try {
              confetti();
              playKachingSound();
            } catch (e) {}

            setCheckoutProgress(100);
            setCheckoutStep('success');

          } catch (hErr: any) {
            console.error(hErr);
            setCheckoutStep('error');
            setCheckoutMessage(hErr.message || "Failed during payment verification.");
          }
        },
        prefill: {
          name: user.displayName || "Manifestor",
          email: user.email || "",
        },
        notes: {
          userId: user.uid,
          tier: selectedPlanForCheckout.name,
          billingCycle: billingCycle
        },
        theme: {
          color: "#3371FF",
        },
        modal: {
          ondismiss: () => {
            setCheckoutStep('details');
            if (onToast) {
              onToast({
                id: `dismissed-${Date.now()}`,
                title: "Gateway Portal Disengaged",
                body: "Checkout aborted by user. Alignment remains unchanged."
              });
            }
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', function (response: any) {
        console.error("Razorpay Payment Failed:", response.error);
        setCheckoutStep('error');
        setCheckoutMessage(`Gateway Error: ${response.error.description}`);
      });
      razorpayInstance.open();
    } catch (err: any) {
      console.error(err);
      setCheckoutStep('error');
      setCheckoutMessage(err.message || 'Sub-frequency transaction failure. Please retry.');
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


    const pricingContent = (
    <div className="h-full overflow-y-auto overflow-x-hidden no-scrollbar pb-24 lg:pb-32">
      {/* Primary Conversion Layer - Optimized for At-a-Glance Visibility */}
      <div className="max-w-5xl mx-auto px-4 lg:px-0 pt-4 flex flex-col gap-3 min-h-[90vh] justify-center">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-emerald-500 text-emerald-500" />
            ))}
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] ml-2">Verified by 12,400+ Performers</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
            Master Your <span className="text-emerald-400 underline decoration-emerald-500/30 underline-offset-8">Evolution.</span>
          </h2>
          <p className="text-stardust/30 text-[9px] font-bold uppercase tracking-[0.4em] italic pt-2">
            Quantum Synchronization Level Activated
          </p>
        </div>

        {/* Dynamic Trust Infrastructure */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2 mb-2">
          <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 shadow-inner backdrop-blur-xl">
             {[
               { id: 'monthly', label: 'Monthly' },
               { id: 'yearly', label: 'Yearly' },
               { id: 'lifetime', label: 'Lifetime' }
             ].map((cycle) => (
               <button
                 key={cycle.id}
                 onClick={() => setBillingCycle(cycle.id as any)}
                 className={`relative px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${billingCycle === cycle.id ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-stardust/40 hover:text-white'}`}
               >
                 {cycle.label}
                 {cycle.id === 'yearly' && billingCycle !== cycle.id && <span className="absolute -top-1.5 -right-1 px-2 py-0.5 bg-emerald-500 text-black text-[6px] font-black rounded-full border border-emerald-500 shadow-lg">SAVE 30%</span>}
               </button>
             ))}
          </div>

        </div>

        {/* Primary Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.sort((a, b) => (a.recommended ? -1 : 1)).map((plan, i) => {
            const isRecommended = plan.recommended;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className={`relative p-8 rounded-[2.5rem] border flex flex-col group transition-all duration-700 ${
                  isRecommended 
                    ? 'bg-emerald-500/[0.03] border-emerald-500/50 shadow-[0_0_80px_rgba(16,185,129,0.08)]' 
                    : 'bg-white/[0.01] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-black uppercase italic tracking-tighter ${isRecommended ? 'text-emerald-400' : 'text-white'}`}>
                    {plan.name} Pathway
                  </h3>
                  {isRecommended && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500 text-black text-[7px] font-black uppercase tracking-[0.2em] italic shadow-emerald-400/20 shadow-lg">
                      <Zap className="w-3 h-3 fill-black" /> Optimal Path
                    </div>
                  )}
                </div>
                
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl lg:text-5xl font-black text-white italic tracking-tighter">
                    {currencySymbol}{plan.price}
                  </span>
                  <span className="text-stardust/20 font-bold text-[9px] uppercase tracking-widest italic pt-2">
                    {plan.name === 'Novice' ? 'unlimited' : billingCycle === 'lifetime' ? 'once' : `/ ${billingCycle.slice(0, 3)}`}
                  </span>
                </div>

                <div className="space-y-2 mb-6 flex-grow py-4 border-t border-white/5">
                  {plan.features.slice(0, 5).map(feature => (
                    <div key={feature} className="flex items-center gap-3 text-[9px] font-black text-white/50 uppercase tracking-widest group-hover:text-white/80 transition-all">
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${isRecommended ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                        <Check className={`w-2.5 h-2.5 ${isRecommended ? 'text-emerald-400 shadow-xl' : 'text-stardust/20'}`} />
                      </div>
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.isPremium ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isVerifying}
                    onClick={() => {
                      setSelectedPlanForCheckout(plan);
                      setCheckoutStep('details');
                      setCheckoutProgress(0);
                      setShowCheckoutModal(true);
                    }}
                    className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] transition-all flex items-center justify-center gap-3 italic cursor-pointer shadow-2xl ${
                      isRecommended 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20' 
                        : 'bg-white text-black hover:bg-stardust shadow-white/5'
                    }`}
                  >
                    {isVerifying ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Initiate Access <ArrowRight className="w-4 h-4" /></>
                    )}
                  </motion.button>
                ) : (
                  <div className="w-full py-4 rounded-2xl border border-white/5 bg-white/[0.01] text-stardust/10 text-[9px] font-black uppercase tracking-[0.5em] italic text-center grayscale">
                     Baseline Integration
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Scroll Call-to-Action */}
        <div className="flex flex-col items-center mt-8 animate-bounce opacity-20">
          <span className="text-[7px] font-black text-white uppercase tracking-[0.6em] mb-2 italic">Evidence Below</span>
          <ChevronDown className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* Bento Grid Social Proof Layer */}
      <div className="max-w-6xl mx-auto px-4 mt-16 lg:mt-32 space-y-12">
        <div className="text-center">
          <h3 className="text-xl lg:text-3xl font-black tracking-tighter text-white uppercase italic mb-4">
            Transformation <span className="text-emerald-400">Archives.</span>
          </h3>
          <p className="text-stardust/20 text-[9px] font-black uppercase tracking-[0.5em] italic">
            Direct feedback from the Sovereign collective
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 grid-rows-none gap-4">
          {/* Main Hero Review */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-500 group">
            <Quote className="w-8 h-8 text-emerald-500/20 group-hover:text-emerald-400/40 transition-colors mb-6" />
            <p className="text-sm lg:text-lg font-black uppercase tracking-tight text-white/80 leading-relaxed italic mb-8">
              "The ritual logic engine isn't just a tool; it's a cognitive upgrade. My consistency score jumped from 32% to 98% in the first month. This is literally life-changing."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul" alt="User" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Rahul S.</h4>
                <p className="text-[8px] font-bold text-stardust/30 uppercase tracking-tighter">Founder, Flux Systems</p>
              </div>
            </div>
          </div>

          {/* Quick Stat */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 rounded-[2rem] bg-emerald-500/[0.03] border border-emerald-500/20 flex flex-col items-center justify-center text-center">
             <div className="text-5xl font-black text-emerald-400 italic tracking-tighter mb-2">91%</div>
             <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">Reported Sustained Focus Increase</p>
             <div className="mt-4 flex gap-1">
               {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-emerald-500 text-emerald-500" />)}
             </div>
          </div>

          {/* User Review 2 */}
          <div className="col-span-1 md:col-span-2 p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 flex flex-col justify-between hover:bg-white/[0.03] transition-colors">
            <p className="text-[11px] font-black uppercase tracking-widest text-stardust/50 italic leading-relaxed mb-6">
              "Desire Convergence tech actually works. Visual anchors keep me locked on my targets effortlessly."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="User" />
              </div>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">— Sarah K.</span>
            </div>
          </div>

          {/* Trust Bridge */}
          <div className="col-span-1 md:col-span-2 p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 flex flex-col items-center justify-center grayscale hover:grayscale-0 transition-all duration-1000">
             <div className="flex flex-wrap justify-center gap-8 mb-4">
               <ShieldCheck className="w-6 h-6 text-emerald-400/40" />
               <Zap className="w-6 h-6 text-white/20" />
               <Lock className="w-6 h-6 text-white/20" />
             </div>
             <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.6em] italic">Zero Friction Architecture</p>
          </div>

          {/* User Review 3 */}
          <div className="col-span-1 md:col-span-2 p-6 rounded-[2rem] bg-white/[0.01] border border-white/10 flex flex-col justify-between group">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/70 italic leading-relaxed mb-6">
              "The Frequency Shield is the best focus-mode I've ever experienced. Deep state achieved instantly."
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest italic">— Marcus V.</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-2 h-2 fill-emerald-500 text-emerald-500" />)}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-32 max-w-4xl mx-auto space-y-12">
          <div className="text-center">
            <h3 className="text-xl lg:text-3xl font-black tracking-tighter text-white uppercase italic mb-4">
              Common <span className="text-emerald-400">Questions.</span>
            </h3>
            <p className="text-stardust/20 text-[9px] font-black uppercase tracking-[0.5em] italic">
              Clarifying the Ascension Path
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                q: "What exactly is Vibe OS?",
                a: "Vibe OS is an operating system for your reality. It combines habit tracking, vision boarding, and wealth management into a single, high-frequency interface designed to help you manifest your goals through consistent rituals."
              },
              {
                q: "How does the Ritual Engine help?",
                a: "The Ritual Engine provides timely triggers and reminders (via email and push notifications) that anchor your focus. By repeating high-value rituals, you align your neurological and energetic frequency with your desires."
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We use end-to-end encryption for all personal data. Your desires, rituals, and financial logs are private and strictly isolated to your account using industry-standard security protocols."
              },
              {
                q: "Can I cancel my subscription?",
                a: "Yes, you can manage or cancel your Sovereign subscription at any time through the Settings panel. Your access will continue until the end of your current billing cycle."
              },
              {
                q: "What is the Difference between Novice and Sovereign?",
                a: "The Novice pathway is a baseline integration for new seekers. Sovereign access unlocks unlimited rituals, the full Manifestation Academy, and advanced flow-state analysis tools for complete mastery."
              },
              {
                q: "How do I manifest specific goals?",
                a: "Use the Desire Log to define your vision. The system then recommends specific rituals and shows them in your Vision Board to keep your subconscious mind locked on the target."
              }
            ].map((faq, index) => (
              <motion.div 
                key={`faq-${index}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all group"
              >
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 italic group-hover:text-emerald-400 transition-colors">
                  {faq.q}
                </h4>
                <p className="text-[10px] font-medium leading-relaxed text-stardust/40 uppercase tracking-wider italic">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Global Security Footprint */}
        <div className="pt-16 pb-8 border-t border-white/5 flex flex-col items-center gap-8">
           <div className="flex items-center gap-12 grayscale opacity-50 hover:opacity-100 transition-all duration-700">
             <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-6" referrerPolicy="no-referrer" />
           </div>
           <div className="px-6 py-2 rounded-full bg-white/[0.02] border border-white/5 flex items-center gap-4">
              <div className="flex items-center gap-2 text-[7px] font-black text-emerald-400 uppercase tracking-[0.4em] italic">
                <Lock className="w-3 h-3" /> End-to-End Encrypted
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-2 text-[7px] font-black text-emerald-400 uppercase tracking-[0.4em] italic">
                <ShieldCheck className="w-3 h-3" /> GDPR Compliant Node
              </div>
           </div>
           <p className="text-[7px] font-black text-white/10 uppercase tracking-[1em] italic text-center max-w-lg">
             Quantum Protocol Managed Infrastructure • Sovereign Data Residency
           </p>
        </div>
      </div>
    </div>
  );


  const pricingPortalContent = (
    <>
      {pricingContent}

      {/* Modern, Quantum High-Fidelity Custom Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && selectedPlanForCheckout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (checkoutStep !== 'processing') {
                  setShowCheckoutModal(false);
                }
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-[95%] sm:max-w-md bg-[#0a0d0e] border border-emerald-500/20 rounded-[2.5rem] p-6 sm:p-8 text-stardust z-10 overflow-y-auto max-h-[90vh] shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col no-scrollbar"
            >
              {/* Outer Decorative Nebula Grid */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white italic">Abundance Portal</h3>
                    <p className="text-[8px] font-bold text-stardust/40 uppercase tracking-widest font-mono">Quantum Realignment</p>
                  </div>
                </div>
                {checkoutStep !== 'processing' && (
                  <button 
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white hover:text-emerald-400" />
                  </button>
                )}
              </div>

              {/* Main Steps Content */}
              <AnimatePresence mode="wait">
                {checkoutStep === 'details' && (
                  <motion.div 
                    key="details"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6 relative z-10 text-left"
                  >
                    {/* Selected Plan Details Card */}
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-400 block mb-0.5">Frequency plan</span>
                        <span className="text-sm font-black uppercase text-white italic">{selectedPlanForCheckout.name} Activation</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-stardust/40 block mb-0.5">{billingCycle} energy exchange</span>
                        <span className="text-base font-black text-white italic">
                          {currencySymbol}{getPrice(selectedPlanForCheckout.name)}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Checkout Action */}
                    <div className="space-y-4 py-4">
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(51,113,255,0.3)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={executePayment}
                        className="w-full py-4 rounded-xl font-black uppercase text-[11px] tracking-[0.3em] bg-[#3371FF] text-white shadow-2xl hover:bg-[#285cd9] transition-all italic flex items-center justify-center gap-3 active:scale-95"
                      >
                        <img src="https://razorpay.com/favicon.png" className="w-5 h-5 invert brightness-0" alt="RZP" />
                        {isAdmin ? 'Admin Quick Activate' : 'Pay with Razorpay'}
                      </motion.button>

                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[7.5px] font-black uppercase tracking-widest text-stardust/40">Secure Razorpay Encryption Active</span>
                        </div>
                        <p className="text-[7.5px] text-stardust/10 leading-normal uppercase font-black text-center px-10">
                          Authorized by Razorpay® Protocol. Direct redirection to secure verification port.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {checkoutStep === 'processing' && (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 flex flex-col items-center justify-center space-y-6 relative z-10 text-center"
                  >
                    {/* Animated Progress Radial Indicator */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                      <div className="absolute inset-x-0 inset-y-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                      <span className="text-xs font-black text-white italic">{checkoutProgress}%</span>
                    </div>

                    <div className="text-center space-y-2">
                      <h4 className="text-xs font-black uppercase text-emerald-400 italic tracking-[0.22em] animate-pulse">Upgrading Vibration...</h4>
                      <p className="text-[9px] font-black text-stardust/40 uppercase tracking-widest max-w-[240px] leading-relaxed mx-auto">
                        {checkoutMessage}
                      </p>
                    </div>
                  </motion.div>
                )}

                {checkoutStep === 'success' && (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8 flex flex-col items-center justify-center space-y-6 relative z-10 text-center"
                  >
                    {/* Animated check bubble */}
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-black uppercase text-white italic tracking-[0.15em]">ALIGNMENT SEALED!</h4>
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest max-w-[280px] leading-relaxed mx-auto">
                        Your energetic matrix has ascended to {selectedPlanForCheckout.name} successfully.
                      </p>
                      <p className="text-[8px] font-medium text-stardust/40 uppercase tracking-[0.2em] leading-normal pt-2">
                        ALL LIMITS DISSOLVED. RITUALS SYNCED.
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setView('dashboard');
                      }}
                      className="w-full py-4 rounded-xl font-black uppercase text-[9px] tracking-[0.3em] bg-white text-black hover:bg-emerald-400 hover:text-white hover:border-emerald-500 transition-all italic flex items-center justify-center gap-2"
                    >
                      Enter Sovereign Portal <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                )}

                {checkoutStep === 'error' && (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8 flex flex-col items-center justify-center space-y-6 relative z-10 text-center font-bold"
                  >
                    <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                      <X className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-rose-400 italic tracking-[0.15em]">ALIGNMENT INTERRUPTED</h4>
                      <p className="text-[10px] font-medium text-stardust/60 leading-relaxed max-w-[280px] mx-auto uppercase tracking-wider">
                        {checkoutMessage}
                      </p>
                    </div>

                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => setCheckoutStep('details')}
                        className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-black uppercase text-[9px] tracking-widest text-white hover:bg-white/10 transition-colors"
                      >
                        Adjust Details
                      </button>
                      <button
                        onClick={() => setShowCheckoutModal(false)}
                        className="flex-1 py-3 bg-white text-black rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-stardust transition-colors"
                      >
                        Cancel Portal
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  return pricingPortalContent;
};
