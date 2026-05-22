import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Infinity, 
  Target, 
  Zap, 
  ImageIcon, 
  Wallet, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CinematicTourProps {
  onComplete: () => void;
}

const steps = [
  {
    id: 'intro',
    title: "VIBE CONTINUUM",
    subtitle: "PHASE 01: INITIALIZATION",
    description: "Welcome to the ultimate reality alignment engine. Experience your life in high frequency.",
    icon: Infinity,
    color: "#10b981", // emerald
    bgVideo: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-deep-space-deep-space-atmosphere-443-large.mp4"
  },
  {
    id: 'omni',
    title: "OMNI DASHBOARD",
    subtitle: "COMMAND CENTER",
    description: "Monitor your multidimensional metrics. Track streaks, goals, and universal alignment in real-time.",
    icon: Compass,
    color: "#3b82f6", // blue
    bgVideo: "https://assets.mixkit.co/videos/preview/mixkit-abstract-flowing-blue-and-purple-ink-41221-large.mp4"
  },
  {
    id: 'desire',
    title: "DESIRE MATRIX",
    subtitle: "MANIFESTATION",
    description: "Code your future. Script your reality using sacred techniques to bridge the gap between dream and truth.",
    icon: Target,
    color: "#f59e0b", // amber
    bgVideo: "https://assets.mixkit.co/videos/preview/mixkit-gold-dust-particles-moving-in-the-air-443-large.mp4"
  },
  {
    id: 'rituals',
    title: "SACRED RITUALS",
    subtitle: "HABITS & FLOW",
    description: "Seal your frequencies with daily rituals. Build consistency and unlock divine chimes upon completion.",
    icon: Zap,
    color: "#10b981", // emerald
    bgVideo: "https://assets.mixkit.co/videos/preview/mixkit-green-nebula-in-space-low-quality-443-large.mp4"
  },
  {
    id: 'vision',
    title: "VISION VECTOR",
    subtitle: "SUBCONSCIOUS",
    description: "Visualize the outcome. A high-contrast dream board to anchor your visual cortex to your destiny.",
    icon: ImageIcon,
    color: "#ec4899", // pink
    bgVideo: "https://assets.mixkit.co/videos/preview/mixkit-pink-smoke-clouds-on-a-black-background-443-large.mp4"
  },
  {
    id: 'flow',
    title: "WEALTH FLOW",
    subtitle: "ABUNDANCE",
    description: "Manage monetary energy. Map transactions and visualize your material resources in a state of eternal growth.",
    icon: Wallet,
    color: "#3b82f6", // blue
    bgVideo: "https://assets.mixkit.co/videos/preview/mixkit-abstract-liquid-gold-waves-flowing-443-large.mp4"
  }
];

export default function CinematicTour({ onComplete }: CinematicTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsFinishing(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b']
    });
    setTimeout(onComplete, 1000);
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[1000] bg-black text-white flex flex-col items-center justify-center overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-40 mix-blend-screen"
          >
            <source src={step.bgVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-4xl px-8 text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="space-y-4"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              key={step.id + '-icon'}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.8 }}
              className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/20 backdrop-blur-2xl flex items-center justify-center shadow-2xl"
              style={{ boxShadow: `0 0 50px ${step.color}20` }}
            >
              <step.icon className="w-12 h-12" style={{ color: step.color }} />
            </motion.div>
          </div>

          <motion.p
            key={step.subtitle}
            initial={{ opacity: 0, letterSpacing: "0.2em" }}
            animate={{ opacity: 1, letterSpacing: "0.6em" }}
            className="text-[10px] font-black uppercase text-stardust/40 italic"
          >
            {step.subtitle}
          </motion.p>
          
          <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none min-h-[1.2em]">
            <AnimatePresence mode="wait">
              <motion.span
                key={step.title}
                initial={{ opacity: 0, y: 20, skewX: 10 }}
                animate={{ opacity: 1, y: 0, skewX: 0 }}
                exit={{ opacity: 0, y: -20, skewX: -10 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="inline-block"
              >
                {step.title.split(' ').map((word, i) => (
                  <span key={i} className={i === 1 && step.id !== 'intro' ? 'text-stardust/40' : ''}>
                    {word}{' '}
                  </span>
                ))}
              </motion.span>
            </AnimatePresence>
          </h2>

          <div className="max-w-2xl mx-auto pt-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={step.description}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-lg md:text-xl font-medium text-stardust/60 leading-relaxed italic"
              >
                {step.description}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="flex flex-col items-center gap-8">
          <div className="flex gap-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentStep ? 'w-12 bg-white' : 'w-2 bg-white/10'
                }`}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="group relative px-12 py-5 bg-white text-black rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] overflow-hidden flex items-center gap-4 shadow-2xl hover:shadow-[0_20px_50px_rgba(255,255,255,0.2)] transition-all"
          >
            <span className="relative z-10">
              {currentStep === steps.length - 1 ? "INITIALIZE SYSTEM" : "NEXT SEQUENCE"}
            </span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/20 to-emerald-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </motion.button>
          
          <button 
            onClick={handleComplete}
            className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors"
          >
            Skip Initialization
          </button>
        </div>
      </div>

      {/* Decorative scanning line */}
      <div className="absolute inset-x-0 h-px bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.3)] animate-scan z-20 pointer-events-none" />
      
      {/* Corner Data Indicators */}
      <div className="absolute top-10 left-10 text-[10px] font-mono text-white/20 space-y-1 text-left hidden md:block">
        <p>COORDINATES: UNKNOWN</p>
        <p>FREQUENCY: 528HZ ACTIVE</p>
        <p>SYSTEM_STATUS: OK</p>
      </div>

      <div className="absolute bottom-10 right-10 text-[10px] font-mono text-white/20 space-y-1 text-right hidden md:block">
        <p>VIBE_OS VERSION 2.4.0</p>
        <p>© {new Date().getFullYear()} CONTINUUM LABS</p>
      </div>
    </div>
  );
}
