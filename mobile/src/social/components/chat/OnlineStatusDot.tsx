// =============================================================================
// FILE: mobile/src/social/components/chat/OnlineStatusDot.tsx
// =============================================================================

/**
 * OnlineStatusDot — presence indicator ring.
 * ─────────────────────────────────────────────────────────────────────────────
 * Color mapping:
 * - Green  → online (now)
 * - Yellow → recently active (within 15 min)
 * - Gray   → away (>15 min, <1 hour)
 * - Hidden → offline (>1 hour or unknown)
 *
 * Professional polish:
 * - Theme-aware color derivation
 * - Configurable size
 * - Optional white border for placement on avatars
 * - Proper border radius for perfect circle
 */

import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';
import { getPresenceColor, getPresenceLevel } from '../../utils/presence';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface OnlineStatusDotProps {
  lastSeen?: string | Date | null;
  isOnline?: boolean;
  size?: number;
  showBorder?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

const OnlineStatusDot: React.FC<OnlineStatusDotProps> = memo(
  ({ lastSeen, isOnline, size = 12, showBorder = false }) => {
    const theme = useSocialTheme();
    const level = getPresenceLevel(lastSeen, isOnline ?? false);
    const color = getPresenceColor(level);

    if (color === 'transparent') return null;

    return (
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            borderWidth: showBorder ? 2 : 0,
            borderColor: theme.card,
          },
        ]}
        accessibilityLabel={
          level === 'online'
            ? 'Online'
            : level === 'recently'
            ? 'Recently active'
            : 'Away'
        }
      />
    );
  }
);

OnlineStatusDot.displayName = 'OnlineStatusDot';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

export default OnlineStatusDot;
// ✅ theme-migrated
