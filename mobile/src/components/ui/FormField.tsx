// FormField.tsx
import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  rightElement?: React.ReactNode;
  hint?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  rightElement,
  hint,
  style,
  ...inputProps
}) => {
  const { colors, radius, type, spacing } = useTheme();

  return (
    <View style={s.wrapper}>
      <View style={s.labelRow}>
        <Text style={[s.label, type.caption, { color: colors.textPrimary }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
        {rightElement}
      </View>
      <View
        style={[
          s.inputWrapper,
          {
            backgroundColor: colors.bgCard,
            borderColor: error ? colors.error : colors.borderPrimary,
            borderRadius: radius.md,
          },
        ]}
      >
        <TextInput
          style={[s.input, type.body, { color: colors.textPrimary }, inputProps.multiline && { minHeight: 100, textAlignVertical: 'top' }, style]}
          placeholderTextColor={colors.textMuted}
          {...inputProps}
        />
      </View>
      {hint && !error ? <Text style={[s.hint, type.caption, { color: colors.textMuted }]}>{hint}</Text> : null}
      {error ? <Text style={[s.error, type.caption, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontWeight: '600' },
  inputWrapper: { borderWidth: 1.5, overflow: 'hidden' },
  input: { paddingHorizontal: 14, paddingVertical: 13 },
  hint: { marginTop: 4 },
  error: { marginTop: 4 },
});