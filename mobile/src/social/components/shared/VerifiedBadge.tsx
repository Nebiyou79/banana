import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { VerificationStatus } from '../../types';

interface Props {
  status?: VerificationStatus;
  size?: number;
  color?: string;
}

const VerifiedBadge: React.FC<Props> = memo(({ status, size = 14, color }) => {
  const theme = useSocialTheme();
  if (status !== 'verified') return null;
  return (
    <View style={styles.wrap} accessibilityLabel="Verified">
      <Ionicons
        name="checkmark-circle"
        size={size}
        color={color ?? theme.primary}
      />
    </View>
  );
});

VerifiedBadge.displayName = 'VerifiedBadge';

const styles = StyleSheet.create({
  wrap: { marginLeft: 3 },
});

export default VerifiedBadge;