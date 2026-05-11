// src/components/ui/Input.tsx
// Usage: <Input label="Email" value={email} onChangeText={setEmail} leftIcon="mail-outline" />

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightSlot?: React.ReactNode;
  required?: boolean;
  showCounter?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightSlot,
  required = false,
  showCounter = false,
  editable = true,
  secureTextEntry,
  multiline = false,
  maxLength,
  value = '',
  style,
  containerStyle,
  ...rest
}) => {
  const { colors: c, radius, type, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry ?? false);
  const inputRef = useRef<TextInput>(null);

  // Android autoFocus fix
  useEffect(() => {
    if (rest.autoFocus && Platform.OS === 'android') {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [rest.autoFocus]);

  const borderColor = useMemo(() => {
    if (error) return c.danger;
    if (focused) return c.inputBorderFocus;
    return c.inputBorder;
  }, [error, focused, c]);

  const backgroundColor = useMemo(() => {
    if (error) return withAlpha(c.danger, 0.04);
    if (!editable) return withAlpha(c.textDisabled, 0.08);
    return c.inputBg;
  }, [error, editable, c]);

  const charCount = typeof value === 'string' ? value.length : 0;
  const nearLimit = maxLength ? charCount / maxLength >= 0.9 : false;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, type.caption, { color: c.textSecondary }]}>
          {label}
          {required && (
            <Text style={{ color: c.danger }}> *</Text>
          )}
        </Text>
      )}

      <View
        style={[
          styles.container,
          {
            borderColor,
            backgroundColor,
            borderRadius: radius.md,
            minHeight: multiline ? 90 : 48,
            ...(multiline ? { maxHeight: 200 } : { height: 48 }),
          },
          style,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? c.primary : c.textMuted}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          ref={inputRef}
          value={value}
          multiline={multiline}
          editable={editable}
          secureTextEntry={secure}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={c.inputPlaceholder}
          style={[
            styles.input,
            type.body,
            {
              color: c.text,
              flex: 1,
              paddingHorizontal: spacing.lg,
              ...(multiline
                ? { textAlignVertical: 'top', paddingVertical: spacing.md }
                : {}),
            },
            leftIcon && { paddingLeft: spacing.xs },
          ]}
          {...rest}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setSecure(v => !v)}
            style={styles.rightSlot}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={secure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={c.textMuted}
            />
          </TouchableOpacity>
        )}

        {rightSlot && !secureTextEntry && (
          <View style={styles.rightSlot}>{rightSlot}</View>
        )}
      </View>

      <View style={styles.footer}>
        {error ? (
          <Text style={[styles.helperText, type.caption, { color: c.danger }]}>
            {error}
          </Text>
        ) : helperText ? (
          <Text style={[styles.helperText, type.caption, { color: c.textMuted }]}>
            {helperText}
          </Text>
        ) : (
          <View />
        )}

        {showCounter && maxLength && (
          <Text
            style={[
              styles.counter,
              type.caption,
              { color: nearLimit ? c.warning : c.textMuted },
            ]}
          >
            {charCount}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  input: {
    paddingVertical: 0,
  },
  leftIcon: {
    marginLeft: 12,
  },
  rightSlot: {
    paddingHorizontal: 12,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 16,
  },
  helperText: {
    flex: 1,
  },
  counter: {
    marginLeft: 8,
  },
});

export default Input;