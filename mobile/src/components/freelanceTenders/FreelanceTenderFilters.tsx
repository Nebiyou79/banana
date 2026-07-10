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

// ─── Filter chip ──────────────────────────────────────────────────────────────

interface ChipProps { label: string; selected: boolean; onPress: () => void }

const Chip: React.FC<ChipProps> = memo(({ label, selected, onPress }) => {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        chipS.root,
        {
          backgroundColor: selected ? colors.primary : withAlpha(colors.text, 0.04),
          borderColor:     selected ? colors.primary : colors.border,
          borderRadius:    radius.full,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {selected && <Ionicons name="checkmark" size={11} color="#fff" style={{ marginRight: 4 }} />}
      <Text style={[chipS.label, { color: selected ? '#fff' : colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
});

// ─── Section title ────────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ title: string }> = memo(({ title }) => {
  const { colors, type } = useTheme();
  return (
    <Text style={[type.caption, secS.title, { color: colors.textMuted }]}>{title}</Text>
  );
});

// ─── Active filter count ──────────────────────────────────────────────────────

function countActive(f: FreelanceTenderFilters): number {
  let n = 0;
  if (f.search)                                  n++;
  if (f.procurementCategory)                     n++;
  if (f.engagementType)                          n++;
  if (f.minBudget != null || f.maxBudget != null) n++;
  if (f.experienceLevel && f.experienceLevel !== 'any') n++;
  if (f.urgency)                                 n++;
  if (f.projectType)                             n++;
  if (f.skills)                                  n++;
  if (f.sortBy && f.sortBy !== 'createdAt')      n++;
  return n;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export interface FreelanceTenderFiltersProps {
  initialFilters: FreelanceTenderFilters;
  onApply:        (filters: FreelanceTenderFilters) => void;
  onClose:        () => void;
}

const FreelanceTenderFiltersSheet: React.FC<FreelanceTenderFiltersProps> = ({
  initialFilters, onApply, onClose,
}) => {
  const { colors, radius, type, spacing } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const [local, setLocal] = useState<FreelanceTenderFilters>({ ...initialFilters });

  const sheetS = useMemo(() => makeSheetStyles(colors, radius, spacing), [colors, radius, spacing]);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0, useNativeDriver: true, bounciness: 4,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(translateY, { toValue: SCREEN_H, duration: 220, useNativeDriver: true })
      .start(onClose);
  };

  const set = <K extends keyof FreelanceTenderFilters>(key: K, value: FreelanceTenderFilters[K] | undefined) =>
    setLocal(prev => ({ ...prev, [key]: value }));

  const toggle = <T extends string>(key: keyof FreelanceTenderFilters, val: T, current: T | undefined) =>
    set(key as any, current === val ? undefined : val as any);

  const activeCount = countActive(local);

  const ENGAGEMENT_OPTIONS: Array<{ label: string; value: EngagementType }> = [
    { label: 'Fixed Price',  value: 'fixed_price'  },
    { label: 'Hourly',       value: 'hourly'        },
    { label: 'Fixed Salary', value: 'fixed_salary'  },
    { label: 'Negotiable',   value: 'negotiable'    },
  ];

  const EXPERIENCE_OPTIONS: Array<{ label: string; value: ExperienceLevel | 'any' }> = [
    { label: 'Any',          value: 'any'          },
    { label: 'Entry',        value: 'entry'        },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Expert',       value: 'expert'       },
  ];

  const PROJECT_OPTIONS: Array<{ label: string; value: ProjectType }> = [
    { label: 'One-time', value: 'one_time' },
    { label: 'Ongoing',  value: 'ongoing'  },
    { label: 'Complex',  value: 'complex'  },
  ];

  const URGENCY_OPTIONS: Array<{ label: string; value: Urgency }> = [
    { label: 'Normal', value: 'normal' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const SORT_OPTIONS: Array<{ label: string; value: 'createdAt' | 'deadline' }> = [
    { label: 'Newest first', value: 'createdAt' },
    { label: 'Deadline',     value: 'deadline'  },
  ];

  return (
    <Modal transparent visible animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      <Pressable style={sheetS.overlay} onPress={handleClose} />

      {/* Sheet */}
      <Animated.View style={[sheetS.sheet, { transform: [{ translateY }] }]}>

        {/* Handle */}
        <View style={sheetS.handleWrap}>
          <View style={[sheetS.handle, { backgroundColor: withAlpha(colors.textMuted, 0.25) }]} />
        </View>

        {/* Header */}
        <View style={[sheetS.header, { borderBottomColor: colors.border }]}>
          <Text style={[type.h3, { color: colors.text, fontWeight: '800', flex: 1 }]}>Filters</Text>
          {activeCount > 0 && (
            <View style={[sheetS.badge, { backgroundColor: colors.primary }]}>
              <Text style={sheetS.badgeText}>{activeCount}</Text>
            </View>
          )}
          <Pressable onPress={handleClose} style={sheetS.closeBtn} accessibilityLabel="Close filters">
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Scroll content */}
        <ScrollView contentContainerStyle={sheetS.content} showsVerticalScrollIndicator={false}>

          <SectionTitle title="Engagement Type" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetS.chipRow}>
            {ENGAGEMENT_OPTIONS.map(o => (
              <Chip key={o.value} label={o.label}
                selected={local.engagementType === o.value}
                onPress={() => toggle('engagementType', o.value, local.engagementType)} />
            ))}
          </ScrollView>

          <SectionTitle title="Budget Range" />
          <View style={sheetS.budgetRow}>
            <View style={[sheetS.budgetInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[type.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', fontSize: 10 }]}>Min</Text>
              <TextInput
                value={local.minBudget != null ? String(local.minBudget) : ''}
                onChangeText={v => set('minBudget', v ? Number(v) : undefined)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                style={[sheetS.budgetField, { color: colors.text }]}
              />
            </View>
            <Text style={[type.body, { color: colors.textMuted, fontSize: 18 }]}>–</Text>
            <View style={[sheetS.budgetInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[type.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', fontSize: 10 }]}>Max</Text>
              <TextInput
                value={local.maxBudget != null ? String(local.maxBudget) : ''}
                onChangeText={v => set('maxBudget', v ? Number(v) : undefined)}
                keyboardType="numeric"
                placeholder="∞"
                placeholderTextColor={colors.textMuted}
                style={[sheetS.budgetField, { color: colors.text }]}
              />
            </View>
          </View>

          <SectionTitle title="Experience Level" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetS.chipRow}>
            {EXPERIENCE_OPTIONS.map(o => (
              <Chip key={o.value} label={o.label}
                selected={o.value === 'any'
                  ? !local.experienceLevel || local.experienceLevel === 'any'
                  : local.experienceLevel === o.value}
                onPress={() => set('experienceLevel', o.value === 'any' ? undefined : o.value as ExperienceLevel)} />
            ))}
          </ScrollView>

          <SectionTitle title="Project Type" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetS.chipRow}>
            {PROJECT_OPTIONS.map(o => (
              <Chip key={o.value} label={o.label}
                selected={local.projectType === o.value}
                onPress={() => toggle('projectType', o.value, local.projectType)} />
            ))}
          </ScrollView>

          <SectionTitle title="Urgency" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetS.chipRow}>
            {URGENCY_OPTIONS.map(o => (
              <Chip key={o.value} label={o.label}
                selected={local.urgency === o.value}
                onPress={() => toggle('urgency', o.value, local.urgency)} />
            ))}
          </ScrollView>

          <SectionTitle title="Sort By" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetS.chipRow}>
            {SORT_OPTIONS.map(o => (
              <Chip key={o.value} label={o.label}
                selected={local.sortBy === o.value}
                onPress={() => setLocal(prev => ({
                  ...prev,
                  sortBy:    o.value,
                  sortOrder: prev.sortBy === o.value && prev.sortOrder === 'asc' ? 'desc' : 'asc',
                }))} />
            ))}
          </ScrollView>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[sheetS.footer, { borderTopColor: colors.border, backgroundColor: colors.bgCard }]}>
          <Pressable
            onPress={() => setLocal({ page: 1, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' })}
            style={[sheetS.resetBtn, { borderColor: withAlpha(colors.textMuted, 0.35) }]}
            accessibilityRole="button"
          >
            <Text style={[type.bodySm, { color: colors.textMuted, fontWeight: '700' }]}>Reset</Text>
          </Pressable>
          <Pressable
            onPress={() => { onApply({ ...local, page: 1 }); handleClose(); }}
            style={[sheetS.applyBtn, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
          >
            <Text style={[type.bodySm, { color: '#fff', fontWeight: '800' }]}>
              Apply{activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default FreelanceTenderFiltersSheet;

// ─── Static styles ─────────────────────────────────────────────────────────────

const chipS = StyleSheet.create({
  root:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, marginRight: 8, minHeight: 36 },
  label: { fontSize: 13, fontWeight: '600' },
});

const secS = StyleSheet.create({
  title: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 10, marginTop: 20, marginBottom: 10 },
});

// ─── Dynamic sheet styles ─────────────────────────────────────────────────────

const makeSheetStyles = (c: any, radius: any, spacing: any) =>
  StyleSheet.create({
    overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' },
    sheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: '88%',
      borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
      backgroundColor: c.bgCard, overflow: 'hidden',
    },
    handleWrap:  { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
    handle:      { width: 36, height: 4, borderRadius: 2 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.lg, paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.sm,
    },
    badge:       { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
    badgeText:   { color: '#fff', fontSize: 11, fontWeight: '800' },
    closeBtn:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    content:     { paddingHorizontal: spacing.lg, paddingTop: 4 },
    chipRow:     { marginBottom: 2 },
    budgetRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    budgetInput: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, minHeight: 50 },
    budgetField: { fontSize: 16, fontWeight: '600', marginTop: 2 },
    footer: {
      flexDirection: 'row', padding: spacing.lg,
      gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth,
    },
    resetBtn:  { flex: 1, height: 50, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    applyBtn:  { flex: 2, height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  });
