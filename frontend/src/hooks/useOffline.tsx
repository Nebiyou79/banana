/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';

// Simple interface for the hook return type
interface OfflineState {
  isOffline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingSyncs: number;
  cacheSize: string;
}

interface OfflineActions {
  saveToCache: <T>(key: string, data: T, ttl?: number) => void;
  getFromCache: <T>(key: string) => T | null;
  removeFromCache: (key: string) => void;
  clearAllCache: () => void;
  syncData: () => Promise<boolean>;
  queueOperation: (key: string, operation: any) => void;
}

// Main hook
export const useOffline = (): OfflineState & OfflineActions => {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const [cacheSize, setCacheSize] = useState('0 KB');

  // Initialize offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      // Auto sync when coming online
      syncData();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update cache size
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateCacheSize = () => {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache-')) {
          const value = localStorage.getItem(key);
          if (value) total += value.length;
        }
      }
      
      if (total < 1024) {
        setCacheSize(`${total} B`);
      } else if (total < 1024 * 1024) {
        setCacheSize(`${(total / 1024).toFixed(1)} KB`);
      } else {
        setCacheSize(`${(total / (1024 * 1024)).toFixed(1)} MB`);
      }
    };

    updateCacheSize();
    const interval = setInterval(updateCacheSize, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update pending syncs count
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('pending-')) count++;
    }
    setPendingSyncs(count);
  }, []);

  // Save to cache
  const saveToCache = useCallback(<T,>(key: string, data: T, ttl?: number): void => {
    if (typeof window === 'undefined') return;

    try {
      const cacheKey = `cache-${key}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : null,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }, []);

  // Get from cache
  const getFromCache = useCallback(<T,>(key: string): T | null => {
    if (typeof window === 'undefined') return null;

    try {
      const cacheKey = `cache-${key}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const { data, expiresAt } = JSON.parse(cached);

      // Check if expired
      if (expiresAt && Date.now() > expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return data as T;
    } catch {
      return null;
    }
  }, []);

  // Remove from cache
  const removeFromCache = useCallback((key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`cache-${key}`);
  }, []);

  // Clear all cache
  const clearAllCache = useCallback((): void => {
    if (typeof window === 'undefined') return;

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache-') || key?.startsWith('pending-')) {
        keys.push(key);
      }
    }

    keys.forEach(key => localStorage.removeItem(key));
    setPendingSyncs(0);
    setCacheSize('0 KB');
  }, []);

  // Queue operation for later sync
  const queueOperation = useCallback((key: string, operation: any): void => {
    if (typeof window === 'undefined') return;

    try {
      const pendingKey = `pending-${key}`;
      localStorage.setItem(pendingKey, JSON.stringify({
        operation,
        timestamp: Date.now(),
      }));
      
      setPendingSyncs(prev => prev + 1);
    } catch (error) {
      console.error('Failed to queue operation:', error);
    }
  }, []);

  // Sync data with server
  const syncData = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (isOffline) return false;
    if (isSyncing) return false;

    setIsSyncing(true);

    try {
      // Get all pending operations
      const pendingOps: any[] = [];
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('pending-')) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              pendingOps.push(JSON.parse(value));
              keysToRemove.push(key);
            } catch {
              // Skip invalid entries
            }
          }
        }
      }

      // Simulate API sync (replace with actual API call)
      if (pendingOps.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Remove synced operations
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      setLastSyncTime(new Date());
      setPendingSyncs(0);
      setIsSyncing(false);
      
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      setIsSyncing(false);
      return false;
    }
  }, [isOffline, isSyncing]);

  return {
    // State
    isOffline,
    isSyncing,
    lastSyncTime,
    pendingSyncs,
    cacheSize,

    // Actions
    saveToCache,
    getFromCache,
    removeFromCache,
    clearAllCache,
    syncData,
    queueOperation,
  };
};

// Simplified data hook
export const useOfflineData = <T,>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    autoSync?: boolean;
  }
) => {
  const { ttl = 5 * 60 * 1000, autoSync = true } = options || {};
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { isOffline, getFromCache, saveToCache, syncData } = useOffline();

  const loadData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = getFromCache<T>(key);
        if (cached) {
          setData(cached);
          setIsLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const freshData = await fetcher();
      
      // Save to cache
      saveToCache(key, freshData, ttl);
      setData(freshData);
      
    } catch (err: any) {
      setError(err);
      
      // Try cache as fallback
      const cached = getFromCache<T>(key);
      if (cached) {
        setData(cached);
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, getFromCache, saveToCache, ttl]);

  // Auto sync when coming online
  useEffect(() => {
    if (!isOffline && autoSync) {
      loadData(true);
    }
  }, [isOffline, autoSync, loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => loadData(true), [loadData]);
  const updateCache = useCallback((newData: T) => {
    saveToCache(key, newData, ttl);
    setData(newData);
  }, [key, saveToCache, ttl]);

  return {
    data,
    isLoading,
    error,
    refresh,
    updateCache,
    isOffline,
  };
};

export default useOffline;