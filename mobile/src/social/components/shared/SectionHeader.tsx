import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

const SectionHeader: React.FC<Props> = memo(
  ({ title, actionLabel, onActionPress }) => {
    const theme = useSocialTheme();
    return (
      <View style={styles.row}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {actionLabel ? (
          <TouchableOpacity
            onPress={onActionPress}
            activeOpacity={0.6}
            style={styles.action}
          >
            <Text style={[styles.actionText, { color: theme.primary }]}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  action: { minHeight: 36, paddingHorizontal: 4, justifyContent: 'center' },
  actionText: { fontSize: 13, fontWeight: '600' },
});

export default SectionHeader;