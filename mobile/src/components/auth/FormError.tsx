// src/components/auth/FormError.tsx
// Usage: <FormError message={apiError} visible={!!apiError} />

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useThemes';

interface FormErrorProps {
  message?: string;
  visible:  boolean;
}

export const FormError: React.FC<FormErrorProps> = ({ message, visible }) => {
  const { colors, type, spacing, radius } = useTheme();

  if (!visible || !message) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.errorBg,
          borderColor:     colors.error,
          borderRadius:    radius.md,
          padding:         spacing.md,
          marginBottom:    spacing.md,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
      <Text style={[type.bodySm, { color: colors.error, flex: 1 }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           8,
    borderWidth:   1,
  },
});

export default FormError;