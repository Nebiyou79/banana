import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ─── Single chip ──────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  onRemove?: () => void;
  /** Prefix icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Render a colour dot instead of icon */
  dotColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
  /** 'filled' = solid bg when selected (default), 'outline' = border only */
  variant?: 'filled' | 'outline';
  /** Badge count shown on the right of the label */
  count?: number;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onPress,
  onRemove,
  icon,
  dotColor,
  disabled = false,
  style,
  variant = 'filled',
  count,
}) => {
  const { theme } = useThemeStore();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  // Colour logic
  const isFilled = variant === 'filled';
  const bg = selected
    ? isFilled
      ? theme.colors.primary
      : theme.colors.primaryLight
    : theme.colors.surface;

  const borderColor = selected
    ? theme.colors.primary
    : theme.colors.border;

  const textColor = selected
    ? isFilled
      ? '#fff'
      : theme.colors.primary
    : theme.colors.textSecondary;

  const iconColor = selected
    ? isFilled
      ? '#fff'
      : theme.colors.primary
    : theme.colors.textMuted;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[
          styles.chip,
          { backgroundColor: bg, borderColor },
          disabled && styles.disabled,
          style,
        ]}
      >
        {/* Dot indicator */}
        {dotColor && (
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        )}

        {/* Prefix icon */}
        {icon && !dotColor && (
          <Ionicons
            name={icon}
            size={14}
            color={iconColor}
            style={styles.prefixIcon}
          />
        )}

        {/* Label */}
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>

        {/* Count badge */}
        {count !== undefined && count > 0 && (
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: selected
                  ? 'rgba(255,255,255,0.25)'
                  : theme.colors.borderLight,
              },
            ]}
          >
            <Text
              style={[
                styles.countText,
                { color: selected && isFilled ? '#fff' : theme.colors.textMuted },
              ]}
            >
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        )}

        {/* Remove button (× when removable) */}
        {onRemove && selected && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onRemove();
            }}
            hitSlop={6}
            style={styles.removeButton}
          >
            <Ionicons
              name="close-circle"
              size={15}
              color={isFilled ? 'rgba(255,255,255,0.8)' : theme.colors.primary}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Chip group (horizontal scroll) ─────────────────────────────────────────

interface ChipOption {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  dotColor?: string;
  count?: number;
}

interface FilterChipGroupProps {
  options: ChipOption[];
  selected: string[];
  onToggle: (id: string) => void;
  multi?: boolean;
  containerStyle?: ViewStyle;
  variant?: 'filled' | 'outline';
}

export const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
  options,
  selected,
  onToggle,
  multi = true,
  containerStyle,
  variant = 'filled',
}) => {
  const { theme } = useThemeStore();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.groupContent, containerStyle]}
    >
      {options.map((opt) => (
        <FilterChip
          key={opt.id}
          label={opt.label}
          icon={opt.icon}
          dotColor={opt.dotColor}
          count={opt.count}
          selected={selected.includes(opt.id)}
          variant={variant}
          onPress={() => {
            if (!multi) {
              // Radio behaviour — can't deselect (always one selected)
              onToggle(opt.id);
            } else {
              onToggle(opt.id);
            }
          }}
        />
      ))}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 99,
    borderWidth: 1.5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginRight: 8,
    gap: 5,
  },
  disabled: {
    opacity: 0.45,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  prefixIcon: {
    marginRight: -2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  countBadge: {
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  removeButton: {
    marginLeft: 2,
  },
  groupContent: {
    paddingVertical: 2,
    paddingHorizontal: 16,
  },
});
