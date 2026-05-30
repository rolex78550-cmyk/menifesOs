import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  Globe, 
  HelpCircle as QuestionIcon,
  Crown,
  ChevronDown,
  Quote,
  Star,
  Lock,
  LockKeyholeOpen,
  Infinity as InfinityIcon
} from 'lucide-react';
import { doc, updateDoc, Timestamp, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase'; // Importing database reference from lib/firebase

interface UpgradeManagerProps {
  setView: (v: string) => void;
  user: any;
  userProfile: any;
  onToast: (toast: any) => void;
  updateOfflineProfile?: (tierName: string, expiryDate?: Date) => void;
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const UpgradeManager = ({ setView, user, userProfile, onToast, updateOfflineProfile }: UpgradeManagerProps) => {
  const isAdmin = user?.email === 'asartist20@gmail.com' || userProfile?.isAdmin === true;
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Billing cycle selection
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  
  // Interactive accordion FAQ states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Conversion-focused manual Currency/Region selection Override
  const [selectedRegion, setSelectedRegion] = useState<'IN' | 'GLOBAL' | null>(null);

  // Currency & country details synced from profile or local heuristics
  const isIndianUser = selectedRegion 
    ? (selectedRegion === 'IN') 
    : (userProfile?.currency === 'INR' || userProfile?.country === 'IN');
    
  const currencySymbol = isIndianUser ? '₹' : '$';

  // Real-time trial calculation
  const [trialTimeLeftStr, setTrialTimeLeftStr] = useState('');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(3);

  const trialEndVal = userProfile?.trialEnd || userProfile?.trialExpiresAt;
  
  const trialEndTime = useMemo(() => {
    if (!trialEndVal) return 0;
    if (trialEndVal.toDate) return trialEndVal.toDate().getTime();
    if (trialEndVal.seconds) return trialEndVal.seconds * 1000;
    return new Date(trialEndVal).getTime();
  }, [trialEndVal]);

  useEffect(() => {
    if (!trialEndTime) {
      if (user?.isGuest) {
        // Guest trial calculation
        const localKey = `menifest_os_trial_start_${user.uid || 'guest'}`;
        const saved = localStorage.getItem(localKey);
        const start = saved ? parseInt(saved, 10) : Date.now();
        const duration = 72 * 60 * 60 * 1000; // 3 Days
        const end = start + duration;
        const diff = Math.max(0, end - Date.now());
        const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
        setTrialDaysRemaining(Math.max(0, days));
        if (diff > 0) {
          const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
          setTrialTimeLeftStr(`${days} Days (${hours}h ${mins}m)`);
        } else {
          setTrialTimeLeftStr('Expired');
        }
      }
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.max(0, trialEndTime - Date.now());
      const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
      setTrialDaysRemaining(Math.max(0, days));
      
      if (diff > 0) {
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        const secs = Math.floor((diff % (60 * 1000)) / 1000);
        setTrialTimeLeftStr(`${days}d ${hours}h ${mins}m ${secs}s`);
      } else {
        setTrialTimeLeftStr('Expired');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [trialEndTime, user]);

  // Price calculations
  const getInrPrice = (cycle: string) => {
    if (cycle === 'monthly') return 99;
    if (cycle === 'yearly') return 999;
    if (cycle === 'lifetime') return 2999;
    return 0;
  };

  const getUsdPrice = (cycle: string) => {
    if (cycle === 'monthly') return 5;
    if (cycle === 'yearly') return 49;
    if (cycle === 'lifetime') return 149;
    return 0;
  };

  const resolvedPrice = useMemo(() => {
    return isIndianUser ? getInrPrice(billingCycle) : getUsdPrice(billingCycle);
  }, [isIndianUser, billingCycle]);

  const executeCheckout = async () => {
    if (!user) {
      onToast({
        id: `auth-req-${Date.now()}`,
        title: "Matrix Sync Required",
        body: "Please register or sign in to establish permanent channel sync."
      });
      return;
    }

    setIsVerifying(true);
    const planName = 'Sovereign';

    try {
      // 1. Double check / config api keys
      const keyRes = await fetch('/api/config/razorpay-key');
      if (!keyRes.ok) throw new Error("Failed to authenticate Razorpay credentials on servers.");
      
      const keyData = await keyRes.json();
      const razorpayKeyIdFromApi = keyData.keyId;

      // 2. Initiate payment order creation from API
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt: `rcpt_${user.uid.slice(-6)}_${Date.now()}`,
          planName,
          billingCycle,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName,
          currency: isIndianUser ? "INR" : "USD"
        })
      });

      if (!orderRes.ok) {
        const errTxt = await orderRes.json().catch(() => ({ error: "VibeOS Gateway Connection Interrupted" }));
        throw new Error(errTxt.error || "Port Connection Failed.");
      }

      const rzpOrder = await orderRes.json();

      if (!razorpayKeyIdFromApi) {
        throw new Error("Razorpay Secret Keys are pending active environment configuration.");
      }

      // 3. Dynamic Razorpay Script loader
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Could not initialize Razorpay SDK client.");

      // 4. Configure Razorpay Gateway parameters (Including Magic Checkout for multiple dynamic Indian payment methods)
      const options = {
        key: razorpayKeyIdFromApi,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "VIBE OS",
        description: `${planName} Master Tier Alignment (${billingCycle.toUpperCase()})`,
        image: `${window.location.origin}/vite.svg`, 
        order_id: rzpOrder.id,
        prefill: {
          name: user?.displayName || "Manifest Seeker",
          email: user?.email || "",
          contact: "9999999999" 
        },
        theme: {
          color: "#10B981",
          backdrop_color: "#030712"
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "UPI / Google Pay / PhonePe",
                instruments: [
                  { method: "upi" }
                ]
              },
              other: {
                name: "Cards, Net Banking & Wallets",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" }
                ]
              }
            },
            sequence: ["block.upi", "block.other"],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        modal: {
          ondismiss: () => {
            setIsVerifying(false);
            onToast({
              id: `aborted-${Date.now()}`,
              title: "Activation Aborted",
              body: "Sovereign channel alignment dismissed."
            });
          },
          animation: true,
          backdrop_close: false,
          escape: true,
          confirm_close: true
        },
        handler: async (response: any) => {
          try {
            setIsVerifying(true);
            // Verify payment on backend (This does the secure Server Upgrade!)
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planName,
                billingCycle,
                userId: user.uid
              })
            });

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json().catch(() => ({ message: "Inauthentic payment signature." }));
              throw new Error(verifyErr.message || "Failed verify step.");
            }

            const result = await verifyRes.json();

            // Client-side failover sync: if server database updates were blocked, sync securely via authenticated client SDK
            if (!user.isGuest && !result.dbSuccess) {
              try {
                const { updateDoc, doc } = await import("firebase/firestore");
                const { db: clientDb } = await import("../lib/firebase");
                
                const backupExpiry = new Date();
                if (billingCycle === 'monthly') backupExpiry.setMonth(backupExpiry.getMonth() + 1);
                else if (billingCycle === 'yearly') backupExpiry.setFullYear(backupExpiry.getFullYear() + 1);
                else backupExpiry.setFullYear(backupExpiry.getFullYear() + 100);

                const subStatus = billingCycle === 'lifetime' ? 'lifetime' : `active_${billingCycle}`;
                const userRef = doc(clientDb, "users", user.uid);
                await updateDoc(userRef, {
                  tier: 'Sovereign',
                  isSubscribed: true,
                  status: subStatus,
                  billingCycle,
                  subscriptionExpiry: backupExpiry,
                  updatedAt: new Date()
                });
                console.log("[Client Failover] Profile doc aligned successfully via Client Firebase SDK session.");
              } catch (clientDbErr) {
                console.error("[Client Failover] Failed to update client profile:", clientDbErr);
              }
            }

            // Sync success client state directly as backup
            if (user.isGuest && updateOfflineProfile) {
              const backupExpiry = new Date();
              if (billingCycle === 'monthly') backupExpiry.setMonth(backupExpiry.getMonth() + 1);
              else if (billingCycle === 'yearly') backupExpiry.setFullYear(backupExpiry.getFullYear() + 1);
              else backupExpiry.setFullYear(backupExpiry.getFullYear() + 100);
              updateOfflineProfile('Sovereign', backupExpiry);
            }

            // Execution effects
            onToast({
              id: `ascension-${Date.now()}`,
              title: "👑 ALIGNMENT CALIBRATED",
              body: "Upgrade finalized successfully. Your profile holds boundless permission."
            });
            setView('dashboard');
          } catch (verifyErr: any) {
            console.error("Signature verify error:", verifyErr);
            onToast({
              id: `verify-err-${Date.now()}`,
              title: "Verification Block",
              body: verifyErr.message || "Monetary verification exception."
            });
          } finally {
            setIsVerifying(false);
          }
        }
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on('payment.failed', function (resp: any) {
        onToast({
          id: `pay-failed-${Date.now()}`,
          title: "Payment Unsuccessful",
          body: resp.error.description || "The transaction was declined by bank."
        });
        setIsVerifying(false);
      });
      setIsVerifying(false);
      rzpInstance.open();

    } catch (err: any) {
      console.error("Primary channel checkout exception:", err.message);
      setIsVerifying(false);
      onToast({
        id: `checkout-err-${Date.now()}`,
        title: "Calibration Failed",
        body: err.message || "Connection refused by checkout node."
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32 pt-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Trial Countdown Alerts Header */}
        <AnimatePresence>
          {trialTimeLeftStr && !userProfile?.isSubscribed && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-4 rounded-[1.2rem] bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-500/20 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden shadow-lg"
            >
              <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                  <Clock className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-white">CELESTIAL RESIDUAL MOMENTUM</h4>
                  <p className="text-[10px] text-stardust/60 font-mono">
                    Unlimited trial calibration expires in: <span className="text-emerald-400 font-bold">{trialTimeLeftStr}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-mono bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-lg">
                  {trialDaysRemaining > 0 ? `${trialDaysRemaining} DAYS ACTIVE` : 'EXPIRED'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5 shadow-inner">
            <Crown className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.25em]">Sovereign Alignment Ceremony</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase italic leading-none max-w-4xl mx-auto">
            Upgrade your reality. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent underline decoration-emerald-400/20 underline-offset-12">Claim boundless sovereignty.</span>
          </h1>

          <p className="text-stardust/40 text-xs sm:text-sm max-w-xl mx-auto font-medium leading-relaxed uppercase tracking-wider italic">
            Unlock the ultimate visual productivity & habit calibration engine. Sustain raw kinetic focus forever.
          </p>
        </div>

        {/* Current Plan Indicator Banner */}
        <div className="max-w-2xl mx-auto bg-white/[0.01] border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md ${userProfile?.isSubscribed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
              {userProfile?.isSubscribed ? <Crown className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-white/40" />}
            </div>
            <div className="text-left">
              <span className="text-[8px] font-black uppercase tracking-widest text-stardust/30 block mb-0.5 font-mono">YOUR CURRENT CHANNEL SYNC</span>
              <h4 className="text-sm font-black uppercase tracking-tight text-white italic">
                {userProfile?.isSubscribed ? `Sovereign Path Master${userProfile.billingCycle ? ` (${userProfile.billingCycle})` : ''}` : 'Baseline Free Trial Session'}
              </h4>
            </div>
          </div>
          <div className="px-4 py-2 border border-white/5 bg-white/[0.02] rounded-xl text-[10px] font-black uppercase tracking-widest font-mono text-stardust/50">
            {userProfile?.isSubscribed ? '👑 LIFE PERMANENT ACTIVE' : `⚡ TRIAL DAYS REMAINING: ${trialDaysRemaining}`}
          </div>
        </div>

        {/* Toggle Selector and Region/Currency Custom Selector */}
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[7.5px] font-black uppercase tracking-[0.3em] text-stardust/30 font-mono">Select Resonance Cycle</span>
            <div className="bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-xl flex relative">
              {[
                { id: 'monthly', label: 'Monthly' },
                { id: 'yearly', label: 'Yearly Plan' },
                { id: 'lifetime', label: 'Lifetime' }
              ].map((cycle) => (
                <button
                  key={cycle.id}
                  onClick={() => setBillingCycle(cycle.id as any)}
                  className={`relative px-5 sm:px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                    billingCycle === cycle.id 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_4px_20px_rgba(16,185,129,0.3)]' 
                      : 'text-stardust/40 hover:text-white'
                  }`}
                >
                  {cycle.label}
                  {cycle.id === 'yearly' && (
                    <span className="absolute -top-2 -right-1 px-2 py-0.5 bg-emerald-500 text-black text-[7px] font-black rounded-full shadow-lg">SAVE 30%</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 max-w-sm w-full">
            <span className="text-[7.5px] font-black uppercase tracking-[0.3em] text-emerald-400 font-mono flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-400 animate-spin-slow" /> Geolocation Currency Converter
            </span>
            <div className="bg-zinc-950/60 p-1 rounded-xl border border-emerald-500/10 backdrop-blur-md flex w-full relative">
              <button
                onClick={() => {
                  setSelectedRegion('GLOBAL');
                  onToast({
                    id: `region-global-${Date.now()}`,
                    title: "GLOBAL CURRENCY LINKED",
                    body: "Calibration synced to Global ($ USD). International cards active."
                  });
                }}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 cursor-pointer ${
                  !isIndianUser
                    ? 'bg-white/10 text-white border border-white/10 shadow-md' 
                    : 'text-stardust/30 hover:text-white'
                }`}
              >
                🌐 Global ($ USD)
              </button>
              <button
                onClick={() => {
                  setSelectedRegion('IN');
                  onToast({
                    id: `region-in-${Date.now()}`,
                    title: "DOMESTIC Rupee LINKED",
                    body: "Calibration synced to India (₹ INR). UPI, Google Pay, PhonePe, and Netbanking unlocked!"
                  });
                }}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
                  isIndianUser
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                    : 'text-stardust/30 hover:text-white'
                }`}
              >
                🇮🇳 India (₹ INR) <span className="bg-emerald-400 text-black text-[6.5px] px-1 py-0.2 rounded font-black scale-90">UPI ACTIVE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch px-2">
          
          {/* Novice Baseline Plan */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-8 sm:p-10 rounded-[2.5rem] bg-zinc-950/40 border border-white/5 backdrop-blur-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stardust/40 font-mono">Baseline State</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-stardust/40 border border-white/15 px-2.5 py-1 rounded-md bg-white/5">INCLUDED</span>
              </div>
              <h3 className="text-2xl font-black uppercase italic text-white/70">Novice Pathway</h3>
              <p className="text-[11px] text-stardust/40 mt-2 mb-6 font-medium uppercase tracking-wider leading-relaxed">
                Standard baseline manifestation workspace to test the core OS structures.
              </p>

              <div className="border-t border-white/5 py-4 my-6">
                <span className="text-[8px] font-black uppercase tracking-widest text-stardust/30 font-mono block mb-1">ENERGY CALIBRATION COST</span>
                <span className="text-4xl font-black tracking-tight text-white/50 italic">{currencySymbol}0</span>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  "Access core habit workspace limits",
                  "Up to 3 simultaneous rituals logs",
                  "Standard vision board blocks",
                  "Local single-session state sync"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 text-[10px] uppercase font-black tracking-wider text-stardust/50">
                    <Check className="w-3.5 h-3.5 check-green stroke-[3] text-emerald-400" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12">
              <div className="w-full text-center py-4 rounded-xl border border-dashed border-white/10 text-stardust/30 uppercase font-black tracking-widest font-mono text-[9px]">
                ACTIVE BY DEFAULT
              </div>
            </div>
          </motion.div>

          {/* Sovereign Master Plan */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="relative p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-b from-zinc-950 to-black border-2 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.06),_0_0_1px_rgba(16,185,129,0.25)] ring-4 ring-emerald-500/5 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute top-4 right-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[7.5px] font-black uppercase tracking-[0.25em] py-1.5 px-4 rounded-full italic shadow-md">
              👑 ELITE CHOICE
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 font-mono">SUPREME STATE LIMITLESS</span>
              </div>
              <h3 className="text-3xl font-black uppercase italic text-white flex items-center gap-2">
                Sovereign Plan <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[11px] text-emerald-300/80 mt-2 mb-6 font-medium uppercase tracking-wider leading-relaxed">
                Boundary dissolved. Full cloud access loops, automatic coaching grids, and lifetime priority updates.
              </p>

              <div className="border-t border-white/5 py-4 my-6 bg-white/[0.01] px-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 font-mono block">ENERGY CALIBRATION COST</span>
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-white italic">
                      {currencySymbol}{resolvedPrice}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-3 py-1 rounded-lg">
                      {billingCycle === 'lifetime' ? 'One-time Payment' : `Billed ${billingCycle}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  "Boundless simultaneous rituals slots",
                  "Direct desire convergence tracking keys",
                  "Complete master audio catalogs unlock",
                  "Custom reality alignment graphics",
                  "Instant premium support sync channels",
                  "Zero advertising, maximum pure frequency bandwidth"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 text-[10px] uppercase font-black tracking-wider text-white">
                    <Check className="w-3.5 h-3.5 check-green stroke-[3] text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isVerifying}
                onClick={executeCheckout}
                className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-black uppercase text-xs tracking-[0.25em] shadow-[0_12px_30px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 duration-300 flex items-center justify-center gap-3 cursor-pointer"
              >
                {isVerifying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Calibrate Sovereign Access <ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </div>
          </motion.div>

        </div>

        {/* Feature Comparison Table */}
        <div className="mt-16 max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white italic">Resonance Matrix comparison</h2>
            <p className="text-[9px] text-stardust/30 uppercase tracking-[0.4em] font-bold">Inclusions Breakdown</p>
          </div>

          <div className="overflow-hidden border border-white/5 rounded-3xl bg-white/[0.01] backdrop-blur-xl">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-5 text-[10px] font-black uppercase text-stardust/40">CALIBRATION CAPABILITY</th>
                  <th className="p-5 text-[10px] font-black uppercase text-center text-stardust/40 w-1/4">NOVICE FIELD</th>
                  <th className="p-5 text-[10px] font-black uppercase text-center text-emerald-400 w-1/4">SOVEREIGN FIELD</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Continuous Ritual Triggers", novice: "Limit of 3 active", pro: "Unlimited boundless" },
                  { name: "Desire Convergence Metrics", novice: "Strict view limits", pro: "Boundless advanced" },
                  { name: "Vibe Academy Content catalogs", novice: "First two unlocked", pro: "100% complete instant" },
                  { name: "Flow frequency tone shield", novice: "10 minutes limit", pro: "Boundless background loop" },
                  { name: "Persistent cloud profile updates", novice: "Manual backups", pro: "Automated real-time background sync" },
                  { name: "Multi-device syncing support", novice: "None", pro: "Instant master alignment" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.01] transition-all">
                    <td className="p-5 text-[11px] font-black uppercase text-stardust/70 tracking-wide">{row.name}</td>
                    <td className="p-5 text-[10px] font-medium text-center text-stardust/30 font-mono">{row.novice}</td>
                    <td className="p-5 text-[10px] font-bold text-center text-emerald-400 font-mono bg-emerald-500/[0.01]">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-16 space-y-8 max-w-5xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white italic">Alignment Archives</h2>
            <p className="text-[9px] text-stardust/30 uppercase tracking-[0.4em] font-bold">Feedback from the ascended sovereign collective</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                text: "The dynamic rituals triggers literally reprogrammed my mornings. I have recorded a 95% productivity increase.",
                author: "Devang P.",
                title: "SaaS Lead Creator"
              },
              {
                text: "Unlocking Sovereign Lifetime access was single-handedly the best focus utility decision of this year. No more subscription fatigue.",
                author: "Ananya I.",
                title: "High Performance Architect"
              },
              {
                text: "The audio tone synthesizer combined with physical ritual targets makes consistency absolute. Highly recommend to everyone.",
                author: "Jonathan W.",
                title: "Venture Builder"
              }
            ].map((testi, i) => (
              <div key={i} className="p-6 rounded-[2rem] bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 transition-all text-left flex flex-col justify-between">
                <div>
                  <Quote className="w-6 h-6 text-emerald-400/25 mb-4" />
                  <p className="text-[11px] leading-relaxed text-white/80 font-medium uppercase tracking-wider italic">
                    "{testi.text}"
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] flex items-center justify-center font-bold text-emerald-400">
                    {testi.author[0]}
                  </div>
                  <div>
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-white">{testi.author}</h5>
                    <p className="text-[8px] font-mono text-stardust/40">{testi.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-16 max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white italic">Frequently Clarified Questions</h2>
            <p className="text-[9px] text-stardust/30 uppercase tracking-[0.4em] font-bold">Unlocking the ceremony path</p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "What is your 30-day money-back assurance protocol?",
                a: "If your vibrational frequency alignment does not match with Sovereign master privileges within 30 days of active sync, simply write to we@vibeos.com to trigger an instantaneous 100% refund of your initial energy amount. No obstacles or inquiries applied."
              },
              {
                q: "How does the automatic localized country pricing map works?",
                a: "Our SaaS matrix dynamically aligns current currencies to local performance rates: India performance is synced to domestic UPI configurations at ₹99/mo / ₹999/yr / ₹2999 lifetime, whereas Global performances are mapped at $5/mo / $49/yr / $149 lifetime. Dynamic conversions is calculated server-side in real-time."
              },
              {
                q: "Can I upgrade from Monthly to Yearly/Lifetime later?",
                a: "Absolutely. Log into your setup dashboard anytime to adjust plans. The redundant monthly billing amounts will automatically pro-rate down to reduce upcoming calibration upgrades."
              },
              {
                q: "How do I manage my active subscription?",
                a: "You holding total dominance of the billing channels. Navigate into 'Setup' (Settings) to review payments logs, download receipts, or terminate future automated cycles instantly."
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between text-white hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-[11px] font-black uppercase tracking-wider">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-emerald-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-white/5 bg-black/20"
                      >
                        <p className="p-5 text-[10px] text-stardust/50 leading-relaxed font-medium uppercase tracking-wider italic">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Money Back Guarantee section */}
        <div className="mt-16 max-w-4xl mx-auto rounded-3xl bg-emerald-500/[0.02] border border-emerald-500/20 p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="text-left space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 font-mono">30-DAY ABSOLUTE MOMENTUM ASSURANCES</h4>
            <p className="text-[11px] text-stardust/70 leading-relaxed uppercase tracking-wider font-medium italic">
              Buy confidently. If your alignment rituals do not produce satisfying daily focus habits within 30 days, we'll return 100% of your energy coin. No queries, no constraints, completely end-to-end protected.
            </p>
          </div>
        </div>

        {/* Trust Badges footer info */}
        <div className="mt-8 flex flex-col items-center gap-6 pt-8 border-t border-white/5">
          <div className="flex flex-wrap justify-center gap-10 opacity-40 hover:opacity-70 transition-opacity">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> secure Stripe & Razorpay rails
            </div>
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white">
              <Lock className="w-4 h-4 text-emerald-400" /> SSL ENCRYPTED GATEWAY NODE
            </div>
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white">
              <Globe className="w-4 h-4 text-emerald-400" /> MULTINATIONAL CURRENCY SYNC
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
