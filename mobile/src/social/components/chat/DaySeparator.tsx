// src/social/components/chat/DaySeparator.tsx
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';

export interface DaySeparatorProps {
  label: string;
}

const DaySeparator: React.FC<DaySeparatorProps> = memo(({ label }) => {
  const theme = useSocialTheme();
  const { colors, spacing, radius, dark } = theme;

  // Dark mode: darker background, subtle border
  // Light mode: light background, clean border
  const bgColor = dark ? colors.cardAlt : colors.cardAlt;
  const borderColor = dark ? 'rgba(255,255,255,0.08)' : colors.border;

  return (
    <View style={[styles.container, { paddingVertical: spacing.md }]}>
      <View
        style={[
          styles.chip,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderRadius: radius.pill,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs + 2,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: colors.muted },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
});

DaySeparator.displayName = 'DaySeparator';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  chip: {
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