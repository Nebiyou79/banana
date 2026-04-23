// src/social/components/chat/MessageRequestBanner.tsx
/**
 * Shown at the top of ChatScreen when conversation.status === 'request'.
 *
 * Two visual modes:
 *  - isRequester=true  → "Request sent" passive card (no actions).
 *  - isRequester=false → "<Name> wants to message you" with Accept/Decline.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface MessageRequestBannerProps {
  otherUserName: string;
  isRequester: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

const MessageRequestBanner: React.FC<MessageRequestBannerProps> = memo(
  ({ otherUserName, isRequester, onAccept, onDecline, isLoading }) => {
    const theme = useSocialTheme();

    if (isRequester) {
      return (
        <View
          style={[
            styles.card,
            styles.pendingCard,
            { borderBottomColor: theme.border },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color="#D97706"
            style={{ marginRight: 10, marginTop: 2 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: '#78350F' }]}>
              Message request sent
            </Text>
            <Text style={[styles.sub, { color: '#A16207' }]}>
              Waiting for {otherUserName} to accept. They'll see your
              messages once they reply.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.card,
          styles.incomingCard,
          { borderBottomColor: theme.border },
        ]}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.title, { color: '#1E3A8A' }]}>
            {otherUserName} wants to message you
          </Text>
          <Text style={[styles.sub, { color: '#1D4ED8' }]}>
            Accept to chat freely. Replying also accepts.
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onDecline}
            disabled={isLoading}
            style={[styles.btn, styles.btnOutline]}
            accessibilityLabel="Decline request"
          >
            {isLoading ? (
              <ActivityIndicator color="#1D4ED8" size="small" />
            ) : (
              <Text style={styles.btnOutlineText}>Decline</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAccept}
            disabled={isLoading}
            style={[styles.btn, { backgroundColor: theme.primary }]}
            accessibilityLabel="Accept request"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnSolidText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

MessageRequestBanner.displayName = 'MessageRequestBanner';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
  },
  incomingCard: {
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  sub: {
    fontSize: 11,
    lineHeight: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  btnOutlineText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  btnSolidText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MessageRequestBanner;