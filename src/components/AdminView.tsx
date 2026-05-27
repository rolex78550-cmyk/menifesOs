import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Users, 
  Zap, 
  Wallet, 
  Plus,
  Trash2, 
  Check, 
  X, 
  Search, 
  Filter, 
  RefreshCw, 
  Terminal, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Sparkles,
  CreditCard,
  UserCheck,
  UserX,
  PlusCircle,
  FileSpreadsheet,
  BookOpen,
  Layout,
  Settings as SettingsIcon,
  Globe
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  tier: 'Novice' | 'Amplified' | 'Infinite';
  joinedDate: string;
  lastActive: string;
  status: 'Active' | 'Suspended';
  habitsCount: number;
}

interface AdminPayment {
  id: string;
  userName: string;
  email: string;
  plan: string;
  amount: number;
  gateway: 'Razorpay' | 'PayPal';
  status: 'Successful' | 'Refunded' | 'Failed';
  timestamp: string;
}

interface AdminViewProps {
  setView: (v: any) => void;
  user: any;
  userProfile: { tier: string; subscriptionExpiry?: any } | null;
  updateOfflineProfile: (tierName: string, expiryDate?: Date) => void;
  habits: any[];
  setHabits: React.Dispatch<React.SetStateAction<any[]>>;
  desires: any[];
  setDesires: React.Dispatch<React.SetStateAction<any[]>>;
  transactions: any[];
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  visionItems: any[];
  setVisionItems: React.Dispatch<React.SetStateAction<any[]>>;
  diaryEntries: any[];
  setDiaryEntries: React.Dispatch<React.SetStateAction<any[]>>;
  onToast: (toast: any) => void;
}

