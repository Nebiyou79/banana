// src/social/components/shared/ChatActionButton.tsx
/**
 * ChatActionButton — three-tier message entry point
 *
 * BUG FIX: `openChat` now receives a plain string (otherUser._id) and the
 * onSuccess correctly unwraps the ConversationResponse to extract the
 * conversation._id for navigation.
 *
 * Three render variants: 'primary' | 'secondary' | 'icon'
 */
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { useSocialTheme } from '../../theme/socialTheme';
import { useGetOrCreateConversation } from '../../hooks/useConversations';
import type { ConnectionStatus } from '../../types/follow';
import type { ChatUser } from '../../types/chat';

type AnyNav = NativeStackNavigationProp<any>;

export interface ChatActionButtonProps {
  status: ConnectionStatus;
  otherUser: ChatUser;
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'sm' | 'md';
  hideWhenDisabled?: boolean;
}

interface ResolvedAction {
  label: string;
  icon:
    | 'chatbubble-ellipses-outline'
    | 'paper-plane-outline'
    | 'lock-closed-outline';
  disabled: boolean;
  disabledHint?: string;
}

const resolveAction = (status: ConnectionStatus): ResolvedAction | null => {
  switch (status) {
    case 'connected':
      return {
        label: 'Start Chat',
        icon: 'chatbubble-ellipses-outline',
        disabled: false,
      };
    case 'following':
      return {
        label: 'Send Message',
        icon: 'paper-plane-outline',
        disabled: false,
      };
    case 'follow_back':
    case 'none':
      return {
        label: 'Message',
        icon: 'lock-closed-outline',
        disabled: true,
        disabledHint: 'Follow this person first to send a message.',
      };
    case 'blocked':
    case 'self':
    default:
      return null;
  }
};

const ChatActionButton: React.FC<ChatActionButtonProps> = ({
  status,
  otherUser,
  variant = 'secondary',
  size = 'md',
  hideWhenDisabled = false,
}) => {
  const theme      = useSocialTheme();
  const navigation = useNavigation<AnyNav>();
  const { mutate: openChat, isPending } = useGetOrCreateConversation();

  const action = resolveAction(status);
  if (!action) return null;
  if (action.disabled && hideWhenDisabled) return null;

  // ─── FIXED handlePress ────────────────────────────────────────────────
  const handlePress = () => {
    if (action.disabled) {
      Toast.show({
        type: 'info',
        text1: action.disabledHint ?? 'Action unavailable',
        position: 'bottom',
      });
      return;
    }
    if (!otherUser?._id) return;

    // FIX: Pass userId as a plain string, NOT as an object
    openChat(otherUser._id, {
      onSuccess: (response: any) => {
        // FIX: response is ConversationResponse { success, data: Conversation, created }
        // Extract the inner conversation object
        const conversation = response?.data ?? response;
        const convId = conversation?._id;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[ChatActionButton] onSuccess');
        console.log('[ChatActionButton] response keys:', Object.keys(response ?? {}));
        console.log('[ChatActionButton] conversation._id:', convId);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (!convId) {
          Toast.show({
            type: 'error',
            text1: 'Failed to open chat',
            text2: 'Could not get conversation. Please try again.',
            position: 'bottom',
          });
          return;
        }

        navigation.navigate('Chat', {
          conversationId: convId,
          otherUser,
        });
      },
      onError: (err: any) => {
        console.log('[ChatActionButton] ERROR:', err?.response?.data ?? err?.message);
        Toast.show({
          type: 'error',
          text1: 'Failed to open conversation',
          text2: err?.response?.data?.message ?? 'Please try again.',
          position: 'bottom',
        });
      },
    } as any);
  };

  // ── Icon variant ─────────────────────────────────────────────
  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isPending}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        accessibilityState={{ disabled: action.disabled }}
        style={[
          styles.iconBtn,
          {
            backgroundColor: theme.cardAlt,
            borderColor: theme.border,
            opacity: action.disabled ? 0.55 : 1,
          },
        ]}
      >
        {isPending ? (
          <ActivityIndicator size="small" color={theme.text} />
        ) : (
          <Ionicons name={action.icon} size={18} color={theme.text} />
        )}
      </TouchableOpacity>
    );
  }

  const sm        = size === 'sm';
  const isPrimary = variant === 'primary';

  const bg     = action.disabled ? theme.cardAlt : isPrimary ? theme.primary : 'transparent';
  const border  = action.disabled ? theme.border  : isPrimary ? theme.primary : theme.border;
  const fg = action.disabled
    ? theme.muted
    : isPrimary
    ? theme.colors.white
    : theme.text;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isPending}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityState={{ disabled: action.disabled }}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingHorizontal: sm ? 14 : 20,
          paddingVertical: sm ? 6 : 10,
          minWidth: sm ? 84 : 108,
        },
      ]}
    >
      {isPending ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.row}>
          <Ionicons
            name={action.icon}
            size={sm ? 14 : 16}
            color={fg}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.text, { color: fg, fontSize: sm ? 12 : 13 }]}>
            {action.label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1.5,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row:  { flexDirection: 'row', alignItems: 'center' },
  text: { fontWeight: '700', letterSpacing: 0.1 },
});

export default ChatActionButton;