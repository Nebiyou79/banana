// =============================================================================
// FILE: mobile/src/social/components/chat/DaySeparator.tsx
// =============================================================================

/**
 * DaySeparator — date divider between message groups.
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows "Today", "Yesterday", or a formatted date between message clusters.
 *
 * Professional polish:
 * - Theme tokens for styling
 * - Pill-shaped container
 * - Subtle border for definition
 * - Centered with line dividers (optional)
 */

import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface DaySeparatorProps {
  label: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const DaySeparator: React.FC<DaySeparatorProps> = memo(({ label }) => {
  const theme = useSocialTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.chip,
          {
            backgroundColor: theme.cardAlt,
            borderColor: theme.border,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: theme.muted },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
});

DaySeparator.displayName = 'DaySeparator';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

export default DaySeparator;
// ✅ theme-migrated
