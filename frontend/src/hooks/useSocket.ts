/**
 * frontend/src/hooks/useSocket.ts
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Socket hook (web, NEW)
 *
 * Usage:
 *   const { socket, isConnected } = useSocket();
 *
 * The socket instance is a singleton — calling useSocket() from multiple
 * components does NOT open multiple connections.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

export function useSocket(): { socket: Socket | null; isConnected: boolean } {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);
    if (!s) return;

    setIsConnected(s.connected);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
    };
  }, []);

  return { socket, isConnected };
}

export default useSocket;