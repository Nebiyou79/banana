/**
 * frontend/src/lib/socket.ts
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Socket.IO client singleton (web, NEW)
 *
 * Connect lazily (on first use) so unauthenticated pages never open a socket.
 * The token comes from the same localStorage slot used by the REST client.
 * ────────────────────────────────────────────────────────────────────────────
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getBaseUrl(): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  // Socket.IO attaches at the server root (same port as Express), not at /api/v1.
  return apiUrl.replace(/\/api\/v\d+\/?$/, '');
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getSocket(): Socket | null {
  if (socket && socket.connected) return socket;

  const token = getToken();
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
    withCredentials: true,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function emit(event: string, payload?: any): void {
  const s = getSocket();
  s?.emit(event, payload);
}

/**
 * Subscribe to an event. Returns an unsubscribe fn — call in useEffect cleanup.
 */
export function on(event: string, handler: (...args: any[]) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on(event, handler);
  return () => {
    s.off(event, handler);
  };
}

export default { getSocket, disconnectSocket, emit, on };