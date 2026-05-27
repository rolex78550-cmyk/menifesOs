export function playCompletionTone(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('vibe_sound') === 'false') return;

  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(659, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.error("Failed to play audio completion tone:", e);
  }
}
