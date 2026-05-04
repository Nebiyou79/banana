// StarRating.tsx
import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  color?: string;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = memo(
  ({ value, max = 5, size = 20, color, interactive = false, onChange }) => {
    const { colors } = useTheme();
    const starColor = color ?? colors.accent;
    const stars = Array.from({ length: max }, (_, i) => i + 1);

    const getIconName = (star: number): any => {
      if (value >= star) return 'star';
      if (value >= star - 0.5) return 'star-half';
      return 'star-outline';
    };

    return (
      <View style={styles.row}>
        {stars.map((star) =>
          interactive ? (
            <TouchableOpacity
              key={star}
              onPress={() => onChange?.(star)}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <Ionicons
                name={value >= star ? 'star' : 'star-outline'}
                size={size}
                color={value >= star ? starColor : colors.textMuted}
              />
            </TouchableOpacity>
          ) : (
            <Ionicons
              key={star}
              name={getIconName(star)}
              size={size}
              color={value >= star - 0.5 ? starColor : colors.textMuted}
            />
          ),
        )}
      </View>
    );
  },
);

StarRating.displayName = 'StarRating';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});