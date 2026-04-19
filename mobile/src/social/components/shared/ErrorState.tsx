import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFadeIn } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  message?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<Props> = memo(
  ({ message = 'Something went wrong', onRetry }) => {
    const theme = useSocialTheme();
    const opacity = useFadeIn(0, 250);
    return (
      <Animated.View style={[styles.wrap, { opacity }]}>
        <Ionicons
          name="alert-circle-outline"
          size={40}
          color={theme.subtext}
        />
        <Text style={[styles.text, { color: theme.text }]}>{message}</Text>
        {onRetry ? (
          <TouchableOpacity
            onPress={onRetry}
            activeOpacity={0.85}
            style={[styles.retry, { borderColor: theme.primary }]}
          >
            <Ionicons name="refresh" size={14} color={theme.primary} />
            <Text style={[styles.retryText, { color: theme.primary }]}>
              Try again
            </Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    );
  }
);

ErrorState.displayName = 'ErrorState';

const styles = StyleSheet.create({
  wrap: { padding: 32, alignItems: 'center' },
  text: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  retry: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    minHeight: 44,
  },
  retryText: { fontSize: 13, fontWeight: '700' },
});

export default ErrorState;