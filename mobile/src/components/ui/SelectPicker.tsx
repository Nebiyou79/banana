/**
 * src/components/ui/SelectPicker.tsx
 * Reusable bottom-sheet style picker for dropdowns.
 * Replaces broken native Picker — uses a Modal + FlatList.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, FlatList,
  TextInput, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

export interface PickerOption {
  value: string;
  label: string;
  group?: string;
}

interface SelectPickerProps {
  label: string;
  value: string;
  options: PickerOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export const SelectPicker: React.FC<SelectPickerProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  error,
  searchable = false,
  disabled = false,
  required = false,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLabel = options.find(o => o.value === value)?.label ?? '';

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const grouped = useMemo(() => {
    const map: Record<string, PickerOption[]> = {};
    filtered.forEach(o => {
      const g = o.group ?? 'Options';
      if (!map[g]) map[g] = [];
      map[g].push(o);
    });
    return map;
  }, [filtered]);

  const flatData: Array<{ type: 'header'; label: string } | { type: 'item'; option: PickerOption }> =
    useMemo(() => {
      const out: any[] = [];
      Object.entries(grouped).forEach(([group, items]) => {
        const keys = Object.keys(grouped);
        if (keys.length > 1) out.push({ type: 'header', label: group });
        items.forEach(o => out.push({ type: 'item', option: o }));
      });
      return out;
    }, [grouped]);

  return (
    <>
      <View style={s.wrapper}>
        <Text style={[s.label, { color: c.text }]}>
          {label}{required && <Text style={{ color: c.error }}> *</Text>}
        </Text>
        <TouchableOpacity
          onPress={() => !disabled && setOpen(true)}
          style={[
            s.trigger,
            {
              backgroundColor: c.inputBg ?? c.surface,
              borderColor: error ? c.error : value ? c.primary : c.border,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              s.triggerText,
              { color: selectedLabel ? c.text : c.placeholder ?? c.textMuted },
            ]}
            numberOfLines={1}
          >
            {selectedLabel || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color={c.textMuted} />
        </TouchableOpacity>
        {error ? <Text style={[s.error, { color: c.error }]}>{error}</Text> : null}
      </View>

      <Modal visible={open} animationType="slide" transparent>
        <View style={[s.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[s.sheet, { backgroundColor: c.surface }]}>
            {/* Header */}
            <View style={[s.sheetHeader, { borderBottomColor: c.border }]}>
              <Text style={[s.sheetTitle, { color: c.text }]}>{label}</Text>
              <TouchableOpacity onPress={() => { setOpen(false); setSearch(''); }}>
                <Ionicons name="close" size={24} color={c.text} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            {searchable && (
              <View style={[s.searchRow, { backgroundColor: c.inputBg ?? c.background }]}>
                <Ionicons name="search-outline" size={16} color={c.textMuted} />
                <TextInput
                  style={[s.searchInput, { color: c.text }]}
                  placeholder="Search..."
                  placeholderTextColor={c.placeholder ?? c.textMuted}
                  value={search}
                  onChangeText={setSearch}
                  autoFocus
                />
              </View>
            )}

            {/* List */}
            <FlatList
              data={flatData}
              keyExtractor={(item, i) =>
                item.type === 'header' ? `h-${item.label}` : `i-${item.option.value}-${i}`
              }
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return (
                    <View style={[s.groupHeader, { backgroundColor: c.background }]}>
                      <Text style={[s.groupHeaderText, { color: c.textMuted }]}>
                        {item.label}
                      </Text>
                    </View>
                  );
                }
                const opt = item.option;
                const isSelected = opt.value === value;
                return (
                  <TouchableOpacity
                    style={[
                      s.option,
                      { borderBottomColor: c.border },
                      isSelected && { backgroundColor: `${c.primary}15` },
                    ]}
                    onPress={() => {
                      onSelect(opt.value);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <Text
                      style={[
                        s.optionText,
                        { color: isSelected ? c.primary : c.text },
                        isSelected && { fontWeight: '600' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={c.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Text style={{ color: c.textMuted }}>No options found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const s = StyleSheet.create({
  wrapper:         { marginBottom: 16 },
  label:           { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  trigger:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5 },
  triggerText:     { fontSize: 15, flex: 1, marginRight: 8 },
  error:           { fontSize: 12, marginTop: 4 },
  overlay:         { flex: 1, justifyContent: 'flex-end' },
  sheet:           { maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  sheetHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  sheetTitle:      { fontSize: 17, fontWeight: '700' },
  searchRow:       { flexDirection: 'row', alignItems: 'center', margin: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, gap: 8 },
  searchInput:     { flex: 1, fontSize: 15 },
  groupHeader:     { paddingHorizontal: 16, paddingVertical: 8 },
  groupHeaderText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  option:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  optionText:      { fontSize: 15 },
  empty:           { padding: 32, alignItems: 'center' },
});
