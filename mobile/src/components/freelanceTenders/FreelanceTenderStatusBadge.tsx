import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { TenderStatus } from '../../types/freelanceTender';

const LABELS: Record<TenderStatus, string> = {
  draft: 'Draft', published: 'Published', closed: 'Closed',
};

const FreelanceTenderStatusBadge: React.FC<{ status: TenderStatus }> = memo(({ status }) => {
  const { colors: c, radius } = useTheme();

  const color = status === 'published' ? c.success
              : status === 'closed'    ? c.danger
              : c.textMuted;

  return (
    <View style={[styles.pill, { backgroundColor: withAlpha(color, 0.14), borderRadius: radius.full }]}>
      <Text style={[styles.label, { color }]}>{LABELS[status]}</Text>
    </View>
  );
});

FreelanceTenderStatusBadge.displayName = 'FreelanceTenderStatusBadge';

const styles = StyleSheet.create({
  pill: { paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
});

export default FreelanceTenderStatusBadge;