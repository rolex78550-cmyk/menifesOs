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
  Star
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

  const handleManifest = async () => {
    if (!goal) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, currentChallenges: challenges })
      });
      const data = await response.json();
      setSuggestions(data);
      setSelectedRituals(data.rituals.map((_: any, i: number) => i)); // Select all by default
      setStep(3);
    } catch (error) {
      console.error("Onboarding analysis failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeOnboarding = async () => {
    if (!suggestions || !user) return;
    setIsLoading(true);
    try {
      // 1. Add selected rituals to habits collection
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

      // 2. Update user profile
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        hasCompletedOnboarding: true,
        manifestationGoal: goal,
        onboardingAffirmation: suggestions.affirmation,
        updatedAt: serverTimestamp()
      });

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
    <div className="fixed inset-0 z-[1000] bg-cosmic-black flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl bg-cosmic-void border border-white/5 rounded-[3rem] p-12 text-center relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-5xl font-black italic tracking-tighter text-white mb-6 uppercase">
                Initialize <br /> <span className="text-emerald-400">Resonance</span>
              </h1>
              <p className="text-stardust/60 text-lg mb-10 max-w-md mx-auto">
                Welcome to Vibe OS. Let's begin by aligning your energy. What do you wish to manifest?
              </p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {categories.map((cat) => (
                  <button
                    key={`cat-${cat.label}`}
                    onClick={() => {
                        setGoal(cat.label);
                        setStep(2);
                    }}
                    className={`flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-left group`}
                  >
                    <div className={`p-3 rounded-xl ${cat.bg}`}>
                      <cat.icon className={`w-5 h-5 ${cat.color}`} />
                    </div>
                    <span className="font-black uppercase tracking-tighter text-xs text-white group-hover:translate-x-1 transition-transform">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setStep(2)}
                className="text-stardust/40 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
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
            className="w-full max-w-2xl bg-cosmic-void border border-white/5 rounded-[3rem] p-12 relative overflow-hidden"
          >
            <div className="relative z-10">
              <button 
                onClick={() => setStep(1)}
                className="absolute top-0 right-0 text-stardust/40 hover:text-white transition-colors p-2"
              >
                Back
              </button>
              
              <h2 className="text-3xl font-black italic tracking-tighter text-white mb-8 uppercase">
                The <span className="text-emerald-400">Vision</span>
              </h2>

              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stardust/40 mb-3 ml-1">
                    Primary Goal
                  </label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Example: Manifesting $10k/month income through consistent high-value actions..."
                    className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-white text-lg placeholder:text-stardust/20 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all resize-none h-32"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stardust/40 mb-3 ml-1">
                    Current Blockages (Optional)
                  </label>
                  <input
                    type="text"
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder="What is holding you back?"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-white font-medium placeholder:text-stardust/20 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  />
                </div>

                <button 
                  onClick={handleManifest}
                  disabled={!goal || isLoading}
                  className="w-full bg-white text-black p-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:bg-emerald-400 hover:text-white"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Calibrate Energy <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && suggestions && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-3xl bg-cosmic-void border border-white/5 rounded-[3rem] p-12 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
                  <ShieldCheck className="w-3 h-3" /> Alignment Verified
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter text-white mb-4 uppercase">
                  Suggested <span className="text-emerald-400">Rituals</span>
                </h2>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 inline-block max-w-sm">
                   <p className="text-stardust/80 text-sm font-medium italic">"{suggestions.affirmation}"</p>
                </div>
              </div>

              <div className="space-y-4 mb-10 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
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
                    className={`p-6 rounded-3xl border transition-all cursor-pointer group ${
                      selectedRituals.includes(i) 
                      ? 'bg-emerald-500/5 border-emerald-500/30' 
                      : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <h4 className="text-white font-black uppercase text-xs tracking-wider">{ritual.name}</h4>
                           <span className="text-[9px] font-black uppercase text-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 rounded-full">{ritual.reminderTime}</span>
                        </div>
                        <p className="text-stardust/40 text-xs leading-relaxed">{ritual.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                        selectedRituals.includes(i) ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                      }`}>
                        {selectedRituals.includes(i) && <CheckCircle2 className="w-4 h-4 text-black" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button 
                onClick={finalizeOnboarding}
                disabled={isLoading}
                className="w-full bg-white text-black p-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-98 transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Accept & Open Dashboard <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
