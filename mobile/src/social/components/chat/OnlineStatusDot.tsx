// src/social/components/chat/OnlineStatusDot.tsx
/**
 * Mobile online-status dot. Tiers:
 *   active_now → green  (#10B981)
 *   recently   → yellow (#EAB308)
 *   older      → gray   (#6B7280)
 *   inactive   → not rendered
 */
import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { getPresenceLevel, type PresenceLevel } from '../../hooks/usePresence';

export interface OnlineStatusDotProps {
  lastSeen?: Date | string | null;
  isOnline?: boolean;
  size?: number;
  showBorder?: boolean;
  borderColor?: string;
  style?: ViewStyle;
}

const COLORS: Record<PresenceLevel, string> = {
  active_now: '#10B981',
  recently: '#EAB308',
  older: '#6B7280',
  inactive: 'transparent',
};

const OnlineStatusDot: React.FC<OnlineStatusDotProps> = memo(
  ({
    lastSeen,
    isOnline,
    size = 12,
    showBorder = true,
    borderColor = '#FFFFFF',
    style,
  }) => {
    const level = getPresenceLevel(lastSeen, isOnline);
    if (level === 'inactive') return null;

    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: COLORS[level],
            borderWidth: showBorder ? 2 : 0,
            borderColor,
          },
          style,
        ]}
        accessibilityRole="image"
      />
    );
  }
);

OnlineStatusDot.displayName = 'OnlineStatusDot';

export default OnlineStatusDot;