// src/components/ui/EmptyState.tsx
// Usage: <EmptyState title="No results" subtitle="Try a different search" actionLabel="Clear" onAction={clear} />

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
  illustration,
}) => {
  const { colors: c, spacing, type } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { padding: spacing.xxl, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {illustration ?? (
        <View
          style={[
            styles.iconRing,
            { backgroundColor: withAlpha(c.primary, 0.12) },
          ]}
        >
          <Ionicons name={icon} size={36} color={c.primary} />
        </View>
      )}

      <Text style={[styles.title, type.h3, { color: c.text }]}>
        {title}
      </Text>

      {subtitle && (
        <Text style={[styles.subtitle, type.body, { color: c.textMuted }]}>
          {subtitle}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          size="md"
          style={styles.action}
        />
      )}
    </Animated.View>
  );
};

// ─── ErrorState ────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  actionLabel = 'Try again',
  onAction,
}) => {
  const { colors: c, spacing, type } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { padding: spacing.xxl, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View
        style={[
          styles.iconRing,
          { backgroundColor: withAlpha(c.danger, 0.12) },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={36} color={c.danger} />
      </View>

      <Text style={[styles.title, type.h3, { color: c.text }]}>
        {title}
      </Text>

      <Text style={[styles.subtitle, type.body, { color: c.textMuted }]}>
        {message}
      </Text>

      {onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          size="md"
          style={styles.action}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    maxWidth: 280,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  action: {
    marginTop: 24,
  },
});

export default EmptyState;