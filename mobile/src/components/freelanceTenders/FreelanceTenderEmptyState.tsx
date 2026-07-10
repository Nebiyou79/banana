import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

export interface FreelanceTenderEmptyStateProps {
  message?:     string;
  subtitle?:    string;
  actionLabel?: string;
  onAction?:    () => void;
  icon?:        keyof typeof Ionicons.glyphMap;
}

const FreelanceTenderEmptyState: React.FC<FreelanceTenderEmptyStateProps> = memo(({
  message     = 'No tenders found',
  subtitle,
  actionLabel,
  onAction,
  icon = 'document-text-outline',
}) => {
  const { colors, radius, type, spacing } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: withAlpha(colors.primary, 0.10),
            borderRadius: 40,
            borderWidth: 1,
            borderColor: withAlpha(colors.primary, 0.18),
          },
        ]}
      >
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>

      <Text style={[type.h3, { color: colors.text, fontWeight: '800', textAlign: 'center', marginTop: 20, marginBottom: 8 }]}>
        {message}
      </Text>

      {subtitle ? (
        <Text style={[type.body, { color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 }]}>
          {subtitle}
        </Text>
      ) : null}

      {onAction && actionLabel ? (
        <TouchableOpacity
          onPress={onAction}
          style={[
            styles.btn,
            { backgroundColor: colors.primary, borderRadius: radius.lg },
          ]}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={[type.body, { color: '#FFFFFF', fontWeight: '700' }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

FreelanceTenderEmptyState.displayName = 'FreelanceTenderEmptyState';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 60,
  },
  iconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    minHeight: 48,
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FreelanceTenderEmptyState;
