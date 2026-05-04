// SearchBar.tsx
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onDebouncedChange?: (text: string) => void;
  debounceMs?: number;
  placeholder?: string;
  loading?: boolean;
  autoFocus?: boolean;
  cancelable?: boolean;
  onCancel?: () => void;
  style?: ViewStyle;
  readOnly?: boolean;
  onPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value, onChangeText, onDebouncedChange, debounceMs = 400,
  placeholder = 'Search...', loading = false, autoFocus = false,
  cancelable = false, onCancel, style, readOnly = false, onPress,
}) => {
  const { colors, radius, type } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const cancelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cancelAnim, { toValue: focused && cancelable ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [focused, cancelable]);

  const cancelWidth = cancelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 72] });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
    if (onDebouncedChange) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => onDebouncedChange(text), debounceMs);
    }
  }, [onChangeText, onDebouncedChange, debounceMs]);

  useEffect(() => { return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }; }, []);

  const handleClear = () => {
    onChangeText('');
    onDebouncedChange?.('');
    inputRef.current?.focus();
  };

  const handleCancel = () => {
    onChangeText('');
    onDebouncedChange?.('');
    inputRef.current?.blur();
    setFocused(false);
    onCancel?.();
  };

  const borderColor = focused ? colors.accent : colors.borderPrimary;

  if (readOnly) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.container, styles.readOnly, { borderColor: colors.borderPrimary, backgroundColor: colors.bgCard, borderRadius: radius.md }, style]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput editable={false} value={value} placeholder={placeholder} placeholderTextColor={colors.textMuted} style={[styles.input, type.body, { color: colors.textMuted }]} pointerEvents="none" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.container, { borderColor, backgroundColor: colors.bgCard, borderRadius: radius.md }]}>
        <View style={styles.searchIcon}>
          {loading ? <ActivityIndicator size="small" color={colors.accent} /> : <Ionicons name="search-outline" size={18} color={focused ? colors.accent : colors.textMuted} />}
        </View>
        <TextInput
          ref={inputRef} value={value} onChangeText={handleChangeText}
          placeholder={placeholder} placeholderTextColor={colors.textMuted}
          autoFocus={autoFocus} returnKeyType="search" clearButtonMode="never"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={[styles.input, type.body, { color: colors.textPrimary }]}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton} hitSlop={8}>
            <View style={[styles.clearCircle, { backgroundColor: colors.textMuted, borderRadius: radius.full }]}>
              <Ionicons name="close" size={11} color={colors.bgCard} />
            </View>
          </TouchableOpacity>
        )}
      </View>
      {cancelable && (
        <Animated.View style={{ width: cancelWidth, overflow: 'hidden' }}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Animated.Text style={[styles.cancelText, type.bodySm, { color: colors.accent }]}>Cancel</Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  container: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 46, borderWidth: 1.5, paddingHorizontal: 12 },
  readOnly: { opacity: 0.85 },
  searchIcon: { marginRight: 8, width: 20, alignItems: 'center' },
  input: { flex: 1, paddingVertical: 0, ...Platform.select({ android: { paddingVertical: 0 } }) },
  clearButton: { marginLeft: 6, padding: 2 },
  clearCircle: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { paddingLeft: 8, height: 46, justifyContent: 'center' },
  cancelText: { fontWeight: '600' },
});