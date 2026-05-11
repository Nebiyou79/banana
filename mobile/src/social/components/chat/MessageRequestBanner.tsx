// =============================================================================
// FILE: mobile/src/social/components/chat/MessageRequestBanner.tsx
// =============================================================================

/**
 * MessageRequestBanner — shown at the top of ChatScreen for request conversations.
 * ─────────────────────────────────────────────────────────────────────────────
 * Two modes:
 *   'sender'   — Current user sent the request. Shows waiting status.
 *   'receiver' — Current user received the request. Shows Accept/Decline.
 *
 * Professional polish:
 * - Theme tokens for all colors
 * - Proper touch targets (44px minimum)
 * - Loading states on buttons
 * - Icons for visual clarity
 * - Clear informational hierarchy
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

// ─── Props ───────────────────────────────────────────────────────────────────

interface BaseBannerProps {
  senderName: string;
}

type MessageRequestBannerProps =
  | (BaseBannerProps & {
      mode: 'sender';
    })
  | (BaseBannerProps & {
      mode: 'receiver';
      onAccept: () => void;
      onDecline: () => void;
      loading?: boolean;
    });

// ─── Component ───────────────────────────────────────────────────────────────

const MessageRequestBanner: React.FC<MessageRequestBannerProps> = memo(
  (props) => {
    const theme = useSocialTheme();

    // ── Sender mode: "Waiting for acceptance" ──────────────────────
    if (props.mode === 'sender') {
      return (
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.withAlpha(theme.colors.danger, 0.08),
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={styles.row}>
            <Ionicons
              name="time-outline"
              size={18}
              color={theme.colors.danger} // theme.colors.danger — unchanged
              style={{ marginTop: 1 }}
            />
            <View style={styles.textContainer}>
              <Text style={[styles.text, { color: theme.text }]}>
                <Text style={{ fontWeight: '700' }}>Request sent.</Text>
              </Text>
              <Text style={[styles.subtext, { color: theme.subtext }]}>
                Waiting for {props.senderName} to accept. Your messages are
                visible but you won't receive replies until they accept.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // ── Receiver mode: "Accept or Decline" ─────────────────────────
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.withAlpha(theme.colors.info, 0.06),
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.row}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={theme.colors.info}
            style={{ marginTop: 1 }}
          />
          <View style={styles.textContainer}>
            <Text style={[styles.text, { color: theme.text }]}>
              <Text style={{ fontWeight: '700' }}>{props.senderName}</Text>{' '}
              wants to send you a message.
            </Text>
            <Text style={[styles.subtext, { color: theme.subtext }]}>
              Accept to chat or decline to hide this conversation.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {/* Decline button */}
          <TouchableOpacity
            onPress={props.onDecline}
            disabled={props.loading}
            style={[
              styles.button,
              {
                borderColor: theme.border,
                backgroundColor: 'transparent',
                borderRadius: theme.radius.pill,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Decline message request from ${props.senderName}`}
            accessibilityState={{ disabled: props.loading }}
          >
            <Text
              style={[
                styles.buttonText,
                { color: theme.text },
              ]}
            >
              Decline
            </Text>
          </TouchableOpacity>

          {/* Accept button */}
          <TouchableOpacity
            onPress={props.onAccept}
            disabled={props.loading}
            style={[
              styles.button,
              {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
                borderRadius: theme.radius.pill,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Accept message request from ${props.senderName}`}
            accessibilityState={{ disabled: props.loading }}
          >
            {props.loading ? (
              <ActivityIndicator size="small" color={theme.colors.white} /> // theme.colors.onPrimary → theme.colors.white
            ) : (
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.colors.white }, // theme.colors.onPrimary → theme.colors.white
                ]}
              >
                Accept
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

MessageRequestBanner.displayName = 'MessageRequestBanner';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  subtext: {
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingLeft: 30,
  },
  button: {
    flex: 1,
    borderWidth: 1.5,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default MessageRequestBanner;
// ✅ theme-migrated
