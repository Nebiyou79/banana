// src/components/notifications/NotificationBootstrap.tsx
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { connectSocket, disconnectSocket } from '../../services/socketService';
import { registerForPushNotifications } from '../../services/pushTokenService';
import { useSocketNotifications } from '../../hooks/useSocketNotifications';
import { useNotificationCount } from '../../hooks/useNotifications';
import { navigateFromNotification } from '../../utils/notificationNavigation';
import { useAuthStore } from '../../store/authStore';
import { useQueryClient } from '@tanstack/react-query';

export const NotificationBootstrap: React.FC = () => {
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [isQueryClientReady, setIsQueryClientReady] = useState(false);

  // Check if QueryClient is available
  useEffect(() => {
    if (queryClient) {
      setIsQueryClientReady(true);
    }
  }, [queryClient]);

  // Only use these hooks when QueryClient is ready
  useSocketNotifications(isAuthenticated && isQueryClientReady);
  useNotificationCount();

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
      registerForPushNotifications();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const notifData = response.notification.request.content.data;
        if (notifData?.screen) {
          setTimeout(() => {
            navigateFromNotification({
              screen: notifData.screen as string,
              entityId: notifData.entityId as string,
              entityType: notifData.entityType as string,
              params: (notifData.params as Record<string, unknown>) ?? {},
            });
          }, 300);
        }
      }
    );
    return () => subscription.remove();
  }, []);

  return null;
};