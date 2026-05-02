// mobile/src/components/freelanceTenders/FreelanceTenderEmptyState.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

export interface FreelanceTenderEmptyStateProps {
  /** Main message shown in large text */
  message?: string;
  /** Optional smaller subtitle */
  subtitle?: string;
  /** Label for the optional CTA button */
  actionLabel?: string;
  /** Called when the CTA button is pressed */
  onAction?: () => void;
  /** Icon override — defaults to search-outline */
  icon?: keyof typeof Ionicons.glyphMap;
}

const FreelanceTenderEmptyState: React.FC<FreelanceTenderEmptyStateProps> = memo(
  ({
    message = 'No tenders found',
    subtitle,
    actionLabel,
    onAction,
    icon = 'document-text-outline',
  }) => {
    const { theme } = useThemeStore();
    const c = theme.colors;

    return (
      <View style={styles.container}>
        <View style={[styles.iconWrap, { backgroundColor: c.primary + '18' }]}>
          <Ionicons name={icon} size={36} color={c.primary} />
        </View>
        <Text style={[styles.title, { color: c.text }]}>{message}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.textMuted }]}>{subtitle}</Text>
        ) : null}
        {onAction && actionLabel ? (
          <TouchableOpacity
            onPress={onAction}
            style={[styles.btn, { backgroundColor: c.primary }]}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.btnText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
);

FreelanceTenderEmptyState.displayName = 'FreelanceTenderEmptyState';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 56,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btn: {
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default FreelanceTenderEmptyState;
