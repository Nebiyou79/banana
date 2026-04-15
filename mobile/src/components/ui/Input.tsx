import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  /** Overrides for the outer wrapper View (e.g. flex: 1) */
  style?: ViewStyle;
  /** Overrides applied directly to the TextInput (e.g. color, backgroundColor) */
  inputStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  secureTextEntry,
  editable = true,
  style,
  inputStyle,
  ...rest
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius } = theme;
  const [secure, setSecure] = useState(secureTextEntry ?? false);
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.primary
    : colors.border;

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <View
        style={[
          styles.container,
          {
            borderColor,
            borderRadius: borderRadius.lg,
            backgroundColor: editable ? colors.inputBg : colors.borderLight,
          },
          inputStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            { color: colors.text, flex: 1 },
            !editable && { color: colors.textMuted },
          ]}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={secure}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setSecure((v) => !v)}
            style={styles.rightIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={secure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper:   { marginBottom: 4 },
  label:     { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input:     { fontSize: 15, paddingVertical: 10 },
  leftIcon:  { marginRight: 10 },
  rightIcon: { marginLeft: 8 },
  errorText: { fontSize: 12, marginTop: 4, marginLeft: 2 },
});