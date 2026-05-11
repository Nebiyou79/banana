import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

export interface FreelanceTenderEmptyStateProps {
  message?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

const FreelanceTenderEmptyState: React.FC<FreelanceTenderEmptyStateProps> = memo(({
  message = 'No tenders found',
  subtitle,
  actionLabel,
  onAction,
  icon = 'document-text-outline',
}) => {
  const { colors: c, radius, type, spacing } = useTheme();
  const styles = useMemo(() => makeStyles(c, radius, spacing), [c, radius, spacing]);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={36} color={c.primary} />
      </View>
      <Text style={[type.h3, styles.title, { color: c.text }]}>{message}</Text>
      {subtitle ? (
        <Text style={[type.body, styles.subtitle, { color: c.textMuted }]}>{subtitle}</Text>
      ) : null}
      {onAction && actionLabel ? (
        <TouchableOpacity
          onPress={onAction}
          style={[styles.btn, { backgroundColor: c.primary }]}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[type.body, { color: '#FFFFFF', fontWeight: '700' }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

FreelanceTenderEmptyState.displayName = 'FreelanceTenderEmptyState';

const makeStyles = (c: any, radius: any, spacing: any) =>
  StyleSheet.create({
    container: {
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: spacing.xxl, paddingVertical: 56,
    },
    iconWrap: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: withAlpha(c.primary, 0.12),
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    title: { textAlign: 'center', marginBottom: spacing.sm, fontWeight: '700' },
    subtitle: { textAlign: 'center', lineHeight: 20, marginBottom: spacing.xl },
    btn: {
      minHeight: 44, paddingHorizontal: spacing.xl, paddingVertical: 12,
      borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    },
  });

export default FreelanceTenderEmptyState;