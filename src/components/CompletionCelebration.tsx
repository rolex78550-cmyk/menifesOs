import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { loaMessages } from '../lib/loaMessages';

interface CompletionCelebrationProps {
  scoreIncreased?: boolean;
  onDismiss: () => void;
}

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  scoreIncreased = true,
  onDismiss,
}) => {
  const [randomMessage, setRandomMessage] = useState('');
  const [showMessageCard, setShowMessageCard] = useState(false);

  // Generate 50 particles with random offsets, dimensions, and styling
  const [particles] = useState(() => {
    return Array.from({ length: 50 }).map((_, idx) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 250 + 100; // Speed of propagation
      return {
        id: idx,
        size: Math.floor(Math.random() * 5) + 4, // 4px to 8px
        color: Math.random() > 0.5 ? '#F59E0B' : '#8B5CF6', // Gold or Purple
        x: Math.random() * 600 - 300, // random offset x (-300 to +300)
        y: Math.random() * 500 - 400, // random offset y (-400 to +100)
        delay: Math.random() * 0.3, // organic stagger delay input
      };
    });
  });

  useEffect(() => {
    // Pick a random Law of Attraction message
    const index = Math.floor(Math.random() * loaMessages.length);
    setRandomMessage(loaMessages[index]);

    // Show LoA message card after exactly 400ms
    const cardTimer = setTimeout(() => {
      setShowMessageCard(true);
    }, 400);

    // Auto-dismiss the entire celebration after 2.5 seconds total
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 2500);

    return () => {
      clearTimeout(cardTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div 
      id="completion-celebration-overlay"
      onClick={onDismiss}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md cursor-pointer select-none overflow-hidden"
    >
      {/* Dynamic Particle Sparkles Layer */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          className="relative w-1 h-1"
          initial="initial"
          animate="animate"
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.02,
              }
            }
          }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}`,
                left: 0,
                top: 0,
              }}
              variants={{
                initial: { x: 0, y: 0, opacity: 1, scale: 0.2 },
                animate: {
                  x: p.x,
                  y: p.y,
                  opacity: 0,
                  scale: [0.5, 1.2, 0.8],
                  transition: {
                    duration: 1.2,
                    ease: 'easeOut',
                  }
                }
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* LoA Message Card Slider */}
      <AnimatePresence>
        {showMessageCard && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            className="w-[90%] max-w-md bg-zinc-950/90 border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.15)] backdrop-blur-xl relative overflow-hidden"
            onClick={(e) => {
              // Clicking the card will also dismiss the celebration
              e.stopPropagation();
              onDismiss();
            }}
          >
            {/* Glowing accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            
            <div className="space-y-6 text-center">
              <span className="inline-block text-[10px] font-black tracking-[0.25em] text-amber-400 uppercase italic">
                RITUAL COMPLETED
              </span>

              <p className="text-xl md:text-2xl font-black italic tracking-wide text-white leading-relaxed font-sans px-2">
                "{randomMessage}"
              </p>

              {scoreIncreased && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="flex flex-col items-center justify-center gap-1.5"
                >
                  <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold italic">
                    VIBRATION SYNCHRONIZED
                  </p>
                  <span className="px-5 py-2 bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-white/10 rounded-2xl text-amber-400 font-black text-lg tracking-wider shadow-lg animate-pulse">
                    +5 ⚡
                  </span>
                </motion.div>
              )}
            </div>
            
            <div className="text-center mt-6">
              <p className="text-[9px] text-white/20 uppercase tracking-widest font-black italic">
                TAP ANYWHERE TO CONTINUE
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default CompletionCelebration;
