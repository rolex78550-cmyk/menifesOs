import { motion } from 'motion/react';
import { Lock, Sparkles, Zap, ArrowRight, ShieldCheck, Heart, Infinity } from 'lucide-react';

interface SubscriptionLockProps {
  onUpgrade: () => void;
  isAdmin?: boolean;
}

export const SubscriptionLock = ({ onUpgrade, isAdmin }: SubscriptionLockProps) => {
  if (isAdmin) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-cosmic-black/95 backdrop-blur-2xl"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-cosmic-void border border-white/5 rounded-[3rem] p-10 shadow-2xl text-center overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 blur-3xl rounded-full" />
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
            <Lock className="w-10 h-10 text-emerald-400" />
          </div>

          <h2 className="text-4xl font-black italic text-white tracking-tighter mb-4 uppercase">
            Frequency <br /> <span className="text-emerald-400">Restricted</span>
          </h2>
          
          <p className="text-stardust/60 text-base leading-relaxed mb-10 font-medium">
            Your 24-hour celestial trial session has concluded. To sustain your momentum and continue your manifestation journey, please activate the resonance protocol.
          </p>

          <div className="space-y-4 mb-10">
            <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
              <Zap className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <p className="text-xs font-black text-white uppercase italic">Unlimited Rituals</p>
                <p className="text-[10px] text-stardust/40 uppercase tracking-widest">No resets, pure momentum</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
              <Heart className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <p className="text-xs font-black text-white uppercase italic">Priority Manifestation</p>
                <p className="text-[10px] text-stardust/40 uppercase tracking-widest">Exclusive high-freq access</p>
              </div>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUpgrade}
            className="w-full group relative overflow-hidden bg-white text-black p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-white/5 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center justify-center gap-3 group-hover:text-white transition-all duration-300">
              Upgrade Ceremony <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          <p className="mt-8 text-[9px] font-black uppercase tracking-[0.3em] text-stardust/20">
            Locked by Vibe OS Protocol • Node 3000
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
