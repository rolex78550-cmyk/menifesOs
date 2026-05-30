
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Zap, Crown, Shield, Globe, Smartphone, HelpCircle, Star, ArrowRight } from 'lucide-react';
import { SUBSCRIPTION_PLANS, BillingCycle, Currency } from '../../types/subscription';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';

interface PricingPageProps {
  onClose?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { refresh } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [loading, setLoading] = useState(false);

  const plan = SUBSCRIPTION_PLANS[0]; // Sovereign Plan

  const { status, isTrialing } = useSubscription();

  const handleSubscribe = async () => {
    if (!user) return;
    
    // Safety check for Razorpay script
    if (!(window as any).Razorpay) {
      setLoading(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      const loadPromise = new Promise((resolve) => {
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
      });
      document.body.appendChild(script);
      const success = await loadPromise;
      if (!success) {
        setLoading(false);
        alert("Failed to load payment gateway. Please check your connection.");
        return;
      }
    }

    try {
      setLoading(true);
      const res = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: navigator.language
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const options = {
        ...data.checkoutConfig,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/subscription/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              userId: user.uid,
              planId: plan.id,
              billingCycle
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            await refresh();
            if (onClose) onClose();
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Subscription flow failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="pricing-page" className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      {/* Background Orbs - Inspired by the atmosphere in the image */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-5%] w-[40vw] h-[40vw] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Large Background Text */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.02]">
        <h2 className="text-[25vw] font-black tracking-tighter leading-none">PRICING</h2>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 pb-40">
        {/* Trial Banner */}
        <AnimatePresence>
          {isTrialing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-4 mb-20 flex items-center justify-between backdrop-blur-3xl"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg">
                  <Zap className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight text-white/90">3-Day Celestial Trial Active</p>
                  <p className="text-zinc-500 text-xs">Explore all Sovereign features. No commitment required.</p>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="text-center mb-24">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"
          >
            Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg md:text-xl font-medium tracking-tight max-w-xl mx-auto"
          >
            For seekers who require absolute alignment and boundless permission within the OS.
          </motion.p>
        </div>

        {/* Plan Selection Layout */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-32">
          {/* Comparison / Free (Placeholder to match 3-card density) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm h-full bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-md opacity-40 grayscale pointer-events-none"
          >
            <h3 className="text-xl font-bold mb-1">Novice</h3>
            <div className="text-3xl font-bold mb-6">Free</div>
            <p className="text-zinc-500 text-sm mb-8">Basic vibration metrics and essential oracle access.</p>
            <div className="space-y-4 mb-10">
              {plan.benefits.slice(0, 3).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                  <div className="h-2 w-24 bg-white/10 rounded" />
                </div>
              ))}
            </div>
            <div className="w-full py-4 rounded-full border border-white/10 text-center text-sm font-bold">Standard</div>
          </motion.div>

          {/* Primary Sovereign Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg relative group"
          >
            {/* Pulsing Border Effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-blue-500/50 rounded-[3rem] blur-[2px] opacity-100 group-hover:blur-[4px] transition-all" />
            
            <div className="relative h-full bg-[#0a0a0a]/90 backdrop-blur-[60px] border border-white/10 rounded-[3rem] p-8 md:p-14 flex flex-col">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="text-3xl font-bold mb-2 tracking-tight">Sovereign</h3>
                  <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">High Performance</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl md:text-6xl font-black tracking-tighter">
                    {currency === 'INR' ? '₹' : '$'}
                    {plan.pricing[currency][billingCycle]}
                  </div>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">
                    /{billingCycle === 'lifetime' ? '∞' : billingCycle.slice(0, 1)}
                  </p>
                </div>
              </div>

              <div className="space-y-6 mb-16 flex-grow">
                {plan.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-4 group/item">
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover/item:border-indigo-500/50 transition-colors">
                      <Check className="w-3.5 h-3.5 text-white/80" />
                    </div>
                    <span className="text-zinc-300 text-sm md:text-base font-medium tracking-tight">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              <button
                id="subscribe-button"
                disabled={loading}
                onClick={handleSubscribe}
                className="w-full py-5 bg-white text-black rounded-full font-black text-sm uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 relative overflow-hidden"
              >
                {loading ? 'Initializing Alignment...' : 'Choose Plan'}
              </button>
            </div>
          </motion.div>

          {/* Business / Pro (Placeholder to match 3-card density) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm h-full bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-md opacity-40 grayscale pointer-events-none hidden lg:block"
          >
            <h3 className="text-xl font-bold mb-1">Covenant</h3>
            <div className="text-3xl font-bold mb-6">Custom</div>
            <p className="text-zinc-500 text-sm mb-8">Group alignment for covens and spiritual collectives.</p>
            <div className="space-y-4 mb-10 text-white/20">
               <div className="h-2 w-full bg-white/5 rounded" />
               <div className="h-2 w-3/4 bg-white/5 rounded" />
               <div className="h-2 w-full bg-white/5 rounded" />
            </div>
            <div className="w-full py-4 rounded-full border border-white/10 text-center text-sm font-bold">Contact</div>
          </motion.div>
        </div>

        {/* Floating Controls at bottom like in the image */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl">
             <div className="flex px-4 gap-6 py-2">
                {(['monthly', 'yearly', 'lifetime'] as BillingCycle[]).map((cycle) => (
                  <button
                    key={cycle}
                    id={`cycle-btn-${cycle}`}
                    onClick={() => setBillingCycle(cycle)}
                    className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                      billingCycle === cycle ? 'text-white' : 'text-zinc-600 hover:text-white/60'
                    }`}
                  >
                    {cycle}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="flex items-center gap-4 text-zinc-600">
            <span className={`text-[10px] font-black uppercase tracking-tighter ${currency === 'INR' ? 'text-indigo-400' : ''}`}>INR</span>
            <button 
              onClick={() => setCurrency(prev => prev === 'INR' ? 'USD' : 'INR')}
              className="w-10 h-5 bg-white/10 rounded-full relative p-1 transition-colors hover:bg-white/20"
            >
               <motion.div 
                 animate={{ x: currency === 'INR' ? 0 : 20 }}
                 className="w-3 h-3 bg-white rounded-full" 
               />
            </button>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${currency === 'USD' ? 'text-indigo-400' : ''}`}>USD</span>
          </div>
        </div>

        {/* Trust Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 border-t border-white/5 pt-24">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
              <Shield className="w-6 h-6 text-zinc-400" />
            </div>
            <h4 className="font-bold">Encrypted Alchemy</h4>
            <p className="text-sm text-zinc-500">Your data and payments are secured with bank-grade 256-bit encryption.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
              <Globe className="w-6 h-6 text-zinc-400" />
            </div>
            <h4 className="font-bold">Global Presence</h4>
            <p className="text-sm text-zinc-500">Payments accepted worldwide via local methods including UPI, Cards & Netbanking.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
              <Smartphone className="w-6 h-6 text-zinc-400" />
            </div>
            <h4 className="font-bold">Cross-Device Flow</h4>
            <p className="text-sm text-zinc-500">Sync your ritual progress and sovereign status across all your devices seamlessly.</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-24">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: "What is Sovereign status?", a: "Sovereign status grants you full access to all future and current Vibe OS features without any limits or credits." },
              { q: "How long is the trial?", a: "New practitioners receive a 3-day full sensory trial to explore the Sovereign landscape." },
              { q: "Can I cancel my subscription?", a: "Yes, you can cancel your monthly or yearly membership at any time from your settings or by contacting our ritual support team." },
              { q: "Are international payments supported?", a: "Absolutely. We support 100+ global currencies and local payment methods via हमारा Razorpay integration." }
            ].map((faq, i) => (
              <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h5 className="font-bold mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  {faq.q}
                </h5>
                <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-white/5 pt-12">
          <p className="text-zinc-600 text-xs tracking-widest uppercase mb-4">Crafted with alignment by Vibe OS Team</p>
          <div className="flex justify-center gap-6 saturate-0 opacity-30 grayscale contrast-150">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" className="h-4" alt="Razorpay" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="PayPal" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_logo.svg" className="h-4" alt="Stripe" />
          </div>
        </div>
      </div>

      {/* Back Button */}
      {onClose && (
        <button
          id="close-pricing"
          onClick={onClose}
          className="fixed top-8 right-8 z-50 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors backdrop-blur-md"
        >
          <motion.div whileHover={{ rotate: 90 }} transition={{ type: "spring" }}>
            <ArrowRight className="w-5 h-5 -rotate-135" />
          </motion.div>
        </button>
      )}
    </div>
  );
};
