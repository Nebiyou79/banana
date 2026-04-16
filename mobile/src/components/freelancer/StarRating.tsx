/**
 * mobile/src/components/freelancers/StarRating.tsx
 *
 * Reusable star rating component.
 * - `interactive` mode: tappable stars for review submission
 * - `display` mode: read-only filled/half stars
 */

import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  value: number;           // 0–5
  max?: number;            // default 5
  size?: number;           // icon size, default 20
  color?: string;          // star color, default #FBBF24
  interactive?: boolean;   // allow tapping
  onChange?: (value: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = memo(
  ({
    value,
    max = 5,
    size = 20,
    color = '#FBBF24',
    interactive = false,
    onChange,
  }) => {
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
                color={value >= star ? color : '#D1D5DB'}
              />
            </TouchableOpacity>
          ) : (
            <Ionicons
              key={star}
              name={getIconName(star)}
              size={size}
              color={value >= star - 0.5 ? color : '#D1D5DB'}
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
