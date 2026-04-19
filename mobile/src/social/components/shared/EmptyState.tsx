import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFadeIn, useSlideUp } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Friendly empty-state block with soft entrance animation. Used on every
 * list screen when there's nothing to render.
 */
const EmptyState: React.FC<Props> = memo(
  ({ icon = 'sparkles-outline', title, subtitle, actionLabel, onAction }) => {
    const theme = useSocialTheme();
    const opacity = useFadeIn(50, 400);
    const { translateY } = useSlideUp(20, 100);

    return (
      <Animated.View
        style={[styles.wrap, { opacity, transform: [{ translateY }] }]}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${theme.primary}16` },
          ]}
        >
          <Ionicons name={icon} size={32} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            {subtitle}
          </Text>
        ) : null}
        {actionLabel && onAction ? (
          <TouchableOpacity
            onPress={onAction}
            activeOpacity={0.85}
            style={[styles.action, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    );
  }
);

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
  },
  action: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default EmptyState;