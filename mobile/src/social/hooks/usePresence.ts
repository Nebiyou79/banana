// src/social/hooks/usePresence.ts
/**
 * Subscribe to presence updates for ONE user (e.g., the other participant in
 * a chat). Seed from props, then track live updates via socket.
 *
 * Also exports `getPresenceLabel` / `getPresenceLevel` helpers that the
 * ChatScreen header and OnlineStatusDot use for rendering.
 */
import { useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';

export type PresenceLevel =
  | 'active_now'
  | 'recently'
  | 'older'
  | 'inactive';

export interface Presence {
  isOnline: boolean;
  lastSeen: string | Date | null;
}

export function getPresenceLevel(
  lastSeen?: string | Date | null,
  isOnline?: boolean
): PresenceLevel {
  if (isOnline) return 'active_now';
  if (!lastSeen) return 'inactive';
  const last =
    typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  if (Number.isNaN(last.getTime())) return 'inactive';
  const diffMs = Date.now() - last.getTime();
  const diffMin = diffMs / 60_000;
  const diffHour = diffMin / 60;
  const diffDay = diffHour / 24;
  if (diffMin < 5) return 'active_now';
  if (diffHour < 24) return 'recently';
  if (diffDay < 14) return 'older';
  return 'inactive';
}

export function getPresenceLabel(
  lastSeen?: string | Date | null,
  isOnline?: boolean
): string {
  if (isOnline) return 'Active now';
  if (!lastSeen) return 'Offline';
  const last =
    typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  if (Number.isNaN(last.getTime())) return 'Offline';
  const diffMs = Date.now() - last.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'Active now';
  if (diffMin < 5) return 'Active now';
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  if (diffHour < 24) return `Active ${diffHour}h ago`;
  if (diffDay < 14) return `Active ${diffDay}d ago`;
  return 'Active a while ago';
}

export const usePresence = (
  userId: string | undefined,
  seed?: Presence
): Presence => {
  const { socket } = useSocket();
  const [presence, setPresence] = useState<Presence>({
    isOnline: !!seed?.isOnline,
    lastSeen: seed?.lastSeen ?? null,
  });
  const lastAskedRef = useRef<number>(0);

  // Seed from prop whenever it changes (e.g., navigating into a new chat).
  useEffect(() => {
    if (seed) {
      setPresence({
        isOnline: !!seed.isOnline,
        lastSeen: seed.lastSeen ?? null,
      });
    }
  }, [seed?.isOnline, seed?.lastSeen]);

  // Live updates.
  useEffect(() => {
    if (!socket || !userId) return;

    const onUpdate = (payload: {
      userId: string;
      isOnline: boolean;
      lastSeen: string;
    }) => {
      if (payload.userId !== userId) return;
      setPresence({
        isOnline: !!payload.isOnline,
        lastSeen: payload.lastSeen,
      });
    };

    const onBatch = (batch: Record<string, Presence>) => {
      const p = batch?.[userId];
      if (!p) return;
      setPresence({ isOnline: !!p.isOnline, lastSeen: p.lastSeen ?? null });
    };

    socket.on('presence:update', onUpdate);
    socket.on('presence:batch', onBatch);

    // Ask once on mount (handy if the other user was already online).
    const now = Date.now();
    if (now - lastAskedRef.current > 10_000) {
      socket.emit('presence:query', { userIds: [userId] });
      lastAskedRef.current = now;
    }

    return () => {
      socket.off('presence:update', onUpdate);
      socket.off('presence:batch', onBatch);
    };
  }, [socket, userId]);

  return presence;
};

export default usePresence;