// src/components/professionalTenders/ProfessionalTenderForm/Step1_BasicInfo.tsx
// FULLY REFACTORED: Uses theme via FormFields primitives, clean premium UI

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AlertTriangle, Building2, Globe, Lock, ShieldCheck } from 'lucide-react-native';

import { useTheme } from '../../../hooks/useTheme';
import { useCompaniesByIds } from '../../../hooks/useProfessionalTender';
import {
  LabeledField,
  OptionGrid,
  PremiumCard,
  SectionHeader,
  TextField,
} from './FormFields';
import {
  generateReferenceNumber,
  type ProfessionalTenderFormValues,
} from './formSchema';

const TENDER_TYPE_OPTIONS = [
  { value: 'works' as const, label: 'Works', description: 'Construction, infrastructure' },
  { value: 'goods' as const, label: 'Goods', description: 'Equipment, supplies' },
  { value: 'services' as const, label: 'Services', description: 'Operational services' },
  { value: 'consultancy' as const, label: 'Consultancy', description: 'Advisory, expertise' },
];

const Step1_BasicInfo: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, spacing, radius } = useTheme();
  const { control, formState: { errors }, getValues, setValue, watch } = 
    useFormContext<ProfessionalTenderFormValues>();

  const visibilityType = watch('visibilityType');
  const invitedIds: string[] = watch('invitedCompanies') ?? [];

  const { data: invitedProfiles = [] } = useCompaniesByIds(invitedIds, {
    enabled: invitedIds.length > 0,
  });

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

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Identity */}
      <SectionHeader title="Identity" description="The information bidders will see first." />

      <PremiumCard>
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

        <View style={{ height: spacing.md }} />

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

        <View style={{ height: spacing.md }} />

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
      </PremiumCard>

      {/* Category */}
      <PremiumCard>
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
                style={[
                  styles.pickerRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: errors.procurementCategory ? colors.danger : colors.border,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    minHeight: 48,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Choose category"
              >
                <Ionicons name="pricetag-outline" size={16} color={colors.textMuted} />
                <Text
                  style={[
                    styles.pickerRowText,
                    {
                      color: field.value ? colors.text : colors.textMuted,
                      flex: 1,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {field.value || 'Choose a category…'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            </LabeledField>
          )}
        />
      </PremiumCard>

      {/* Reference Number */}
      <PremiumCard>
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
                  style={[
                    styles.generateBtn,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radius.md,
                      paddingHorizontal: spacing.lg,
                      minHeight: 44,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Generate reference number"
                >
                  <Ionicons name="refresh" size={14} color="#FFFFFF" />
                  <Text style={[styles.generateBtnText, { color: '#FFFFFF' }]}>
                    Generate
                  </Text>
                </Pressable>
              </View>
            </LabeledField>
          )}
        />
      </PremiumCard>

      {/* Tender Type */}
      <SectionHeader title="Type" description="What category of procurement is this?" />

      <PremiumCard>
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
      </PremiumCard>

      {/* Workflow Type */}
      <SectionHeader title="Bid Workflow" description="How bids will be received and evaluated." />

      <PremiumCard>
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
                    icon: (
                      <Globe
                        size={18}
                        color={field.value === 'open' ? '#FFFFFF' : colors.primary}
                        strokeWidth={2.5}
                      />
                    ),
                  },
                  {
                    value: 'closed',
                    label: 'Sealed',
                    description: 'Bids hidden until reveal',
                    icon: (
                      <Lock
                        size={18}
                        color={field.value === 'closed' ? '#FFFFFF' : colors.textMuted}
                        strokeWidth={2.5}
                      />
                    ),
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
  render={({ field }) => (
    <View>
      {field.value === 'closed' ? (
        <View
          style={[
            styles.warningBanner,
            {
              backgroundColor: `${colors.warning}12`,
              borderColor: `${colors.warning}30`,
              borderRadius: radius.md,
              padding: spacing.md,
              marginTop: spacing.md,
            },
          ]}
        >
          <AlertTriangle size={18} color={colors.warning} strokeWidth={2.4} />
          <View style={styles.warningTextWrap}>
            <Text style={[styles.warningTitle, { color: colors.warning }]}>
              Sealed-bid workflow selected
            </Text>
            <Text style={[styles.warningDesc, { color: colors.textSecondary }]}>
              Bids stay confidential until you manually reveal them after the deadline.
              Status will progress through{' '}
              <Text style={styles.warningStrong}>
                published → locked → deadline_reached → revealed
              </Text>
              . This is a legally significant process — choose carefully.
            </Text>
          </View>
        </View>
      ) : (
        <View />
      )}
    </View>
  )}
/>
      </PremiumCard>

      {/* Visibility */}
      <SectionHeader title="Visibility" description="Who can see this tender." />

      <PremiumCard>
        <Controller
          control={control}
          name="visibilityType"
          render={({ field }) => (
            <LabeledField error={errors.visibilityType?.message}>
              <OptionGrid
                value={field.value}
                onChange={field.onChange}
                options={[
                  {
                    value: 'public',
                    label: 'Public',
                    description: 'Visible to all bidders',
                    icon: (
                      <Building2
                        size={16}
                        color={field.value === 'public' ? '#FFFFFF' : colors.textMuted}
                        strokeWidth={2.5}
                      />
                    ),
                  },
                  {
                    value: 'invite_only',
                    label: 'Invite Only',
                    description: 'Only invited bidders',
                    icon: (
                      <ShieldCheck
                        size={16}
                        color={field.value === 'invite_only' ? '#FFFFFF' : colors.textMuted}
                        strokeWidth={2.5}
                      />
                    ),
                  },
                ]}
                columns={2}
                showDescriptions
              />
            </LabeledField>
          )}
        />
      </PremiumCard>

      {/* Invitee Picker */}
      {visibilityType === 'invite_only' && (
        <PremiumCard>
          <LabeledField
            label="Invited Companies"
            required
            error={(errors as any).invitedCompanies?.message}
            helper="Tap to search and select companies."
          >
            <Pressable
              onPress={openInviteePicker}
              style={[
                styles.pickerRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: (errors as any).invitedCompanies ? colors.danger : colors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  minHeight: invitedIds.length > 0 ? 56 : 48,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Choose companies. ${invitedIds.length} currently selected.`}
            >
              <Ionicons name="people-outline" size={16} color={colors.textMuted} />
              <View style={{ flex: 1, gap: 4 }}>
                {invitedIds.length === 0 ? (
                  <Text style={[styles.pickerRowText, { color: colors.textMuted }]}>
                    Select companies to invite…
                  </Text>
                ) : (
                  <>
                    <Text style={[styles.pickerRowText, { color: colors.text, fontWeight: '700' }]}>
                      {invitedIds.length} compan{invitedIds.length === 1 ? 'y' : 'ies'} invited
                    </Text>
                    {invitedProfiles.length > 0 && (
                      <View style={styles.inviteeChips}>
                        {invitedProfiles.slice(0, 3).map((p) => (
                          <View
                            key={p._id}
                            style={[
                              styles.inviteeChip,
                              {
                                backgroundColor: `${colors.primary}15`,
                                borderRadius: radius.full,
                              },
                            ]}
                          >
                            <Text
                              style={[styles.inviteeChipText, { color: colors.primary }]}
                              numberOfLines={1}
                            >
                              {p.name}
                            </Text>
                          </View>
                        ))}
                        {invitedProfiles.length > 3 && (
                          <View
                            style={[
                              styles.inviteeChip,
                              {
                                backgroundColor: `${colors.primary}15`,
                                borderRadius: radius.full,
                              },
                            ]}
                          >
                            <Text style={[styles.inviteeChipText, { color: colors.primary }]}>
                              +{invitedProfiles.length - 3}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </LabeledField>
        </PremiumCard>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  pickerRowText: { fontSize: 14 },
  refRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  generateBtnText: { fontSize: 12, fontWeight: '700' },
  warningBanner: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  warningTextWrap: { flex: 1, gap: 4 },
  warningTitle: { fontSize: 13, fontWeight: '700' },
  warningDesc: { fontSize: 12, lineHeight: 17 },
  warningStrong: { fontWeight: '700' },
  inviteeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  inviteeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    maxWidth: 140,
  },
  inviteeChipText: { fontSize: 10, fontWeight: '700' },
});

export default Step1_BasicInfo;