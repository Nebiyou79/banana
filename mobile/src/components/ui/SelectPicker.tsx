// SelectPicker.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

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
  label, value, options, onSelect, placeholder = 'Select an option',
  error, searchable = false, disabled = false, required = false,
}) => {
  const { colors, radius, type } = useTheme();
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
    filtered.forEach(o => { const g = o.group ?? 'Options'; if (!map[g]) map[g] = []; map[g].push(o); });
    return map;
  }, [filtered]);

  const flatData: Array<{ type: 'header'; label: string } | { type: 'item'; option: PickerOption }> = useMemo(() => {
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
        <Text style={[s.label, type.caption, { color: colors.textPrimary }]}>{label}{required && <Text style={{ color: colors.error }}> *</Text>}</Text>
        <TouchableOpacity
          onPress={() => !disabled && setOpen(true)}
          style={[s.trigger, { backgroundColor: colors.bgCard, borderColor: error ? colors.error : value ? colors.accent : colors.borderPrimary, borderRadius: radius.md, opacity: disabled ? 0.5 : 1 }]}
          activeOpacity={0.7}
        >
          <Text style={[s.triggerText, type.body, { color: selectedLabel ? colors.textPrimary : colors.textMuted }]} numberOfLines={1}>{selectedLabel || placeholder}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        {error ? <Text style={[s.error, type.caption, { color: colors.error }]}>{error}</Text> : null}
      </View>

      <Modal visible={open} animationType="slide" transparent>
        <View style={[s.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[s.sheet, { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
            <View style={[s.sheetHeader, { borderBottomColor: colors.borderPrimary }]}>
              <Text style={[s.sheetTitle, type.h4, { color: colors.textPrimary }]}>{label}</Text>
              <TouchableOpacity onPress={() => { setOpen(false); setSearch(''); }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {searchable && (
              <View style={[s.searchRow, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
                <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                <TextInput style={[s.searchInput, type.body, { color: colors.textPrimary }]} placeholder="Search..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} autoFocus />
              </View>
            )}
            <FlatList
              data={flatData}
              keyExtractor={(item, i) => item.type === 'header' ? `h-${item.label}` : `i-${item.option.value}-${i}`}
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return (
                    <View style={[s.groupHeader, { backgroundColor: colors.bgSecondary }]}>
                      <Text style={[s.groupHeaderText, type.caption, { color: colors.textMuted }]}>{item.label}</Text>
                    </View>
                  );
                }
                const opt = item.option;
                const isSelected = opt.value === value;
                return (
                  <TouchableOpacity
                    style={[s.option, { borderBottomColor: colors.borderPrimary }, isSelected && { backgroundColor: colors.accentBg }]}
                    onPress={() => { onSelect(opt.value); setOpen(false); setSearch(''); }}
                  >
                    <Text style={[s.optionText, type.body, { color: isSelected ? colors.accent : colors.textPrimary }, isSelected && { fontWeight: '600' }]}>{opt.label}</Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color={colors.accent} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<View style={s.empty}><Text style={[type.body, { color: colors.textMuted }]}>No options found</Text></View>}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const s = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 6 },
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5 },
  triggerText: { flex: 1, marginRight: 8 },
  error: { marginTop: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '80%', paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  sheetTitle: { fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1 },
  groupHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  groupHeaderText: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  optionText: { fontWeight: '400' },
  empty: { padding: 32, alignItems: 'center' },
});