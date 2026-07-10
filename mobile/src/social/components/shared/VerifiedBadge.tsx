// src/social/components/shared/VerifiedBadge.tsx
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
  const { colors, dark } = theme;
  
  if (status !== 'verified') return null;
  
  // Dark mode: brighter primary
  // Light mode: standard primary
  const iconColor = color || (dark ? colors.primaryLight : colors.primary);
  
  return (
    <View style={styles.wrap} accessibilityLabel="Verified">
      <Ionicons
        name="checkmark-circle"
        size={size}
        color={iconColor}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginLeft: 3 },
});

export default VerifiedBadge;