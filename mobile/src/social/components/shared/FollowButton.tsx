/**
 * FollowButton — v2
 * -----------------------------------------------------------------------------
 * Renders the correct UI based on the derived `ConnectionStatus`:
 *
 *   none         → "Follow"        (primary fill)
 *   following    → "Following"     (neutral outline, toggles to unfollow)
 *   connected    → "Following"     (same visual as following)
 *   follow_back  → "Follow Back"   (accent fill — must stand out)
 *   blocked      → "Blocked"       (disabled, muted)
 *   self         → (renders nothing)
 *
 * Design system:
 *   - Rounded pill (borderRadius 20)
 *   - Min touch target 44px
 *   - Press scale via Animated (no reanimated)
 *   - Every color from useSocialTheme()
 */

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
  /** Show a dot before the label when connected — disabled by default. */
  showConnectedDot?: boolean;
}

const LABELS: Record<ConnectionStatus, string> = {
  none: 'Follow',
  following: 'Following',
  connected: 'Following',
  follow_back: 'Follow Back',
  blocked: 'Blocked',
  self: '',
};

const usePressScale = (to = 0.94) => {
  const scale = useRef(new Animated.Value(1)).current;
  return {
    scale,
    onPressIn: () =>
      Animated.spring(scale, {
        toValue: to,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }).start(),
    onPressOut: () =>
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start(),
  };
};

const FollowButton: React.FC<FollowButtonProps> = ({
  status,
  onPress,
  loading,
  size = 'md',
  showConnectedDot,
}) => {
  const theme = useSocialTheme();
  const { scale, onPressIn, onPressOut } = usePressScale();
  const sm = size === 'sm';

  if (status === 'self') return null;

  // ── Style resolution ─────────────────────────────────────────────────────
  const isFollowing = status === 'following' || status === 'connected';
  const isFollowBack = status === 'follow_back';
  const isBlocked = status === 'blocked';

  let bg: string;
  let border: string;
  let fg: string;

  if (isBlocked) {
    bg = theme.cardAlt;
    border = theme.border;
    fg = theme.muted;
  } else if (isFollowBack) {
    // Accent — must visually stand out from the primary "Follow".
    bg = theme.primaryDark;
    border = theme.primaryDark;
    fg = '#FFFFFF';
  } else if (isFollowing) {
    bg = 'transparent';
    border = theme.border;
    fg = theme.text;
  } else {
    // none → Follow (primary)
    bg = theme.primary;
    border = theme.primary;
    fg = '#FFFFFF';
  }

  const paddingH = sm ? 14 : 20;
  const paddingV = sm ? 6 : 10;
  const minWidth = sm ? 84 : 108;
  const fontSize = sm ? 12 : 13;

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
        accessibilityState={{ disabled: loading || isBlocked, selected: isFollowing }}
        style={[
          styles.btn,
          {
            backgroundColor: bg,
            borderColor: border,
            paddingHorizontal: paddingH,
            paddingVertical: paddingV,
            minWidth,
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
            <Text style={[styles.text, { color: fg, fontSize }]}>
              {LABELS[status]}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
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
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { fontWeight: '700', letterSpacing: 0.1 },
});

export default FollowButton;