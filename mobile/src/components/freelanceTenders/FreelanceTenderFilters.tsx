import React, { memo, useEffect, useRef, useState, useMemo } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput,
  View, Modal, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type {
  EngagementType, ExperienceLevel, FreelanceTenderFilters,
  ProjectType, Urgency,
} from '../../types/freelanceTender';

const SCREEN_H = Dimensions.get('window').height;

// ─── Chip ─────────────────────────────────────────────────────────────────────
interface ChipProps { label: string; selected: boolean; onPress: () => void }

const Chip: React.FC<ChipProps> = memo(({ label, selected, onPress }) => {
  const { colors: c, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? c.primary : (c.surface ?? c.bgCard),
          borderColor: selected ? c.primary : c.border,
          borderRadius: radius.full,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : c.textMuted }]}>{label}</Text>
    </Pressable>
  );
});

// ─── Section label ────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ title: string }> = memo(({ title }) => {
  const { colors: c, type } = useTheme();
  return (
    <Text style={[type.caption, styles.sectionTitle, { color: c.text }]}>{title}</Text>
  );
});

// ─── Active filter counter ────────────────────────────────────────────────────
function countActive(f: FreelanceTenderFilters): number {
  let n = 0;
  if (f.search) n++;
  if (f.procurementCategory) n++;
  if (f.engagementType) n++;
  if (f.minBudget != null || f.maxBudget != null) n++;
  if (f.experienceLevel && f.experienceLevel !== 'any') n++;
  if (f.urgency) n++;
  if (f.projectType) n++;
  if (f.skills) n++;
  if (f.sortBy && f.sortBy !== 'createdAt') n++;
  return n;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export interface FreelanceTenderFiltersProps {
  initialFilters: FreelanceTenderFilters;
  onApply: (filters: FreelanceTenderFilters) => void;
  onClose: () => void;
}

const FreelanceTenderFiltersSheet: React.FC<FreelanceTenderFiltersProps> = ({
  initialFilters, onApply, onClose,
}) => {
  const { colors: c, radius, type, spacing } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const [local, setLocal] = useState<FreelanceTenderFilters>({ ...initialFilters });

  const sheetStyles = useMemo(() => makeSheetStyles(c, radius, spacing), [c, radius, spacing]);

  useEffect(() => {
    Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(translateY, { toValue: SCREEN_H, duration: 250, useNativeDriver: true })
      .start(onClose);
  };

  const set = <K extends keyof FreelanceTenderFilters>(key: K, value: FreelanceTenderFilters[K] | undefined) =>
    setLocal(prev => ({ ...prev, [key]: value }));

  const toggle = <T extends string>(key: keyof FreelanceTenderFilters, val: T, current: T | undefined) =>
    set(key as any, current === val ? undefined : val as any);

  const activeCount = countActive(local);

  const ENGAGEMENT_OPTIONS: Array<{ label: string; value: EngagementType }> = [
    { label: 'Fixed Price',   value: 'fixed_price' },
    { label: 'Hourly',        value: 'hourly' },
    { label: 'Fixed Salary',  value: 'fixed_salary' },
    { label: 'Negotiable',    value: 'negotiable' },
  ];

  const EXPERIENCE_OPTIONS: Array<{ label: string; value: ExperienceLevel | 'any' }> = [
    { label: 'Any',           value: 'any' },
    { label: 'Entry',         value: 'entry' },
    { label: 'Intermediate',  value: 'intermediate' },
    { label: 'Expert',        value: 'expert' },
  ];

  const PROJECT_OPTIONS: Array<{ label: string; value: ProjectType }> = [
    { label: 'One-time', value: 'one_time' },
    { label: 'Ongoing',  value: 'ongoing' },
    { label: 'Complex',  value: 'complex' },
  ];

  const URGENCY_OPTIONS: Array<{ label: string; value: Urgency }> = [
    { label: 'Normal', value: 'normal' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const SORT_OPTIONS: Array<{ label: string; value: 'createdAt' | 'deadline' }> = [
    { label: 'Newest first', value: 'createdAt' },
    { label: 'Deadline',     value: 'deadline' },
  ];

  return (
    <Modal transparent visible animationType="none" onRequestClose={handleClose}>
      <Pressable style={sheetStyles.overlay} onPress={handleClose} />
      <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY }] }]}>
        {/* Header */}
        <View style={sheetStyles.header}>
          <Text style={[type.h3, { color: c.text, flex: 1, fontWeight: '700' }]}>Filters</Text>
          {activeCount > 0 && (
            <View style={[sheetStyles.badge, { backgroundColor: c.primary }]}>
              <Text style={sheetStyles.badgeText}>{activeCount}</Text>
            </View>
          )}
          <Pressable onPress={handleClose} style={sheetStyles.closeBtn} accessibilityRole="button" accessibilityLabel="Close filters">
            <Ionicons name="close" size={22} color={c.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={sheetStyles.content} showsVerticalScrollIndicator={false}>
          <SectionLabel title="Engagement Type" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetStyles.chipRow}>
            {ENGAGEMENT_OPTIONS.map(o => (
              <Chip key={o.value} label={o.label}
                selected={local.engagementType === o.value}
                onPress={() => toggle('engagementType', o.value, local.engagementType)} />
            ))}
          </ScrollView>

          <SectionLabel title="Budget Range" />
          <View style={sheetStyles.budgetRow}>
            <View style={[sheetStyles.budgetInput, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
              <Text style={[type.caption, { color: c.textMuted, fontWeight: '600', textTransform: 'uppercase' }]}>Min</Text>
              <TextInput
                value={local.minBudget != null ? String(local.minBudget) : ''}
                onChangeText={v => set('minBudget', v ? Number(v) : undefined)}
                keyboardType="numeric" placeholder="0"
                placeholderTextColor={c.textMuted}
                style={[sheetStyles.budgetField, { color: c.text }]}
              />
            </View>
            <Text style={[type.body, { color: c.textMuted, fontWeight: '300', fontSize: 20 }]}>–</Text>
            <View style={[sheetStyles.budgetInput, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
              <Text style={[type.caption, { color: c.textMuted, fontWeight: '600', textTransform: 'uppercase' }]}>Max</Text>
              <TextInput
                value={local.maxBudget != null ? String(local.maxBudget) : ''}
                onChangeText={v => set('maxBudget', v ? Number(v) : undefined)}
                keyboardType="numeric" placeholder="∞"
                placeholderTextColor={c.textMuted}
                style={[sheetStyles.budgetField, { color: c.text }]}
              />
            </View>
          </View>

          <SectionLabel title="Experience Level" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetStyles.chipRow}>
            {EXPERIENCE_OPTIONS.map(o => (
              <Chip key={o.value} label={o.label}
                selected={o.value === 'any'
                  ? !local.experienceLevel || local.experienceLevel === 'any'
                  : local.experienceLevel === o.value}
                onPress={() => set('experienceLevel', o.value === 'any' ? undefined : o.value as ExperienceLevel)} />
            ))}
          </ScrollView>

          <SectionLabel title="Project Type" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetStyles.chipRow}>
            {PROJECT_OPTIONS.map(o => (
              <Chip key={o.value} label={o.label}
                selected={local.projectType === o.value}
                onPress={() => toggle('projectType', o.value, local.projectType)} />
            ))}
          </ScrollView>

          <SectionLabel title="Urgency" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetStyles.chipRow}>
            {URGENCY_OPTIONS.map(o => (
              <Chip key={o.value} label={o.label}
                selected={local.urgency === o.value}
                onPress={() => toggle('urgency', o.value, local.urgency)} />
            ))}
          </ScrollView>

          <SectionLabel title="Sort By" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetStyles.chipRow}>
            {SORT_OPTIONS.map(o => (
              <Chip key={o.value} label={o.label}
                selected={local.sortBy === o.value}
                onPress={() => setLocal(prev => ({
                  ...prev, sortBy: o.value,
                  sortOrder: prev.sortBy === o.value && prev.sortOrder === 'asc' ? 'desc' : 'asc',
                }))} />
            ))}
          </ScrollView>

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={[sheetStyles.footer, { borderTopColor: c.border, backgroundColor: c.bgCard }]}>
          <Pressable
            onPress={() => setLocal({ page: 1, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' })}
            style={[sheetStyles.resetBtn, { borderColor: withAlpha(c.textMuted, 0.4) }]}
            accessibilityRole="button"
          >
            <Text style={[type.body, { color: c.textMuted, fontWeight: '600' }]}>Reset</Text>
          </Pressable>
          <Pressable
            onPress={() => { onApply({ ...local, page: 1 }); handleClose(); }}
            style={[sheetStyles.applyBtn, { backgroundColor: c.primary }]}
            accessibilityRole="button"
          >
            <Text style={[type.body, { color: '#FFFFFF', fontWeight: '700' }]}>
              Apply{activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default FreelanceTenderFiltersSheet;

const styles = StyleSheet.create({
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, marginRight: 8, minHeight: 44, justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 18, marginBottom: 8 },
});

const makeSheetStyles = (c: any, radius: any, spacing: any) =>
  StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: withAlpha('#000000', 0.45) },
    sheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: '88%',
      borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
      backgroundColor: c.bgCard, overflow: 'hidden',
    },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.lg, paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border,
      gap: spacing.sm,
    },
    badge: {
      minWidth: 22, height: 22, borderRadius: 11,
      paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center',
    },
    badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: spacing.lg, paddingTop: 4 },
    chipRow: { marginBottom: 4 },
    budgetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    budgetInput: {
      flex: 1, borderWidth: 1, borderRadius: radius.md,
      paddingHorizontal: 12, paddingVertical: 10, minHeight: 52,
    },
    budgetField: { fontSize: 16, fontWeight: '600', marginTop: 2 },
    footer: {
      flexDirection: 'row', padding: spacing.lg,
      gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth,
    },
    resetBtn: {
      flex: 1, height: 52, borderRadius: radius.md,
      borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    applyBtn: {
      flex: 2, height: 52, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
    },
  });