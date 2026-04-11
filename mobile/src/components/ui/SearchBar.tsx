import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Called with debounced value after `debounceMs` ms (default 400) */
  onDebouncedChange?: (text: string) => void;
  debounceMs?: number;
  placeholder?: string;
  loading?: boolean;
  autoFocus?: boolean;
  /** Show a Cancel button that clears and blurs the input */
  cancelable?: boolean;
  onCancel?: () => void;
  style?: ViewStyle;
  /** Make the input non-interactive (display-only tap target) */
  readOnly?: boolean;
  onPress?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onDebouncedChange,
  debounceMs = 400,
  placeholder = 'Search...',
  loading = false,
  autoFocus = false,
  cancelable = false,
  onCancel,
  style,
  readOnly = false,
  onPress,
}) => {
  const { theme } = useThemeStore();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  // Cancel button slide animation
  const cancelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cancelAnim, {
      toValue: focused && cancelable ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused, cancelable]);

  const cancelWidth = cancelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 72],
  });

  // Debounce
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);
      if (onDebouncedChange) {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          onDebouncedChange(text);
        }, debounceMs);
      }
    },
    [onChangeText, onDebouncedChange, debounceMs],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

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

  const borderColor = focused ? theme.colors.primary : theme.colors.border;

  // ── Read-only tap target ──────────────────────────────────────────────────
  if (readOnly) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[
          styles.container,
          styles.readOnly,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBg },
          style,
        ]}
      >
        <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          editable={false}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          style={[styles.input, { color: theme.colors.textMuted }]}
          pointerEvents="none"
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      {/* Input row */}
      <View
        style={[
          styles.container,
          { borderColor, backgroundColor: theme.colors.inputBg },
        ]}
      >
        {/* Search icon / spinner */}
        <View style={styles.searchIcon}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons
              name="search-outline"
              size={18}
              color={focused ? theme.colors.primary : theme.colors.textMuted}
            />
          )}
        </View>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          autoFocus={autoFocus}
          returnKeyType="search"
          clearButtonMode="never"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: theme.colors.text }]}
        />

        {/* Clear button */}
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton} hitSlop={8}>
            <View style={[styles.clearCircle, { backgroundColor: theme.colors.textMuted }]}>
              <Ionicons name="close" size={11} color={theme.colors.surface} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Cancel button (animated) */}
      {cancelable && (
        <Animated.View style={{ width: cancelWidth, overflow: 'hidden' }}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Animated.Text
              style={[styles.cancelText, { color: theme.colors.primary }]}
            >
              Cancel
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  readOnly: {
    opacity: 0.85,
  },
  searchIcon: {
    marginRight: 8,
    width: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    ...Platform.select({ android: { paddingVertical: 0 } }),
  },
  clearButton: {
    marginLeft: 6,
    padding: 2,
  },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingLeft: 8,
    height: 46,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
