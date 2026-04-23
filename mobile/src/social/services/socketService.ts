/**
 * mobile/src/social/services/socketService.ts
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Socket.IO client (mobile, NEW)
 *
 * Connect lazily. Token is read from useAuthStore at connect-time so the
 * caller doesn't need to await anything async beyond the socket handshake.
 *
 * The server's Socket.IO endpoint is at the ROOT of the API host, not
 * behind /api/v1. We strip the version suffix from API_BASE to get it.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';

let socket: Socket | null = null;

function readToken(): string | null {
  try {
    const state = useAuthStore.getState() as any;
    return (
      state.token ??
      state.accessToken ??
      state?.user?.token ??
      null
    );
  } catch {
    return null;
  }
}

function getBaseUrl(): string {
  // API_BASE typically ends in "/api/v1"; Socket.IO attaches at the server root.
  return (API_BASE || '').replace(/\/api\/v\d+\/?$/, '');
}

export const socketService = {
  /**
   * Connect if not already connected. Returns the live socket (or null if
   * no token is available yet).
   */
  connect: (): Socket | null => {
    if (socket && socket.connected) return socket;

    const token = readToken();
    if (!token) return null;

    if (socket && !socket.connected) {
      socket.connect();
      return socket;
    }

    socket = io(getBaseUrl(), {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
      timeout: 10_000,
    });

    return socket;
  },

  disconnect: (): void => {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  },

  getSocket: (): Socket | null => socket,

  isConnected: (): boolean => !!socket?.connected,

  emit: (event: string, data?: any): void => {
    socket?.emit(event, data);
  },

  /**
   * Subscribe. Returns an unsubscribe function — always call in useEffect
   * cleanup to avoid leaks between route changes.
   */
  on: (
    event: string,
    handler: (...args: any[]) => void
  ): (() => void) => {
    const s = socketService.connect();
    if (!s) return () => {};
    s.on(event, handler);
    return () => {
      s.off(event, handler);
    };
  },
};

export default socketService;