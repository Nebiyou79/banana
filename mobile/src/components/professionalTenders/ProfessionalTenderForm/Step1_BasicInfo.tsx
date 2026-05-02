// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderForm/Step1_BasicInfo.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Step 1 (post-refactor):
//    • title, briefDescription, description
//    • procurementCategory  (1.1 — opens CategoryPickerScreen)
//    • tenderType, workflowType (with Sealed warning), visibilityType
//    • referenceNumber  (1.2 — has Generate button)
//    • invitedCompanies  (1.4 — opens CompanyInvitePickerScreen when invite-only)
//
//  P-01: workflowType is 'open' | 'closed' (never 'sealed').
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  AlertTriangle,
  Building2,
  Globe,
  Lock,
  ShieldCheck,
} from 'lucide-react-native';

import { useThemeStore } from '../../../store/themeStore';
import { useCompaniesByIds } from '../../../hooks/useProfessionalTender';
import {
  LabeledField,
  OptionGrid,
  SectionHeader,
  TextField,
} from './FormFields';
import {
  generateReferenceNumber,
  type ProfessionalTenderFormValues,
} from './formSchema';

// ═════════════════════════════════════════════════════════════════════════════
//  STATIC OPTIONS
// ═════════════════════════════════════════════════════════════════════════════

const TENDER_TYPE_OPTIONS = [
  { value: 'works' as const,        label: 'Works',        description: 'Construction, infrastructure' },
  { value: 'goods' as const,        label: 'Goods',        description: 'Equipment, supplies' },
  { value: 'services' as const,     label: 'Services',     description: 'Operational services' },
  { value: 'consultancy' as const,  label: 'Consultancy',  description: 'Advisory, expertise' },
];

