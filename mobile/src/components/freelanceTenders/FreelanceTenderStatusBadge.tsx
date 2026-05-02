// mobile/src/components/freelanceTenders/FreelanceTenderStatusBadge.tsx
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { TenderStatus } from '../../types/freelanceTender';

export interface FreelanceTenderStatusBadgeProps {
  status: TenderStatus;
}

const LABELS: Record<TenderStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  closed: 'Closed',
};

const FreelanceTenderStatusBadge: React.FC<FreelanceTenderStatusBadgeProps> = memo(
  ({ status }) => {
    const { theme } = useThemeStore();
    const c = theme.colors;

    const bgColor =
      status === 'published'
        ? c.success + '22'
        : status === 'closed'
        ? c.error + '22'
        : c.textMuted + '22';

    const textColor =
      status === 'published'
        ? c.success
        : status === 'closed'
        ? c.error
        : c.textMuted;

    return (
      <View style={[styles.pill, { backgroundColor: bgColor }]}>
        <Text style={[styles.label, { color: textColor }]}>{LABELS[status]}</Text>
      </View>
    );
  }
);

FreelanceTenderStatusBadge.displayName = 'FreelanceTenderStatusBadge';

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

export default FreelanceTenderStatusBadge;