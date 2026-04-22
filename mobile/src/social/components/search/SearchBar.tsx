// src/social/components/search/SearchBar.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useRef } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  showCancel?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
}

const SearchBar: React.FC<Props> = memo(
  ({
    value,
    onChangeText,
    onSubmit,
    placeholder = 'Search people, hashtags…',
    showCancel,
    onCancel,
    autoFocus,
  }) => {
    const theme = useSocialTheme();
    const inputRef = useRef<TextInput>(null);

    const handleCancel = () => {
      onChangeText('');
      Keyboard.dismiss();
      inputRef.current?.blur();
      onCancel?.();
    };

    const handleClear = () => {
      onChangeText('');
      inputRef.current?.focus();
    };

    return (
      <View style={styles.row}>
        <View
          style={[
            styles.field,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.muted} />
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            placeholder={placeholder}
            placeholderTextColor={theme.muted}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={autoFocus}
            style={[styles.input, { color: theme.text }]}
          />
          {value.length > 0 ? (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Clear"
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
            onPress={handleCancel}
            style={styles.cancel}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityLabel="Cancel"
          >
            <Text
              style={[styles.cancelText, { color: theme.primary }]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
);

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  cancel: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cancelText: { fontSize: 14, fontWeight: '600' },
});

export default SearchBar;