// ═════════════════════════════════════════════════════════════════════════════
//  STEP COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const Step1_BasicInfo: React.FC = () => {
  const navigation = useNavigation<any>();
  const isDark = useThemeStore((s) => s.theme.isDark);
  const { control, formState: { errors }, getValues, setValue, watch } = useFormContext<ProfessionalTenderFormValues>();

  const palette = isDark
    ? {
        rowBg:        '#0F172A',
        rowBorder:    '#334155',
        rowText:      '#F1F5F9',
        rowMuted:     '#94A3B8',
        rowEmpty:     '#64748B',
        primary:      '#60A5FA',
        primaryFg:    '#0F172A',
        warningBg:    'rgba(168,85,247,0.12)',
        warningBd:    'rgba(168,85,247,0.40)',
        warningFg:    '#E9D5FF',
        warningMute:  '#C4B5FD',
        chipBg:       '#1E3A5F',
        chipFg:       '#93C5FD',
        errorFg:      '#F87171',
      }
    : {
        rowBg:        '#F8FAFC',
        rowBorder:    '#E2E8F0',
        rowText:      '#0F172A',
        rowMuted:     '#64748B',
        rowEmpty:     '#94A3B8',
        primary:      '#2563EB',
        primaryFg:    '#FFFFFF',
        warningBg:    '#F5F3FF',
        warningBd:    '#DDD6FE',
        warningFg:    '#5B21B6',
        warningMute:  '#7C3AED',
        chipBg:       '#DBEAFE',
        chipFg:       '#1D4ED8',
        errorFg:      '#DC2626',
      };

  const visibilityType = watch('visibilityType');
  const invitedIds: string[] = watch('invitedCompanies') ?? [];

  // Hydrate invited companies for chip display
  const { data: invitedProfiles = [] } = useCompaniesByIds(invitedIds, {
    enabled: invitedIds.length > 0,
  });

  // ─── Picker launchers ─────────────────────────────────────────────────────

  const openCategoryPicker = useCallback(() => {
    navigation.navigate('CategoryPicker', {
      current: getValues('procurementCategory'),
      onPick: (category: string) => {
        setValue('procurementCategory', category, { shouldValidate: true, shouldDirty: true });
      },
    });
  }, [navigation, getValues, setValue]);

  const openInviteePicker = useCallback(() => {
    navigation.navigate('CompanyInvitePicker', {
      selectedIds: getValues('invitedCompanies') ?? [],
      onPick: (ids: string[]) => {
        setValue('invitedCompanies', ids, { shouldValidate: true, shouldDirty: true });
      },
    });
  }, [navigation, getValues, setValue]);

  const handleGenerateRef = useCallback(() => {
    const next = generateReferenceNumber();
    setValue('referenceNumber', next, { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

  // ═══════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>
      {/* ─── Identity ───────────────────────────────────────────────────── */}
      <SectionHeader
        title="Identity"
        description="The information bidders will see first."
      />

      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <LabeledField
            label="Tender Title"
            required
            error={errors.title?.message}
            helper="Short, descriptive — what is being procured."
          >
            <TextField
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="e.g., IT Infrastructure Modernization"
              maxLength={200}
              error={!!errors.title}
            />
          </LabeledField>
        )}
      />

      <Controller
        control={control}
        name="briefDescription"
        render={({ field }) => (
          <LabeledField
            label="Brief Description"
            required
            error={errors.briefDescription?.message}
            helper="One sentence summary shown on tender cards (max 500 chars)."
          >
            <TextField
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="A concise summary of the procurement…"
              multiline
              numberOfLines={2}
              maxLength={500}
              error={!!errors.briefDescription}
            />
          </LabeledField>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <LabeledField
            label="Detailed Description"
            required
            error={errors.description?.message}
            helper="Background, objectives, expected outcomes, technical scope."
          >
            <TextField
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Provide a thorough description (min 50 chars)…"
              multiline
              numberOfLines={6}
              error={!!errors.description}
            />
          </LabeledField>
        )}
      />

      {/* ─── Category — tap-to-pick row (1.1) ───────────────────────────── */}
      <Controller
        control={control}
        name="procurementCategory"
        render={({ field }) => (
          <LabeledField
            label="Procurement Category"
            required
            error={errors.procurementCategory?.message}
            helper="Tap to search the catalog. Custom values allowed."
          >
            <Pressable
              onPress={openCategoryPicker}
              style={({ pressed }: { pressed: boolean }) => [
                styles.pickerRow,
                {
                  backgroundColor: palette.rowBg,
                  borderColor: errors.procurementCategory ? palette.errorFg : palette.rowBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Choose category"
            >
              <Ionicons name="pricetag-outline" size={16} color={palette.rowMuted} />
              <Text
                style={[
                  styles.pickerRowText,
                  { color: field.value ? palette.rowText : palette.rowEmpty },
                ]}
                numberOfLines={1}
              >
                {field.value || 'Choose a category…'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={palette.rowMuted} />
            </Pressable>
          </LabeledField>
        )}
      />

      {/* ─── Reference Number with Generator (1.2) ──────────────────────── */}
      <Controller
        control={control}
        name="referenceNumber"
        render={({ field }) => (
          <LabeledField
            label="Reference Number"
            helper="Optional preview. The backend may reassign sequentially on publish."
          >
            <View style={styles.refRow}>
              <View style={{ flex: 1 }}>
                <TextField
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="PT-2026-0001"
                  autoCapitalize="characters"
                />
              </View>
              <Pressable
                onPress={handleGenerateRef}
                style={[styles.generateBtn, { backgroundColor: palette.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Generate reference number"
              >
                <Ionicons name="refresh" size={14} color={palette.primaryFg} />
                <Text style={[styles.generateBtnText, { color: palette.primaryFg }]}>
                  Generate
                </Text>
              </Pressable>
            </View>
          </LabeledField>
        )}
      />

      {/* ─── Tender Type ────────────────────────────────────────────────── */}
      <SectionHeader title="Type" description="What category of procurement is this?" />

      <Controller
        control={control}
        name="tenderType"
        render={({ field }) => (
          <LabeledField required error={errors.tenderType?.message}>
            <OptionGrid
              value={field.value}
              onChange={field.onChange}
              options={TENDER_TYPE_OPTIONS}
              columns={2}
              showDescriptions
            />
          </LabeledField>
        )}
      />

      {/* ─── Workflow Type — P-01 critical ──────────────────────────────── */}
      <SectionHeader
        title="Bid Workflow"
        description="How bids will be received and evaluated."
      />

      <Controller
        control={control}
        name="workflowType"
        render={({ field }) => (
          <LabeledField required error={errors.workflowType?.message}>
            <OptionGrid
              value={field.value}
              onChange={field.onChange}
              options={[
                {
                  value: 'open',
                  label: 'Open',
                  description: 'Bids visible as submitted',
                  icon: <Globe size={18} color={field.value === 'open' ? '#FFFFFF' : '#0F766E'} strokeWidth={2.5} />,
                },
                {
                  value: 'closed',
                  label: 'Sealed',
                  description: 'Bids hidden until reveal',
                  icon: <Lock size={18} color={field.value === 'closed' ? '#FFFFFF' : '#6D28D9'} strokeWidth={2.5} />,
                },
              ]}
              columns={2}
              showDescriptions
            />
          </LabeledField>
        )}
      />

      <Controller
        control={control}
        name="workflowType"
        render={({ field }) => field.value === 'closed' ? (
          <View
            style={[
              styles.warningBanner,
              { backgroundColor: palette.warningBg, borderColor: palette.warningBd },
            ]}
          >
            <AlertTriangle size={18} color={palette.warningFg} strokeWidth={2.4} />
            <View style={styles.warningTextWrap}>
              <Text style={[styles.warningTitle, { color: palette.warningFg }]}>
                Sealed-bid workflow selected
              </Text>
              <Text style={[styles.warningDesc, { color: palette.warningMute }]}>
                Bids stay confidential until you manually reveal them after the deadline.
                Status will progress through{' '}
                <Text style={styles.warningStrong}>published → locked → deadline_reached → revealed</Text>.
                This is a legally significant process — choose carefully.
              </Text>
            </View>
          </View>
        ) : <View />}
      />

      {/* ─── Visibility ─────────────────────────────────────────────────── */}
      <SectionHeader
        title="Visibility"
        description="Who can see this tender."
      />

      <Controller
        control={control}
        name="visibilityType"
        render={({ field }) => (
          <LabeledField error={errors.visibilityType?.message}>
            <OptionGrid
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'public',      label: 'Public',      description: 'Visible to all bidders',
                  icon: <Building2 size={16} color={field.value === 'public' ? '#FFFFFF' : '#16A34A'} strokeWidth={2.5} /> },
                { value: 'invite_only', label: 'Invite Only', description: 'Only invited bidders',
                  icon: <ShieldCheck size={16} color={field.value === 'invite_only' ? '#FFFFFF' : '#B45309'} strokeWidth={2.5} /> },
              ]}
              columns={2}
              showDescriptions
            />
          </LabeledField>
        )}
      />

      {/* ─── Invitee Picker (1.4) — only when invite-only ──────────────── */}
      {visibilityType === 'invite_only' && (
        <LabeledField
          label="Invited Companies"
          required
          error={(errors as any).invitedCompanies?.message}
          helper="Tap to search and select companies."
        >
          <Pressable
            onPress={openInviteePicker}
            style={({ pressed }: { pressed: boolean }) => [
              styles.pickerRow,
              {
                backgroundColor: palette.rowBg,
                borderColor: (errors as any).invitedCompanies ? palette.errorFg : palette.rowBorder,
                opacity: pressed ? 0.85 : 1,
                minHeight: invitedIds.length > 0 ? 56 : 48,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Choose companies. ${invitedIds.length} currently selected.`}
          >
            <Ionicons name="people-outline" size={16} color={palette.rowMuted} />
            <View style={{ flex: 1, gap: 4 }}>
              {invitedIds.length === 0 ? (
                <Text style={[styles.pickerRowText, { color: palette.rowEmpty }]}>
                  Select companies to invite…
                </Text>
              ) : (
                <>
                  <Text style={[styles.pickerRowText, { color: palette.rowText, fontWeight: '700' }]}>
                    {invitedIds.length} compan{invitedIds.length === 1 ? 'y' : 'ies'} invited
                  </Text>
                  {invitedProfiles.length > 0 && (
                    <View style={styles.inviteeChips}>
                      {invitedProfiles.slice(0, 3).map((p) => (
                        <View key={p._id} style={[styles.inviteeChip, { backgroundColor: palette.chipBg }]}>
                          <Text
                            style={[styles.inviteeChipText, { color: palette.chipFg }]}
                            numberOfLines={1}
                          >
                            {p.name}
                          </Text>
                        </View>
                      ))}
                      {invitedProfiles.length > 3 && (
                        <View style={[styles.inviteeChip, { backgroundColor: palette.chipBg }]}>
                          <Text style={[styles.inviteeChipText, { color: palette.chipFg }]}>
                            +{invitedProfiles.length - 3}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={palette.rowMuted} />
          </Pressable>
        </LabeledField>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { gap: 18 },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 48,
  },
  pickerRowText: { flex: 1, fontSize: 14 },

  refRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  generateBtnText: { fontSize: 12, fontWeight: '700' },

  warningBanner: {
    flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start',
  },
  warningTextWrap: { flex: 1, gap: 4 },
  warningTitle:    { fontSize: 13, fontWeight: '700' },
  warningDesc:     { fontSize: 12, lineHeight: 17 },
  warningStrong:   { fontWeight: '700' },

  inviteeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  inviteeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    maxWidth: 140,
  },
  inviteeChipText: { fontSize: 10, fontWeight: '700' },
});

export default Step1_BasicInfo;