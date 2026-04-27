/**
 * usePresence — resolves another user's presence in real time.
 * -----------------------------------------------------------------------------
 * Combines the initial lastSeen/isOnline from the user object with any live
 * socket updates pushed into the presence cache by `useSocketBootstrap`.
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { SOCIAL_KEYS } from './queryKeys';
import {
  formatPresenceLabel,
  getPresenceColor,
  getPresenceLevel,
} from '../utils/presence';
import type { PresenceLevel } from '../types/chat';

export interface UsePresenceArgs {
  userId?: string;
  /** Fallback lastSeen from a user object if no live data is cached. */
  lastSeen?: string | Date | null;
  /** Fallback isOnline from a user object. */
  isOnline?: boolean;
}

export interface UsePresenceResult {
  level: PresenceLevel;
  label: string;
  color: string;
  isOnline: boolean;
  lastSeen?: string;
}

export const usePresence = ({
  userId,
  lastSeen,
  isOnline,
}: UsePresenceArgs): UsePresenceResult => {
  // Read the live entry dropped into the cache by the socket layer. No
  // network request — this is a pure cache read.
  const { data } = useQuery<{ isOnline: boolean; lastSeen: string }>({
    queryKey: SOCIAL_KEYS.presence(userId ?? ''),
    enabled: false,
    queryFn: () => Promise.resolve({ isOnline: false, lastSeen: '' }),
  });

  return useMemo(() => {
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