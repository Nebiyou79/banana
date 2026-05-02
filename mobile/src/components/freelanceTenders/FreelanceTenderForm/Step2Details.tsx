// mobile/src/components/freelanceTenders/FreelanceTenderForm/Step2Details.tsx

import React, { memo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import type {
  Currency,
  EngagementType,
  ExperienceLevel,
  FreelanceTenderFormData,
  LocationType,
  ProjectType,
  TenderDetails,
  Urgency,
} from '../../../types/freelanceTender';

export interface Step2DetailsProps {
  data: Pick<FreelanceTenderFormData, 'details'>;
  onChange: (patch: Partial<FreelanceTenderFormData>) => void;
  errors: Record<string, string>;
}

// ─── Pill group helper ────────────────────────────────────────────────────────

interface PillGroupProps<T extends string> {
  options: Array<{ label: string; value: T }>;
  selected: T | undefined;
  onSelect: (v: T) => void;
  primaryColor: string;
  textColor: string;
  mutedColor: string;
  surfaceColor: string;
  borderColor: string;
}

function PillGroup<T extends string>({
  options,
  selected,
  onSelect,
  primaryColor,
  textColor,
  mutedColor,
  surfaceColor,
  borderColor,
}: PillGroupProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillRow}
    >
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.pill,
              {
                backgroundColor: active ? primaryColor : surfaceColor,
                borderColor: active ? primaryColor : borderColor,
              },
            ]}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.pillText,
                { color: active ? '#fff' : mutedColor },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const Step2Details: React.FC<Step2DetailsProps> = memo(({ data, onChange, errors }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const details = data.details;

  const patchDetails = (patch: Partial<TenderDetails>) => {
    onChange({ details: { ...details, ...patch } });
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: c.surface ?? c.card, borderColor: c.border ?? c.textMuted + '44', color: c.text },
  ];
  const labelStyle = [styles.label, { color: c.text }];
  const errorStyle = [styles.error, { color: c.error ?? '#EF4444' }];
  const hintStyle = [styles.hint, { color: c.textMuted }];
  const pillProps = {
    primaryColor: c.primary,
    textColor: c.text,
    mutedColor: c.textMuted,
    surfaceColor: c.surface ?? c.card,
    borderColor: c.border ?? c.textMuted + '44',
  };

  const ENGAGEMENT_OPTIONS: Array<{ label: string; value: EngagementType }> = [
    { label: 'Fixed Price', value: 'fixed_price' },
    { label: 'Hourly', value: 'hourly' },
    { label: 'Fixed Salary', value: 'fixed_salary' },
    { label: 'Negotiable', value: 'negotiable' },
  ];

  const EXPERIENCE_OPTIONS: Array<{ label: string; value: ExperienceLevel }> = [
    { label: 'Entry', value: 'entry' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Expert', value: 'expert' },
  ];

  const PROJECT_OPTIONS: Array<{ label: string; value: ProjectType }> = [
    { label: 'One-time', value: 'one_time' },
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Complex', value: 'complex' },
  ];

  const LOCATION_OPTIONS: Array<{ label: string; value: LocationType }> = [
    { label: 'Remote', value: 'remote' },
    { label: 'On-site', value: 'on_site' },
    { label: 'Hybrid', value: 'hybrid' },
    { label: 'Flexible', value: 'flexible' },
  ];

  const URGENCY_OPTIONS: Array<{ label: string; value: Urgency }> = [
    { label: 'Normal', value: 'normal' },
    { label: '⚡ Urgent', value: 'urgent' },
  ];

  const CURRENCY_OPTIONS: Currency[] = ['ETB', 'USD', 'EUR', 'GBP'];

  const TIMELINE_UNITS: Array<{ label: string; value: 'hours' | 'days' | 'weeks' | 'months' }> = [
    { label: 'hrs', value: 'hours' },
    { label: 'days', value: 'days' },
    { label: 'wks', value: 'weeks' },
    { label: 'mos', value: 'months' },
  ];

  const et = details.engagementType;

  return (
    <View style={styles.container}>
      {/* Engagement Type */}
      <View style={styles.field}>
        <Text style={labelStyle}>
          Engagement Type <Text style={errorStyle}>*</Text>
        </Text>
        <PillGroup
          options={ENGAGEMENT_OPTIONS}
          selected={et}
          onSelect={(v) => patchDetails({ engagementType: v })}
          {...pillProps}
        />
        {errors['details.engagementType'] ? (
          <Text style={errorStyle}>{errors['details.engagementType']}</Text>
        ) : null}
      </View>

      {/* Budget — fixed_price or hourly */}
      {(et === 'fixed_price' || et === 'hourly') && (
        <View style={styles.field}>
          <Text style={labelStyle}>
            {et === 'hourly' ? 'Hourly Rate (ETB)' : 'Budget (ETB)'}{' '}
            <Text style={errorStyle}>*</Text>
          </Text>
          <View style={styles.rangeRow}>
            <TextInput
              style={[inputStyle, styles.rangeInput]}
              value={details.budget?.min != null ? String(details.budget.min) : ''}
              onChangeText={(v) =>
                patchDetails({ budget: { ...(details.budget ?? { currency: 'ETB' }), min: v ? Number(v) : undefined } })
              }
              placeholder="Min"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
            />
            <Text style={[styles.rangeSep, { color: c.textMuted }]}>–</Text>
            <TextInput
              style={[inputStyle, styles.rangeInput]}
              value={details.budget?.max != null ? String(details.budget.max) : ''}
              onChangeText={(v) =>
                patchDetails({ budget: { ...(details.budget ?? { currency: 'ETB' }), max: v ? Number(v) : undefined } })
              }
              placeholder="Max"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
            />
          </View>
          {/* Currency picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {CURRENCY_OPTIONS.map((cur) => (
              <TouchableOpacity
                key={cur}
                onPress={() =>
                  patchDetails({ budget: { ...(details.budget ?? {}), currency: cur } as typeof details.budget })
                }
                style={[
                  styles.currencyChip,
                  {
                    backgroundColor: details.budget?.currency === cur ? c.primary : c.surface ?? c.card,
                    borderColor: details.budget?.currency === cur ? c.primary : c.border ?? c.textMuted + '44',
                  },
                ]}
              >
                <Text style={{ color: details.budget?.currency === cur ? '#fff' : c.textMuted, fontSize: 12, fontWeight: '600' }}>
                  {cur}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors['details.budget'] ? <Text style={errorStyle}>{errors['details.budget']}</Text> : null}
        </View>
      )}

      {/* Salary Range — fixed_salary */}
      {et === 'fixed_salary' && (
        <View style={styles.field}>
          <Text style={labelStyle}>
            Salary Range <Text style={errorStyle}>*</Text>
          </Text>
          <View style={styles.rangeRow}>
            <TextInput
              style={[inputStyle, styles.rangeInput]}
              value={details.salaryRange?.min != null ? String(details.salaryRange.min) : ''}
              onChangeText={(v) =>
                patchDetails({
                  salaryRange: { ...(details.salaryRange ?? { currency: 'ETB', period: 'monthly' }), min: v ? Number(v) : undefined },
                })
              }
              placeholder="Min"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
            />
            <Text style={[styles.rangeSep, { color: c.textMuted }]}>–</Text>
            <TextInput
              style={[inputStyle, styles.rangeInput]}
              value={details.salaryRange?.max != null ? String(details.salaryRange.max) : ''}
              onChangeText={(v) =>
                patchDetails({
                  salaryRange: { ...(details.salaryRange ?? { currency: 'ETB', period: 'monthly' }), max: v ? Number(v) : undefined },
                })
              }
              placeholder="Max"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.rowGap}>
            {/* Period */}
            <PillGroup
              options={[
                { label: 'Monthly', value: 'monthly' },
                { label: 'Yearly', value: 'yearly' },
              ]}
              selected={details.salaryRange?.period ?? 'monthly'}
              onSelect={(v) =>
                patchDetails({
                  salaryRange: { ...(details.salaryRange ?? { currency: 'ETB', min: 0, max: 0 }), period: v },
                })
              }
              {...pillProps}
            />
          </View>
          {errors['details.salaryRange'] ? (
            <Text style={errorStyle}>{errors['details.salaryRange']}</Text>
          ) : null}
        </View>
      )}

      {/* Negotiable note */}
      {et === 'negotiable' && (
        <View style={[styles.infoBox, { backgroundColor: c.primary + '14', borderColor: c.primary + '44' }]}>
          <Text style={[styles.infoText, { color: c.primary }]}>
            Freelancers will propose their own rates. You negotiate final terms.
          </Text>
        </View>
      )}

      {/* Weekly hours — hourly only */}
      {et === 'hourly' && (
        <View style={styles.field}>
          <Text style={labelStyle}>Weekly Hours (optional)</Text>
          <TextInput
            style={[inputStyle, { maxWidth: 140 }]}
            value={details.weeklyHours != null ? String(details.weeklyHours) : ''}
            onChangeText={(v) => patchDetails({ weeklyHours: v ? Number(v) : undefined })}
            placeholder="e.g. 20"
            placeholderTextColor={c.textMuted}
            keyboardType="numeric"
          />
          <Text style={hintStyle}>Hours per week — leave blank if flexible</Text>
        </View>
      )}

      {/* Experience Level */}
      <View style={styles.field}>
        <Text style={labelStyle}>Experience Level</Text>
        <PillGroup
          options={EXPERIENCE_OPTIONS}
          selected={details.experienceLevel}
          onSelect={(v) => patchDetails({ experienceLevel: v })}
          {...pillProps}
        />
      </View>

      {/* Project Type */}
      <View style={styles.field}>
        <Text style={labelStyle}>Project Type</Text>
        <PillGroup
          options={PROJECT_OPTIONS}
          selected={details.projectType}
          onSelect={(v) => patchDetails({ projectType: v })}
          {...pillProps}
        />
      </View>

      {/* Location Type */}
      <View style={styles.field}>
        <Text style={labelStyle}>Location Type</Text>
        <PillGroup
          options={LOCATION_OPTIONS}
          selected={details.locationType}
          onSelect={(v) => patchDetails({ locationType: v })}
          {...pillProps}
        />
      </View>

      {/* Positions */}
      <View style={styles.field}>
        <Text style={labelStyle}>Number of Positions</Text>
        <TextInput
          style={[inputStyle, { maxWidth: 120 }]}
          value={String(details.numberOfPositions ?? 1)}
          onChangeText={(v) => patchDetails({ numberOfPositions: v ? Number(v) : 1 })}
          keyboardType="numeric"
          placeholder="1"
          placeholderTextColor={c.textMuted}
        />
      </View>

      {/* Estimated Timeline */}
      <View style={styles.field}>
        <Text style={labelStyle}>Estimated Timeline</Text>
        <View style={styles.rangeRow}>
          <TextInput
            style={[inputStyle, { width: 90 }]}
            value={details.estimatedTimeline?.value != null ? String(details.estimatedTimeline.value) : ''}
            onChangeText={(v) =>
              patchDetails({
                estimatedTimeline: {
                  ...(details.estimatedTimeline ?? { unit: 'weeks' }),
                  value: v ? Number(v) : 1,
                },
              })
            }
            keyboardType="numeric"
            placeholder="4"
            placeholderTextColor={c.textMuted}
          />
          <PillGroup
            options={TIMELINE_UNITS}
            selected={details.estimatedTimeline?.unit ?? 'weeks'}
            onSelect={(v) =>
              patchDetails({
                estimatedTimeline: {
                  ...(details.estimatedTimeline ?? { value: 4 }),
                  unit: v,
                },
              })
            }
            {...pillProps}
          />
        </View>
      </View>

      {/* Urgency */}
      <View style={styles.field}>
        <Text style={labelStyle}>Urgency</Text>
        <PillGroup
          options={URGENCY_OPTIONS}
          selected={details.urgency}
          onSelect={(v) => patchDetails({ urgency: v })}
          {...pillProps}
        />
      </View>

      {/* Language Preference */}
      <View style={styles.field}>
        <Text style={labelStyle}>Language Preference (optional)</Text>
        <TextInput
          style={inputStyle}
          value={details.languagePreference ?? ''}
          onChangeText={(v) => patchDetails({ languagePreference: v || undefined })}
          placeholder="e.g. English, Amharic"
          placeholderTextColor={c.textMuted}
        />
      </View>

      {/* Toggles: NDA / Portfolio */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          onPress={() => patchDetails({ ndaRequired: !details.ndaRequired })}
          style={[
            styles.toggleChip,
            {
              backgroundColor: details.ndaRequired ? c.primary + '18' : c.surface ?? c.card,
              borderColor: details.ndaRequired ? c.primary : c.border ?? c.textMuted + '44',
            },
          ]}
          activeOpacity={0.75}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: details.ndaRequired }}
        >
          <Text style={[styles.toggleText, { color: details.ndaRequired ? c.primary : c.textMuted }]}>
            {details.ndaRequired ? '✓ ' : ''}NDA Required
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => patchDetails({ portfolioRequired: !details.portfolioRequired })}
          style={[
            styles.toggleChip,
            {
              backgroundColor: details.portfolioRequired ? c.primary + '18' : c.surface ?? c.card,
              borderColor: details.portfolioRequired ? c.primary : c.border ?? c.textMuted + '44',
            },
          ]}
          activeOpacity={0.75}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: details.portfolioRequired }}
        >
          <Text style={[styles.toggleText, { color: details.portfolioRequired ? c.primary : c.textMuted }]}>
            {details.portfolioRequired ? '✓ ' : ''}Portfolio Required
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

Step2Details.displayName = 'Step2Details';

const styles = StyleSheet.create({
  container: { gap: 4 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 50 },
  error: { fontSize: 12, marginTop: 4 },
  hint: { fontSize: 11, marginTop: 4 },
  pillRow: { gap: 8, paddingVertical: 2 },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  pillText: { fontSize: 13, fontWeight: '600' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rangeInput: { flex: 1 },
  rangeSep: { fontSize: 20, fontWeight: '300' },
  rowGap: { marginTop: 8 },
  currencyChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  infoText: { fontSize: 13, lineHeight: 19 },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  toggleChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleText: { fontSize: 13, fontWeight: '600' },
});

export default Step2Details;