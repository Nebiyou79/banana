// src/social/components/chat/MessageRequestBanner.tsx
/**
 * MessageRequestBanner — shown at the top of ChatScreen when status === 'request'.
 * -----------------------------------------------------------------------------
 * Two render modes:
 *   • mode='sender'   — viewer sent the request; show "Waiting for acceptance"
 *   • mode='receiver' — viewer received it; show Accept / Decline buttons
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';

interface BaseProps {
  senderName: string;
}

type Props =
  | (BaseProps & { mode: 'sender' })
  | (BaseProps & {
      mode: 'receiver';
      onAccept: () => void;
      onDecline: () => void;
      loading?: boolean;
    });

const MessageRequestBanner: React.FC<Props> = (props) => {
  const theme = useSocialTheme();

  if (props.mode === 'sender') {
    return (
      <View
        style={[
          styles.wrap,
          { backgroundColor: theme.cardAlt, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.row}>
          <Ionicons name="time-outline" size={18} color={theme.subtext} />
          <Text style={[styles.text, { color: theme.text }]}>
            <Text style={{ fontWeight: '700' }}>Request sent.</Text>{' '}
            Waiting for {props.senderName} to accept.
          </Text>
        </View>
      </View>
    );
  }

  // Receiver
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.cardAlt, borderBottomColor: theme.border },
      ]}
    >
      <View style={styles.row}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={theme.subtext}
        />
        <Text style={[styles.text, { color: theme.text }]} numberOfLines={2}>
          <Text style={{ fontWeight: '700' }}>{props.senderName}</Text>{' '}
          wants to message you. Accept to reply.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={props.onDecline}
          disabled={props.loading}
          style={[
            styles.btn,
            { borderColor: theme.border, backgroundColor: 'transparent' },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Decline message request"
        >
          <Text style={[styles.btnText, { color: theme.text }]}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={props.onAccept}
          disabled={props.loading}
          style={[
            styles.btn,
            {
              backgroundColor: theme.primary,
              borderColor: theme.primary,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Accept message request"
        >
          {props.loading ? (
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
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  text: { fontSize: 13, flex: 1, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8 },
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

export default MessageRequestBanner;