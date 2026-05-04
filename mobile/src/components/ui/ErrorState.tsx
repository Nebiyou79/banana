// ErrorState.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type ErrorStateVariant = 'error' | 'empty' | 'offline' | 'notFound' | 'restricted';

interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
  emoji?: string;
  compact?: boolean;
}

const PRESETS: Record<ErrorStateVariant, { emoji: string; title: string; message: string; actionLabel: string }> = {
  error: { emoji: '⚠️', title: 'Something went wrong', message: 'An unexpected error occurred. Please try again.', actionLabel: 'Try Again' },
  empty: { emoji: '📭', title: 'Nothing here yet', message: 'There is nothing to show right now.', actionLabel: 'Refresh' },
  offline: { emoji: '📡', title: 'No internet connection', message: 'Please check your network and try again.', actionLabel: 'Retry' },
  notFound: { emoji: '🔍', title: 'Not found', message: "We couldn't find what you were looking for.", actionLabel: 'Go Back' },
  restricted: { emoji: '🔒', title: 'Access restricted', message: "You don't have permission to view this content.", actionLabel: 'Go Back' },
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  variant = 'error',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  emoji,
  compact = false,
}) => {
  const { colors, radius, type } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const preset = PRESETS[variant];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const resolvedEmoji = emoji ?? preset.emoji;
  const resolvedTitle = title ?? preset.title;
  const resolvedMessage = message ?? preset.message;
  const resolvedActionLabel = actionLabel ?? preset.actionLabel;

  return (
    <Animated.View style={[styles.container, compact && styles.compact, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, style]}>
      <View style={[styles.iconContainer, compact && styles.iconContainerCompact, { backgroundColor: colors.bgSecondary, borderRadius: radius.lg }]}>
        <Text style={[styles.emoji, compact && styles.emojiCompact]}>{resolvedEmoji}</Text>
      </View>

      <Text style={[styles.title, compact ? type.h4 : type.h3, { color: colors.textPrimary }]}>
        {resolvedTitle}
      </Text>

      <Text style={[styles.message, compact ? type.caption : type.body, { color: colors.textMuted }]}>
        {resolvedMessage}
      </Text>

      {onAction && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onAction}
            activeOpacity={0.8}
            style={[styles.primaryButton, { backgroundColor: colors.accent, borderRadius: radius.md }]}
          >
            <Ionicons name={variant === 'error' || variant === 'offline' ? 'refresh-outline' : 'arrow-back-outline'} size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={[styles.primaryButtonText, type.bodySm]}>{resolvedActionLabel}</Text>
          </TouchableOpacity>

          {secondaryActionLabel && onSecondaryAction && (
            <TouchableOpacity
              onPress={onSecondaryAction}
              activeOpacity={0.8}
              style={[styles.secondaryButton, { borderColor: colors.borderPrimary, borderRadius: radius.md }]}
            >
              <Text style={[styles.secondaryButtonText, type.bodySm, { color: colors.textSecondary }]}>
                {secondaryActionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  compact: { paddingVertical: 32, paddingHorizontal: 24 },
  iconContainer: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconContainerCompact: { width: 72, height: 72, marginBottom: 16 },
  emoji: { fontSize: 48 },
  emojiCompact: { fontSize: 34 },
  title: { textAlign: 'center', marginBottom: 10, fontWeight: '700' },
  message: { textAlign: 'center', marginBottom: 28 },
  actions: { width: '100%', gap: 10 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 24 },
  buttonIcon: { marginRight: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 24, borderWidth: 1.5 },
  secondaryButtonText: { fontWeight: '600' },
});