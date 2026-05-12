/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent, MouseEvent, FormEvent } from 'react';
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
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType, testConnection } from './lib/firebase';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Zap, 
  BookOpen, 
  Wallet, 
  Settings, 
  Plus, 
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
  CreditCard,
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
  Activity,
  Waves
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// --- Types ---
type View = 'dashboard' | 'manifest' | 'habits' | 'vision' | 'academy' | 'pricing' | 'frequency' | 'sonic';

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
}

interface FrequencyLog {
  id: string;
  level: number; // 1-10
  mood: string;
  note: string;
  date: string;
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

const Sidebar = ({ currentView, setView }: { currentView: View, setView: (v: View) => void }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Omni View' },
    { id: 'manifest', icon: Target, label: 'Desire Log' },
    { id: 'habits', icon: Zap, label: 'Rituals' },
    { id: 'frequency', icon: Activity, label: 'Frequency' },
    { id: 'sonic', icon: Waves, label: 'Sonic' },
    { id: 'vision', icon: ImageIcon, label: 'Vision Board' },
    { id: 'academy', icon: Library, label: 'Academy' },
    { id: 'pricing', icon: Wallet, label: 'Upgrade' },
  ];

  return (
    <div className="w-full lg:w-64 lg:border-r border-white/5 lg:h-screen flex lg:flex-col px-4 py-3 lg:p-6 fixed bottom-0 lg:top-0 left-0 bg-cosmic-black/95 lg:bg-cosmic-void/80 backdrop-blur-3xl z-50 overflow-x-auto lg:overflow-x-hidden border-t lg:border-t-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] lg:shadow-none">
      <div className="hidden lg:flex items-center gap-3 mb-12">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-white/40">
          <Sparkles className="w-4 h-4 text-cosmic-black" />
        </div>
        <span className="font-black text-xl tracking-tighter text-stardust">ManifestOS</span>
      </div>

      <nav className="flex lg:flex-col gap-1 lg:gap-2 flex-grow min-w-max lg:min-w-0 items-center lg:items-stretch">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView(item.id as View)}
            className={`flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-xl text-[10px] lg:text-sm font-black lg:font-bold transition-all whitespace-nowrap lg:whitespace-normal group ${
              currentView === item.id 
                ? 'bg-white text-cosmic-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                : 'text-stardust/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 lg:w-4 lg:h-4 ${currentView === item.id ? 'animate-pulse' : ''}`} />
            <span className="block uppercase tracking-tighter lg:tracking-normal lg:normal-case">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      <div className="hidden lg:block pt-6 border-t border-white/5">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-stardust/40 text-sm font-bold hover:text-stardust transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
};

