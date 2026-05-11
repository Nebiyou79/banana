// =============================================================================
// FILE: mobile/src/social/components/chat/RequestCard.tsx
// =============================================================================

/**
 * RequestCard — message request row in MessageRequestsScreen.
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows sender info, preview text, and inline Accept/Decline actions.
 *
 * Professional polish:
 * - Theme tokens throughout
 * - Avatar with presence dot
 * - Loading states for accept/decline
 * - Proper tap target for the row body
 * - Separator using hairline width
 * - Timestamp with relative formatting
 */

import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';
import Avatar from '../shared/Avatar';
import { formatRelativeTime } from '../../utils/presence';
import type { Conversation } from '../../types/chat';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface RequestCardProps {
  conversation: Conversation;
  onPress: () => void;
  onAccept: () => void;
  onDecline: () => void;
  actionPending?: 'accept' | 'decline' | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

const RequestCard: React.FC<RequestCardProps> = memo(
  ({ conversation, onPress, onAccept, onDecline, actionPending }) => {
    const theme = useSocialTheme();
    const other = conversation.otherUser;
    const last = conversation.lastMessage;

    const preview = last?.content ?? 'Wants to start a conversation';
    const hasAction = actionPending != null;

    return (
      <View
        style={[
          styles.container,
          {
            borderBottomColor: theme.border,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.md,
          },
        ]}
      >
        {/* Main tap area */}
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.65}
          style={styles.topSection}
          accessibilityRole="button"
          accessibilityLabel={`Open request from ${other?.name ?? 'Unknown'}`}
        >
          <Avatar
            uri={other?.avatar ?? null}
            name={other?.name ?? 'U'}
            size={48}
            lastSeen={other?.lastSeen}
            isOnline={other?.isOnline}
          />

          <View style={styles.info}>
            {/* Name + Time */}
            <View style={styles.nameRow}>
              <Text
                style={[styles.name, { color: theme.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {other?.name ?? 'Unknown'}
              </Text>
              <Text style={[styles.time, { color: theme.muted }]}>
                {formatRelativeTime(
                  conversation.lastMessageAt ?? conversation.createdAt
                )}
              </Text>
            </View>

            {/* Headline */}
            {other?.headline ? (
              <Text
                style={[styles.headline, { color: theme.subtext }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {other.headline}
              </Text>
            ) : null}

            {/* Preview */}
            <Text
              style={[styles.preview, { color: theme.subtext }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {preview}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={styles.actions}>
          {/* Decline */}
          <TouchableOpacity
            onPress={onDecline}
            disabled={hasAction}
            style={[
              styles.actionButton,
              {
                borderColor: theme.border,
                backgroundColor: 'transparent',
                borderRadius: theme.radius.pill,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Decline request"
            accessibilityState={{ disabled: hasAction }}
          >
            {actionPending === 'decline' ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <Text style={[styles.actionText, { color: theme.text }]}>
                Decline
              </Text>
            )}
          </TouchableOpacity>

          {/* Accept */}
          <TouchableOpacity
            onPress={onAccept}
            disabled={hasAction}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
                borderRadius: theme.radius.pill,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Accept request"
            accessibilityState={{ disabled: hasAction }}
          >
            {actionPending === 'accept' ? (
              <ActivityIndicator size="small" color={theme.colors.white} /> // theme.colors.onPrimary → theme.colors.white
            ) : (
              <Text style={[styles.actionText, { color: theme.colors.white }]}> // theme.colors.onPrimary → theme.colors.white
                Accept
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

RequestCard.displayName = 'RequestCard';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topSection: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 11,
    flexShrink: 0,
  },
  headline: {
    fontSize: 12,
    marginTop: 1,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingLeft: 60,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1.5,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default RequestCard;
// ✅ theme-migrated
