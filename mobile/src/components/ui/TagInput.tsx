/**
 * src/components/ui/TagInput.tsx
 * Adds/removes string items in a dynamic list.
 * Used for requirements, skills, responsibilities, benefits.
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  maxItems?: number;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  values,
  onChange,
  placeholder = 'Type and press Add',
  error,
  required = false,
  maxItems = 20,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const add = () => {
    const trimmed = text.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setText('');
    inputRef.current?.focus();
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, val: string) => {
    const updated = [...values];
    updated[idx] = val;
    onChange(updated);
  };

  return (
    <View style={tw.wrapper}>
      <Text style={[tw.label, { color: c.text }]}>
        {label}
        {required && <Text style={{ color: c.error }}> *</Text>}
        <Text style={[tw.count, { color: c.textMuted }]}> ({values.length})</Text>
      </Text>

      {/* Existing items */}
      {values.map((v, i) => (
        <View key={i} style={[tw.item, { backgroundColor: c.inputBg ?? c.surface, borderColor: c.border }]}>
          <TextInput
            style={[tw.itemInput, { color: c.text }]}
            value={v}
            onChangeText={val => updateItem(i, val)}
            placeholderTextColor={c.placeholder ?? c.textMuted}
            multiline
          />
          <TouchableOpacity onPress={() => remove(i)} style={tw.removeBtn}>
            <Ionicons name="close-circle" size={20} color={c.error} />
          </TouchableOpacity>
        </View>
      ))}

      {/* Add new */}
      {values.length < maxItems && (
        <View style={[tw.addRow, { borderColor: error ? c.error : c.border }]}>
          <TextInput
            ref={inputRef}
            style={[tw.addInput, { color: c.text, backgroundColor: c.inputBg ?? c.surface }]}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={c.placeholder ?? c.textMuted}
            onSubmitEditing={add}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={add}
            disabled={!text.trim()}
            style={[tw.addBtn, { backgroundColor: text.trim() ? c.primary : c.border }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {error ? <Text style={[tw.error, { color: c.error }]}>{error}</Text> : null}
    </View>
  );
};

const tw = StyleSheet.create({
  wrapper:    { marginBottom: 16 },
  label:      { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  count:      { fontSize: 11, fontWeight: '400' },
  item:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingLeft: 12, paddingRight: 6, paddingVertical: 4, marginBottom: 6 },
  itemInput:  { flex: 1, fontSize: 14, paddingVertical: 8, minHeight: 36 },
  removeBtn:  { padding: 6 },
  addRow:     { flexDirection: 'row', borderRadius: 10, borderWidth: 1.5, overflow: 'hidden' },
  addInput:   { flex: 1, fontSize: 14, paddingHorizontal: 12, paddingVertical: 12 },
  addBtn:     { width: 46, alignItems: 'center', justifyContent: 'center' },
  error:      { fontSize: 12, marginTop: 4 },
});
