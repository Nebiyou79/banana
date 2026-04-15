import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TextInput,
  View,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ─── AppButton ────────────────────────────────────────────────────────────────

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label, onPress, variant = 'primary', loading = false, disabled = false,
  icon, size = 'md', style, fullWidth = true,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography } = theme;

  const heights = { sm: 38, md: 48, lg: 56 };
  const fontSizes = { sm: typography.xs, md: typography.sm, lg: typography.base };
  const iconSizes = { sm: 14, md: 16, lg: 18 };

  const bgMap = {
    primary:   colors.primary,
    secondary: colors.secondary,
    outline:   'transparent',
    ghost:     'transparent',
    danger:    colors.error,
  };
  const textMap = {
    primary:   '#fff',
    secondary: '#fff',
    outline:   colors.primary,
    ghost:     colors.text,
    danger:    '#fff',
  };
  const borderMap = {
    primary:   colors.primary,
    secondary: colors.secondary,
    outline:   colors.primary,
    ghost:     'transparent',
    danger:    colors.error,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        {
          height: heights[size],
          backgroundColor: bgMap[variant],
          borderColor: borderMap[variant],
          borderRadius: borderRadius.lg,
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textMap[variant]} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon && <Ionicons name={icon} size={iconSizes[size]} color={textMap[variant]} />}
          <Text style={{ color: textMap[variant], fontWeight: '700', fontSize: fontSizes[size] }}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── AppInput ─────────────────────────────────────────────────────────────────

interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export const AppInput: React.FC<AppInputProps> = ({
  label, error, leftIcon, rightIcon, onRightIconPress, containerStyle,
  multiline = false, numberOfLines = 1, ...props
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, spacing } = theme;
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ marginBottom: spacing[4] }, containerStyle]}>
      {label && (
        <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputBox,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : focused ? colors.primary : colors.border,
            borderRadius: borderRadius.md,
            minHeight: multiline ? numberOfLines * 24 + 24 : 50,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={focused ? colors.primary : colors.textMuted} style={styles.inputIcon} />
        )}
        <TextInput
          {...props}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          placeholderTextColor={colors.placeholder}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: typography.base,
              flex: 1,
              paddingLeft: leftIcon ? 0 : 4,
              textAlignVertical: multiline ? 'top' : 'center',
              paddingTop: multiline ? 8 : 0,
            },
          ]}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={rightIcon} size={18} color={colors.textMuted} style={styles.inputIcon} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.error, fontSize: typography.xs }]}>{error}</Text>
      )}
    </View>
  );
};

// ─── SelectInput ──────────────────────────────────────────────────────────────

interface SelectOption { label: string; value: string }

interface SelectInputProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  label, value, options, onSelect, placeholder = 'Select…', error,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, spacing } = theme;
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === value);

  return (
    <View style={{ marginBottom: spacing[4] }}>
      {label && (
        <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>{label}</Text>
      )}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          styles.selectBox,
          { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border, borderRadius: borderRadius.md },
        ]}
      >
        <Text style={{ color: selected ? colors.text : colors.placeholder, fontSize: typography.base, flex: 1 }}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={{ color: colors.error, fontSize: typography.xs, marginTop: 4 }}>{error}</Text>}

      {/* Dropdown Modal */}
      {open && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.md },
          ]}
        >
          {options.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => { onSelect(opt.value); setOpen(false); }}
              style={[
                styles.dropdownItem,
                { backgroundColor: opt.value === value ? colors.primaryLight : 'transparent' },
              ]}
            >
              <Text style={{ color: opt.value === value ? colors.primary : colors.text, fontSize: typography.sm, fontWeight: opt.value === value ? '700' : '400' }}>
                {opt.label}
              </Text>
              {opt.value === value && <Ionicons name="checkmark" size={14} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 20,
  },
  inputLabel: { fontWeight: '600', marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1 },
  errorText: { marginTop: 4 },
  selectBox: { flexDirection: 'row', alignItems: 'center', height: 50, paddingHorizontal: 12, borderWidth: 1.5 },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, borderWidth: 1, maxHeight: 240, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
});
