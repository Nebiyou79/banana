import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  compact?: boolean;
}

/**
 * Pill-shaped chip used for filters, skills, hashtags, interests.
 * Role-aware: selected state uses the current user's primary colour.
 */
const Chip: React.FC<Props> = memo(
  ({ label, selected, onPress, iconRight, style, compact }) => {
    const theme = useSocialTheme();
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.75 : 1}
        disabled={!onPress}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? theme.primary : theme.cardAlt,
            borderColor: selected ? theme.primary : theme.border,
            paddingHorizontal: compact ? 10 : 14,
            paddingVertical: compact ? 5 : 8,
            minHeight: compact ? 30 : 36,
          },
          style,
        ]}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityState={{ selected: !!selected }}
      >
        <Text
          style={[
            styles.label,
            {
              color: selected ? '#fff' : theme.text,
              fontSize: compact ? 11 : 12,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {iconRight}
      </TouchableOpacity>
    );
  }
);

Chip.displayName = 'Chip';

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: { fontWeight: '600' },
});

export default Chip;