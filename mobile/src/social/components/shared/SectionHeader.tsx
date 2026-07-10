// src/social/components/shared/SectionHeader.tsx
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

const SectionHeader: React.FC<Props> = memo(({ title, actionLabel, onActionPress }) => {
  const theme = useSocialTheme();
  const { colors, spacing, type, dark } = theme;

  // Dark mode: subtle border, bright text
  // Light mode: clean border, standard text
  const titleColor = colors.text;
  const actionColor = colors.primary;

  return (
    <View style={[
      styles.row,
      {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        borderBottomWidth: 0.5,
      },
    ]}>
      <Text style={[type.title, { color: titleColor }]}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity
          onPress={onActionPress}
          activeOpacity={0.6}
          style={[
            styles.action, 
            { minHeight: 36, paddingHorizontal: spacing.xs }
          ]}
        >
          <Text style={[
            type.bodySm, 
            { color: actionColor, fontWeight: '600' }
          ]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  action: { justifyContent: 'center' },
});

export default SectionHeader;