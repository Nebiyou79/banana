// Input.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  style?: ViewStyle;
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
  const { colors, radius, type } = useTheme();
  const [secure, setSecure] = useState(secureTextEntry ?? false);
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.accent : colors.borderPrimary;

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={[styles.label, type.caption, { color: colors.textSecondary }]}>{label}</Text>}
      <View
        style={[styles.container, {
          borderColor,
          borderRadius: radius.lg,
          backgroundColor: editable ? colors.bgCard : colors.bgSecondary,
        }, inputStyle]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, type.body, { color: colors.textPrimary, flex: 1 }, !editable && { color: colors.textMuted }]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secure}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setSecure((v) => !v)} style={styles.rightIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>
      {error && <Text style={[styles.errorText, type.caption, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  label: { fontWeight: '500', marginBottom: 6 },
  container: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 12, minHeight: 48 },
  input: { paddingVertical: 10 },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 8 },
  errorText: { marginTop: 4, marginLeft: 2 },
});