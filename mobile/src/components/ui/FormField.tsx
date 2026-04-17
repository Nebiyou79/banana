/**
 * src/components/ui/FormField.tsx
 * Themed text input with label, error and optional multiline.
 */
import React from 'react';
import {
  View, Text, TextInput, TextInputProps, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';

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
  const { theme } = useThemeStore();
  const c = theme.colors;

  return (
    <View style={s.wrapper}>
      <View style={s.labelRow}>
        <Text style={[s.label, { color: c.text }]}>
          {label}
          {required && <Text style={{ color: c.error }}> *</Text>}
        </Text>
        {rightElement}
      </View>
      <View
        style={[
          s.inputWrapper,
          {
            backgroundColor: c.inputBg ?? c.surface,
            borderColor: error ? c.error : c.border,
          },
        ]}
      >
        <TextInput
          style={[
            s.input,
            { color: c.text },
            inputProps.multiline && { minHeight: 100, textAlignVertical: 'top' },
            style,
          ]}
          placeholderTextColor={c.placeholder ?? c.textMuted}
          {...inputProps}
        />
      </View>
      {hint && !error ? (
        <Text style={[s.hint, { color: c.textMuted }]}>{hint}</Text>
      ) : null}
      {error ? <Text style={[s.error, { color: c.error }]}>{error}</Text> : null}
    </View>
  );
};

const s = StyleSheet.create({
  wrapper:      { marginBottom: 16 },
  labelRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label:        { fontSize: 13, fontWeight: '600' },
  inputWrapper: { borderRadius: 12, borderWidth: 1.5, overflow: 'hidden' },
  input:        { paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  hint:         { fontSize: 11, marginTop: 4 },
  error:        { fontSize: 12, marginTop: 4 },
});
