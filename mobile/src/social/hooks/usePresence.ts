// =============================================================================
// FILE: mobile/src/social/hooks/usePresence.ts — FIXED (Bug 1)
// =============================================================================

/**
 * usePresence — resolves another user's presence in real time.
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX: Now actively reads from the query cache on every render by using
 * useQuery with a proper queryFn that returns cached socket data, plus
 * falls back to the provided isOnline/lastSeen props.
 *
 * BUG 1 FIX:
 *   - Changed `enabled: false` → `enabled: Boolean(userId)` so the query
 *     actually runs and stays subscribed.
 *   - Added `refetchInterval: 3000` so the hook re-reads the cache every 3 s
 *     and triggers a re-render whenever the socket has written new data.
 *   - Added `staleTime: 0` so TanStack Query never considers the cached
 *     presence stale — every poll reads fresh data from the cache.
 *   - The queryFn reads from the same cache key that useSocketBootstrap
 *     writes to via `qc.setQueryData(SOCIAL_KEYS.presence(userId), ...)`.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { SOCIAL_KEYS } from './queryKeys';
import { formatPresenceLabel, getPresenceColor, getPresenceLevel } from '../utils/presence';
import type { PresenceLevel } from '../types/chat';

export interface UsePresenceArgs {
  userId?: string;
  lastSeen?: string | Date | null;
  isOnline?: boolean;
}

export interface UsePresenceResult {
  level: PresenceLevel;
  label: string;
  color: string;
  isOnline: boolean;
  lastSeen?: string;
}

export const usePresence = ({ userId, lastSeen, isOnline }: UsePresenceArgs): UsePresenceResult => {
  const qc = useQueryClient();

  // BUG 1 FIX: `enabled: Boolean(userId)` — query runs whenever userId exists.
  // `refetchInterval: 3000` — polls every 3 s so new socket writes are picked up.
  // `staleTime: 0` — never consider cached presence data stale between polls.
  const { data } = useQuery<{ isOnline: boolean; lastSeen: string } | null>({
    queryKey: SOCIAL_KEYS.presence(userId ?? ''),
    queryFn: () => {
      // Read directly from the cache — the socket layer writes here via
      // useSocketBootstrap → onPresenceUpdate → qc.setQueryData(SOCIAL_KEYS.presence(userId))
      const cached = qc.getQueryData<{ isOnline: boolean; lastSeen: string }>(
        SOCIAL_KEYS.presence(userId ?? '')
      );
      return cached ?? null;
    },
    // BUG 1 FIX: was `enabled: false`, now properly enabled
    enabled: Boolean(userId),
    // Poll every 3 seconds to pick up new socket writes to the cache
    refetchInterval: 3000,
    staleTime: 0,
  });

  return useMemo(() => {
    // Prefer socket-pushed data, fall back to props passed at mount time
    const online = data?.isOnline ?? isOnline ?? false;
    const seen = data?.lastSeen ?? (lastSeen ? new Date(lastSeen).toISOString() : undefined);
    const level = getPresenceLevel(seen, online);
    return {
      level,
      label: formatPresenceLabel(seen, online),
      color: getPresenceColor(level),
      isOnline: online,
      lastSeen: seen,
    };
  }, [data, isOnline, lastSeen]);
};