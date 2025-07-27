import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getPendingActions, clearPendingActions, setLastSync, getLastSync } from './storage';

export function useSync(syncFunction: () => Promise<void>) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSyncState] = useState<Date | null>(null);
  const [hasPending, setHasPending] = useState(false);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Check for pending actions
  const checkPending = useCallback(async () => {
    const pending = await getPendingActions();
    setHasPending(pending.length > 0);
  }, []);

  // Get last sync time
  const checkLastSync = useCallback(async () => {
    const date = await getLastSync();
    setLastSyncState(date);
  }, []);

  useEffect(() => {
    checkPending();
    checkLastSync();
  }, [checkPending, checkLastSync]);

  // Sync handler
  const handleSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncFunction();
      await clearPendingActions();
      const now = new Date();
      await setLastSync(now);
      setLastSyncState(now);
      setHasPending(false);
    } catch (e) {
      // handle error if needed
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, syncFunction]);

  return {
    isOnline,
    isSyncing,
    lastSync,
    hasPending,
    handleSync,
  };
} 