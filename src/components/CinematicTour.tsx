import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Compass, 
  Activity, 
  CheckCircle2, 
  Coins, 
  BookOpen, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  User,
  Zap
} from 'lucide-react';

interface CinematicTourProps {
  onComplete: () => void;
}

export default function CinematicTour({ onComplete }: CinematicTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to VibeOS",
      subtitle: "A High-Frequency Consciousness Terminal",
      description: "Step into a sanctuary where science meets spiritual momentum. VibeOS is custom-engineered to synchronize your daily rituals, clarify your aspirations, and measure somatic focus with flawless visual grace.",
      badge: "Inception Vector",
      imageTheme: "from-[#F3F0EC] to-[#E5E0D8]",
      icon: Compass,
      iconColor: "text-[#8C7A6B]",
      accentBg: "bg-[#8C7A6B]/10",
      features: [
        "Real-time celestial state diagnostics",
        "Aesthetic light-filled visual focus modes",
        "Somatic alignment indicators"
      ]
    },
    {
      title: "Cosmic Manifestation Hub",
      subtitle: "Calibrate and Materialize Your Visions",
      description: "Our manifestation calibration engine maps your deepest coordinates. Enter your target statements and let the system run sub-quantum harmonic parsing to engineer custom, bio-synchronized rituals.",
      badge: "Quantum Intent",
      imageTheme: "from-[#EDF2F4] to-[#D9E2EC]",
      icon: Sparkles,
      iconColor: "text-emerald-600",
      accentBg: "bg-emerald-500/10",
      features: [
        "AI-curated circadian ritual structures",
        "Progressive holographic frequency calibration",
        "Daily tailored cosmic affirmation triggers"
      ]
    },
    {
      title: "Sacred Habit Tracker",
      subtitle: "Establish High-Frequency Daily Milestones",
      description: "Consistency is key to permanent neuro-linguistic alignment. Sculpt your atomic systems, keep logs of positive routines, and document somatic check-ins with frictionless, rewarding interactions.",
      badge: "Somatic Velocity",
      imageTheme: "from-[#FFF5F5] to-[#FEE2E2]",
      icon: Activity,
      iconColor: "text-rose-500",
      accentBg: "bg-rose-500/10",
      features: [
        "Dynamic logging with streak multipliers",
        "Somatic check-ins capturing emotional state",
        "Weekly frequency chart visualization"
      ]
    },
    {
      title: "Celestial Wealth Flow",
      subtitle: "Track Infinite Abundance Energetics",
      description: "View financial prosperity not as numbers, but as dynamic energy. Record transactions, audit incoming cash flows, and cultivate a posture of unlimited bounty using premium grid metrics.",
      badge: "Abundance Matrix",
      imageTheme: "from-[#FEFCBF] to-[#FEF08A]",
      icon: Coins,
      iconColor: "text-amber-600",
      accentBg: "bg-amber-500/10",
      features: [
        "Dynamic incoming & outgoing energy ratios",
        "Abundance velocity indicators",
        "Financial vibration presets for tracking stability"
      ]
    },
    {
      title: "Spiritual Bio-Academy",
      subtitle: "Unlock Sacred Knowledge & Formulas",
      description: "Immerse yourself in elite bio-hacking, ancient frequency alignments, vibrational health studies, and professional wealth mechanics designed to fast-track your energetic progression.",
      badge: "Cosmic Intelligence",
      imageTheme: "from-[#F0FDF4] to-[#DCFCE7]",
      icon: BookOpen,
      iconColor: "text-teal-600",
      accentBg: "bg-teal-500/10",
      features: [
        "High-value lessons on circadian pacing",
        "Sacred geometric insights & focus guidelines",
        "Exclusive downloadable micro-guidelines"
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 md:p-10 select-none overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -10 }}
        className="relative w-full max-w-4xl bg-white text-slate-900 rounded-[2.5rem] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] duration-300 border border-slate-100 flex flex-col md:flex-row min-h-[520px]"
      >
        {/* Left Interactive / Decorative Theme Block */}
        <div className={`w-full md:w-[42%] bg-gradient-to-br ${step.imageTheme} p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden transition-colors duration-500`}>
          {/* Decorative grid for top-tier visual styling */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />
          
          <div className="relative z-10">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${step.accentBg} ${step.iconColor} text-[9px] font-black uppercase tracking-widest font-mono mb-6`}>
              <Zap className="w-3 h-3 animate-pulse" /> {step.badge}
            </span>
          </div>

          <div className="relative z-10 my-auto flex flex-col items-center text-center">
            <motion.div 
              key={currentStep}
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-white shadow-lg flex items-center justify-center border border-slate-100/50 mb-6`}
            >
              <StepIcon className={`w-12 h-12 ${step.iconColor}`} />
            </motion.div>

            <motion.div
              key={`text-${currentStep}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-1 font-mono">
                System Feature
              </h4>
              <p className="text-xl font-bold font-serif italic text-slate-800 leading-tight">
                {step.subtitle}
              </p>
            </motion.div>
          </div>

          <div className="relative z-10 flex items-center justify-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentStep === idx 
                    ? `w-6 ${step.iconColor.replace('text-', 'bg-')}` 
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Info & Navigation Block */}
        <div className="w-full md:w-[58%] p-8 sm:p-12 flex flex-col justify-between bg-white relative">
          
          {/* Close button that works flawlessly and immediately */}
          <button 
            type="button"
            onClick={onComplete}
            className="absolute top-6 right-6 p-2 rounded-full text-slate-450 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer touch-manipulation focus:outline-none"
            title="Skip Tour"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="my-auto">
            {/* Top title area */}
            <motion.div
              key={`content-title-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2 block font-mono">
                MODULE {currentStep + 1} OF {steps.length}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-sans mb-4 leading-tight">
                {step.title}
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 antialiased">
                {step.description}
              </p>
            </motion.div>

            {/* Micro layout for specific key feature bullets */}
            <motion.div
              key={`bullets-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-3 mb-8"
            >
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono mb-3">
                Key Performance Indicators
              </h5>
              {step.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-0.5 ${step.accentBg}`}>
                    <CheckCircle2 className={`w-4 h-4 ${step.iconColor}`} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 font-sans">
                    {feat}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Action buttons that are fully touch sensitive and robust for mobile */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer h-11 select-none touch-manipulation focus:outline-none"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all duration-300 cursor-pointer h-11 select-none touch-manipulation focus:outline-none hover:shadow-md ${
                currentStep === steps.length - 1 
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              <span>{currentStep === steps.length - 1 ? "Begin Integration" : "Next Module"}</span>
              {currentStep === steps.length - 1 ? (
                <Flame className="w-4 h-4 animate-bounce" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
