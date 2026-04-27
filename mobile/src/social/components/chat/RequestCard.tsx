/**
 * RequestCard — a single message-request row in MessageRequestsScreen.
 * -----------------------------------------------------------------------------
 * Tapping the body opens the conversation (read-only-ish — Accept required
 * before a reply can be sent). Accept/Decline are inline actions.
 */

import React from 'react';
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

export interface RequestCardProps {
  conversation: Conversation;
  onPress: () => void;
  onAccept: () => void;
  onDecline: () => void;
  actionPending?: 'accept' | 'decline' | null;
}

const RequestCard: React.FC<RequestCardProps> = ({
  conversation,
  onPress,
  onAccept,
  onDecline,
  actionPending,
}) => {
  const theme = useSocialTheme();
  const other = conversation.otherUser;
  const last = conversation.lastMessage;
  const preview = last?.content ?? 'Wants to start a conversation';

  return (
    <View style={[styles.card, { borderBottomColor: theme.border }]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.top}
        accessibilityRole="button"
        accessibilityLabel={`Open request from ${other.name}`}
      >
        <Avatar uri={other.avatar} name={other.name} size={48} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {other.name}
            </Text>
            <Text style={[styles.time, { color: theme.muted }]}>
              {formatRelativeTime(conversation.lastMessageAt ?? conversation.createdAt)}
            </Text>
          </View>
          {other.headline ? (
            <Text style={[styles.headline, { color: theme.subtext }]} numberOfLines={1}>
              {other.headline}
            </Text>
          ) : null}
          <Text style={[styles.preview, { color: theme.subtext }]} numberOfLines={2}>
            {preview}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onDecline}
          disabled={!!actionPending}
          style={[
            styles.btn,
            { borderColor: theme.border, backgroundColor: 'transparent' },
          ]}
        >
          {actionPending === 'decline' ? (
            <ActivityIndicator size="small" color={theme.text} />
          ) : (
            <Text style={[styles.btnText, { color: theme.text }]}>Decline</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAccept}
          disabled={!!actionPending}
          style={[styles.btn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
        >
          {actionPending === 'accept' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.btnText, { color: '#fff' }]}>Accept</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  info: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: { fontSize: 15, fontWeight: '700', flex: 1 },
  time: { fontSize: 11 },
  headline: { fontSize: 12, marginTop: 1 },
  preview: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, paddingLeft: 60 },
  btn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 8,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 13, fontWeight: '700' },
});

export default RequestCard;