const DEFAULT_USERS: AdminUser[] = [
  { id: 'usr_self', name: 'You (Current Admin)', email: 'asartist20@gmail.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin_user', tier: 'Infinite', joinedDate: '2026-05-01', lastActive: 'Just Now', status: 'Active', habitsCount: 5 },
  { id: 'usr_2', name: 'Aryan Sharma', email: 'sharma.aryan@outlook.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aryan', tier: 'Amplified', joinedDate: '2026-05-15', lastActive: '2 hours ago', status: 'Active', habitsCount: 3 },
  { id: 'usr_3', name: 'Gaurav Mehta', email: 'gaurav.resonate@gmail.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gaurav', tier: 'Infinite', joinedDate: '2026-05-10', lastActive: '1 day ago', status: 'Active', habitsCount: 8 },
  { id: 'usr_4', name: 'Anjali Patel', email: 'anjali.frequency@yahoo.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anjali', tier: 'Novice', joinedDate: '2026-05-20', lastActive: '5 mins ago', status: 'Active', habitsCount: 2 },
  { id: 'usr_5', name: 'John Doe', email: 'john@vibeos.io', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', tier: 'Novice', joinedDate: '2026-04-28', lastActive: '3 days ago', status: 'Suspended', habitsCount: 0 },
  { id: 'usr_6', name: 'Elena Rostova', email: 'elena.rostov@proton.me', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena', tier: 'Infinite', joinedDate: '2026-05-05', lastActive: '12 hours ago', status: 'Active', habitsCount: 12 },
  { id: 'usr_7', name: 'Kabir Dev', email: 'kabir.abundance@live.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kabir', tier: 'Amplified', joinedDate: '2026-05-18', lastActive: '12 mins ago', status: 'Active', habitsCount: 4 }
];

const DEFAULT_PAYMENTS: AdminPayment[] = [
  { id: 'pay_1', userName: 'Gaurav Mehta', email: 'gaurav.resonate@gmail.com', plan: 'Infinite Abundance Plan (Yearly)', amount: 199, gateway: 'Razorpay', status: 'Successful', timestamp: '2026-05-10T14:32:00Z' },
  { id: 'pay_2', userName: 'Elena Rostova', email: 'elena.rostov@proton.me', plan: 'Infinite Cosmic Access (Lifetime)', amount: 299, gateway: 'PayPal', status: 'Successful', timestamp: '2026-05-05T09:12:00Z' },
  { id: 'pay_3', userName: 'Aryan Sharma', email: 'sharma.aryan@outlook.com', plan: 'Amplified Alignment Plan (Monthly)', amount: 19, gateway: 'Razorpay', status: 'Successful', timestamp: '2026-05-15T18:45:00Z' },
  { id: 'pay_4', userName: 'Kabir Dev', email: 'kabir.abundance@live.com', plan: 'Amplified Alignment Plan (Yearly)', amount: 149, gateway: 'Razorpay', status: 'Successful', timestamp: '2026-05-18T11:20:00Z' },
  { id: 'pay_5', userName: 'Anjali Patel', email: 'anjali.frequency@yahoo.com', plan: 'Amplified Trial Key', amount: 1, gateway: 'PayPal', status: 'Failed', timestamp: '2026-05-20T16:05:00Z' },
  { id: 'pay_6', userName: 'Sarah Jenkins', email: 'sarah.manifests@gmail.com', plan: 'Infinite Abundance Plan (Yearly)', amount: 199, gateway: 'PayPal', status: 'Successful', timestamp: '2026-05-12T22:30:00Z' },
  { id: 'pay_7', userName: 'Gaurav Mehta', email: 'gaurav.resonate@gmail.com', plan: 'Advanced Sonic Hz Tuning Pack', amount: 49, gateway: 'Razorpay', status: 'Successful', timestamp: '2026-05-11T15:10:00Z' }
];

export default function AdminView({
  setView,
  user,
  userProfile,
  updateOfflineProfile,
  habits,
  setHabits,
  desires,
  setDesires,
  transactions,
  setTransactions,
  visionItems,
  setVisionItems,
  diaryEntries,
  setDiaryEntries,
  onToast
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'diagnostics' | 'content' | 'config'>('payments');
  
  const [showSimulatedData, setShowSimulatedData] = useState<boolean>(() => {
    return localStorage.getItem('vibe_os_admin_show_simulated') === 'true'; // Defaults to false
  });

  // Dynamic persistent state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminPayments, setAdminPayments] = useState<AdminPayment[]>([]);

  // Keep admin user "asartist20@gmail.com" metadata synced to user changes if the live user matches
  useEffect(() => {
    localStorage.setItem('vibe_os_admin_users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    localStorage.setItem('vibe_os_admin_payments', JSON.stringify(adminPayments));
  }, [adminPayments]);

  useEffect(() => {
    localStorage.setItem('vibe_os_admin_show_simulated', String(showSimulatedData));
  }, [showSimulatedData]);

  // Load Real Data from Firestore Live Collections on Mount
  useEffect(() => {
    const fetchUsersAndPayments = async () => {
      addLog("Connecting to Database...");
      let liveUsersList: AdminUser[] = [];
      try {
        // Query users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let selfInLive = false;
        usersSnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (docSnap.id === user?.uid) selfInLive = true;
          const joinedDateObj = d.updatedAt && typeof d.updatedAt.toDate === 'function'
            ? d.updatedAt.toDate()
            : new Date();
          liveUsersList.push({
            id: docSnap.id,
            name: d.displayName || d.email?.split('@')[0] || 'Seeker',
            email: d.email || 'offline@vibeos.com',
            avatar: d.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${docSnap.id}`,
            tier: d.tier || 'Novice',
            joinedDate: joinedDateObj.toISOString().split('T')[0],
            lastActive: 'Connected Link',
            status: d.status || 'Active',
            habitsCount: d.habitsCount || 0
          });
        });

        // Ensure current active admin user is explicitly listed if not fetched yet
        if (!selfInLive && user) {
          liveUsersList.push({
            id: user.uid || 'usr_self',
            name: `${user.displayName || 'You'} (Admin Profile)`,
            email: user.email || 'asartist20@gmail.com',
            avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=admin_user`,
            tier: (userProfile?.tier as any) || 'Infinite',
            joinedDate: new Date().toISOString().split('T')[0],
            lastActive: 'Just Now',
            status: 'Active',
            habitsCount: habits.length
          });
        }

        let finalUsers = [...liveUsersList];
        if (showSimulatedData) {
          const indexedEmails = new Set(liveUsersList.map(u => u.email.toLowerCase()));
          const extraDefaults = DEFAULT_USERS.filter(u => u.email && !indexedEmails.has(u.email.toLowerCase()) && u.id !== 'usr_self');
          finalUsers = [...finalUsers, ...extraDefaults];
        }
        setAdminUsers(finalUsers);
        addLog(`Users Registry loaded: Synced ${liveUsersList.length} accounts from Firestore.`);
      } catch (err) {
        console.error("Firestore users fetch error: ", err);
        addLog("Database fetch offline. Using sandbox fallback.");
        if (showSimulatedData) {
          setAdminUsers(DEFAULT_USERS);
        } else if (user) {
          setAdminUsers([{
            id: user.uid || 'usr_self',
            name: `${user.displayName || 'You'} (Admin Profile)`,
            email: user.email || 'asartist20@gmail.com',
            avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=admin_user`,
            tier: (userProfile?.tier as any) || 'Infinite',
            joinedDate: 'Just Now',
            lastActive: 'Just Now',
            status: 'Active',
            habitsCount: habits.length
          }]);
        }
      }

      try {
        // Query transactions
        const txSnapshot = await getDocs(collection(db, 'transactions'));
        const livePaymentsList: AdminPayment[] = [];
        txSnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const dateObj = d.timestamp && typeof d.timestamp.toDate === 'function'
            ? d.timestamp.toDate()
            : new Date();
          livePaymentsList.push({
            id: docSnap.id,
            userName: d.label || 'Vibe Seeker',
            email: d.ownerId || 'offline@vibeos.com',
            plan: d.category || 'High Hz Abundance License',
            amount: d.amount || 0,
            gateway: d.amount > 100 ? 'PayPal' : 'Razorpay',
            status: d.type === 'expense' ? 'Refunded' : 'Successful',
            timestamp: dateObj.toISOString()
          });
        });

        let finalPayments = [...livePaymentsList];
        if (showSimulatedData) {
          finalPayments = [...finalPayments, ...DEFAULT_PAYMENTS];
        }
        setAdminPayments(finalPayments);
        addLog(`Financial Registry loaded: Synced ${livePaymentsList.length} records.`);
      } catch (err) {
        console.error("Firestore transaction fetch error: ", err);
        addLog("Database sync check: Transactions loaded from sandbox fallback.");
        if (showSimulatedData) {
          setAdminPayments(DEFAULT_PAYMENTS);
        }
      }
    };

    fetchUsersAndPayments();
  }, [user, showSimulatedData]);

  // Sync active guest self logic
  useEffect(() => {
    if (user?.email) {
      setAdminUsers(prev => prev.map(u => {
        if (u.id === 'usr_self') {
          return {
            ...u,
            name: `${user.displayName || 'You'} (Admin Self)`,
            email: user.email,
            avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid || 'admin'}`,
            tier: (userProfile?.tier as any) || 'Infinite',
            habitsCount: habits.length
          };
        }
        return u;
      }));
    }
  }, [user, userProfile, habits]);

  // Search & Filter options
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('All');
  const [selectedGatewayFilter, setSelectedGatewayFilter] = useState<string>('All');

  // Manual Creation Forms
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTier, setNewUserTier] = useState<'Novice' | 'Amplified' | 'Infinite'>('Amplified');

  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPayName, setNewPayName] = useState('');
  const [newPayEmail, setNewPayEmail] = useState('');
  const [newPayPlan, setNewPayPlan] = useState('Infinite Cosmic Access (Lifetime)');
  const [newPayAmount, setNewPayAmount] = useState('199');
  const [newPayGateway, setNewPayGateway] = useState<'Razorpay' | 'PayPal'>('Razorpay');

  // System logs
  const [systemLogs, setSystemLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Admin Dashboard activated.`,
    `[${new Date().toLocaleTimeString()}] Synchronized with server.`,
    `[${new Date().toLocaleTimeString()}] Payments feed loaded (${adminPayments.length} entries).`
  ]);

  const addLog = (msg: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // KPIs
  const totalConversions = useMemo(() => {
    return adminPayments.filter(p => p.status === 'Successful');
  }, [adminPayments]);

  const totalEarnings = useMemo(() => {
    return totalConversions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [totalConversions]);

  const razorpayEarnings = useMemo(() => {
    return totalConversions.filter(p => p.gateway === 'Razorpay').reduce((acc, curr) => acc + curr.amount, 0);
  }, [totalConversions]);

  const paypalEarnings = useMemo(() => {
    return totalConversions.filter(p => p.gateway === 'PayPal').reduce((acc, curr) => acc + curr.amount, 0);
  }, [totalConversions]);

  const successfulPaymentsCount = totalConversions.length;
  
  // Recharts Chart Data Prep
  // Group payments by day/month for daily flow
  const areaChartData = useMemo(() => {
    const groups: { [key: string]: number } = {};
    totalConversions.forEach(p => {
      const date = p.timestamp.split('T')[0];
      const friendlyDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      groups[friendlyDate] = (groups[friendlyDate] || 0) + p.amount;
    });
    return Object.entries(groups).map(([date, revenue]) => ({
      date,
      Revenue: revenue
    })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [totalConversions]);

  // Distribution Chart Prep
  const pieChartData = useMemo(() => {
    const countRazorpay = totalConversions.filter(p => p.gateway === 'Razorpay').length;
    const countPaypal = totalConversions.filter(p => p.gateway === 'PayPal').length;
    return [
      { name: 'Razorpay', value: countRazorpay, revenue: razorpayEarnings, color: '#10b981' },
      { name: 'PayPal', value: countPaypal, revenue: paypalEarnings, color: '#3b82f6' }
    ];
  }, [totalConversions, razorpayEarnings, paypalEarnings]);

  const activeTiersData = useMemo(() => {
    const novice = adminUsers.filter(u => u.tier === 'Novice').length;
    const amplified = adminUsers.filter(u => u.tier === 'Amplified').length;
    const infinite = adminUsers.filter(u => u.tier === 'Infinite').length;
    return [
      { name: 'Novice', users: novice, fill: '#6b7280' },
      { name: 'Amplified', users: amplified, fill: '#f59e0b' },
      { name: 'Infinite', users: infinite, fill: '#10b981' }
    ];
  }, [adminUsers]);

  // Actions
  const handleCreateSimulatedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const newUserId = 'usr_' + Date.now();
    try {
      await setDoc(doc(db, 'users', newUserId), {
        email: newUserEmail,
        displayName: newUserName,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newUserName)}`,
        tier: newUserTier,
        status: 'Active',
        updatedAt: serverTimestamp()
      });

      const newUser: AdminUser = {
        id: newUserId,
        name: newUserName,
        email: newUserEmail,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newUserName)}`,
        tier: newUserTier,
        joinedDate: new Date().toISOString().split('T')[0],
        lastActive: 'Just Now',
        status: 'Active',
        habitsCount: 0
      };

      setAdminUsers([newUser, ...adminUsers]);
      setIsAddingUser(false);
      setNewUserName('');
      setNewUserEmail('');
      addLog(`Persistent User logged in database: ${newUserName} (${newUserTier})`);
      onToast({
        id: 'usr_added_' + Date.now(),
        title: 'User Spawned successfully',
        body: `Dynamic record for ${newUserName} populated in Firestore.`
      });
    } catch (err) {
      console.error("Firestore user creation warning: ", err);
      // Fallback
      const newUser: AdminUser = {
        id: 'usr_' + Date.now(),
        name: newUserName,
        email: newUserEmail,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newUserName)}`,
        tier: newUserTier,
        joinedDate: new Date().toISOString().split('T')[0],
        lastActive: 'Just Now',
        status: 'Active',
        habitsCount: 0
      };

      setAdminUsers([newUser, ...adminUsers]);
      setIsAddingUser(false);
      setNewUserName('');
      setNewUserEmail('');
      addLog(`Virtual User registered: ${newUserName} (${newUserTier}) [Offline Mode]`);
    }
  };

  const handleCreateSimulatedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayName || !newPayEmail || !newPayAmount) return;

    const orderAmt = parseFloat(newPayAmount);
    if (isNaN(orderAmt)) return;

    const playId = 'pay_' + Date.now();
    try {
      await setDoc(doc(db, 'transactions', playId), {
        type: 'income',
        amount: orderAmt,
        label: newPayName,
        category: newPayPlan,
        ownerId: newPayEmail,
        timestamp: serverTimestamp()
      });

      const newPayment: AdminPayment = {
        id: playId,
        userName: newPayName,
        email: newPayEmail,
        plan: newPayPlan,
        amount: orderAmt,
        gateway: newPayGateway,
        status: 'Successful',
        timestamp: new Date().toISOString()
      };

      setAdminPayments([newPayment, ...adminPayments]);
      
      // Update target user's profile tier in state and if matching in database
      setAdminUsers(prev => prev.map(u => {
        if (u.email.toLowerCase() === newPayEmail.toLowerCase()) {
          const correspondingTier = newPayPlan.includes('Infinite') ? 'Infinite' : 'Amplified';
          try {
            updateDoc(doc(db, 'users', u.id), {
              tier: correspondingTier,
              updatedAt: serverTimestamp()
            });
          } catch(e) {}
          return { ...u, tier: correspondingTier as any, lastActive: 'Just Now' };
        }
        return u;
      }));

      if (newPayEmail.toLowerCase() === user?.email?.toLowerCase()) {
        const targetTier = newPayPlan.includes('Infinite') ? 'Infinite' : 'Amplified';
        updateOfflineProfile(targetTier, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      }

      setIsAddingPayment(false);
      setNewPayName('');
      setNewPayEmail('');
      setNewPayAmount('199');
      addLog(`Persistent Transaction logs made: $${orderAmt} via ${newPayGateway} from ${newPayName}`);
      onToast({
        id: 'pay_added_' + Date.now(),
        title: 'Transaction Logged Live',
        body: `Captured $${orderAmt} and added ledger document securely.`
      });
    } catch (err) {
      console.error("Firestore payment creation warning: ", err);
      // Fallback
      const newPayment: AdminPayment = {
        id: 'pay_' + Date.now(),
        userName: newPayName,
        email: newPayEmail,
        plan: newPayPlan,
        amount: orderAmt,
        gateway: newPayGateway,
        status: 'Successful',
        timestamp: new Date().toISOString()
      };

      setAdminPayments([newPayment, ...adminPayments]);
      
      setAdminUsers(prev => prev.map(u => {
        if (u.email.toLowerCase() === newPayEmail.toLowerCase()) {
          const correspondingTier = newPayPlan.includes('Infinite') ? 'Infinite' : 'Amplified';
          return { ...u, tier: correspondingTier, lastActive: 'Just Now' };
        }
        return u;
      }));

      if (newPayEmail.toLowerCase() === user?.email?.toLowerCase()) {
        const targetTier = newPayPlan.includes('Infinite') ? 'Infinite' : 'Amplified';
        updateOfflineProfile(targetTier, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      }

      setIsAddingPayment(false);
      setNewPayName('');
      setNewPayEmail('');
      setNewPayAmount('199');
      addLog(`Transaction Captured: $${orderAmt} [Offline Mode]`);
    }
  };

  const handleUpdateUserStatus = async (id: string, newStatus: 'Active' | 'Suspended') => {
    try {
      await updateDoc(doc(db, 'users', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setAdminUsers(prev => prev.map(u => {
        if (u.id === id) {
          addLog(`Persistent user status changed: ${u.name} is now ${newStatus}`);
          return { ...u, status: newStatus };
        }
        return u;
      }));
    } catch (err) {
      console.error("Error setting user status: ", err);
      // Fallback
      setAdminUsers(prev => prev.map(u => {
        if (u.id === id) {
          addLog(`User STATUS mutated (Offline): ${u.name} is now ${newStatus}`);
          return { ...u, status: newStatus };
        }
        return u;
      }));
    }
  };

  const handleMutationTier = async (id: string, newTier: 'Novice' | 'Amplified' | 'Infinite') => {
    try {
      await updateDoc(doc(db, 'users', id), {
        tier: newTier,
        updatedAt: serverTimestamp()
      });
      
      if (id === 'usr_self' || id === user?.uid) {
        updateOfflineProfile(newTier, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      }

      setAdminUsers(prev => prev.map(u => {
        if (u.id === id) {
          addLog(`Persistent user tier updated: ${u.name} elevated to ${newTier}`);
          return { ...u, tier: newTier };
        }
        return u;
      }));
    } catch (err) {
      console.error("Firestore user tier update warning: ", err);
      // Fallback
      setAdminUsers(prev => prev.map(u => {
        if (u.id === id) {
          addLog(`User Tier overrode manually (Offline): ${u.name} elevated to ${newTier}`);
          if (id === 'usr_self') {
            updateOfflineProfile(newTier, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
          }
          return { ...u, tier: newTier };
        }
        return u;
      }));
    }
  };

  const handleDeleteUserNode = async (id: string) => {
    if (id === 'usr_self' || id === user?.uid) {
      onToast({
        id: 'delete_self_err_' + Date.now(),
        title: 'Operation Denied',
        body: 'Cannot delete your own admin session node.'
      });
      return;
    }
    const target = adminUsers.find(u => u.id === id);
    if (!target) return;
    if (confirm(`Do you want to permanently detach "${target.name}" from Vibe OS?`)) {
      try {
        await deleteDoc(doc(db, 'users', id));
        setAdminUsers(prev => prev.filter(u => u.id !== id));
        addLog(`Permanently deleted user node from live Firestore database: ${target.email}`);
      } catch (err) {
        console.error("Firestore delete user warning: ", err);
        setAdminUsers(prev => prev.filter(u => u.id !== id));
        addLog(`Detached user from local simulation: ${target.email}`);
      }
    }
  };

  const handleDeleteLedgerTransaction = async (payId: string) => {
    const target = adminPayments.find(p => p.id === payId);
    if (!target) return;
    if (confirm(`Erase payment event "${payId}" from system ledger?`)) {
      try {
        await deleteDoc(doc(db, 'transactions', payId));
        setAdminPayments(prev => prev.filter(p => p.id !== payId));
        addLog(`Permanently erased transaction from live database ledger: ${payId}`);
      } catch (err) {
        console.error("Firestore delete transaction warning: ", err);
        setAdminPayments(prev => prev.filter(p => p.id !== payId));
        addLog(`Erase payment item ${payId} belonging to ${target.email} [Offline Mode]`);
      }
    }
  };

  const handleRefundTransaction = async (payId: string) => {
    try {
      await updateDoc(doc(db, 'transactions', payId), {
        type: 'expense'
      });
      setAdminPayments(prev => prev.map(p => {
        if (p.id === payId) {
          addLog(`Initiated Full Reversal on live ledger transaction ID ${payId}. Status: Refunded`);
          return { ...p, status: 'Refunded' };
        }
        return p;
      }));
    } catch (err) {
      console.error("Firestore update transaction/refund error: ", err);
      // Fallback
      setAdminPayments(prev => prev.map(p => {
        if (p.id === payId) {
          addLog(`Initiated Full Reversal on transaction ID ${payId} [Offline Mode]. Status: Refunded`);
          return { ...p, status: 'Refunded' };
        }
        return p;
      }));
    }
  };

  const handleTriggerSimulatedBulkIncome = async () => {
    const generatedIncome = Math.round(Math.random() * 500 + 49);
    const mockNames = ['Kabir Raj', 'Isha Sen', 'Nikhil Rao', 'Tanya Gill', 'Siddharth Roy'];
    const mockEmails = ['kabir@vibe.me', 'isha@resonance.ai', 'nikh@align.io', 'tanya@quantum.com', 'sid@gmail.com'];
    const selectedIdx = Math.floor(Math.random() * mockNames.length);

    const payId = 'pay_' + Date.now();
    try {
      await setDoc(doc(db, 'transactions', payId), {
        type: 'income',
        amount: generatedIncome,
        label: mockNames[selectedIdx],
        category: 'Upgrade Pack (Instant Frequency)',
        ownerId: mockEmails[selectedIdx],
        timestamp: serverTimestamp()
      });

      const newPay: AdminPayment = {
        id: payId,
        userName: mockNames[selectedIdx],
        email: mockEmails[selectedIdx],
        plan: 'Upgrade Pack (Instant Frequency)',
        amount: generatedIncome,
        gateway: Math.random() > 0.4 ? 'Razorpay' : 'PayPal',
        status: 'Successful',
        timestamp: new Date().toISOString()
      };

      setAdminPayments(prev => [newPay, ...prev]);
      addLog(`Bulk order captured dynamically in database: $${generatedIncome} from ${newPay.userName}`);
      onToast({
        id: 'bulk_income_' + Date.now(),
        title: 'Incoming Flow Authenticated',
        body: `Captured $${generatedIncome} under live database webhook.`
      });
    } catch (err) {
      console.error("Firestore random bulk transaction creation failed: ", err);
      // Fallback
      const newPay: AdminPayment = {
        id: 'pay_' + Date.now(),
        userName: mockNames[selectedIdx],
        email: mockEmails[selectedIdx],
        plan: 'Upgrade Pack (Instant Frequency)',
        amount: generatedIncome,
        gateway: Math.random() > 0.4 ? 'Razorpay' : 'PayPal',
        status: 'Successful',
        timestamp: new Date().toISOString()
      };

      setAdminPayments(prev => [newPay, ...prev]);
      addLog(`Bulk order captured automatically offline: $${generatedIncome} from ${newPay.userName}`);
      onToast({
        id: 'bulk_income_' + Date.now(),
        title: 'Incoming Flow Authenticated',
        body: `Captured $${generatedIncome} under sandbox mock webhook.`
      });
    }
  };

  // Filter lists
  const filteredUsersList = adminUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTierFilter === 'All' || u.tier === selectedTierFilter;
    return matchesSearch && matchesTier;
  });

  const filteredPaymentsList = adminPayments.filter(p => {
    const matchesSearch = p.userName.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase()) || p.plan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGateway = selectedGatewayFilter === 'All' || p.gateway === selectedGatewayFilter;
    return matchesSearch && matchesGateway;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-24">
      
      {/* Dynamic Master Head */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('settings')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-white flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white uppercase select-none flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400" /> Admin Command Module
            </h1>
          </div>
          <p className="text-stardust/40 font-medium leading-relaxed max-w-2xl text-xs md:text-sm italic">
            "Complete metrics, simulated payment streams, and direct database tier bypass." — Vibe Administration Panel
          </p>
        </div>

        {/* Simulated and Live Controls Deck */}
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
          {/* Simulated Data Switch */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl shrink-0 select-none">
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-widest text-stardust/40">Data Integrity Mode</p>
              <p className="text-[10px] font-black text-white uppercase tracking-wide">
                {showSimulatedData ? "Show Mock Presets" : "Only Real Database"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSimulatedData(!showSimulatedData)}
              className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showSimulatedData ? 'bg-emerald-500' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  showSimulatedData ? 'translate-x-[18px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Live Admin ID Tag */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl self-start md:self-auto shrink-0">
            <div className="w-9 h-9 bg-emerald-500/15 rounded-xl border border-emerald-500/20 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Authenticated Root</p>
              <p className="text-xs font-black text-white uppercase tracking-wider">{user?.email || 'asartist20@gmail.com'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI BENTO DECK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        
        {/* Total Earned Dynamic Cash */}
        <div className="bg-black/40 border border-white/10 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-xl group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400 px-2 py-0.5 bg-emerald-500/5 rounded-full border border-emerald-500/10">TOTAL NET FLOW</span>
          </div>
          <div>
            <p className="text-4xl font-black tracking-tight text-white mb-1.5">${totalEarnings.toLocaleString()}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-stardust/40 flex items-center gap-1">
              Live Accumulated Revenue sum
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <DollarSign className="w-28 h-28 text-white" />
          </div>
        </div>

        {/* Successful payments Count */}
        <div className="bg-black/40 border border-white/10 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-xl group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400 px-2 py-0.5 bg-emerald-500/5 rounded-full border border-emerald-500/10">TRANSACTIONS</span>
          </div>
          <div>
            <p className="text-4xl font-black tracking-tight text-white mb-1.5">{successfulPaymentsCount}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-stardust/40">Purchased Licenses Issued</p>
          </div>
          <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <CreditCard className="w-28 h-28 text-white" />
          </div>
        </div>

        {/* Registered Active Souls */}
        <div className="bg-black/40 border border-white/10 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-xl group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-amber-400 px-2 py-0.5 bg-amber-500/5 rounded-full border border-amber-500/10">USER NETWORK</span>
          </div>
          <div>
            <p className="text-4xl font-black tracking-tight text-white mb-1.5">{adminUsers.length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-stardust/40">Total Registered Cosmic Brains</p>
          </div>
          <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <Users className="w-28 h-28 text-white" />
          </div>
        </div>

        {/* System Health Telemetry */}
        <div className="bg-black/40 border border-white/10 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-xl group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-purple-400 px-2 py-0.5 bg-purple-500/5 rounded-full border border-purple-500/10">DASHBOARD INTEGRITY</span>
          </div>
          <div>
            <p className="text-4xl font-black tracking-tight text-white mb-1.5">100%</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-stardust/40">Database Resonance & Synchronization</p>
          </div>
          <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-28 h-28 text-white" />
          </div>
        </div>

      </div>

      {/* THREE BENTO GRAPH SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        
        {/* BIG CHART: NET SALES FLOW FOR RECENT DAYS */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Income Flow Matrix
              </h3>
              <p className="text-[10px] uppercase font-bold text-stardust/30 tracking-widest">Calculated across successful transaction triggers</p>
            </div>
            <button 
              onClick={handleTriggerSimulatedBulkIncome}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-1 self-stretch sm:self-auto justify-center cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Trigger Mock Order ($)
            </button>
          </div>

          <div className="h-64 w-full">
            {areaChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-stardust/30 font-mono text-xs uppercase tracking-widest">
                Waiting on transaction flow simulation...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff" 
                    opacity={0.2} 
                    fontSize={9} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#ffffff" 
                    opacity={0.2} 
                    fontSize={9} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0a0c', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      fontFamily: 'sans-serif',
                      fontSize: '11px',
                      color: '#fbfbf2'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* PIE CHART: GATEWAY SPLIT (RAZORPAY VS PAYPAY) */}
        <div className="bg-black/40 border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Gateway Split
            </h3>
            <p className="text-[10px] uppercase font-bold text-stardust/30 tracking-widest mb-6">Payment processor energy allocation</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0c', 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fbfbf2'
                  }}
                  formatter={(value, name, props) => [`${value} order(s) ($${props.payload.revenue})`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Absolute indicator in middle of donut */}
            <div className="absolute text-center">
              <p className="text-[8px] font-black uppercase tracking-widest text-stardust/30">Total Vol</p>
              <p className="text-xl font-black text-white">${totalEarnings}</p>
            </div>
          </div>

          {/* Color Indicators Legend */}
          <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
            {pieChartData.map((gate, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] font-black tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gate.color }} />
                  <span className="text-white font-sans">{gate.name}</span>
                </div>
                <div className="text-right text-stardust/40">
                  <span className="text-white font-bold font-mono">${gate.revenue}</span> ({gate.value} purchases)
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SWITCHING TABS BAR */}
      <div className="flex flex-wrap gap-2.5 border-b border-white/10 pb-6 mb-8 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => { setActiveTab('payments'); setSearchQuery(''); }}
          className={`px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer ${activeTab === 'payments' ? 'bg-white text-black font-black' : 'bg-white/5 text-stardust/40 hover:bg-white/10 hover:text-white'}`}
        >
          Dynamic Payments Ledger ({adminPayments.length})
        </button>
        <button 
          onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
          className={`px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer ${activeTab === 'users' ? 'bg-white text-black font-black' : 'bg-white/5 text-stardust/40 hover:bg-white/10 hover:text-white'}`}
        >
          User Registry ({adminUsers.length})
        </button>
        <button 
          onClick={() => { setActiveTab('content'); setSearchQuery(''); }}
          className={`px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer ${activeTab === 'content' ? 'bg-white text-black font-black' : 'bg-white/5 text-stardust/40 hover:bg-white/10 hover:text-white'}`}
        >
          Content Command
        </button>
        <button 
          onClick={() => { setActiveTab('config'); setSearchQuery(''); }}
          className={`px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer ${activeTab === 'config' ? 'bg-white text-black font-black' : 'bg-white/5 text-stardust/40 hover:bg-white/10 hover:text-white'}`}
        >
          Global Config
        </button>
        <button 
          onClick={() => { setActiveTab('diagnostics'); setSearchQuery(''); }}
          className={`px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer ${activeTab === 'diagnostics' ? 'bg-white text-black font-black' : 'bg-white/5 text-stardust/40 hover:bg-white/10 hover:text-white'}`}
        >
          Debug Console Telemetry
        </button>
      </div>

      {/* FILTER AND SEARCH UTILITY DECK */}
      {['users', 'payments'].includes(activeTab) && (
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stardust/30" />
            <input 
              type="text" 
              placeholder={`Filter through registry database by username, plan or raw credentials...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white text-xs font-semibold focus:outline-none focus:border-white/20 transition-all placeholder:text-stardust/20"
            />
          </div>

          {/* Dynamic Category selectors based on tabs */}
          {activeTab === 'users' ? (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
              {['All', 'Novice', 'Amplified', 'Infinite'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTierFilter(t)}
                  className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${selectedTierFilter === t ? 'bg-white text-black font-black' : 'text-stardust/40 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
              {['All', 'Razorpay', 'PayPal'].map((gate) => (
                <button
                  key={gate}
                  onClick={() => setSelectedGatewayFilter(gate)}
                  className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${selectedGatewayFilter === gate ? 'bg-white text-black font-black' : 'text-stardust/40 hover:text-white'}`}
                >
                  {gate}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC CONTENT PANELS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* TAB 1: DYNAMIC PAYMENTS LEDGER */}
          {activeTab === 'payments' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Register manual captured order */}
              <div className="bg-black/50 border border-white/10 p-8 rounded-[2rem] shadow-2xl h-fit">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#34d399] mb-4 flex items-center gap-2 italic">
                  <CreditCard className="w-4.5 h-4.5 text-[#34d399]" /> Capture External Order
                </h3>
                
                <p className="text-stardust/40 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">
                  Log transactions completed via Razorpay dashboard or PayPal manually. Upgrades related users instantly.
                </p>

                <form onSubmit={handleCreateSimulatedPayment} className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stardust/40 mb-2">Customer Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Satish Gupta"
                      value={newPayName}
                      onChange={(e) => setNewPayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-2xl px-5 py-4 text-white text-xs font-semibold focus:outline-none transition-all placeholder:text-stardust/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stardust/40 mb-2">Customer Email ID</label>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. satish@vibeos.io"
                      value={newPayEmail}
                      onChange={(e) => setNewPayEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-2xl px-5 py-4 text-white text-xs font-semibold focus:outline-none transition-all placeholder:text-stardust/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-widest text-stardust/40 mb-2">Captured USD Amount</label>
                      <input 
                        type="number"
                        required
                        placeholder="199"
                        value={newPayAmount}
                        onChange={(e) => setNewPayAmount(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-2xl px-4 py-4 text-white text-xs font-semibold focus:outline-none transition-all placeholder:text-stardust/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-widest text-stardust/40 mb-2">Gateway Engine</label>
                      <select 
                        value={newPayGateway}
                        onChange={(e) => setNewPayGateway(e.target.value as any)}
                        className="w-full bg-neutral-950 border border-white/10 focus:border-white/20 rounded-2xl px-3 py-4 text-white text-xs font-semibold focus:outline-none transition-all"
                      >
                        <option value="Razorpay">Razorpay</option>
                        <option value="PayPal">PayPal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stardust/40 mb-2">Licensing Plan</label>
                    <select 
                      value={newPayPlan}
                      onChange={(e) => setNewPayPlan(e.target.value)}
                      className="w-full bg-neutral-950 border border-white/10 focus:border-white/20 rounded-2xl px-3 py-4 text-white text-xs font-semibold focus:outline-none transition-all"
                    >
                      <option value="Infinite Cosmic Access (Lifetime)">Infinite Cosmic Access (Lifetime) - $299</option>
                      <option value="Infinite Abundance Plan (Yearly)">Infinite Abundance Plan (Yearly) - $199</option>
                      <option value="Amplified Alignment Plan (Yearly)">Amplified Alignment Plan (Yearly) - $149</option>
                      <option value="Amplified Alignment Plan (Monthly)">Amplified Alignment Plan (Monthly) - $19</option>
                      <option value="Advanced Sonic Hz Tuning Pack">Advanced Sonic Hz Pack - $49</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4.5 h-4.5" /> Commit Order Flow
                  </button>
                </form>
              </div>

              {/* Right Column: Interactive transactions ledger table */}
              <div className="lg:col-span-2 bg-black/50 border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/50">System Transaction Registry ({filteredPaymentsList.length})</h3>
                  <button 
                    onClick={() => {
                      setAdminPayments(DEFAULT_PAYMENTS);
                      addLog("Purged sandbox transactions, loaded telemetry defaults.");
                    }}
                    className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-stardust/40 border border-white/10 transition-all cursor-pointer"
                  >
                    Load Seed Presets
                  </button>
                </div>

                {filteredPaymentsList.length === 0 ? (
                  <div className="text-center py-24 text-stardust/20 uppercase tracking-widest font-black text-xs">
                    No verified purchases matching constraints.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2 no-scrollbar">
                    {filteredPaymentsList.map((pay) => (
                       <div 
                        key={pay.id}
                        className="bg-white/[0.02] border border-white/[0.05] hover:border-white/10 p-5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 transition-all"
                      >
                        <div className="space-y-1.5 flex-grow">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase border tracking-wider bg-white/5 border-white/10 text-white/50 font-mono">
                              {pay.gateway}
                            </span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border tracking-wider font-mono ${pay.status === 'Successful' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : pay.status === 'Refunded' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                              {pay.status}
                            </span>
                            <span className="text-[8px] text-stardust/30 font-mono">
                              {new Date(pay.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          <p className="text-sm font-black text-white">{pay.userName}</p>
                          <p className="text-[10px] font-bold text-stardust/40 tracking-wide font-mono flex items-center gap-1">
                            {pay.email} | Plan: <span className="text-emerald-400 font-sans">{pay.plan}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 border-white/5 pt-3 md:pt-0 shrink-0">
                          <div className="text-left md:text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest text-stardust/30">Capture Value</p>
                            <p className="text-xl font-black italic text-white font-serif">${pay.amount}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {pay.status === 'Successful' && (
                              <button 
                                onClick={() => handleRefundTransaction(pay.id)}
                                className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/15 text-amber-400 font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                                title="Issue simulated refund workflow"
                              >
                                Refund
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteLedgerTransaction(pay.id)}
                              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 text-rose-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: USER ACCOUNT CONSCIOUSNESS MATRIX */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Manual user capture form */}
              <div className="bg-black/50 border border-white/10 p-8 rounded-[2rem] shadow-2xl h-fit">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#34d399] mb-4 flex items-center gap-2 italic">
                  <UserCheck className="w-4.5 h-4.5 text-[#34d399]" /> Spawn Consciousness Node
                </h3>
                
                <p className="text-stardust/40 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">
                  Add virtual profiles into local ecosystem telemetry, helpful for system testing, license allocations, and simulations.
                </p>

                <form onSubmit={handleCreateSimulatedUser} className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stardust/40 mb-2">Display Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Vicky Gosling"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-2xl px-5 py-4 text-white text-xs font-semibold focus:outline-none transition-all placeholder:text-stardust/25"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stardust/45 mb-2">Email Identifier</label>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. vicky@align.io"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-2xl px-5 py-4 text-white text-xs font-semibold focus:outline-none transition-all placeholder:text-stardust/25"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stardust/35 mb-2">Network Subscription Rank</label>
                    <select 
                      value={newUserTier}
                      onChange={(e) => setNewUserTier(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-white/10 focus:border-white/20 rounded-2xl px-3 py-4 text-white text-xs font-semibold focus:outline-none transition-all"
                    >
                      <option value="Novice">Novice (Free Level Access)</option>
                      <option value="Amplified">Amplified Tier - Annual ($149)</option>
                      <option value="Infinite">Infinite Tier - Sovereign ($299)</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4.5 h-4.5" /> Inject Mind Stream
                  </button>
                </form>
              </div>

              {/* Users account lists with direct subscription manipulations */}
              <div className="lg:col-span-2 space-y-6">
                {/* Bulk Actions Bar */}
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stardust/40">Collective Operations</p>
                  <div className="flex gap-2">
                     <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3 h-3" /> Export CSV
                    </button>
                    <button className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest border border-rose-500/20 text-rose-400 transition-all flex items-center gap-1.5">
                      <Trash2 className="w-3 h-3" /> Purge Inactive
                    </button>
                  </div>
                </div>

                <div className="bg-black/50 border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Active System Accounts Database ({filteredUsersList.length})</h3>
                  <button 
                    onClick={() => {
                      setAdminUsers(DEFAULT_USERS);
                      addLog("Restored mock users registry data to factory default.");
                    }}
                    className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-stardust/40 border border-white/10 transition-all cursor-pointer"
                  >
                    Load Diagnostics
                  </button>
                </div>

                {filteredUsersList.length === 0 ? (
                  <div className="text-center py-24 text-stardust/20 uppercase tracking-widest font-black text-xs">
                    No active energy coordinates matching search.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2 no-scrollbar">
                    {filteredUsersList.map((usr) => (
                      <div 
                        key={usr.id}
                        className={`bg-white/5 border border-white/5 hover:border-white/10 p-5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 transition-all ${usr.status === 'Suspended' ? 'opacity-40 grayscale-[40%]' : ''}`}
                      >
                        <div className="flex items-center gap-4 flex-grow">
                          <img 
                            src={usr.avatar} 
                            alt={usr.name}
                            className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0" 
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-black text-white">{usr.name}</p>
                              <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide border ${
                                usr.tier === 'Infinite' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                usr.tier === 'Amplified' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                'bg-gray-500/10 border-gray-500/20 text-stardust/40'
                              }`}>
                                {usr.tier}
                              </span>
                              {usr.id === 'usr_self' && (
                                <span className="text-[7.5px] font-black bg-rose-500/20 border border-rose-500/30 text-rose-400 px-1.5 rounded uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-stardust/40 font-mono tracking-wide">{usr.email}</p>
                            <div className="flex items-center gap-2 text-[8px] text-stardust/30 uppercase tracking-wider font-semibold">
                              <span>Joined: {usr.joinedDate}</span>
                              <span>•</span>
                              <span>Active: {usr.lastActive}</span>
                              <span>•</span>
                              <span>Rituals: {usr.habitsCount} active</span>
                            </div>
                          </div>
                        </div>

                        {/* Subscription Mutators */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 border-t md:border-t-0 border-white/5 pt-4 md:pt-0 shrink-0">
                          
                          {/* Force Elevating Buttons */}
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stardust/30 mb-1.5 text-left md:text-right">MUTATE LICENSE LEVEL</p>
                            <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
                              {['Novice', 'Amplified', 'Infinite'].map((lvl) => (
                                <button
                                  key={lvl}
                                  onClick={() => handleMutationTier(usr.id, lvl as any)}
                                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${usr.tier === lvl ? 'bg-white text-black font-black' : 'text-stardust/40 hover:text-white'}`}
                                >
                                  {lvl === 'Novice' ? 'Free' : lvl === 'Amplified' ? 'Amp' : 'Inf'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto pt-3 sm:pt-0">
                            {/* Ban Status Toggles */}
                            {usr.status === 'Active' ? (
                              <button 
                                onClick={() => handleUpdateUserStatus(usr.id, 'Suspended')}
                                className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 text-rose-400 transition-all cursor-pointer"
                                title="Suspend user access"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateUserStatus(usr.id, 'Active')}
                                className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/15 text-emerald-400 transition-all cursor-pointer"
                                title="Reactivate user access"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}

                            <button 
                              onClick={() => handleDeleteUserNode(usr.id)}
                              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 text-rose-400 transition-all cursor-pointer"
                              title="Delete user profile permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {/* TAB 3: CONTENT COMMAND CENTER */}
          {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-black/50 border border-white/10 p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-6 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Academy Lesson Manager
                  </h3>
                  <div className="space-y-4">
                    {[
                      { id: 1, title: 'Deep Breathwork', category: 'Energy', status: 'Live' },
                      { id: 2, title: 'Manifestation Masterclass', category: 'Mindset', status: 'Live' },
                      { id: 3, title: 'Sound Healing 101', category: 'Frequency', status: 'Draft' },
                      { id: 4, title: 'Digital Detox Protocol', category: 'Focus', status: 'Live' }
                    ].map(lesson => (
                      <div key={lesson.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lesson.status === 'Live' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            <Layout className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase tracking-wide">{lesson.title}</p>
                            <p className="text-[9px] text-stardust/30 font-bold uppercase tracking-widest">{lesson.category} • ID: {lesson.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${lesson.status === 'Live' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                            {lesson.status}
                          </span>
                          <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white">
                            <SettingsIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stardust/30 hover:bg-white/5 hover:text-white transition-all italic">
                      + Initialize New Lesson Module
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-black/50 border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Global Prompts & Vision
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stardust/40 mb-3">Active Onboarding Motto</label>
                    <textarea 
                      defaultValue="Elevate your frequency, align your reality."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-semibold focus:outline-none min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stardust/40 mb-3">Daily Inspiration Source</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        defaultValue="https://zenquotes.io/api/today"
                        className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-semibold"
                      />
                      <button className="px-4 py-2 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Test</button>
                    </div>
                  </div>
                  <button className="w-full py-4 bg-purple-500/20 border border-purple-500/30 text-purple-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-purple-500/30 transition-all">
                    Update Production Variables
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GLOBAL CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-black/50 border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5" /> Platform Governance
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div>
                        <p className="text-sm font-black text-white uppercase italic">Maintenance Mode</p>
                        <p className="text-[10px] text-stardust/40 font-bold uppercase tracking-widest mt-1">Restrict public access for internal refactoring</p>
                      </div>
                      <button className="w-12 h-6 bg-neutral-800 rounded-full relative p-1 transition-colors">
                        <div className="w-4 h-4 bg-white/20 rounded-full" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div>
                        <p className="text-sm font-black text-white uppercase italic">Experimental Hz Engine</p>
                        <p className="text-[10px] text-stardust/40 font-bold uppercase tracking-widest mt-1">Enable unstable sonic variations for Infinite users</p>
                      </div>
                      <button className="w-12 h-6 bg-emerald-500 rounded-full relative p-1 transition-colors flex justify-end">
                        <div className="w-4 h-4 bg-white rounded-full" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div>
                        <p className="text-sm font-black text-white uppercase italic">New User XP Multiplier</p>
                        <p className="text-[10px] text-stardust/40 font-bold uppercase tracking-widest mt-1">Boost initial enrollment engagement</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-black text-xl">2.5x</span>
                        <div className="flex flex-col gap-1">
                          <button className="p-1.5 hover:text-white transition-colors"><TrendingUp className="w-3 h-3" /></button>
                          <button className="p-1.5 hover:text-white transition-colors"><TrendingDown className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-black/50 border border-white/10 p-8 rounded-[2rem] shadow-2xl h-fit">
                   <h3 className="text-xs font-black uppercase tracking-widest text-[#34d399] mb-4 flex items-center gap-2 italic">
                    <ShieldCheck className="w-4.5 h-4.5" /> Security Hardening
                  </h3>
                  <div className="space-y-4">
                    <p className="text-[10px] text-stardust/40 font-black tracking-widest uppercase">Encryption Status: Secure</p>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[9px] font-black text-emerald-400 uppercase tracking-widest text-center">
                      SSL/TLS 1.3 Active
                    </div>
                    <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-400 transition-all border-dashed">
                      Revoke All OAuth Sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TELEMETRY SYSTEM CONSOLE */}
          {activeTab === 'diagnostics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="bg-black/50 border border-white/10 p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                    <Terminal className="w-4.5 h-4.5 text-emerald-400" /> Real-time System Events Stream
                  </h3>
                  
                  <div className="bg-neutral-950/80 border border-emerald-500/10 p-5 rounded-2xl h-80 overflow-y-auto font-mono text-[9.5px] space-y-3 text-emerald-400 no-scrollbar select-none">
                    {systemLogs.map((log, listIdx) => (
                      <div key={listIdx} className="leading-relaxed border-b border-white/[0.03] pb-2 last:border-0">
                        <span className="text-neutral-600 font-bold">&#10095;</span> {log}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center text-stardust/30 text-[9px] font-black uppercase tracking-widest border-t border-white/10 pt-4">
                  <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" /> Monitoring Webhooks Active</span>
                  <button 
                    onClick={() => setSystemLogs([`[${new Date().toLocaleTimeString()}] Telemetry flushed.`])}
                    className="hover:text-white uppercase tracking-wider underline cursor-pointer"
                  >
                    Clear Feed
                  </button>
                </div>
              </div>

              {/* Advanced Diagnostics Overrides */}
              <div className="bg-black/50 border border-white/10 p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#34d399] mb-6 flex items-center gap-2 italic">
                    <ShieldCheck className="w-4.5 h-4.5 text-[#34d399]" /> Advanced Control Overrides
                  </h3>

                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wide">Dynamic Simulation Sync</p>
                        <p className="text-[9px] text-stardust/35 font-semibold uppercase tracking-wider">Synchronize and reset system records to defaults</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm("Restore all dynamic registries to diagnostics factory state? This overrides active users and mock revenue.")) {
                            localStorage.removeItem('vibe_os_admin_users');
                            localStorage.removeItem('vibe_os_admin_payments');
                            setAdminUsers(DEFAULT_USERS);
                            setAdminPayments(DEFAULT_PAYMENTS);
                            addLog("Hard system restore completed successfully.");
                          }
                        }}
                        className="px-5 py-3 bg-rose-500 hover:bg-rose-400 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-500/10"
                      >
                         Factory Restore
                      </button>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wide">Generate Simulated Report</p>
                        <p className="text-[9px] text-stardust/35 font-semibold uppercase tracking-wider">Compiles financial CSV report file on console</p>
                      </div>
                      <button 
                        onClick={() => {
                          addLog("Report Compiled: admin_ledger_resonance_2026.csv generated internally.");
                          onToast({
                            id: 'csv_export_' + Date.now(),
                            title: 'CSV Compiled',
                            body: `${adminPayments.length} transactions processed.`
                          });
                        }}
                        className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                      >
                        Download Sheet
                      </button>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wide">Trigger Broadcaster Webhook</p>
                        <p className="text-[9px] text-stardust/35 font-semibold uppercase tracking-wider">Distribute a network wide global calibration update</p>
                      </div>
                      <button 
                        onClick={() => {
                          addLog("Network wide broadcast dispatched to " + adminUsers.length + " logged-in endpoints.");
                          onToast({
                            id: 'telemetry_broadcast',
                            title: 'Network Broadcast Triggered',
                            body: 'Coherence waves set to 528Hz across all nodes.'
                          });
                        }}
                        className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                      >
                        Broadcast System
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[8px] font-black uppercase text-center text-stardust/20 tracking-wider pt-6">
                  VIBE CONTROL CORE ENGINE • LICENSED IN COHERENCE PROTOCOL
                </p>
              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
}