const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#000105]">
      {/* Deep Space Dust Layers */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      
      {/* Infinite Star Field - Far Layer */}
      <div className="absolute inset-[-100vh] animate-star-move" style={{ '--duration': '200s' } as any}>
        {[...Array(100)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              top: `${Math.random() * 200}%`,
              left: `${Math.random() * 100}%`,
              width: '1px',
              height: '1px',
            }}
          />
        ))}
      </div>

      {/* Infinite Star Field - Mid Layer */}
      <div className="absolute inset-[-100vh] animate-star-move" style={{ '--duration': '100s' } as any}>
        {[...Array(60)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white opacity-40 animate-pulse-slow"
            style={{
              top: `${Math.random() * 200}%`,
              left: `${Math.random() * 100}%`,
              width: '1.5px',
              height: '1.5px',
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Infinite Star Field - Close Layer */}
      <div className="absolute inset-[-100vh] animate-star-move" style={{ '--duration': '50s' } as any}>
        {[...Array(30)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white opacity-60"
            style={{
              top: `${Math.random() * 200}%`,
              left: `${Math.random() * 100}%`,
              width: '2px',
              height: '2px',
            }}
          />
        ))}
      </div>

      {/* Gargantua Black Hole System */}
      <div className="absolute -bottom-40 -left-40 lg:-bottom-60 lg:-left-60 w-[50rem] h-[50rem] lg:w-[80rem] lg:h-[80rem] opacity-70">
        
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

      {/* Shooting Stars */}
      <div className="absolute top-0 right-0 w-full h-full opacity-60">
        <div className="absolute top-[10%] left-[85%] w-[1px] h-[120px] bg-gradient-to-t from-white/40 to-transparent rotate-[215deg] animate-shooting-star" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[40%] left-[95%] w-[1px] h-[200px] bg-gradient-to-t from-white/60 to-transparent rotate-[215deg] animate-shooting-star" style={{ animationDelay: '12s' }} />
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [desires, setDesires] = useState<Desire[]>([]);
  const [visionItems, setVisionItems] = useState<VisionItem[]>([]);
  const [frequencyLogs, setFrequencyLogs] = useState<FrequencyLog[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const mainContainerRef = useRef<HTMLElement>(null);
  
  // Audio State
  const [activeHz, setActiveHz] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const toggleFrequency = (hz: number) => {
    if (activeHz === hz) {
      stopFrequency();
      return;
    }
    playFrequency(hz);
  };

  const playFrequency = (hz: number) => {
    stopFrequency();
    
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
    return () => stopFrequency();
  }, []);

  useEffect(() => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTo(0, 0);
    }
  }, [view]);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
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

  // Sync Frequency Logs
  useEffect(() => {
    if (!user) {
      setFrequencyLogs([]);
      return;
    }
    const q = query(collection(db, 'frequency_logs'), where('ownerId', '==', user.uid), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FrequencyLog));
      setFrequencyLogs(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'frequency_logs'));
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
      const newCompleted = !habit.completed;
      if (newCompleted) {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#f97316', '#ffffff']
        });
      }
      await updateDoc(doc(db, 'habits', id), {
        completed: newCompleted,
        streak: newCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `habits/${id}`);
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

  const addFrequencyLog = async (level: number, mood: string, note: string) => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'frequency_logs'), {
        level,
        mood,
        note,
        date: today,
        ownerId: user.uid,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'frequency_logs');
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
              new Notification(`Sacred Ritual`, {
                body: `Time for your ritual: ${habit.name}. Align your frequency now.`,
                icon: '/vite.svg'
              });
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
        <CosmicBackground />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-white/20 mx-auto mb-8">
            <Sparkles className="w-10 h-10 text-cosmic-black" />
          </div>
          <h1 className="text-4xl lg:text-6xl font-black mb-4 tracking-tighter text-white">ManifestOS</h1>
          <p className="text-stardust/60 font-medium mb-10 leading-relaxed">Synchronize your local frequency with the universal source to begin engineering your reality.</p>
          <button 
            onClick={loginWithGoogle}
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
          desires={desires} 
          visionItems={visionItems} 
          focusIndex={focusIndex}
          setFocusIndex={setFocusIndex}
          toggleHabit={toggleHabit}
          setView={setView}
        />
      );
      case 'manifest': return <ManifestView desires={desires} addDesire={addDesire} removeDesire={removeDesire} toggleDesire={toggleDesire} />;
      case 'habits': return <HabitsView habits={habits} addHabit={addHabit} updateHabit={updateHabit} removeHabit={removeHabit} toggleHabit={toggleHabit} diaryEntries={diaryEntries} addDiaryEntry={addDiaryEntry} />;
      case 'vision': return <VisionBoardView items={visionItems} addItem={addVisionItem} />;
      case 'frequency': return <FrequencyTrackerView logs={frequencyLogs} addLog={addFrequencyLog} />;
      case 'sonic': return <SonicView activeHz={activeHz} onToggle={toggleFrequency} />;
      case 'academy': return <AcademyView />;
      case 'pricing': return <PricingView setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-black text-stardust font-sans flex flex-col lg:flex-row relative overflow-hidden">
      <CosmicBackground />
      
      <Sidebar currentView={view} setView={setView} />
      
      <main ref={mainContainerRef} className="flex-grow lg:ml-64 p-5 md:p-8 lg:p-12 mb-24 lg:mb-0 overflow-y-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 lg:mb-16">
          <div className="w-full lg:w-auto">
            <h1 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-white/60 mb-1 lg:mb-2">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h1>
            <h2 className="text-3xl lg:text-5xl font-black capitalize tracking-tight text-white drop-shadow-md">{view}</h2>
          </div>
          <div className="flex items-center gap-3 lg:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex-grow md:flex-grow-0 bg-white/5 border border-white/10 p-2.5 lg:p-3 rounded-2xl text-stardust/40 focus-within:text-white focus-within:border-white/30 transition-all flex items-center gap-2 min-w-[200px] md:min-w-0">
              <Search className="w-4 h-4" />
              <input type="text" placeholder="Search the void..." className="bg-transparent border-none outline-none text-xs font-bold w-full md:w-40" />
            </div>
            <div className="bg-white/5 border border-white/10 p-2.5 lg:p-3 rounded-2xl text-stardust/40 relative hover:text-stardust hover:bg-white/10 transition-colors cursor-pointer shrink-0" onClick={logout}>
              <X className="w-4 h-4" />
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/10 rounded-2xl overflow-hidden border border-white/10 ring-2 ring-white/10 shrink-0">
               <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Avatar" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
        <Footer />
      </main>

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

