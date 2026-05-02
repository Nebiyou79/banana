// mobile/src/components/freelanceTenders/FreelanceTenderFilters.tsx

import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type {
  Currency,
  EngagementType,
  ExperienceLevel,
  FreelanceTenderFilters,
  ProjectType,
  Urgency,
} from '../../types/freelanceTender';

export interface FreelanceTenderFiltersProps {
  initialFilters: FreelanceTenderFilters;
  onApply: (filters: FreelanceTenderFilters) => void;
  onClose: () => void;
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const Chip: React.FC<ChipProps> = memo(({ label, selected, onPress }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? c.primary : (c.surface ?? c.surface ?? c.card),
          borderColor: selected ? c.primary : (c.border ?? c.textMuted + '33'),
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        style={[
          styles.chipText,
          { color: selected ? '#fff' : c.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
});

// ─── Section header ───────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ title: string }> = ({ title }) => {
  const { theme } = useThemeStore();
  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
  );
};

// ─── Count active filters ─────────────────────────────────────────────────────

function countActiveFilters(f: FreelanceTenderFilters): number {
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

// ─── Main component ───────────────────────────────────────────────────────────

const FreelanceTenderFilters: React.FC<FreelanceTenderFiltersProps> = ({
  initialFilters,
  onApply,
  onClose,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);

  const [local, setLocal] = useState<FreelanceTenderFilters>({ ...initialFilters });

  const set = <K extends keyof FreelanceTenderFilters>(
    key: K,
    value: FreelanceTenderFilters[K] | undefined
  ) => setLocal((prev) => ({ ...prev, [key]: value }));

  const toggle = <T extends string>(
    key: keyof FreelanceTenderFilters,
    val: T,
    current: T | undefined
  ) => set(key as keyof FreelanceTenderFilters, current === val ? undefined : (val as FreelanceTenderFilters[typeof key]));

  const handleReset = () => {
    const reset: FreelanceTenderFilters = { page: 1, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' };
    setLocal(reset);
  };

  const handleApply = () => {
    onApply({ ...local, page: 1 });
    onClose();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  const activeCount = countActiveFilters(local);

  const ENGAGEMENT_OPTIONS: Array<{ label: string; value: EngagementType }> = [
    { label: 'Fixed Price', value: 'fixed_price' },
    { label: 'Hourly', value: 'hourly' },
    { label: 'Fixed Salary', value: 'fixed_salary' },
    { label: 'Negotiable', value: 'negotiable' },
  ];

  const EXPERIENCE_OPTIONS: Array<{ label: string; value: ExperienceLevel | 'any' }> = [
    { label: 'Any', value: 'any' },
    { label: 'Entry', value: 'entry' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Expert', value: 'expert' },
  ];

  const PROJECT_OPTIONS: Array<{ label: string; value: ProjectType }> = [
    { label: 'One-time', value: 'one_time' },
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Complex', value: 'complex' },
  ];

  const URGENCY_OPTIONS: Array<{ label: string; value: Urgency }> = [
    { label: 'Normal', value: 'normal' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const CURRENCY_OPTIONS: Currency[] = ['ETB', 'USD', 'EUR', 'GBP'];

  const SORT_OPTIONS: Array<{ label: string; value: 'createdAt' | 'deadline' }> = [
    { label: 'Newest first', value: 'createdAt' },
    { label: 'Deadline', value: 'deadline' },
  ];

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      index={0}
      backdropComponent={renderBackdrop}
      onClose={onClose}
      handleIndicatorStyle={{ backgroundColor: c.textMuted }}
      backgroundStyle={{ backgroundColor: c.background ?? c.card }}
      enablePanDownToClose
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border ?? c.textMuted + '22' }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>Filters</Text>
        {activeCount > 0 && (
          <View style={[styles.badge, { backgroundColor: c.primary }]}>
            <Text style={styles.badgeText}>{activeCount}</Text>
          </View>
        )}
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Engagement Type */}
        <SectionLabel title="Engagement Type" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {ENGAGEMENT_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={local.engagementType === o.value}
              onPress={() => toggle('engagementType', o.value, local.engagementType)}
            />
          ))}
        </ScrollView>

        {/* Budget */}
        <SectionLabel title="Budget Range" />
        <View style={styles.budgetRow}>
          <View style={[styles.budgetInput, { backgroundColor: c.surface ?? c.surface ?? c.card, borderColor: c.border ?? c.textMuted + '33' }]}>
            <Text style={[styles.budgetLabel, { color: c.textMuted }]}>Min</Text>
            <TextInput
              value={local.minBudget != null ? String(local.minBudget) : ''}
              onChangeText={(v) => set('minBudget', v ? Number(v) : undefined)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={c.textMuted}
              style={[styles.budgetField, { color: c.text }]}
            />
          </View>
          <Text style={[styles.budgetSep, { color: c.textMuted }]}>–</Text>
          <View style={[styles.budgetInput, { backgroundColor: c.surface ?? c.surface ?? c.card, borderColor: c.border ?? c.textMuted + '33' }]}>
            <Text style={[styles.budgetLabel, { color: c.textMuted }]}>Max</Text>
            <TextInput
              value={local.maxBudget != null ? String(local.maxBudget) : ''}
              onChangeText={(v) => set('maxBudget', v ? Number(v) : undefined)}
              keyboardType="numeric"
              placeholder="∞"
              placeholderTextColor={c.textMuted}
              style={[styles.budgetField, { color: c.text }]}
            />
          </View>
        </View>

        {/* Currency */}
        <SectionLabel title="Currency" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {CURRENCY_OPTIONS.map((cur) => (
            <Chip
              key={cur}
              label={cur}
              selected={local.skills === cur}
              onPress={() => {}}
            />
          ))}
        </ScrollView>

        {/* Experience Level */}
        <SectionLabel title="Experience Level" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {EXPERIENCE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={
                o.value === 'any'
                  ? !local.experienceLevel || local.experienceLevel === 'any'
                  : local.experienceLevel === o.value
              }
              onPress={() =>
                set(
                  'experienceLevel',
                  o.value === 'any' ? undefined : (o.value as ExperienceLevel)
                )
              }
            />
          ))}
        </ScrollView>

        {/* Project Type */}
        <SectionLabel title="Project Type" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {PROJECT_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={local.projectType === o.value}
              onPress={() => toggle('projectType', o.value, local.projectType)}
            />
          ))}
        </ScrollView>

        {/* Urgency */}
        <SectionLabel title="Urgency" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {URGENCY_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={local.urgency === o.value}
              onPress={() => toggle('urgency', o.value, local.urgency)}
            />
          ))}
        </ScrollView>

        {/* Sort By */}
        <SectionLabel title="Sort By" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {SORT_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={local.sortBy === o.value}
              onPress={() => {
                const newSortBy = o.value;
                const newSortOrder =
                  local.sortBy === newSortBy && local.sortOrder === 'asc' ? 'desc' : 'asc';
                setLocal((prev) => ({
                  ...prev,
                  sortBy: newSortBy,
                  sortOrder: newSortOrder,
                }));
              }}
            />
          ))}
          <Chip
            label={local.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            selected={false}
            onPress={() =>
              set('sortOrder', local.sortOrder === 'asc' ? 'desc' : 'asc')
            }
          />
        </ScrollView>

        <View style={styles.bottomSpacer} />
      </BottomSheetScrollView>

      {/* Footer buttons */}
      <View
        style={[
          styles.footer,
          { borderTopColor: c.border ?? c.textMuted + '22', backgroundColor: c.background ?? c.card },
        ]}
      >
        <Pressable
          onPress={handleReset}
          style={[
            styles.resetBtn,
            { borderColor: c.textMuted + '55' },
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.resetText, { color: c.textMuted }]}>Reset</Text>
        </Pressable>
        <Pressable
          onPress={handleApply}
          style={[styles.applyBtn, { backgroundColor: c.primary }]}
          accessibilityRole="button"
        >
          <Text style={styles.applyText}>
            Apply{activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', marginBottom: 4 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  budgetInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 52,
  },
  budgetLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  budgetField: { fontSize: 16, fontWeight: '600' },
  budgetSep: { fontSize: 20, fontWeight: '300' },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  resetBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { fontSize: 15, fontWeight: '600' },
  applyBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bottomSpacer: { height: 20 },
});

export default FreelanceTenderFilters;