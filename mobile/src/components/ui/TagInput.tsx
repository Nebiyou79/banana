// TagInput.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

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
  label, values, onChange, placeholder = 'Type and press Add',
  error, required = false, maxItems = 20,
}) => {
  const { colors, radius, type } = useTheme();
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
      <Text style={[tw.label, type.caption, { color: colors.textPrimary }]}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
        <Text style={[tw.count, { color: colors.textMuted }]}> ({values.length})</Text>
      </Text>

      {values.map((v, i) => (
        <View key={i} style={[tw.item, { backgroundColor: colors.bgCard, borderColor: colors.borderPrimary, borderRadius: radius.md }]}>
          <TextInput
            style={[tw.itemInput, type.bodySm, { color: colors.textPrimary }]}
            value={v} onChangeText={val => updateItem(i, val)}
            placeholderTextColor={colors.textMuted} multiline
          />
          <TouchableOpacity onPress={() => remove(i)} style={tw.removeBtn}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      ))}

      {values.length < maxItems && (
        <View style={[tw.addRow, { borderColor: error ? colors.error : colors.borderPrimary, borderRadius: radius.md }]}>
          <TextInput
            ref={inputRef} style={[tw.addInput, type.body, { color: colors.textPrimary, backgroundColor: colors.bgCard }]}
            value={text} onChangeText={setText} placeholder={placeholder}
            placeholderTextColor={colors.textMuted} onSubmitEditing={add}
            returnKeyType="done" blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={add} disabled={!text.trim()}
            style={[tw.addBtn, { backgroundColor: text.trim() ? colors.accent : colors.borderPrimary, borderTopRightRadius: radius.md, borderBottomRightRadius: radius.md }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {error ? <Text style={[tw.error, type.caption, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
};

const tw = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 8 },
  count: { fontWeight: '400' },
  item: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingLeft: 12, paddingRight: 6, paddingVertical: 4, marginBottom: 6 },
  itemInput: { flex: 1, paddingVertical: 8, minHeight: 36 },
  removeBtn: { padding: 6 },
  addRow: { flexDirection: 'row', borderWidth: 1.5, overflow: 'hidden' },
  addInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  addBtn: { width: 46, alignItems: 'center', justifyContent: 'center' },
  error: { marginTop: 4 },
});