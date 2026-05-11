// src/components/auth/FormError.tsx
// Usage: <FormError message="Invalid credentials" visible={!!error} />

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

interface FormErrorProps {
  message?: string;
  visible: boolean;
}

export const FormError: React.FC<FormErrorProps> = ({ message, visible }) => {
  const { colors: c, type, spacing, radius } = useTheme();

  if (!visible || !message) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: withAlpha(c.danger, 0.10),
          borderColor: c.danger,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name="alert-circle-outline"
        size={16}
        color={c.danger}
        style={{ marginTop: 1 }}
      />
      <Text
        style={[
          type.bodySm,
          { color: c.danger, flex: 1, marginLeft: 8 },
        ]}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
  },
});

export default FormError;