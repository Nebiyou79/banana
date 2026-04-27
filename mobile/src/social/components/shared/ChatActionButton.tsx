// src/social/components/shared/ChatActionButton.tsx
/**
 * ChatActionButton — three-tier message entry point.
 * -----------------------------------------------------------------------------
 *   Tier 1: connected (mutual)        → "Start Chat"     opens chat directly
 *   Tier 2: following (one-way)       → "Send Message"   creates a request
 *   Tier 3: none (no relationship)    → "Message" disabled + tooltip toast
 *   Hidden: self / blocked / follow_back  (caller's responsibility upstream;
 *           we still defensively hide for self / blocked here)
 *
 * For follow_back we treat as Tier 3 — they follow me but I don't follow
 * them, so I cannot message them until I follow back.
 *
 * Three render variants:
 *   - 'primary'   filled prominent button (PublicProfile main action)
 *   - 'secondary' outline button (PublicProfile + lists)
 *   - 'icon'      compact icon-only (search rows / dense lists)
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
  /** Hide entirely instead of showing the disabled state. */
  hideWhenDisabled?: boolean;
}

interface ResolvedAction {
  label: string;
  icon: 'chatbubble-ellipses-outline' | 'paper-plane-outline' | 'lock-closed-outline';
  /** disabled = true → tap shows a toast instead of opening chat */
  disabled: boolean;
  /** When disabled, this is the message shown in the toast. */
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
  const theme = useSocialTheme();
  const navigation = useNavigation<AnyNav>();
  const { mutate: openChat, isPending } = useGetOrCreateConversation();

  const action = resolveAction(status);
  if (!action) return null;
  if (action.disabled && hideWhenDisabled) return null;

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
    openChat(
      { userId: otherUser._id },
      {
        onSuccess: (conv) => {
          navigation.navigate('Chat', {
            conversationId: conv._id,
            otherUser,
          });
        },
      },
    );
  };

  // ── Icon variant ─────────────────────────────────────────────────────
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
            backgroundColor: action.disabled ? theme.cardAlt : theme.cardAlt,
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

  const sm = size === 'sm';
  const isPrimary = variant === 'primary';

  // Resolve colors
  const bg = action.disabled
    ? theme.cardAlt
    : isPrimary
    ? theme.primary
    : 'transparent';
  const border = action.disabled
    ? theme.border
    : isPrimary
    ? theme.primary
    : theme.border;
  const fg = action.disabled
    ? theme.muted
    : isPrimary
    ? '#FFFFFF'
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { fontWeight: '700', letterSpacing: 0.1 },
});

export default ChatActionButton;