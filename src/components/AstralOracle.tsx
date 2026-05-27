import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, HelpCircle, Flame, Compass, Star, CheckCircle, RotateCw, RefreshCw } from 'lucide-react';
import { getISTDate } from './MorningCheckin';

interface AstralOracleProps {
  userProfile: any;
  onUpdateProfile: (fields: any) => Promise<void>;
  uncompletedHabits: string[];
  goal?: string;
  onShowCelebration: () => void;
}

export default function AstralOracle({
  userProfile,
  onUpdateProfile,
  uncompletedHabits,
  goal,
  onShowCelebration
}: AstralOracleProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = getISTDate().dateString;
  const hasDrawnToday = userProfile?.lastOracleDrawDate === todayStr;
  const currentCard = userProfile?.currentOracleCard;
  const cosmicXP = userProfile?.cosmicXP || 0;

  const drawCard = async () => {
    if (isDrawing || hasDrawnToday) return;

    setIsDrawing(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal || userProfile?.manifestationGoal || "Universal alignment & self-actualization",
          uncompletedHabits: uncompletedHabits
        })
      });

      if (!response.ok) {
        throw new Error('API dispatch failed');
      }

      const card = await response.json();

      // Persist the drawn card for today
      await onUpdateProfile({
        lastOracleDrawDate: todayStr,
        currentOracleCard: {
          ...card,
          completed: false
        }
      });
    } catch (err) {
      console.error("[AstralOracle] Draw error:", err);
      // Absolute safety fallback: pick a predefined card locally immediately on fail
      const localFallbackCards = [
        {
          cardName: "The Gate of Release",
          theme: "Release",
          affirmation: "I gracefully let go of resistance, allowing the flow of abundance to take over.",
          cosmicAction: "Tick off 1 pending ritual to stabilize your frequency field today.",
          color: "#3B82F6",
          symbol: "✧"
        },
        {
          cardName: "The Sovereign of Abundance",
          theme: "Abundance",
          affirmation: "My consciousness is a magnet for unlimited prosperity. I think from abundance, always.",
          cosmicAction: "Track a transaction or visualize a client success to anchor this wealth focus.",
          color: "#F59E0B",
          symbol: "❈"
        },
        {
          cardName: "The Catalyst of Willpower",
          theme: "Willpower",
          affirmation: "My intentions are commands to the cosmos. I act with immediate, dynamic presence.",
          cosmicAction: "Initiate and complete your highest-priority ritual without delay.",
          color: "#EF4444",
          symbol: "❂"
        },
        {
          cardName: "The Mirror of Shadows",
          theme: "Reflection",
          affirmation: "I find clarity in quiet moments. Self-reflection is my fast track to manifestation.",
          cosmicAction: "Log a reflection note in your daily diary to capture internal wisdom.",
          color: "#8B5CF6",
          symbol: "◈"
        },
        {
          cardName: "The Guardian of Focus",
          theme: "Focus",
          affirmation: "I filter out external static. My mind is aligned on the highest frequency.",
          cosmicAction: "Enable the frequency synthesizer for 3 minutes to anchor your focus.",
          color: "#10B981",
          symbol: "❈"
        }
      ];

      const chosen = localFallbackCards[Math.floor(Math.random() * localFallbackCards.length)];
      await onUpdateProfile({
        lastOracleDrawDate: todayStr,
        currentOracleCard: {
          ...chosen,
          completed: false
        }
      });
    } finally {
      setIsDrawing(false);
    }
  };

  const completeAction = async () => {
    if (!currentCard || currentCard.completed) return;

    try {
      // Award +25 XP and mark the action complete
      const updatedXP = cosmicXP + 25;
      await onUpdateProfile({
        cosmicXP: updatedXP,
        currentOracleCard: {
          ...currentCard,
          completed: true
        }
      });

      // Play completion audio reinforcement if possible
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        // Ascending harmonic chime
        osc.type = 'sine';
        const now = audioCtx.currentTime;
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.6);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        
        osc.start(now);
        osc.stop(now + 0.82);
      } catch (ae) {
        console.log("Audio pitch feedback was skipped:", ae);
      }

      onShowCelebration();
    } catch (err) {
      console.error("[AstralOracle] Completion state update fell short:", err);
    }
  };

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-2 border-4 border-double border-[#c5a880]/30 bg-gradient-to-br from-[#160f0a] via-[#0d0906] to-[#040302] rounded-[2.5rem] p-6 sm:p-8 lg:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.9),_0_0_40px_rgba(197,168,128,0.08)] relative overflow-hidden group flex flex-col justify-between min-h-[400px] sm:min-h-[450px] transition-all hover:border-[#c5a880]/50 text-stardust">
      {/* Candlelight / Ancient Torch warm golden glow */}
      <div 
        className="absolute w-96 h-96 rounded-full blur-[120px] pointer-events-none -top-24 -right-24 opacity-30 transition-all duration-700 group-hover:scale-110"
        style={{
          background: hasDrawnToday && currentCard?.color 
            ? `radial-gradient(circle, ${currentCard.color} 0%, transparent 70%)` 
            : 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)'
        }}
      />
      
      {/* Ancient Script scroll line textures and parchment grain */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(197,168,128,0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/parchment.png')] mix-blend-overlay" />

      {/* Decorative Corner Seals */}
      <div className="absolute top-4 left-4 text-[#c5a880]/20 select-none text-xs font-serif">✥</div>
      <div className="absolute top-4 right-4 text-[#c5a880]/20 select-none text-xs font-serif">✥</div>
      <div className="absolute bottom-4 left-4 text-[#c5a880]/20 select-none text-xs font-serif">✥</div>
      <div className="absolute bottom-4 right-4 text-[#c5a880]/20 select-none text-xs font-serif">✥</div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6 sm:mb-8 border-b border-[#c5a880]/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-md bg-[#c5a880]/5 border border-[#c5a880]/20 text-[9px] font-serif uppercase tracking-[0.2em] text-[#e3d1b6] flex items-center gap-1.5 shadow-inner">
            <span className="text-[#c5a880] animate-pulse">❊</span>
            ASTRAL ORACLE MANUSCRIPT
            <span className="text-[#c5a880] animate-pulse">❊</span>
          </div>
          {cosmicXP > 0 && (
            <div className="px-2 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/20 text-[8px] font-mono font-bold tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <Star className="w-3 h-3 fill-current" />
              {cosmicXP} WISDOM XP
            </div>
          )}
        </div>
        <span className="text-[10px] font-serif font-bold text-[#c5a880]/40 uppercase tracking-[0.25em] italic flex items-center gap-1">
          ❦ LIBER ASTRALIS ❧
        </span>
      </div>

      {/* Content Engine */}
      <div className="relative z-10 flex-grow flex flex-col justify-center my-1">
        <AnimatePresence mode="wait">
          {!hasDrawnToday ? (
            <motion.div
              key="undrawn"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col lg:flex-row items-center justify-center text-center lg:text-left gap-5 lg:gap-8 p-1"
            >
              {/* Mythical Antique Gilded Scroll Deck Seal */}
              <motion.div 
                whileHover={{ scale: 1.05, rotate: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={drawCard}
                className="w-28 h-36 lg:w-30 lg:h-38 rounded-lg border-2 border-[#c5a880]/30 bg-gradient-to-b from-[#21150f] via-[#0f0a07] to-[#040302] shadow-[0_0_25px_rgba(139,92,246,0.08)] flex flex-col items-center justify-center p-3 relative cursor-pointer group/card active:scale-95 shrink-0"
              >
                {/* Vintage concentric frame patterns */}
                <div className="absolute inset-1 border border-[#c5a880]/10 rounded" />
                <div className="absolute inset-2.5 border border-double border-[#c5a880]/20 rounded-sm" />
                
                {/* Runic orbital ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-full border border-dashed border-[#c5a880]/20 flex items-center justify-center relative"
                >
                  <div className="absolute inset-1.5 border border-dotted border-[#c5a880]/15 rounded-full" />
                  <Compass className="w-6 h-6 text-[#c5a880]/80" />
                </motion.div>

                {/* Star-like dots */}
                <div className="absolute top-4 left-4 w-1 h-1 rounded-full bg-[#c5a880]/30 animate-ping" />
                <div className="absolute bottom-4 right-4 w-1 h-1 rounded-full bg-[#c5a880]/30 animate-ping [animation-delay:1s]" />

                <span className="text-[7.5px] font-serif font-bold uppercase tracking-[0.35em] text-[#c5a880]/80 mt-3 relative z-10 block text-center">
                  ASTRAL CORE
                </span>
              </motion.div>

              <div className="flex flex-col items-center lg:items-start">
                <h4 className="text-xl lg:text-2xl font-serif text-[#e3d1b6] italic font-semibold tracking-wide mb-1 leading-tight text-center lg:text-left">
                  Reveal Your Cosmic Alignment
                </h4>
                <p className="text-[10px] text-[#c5a880]/70 max-w-md mb-4 leading-relaxed font-serif uppercase tracking-wider text-center lg:text-left">
                  ❦ Draw your daily astral guide to adjust your spiritual compass. Receive +25 WISDOM XP. ❧
                </p>

                <button
                  type="button"
                  disabled={isDrawing}
                  onClick={drawCard}
                  className="relative px-6 py-2.5 rounded-md overflow-hidden text-[10px] font-serif font-black uppercase tracking-[0.15em] text-[#0f0a07] bg-[#c5a880] hover:bg-[#d8c19d] border border-[#fbf3e6]/25 active:scale-95 transition-all shadow-[0_5px_15px_rgba(197,168,128,0.2)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDrawing ? (
                    <>
                      <Compass className="w-3 h-3 animate-spin text-[#0f0a07]" />
                      ALIGNING COMPASS CODES...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-[#0f0a07]" />
                      DRAW ORACLE RUNE
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.95, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, type: "spring", damping: 14 }}
              className="flex flex-col md:flex-row items-center gap-8 p-1 w-full"
            >
              {/* Antique Sacred Parchment Card layout */}
              <div 
                className="w-44 h-56 rounded-lg border-2 border-double flex flex-col justify-between p-4 relative overflow-hidden shrink-0 shadow-2xl transition-all duration-500 hover:scale-105"
                style={{
                  borderColor: `${currentCard?.color || '#8B5CF6'}50`,
                  background: `linear-gradient(135deg, #23160e 0%, #0c0805 100%)`,
                  boxShadow: `0 0 35px ${currentCard?.color || '#8B5CF6'}15`
                }}
              >
                {/* Inside sacred candle glow backing */}
                <div 
                  className="absolute w-28 h-28 rounded-full blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none"
                  style={{ backgroundColor: currentCard?.color || '#8B5CF6' }}
                />

                {/* Double ornamental inside layout frame */}
                <div 
                  className="absolute inset-1.5 border rounded-md pointer-events-none opacity-20"
                  style={{ borderColor: currentCard?.color || '#8B5CF6' }}
                />
                <div 
                  className="absolute inset-2.5 border-2 border-double rounded-md pointer-events-none opacity-10"
                  style={{ borderColor: currentCard?.color || '#8B5CF6' }}
                />

                <div className="flex items-center justify-between relative z-10">
                  <span 
                    className="text-[9px] font-serif font-black uppercase tracking-widest italic animate-pulse"
                    style={{ color: currentCard?.color || '#c5a880' }}
                  >
                    Astral Focus
                  </span>
                  <span className="text-xs text-[#c5a880]/60 select-none">{currentCard?.symbol || '❂'}</span>
                </div>

                <div className="text-center relative z-10 flex flex-col items-center justify-center my-auto">
                  <span 
                    className="text-4xl font-serif mb-2"
                    style={{ 
                      color: currentCard?.color || '#8B5CF6',
                      textShadow: `0 0 12px ${(currentCard?.color || '#8B5CF6')}30`
                    }}
                  >
                    {currentCard?.symbol || '❂'}
                  </span>
                  <h5 className="text-[11px] font-serif font-semibold text-[#f5ebd6] uppercase tracking-wider max-w-[130px] leading-relaxed text-center">
                    {currentCard?.cardName}
                  </h5>
                </div>

                <div className="flex justify-between items-end relative z-10">
                  <span className="text-[7.5px] text-[#c5a880]/50 uppercase tracking-widest font-mono">
                    {currentCard?.theme}
                  </span>
                  <span className="text-[7.5px] text-[#c5a880] font-serif tracking-widest uppercase">
                    {currentCard?.completed ? 'SANCTIFIED' : 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Textual Guidance & Cosmic Mission */}
              <div className="flex-grow flex flex-col justify-center space-y-5">
                <div>
                  <span 
                    className="text-[9px] font-serif font-bold uppercase tracking-[0.3em] block mb-1.5 italic"
                    style={{ color: currentCard?.color || '#8B5CF6' }}
                  >
                    COSMIC FREQUENCY DECREE
                  </span>
                   <h3 className="text-xl lg:text-2xl font-serif italic tracking-wide max-w-xl leading-none font-black text-[#f2e6d0]">
                     {currentCard?.cardName}
                   </h3>
                </div>

                {/* Classical parchment quote layout */}
                <div className="relative bg-[#ffffff]/[0.02] border border-[#c5a880]/10 rounded-xl p-5 italic font-serif">
                  <span className="absolute -top-3.5 -left-1 text-4xl text-[#c5a880]/5 opacity-40 shrink-0 select-none font-serif">“</span>
                   <p className="text-[12px] sm:text-[13px] leading-relaxed text-[#f4edd2] pl-3">
                     "{currentCard?.affirmation}"
                   </p>
                </div>

                {/* Cosmic Action Task Checklist Box styled as Sacred Action ritual area */}
                <div 
                  className={`border rounded-xl p-4 transition-all duration-300 relative overflow-hidden ${
                    currentCard?.completed 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      disabled={currentCard?.completed}
                      onClick={completeAction}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                        currentCard?.completed
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-black/30 border-white/20 text-transparent hover:border-[#c5a880]'
                      }`}
                    >
                      <span className="text-white text-xs">✓</span>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#c5a880]">
                          SACRED INTEGRATION ACT
                        </span>
                        {currentCard?.completed && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-[7px] font-serif font-black text-emerald-400 uppercase tracking-widest">
                            SANCTIFIED (+25 XP)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs font-serif text-[#ebdcc5] mt-1 tracking-wide leading-snug">
                        {currentCard?.cosmicAction}
                      </p>
                      {!currentCard?.completed && (
                        <p className="text-[8.5px] font-serif font-bold uppercase tracking-[0.3em] text-[#c5a880] mt-1.5 cursor-pointer hover:underline" onClick={completeAction}>
                          ❦ Click Checkbox to Sanctify your spirit and claim +25 XP Vibe Boost ❧
                        </p>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Aesthetic Footer */}
      <div className="relative z-10 border-t border-[#c5a880]/10 pt-4 mt-8 flex justify-between items-center text-[8.5px] font-serif font-bold tracking-[0.25em] uppercase text-[#c5a880]/40 italic">
        <span>❦ WISDOM SEAL SYNCED SECURELY ❧</span>
        <span>VIBE OS SACRED CORES</span>
      </div>
    </div>
  );
}
