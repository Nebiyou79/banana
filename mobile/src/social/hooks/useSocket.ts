// src/social/hooks/useSocket.ts
/**
 * Mobile socket hook — returns the singleton socket + connection state.
 * Does NOT create a new connection per component (singleton in socketService).
 */
import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { socketService } from '../services/socketService';

export const useSocket = (): {
  socket: Socket | null;
  isConnected: boolean;
} => {
  const [socket, setSocket] = useState<Socket | null>(
    socketService.getSocket()
  );
  const [isConnected, setIsConnected] = useState<boolean>(
    socketService.isConnected()
  );

  useEffect(() => {
    const s = socketService.connect();
    if (!s) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    setSocket(s);
    setIsConnected(s.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket, isConnected };
};

export default useSocket;