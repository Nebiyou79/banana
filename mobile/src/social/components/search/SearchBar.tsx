import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, memo } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: ViewStyle;
  showCancel?: boolean;
  onCancel?: () => void;
}

/**
 * Search input with a leading magnifying glass, trailing clear button,
 * and optional trailing "Cancel" text button.
 */
const SearchBar = memo(
  forwardRef<TextInput, Props>(
    (
      {
        value,
        onChangeText,
        onSubmit,
        onFocus,
        onBlur,
        placeholder = 'Search people, posts, hashtags…',
        autoFocus,
        style,
        showCancel,
        onCancel,
      },
      ref
    ) => {
      const theme = useSocialTheme();
      return (
        <View style={[styles.row, style]}>
          <View
            style={[
              styles.wrap,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.muted} />
            <TextInput
              ref={ref}
              value={value}
              onChangeText={onChangeText}
              onSubmitEditing={onSubmit}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder={placeholder}
              placeholderTextColor={theme.muted}
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus={autoFocus}
              returnKeyType="search"
              style={[styles.input, { color: theme.text }]}
            />
            {value.length > 0 ? (
              <TouchableOpacity
                onPress={() => onChangeText('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Clear search"
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.muted}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          {showCancel ? (
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.7}
              style={styles.cancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel search"
            >
              <Text style={[styles.cancelText, { color: theme.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }
  )
);

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  input: { flex: 1, fontSize: 14, padding: 0 },
  cancel: {
    paddingHorizontal: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: { fontWeight: '600', fontSize: 14 },
});

export default SearchBar;