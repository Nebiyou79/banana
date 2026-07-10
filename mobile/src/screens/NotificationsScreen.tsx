// src/screens/NotificationsScreen.tsx
import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useNotificationList,
  useMarkAllRead,
  useClearAllNotifications,
} from '../hooks/useNotifications';
import { useNotificationStore } from '../store/useNotificationStore';
import { NotificationItem } from '../components/notifications/NotificationItem';
import type { Notification } from '../types/notification';

export const NotificationsScreen: React.FC = () => {
  const setVisible = useNotificationStore((s) => s.setNotificationsScreenVisible);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useNotificationList();

  const { mutate: markAllRead } = useMarkAllRead();
  const { mutate: clearAll } = useClearAllNotifications();

  useLayoutEffect(() => {
    setVisible(true);
    return () => setVisible(false);
  }, [setVisible]);

  const notifications: Notification[] = data?.pages.flatMap(
    (p) => p.data.notifications
  ) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem notification={item} />
    ),
    []
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0A2540" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          <Text style={styles.actionBarText}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
          </Text>
          <View style={styles.actionBarButtons}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => markAllRead()}
              >
                <Ionicons name="checkmark-done" size={16} color="#3B82F6" />
                <Text style={styles.actionBtnText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => clearAll()}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>
                Clear all
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              When something happens, you'll see it here.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={{ padding: 20 }} color="#0A2540" />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  actionBarText: {
    fontSize: 13,
    color: '#6B7280',
  },
  actionBarButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});