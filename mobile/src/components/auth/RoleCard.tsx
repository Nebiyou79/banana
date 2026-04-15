// src/components/auth/RoleCard.tsx
// Usage: <RoleCard role="candidate" label="Job Seeker" emoji="🎯" selected onPress={...} primaryColor="#3B82F6" />

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useThemes';

interface RoleCardProps {
  role:         string;
  label:        string;
  description:  string;
  icon:         string;
  emoji:        string;
  selected:     boolean;
  onPress:      () => void;
  primaryColor: string;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  label,
  description,
  emoji,
  selected,
  onPress,
  primaryColor,
}) => {
  const { colors, type, spacing, radius, shadows } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}: ${description}`}
      style={({ pressed }) => [
        styles.card,
        shadows.sm,
        {
          backgroundColor: selected
            ? `${primaryColor}14`
            : colors.bgCard,
          borderColor:  selected ? primaryColor : colors.borderPrimary,
          borderWidth:  selected ? 2 : 1.5,
          borderRadius: radius.lg,
          padding:      spacing.lg,
          marginBottom: spacing.sm,
          opacity:      pressed ? 0.88 : 1,
        },
      ]}
    >
      {/* Emoji badge */}
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: `${primaryColor}18`,
            borderRadius:    radius.md,
          },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      {/* Label + description */}
      <View style={styles.content}>
        <Text style={[type.h4, { color: colors.textPrimary }]}>{label}</Text>
        <Text
          style={[type.bodySm, { color: colors.textMuted, marginTop: 2 }]}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>

      {/* Checkmark */}
      <View
        style={[
          styles.check,
          {
            backgroundColor: selected ? primaryColor : 'transparent',
            borderColor:     selected ? primaryColor : colors.borderPrimary,
            borderRadius:    radius.full,
          },
        ]}
      >
        {selected && (
          <Ionicons name="checkmark" size={13} color="#fff" />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
  },
  iconBox: {
    width:          48,
    height:         48,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  emoji: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  check: {
    width:       26,
    height:      26,
    borderWidth: 1.5,
    alignItems:  'center',
    justifyContent: 'center',
    flexShrink:  0,
  },
});

export default RoleCard;