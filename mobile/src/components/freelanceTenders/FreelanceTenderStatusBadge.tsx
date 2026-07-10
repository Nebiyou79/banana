import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { TenderStatus } from '../../types/freelanceTender';

const META: Record<TenderStatus, { label: string; icon: string }> = {
  draft:     { label: 'Draft',     icon: '○' },
  published: { label: 'Published', icon: '●' },
  closed:    { label: 'Closed',    icon: '✕' },
};

export interface FreelanceTenderStatusBadgeProps {
  status: TenderStatus;
  showDot?: boolean;
}

const FreelanceTenderStatusBadge: React.FC<FreelanceTenderStatusBadgeProps> = memo(
  ({ status, showDot = true }) => {
    const { colors, radius } = useTheme();

    const color =
      status === 'published' ? colors.success
      : status === 'closed'  ? colors.danger
      : colors.textMuted;

    const { label, icon } = META[status] ?? { label: status, icon: '●' };

    return (
      <View
        style={[
          styles.pill,
          {
            backgroundColor: withAlpha(color, 0.11),
            borderColor:     withAlpha(color, 0.25),
            borderRadius:    radius.full,
          },
        ]}
      >
        {showDot && (
          <View style={[styles.dot, { backgroundColor: color }]} />
        )}
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
    );
  },
);

FreelanceTenderStatusBadge.displayName = 'FreelanceTenderStatusBadge';

const styles = StyleSheet.create({
  pill:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, alignSelf: 'flex-start' },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
});

export default FreelanceTenderStatusBadge;