const Footer = () => (
  <footer className="max-w-6xl mx-auto px-4 lg:px-0 py-20 border-t border-white/5 mt-20">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 text-center md:text-left">
      <div className="md:col-span-1">
        <h2 className="text-xl font-black italic text-white tracking-tighter mb-4">ManifestOS</h2>
        <p className="text-stardust/20 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
          The definitive interface for quantum reality engineering and vibrational sovereignty.
        </p>
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-8">Navigation</h4>
        <ul className="space-y-4 text-xs font-bold text-stardust/40">
          <li className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest">Rituals</li>
          <li className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest">Density</li>
          <li className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest">Academy</li>
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-8">Legal</h4>
        <ul className="space-y-4 text-xs font-bold text-stardust/40">
          <li className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest underline decoration-white/10">Privacy Policy</li>
          <li className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest underline decoration-white/10">Terms of Service</li>
          <li className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest underline decoration-white/10">Refund Policy</li>
        </ul>
      </div>
      <div className="flex flex-col items-center md:items-end">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-8">System Status</h4>
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          <span className="text-[9px] font-black uppercase text-stardust/60 tracking-tighter">Frequency Stabilized</span>
        </div>
      </div>
    </div>
    <div className="text-center pt-8 border-t border-white/5">
      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10">
        &copy; 2024 ManifestOS | Absolute Creation Engine. Unified Collective Reality.
      </p>
    </div>
  </footer>
);

