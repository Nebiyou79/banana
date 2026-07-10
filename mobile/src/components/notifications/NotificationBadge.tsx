// src/components/notifications/NotificationBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotificationStore } from '../../store/useNotificationStore';

interface Props {
  count?: number;
  size?: 'sm' | 'md';
}

export const NotificationBadge: React.FC<Props> = ({ count, size = 'md' }) => {
  const storeCount = useNotificationStore((s) => s.unreadCount);
  const displayCount = count ?? storeCount;

  if (displayCount <= 0) return null;

  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, isSmall && styles.badgeSm]}>
      <Text style={[styles.text, isSmall && styles.textSm]}>
        {displayCount > 99 ? '99+' : displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeSm: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    top: -3,
    right: -3,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  textSm: {
    fontSize: 9,
    lineHeight: 12,
  },
});