// src/services/notificationService.ts
import httpClient from '../lib/api';
import type { NotificationListResponse, NotificationPreferences } from '../types/notification';

interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: string;
  read?: boolean;
}

// ── List & Count ────────────────────────────────────────────────────────
export const getNotifications = async (
  params: GetNotificationsParams = {}
): Promise<NotificationListResponse> => {
  const { data } = await httpClient.get('/notifications', { params });
  return data;
};

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await httpClient.get('/notifications/count');
  return data.data.count;
};

// ── Mark Read ───────────────────────────────────────────────────────────
export const markNotificationRead = async (id: string): Promise<void> => {
  await httpClient.put(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await httpClient.put('/notifications/read-all');
};

// ── Delete ──────────────────────────────────────────────────────────────
export const deleteNotification = async (id: string): Promise<void> => {
  await httpClient.delete(`/notifications/${id}`);
};

export const clearAllNotifications = async (): Promise<void> => {
  await httpClient.delete('/notifications/clear');
};

// ── Push Subscription ───────────────────────────────────────────────────
export const subscribePush = async (payload: {
  platform: 'ios' | 'android' | 'web';
  fcmToken?: string;
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
}): Promise<void> => {
  await httpClient.post('/notifications/push/subscribe', payload);
};

export const unsubscribePush = async (deviceId: string): Promise<void> => {
  await httpClient.delete('/notifications/push/unsubscribe', {
    data: { deviceId },
  });
};

// ── Preferences ─────────────────────────────────────────────────────────
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const { data } = await httpClient.get('/notifications/preferences');
  return data.data;
};

export const updateNotificationPreferences = async (
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const { data } = await httpClient.put('/notifications/preferences', updates);
  return data.data;
};