const SonicView = ({ activeHz, onToggle }: { activeHz: number | null, onToggle: (hz: number) => void }) => {
  const frequencies = [
    { hz: 174, label: "Quantum Foundation", benefit: "Anxiety relief & pain reduction.", description: "The lowest frequency provides a stable foundation for manifestation." },
    { hz: 285, label: "Tissue Regeneration", benefit: "Heals internal organs & energy fields.", description: "Restores the blueprint of homeostatic health." },
    { hz: 396, label: "Fear Dissolver", benefit: "Liberates guilt & removes blockages.", description: "Assists in letting go of past events holding your vibration back." },
    { hz: 417, label: "Change Facilitator", benefit: "Undoing negative situations.", description: "Clears traumatic experiences and facilitates conscious change." },
    { hz: 432, label: "Earth Resonance", benefit: "Universal harmony & deep connection.", description: "Alumni with the mathematical laws of nature." },
    { hz: 528, label: "DNA Repair", benefit: "Transformation & Miracles (Love).", description: "The core miracle frequency representing DNA integrity." },
    { hz: 639, label: "Unified Connection", benefit: "Enhances relationships & harmony.", description: "Promotes communication, understanding, and love." },
    { hz: 741, label: "Conscious Awakening", benefit: "Intuition & cleaner living.", description: "Cleans the cell of toxins and emotional debris." },
    { hz: 852, label: "Divine Order", benefit: "Spiritual awareness & intuition.", description: "Awakens the ability to see through illusions." },
    { hz: 963, label: "God Frequency", benefit: "Oneness & spiritual enlightenment.", description: "Direct connection to source and divine consciousness." }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-0">
      <div className="mb-12">
        <h3 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight text-white italic">The Frequency Vault</h3>
        <p className="text-stardust/40 font-medium leading-relaxed max-w-2xl italic">"If you want to find the secrets of the universe, think in terms of energy, frequency and vibration." — Nikola Tesla</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {frequencies.map((f, i) => (
          <motion.div 
            key={f.hz}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -5, scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggle(f.hz)}
            className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${
              activeHz === f.hz 
                ? 'bg-white border-white shadow-[0_30px_60px_rgba(255,255,255,0.1)]' 
                : 'glass-card border-white/5 hover:border-white/20'
            }`}
          >
            <div className={`absolute -right-10 -top-10 w-40 h-40 blur-[80px] rounded-full transition-opacity ${activeHz === f.hz ? 'bg-cosmic-black/10 opacity-100' : 'bg-white/5 opacity-0 group-hover:opacity-100'}`} />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${activeHz === f.hz ? 'bg-cosmic-black text-white' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white'}`}>
                  {activeHz === f.hz ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-black tracking-tighter ${activeHz === f.hz ? 'text-cosmic-black' : 'text-white'}`}>{f.hz}</span>
                  <span className={`block text-[10px] font-black uppercase tracking-widest ${activeHz === f.hz ? 'text-cosmic-black/40' : 'text-stardust/20'}`}>Hertz</span>
                </div>
              </div>

              <h4 className={`text-xl font-black mb-2 tracking-tight ${activeHz === f.hz ? 'text-cosmic-black' : 'text-white'}`}>{f.label}</h4>
              <p className={`text-xs font-bold uppercase tracking-widest mb-6 ${activeHz === f.hz ? 'text-cosmic-black/60' : 'text-white/60'}`}>{f.benefit}</p>
              
              <p className={`text-[11px] leading-relaxed font-medium italic ${activeHz === f.hz ? 'text-cosmic-black/40' : 'text-stardust/20 text-justify'}`}>
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

const DashboardView = ({ 
  habits, 
  desires, 
  visionItems, 
  focusIndex, 
  setFocusIndex,
  toggleHabit,
  setView
}: { 
  habits: Habit[], 
  desires: Desire[], 
  visionItems: VisionItem[],
  focusIndex: number,
  setFocusIndex: (i: number) => void,
  toggleHabit: (id: string, e?: MouseEvent) => void,
  setView: (v: View) => void
}) => {
  const progress = (habits.filter(h => h.completed).length / habits.length) * 100;
  const activeDesires = desires.filter(d => !d.isAchieved);

  const displayVision = [...visionItems, ...[1, 2, 3, 4].map(idx => ({
    id: `placeholder-${idx}`,
    imageUrl: `https://images.unsplash.com/photo-${idx === 1 ? '1534447677768-be436bb09401' : idx === 2 ? '1506744038136-46273834b3fb' : idx === 3 ? '1460925895917-afdab827c52f' : '1502481851512-e9e2529bbbf9'}?q=80&w=400&auto=format&fit=crop`,
    caption: 'Future Potential'
  }))].slice(0, 4);

  const currentFocus = activeDesires[focusIndex % activeDesires.length] || desires[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
      {/* Daily Progress */}
      <motion.div 
        whileHover={{ scale: 1.01, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.2)' }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setView('habits')}
        className="lg:col-span-2 bg-gradient-to-br from-white/10 via-cosmic-black to-white/5 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 text-white relative overflow-hidden border border-white/5 shadow-2xl cursor-pointer group"
      >
        <div className="relative z-10">
          <h3 className="text-xl lg:text-3xl font-black mb-1.5 lg:mb-2 tracking-tight group-hover:text-white transition-colors">The Universe observes.</h3>
          <p className="text-stardust/60 mb-4 lg:mb-8 max-w-sm ml-0.5 leading-relaxed font-medium text-xs lg:text-base">Your frequency determines your reality. Complete rituals to stabilize your manifestation field.</p>
          <div className="flex items-end gap-6 max-w-md lg:max-w-none">
            <div className="flex-grow">
              <div className="flex justify-between mb-2.5 lg:mb-3 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-stardust/40">
                <span className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-white" /> Alignment Status</span>
                <span className="text-white">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 lg:h-4 bg-white/5 rounded-full p-0.5 lg:p-1 border border-white/5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract Black Hole Effect */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-64 lg:w-96 h-64 lg:h-96 border border-white/5 rounded-full opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-[2s]" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[20rem] lg:w-[28rem] h-[20rem] lg:h-[28rem] border border-white/10 rounded-full opacity-10 pointer-events-none group-hover:scale-125 transition-transform duration-[3s]" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 blur-[120px] rounded-full animate-pulse" />
      </motion.div>

      {/* Focus Area */}
      <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setFocusIndex(focusIndex + 1)}
        className="bg-[#f4e4bc] rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden group cursor-pointer shadow-[5px_5px_15px_rgba(0,0,0,0.3)] border-b-4 border-r-4 border-black/10"
        style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cream-paper.png')` }}
      >
        <div className="flex items-center gap-3 mb-4 lg:mb-6 relative z-10">
          <div className="p-2.5 lg:p-3 bg-black/10 text-black/60 rounded-2xl group-hover:bg-black/20 transition-colors">
            <Target className="w-5 h-5 lg:w-5 lg:h-5" />
          </div>
          <span className="font-black uppercase text-[10px] tracking-[0.2em] text-black/40">Singularity</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFocus?.id || 'empty'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-10"
          >
            <h4 className="text-2xl lg:text-3xl font-script font-bold mb-4 lg:mb-6 text-black/90 leading-tight">"{currentFocus?.text || 'Setting my first intention...'}"</h4>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-center justify-between p-4 lg:p-5 bg-black/5 rounded-2xl border border-black/5 hover:border-black/10 transition-colors">
                <span className="text-[10px] font-black uppercase text-black/40 tracking-widest">Dimension</span>
                <span className="text-[10px] lg:text-xs font-black text-black/60 uppercase tracking-widest">{currentFocus?.category || 'Universal'}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 lg:mt-6 flex items-center justify-between px-2 relative z-10">
          <span className="text-[10px] font-black uppercase text-black/30 tracking-widest">Active Intentions</span>
          <span className="text-sm font-black text-black/70">{activeDesires.length}</span>
        </div>
        {/* Grainy overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      </motion.div>

      {/* Rituals List */}
      <div className="glass-card rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8">
        <h3 
          onClick={() => setView('habits')}
          className="font-black text-[10px] uppercase tracking-[0.25em] text-stardust/40 mb-4 lg:mb-8 flex justify-between items-center cursor-pointer hover:text-white transition-colors"
        >
          Ritual Sync
          <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
        </h3>
        <div className="space-y-3 lg:space-y-5">
          {habits.slice(0, 4).map(habit => (
            <div 
              key={habit.id} 
              onClick={() => toggleHabit(habit.id)}
              className="flex items-center gap-3 lg:gap-4 group cursor-pointer"
            >
              <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-lg border-2 flex items-center justify-center transition-all ${habit.completed ? 'bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-white/10 bg-white/5 group-hover:border-white/50'}`}>
                {habit.completed && <CheckSquare className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-cosmic-black" />}
              </div>
              <span className={`text-xs lg:text-sm font-bold transition-colors ${habit.completed ? 'text-stardust/30' : 'text-stardust/80 group-hover:text-white'}`}>{habit.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 bg-[#4a3728] rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-8 relative overflow-hidden border-b-8 border-black/20 shadow-2xl" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/wood-pattern.png')` }}>
        <div className="flex justify-between items-center mb-5 relative z-10">
          <h3 className="font-black text-[10px] uppercase tracking-[0.25em] text-white/40">Glimpses of Destiny</h3>
          <button onClick={() => setView('vision')} className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors">Manifest Board</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 relative z-10">
          {displayVision.map((item, idx) => (
            <div 
              key={item.id} 
              className="aspect-square bg-[#d4b595] p-1 pb-3 sm:p-1.5 sm:pb-4 rounded-sm shadow-[3px_3px_10px_rgba(0,0,0,0.4)] relative group border-b-2 border-r-2 border-black/10 overflow-hidden"
              style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cardboard.png')` }}
            >
              {/* Push Pin */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-600 rounded-full z-20 shadow-md">
                <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/40 rounded-full" />
              </div>
              
              <div className="w-full h-full relative overflow-hidden rounded-sm">
                <img 
                  src={item.imageUrl} 
                  alt={item.caption} 
                  className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ))}
        </div>
        {/* Wood grain highlight */}
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />
      </div>
    </div>
  );
};

const ManifestView = ({ 
  desires, 
  addDesire, 
  removeDesire, 
  toggleDesire 
}: { 
  desires: Desire[], 
  addDesire: (t: string) => void, 
  removeDesire: (id: string) => void,
  toggleDesire: (id: string) => void 
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
            placeholder="I am so grateful now that..."
            className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-white/30 outline-none font-bold text-stardust placeholder:text-stardust/20"
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className="bg-white text-cosmic-black px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-white/20"
          >
            Declare <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        {desires.map(desire => (
          <motion.div 
            key={desire.id} 
            whileHover={{ scale: 1.005, x: 2 }}
            whileTap={{ scale: 0.995 }}
            onClick={() => toggleDesire(desire.id)}
            className={`p-6 lg:p-10 rounded-sm transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group cursor-pointer shadow-[5px_5px_15px_rgba(0,0,0,0.2)] border-b-2 border-r-2 border-black/10 relative overflow-hidden ${desire.isAchieved ? 'opacity-50 grayscale bg-[#e4d4ac]' : 'bg-[#f4e4bc]'}`}
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

const VisionBoardView = ({ items, addItem }: { items: VisionItem[], addItem: (c: string, u: string) => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!caption || !imageUrl) return;
    addItem(caption, imageUrl);
    setIsAdding(false);
    setCaption('');
    setImageUrl('');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIImage = async () => {
    if (!caption) return;
    setIsGenerating(true);
    // Simulating AI generation using pollinations.ai
    const encodedPrompt = encodeURIComponent(caption);
    const generatedUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1080&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
    
    // We "pre-load" it to show we are generating
    const img = new Image();
    img.src = generatedUrl;
    img.onload = () => {
      setImageUrl(generatedUrl);
      setIsGenerating(false);
    };
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
                        <div className="flex gap-2 shrink-0">
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept="image/*" 
                            className="hidden" 
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 sm:flex-none px-4 sm:px-5 py-3 sm:py-4 bg-white/10 rounded-2xl text-stardust hover:text-white hover:bg-white/20 transition-all font-black uppercase text-[9px] lg:text-[10px] tracking-widest flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Device
                          </button>
                          <button 
                            onClick={generateAIImage}
                            disabled={isGenerating || !caption}
                            className={`flex-1 sm:flex-none px-4 sm:px-5 py-3 sm:py-4 rounded-2xl font-black uppercase text-[9px] lg:text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${isGenerating ? 'bg-white/10 text-stardust/40' : 'bg-white/10 text-white hover:bg-white hover:text-cosmic-black'}`}
                          >
                            {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            {isGenerating ? 'Wait...' : 'AI'}
                          </button>
                        </div>
                      </div>
                      <p className="text-[9px] text-stardust/20 font-medium italic text-center">Tip: You can paste a link, upload from device, or use AI.</p>
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

const HabitsView = ({ 
  habits, 
  addHabit, 
  updateHabit, 
  removeHabit, 
  toggleHabit,
  diaryEntries,
  addDiaryEntry
}: { 
  habits: Habit[], 
  addHabit: (n: string, r: string) => void,
  updateHabit: (id: string, n: string, r: string) => void,
  removeHabit: (id: string) => void,
  toggleHabit: (id: string, e?: MouseEvent) => void,
  diaryEntries: DiaryEntry[],
  addDiaryEntry: (c: string, m: 'free' | '369' | '555') => void
}) => {
  const [tab, setTab] = useState<'rituals' | 'diary'>('rituals');
  const [isAdding, setIsAdding] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [name, setName] = useState('');
  const [reminder, setReminder] = useState('');

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
      <div className="flex gap-4 mb-12">
        <button 
          onClick={() => setTab('rituals')}
          className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${tab === 'rituals' ? 'bg-white text-cosmic-black shadow-xl shadow-white/10' : 'bg-white/5 text-stardust/40 hover:bg-white/10'}`}
        >
          Ritual Matrix
        </button>
        <button 
          onClick={() => setTab('diary')}
          className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${tab === 'diary' ? 'bg-white text-cosmic-black shadow-xl shadow-white/10' : 'bg-white/5 text-stardust/40 hover:bg-white/10'}`}
        >
          Sacred Scripting
        </button>
      </div>

      {tab === 'rituals' ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
            <div>
              <h3 className="text-3xl font-black tracking-tight mb-2 text-white">Sacred Rituals</h3>
              <p className="text-stardust/40 font-medium">Small actions lead to massive shifts. Consistently perform these to align your vibration.</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
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
              <motion.div 
                key={habit.id}
                whileHover={{ scale: 1.01, x: 5, borderColor: 'rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.99 }}
                onClick={() => openEdit(habit)}
                className={`group p-6 lg:p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer flex items-center justify-between ${habit.completed ? 'bg-white/5 border-transparent opacity-50' : 'glass-card border-white/5 hover:border-white/50 shadow-xl'}`}
              >
                <div className="flex items-center gap-4 lg:gap-6">
                  <div 
                    onClick={(e) => toggleHabit(habit.id, e)}
                    className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center transition-all ${habit.completed ? 'bg-white/5 text-stardust/20' : 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'}`}
                  >
                    <Zap className="w-6 h-6 lg:w-7 lg:h-7" />
                  </div>
                  <div>
                    <h4 className={`text-lg lg:text-xl font-bold transition-colors ${habit.completed ? 'line-through text-stardust/30' : 'text-stardust'}`}>{habit.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1">
                        <Flame className="w-3 h-3" /> {habit.streak} STREAK
                      </p>
                      <div className="w-1 h-1 bg-white/10 rounded-full" />
                      {habit.reminderTime ? (
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                          <Bell className="w-2.5 h-2.5" /> {habit.reminderTime}
                        </p>
                      ) : (
                        <p className="text-[10px] font-black text-stardust/20 uppercase tracking-widest">Alignment Active</p>
                      )}
                    </div>
                  </div>
                </div>
                <div 
                  onClick={(e) => toggleHabit(habit.id, e)}
                  className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl border-2 flex items-center justify-center transition-all ${habit.completed ? 'bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-white/10 group-hover:border-white'}`}
                >
                  {habit.completed && <CheckSquare className="w-4 h-4 lg:w-5 lg:h-5 text-cosmic-black" />}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <SacredJournaling entries={diaryEntries} onSave={addDiaryEntry} />
      )}
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

const AcademyView = () => {
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

       {/* Library Shelves Style */}
       <div className="space-y-20 lg:space-y-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20 lg:gap-x-16 relative">
            {/* Shelf Divider */}
            <div className="absolute -bottom-10 left-0 right-0 h-4 bg-black/40 blur-sm rounded-full opacity-50" />
            <div className="absolute -bottom-8 left-0 right-0 h-2 bg-[#333] border-b border-white/5" />

            {lessons.slice(0, 2).map(lesson => (
              <motion.div 
                key={lesson.id} 
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedLesson(lesson)}
                className="group cursor-pointer flex gap-8 items-start"
              >
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
                   <button className="mt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                      <Play className="w-3 h-3 fill-current" /> Open Volume
                   </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20 lg:gap-x-16 relative">
            {/* Shelf Divider */}
            <div className="absolute -bottom-10 left-0 right-0 h-4 bg-black/40 blur-sm rounded-full opacity-50" />
            <div className="absolute -bottom-8 left-0 right-0 h-2 bg-[#333] border-b border-white/5" />

            {lessons.slice(2, 4).map(lesson => (
              <motion.div 
                key={lesson.id} 
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedLesson(lesson)}
                className="group cursor-pointer flex gap-8 items-start"
              >
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
                   <button className="mt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                      <Play className="w-3 h-3 fill-current" /> Open Volume
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
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

const FrequencyTrackerView = ({ logs, addLog }: { logs: FrequencyLog[], addLog: (l: number, m: string, n: string) => void }) => {
  const [level, setLevel] = useState(7);
  const [mood, setMood] = useState('Aligned');
  const [note, setNote] = useState('');

  const moods = [
    { label: 'Enlightened', level: 10 },
    { label: 'Joy', level: 9 },
    { label: 'Love', level: 8 },
    { label: 'Neutral', level: 5 },
    { label: 'Anger', level: 3 },
    { label: 'Fear', level: 2 },
    { label: 'Guilt/Shame', level: 1 },
  ];

  const chartData = logs.map(log => ({
    date: log.date.split('-').slice(1).join('/'),
    level: log.level
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    addLog(level, mood, note);
    setNote('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4 lg:px-0">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-white mb-2">Frequency <span className="text-stardust/40">Density.</span></h2>
            <p className="text-stardust/40 font-medium">Track your vibrational alignment over time.</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 space-y-8 backdrop-blur-xl">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stardust/40">Energy Level (1-10)</label>
                <span className="text-3xl font-black text-white italic">{level}</span>
              </div>
              <input 
                type="range" min="1" max="10" value={level} 
                onChange={(e) => setLevel(parseInt(e.target.value))}
                className="w-full accent-white h-1.5 bg-white/10 rounded-full appearance-none outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-stardust/20 uppercase tracking-widest">
                <span>Low Phase</span>
                <span>Ascendant</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stardust/40">Dominant Resonance</label>
              <div className="flex flex-wrap gap-2">
                {moods.map((m) => (
                  <motion.button
                    key={m.label}
                    type="button"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setMood(m.label); setLevel(m.level); }}
                    className={`px-4 py-2.5 rounded-xl text-[11px] font-black transition-all border uppercase tracking-widest ${
                      mood === m.label 
                        ? 'bg-white text-cosmic-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                        : 'bg-white/5 text-stardust/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {m.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stardust/40">Alignment Context</label>
              <textarea 
                value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="What affected your density today?"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder:text-stardust/20 focus:outline-none focus:border-white/30 transition-all h-32 resize-none font-medium text-sm"
              />
            </div>

            <button type="submit" className="w-full py-5 bg-white text-cosmic-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10">
              Anchor Frequency
            </button>
          </form>
        </div>

        <div className="w-full lg:w-[400px] space-y-6">
          <div className="p-8 lg:p-10 rounded-[2.5rem] bg-white/5 border border-white/5 h-fit backdrop-blur-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stardust/40 mb-10 flex items-center gap-3">
              <Waves className="w-4 h-4" /> Calibration Map
            </h3>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="freqColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#ffffff08" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff20" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    interval="preserveStartEnd"
                    tick={{ fontWeight: 800, letterSpacing: '0.1em' }}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    stroke="#ffffff20" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    ticks={[1, 5, 10]}
                    tick={{ fontWeight: 800 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '20px', padding: '16px' }}
                    labelStyle={{ color: '#ffffff40', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}
                    itemStyle={{ color: '#ffffff', fontSize: '14px', fontWeight: '900' }}
                    cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="level" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#freqColor)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-10 pt-10 border-t border-white/5">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white mb-1">Quantum Insight</p>
                  <p className="text-[9px] font-bold text-stardust/40 leading-relaxed uppercase tracking-tighter">
                    {logs.length > 0 && logs[logs.length-1].level > 7 
                      ? "High density detected. Action time." 
                      : "Stabilize frequency before major rituals."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stardust/40">Frequency Archives</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logs.slice().reverse().map((log, i) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-8 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col justify-between transition-all hover:bg-white/[0.08] hover:border-white/10 group relative overflow-hidden"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black tracking-[0.2em] text-stardust/20 uppercase">{log.date}</span>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
                    <div className={`w-1.5 h-1.5 rounded-full ${log.level > 7 ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,1)]' : log.level > 4 ? 'bg-white/40' : 'bg-white/10'}`} />
                    <span className="text-[10px] font-bold text-white">{log.level}.0</span>
                  </div>
                </div>
                <h4 className="text-2xl font-black text-white italic mb-4 tracking-tighter">"{log.mood}"</h4>
                {log.note && <p className="text-xs font-bold text-stardust/40 line-clamp-3 italic leading-relaxed tracking-tight group-hover:text-stardust/60 transition-colors">"{log.note}"</p>}
              </div>

              {/* Intensity accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PricingView = ({ setView }: { setView: (v: View) => void }) => {
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (plan: any) => {
    const res = await loadRazorpayScript();

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    // Amount in INR for Razorpay (assuming $11 ~= 900 INR, $33 ~= 2700 INR)
    const inrAmount = plan.price === "11" ? 900 : 2700;

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
      alert(orderData.error);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "ManifestOS",
      description: `${plan.name} Tier Manifestation`,
      order_id: orderData.id,
      handler: function (response: any) {
        alert(`Payment Successful! ID: ${response.razorpay_payment_id}. Your frequency is ascending!`);
        setView('dashboard');
      },
      prefill: {
        name: "Seeker",
        email: "seeker@manifestos.com",
      },
      theme: {
        color: "#000000",
      },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
  };

  const plans = [
    {
      name: "Novice",
      price: "0",
      description: "Basic frequency alignment for those starting their journey.",
      features: ["Up to 3 Rituals", "Desire Log Access", "Basic Visualisation Board", "Community Forums"],
      buttonText: "Current Path",
      isPremium: false,
      color: "border-white/10"
    },
    {
      name: "Adept",
      price: "11",
      description: "Amplify your manifestation intensity with advanced protocols.",
      features: ["Unlimited Rituals", "AI Scripting Assistant", "High-Resolution Vision Media", "Priority Synchronization"],
      buttonText: "Synchronize Now",
      isPremium: true,
      color: "border-white/40",
      recommended: true,
      planId: "P-ADEPT_PLAN_ID" // Placeholder: User needs to replace with actual PayPal Subscription Plan ID
    },
    {
      name: "Ascendant",
      price: "33",
      description: "Complete mastery over your reality. Full universal access.",
      features: ["All Adept Features", "Full Academy Access", "Direct Frequency Coaching", "Custom Quantum Mandalas"],
      buttonText: "Achieve Mastery",
      isPremium: true,
      color: "border-stardust/60",
      planId: "P-ASCENDANT_PLAN_ID" // Placeholder: User needs to replace with actual PayPal Subscription Plan ID
    }
  ];

  return (
    <PayPalScriptProvider options={{ 
      "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb", 
      currency: "USD",
      intent: "subscription",
      vault: true
    }}>
      <div className="max-w-6xl mx-auto px-4 lg:px-0 pb-20">
        <div className="mb-16 lg:mb-24 text-center max-w-3xl mx-auto">
          <h3 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-white/40 mb-6 flex items-center justify-center gap-3">
            <Sparkles className="w-4 h-4" /> Infinite Potential
          </h3>
          <h2 className="text-4xl lg:text-7xl font-black tracking-tighter mb-8 text-white drop-shadow-2xl">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-stardust to-white/40">Density.</span>
          </h2>
          <p className="text-stardust/40 text-lg lg:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
            Investing in your frequency is the only way to shorten the gap between intention and manifestation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 lg:p-12 rounded-[2.5rem] border backdrop-blur-3xl flex flex-col justify-between group transition-all duration-500 hover:scale-[1.02] ${
                plan.recommended 
                  ? 'bg-white/10 border-white/30 shadow-[0_30px_100px_rgba(255,255,255,0.05)]' 
                  : 'bg-white/5 border-white/5 hover:bg-white/[0.07]'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-cosmic-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl z-20">
                  Most Aligned
                </div>
              )}

              <div>
                <div className="mb-8">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-stardust/40 mb-2">{plan.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl lg:text-5xl font-black text-white italic">${plan.price}</span>
                    <span className="text-stardust/20 font-bold">/ cycle</span>
                  </div>
                </div>

                <p className="text-stardust/60 text-sm font-medium mb-10 leading-relaxed min-h-[3rem]">
                  {plan.description}
                </p>

                <div className="space-y-4 mb-12">
                  {plan.features.map(feature => (
                    <div key={feature} className="flex items-center gap-3 text-xs lg:text-sm font-bold text-stardust/80">
                      <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                        <ChevronRight className="w-3 h-3 text-white" />
                      </div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {plan.isPremium ? (
                <div className="relative z-10 space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRazorpayPayment(plan)}
                    className="w-full py-4 bg-[#230051] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-[#230051]/20 border border-white/5 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" /> Pay with Razorpay
                  </motion.button>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/5"></div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-white/20 italic">Global Access</span>
                    <div className="h-px flex-1 bg-white/5"></div>
                  </div>

                  <div className="paypal-button-container">
                    <PayPalButtons 
                      style={{ layout: "vertical", shape: "pill", label: "subscribe", color: "white" }}
                    createSubscription={(data, actions) => {
                      return actions.subscription.create({
                        plan_id: plan.planId!
                      });
                    }}
                    onApprove={async (data, actions) => {
                      alert(`Subscription initiated! ID: ${data.subscriptionID}. Your frequency is ascending!`);
                      setView('dashboard');
                    }}
                  />
                </div>
              </div>
            ) : (
                <button
                  className="w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white/5 text-white/40 cursor-default border border-white/5"
                >
                  {plan.buttonText}
                </button>
              )}

              {/* Glowing background hint */}
              <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-[100px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity ${
                plan.recommended ? 'bg-white' : 'bg-stardust'
              }`} />
            </motion.div>
          ))}
        </div>

        <div className="mt-20 lg:mt-32 p-10 lg:p-16 rounded-[3rem] bg-gradient-to-br from-white/10 to-transparent border border-white/5 text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white mb-8 border border-white/10">
              <Zap className="w-8 h-8 fill-white" />
            </div>
            <h3 className="text-2xl lg:text-4xl font-black tracking-tight text-white mb-4">Enterprise Manifestation?</h3>
            <p className="text-stardust/40 font-medium max-w-lg mb-10">We engineer custom vibration solutions for teams, organizations, and high-frequency collectives.</p>
            <button className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white hover:text-stardust transition-colors">
              Contact the Architect <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/[0.02] blur-3xl rounded-full" />
        </div>
      </div>
    </PayPalScriptProvider>
  );
};
