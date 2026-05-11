// src/components/ui/SearchBar.tsx
// Usage: <SearchBar value={q} onChangeText={setQ} placeholder="Search people..." />

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText?: (v: string) => void;
  onSubmit?: (v: string) => void;
  onPress?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  showFilter?: boolean;
  onFilterPress?: () => void;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  onPress,
  placeholder = 'Search…',
  readOnly = false,
  autoFocus = false,
  showFilter = false,
  onFilterPress,
  style,
}) => {
  // CRITICAL FIX: use ONLY useTheme() — never mix with useThemeStore()
  const { colors: c, radius, spacing } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  // Android autoFocus fix
  useEffect(() => {
    if (autoFocus && Platform.OS === 'android') {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleClear = useCallback(() => {
    onChangeText?.('');
    inputRef.current?.focus();
  }, [onChangeText]);

  const containerStyle = useMemo<ViewStyle>(() => ({
    height: 48,
    borderRadius: radius.md,
    backgroundColor: c.inputBg,
    borderWidth: 1.5,
    borderColor: focused ? c.inputBorderFocus : c.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  }), [c, radius, spacing, focused]);

  // ReadOnly mode: pure Pressable — no editable TextInput (accessibility fix)
  if (readOnly) {
    return (
      <Pressable
        onPress={onPress}
        style={[containerStyle, style]}
        accessibilityRole="search"
        accessibilityLabel={placeholder}
      >
        <Ionicons name="search-outline" size={18} color={c.textMuted} />
        <Text
          style={{ flex: 1, color: value ? c.text : c.inputPlaceholder, fontSize: 15 }}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        {showFilter && (
          <TouchableOpacity
            onPress={onFilterPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="options-outline" size={18} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </Pressable>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <Ionicons
        name="search-outline"
        size={18}
        color={focused ? c.primary : c.textMuted}
      />

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit?.(value)}
        placeholder={placeholder}
        placeholderTextColor={c.inputPlaceholder}
        autoFocus={autoFocus && Platform.OS === 'ios'}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ flex: 1, color: c.text, fontSize: 15, paddingVertical: 0 }}
      />

      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clearBtn}
        >
          <Ionicons name="close-circle" size={18} color={c.textMuted} />
        </TouchableOpacity>
      )}

      {showFilter && (
        <TouchableOpacity
          onPress={onFilterPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.filterBtn}
        >
          <Ionicons name="options-outline" size={18} color={c.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  clearBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
});

export default SearchBar;