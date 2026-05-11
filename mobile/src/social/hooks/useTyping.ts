// =============================================================================
// FILE: mobile/src/social/hooks/useTyping.ts — FIXED (Bug 2)
// =============================================================================

/**
 * useTyping — reads the cached typing flag for another user, and exposes
 * a debounced emitter for the local user's typing state.
 * ─────────────────────────────────────────────────────────────────────────────
 * BUG 2 FIX:
 *   The original code called `qc.getQueryData()` inside a `useCallback`,
 *   which is NOT reactive — it reads the cache value once and never causes
 *   a re-render when the socket bootstrap writes a new value.
 *
 *   Fix: Replace the imperative `qc.getQueryData()` call with a reactive
 *   `useQuery` that polls the cache key every second. When the socket
 *   bootstrap writes `['social', 'typing', conversationId, userId] → true`
 *   via `qc.setQueryData(...)`, the next poll picks it up and triggers a
 *   re-render with `isOtherTyping = true`.
 *
 *   Cache key format must match what useSocket.ts writes:
 *     ['social', 'typing', evt.conversationId, evt.userId]
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { socketEmit } from '../services/socketService';

export const useTyping = (conversationId?: string, otherUserId?: string) => {
  const qc = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedRef = useRef<boolean>(false);

  // BUG 2 FIX: Use a reactive `useQuery` with `refetchInterval: 1000` instead
  // of the non-reactive `qc.getQueryData()` inside a `useCallback`.
  //
  // Cache key matches exactly what useSocket.ts writes on the 'chat:typing' event:
  //   qc.setQueryData(['social', 'typing', evt.conversationId, evt.userId], evt.isTyping)
  const { data: isOtherTyping = false } = useQuery<boolean>({
    queryKey: ['social', 'typing', conversationId ?? '', otherUserId ?? ''],
    queryFn: () => {
      // Read the value the socket bootstrap wrote into the cache.
      // Returns false (not typing) if no socket event has been received yet.
      const cached = qc.getQueryData<boolean>([
        'social',
        'typing',
        conversationId ?? '',
        otherUserId ?? '',
      ]);
      return cached ?? false;
    },
    enabled: Boolean(conversationId && otherUserId),
    // Poll every second — typing events are short-lived (2 s timeout on the
    // emitter side) so fast polling is necessary for a responsive indicator.
    refetchInterval: 1000,
    staleTime: 0,
  });

  // Debounced typing emitter — emits typingStart once, then schedules
  // typingStop after 2 s of silence. Called from MessageInput.onTyping.
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
    }, 2000);
  }, [conversationId]);

  // Cleanup: stop typing when conversation changes or component unmounts
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