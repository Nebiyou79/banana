// src/components/auth/RoleCard.tsx
// Usage: <RoleCard role="candidate" label="Job Seeker" emoji="🎯" description="..." selected onPress={...} primaryColor={c.candidate} />

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

interface RoleCardProps {
  role: string;
  label: string;
  description: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
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
  const { colors: c, type, spacing, radius, shadows } = useTheme();

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
            ? withAlpha(primaryColor, 0.08)
            : c.bgCard,
          borderColor: selected ? primaryColor : c.border,
          borderWidth: selected ? 2 : 1.5,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.sm,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      {/* Emoji badge */}
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: withAlpha(primaryColor, 0.12),
            borderRadius: radius.md,
          },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      {/* Label + description */}
      <View style={styles.content}>
        <Text
          style={[type.bodySm, { color: c.text, fontWeight: '700' }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          style={[type.caption, { color: c.textMuted, marginTop: 2 }]}
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
            borderColor: selected ? primaryColor : c.border,
            borderRadius: radius.full,
          },
        ]}
      >
        {selected && (
          <Ionicons name="checkmark" size={13} color={c.textInverse} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  check: {
    width: 26,
    height: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default RoleCard;