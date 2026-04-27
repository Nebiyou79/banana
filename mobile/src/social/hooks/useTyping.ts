/**
 * useTyping — reads the cached typing flag for another user, and exposes
 * a debounced emitter for the local user's typing state.
 * -----------------------------------------------------------------------------
 * The socket layer writes `['social', 'typing', conversationId, userId] → boolean`
 * into the cache. This hook reads that value and returns a stable emitter.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { socketEmit } from '../services/socketService';

export const useTyping = (conversationId?: string, otherUserId?: string) => {
  const qc = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedRef = useRef<boolean>(false);

  // Read the live typing flag for the OTHER user.
  const isOtherTyping = Boolean(
    conversationId && otherUserId
      ? qc.getQueryData<boolean>([
          'social',
          'typing',
          conversationId,
          otherUserId,
        ])
      : false,
  );

  const emitTyping = useCallback(() => {
    if (!conversationId) return;
    if (!lastEmittedRef.current) {
      socketEmit.typingStart(conversationId);
      lastEmittedRef.current = true;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      socketEmit.typingStop(conversationId);
      lastEmittedRef.current = false;
    }, 2_000);
  }, [conversationId]);

  // Stop typing explicitly on unmount / conversation change.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (conversationId && lastEmittedRef.current) {
        socketEmit.typingStop(conversationId);
        lastEmittedRef.current = false;
      }
    };
  }, [conversationId]);

  return { isOtherTyping, emitTyping };
};