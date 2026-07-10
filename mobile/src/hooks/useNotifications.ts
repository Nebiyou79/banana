// src/hooks/useNotifications.ts
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/notificationService';
import { useNotificationStore } from '../store/useNotificationStore';
import type { NotificationPreferences } from '../types/notification';
import { useAuthStore } from '../store/authStore';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (params?: object) => ['notifications', 'list', params] as const,
  count: () => ['notifications', 'count'] as const,
  preferences: () => ['notifications', 'preferences'] as const,
};

// ── Unread count ─────────────────────────────────────────────────────────
// src/hooks/useNotifications.ts - Update useNotificationCount
export const useNotificationCount = () => {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const { isAuthenticated } = useAuthStore(); // Add this import

  return useQuery({
    queryKey: NOTIFICATION_KEYS.count(),
    queryFn: async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
      return count;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: isAuthenticated, // Changed from true to isAuthenticated
  });
};

// ── Infinite scrolling notification list ────────────────────────────────
export const useNotificationList = (filters?: { type?: string; read?: boolean }) => {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_KEYS.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      getNotifications({ page: pageParam as number, limit: 20, ...filters }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    staleTime: 10_000,
  });
};

// ── Mark single notification read ────────────────────────────────────────
export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  const decrementUnreadCount = useNotificationStore((s) => s.decrementUnreadCount);

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (_, notificationId) => {
      qc.setQueriesData(
        { queryKey: NOTIFICATION_KEYS.list() },
        (old: InfiniteData<any> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: {
                ...page.data,
                notifications: page.data.notifications.map((n: any) =>
                  n._id === notificationId
                    ? { ...n, read: true, readAt: new Date().toISOString() }
                    : n
                ),
              },
            })),
          };
        }
      );
      decrementUnreadCount();
    },
  });
};

// ── Mark all read ────────────────────────────────────────────────────────
export const useMarkAllRead = () => {
  const qc = useQueryClient();
  const resetUnreadCount = useNotificationStore((s) => s.resetUnreadCount);

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.list() });
      qc.setQueryData(NOTIFICATION_KEYS.count(), 0);
      resetUnreadCount();
    },
  });
};

// ── Delete notification ──────────────────────────────────────────────────
export const useDeleteNotification = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.list() });
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.count() });
    },
  });
};

// ── Clear all ────────────────────────────────────────────────────────────
export const useClearAllNotifications = () => {
  const qc = useQueryClient();
  const resetUnreadCount = useNotificationStore((s) => s.resetUnreadCount);

  return useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.list() });
      qc.setQueryData(NOTIFICATION_KEYS.count(), 0);
      resetUnreadCount();
    },
  });
};

// ── Preferences ──────────────────────────────────────────────────────────
export const useNotificationPreferences = () =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.preferences(),
    queryFn: getNotificationPreferences,
    staleTime: 5 * 60_000,
    enabled: true,
  });

export const useUpdateNotificationPreferences = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<NotificationPreferences>) =>
      updateNotificationPreferences(updates),
    onSuccess: (updatedPrefs) => {
      qc.setQueryData(NOTIFICATION_KEYS.preferences(), updatedPrefs);
    },
  });
};