
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
    <div id="pricing-page" className="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Trial Banner */}
        <AnimatePresence>
          {isTrialing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-4 mb-12 flex items-center justify-between backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">3-Day Celestial Trial Active</p>
                  <p className="text-zinc-400 text-xs">Explore all Sovereign features. No commitment required.</p>
                </div>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Trial Status</p>
                <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6"
          >
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium tracking-widest uppercase">Limitless Potential</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50"
          >
            Ascend to Sovereign.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            Remove the boundaries. Experience the full depth of Vibe OS with quantum-grade features and priority awareness.
          </motion.p>
        </div>

        {/* Currency & Toggle */}
        <div className="flex flex-col items-center gap-8 mb-16">
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
            {(['INR', 'USD'] as Currency[]).map((c) => (
              <button
                key={c}
                id={`currency-${c}`}
                onClick={() => setCurrency(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currency === c ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {c === 'INR' ? '₹ INR' : '$ USD'}
              </button>
            ))}
          </div>

          <div className="flex p-1 bg-white/5 border border-white/10 rounded-full">
            {(['monthly', 'yearly', 'lifetime'] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                id={`cycle-${cycle}`}
                onClick={() => setBillingCycle(cycle)}
                className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === cycle ? 'text-white' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {billingCycle === cycle && (
                  <motion.div
                    layoutId="cycle-bg"
                    className="absolute inset-0 bg-indigo-600 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 capitalize">
                  {cycle}
                  {cycle === 'yearly' && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-500 text-[10px] text-white px-2 py-0.5 rounded-full font-bold">
                      BEST VALUE
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Card */}
        <div className="flex justify-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Crown className="w-6 h-6 text-indigo-500" />
                    Sovereign
                  </h3>
                  <p className="text-zinc-400 text-sm">Everything Vibe OS has to offer.</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl md:text-5xl font-bold">
                    {currency === 'INR' ? '₹' : '$'}
                    {plan.pricing[currency][billingCycle]}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-semibold">
                    per {billingCycle === 'lifetime' ? 'eternity' : billingCycle.replace('ly', '')}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                {plan.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <Check className="w-3 h-3 text-indigo-500" />
                    </div>
                    <span className="text-zinc-300 text-sm md:text-base">{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                id="subscribe-button"
                disabled={loading}
                onClick={handleSubscribe}
                className="w-full relative group/btn bg-white text-black py-4 rounded-2xl font-bold text-lg overflow-hidden transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center gap-2 group-hover/btn:text-white transition-colors uppercase tracking-widest text-sm">
                  {loading ? 'Aligning...' : 'Ascend Now'}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>

              <p className="text-center text-zinc-500 text-[10px] mt-6 leading-relaxed">
                Secured by Razorpay. Cancel anytime. <br />
                By subscribing, you agree to our Terms of Service.
              </p>
            </div>
          </motion.div>
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
