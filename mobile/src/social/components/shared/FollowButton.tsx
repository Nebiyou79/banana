// src/social/components/shared/FollowButton.tsx
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocialTheme } from '../../theme/socialTheme';
import type { ConnectionStatus } from '../../types/follow';

export interface FollowButtonProps {
  status: ConnectionStatus;
  onPress: () => void;
  loading?: boolean;
  size?: 'sm' | 'md';
  showConnectedDot?: boolean;
}

const LABELS: Record<ConnectionStatus, string> = {
  none:        'Follow',
  following:   'Following',
  connected:   'Following',
  follow_back: 'Follow Back',
  blocked:     'Blocked',
  self:        '',
};

const usePressScale = (to = 0.94) => {
  const scale = useRef(new Animated.Value(1)).current;
  return {
    scale,
    onPressIn:  () =>
      Animated.spring(scale, {
        toValue: to, useNativeDriver: true, speed: 50, bounciness: 0,
      }).start(),
    onPressOut: () =>
      Animated.spring(scale, {
        toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4,
      }).start(),
  };
};

const FollowButton: React.FC<FollowButtonProps> = ({
  status, onPress, loading, size = 'md', showConnectedDot,
}) => {
  const theme = useSocialTheme();
  const { colors, spacing, radius, type, dark } = theme;
  const { scale, onPressIn, onPressOut } = usePressScale();
  const sm = size === 'sm';

  if (status === 'self') return null;

  const isFollowing  = status === 'following' || status === 'connected';
  const isFollowBack = status === 'follow_back';
  const isBlocked    = status === 'blocked';

  // Color logic based on dark/light mode and status
  let bg: string, border: string, fg: string;

  if (isBlocked) {
    bg = colors.cardAlt;
    border = colors.border;
    fg = colors.textMuted;
  } else if (isFollowBack) {
    // Follow Back: primary dark (vibrant)
    bg = colors.primaryDark || colors.primary;
    border = colors.primary;
    fg = colors.white;
  } else if (isFollowing) {
    // Following: transparent with border (subtle)
    bg = 'transparent';
    border = colors.border;
    fg = colors.text;
  } else {
    // Follow: solid primary
    bg = colors.primary;
    border = colors.primary;
    fg = colors.white;
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={loading || isBlocked}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={LABELS[status]}
        accessibilityState={{ 
          disabled: loading || isBlocked, 
          selected: isFollowing 
        }}
        style={[
          styles.btn,
          {
            backgroundColor: bg,
            borderColor: border,
            paddingHorizontal: sm ? spacing.sm + 6 : spacing.lg - 4,
            paddingVertical: sm ? spacing.xs + 2 : spacing.sm + 2,
            minWidth: sm ? 84 : 108,
            borderRadius: radius.pill,
            minHeight: 44,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <View style={styles.row}>
            {status === 'connected' && showConnectedDot && (
              <Ionicons
                name="checkmark-circle"
                size={sm ? 12 : 14}
                color={fg}
                style={{ marginRight: 4 }}
              />
            )}
            {isFollowBack && (
              <Ionicons
                name="person-add"
                size={sm ? 12 : 14}
                color={fg}
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={[
              sm ? type.bodySm : type.bodyMd, 
              { color: fg }
            ]}>
              {LABELS[status]}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  btn: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});

export default FollowButton;