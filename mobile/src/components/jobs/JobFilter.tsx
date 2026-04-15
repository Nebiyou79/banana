/**
 * mobile/src/components/jobs/JobFilter.tsx
 * Advanced filter panel for Job Explorer — salary, remote, industry, experience.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, TextInput, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { JobFilters, ETHIOPIAN_REGIONS, JOB_TYPES, EXPERIENCE_LEVELS, SALARY_MODES } from '../../services/jobService';

interface Props {
  filters:   JobFilters;
  onChange:  (filters: JobFilters) => void;
  activeCount: number;
}

const REMOTE_OPTS = [
  { value: 'remote',  label: 'Remote',  icon: 'wifi-outline' },
  { value: 'hybrid',  label: 'Hybrid',  icon: 'git-branch-outline' },
  { value: 'on-site', label: 'On-Site', icon: 'business-outline' },
];

export const JobFilter: React.FC<Props> = ({ filters, onChange, activeCount }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<JobFilters>(filters);

  const open  = () => { setDraft(filters); setVisible(true); };
  const close = () => setVisible(false);
  const apply = () => { onChange(draft); close(); };
  const reset = () => { setDraft({} as JobFilters); onChange({} as JobFilters); close(); };

  const toggle = useCallback(<K extends keyof JobFilters>(key: K, val: JobFilters[K]) => {
    setDraft(d => ({ ...d, [key]: d[key] === val ? undefined : val }));
  }, []);

  const Chip: React.FC<{ active: boolean; label: string; onPress: () => void }> = ({ active, label, onPress }) => (
    <TouchableOpacity
      style={[f.chip, {
        backgroundColor: active ? c.primary : c.inputBg,
        borderColor: active ? c.primary : c.border,
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[f.chipText, { color: active ? '#fff' : c.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity
        style={[f.trigger, { backgroundColor: c.card, borderColor: activeCount > 0 ? c.primary : c.border }]}
        onPress={open}
        activeOpacity={0.8}
      >
        <Ionicons name="options-outline" size={18} color={activeCount > 0 ? c.primary : c.textSecondary} />
        <Text style={[f.triggerText, { color: activeCount > 0 ? c.primary : c.textSecondary }]}>Filters</Text>
        {activeCount > 0 && (
          <View style={[f.badge, { backgroundColor: c.primary }]}>
            <Text style={f.badgeText}>{activeCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Filter sheet */}
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <View style={[f.sheet, { backgroundColor: c.background }]}>
          {/* Sheet header */}
          <View style={[f.sheetHeader, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={close} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Ionicons name="close" size={22} color={c.text} />
            </TouchableOpacity>
            <Text style={[f.sheetTitle, { color: c.text }]}>Filters</Text>
            <TouchableOpacity onPress={reset}>
              <Text style={[f.resetText, { color: c.error }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={f.body} showsVerticalScrollIndicator={false}>
            {/* Salary Mode */}
            <View style={f.section}>
              <Text style={[f.sectionTitle, { color: c.textSecondary }]}>SALARY TYPE</Text>
              <View style={f.chips}>
                {SALARY_MODES.map(m => (
                  <Chip key={m.value} active={draft.salaryMode === m.value} label={m.label}
                    onPress={() => toggle('salaryMode', m.value)} />
                ))}
              </View>
            </View>

            {/* Remote */}
            <View style={f.section}>
              <Text style={[f.sectionTitle, { color: c.textSecondary }]}>WORK ARRANGEMENT</Text>
              <View style={f.chips}>
                {REMOTE_OPTS.map(r => (
                  <Chip key={r.value} active={(draft as any).remote === r.value} label={r.label}
                    onPress={() => setDraft(d => ({ ...d, remote: d.remote === r.value ? undefined : r.value as any }))} />
                ))}
              </View>
            </View>

            {/* Employment Type */}
            <View style={f.section}>
              <Text style={[f.sectionTitle, { color: c.textSecondary }]}>EMPLOYMENT TYPE</Text>
              <View style={f.chips}>
                {JOB_TYPES.map(t => (
                  <Chip key={t.value} active={draft.type === t.value} label={t.label}
                    onPress={() => toggle('type', t.value)} />
                ))}
              </View>
            </View>

            {/* Experience Level */}
            <View style={f.section}>
              <Text style={[f.sectionTitle, { color: c.textSecondary }]}>EXPERIENCE LEVEL</Text>
              <View style={f.chips}>
                {EXPERIENCE_LEVELS.map(e => (
                  <Chip key={e.value} active={draft.experienceLevel === e.value} label={e.label}
                    onPress={() => toggle('experienceLevel', e.value)} />
                ))}
              </View>
            </View>

            {/* Region */}
            <View style={f.section}>
              <Text style={[f.sectionTitle, { color: c.textSecondary }]}>REGION</Text>
              <View style={f.chips}>
                {ETHIOPIAN_REGIONS.slice(0, 6).map(r => (
                  <Chip key={r.value} active={draft.region === r.value} label={r.label}
                    onPress={() => toggle('region', r.value)} />
                ))}
              </View>
            </View>

            {/* Min Salary */}
            <View style={f.section}>
              <Text style={[f.sectionTitle, { color: c.textSecondary }]}>MIN SALARY (ETB)</Text>
              <TextInput
                style={[f.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
                value={draft.minSalary?.toString() ?? ''}
                onChangeText={v => setDraft(d => ({ ...d, minSalary: v ? Number(v) : undefined }))}
                placeholder="e.g. 15000"
                placeholderTextColor={c.placeholder}
                keyboardType="numeric"
              />
            </View>

            {/* Featured only */}
            <View style={[f.section, f.toggleRow]}>
              <View>
                <Text style={[f.sectionTitle, { color: c.text }]}>Featured Jobs Only</Text>
                <Text style={[f.toggleSub, { color: c.textMuted }]}>Show only highlighted listings</Text>
              </View>
              <Switch
                value={!!draft.featured}
                onValueChange={v => setDraft(d => ({ ...d, featured: v || undefined }))}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>

            {/* Urgent only */}
            <View style={[f.section, f.toggleRow]}>
              <View>
                <Text style={[f.sectionTitle, { color: c.text }]}>Urgent Positions Only</Text>
                <Text style={[f.toggleSub, { color: c.textMuted }]}>Immediate hiring required</Text>
              </View>
              <Switch
                value={!!draft.urgent}
                onValueChange={v => setDraft(d => ({ ...d, urgent: v || undefined }))}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          {/* Apply button */}
          <View style={[f.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
            <TouchableOpacity style={[f.applyBtn, { backgroundColor: c.primary }]} onPress={apply} activeOpacity={0.85}>
              <Text style={f.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const f = StyleSheet.create({
  trigger:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  triggerText:  { fontSize: 14, fontWeight: '600' },
  badge:        { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  badgeText:    { color: '#fff', fontSize: 10, fontWeight: '700' },
  sheet:        { flex: 1 },
  sheetHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  sheetTitle:   { fontSize: 17, fontWeight: '700' },
  resetText:    { fontSize: 14, fontWeight: '600' },
  body:         { padding: 16, paddingBottom: 32, gap: 4 },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  chips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText:     { fontSize: 13, fontWeight: '600' },
  input:        { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleSub:    { fontSize: 12, marginTop: 2 },
  footer:       { padding: 16, borderTopWidth: 1 },
  applyBtn:     { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  applyText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});