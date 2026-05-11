// src/components/shared/InfoRow.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface InfoRowProps {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => {
  const { colors: c, spacing, type } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.sm,
        gap: spacing.md,
      }}
    >
      {icon ? (
        <Ionicons name={icon} size={16} color={c.textMuted} style={{ marginTop: 2 }} />
      ) : null}
      <Text
        style={{
          ...type.bodySm,
          color: c.textMuted,
          width: 100,
          flexShrink: 0,
        }}
      >
        {label}
      </Text>
      <Text
        style={{ ...type.body, color: c.text, flex: 1 }}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
};