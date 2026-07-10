// src/hooks/useSocketNotifications.ts
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../services/socketService';
import { useNotificationStore } from '../store/useNotificationStore';
import { NOTIFICATION_KEYS } from './useNotifications';
import type { Notification } from '../types/notification';

export const useSocketNotifications = (isAuthenticated: boolean) => {
  const qc = useQueryClient();
  const {
    setUnreadCount,
    incrementUnreadCount,
    setLatestNotification,
    isNotificationsScreenVisible,
  } = useNotificationStore();

  // Add safety check - if no queryClient, don't proceed
  const isQueryClientAvailable = !!qc;
  
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  useEffect(() => {
    if (!isAuthenticated || !isQueryClientAvailable) return; // Added check

    const socket = getSocket();
    if (!socket) return;

    const onNotificationNew = (notification: Notification) => {
      qc.setQueriesData(
        { queryKey: NOTIFICATION_KEYS.list() },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any, i: number) =>
              i === 0
                ? {
                    ...page,
                    data: {
                      ...page.data,
                      notifications: [notification, ...page.data.notifications],
                    },
                  }
                : page
            ),
          };
        }
      );

      incrementUnreadCount();

      if (!isNotificationsScreenVisible) {
        setLatestNotification(notification);
        setTimeout(() => setLatestNotification(null), 4000);
      }
    };

    const onNotificationCount = ({ count }: { count: number }) => {
      setUnreadCount(count);
      qc.setQueryData(NOTIFICATION_KEYS.count(), count);
    };

    const onNotificationCleared = () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.list() });
      setUnreadCount(0);
      qc.setQueryData(NOTIFICATION_KEYS.count(), 0);
    };

    socket.on('notification:new', onNotificationNew);
    socket.on('notification:count', onNotificationCount);
    socket.on('notification:cleared', onNotificationCleared);

    socket.emit('notification:get_count');

    return () => {
      socket.off('notification:new', onNotificationNew);
      socket.off('notification:count', onNotificationCount);
      socket.off('notification:cleared', onNotificationCleared);
    };
  }, [isAuthenticated, isQueryClientAvailable]);
};