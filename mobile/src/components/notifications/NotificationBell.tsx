// src/components/notifications/NotificationBell.tsx
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NotificationBadge } from './NotificationBadge';
import { useNotificationStore } from '../../store/useNotificationStore';

interface Props {
  color?: string;
  size?: number;
}

export const NotificationBell: React.FC<Props> = ({
  color = '#0A2540',
  size = 22,
}) => {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Notifications')}
      accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      accessibilityRole="button"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={styles.iconWrapper}>
        <Ionicons
          name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
          size={size}
          color={color}
        />
        <NotificationBadge size="sm" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  iconWrapper: {
    position: 'relative',
  },
});