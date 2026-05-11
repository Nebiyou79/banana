// src/components/shared/DetailSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';

interface DetailSectionProps {
  title: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}

export const DetailSection: React.FC<DetailSectionProps> = ({
  title,
  action,
  children,
}) => {
  const { colors: c, spacing, type } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <Text style={{ ...type.h3, color: c.text, fontWeight: '700' }}>
          {title}
        </Text>
        {action ? (
          <TouchableOpacity
            onPress={action.onPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ color: c.primary, fontWeight: '600' }}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Card>{children}</Card>
    </View>
  );
};