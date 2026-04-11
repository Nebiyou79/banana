import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type ErrorStateVariant = 'error' | 'empty' | 'offline' | 'notFound' | 'restricted';

interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  message?: string;
  /** Label for the primary action button */
  actionLabel?: string;
  onAction?: () => void;
  /** Label for an optional secondary action */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
  /** Override the default emoji/icon */
  emoji?: string;
  /** Make it compact (less vertical padding) */
  compact?: boolean;
}

// ─── Preset configs ───────────────────────────────────────────────────────────

const PRESETS: Record<
  ErrorStateVariant,
  { emoji: string; title: string; message: string; actionLabel: string }
> = {
  error: {
    emoji: '⚠️',
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    actionLabel: 'Try Again',
  },
  empty: {
    emoji: '📭',
    title: 'Nothing here yet',
    message: 'There is nothing to show right now.',
    actionLabel: 'Refresh',
  },
  offline: {
    emoji: '📡',
    title: 'No internet connection',
    message: 'Please check your network and try again.',
    actionLabel: 'Retry',
  },
  notFound: {
    emoji: '🔍',
    title: 'Not found',
    message: "We couldn't find what you were looking for.",
    actionLabel: 'Go Back',
  },
  restricted: {
    emoji: '🔒',
    title: 'Access restricted',
    message: "You don't have permission to view this content.",
    actionLabel: 'Go Back',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

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
  const { theme } = useThemeStore();
  const preset = PRESETS[variant];

  const resolvedEmoji = emoji ?? preset.emoji;
  const resolvedTitle = title ?? preset.title;
  const resolvedMessage = message ?? preset.message;
  const resolvedActionLabel = actionLabel ?? preset.actionLabel;

  return (
    <View
      style={[
        styles.container,
        compact && styles.compact,
        style,
      ]}
    >
      {/* Icon / Emoji */}
      <View
        style={[
          styles.iconContainer,
          compact && styles.iconContainerCompact,
          { backgroundColor: theme.colors.borderLight },
        ]}
      >
        <Text style={[styles.emoji, compact && styles.emojiCompact]}>
          {resolvedEmoji}
        </Text>
      </View>

      {/* Text */}
      <Text
        style={[
          styles.title,
          compact && styles.titleCompact,
          { color: theme.colors.text },
        ]}
      >
        {resolvedTitle}
      </Text>

      <Text
        style={[
          styles.message,
          compact && styles.messageCompact,
          { color: theme.colors.textMuted },
        ]}
      >
        {resolvedMessage}
      </Text>

      {/* Actions */}
      {onAction && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onAction}
            activeOpacity={0.8}
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Ionicons
              name={variant === 'error' || variant === 'offline' ? 'refresh-outline' : 'arrow-back-outline'}
              size={16}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.primaryButtonText}>{resolvedActionLabel}</Text>
          </TouchableOpacity>

          {secondaryActionLabel && onSecondaryAction && (
            <TouchableOpacity
              onPress={onSecondaryAction}
              activeOpacity={0.8}
              style={[
                styles.secondaryButton,
                { borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
                {secondaryActionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  compact: {
    paddingVertical: 32,
    paddingHorizontal: 24,
  },

  // Icon
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconContainerCompact: {
    width: 72,
    height: 72,
    borderRadius: 20,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
  },
  emojiCompact: {
    fontSize: 34,
  },

  // Text
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 17,
    marginBottom: 6,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  messageCompact: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },

  // Buttons
  actions: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
