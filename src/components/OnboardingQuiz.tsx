import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Target, 
  Heart, 
  Wallet, 
  Highlighter, 
  Loader2, 
  CheckCircle2, 
  Plus,
  ShieldCheck,
  Star,
  ChevronLeft
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface OnboardingQuizProps {
  user: any;
  onComplete: () => void;
}

interface SuggestedRitual {
  name: string;
  description: string;
  reminderTime: string;
  category: string;
  frequency: string;
}

export const OnboardingQuiz = ({ user, onComplete }: OnboardingQuizProps) => {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [challenges, setChallenges] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ rituals: SuggestedRitual[], affirmation: string } | null>(null);
  const [selectedRituals, setSelectedRituals] = useState<number[]>([]);
  
  // High-performance progression loading indicators for cosmic calibration
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationMessage, setCalibrationMessage] = useState('');

  const generateDynamicRituals = (goalText: string, challengesText: string) => {
    const goalVal = goalText.trim();
    const rawChallenges = challengesText.trim();
    const challengesVal = rawChallenges || "distraction and busy narrative loops";
    
    const lowerGoal = goalVal.toLowerCase();
    
    // Choose core focused category
    let category = 'Personal';
    if (lowerGoal.match(/(wealth|money|financial|abundance|income|cash|dollar|rupee|invest|million|billion|rich|affluence)/)) {
      category = 'Wealth';
    } else if (lowerGoal.match(/(job|career|salary|recruit|hire|work|business|startup|promotion|productivity|focus)/)) {
      category = 'Career';
    } else if (lowerGoal.match(/(health|body|gym|fitness|diet|disease|cure|sick|muscle|sleep|weight|run|energy|nutrition|somatic)/)) {
      category = 'Health';
    } else if (lowerGoal.match(/(love|relationship|date|friend|family|partner|marriage|romance|connection)/)) {
      category = 'Personal';
    }

    const goalSummary = goalVal.length > 40 ? goalVal.substring(0, 38) + "..." : goalVal;
    
    const rituals: SuggestedRitual[] = [
      {
        name: `Core ${category} Visualization`,
        description: `Sit comfortably and visualize your goal: "${goalSummary}". Retain this image clearly for 5 minutes, focusing on the relief and joy of its physical manifestation. Let any blockages related to "${challengesVal}" dissolve completely.`,
        reminderTime: "08:15",
        category: category,
        frequency: "Daily"
      },
      {
        name: `Decisive Action Vector`,
        description: `Perform one high-impact, intentional choice today that directly advances you toward "${goalSummary}". Focus fully on this primary action with absolute momentum, ignoring all other minor demands.`,
        reminderTime: "11:00",
        category: category,
        frequency: "Daily"
      },
      {
        name: `Subconscious Grid Scripting`,
        description: `Write down your central declaration 3 times in a notepad or journal in positive present-tense: "I am fully aligned with ${goalSummary}." Breathe in the feeling of success as you script.`,
        reminderTime: "21:30",
        category: category,
        frequency: "Daily"
      }
    ];

    let affirmation = `I am a deliberate co-creator of my reality. My core frequency is synchronized with "${goalSummary}", allowing manifestation with complete ease.`;
    if (category === 'Wealth') {
      affirmation = `Unbounded financial abundance is my natural state of alignment. I open the valves of prosperity and accept "${goalSummary}" into my reality.`;
    } else if (category === 'Career') {
      affirmation = `My actions are structured, purposeful, and clear. Every day, I move closer to "${goalSummary}" with flawless, effortless focus.`;
    } else if (category === 'Health') {
      affirmation = `My bodily container resides in perfect cellular vibrance and strength. I honor my physical vessel and nurture it towards "${goalSummary}".`;
    }

    return { rituals, affirmation };
  };

  const handleManifest = async () => {
    if (!goal) return;
    setIsLoading(true);
    setStep(4); // Trigger the "Holographic Resonance Calibration" screen step!
    setCalibrationProgress(0);
    setCalibrationMessage('Connecting to sub-quantum frequency fields...');

    let resolvedSuggestions: { rituals: SuggestedRitual[], affirmation: string } | null = null;
    let apiCompleted = false;

    // Trigger API call concurrently to keep it dynamic, but do not block UX!
    fetch('/api/gemini/manifest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, currentChallenges: challenges })
    })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.rituals)) {
            resolvedSuggestions = data;
          }
        }
      })
      .catch((err) => {
        console.warn("API calibration failed, switching to dynamic client-side resonance parsing.", err);
      })
      .finally(() => {
        apiCompleted = true;
      });

    const messages = [
      'Scanning primary intention vectors...',
      'Opening energetic calibration chambers...',
      'Dissolving localized frequency friction...',
      'Synthesizing 3 custom high-frequency rituals...',
      'Harmonizing affirmation resonance...'
    ];

    let currentProgress = 0;
    const intervalTime = 16; // 60 FPS update
    const speed = 1.8; // Takes about 900ms to load fully

    const timer = setInterval(() => {
      currentProgress += speed + Math.random() * 1.2;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(timer);
        
        // If API wasn't successful or hasn't finished, generate beautiful customized localized rituals instantly!
        if (!resolvedSuggestions) {
          resolvedSuggestions = generateDynamicRituals(goal, challenges);
        }

        setSuggestions(resolvedSuggestions);
        setSelectedRituals(resolvedSuggestions.rituals.map((_, i) => i));
        setIsLoading(false);
        setStep(3); // Go directly to suggested rituals card view
      } else {
        setCalibrationProgress(Math.floor(currentProgress));
        const index = Math.min(messages.length - 1, Math.floor((currentProgress / 100) * messages.length));
        setCalibrationMessage(messages[index]);
      }
    }, intervalTime);
  };

  const finalizeOnboarding = async () => {
    if (!suggestions || !user) return;
    setIsLoading(true);
    try {
      if (user.isGuest) {
        // Guest user local storage persistence matching App.tsx keys
        const savedHabitsStr = localStorage.getItem('vibe_os_guest_habits');
        const habits = savedHabitsStr ? JSON.parse(savedHabitsStr) : [];
        const ritualsToAdd = suggestions.rituals.filter((_, i) => selectedRituals.includes(i));
        
        const newHabits = [
          ...habits,
          ...ritualsToAdd.map((ritual, idx) => ({
            id: 'guest_habit_' + Date.now() + '_' + idx,
            name: ritual.name,
            description: ritual.description,
            reminderTime: ritual.reminderTime,
            category: ritual.category === 'Wealth' ? 'Wealth' : ritual.category === 'Health' ? 'Health' : ritual.category === 'Career' ? 'Career' : 'Personal',
            completed: false,
            streak: 0,
            frequency: ritual.frequency || 'Daily',
            createdAt: new Date().toISOString()
          }))
        ];
        localStorage.setItem('vibe_os_guest_habits', JSON.stringify(newHabits));

        // Save Goal into Desires collection as well
        const savedDesiresStr = localStorage.getItem('vibe_os_guest_desires');
        const desires = savedDesiresStr ? JSON.parse(savedDesiresStr) : [];
        const newDesires = [
          {
            id: 'guest_desire_' + Date.now(),
            text: goal,
            category: ritualsToAdd[0]?.category || 'Personal',
            isAchieved: false,
            date: new Date().toLocaleDateString()
          },
          ...desires
        ];
        localStorage.setItem('vibe_os_guest_desires', JSON.stringify(newDesires));

        // Save onboarding completed in profile
        const savedProfileStr = localStorage.getItem('vibe_os_guest_profile');
        const profile = savedProfileStr ? JSON.parse(savedProfileStr) : {};
        const updatedProfile = {
          ...profile,
          hasCompletedOnboarding: true,
          manifestationGoal: goal,
          onboardingAffirmation: suggestions.affirmation,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('vibe_os_guest_profile', JSON.stringify(updatedProfile));
      } else {
        // Logged-in Cloud Firebase storage persistence
        const habitsCol = collection(db, 'habits');
        const ritualsToAdd = suggestions.rituals.filter((_, i) => selectedRituals.includes(i));
        
        for (const ritual of ritualsToAdd) {
          await addDoc(habitsCol, {
            name: ritual.name,
            description: ritual.description,
            reminderTime: ritual.reminderTime,
            category: ritual.category === 'Wealth' ? 'Wealth' : ritual.category === 'Health' ? 'Health' : ritual.category === 'Career' ? 'Career' : 'Personal',
            completed: false,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            streak: 0,
            frequency: ritual.frequency || 'Daily'
          });
        }

        // Save Goal to Database Desires as well
        const desiresCol = collection(db, 'desires');
        await addDoc(desiresCol, {
          text: goal,
          category: ritualsToAdd[0]?.category || 'Personal',
          isAchieved: false,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          date: new Date().toLocaleDateString()
        });

        // Update user profile completion state
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          hasCompletedOnboarding: true,
          manifestationGoal: goal,
          onboardingAffirmation: suggestions.affirmation,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      onComplete();
    } catch (error) {
      console.error("Failed to finalize onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { label: 'Financial Abundance', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Radical Health', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Peak Performance', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Inner Peace', icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-cosmic-black/95 flex items-center justify-center p-3 overflow-y-auto font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#c5a880]/5 blur-[120px] rounded-full animate-pulse-slow font-sans" style={{ animationDelay: '2s' }} />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-xl bg-cosmic-void/90 border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 text-center relative overflow-hidden backdrop-blur-xl shadow-2xl my-auto"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-emerald-500/20">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter text-white mb-4 sm:mb-6 uppercase">
                Initialize <br /> <span className="text-emerald-400 font-serif">Resonance</span>
              </h1>
              <p className="text-stardust/60 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
                Welcome to Vibe OS. Let's align your energy frequencies. What do you wish to manifest?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {categories.map((cat) => (
                  <button
                    key={`cat-${cat.label}`}
                    onClick={() => {
                        setGoal(cat.label);
                        setStep(2);
                    }}
                    className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 active:scale-98 transition-all text-left group"
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${cat.bg}`}>
                      <cat.icon className={`w-4.5 h-4.5 ${cat.color}`} />
                    </div>
                    <span className="font-black uppercase tracking-wider text-[10px] text-white group-hover:translate-x-1 transition-transform">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setStep(2)}
                className="text-stardust/40 text-[9px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors py-2 block mx-auto"
              >
                Custom Manifestation →
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-xl bg-cosmic-void/90 border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden backdrop-blur-xl shadow-2xl my-auto"
          >
            <div className="relative z-10 animate-fade-in">
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all cursor-pointer h-10 select-none touch-manipulation focus:outline-none shrink-0"
                >
                  <ChevronLeft className="w-4 h-4 text-emerald-400" /> Back
                </button>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 italic select-none">
                  Step 2 of 3
                </div>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white mb-6 sm:mb-8 uppercase">
                The <span className="text-emerald-400 font-serif">Vision</span>
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-stardust/40 mb-2 ml-1">
                    Primary Goal
                  </label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Example: Manifesting $10k/month income through consistent high-value actions..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 text-white text-base placeholder:text-stardust/20 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all resize-none h-28"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-stardust/40 mb-2 ml-1">
                    Current Blockages (Optional)
                  </label>
                  <input
                    type="text"
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder="What is holding you back? (e.g. distraction, consistency)"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 text-white font-medium placeholder:text-stardust/20 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all text-sm sm:text-base"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={handleManifest}
                    disabled={!goal}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white p-4.5 sm:p-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_45px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:outline-none"
                  >
                    <span>Calibrate Energy</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="calibrating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-xl bg-cosmic-void/90 border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden backdrop-blur-xl shadow-2xl my-auto text-center flex flex-col items-center justify-center min-h-[350px]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.03] to-transparent pointer-events-none" />
            
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/20 animate-spin-slow" />
                <div className="absolute inset-2 rounded-full border border-emerald-500/40 animate-pulse" />
                <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] animate-ping" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-mono font-black text-emerald-400 tracking-wider">
                    {calibrationProgress}%
                  </span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black italic tracking-tighter text-white uppercase mb-3 leading-none">
                Resonance <span className="text-emerald-400 font-serif">Calibration</span>
              </h3>
              
              <p className="text-stardust/60 text-xs uppercase tracking-widest font-black min-h-[1.5rem] antialiased">
                {calibrationMessage}
              </p>

              <div className="w-full max-w-xs h-1.5 bg-white/5 rounded-full mt-6 overflow-hidden p-[1px] border border-white/5 relative">
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                  style={{ width: `${calibrationProgress}%` }}
                />
              </div>

              <div className="mt-8 flex items-center gap-4 text-[8px] font-mono font-black text-white/20 uppercase tracking-[0.2em] italic">
                <span>FREQ: 432HZ</span>
                <span>•</span>
                <span>VECTOR: ACTIVE</span>
                <span>•</span>
                <span>VIBE.OS v2.5</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && suggestions && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-2xl bg-cosmic-void/90 border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden backdrop-blur-xl shadow-2xl my-auto"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <button 
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all cursor-pointer h-10 select-none touch-manipulation focus:outline-none shrink-0 animate-fade-in"
                >
                  <ChevronLeft className="w-4 h-4 text-emerald-400" /> Back
                </button>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 italic select-none">
                  Align Verified
                </div>
              </div>

              <div className="mb-6 sm:mb-8 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-3">
                  <ShieldCheck className="w-3 h-3" /> Alignment Verified
                </div>
                <h2 className="text-2xl sm:text-3.5xl font-black italic tracking-tighter text-white mb-3 uppercase">
                  Suggested <span className="text-emerald-400 font-serif">Rituals</span>
                </h2>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 inline-block w-full max-w-md">
                   <p className="text-stardust/80 text-xs sm:text-sm font-medium italic">"{suggestions.affirmation}"</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 sm:mb-8 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                {suggestions.rituals.map((ritual, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={`ritual-${ritual.name}-${i}`}
                    onClick={() => {
                      if (selectedRituals.includes(i)) {
                        setSelectedRituals(selectedRituals.filter(id => id !== i));
                      } else {
                        setSelectedRituals([...selectedRituals, i]);
                      }
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
                      selectedRituals.includes(i) 
                      ? 'bg-emerald-500/5 border-emerald-500/30' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                           <h4 className="text-white font-black uppercase text-[11px] tracking-wider break-words flex-1">{ritual.name}</h4>
                           <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full font-mono">{ritual.reminderTime}</span>
                        </div>
                        <p className="text-stardust/50 text-[11px] leading-relaxed break-words">{ritual.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                        selectedRituals.includes(i) ? 'bg-emerald-500 border-emerald-500 hover:scale-105' : 'border-white/20'
                      }`}>
                        {selectedRituals.includes(i) && <CheckCircle2 className="w-3 h-3 text-black" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button 
                type="button"
                onClick={finalizeOnboarding}
                disabled={isLoading}
                className="w-full bg-white text-black p-4.5 sm:p-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-2.5 hover:bg-emerald-400 hover:text-white disabled:opacity-50 transition-all duration-300 shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-[0.98] cursor-pointer focus:outline-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-emerald-400" />
                    <span>Activating Resonance...</span>
                  </>
                ) : (
                  <>
                    <span>Accept & Open Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

