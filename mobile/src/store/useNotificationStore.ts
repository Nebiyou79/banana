// src/store/useNotificationStore.ts
import { create } from 'zustand';
import type { Notification } from '../types/notification';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;

  latestNotification: Notification | null;
  setLatestNotification: (notification: Notification | null) => void;

  isNotificationsScreenVisible: boolean;
  setNotificationsScreenVisible: (visible: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  incrementUnreadCount: () =>
    set((s) => ({ unreadCount: s.unreadCount + 1 })),
  decrementUnreadCount: () =>
    set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  resetUnreadCount: () => set({ unreadCount: 0 }),

  latestNotification: null,
  setLatestNotification: (n) => set({ latestNotification: n }),

  isNotificationsScreenVisible: false,
  setNotificationsScreenVisible: (v) =>
    set({ isNotificationsScreenVisible: v }),
}));