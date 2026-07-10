// src/components/notifications/NotificationItem.tsx
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Notification, NotificationType } from '../../types/notification';
import { navigateFromNotification } from '../../utils/notificationNavigation';
import { useMarkNotificationRead } from '../../hooks/useNotifications';

const TYPE_ICON: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  new_follower:            { name: 'person-add', color: '#3B82F6' },
  new_connection:          { name: 'people', color: '#10B981' },
  post_liked:              { name: 'heart', color: '#EF4444' },
  post_reacted:            { name: 'happy', color: '#F59E0B' },
  post_comment:            { name: 'chatbubble', color: '#3B82F6' },
  comment_reply:           { name: 'return-down-forward', color: '#6366F1' },
  post_mentioned:          { name: 'at', color: '#8B5CF6' },
  comment_mentioned:       { name: 'at', color: '#8B5CF6' },
  post_shared:             { name: 'share-social', color: '#06B6D4' },
  new_message:             { name: 'chatbubble-ellipses', color: '#0A2540' },
  message_request:         { name: 'mail', color: '#F59E0B' },
  message_request_accepted:{ name: 'checkmark-circle', color: '#10B981' },
  new_job_match:           { name: 'briefcase', color: '#F1BB03' },
  application_received:    { name: 'document-text', color: '#0A2540' },
  application_status:      { name: 'refresh-circle', color: '#6366F1' },
  application_shortlisted: { name: 'star', color: '#F59E0B' },
  application_rejected:    { name: 'close-circle', color: '#EF4444' },
  offer_made:              { name: 'gift', color: '#10B981' },
  bid_received:            { name: 'hammer', color: '#F1BB03' },
  bid_status_changed:      { name: 'refresh-circle', color: '#6366F1' },
  bid_shortlisted:         { name: 'star', color: '#F59E0B' },
  bid_awarded:             { name: 'trophy', color: '#F1BB03' },
  bid_rejected:            { name: 'close-circle', color: '#EF4444' },
  bid_revealed:            { name: 'eye', color: '#06B6D4' },
  tender_addendum:         { name: 'document', color: '#8B5CF6' },
  tender_invited:          { name: 'mail-open', color: '#F1BB03' },
  proposal_received:       { name: 'document-attach', color: '#7C3AED' },
  proposal_status:         { name: 'refresh-circle', color: '#6366F1' },
  proposal_shortlisted:    { name: 'star', color: '#F59E0B' },
  proposal_awarded:        { name: 'trophy', color: '#7C3AED' },
  proposal_rejected:       { name: 'close-circle', color: '#EF4444' },
  verification_submitted:  { name: 'shield', color: '#6366F1' },
  verification_status:     { name: 'shield-checkmark', color: '#6366F1' },
  verification_approved:   { name: 'shield-checkmark', color: '#10B981' },
  verification_rejected:   { name: 'shield', color: '#EF4444' },
  appointment_confirmed:   { name: 'calendar', color: '#10B981' },
  appointment_reminder:    { name: 'alarm', color: '#F59E0B' },
  appointment_cancelled:   { name: 'calendar', color: '#EF4444' },
  new_appointment_admin:   { name: 'calendar', color: '#0A2540' },
  referral_signup:         { name: 'person-add', color: '#10B981' },
  referral_completed:      { name: 'checkmark-circle', color: '#10B981' },
  reward_earned:           { name: 'gift', color: '#F1BB03' },
  system_announcement:     { name: 'megaphone', color: '#6366F1' },
  profile_view:            { name: 'eye', color: '#6366F1' },
};

const getTypeIcon = (type: NotificationType) =>
  TYPE_ICON[type] ?? { name: 'notifications' as const, color: '#6366F1' };

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

interface Props {
  notification: Notification;
}

export const NotificationItem: React.FC<Props> = ({ notification }) => {
  const { mutate: markRead } = useMarkNotificationRead();
  const typeIcon = getTypeIcon(notification.type);

  const handlePress = useCallback(() => {
    if (!notification.read) {
      markRead(notification._id);
    }
    navigateFromNotification(notification.data);
  }, [notification, markRead]);

  return (
    <TouchableOpacity
      style={[styles.container, !notification.read && styles.unread]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={notification.title}
    >
      <View style={styles.avatarWrapper}>
        {notification.actor?.avatar ? (
          <Image
            source={{ uri: notification.actor.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: typeIcon.color + '1A' }]}>
            <Ionicons name={typeIcon.name} size={20} color={typeIcon.color} />
          </View>
        )}
        {notification.actor?.avatar && (
          <View style={[styles.typeIconOverlay, { backgroundColor: typeIcon.color }]}>
            <Ionicons name={typeIcon.name} size={10} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>

      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  unread: {
    backgroundColor: '#EFF6FF',
  },
  avatarWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  body: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginTop: 6,
    flexShrink: 0,
  },
});