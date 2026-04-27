// src/social/components/chat/DaySeparator.tsx
/**
 * DaySeparator — a small centered chip showing "Today", "Yesterday", or
 * a date like "Apr 26". Inserted between message groups so users can scan
 * by day in long conversations.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';

export interface DaySeparatorProps {
  label: string;
}

const DaySeparator: React.FC<DaySeparatorProps> = ({ label }) => {
  const theme = useSocialTheme();
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.chip,
          { backgroundColor: theme.cardAlt, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.text, { color: theme.muted }]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { alignItems: 'center', marginVertical: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
});

export default DaySeparator;