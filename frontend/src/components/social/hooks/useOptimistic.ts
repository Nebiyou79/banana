// components/social/hooks/useOptimistic.ts
import { useState, useCallback } from 'react';

interface OptimisticUpdate<T> {
  data: T;
  temporary: boolean;
}

export function useOptimistic<T>(
  initialData: T,
  updateFn: (current: T, update: Partial<T>) => T
) {
  const [data, setData] = useState<OptimisticUpdate<T>>({
    data: initialData,
    temporary: false
  });

  const update = useCallback(
    async (update: Partial<T>, asyncFn?: () => Promise<void>) => {
      // Optimistic update
      setData({
        data: updateFn(data.data, update),
        temporary: true
      });

      // If async function provided, execute it
      if (asyncFn) {
        try {
          await asyncFn();
          // Update with real data if successful
          setData(prev => ({
            data: updateFn(prev.data, update),
            temporary: false
          }));
        } catch (error) {
          // Rollback on error
          console.error('Optimistic update failed:', error);
          setData(prev => ({
            data: prev.data, // Keep original data
            temporary: false
          }));
          throw error;
        }
      }
    },
    [data.data, updateFn]
  );

  const revert = useCallback(() => {
    setData(prev => ({
      data: prev.data,
      temporary: false
    }));
  }, []);

  const set = useCallback((newData: T) => {
    setData({
      data: newData,
      temporary: false
    });
  }, []);

  return {
    data: data.data,
    isOptimistic: data.temporary,
    update,
    revert,
    set
  };
}