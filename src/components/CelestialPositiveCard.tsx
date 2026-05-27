import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Star, Check, RotateCw, BookOpen, Quote, Smile } from 'lucide-react';
import { getISTDate } from './MorningCheckin';

interface CelestialPositiveCardProps {
  userProfile: any;
  onUpdateProfile: (fields: any) => Promise<void>;
  desires: any[];
  onShowCelebration: () => void;
}

export default function CelestialPositiveCard({
  userProfile,
  onUpdateProfile,
  desires,
  onShowCelebration
}: CelestialPositiveCardProps) {
  const [isDrawing, setIsDrawing] = useState(false);

  const todayStr = getISTDate().dateString;
  const hasDrawnToday = userProfile?.lastPositiveDrawDate === todayStr;
  const currentCard = userProfile?.currentPositiveCard;
  const cosmicXP = userProfile?.cosmicXP || 0;

  const drawCard = async () => {
    if (isDrawing || hasDrawnToday) return;

    setIsDrawing(true);

    try {
      const response = await fetch('/api/gemini/desire-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desires: desires,
          manifestationGoal: userProfile?.manifestationGoal
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const card = await response.json();

      // Persist the drawn card for today
      await onUpdateProfile({
        lastPositiveDrawDate: todayStr,
        currentPositiveCard: {
          ...card,
          completed: false
        }
      });
    } catch (err) {
      console.error("[CelestialPositiveCard] Draw error:", err);
      // Absolute fallback selection
      const fallbackCards = [
        {
          cardName: "The Sovereign of Miracles",
          theme: "Potential",
          affirmation: "You hold the subtle keys to rewrite lines of destiny. Your presence carries an undeniable light of hope.",
          feelingBoost: "Your heart contains an ocean of resilience. Recognize that every obstacle you have faced has refined, not diminished, your radiant spirit.",
          sacredAction: "Close your eyes, breathe, and place a hand on your heart. Affirm: 'I am completely worthy of peace, success, and pure joy.'",
          color: "#A78BFA",
          symbol: "✿"
        },
        {
          cardName: "The Well of Infinite Grace",
          theme: "Self-Love",
          affirmation: "You are deserving of love, tenderness, and patience. Treat yourself with the sweet gentleness node of a beloved divine guest.",
          feelingBoost: "It is safe to forgive yourself. You have tried your hardest with the tools you had. The cosmos is incredibly proud of your quiet effort and persistence today.",
          sacredAction: "Look around and count three beautiful, simple things in your immediate space that bring you immediate comfort.",
          color: "#EC4899",
          symbol: "♥"
        }
      ];

      const chosen = fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
      await onUpdateProfile({
        lastPositiveDrawDate: todayStr,
        currentPositiveCard: {
          ...chosen,
          completed: false
        }
      });
    } finally {
      setIsDrawing(false);
    }
  };

  const claimJoy = async () => {
    if (!currentCard || currentCard.completed) return;

    try {
      // Award +20 XP & set completed
      const updatedXP = cosmicXP + 20;
      await onUpdateProfile({
        cosmicXP: updatedXP,
        currentPositiveCard: {
          ...currentCard,
          completed: true
        }
      });

      // Play custom sweet positive chord audio feedback
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioCtx.currentTime;
        
        // E-major arpeggiated tri-chime
        const freqs = [329.63, 415.30, 493.88, 659.25];
        freqs.forEach((f, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.12);
          
          gain.gain.setValueAtTime(0.2, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.6);
          
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.62);
        });
      } catch (ae) {
        console.log("Ascension chime skipped:", ae);
      }

      onShowCelebration();
    } catch (err) {
      console.error("[CelestialPositiveCard] Claim joy error:", err);
    }
  };

  return (
    <div className="border-4 border-double border-[#c5a880]/30 bg-gradient-to-br from-[#160f0a] via-[#0d0906] to-[#040302] rounded-[2.5rem] p-6 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_30px_rgba(197,168,128,0.05)] relative overflow-hidden group flex flex-col justify-between min-h-[460px] transition-all hover:border-[#c5a880]/50">
      {/* Candlelight / Ancient Torch warm golden glow */}
      <div 
        className="absolute w-96 h-96 rounded-full blur-[120px] pointer-events-none -top-24 -left-24 opacity-30 transition-all duration-700 group-hover:scale-110"
        style={{
          background: hasDrawnToday && currentCard?.color 
            ? `radial-gradient(circle, ${currentCard.color} 0%, transparent 70%)` 
            : 'radial-gradient(circle, rgba(197,168,128,0.25) 0%, transparent 70%)'
        }}
      />
      
      {/* Ancient Script scroll line textures and parchment grain */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(197,168,128,0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/parchment.png')] mix-blend-overlay" />

      {/* Decorative Corner Seals */}
      <div className="absolute top-3 left-3 text-[#c5a880]/20 select-none text-xs font-serif">✥</div>
      <div className="absolute top-3 right-3 text-[#c5a880]/20 select-none text-xs font-serif">✥</div>
      <div className="absolute bottom-3 left-3 text-[#c5a880]/20 select-none text-xs font-serif">✥</div>
      <div className="absolute bottom-3 right-3 text-[#c5a880]/20 select-none text-xs font-serif">✥</div>

      {/* Title Header */}
      <div className="relative z-10 flex items-center justify-between mb-8 border-b border-[#c5a880]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 rounded-md bg-[#c5a880]/5 border border-[#c5a880]/20 text-[10px] font-serif uppercase tracking-[0.25em] text-[#e3d1b6] flex items-center gap-2 shadow-inner">
            <span className="text-[#c5a880] animate-pulse">❊</span>
            SACRED AFFIRMATION MANUSCRIPT
            <span className="text-[#c5a880] animate-pulse">❊</span>
          </div>
          {cosmicXP > 0 && (
            <div className="px-3 py-1 rounded-md bg-[#d4af37]/10 border border-[#d4af37]/20 text-[9px] font-mono font-bold tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <Star className="w-3 h-3 fill-current" />
              {cosmicXP} WISDOM XP
            </div>
          )}
        </div>
        <span className="text-[10px] font-serif font-bold text-[#c5a880]/40 uppercase tracking-[0.25em] italic flex items-center gap-1">
          ❦ LIBER VIBE ❧
        </span>
      </div>

      {/* Main Core Element */}
      <div className="relative z-10 flex-grow flex flex-col justify-center my-2">
        <AnimatePresence mode="wait">
          {!hasDrawnToday ? (
            <motion.div
              key="undrawn-positive"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center p-4 py-6"
            >
              {/* Mythical Antique Gilded Scroll Deck Seal */}
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={drawCard}
                className="w-36 h-48 rounded-lg border-2 border-[#c5a880]/30 bg-gradient-to-b from-[#21150f] via-[#0f0a07] to-[#040302] shadow-[0_0_35px_rgba(197,168,128,0.1)] flex flex-col items-center justify-center p-4 mb-6 relative cursor-pointer group/card active:scale-95"
              >
                {/* Vintage concentric frame patterns */}
                <div className="absolute inset-1.5 border border-[#c5a880]/10 rounded" />
                <div className="absolute inset-3 border border-double border-[#c5a880]/20 rounded-sm" />
                
                {/* Runic orbital ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="w-22 h-22 rounded-full border border-dashed border-[#c5a880]/20 flex items-center justify-center relative"
                >
                  <div className="absolute inset-2 border border-dotted border-[#c5a880]/15 rounded-full" />
                  <span className="text-[#c5a880]/60 select-none font-serif text-lg">⚜</span>
                </motion.div>

                {/* Star-like dots */}
                <div className="absolute top-5 right-5 w-1 h-1 rounded-full bg-[#c5a880]/30 animate-ping" />
                <div className="absolute bottom-5 left-5 w-1 h-1 rounded-full bg-[#c5a880]/30 animate-ping [animation-delay:1.2s]" />

                <span className="text-[7.5px] font-serif font-bold uppercase tracking-[0.35em] text-[#c5a880]/80 mt-5 relative z-10 block text-center">
                  SEALED SCROLL
                </span>
              </motion.div>

              <h4 className="text-xl lg:text-2xl font-serif text-[#e3d1b6] italic font-semibold tracking-wide mb-3 leading-tight">
                Decipher Your Celestial Decree
              </h4>
              <p className="text-[10px] sm:text-xs text-[#c5a880]/70 max-w-md mb-8 leading-relaxed font-serif uppercase tracking-wider">
                ❦ Uncover a profound daily affirmation and warm validation message to raise your frequency. Fulfill the sacred act to claim a +20 WISDOM XP booster. ❧
              </p>

              <button
                type="button"
                disabled={isDrawing}
                onClick={drawCard}
                className="relative px-8 py-4 rounded-md overflow-hidden text-xs font-serif font-black uppercase tracking-[0.2em] text-[#0f0a07] bg-[#c5a880] hover:bg-[#d8c19d] border border-[#fbf3e6]/25 active:scale-95 transition-all shadow-[0_8px_30px_rgba(197,168,128,0.25)] flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {isDrawing ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    TRANSLATING RUIN CODES...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#0f0a07]" />
                    REVEAL CODES OF HAPPINESS
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="revealed-positive"
              initial={{ opacity: 0, scale: 0.95, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, type: "spring", damping: 14 }}
              className="flex flex-col md:flex-row items-center gap-8 p-1"
            >
              {/* Antique Sacred Parchment Card layout */}
              <div 
                className="w-44 h-56 rounded-lg border-2 border-double flex flex-col justify-between p-4 relative overflow-hidden shrink-0 shadow-2xl transition-all duration-500 hover:scale-105"
                style={{
                  borderColor: `${currentCard?.color || '#c5a880'}50`,
                  background: `linear-gradient(135deg, #23160e 0%, #0c0805 100%)`,
                  boxShadow: `0 0 35px ${currentCard?.color || '#c5a880'}15`
                }}
              >
                {/* Inside sacred candle glow backing */}
                <div 
                  className="absolute w-28 h-28 rounded-full blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none"
                  style={{ backgroundColor: currentCard?.color || '#c5a880' }}
                />

                {/* Double ornamental inside layout frame */}
                <div 
                  className="absolute inset-1.5 border rounded-md pointer-events-none opacity-20"
                  style={{ borderColor: currentCard?.color || '#c5a880' }}
                />
                <div 
                  className="absolute inset-2.5 border-2 border-double rounded-md pointer-events-none opacity-10"
                  style={{ borderColor: currentCard?.color || '#c5a880' }}
                />

                <div className="flex items-center justify-between relative z-10">
                  <span 
                    className="text-[9px] font-serif font-black uppercase tracking-widest italic animate-pulse"
                    style={{ color: currentCard?.color || '#c5a880' }}
                  >
                    Rune Arcana
                  </span>
                  <span className="text-xs text-[#c5a880]/60 select-none">{currentCard?.symbol || '❧'}</span>
                </div>

                <div className="text-center relative z-10 flex flex-col items-center justify-center my-auto">
                  <span 
                    className="text-4xl font-serif mb-2"
                    style={{ 
                      color: currentCard?.color || '#c5a880',
                      textShadow: `0 0 12px ${(currentCard?.color || '#c5a880')}30`
                    }}
                  >
                    {currentCard?.symbol || '⚜'}
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

              {/* Textual positive messages and self love uplift statement */}
              <div className="flex-grow flex flex-col justify-center space-y-5">
                <div>
                  <span 
                    className="text-[9px] font-serif font-bold uppercase tracking-[0.3em] block mb-1.5 italic"
                    style={{ color: currentCard?.color || '#c5a880' }}
                  >
                    DAILY CELESTIAL DECREE
                  </span>
                  <h3 className="text-xl lg:text-2xl font-serif text-[#f2e6d0] italic tracking-wide max-w-xl leading-none">
                    {currentCard?.cardName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[#c5a880]/40">
                    <BookOpen className="w-3.5 h-3.5 text-[#c5a880]/50" />
                    <span className="text-[9px] font-serif tracking-wider uppercase">Deciphered Prophesy of Worth</span>
                  </div>
                </div>

                {/* Classical parchment quote layout */}
                <div className="relative bg-[#ffffff]/[0.02] border border-[#c5a880]/10 rounded-xl p-5 italic font-serif">
                  <Quote className="absolute -top-3.5 -left-1 w-7 h-7 text-[#c5a880]/5 opacity-40 shrink-0 select-none" />
                  <p className="text-[12px] sm:text-[13px] leading-relaxed text-[#f4edd2] pl-3">
                    "{currentCard?.affirmation}"
                  </p>
                </div>

                {/* Gold-lined warm leather backing note box */}
                <div className="bg-gradient-to-r from-[#211710] to-[#120a06] border border-[#c5a880]/15 rounded-xl p-5">
                  <p className="text-[11px] sm:text-xs leading-relaxed text-[#ebd8bf]/90 font-serif tracking-wide">
                    {currentCard?.feelingBoost}
                  </p>
                </div>

                {/* Sacred Action Ritual area */}
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
                      onClick={claimJoy}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                        currentCard?.completed
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-black/30 border-white/20 text-transparent hover:border-[#c5a880]'
                      }`}
                    >
                      <Check className="w-4 h-4 fill-current text-white" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#c5a880]">
                          SACRED INTEGRATION ACT
                        </span>
                        {currentCard?.completed && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-[7px] font-serif font-black text-emerald-400 uppercase tracking-widest">
                            SANCTIFIED (+20 XP)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs font-serif text-[#ebdcc5] mt-1 tracking-wide leading-snug">
                        {currentCard?.sacredAction}
                      </p>
                      {!currentCard?.completed && (
                        <p className="text-[8.5px] font-serif font-bold uppercase tracking-widest text-[#c5a880] mt-1.5 cursor-pointer hover:underline" onClick={claimJoy}>
                          ❦ Click Checkbox to Sanctify your spirit and claim +20 XP Vibe Boost ❧
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
