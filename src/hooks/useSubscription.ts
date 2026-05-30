
import { useState, useEffect, useCallback } from 'react';
import { UserSubscription, Tier } from '../types/subscription';
import { useAuth } from './useAuth';

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/subscription/status/${user.uid}`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch subscription status:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    loading,
    tier: (status?.tier || 'Free') as Tier,
    isSovereign: status?.tier === 'Sovereign',
    isTrialing: status?.status === 'trialing',
    refresh: fetchStatus
  };
}
