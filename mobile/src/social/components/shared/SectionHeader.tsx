import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

const SectionHeader: React.FC<Props> = memo(({ title, actionLabel, onActionPress }) => {
  const { colors, spacing, type } = useSocialTheme();

  return (
    <View style={[styles.row, {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    }]}>
      {/* theme.type.titleSm → theme.type.title */}
      <Text style={[type.title, { color: colors.text }]}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity
          onPress={onActionPress}
          activeOpacity={0.6}
          style={[styles.action, { minHeight: 36, paddingHorizontal: spacing.xs }]}
        >
          <Text style={[type.bodySm, { color: colors.primary, fontWeight: '600' }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

SectionHeader.displayName = 'SectionHeader';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  action: { justifyContent: 'center' },
});

export default SectionHeader;
// ✅ theme-migrated
