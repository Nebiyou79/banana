// screens/freelancer/tenders/FreelancerTenderDetailScreen.tsx

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import { FONT_SIZE } from '../../../theme/tokens';
import {
  useFreelanceTender,
  useSaveUnsaveTender,
  useSubmitApplication,
} from '../../../hooks/useFreelanceTender';
import type { SubmitApplicationData } from '../../../types/freelanceTender';
import FreelanceTenderStatusBadge from '../../../components/freelanceTenders/FreelanceTenderStatusBadge';
import FreelanceTenderBudgetTag from '../../../components/freelanceTenders/FreelanceTenderBudgetTag';
import FreelanceTenderDeadlineTimer from '../../../components/freelanceTenders/FreelanceTenderDeadlineTimer';
import FreelanceTenderSkillTags from '../../../components/freelanceTenders/FreelanceTenderSkillTags';

type RouteParams = { tenderId: string };

interface ApplyState { disabled: boolean; reason: string | null; }

function getApplyState(tender: {
  status: string; deadline: string; maxApplications?: number;
  metadata: { totalApplications: number }; hasApplied?: boolean; acceptingApplications?: boolean;
}): ApplyState {
  if (tender.status !== 'published')
    return { disabled: true, reason: `This tender is ${tender.status} — not accepting applications.` };
  if (new Date(tender.deadline) <= new Date())
    return { disabled: true, reason: 'The application deadline has passed.' };
  if (tender.hasApplied)
    return { disabled: true, reason: "You've already applied to this tender." };
  if (tender.maxApplications != null && tender.metadata.totalApplications >= tender.maxApplications)
    return { disabled: true, reason: 'This tender has reached its maximum number of applications.' };
  return { disabled: false, reason: null };
}

// ─── Apply form ───────────────────────────────────────────────────────────────

interface ApplyFormProps {
  tenderId: string;
  onSuccess: () => void;
  onCancel: () => void;
  primaryColor: string;
  textColor: string;
  mutedColor: string;
  surfaceColor: string;
  borderColor: string;
  errorColor: string;
  inputBg: string;
  inputPlaceholder: string;
}

const ApplyForm: React.FC<ApplyFormProps> = ({
  tenderId, onSuccess, onCancel,
  primaryColor, textColor, mutedColor, surfaceColor, borderColor, errorColor, inputBg, inputPlaceholder,
}) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [currency, setCurrency] = useState<'ETB' | 'USD' | 'EUR' | 'GBP'>('ETB');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitMutation = useSubmitApplication();

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (coverLetter.trim().length < 50)
      errs.coverLetter = 'Cover letter must be at least 50 characters.';
    if (!proposedRate || isNaN(Number(proposedRate)) || Number(proposedRate) <= 0)
      errs.proposedRate = 'Enter a valid proposed rate.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const data: SubmitApplicationData = {
      coverLetter: coverLetter.trim(),
      proposedRate: Number(proposedRate),
      proposedRateCurrency: currency,
    };
    submitMutation.mutate({ tenderId, data }, { onSuccess });
  };

  const inputStyle = [formStyles.input, { backgroundColor: inputBg, borderColor, color: textColor }];

  return (
    <View style={[formStyles.container, { backgroundColor: surfaceColor, borderColor }]}>
      <Text style={[formStyles.formTitle, { color: textColor }]}>Apply for This Tender</Text>

      <View style={formStyles.field}>
        <Text style={[formStyles.label, { color: textColor }]}>
          Cover Letter <Text style={{ color: errorColor }}>*</Text>
        </Text>
        <TextInput
          style={[inputStyle, formStyles.coverInput]}
          value={coverLetter}
          onChangeText={setCoverLetter}
          placeholder="Describe your relevant experience and why you're a great fit…"
          placeholderTextColor={inputPlaceholder}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={5000}
        />
        <Text style={[formStyles.hint, { color: mutedColor }]}>{coverLetter.length}/5000</Text>
        {errors.coverLetter ? <Text style={[formStyles.error, { color: errorColor }]}>{errors.coverLetter}</Text> : null}
      </View>

      <View style={formStyles.field}>
        <Text style={[formStyles.label, { color: textColor }]}>
          Proposed Rate <Text style={{ color: errorColor }}>*</Text>
        </Text>
        <View style={formStyles.rateRow}>
          <TextInput
            style={[inputStyle, { flex: 1 }]}
            value={proposedRate}
            onChangeText={setProposedRate}
            placeholder="0"
            placeholderTextColor={inputPlaceholder}
            keyboardType="numeric"
          />
          {(['ETB', 'USD', 'EUR', 'GBP'] as const).map(cur => (
            <TouchableOpacity
              key={cur}
              onPress={() => setCurrency(cur)}
              style={[formStyles.currencyBtn, {
                backgroundColor: currency === cur ? primaryColor : surfaceColor,
                borderColor: currency === cur ? primaryColor : borderColor,
              }]}
              activeOpacity={0.75}
            >
              <Text style={{ color: currency === cur ? '#fff' : mutedColor, fontSize: 11, fontWeight: '700' }}>
                {cur}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.proposedRate ? <Text style={[formStyles.error, { color: errorColor }]}>{errors.proposedRate}</Text> : null}
      </View>

      <View style={formStyles.actions}>
        <TouchableOpacity
          onPress={onCancel}
          style={[formStyles.cancelBtn, { borderColor: withAlpha(mutedColor, 0.33) }]}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <Text style={[formStyles.cancelText, { color: mutedColor }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitMutation.isPending}
          style={[formStyles.submitBtn, { backgroundColor: primaryColor, opacity: submitMutation.isPending ? 0.7 : 1 }]}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          {submitMutation.isPending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={formStyles.submitText}>Submit Application</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatPill: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <View style={styles.statPill}>
    <Text style={[styles.statPillValue, { color }]}>{value}</Text>
    <Text style={[styles.statPillLabel, { color }]}>{label}</Text>
  </View>
);

const DetailRow: React.FC<{ label: string; value: string; textColor: string; mutedColor: string }> = ({
  label, value, textColor, mutedColor,
}) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, { color: mutedColor }]}>{label}</Text>
    <Text style={[styles.detailValue, { color: textColor }]}>{value}</Text>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const FreelancerTenderDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ FreelancerTenderDetail: RouteParams }, 'FreelancerTenderDetail'>>();
  const { tenderId } = route.params;

  const [showApplyForm, setShowApplyForm] = useState(false);

  const { data: tender, isLoading, refetch, isRefetching } = useFreelanceTender(tenderId);
  const saveMutation = useSaveUnsaveTender();

  const handleApplySuccess = useCallback(() => {
    setShowApplyForm(false);
    Alert.alert('Application Submitted', 'Your application has been submitted successfully!');
    refetch();
  }, [refetch]);

  const handleToggleSave = useCallback(() => {
    saveMutation.mutate(tenderId);
  }, [saveMutation, tenderId]);

  if (isLoading || !tender) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const applyState = getApplyState({
    status: tender.status,
    deadline: tender.deadline,
    maxApplications: tender.maxApplications,
    metadata: tender.metadata,
    hasApplied: tender.hasApplied,
    acceptingApplications: tender.acceptingApplications,
  });

  const ownerEntity = typeof tender.ownerEntity === 'object' ? tender.ownerEntity : null;
  const ownerName = ownerEntity?.name ?? (typeof tender.owner === 'object' ? tender.owner.name : 'Unknown');
  const screeningQCount = tender.details.screeningQuestions?.length ?? 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleToggleSave}
          disabled={saveMutation.isPending}
          style={styles.saveBtn}
          accessibilityRole="button"
          accessibilityLabel={tender.isSaved ? 'Unsave tender' : 'Save tender'}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name={tender.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={tender.isSaved ? colors.primary : colors.textMuted}
            />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Status */}
          <View style={styles.badgeRow}>
            <FreelanceTenderStatusBadge status={tender.status} />
            {tender.details.urgency === 'urgent' && (
              <View style={[styles.urgentBadge, { backgroundColor: withAlpha(colors.danger, 0.10) }]}>
                <Ionicons name="flash-outline" size={11} color={colors.danger} />
                <Text style={[styles.urgentText, { color: colors.danger }]}>Urgent</Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{tender.title}</Text>
          <Text style={[styles.ownerName, { color: colors.textMuted }]}>Posted by {ownerName}</Text>
          <Text style={[styles.category, { color: colors.textMuted }]}>{tender.procurementCategory}</Text>

          <View style={styles.metaRow}>
            <FreelanceTenderBudgetTag details={tender.details} />
            <FreelanceTenderDeadlineTimer deadline={tender.deadline} />
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <StatPill label="Views"   value={String(tender.metadata?.views ?? 0)}               color={colors.textMuted} />
            <StatPill label="Applied" value={String(tender.metadata?.totalApplications ?? 0)}   color={colors.textMuted} />
            {tender.maxApplications != null && (
              <StatPill label="Max"   value={String(tender.maxApplications)}                     color={colors.textMuted} />
            )}
          </View>

          {/* Apply button */}
          {!showApplyForm && (
            <View style={styles.applySection}>
              <TouchableOpacity
                onPress={() => setShowApplyForm(true)}
                disabled={applyState.disabled}
                style={[styles.applyBtn, {
                  backgroundColor: applyState.disabled ? withAlpha(colors.textMuted, 0.20) : colors.primary,
                }]}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ disabled: applyState.disabled }}
              >
                {tender.hasApplied ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={applyState.disabled ? colors.textMuted : '#fff'} />
                    <Text style={[styles.applyBtnText, { color: applyState.disabled ? colors.textMuted : '#fff' }]}>Applied</Text>
                  </View>
                ) : (
                  <Text style={[styles.applyBtnText, { color: applyState.disabled ? colors.textMuted : '#fff' }]}>Apply Now</Text>
                )}
              </TouchableOpacity>
              {applyState.reason && (
                <Text style={[styles.applyDisabledReason, { color: colors.textMuted }]}>
                  {applyState.reason}
                </Text>
              )}
            </View>
          )}

          {/* Inline apply form */}
          {showApplyForm && (
            <ApplyForm
              tenderId={tenderId}
              onSuccess={handleApplySuccess}
              onCancel={() => setShowApplyForm(false)}
              primaryColor={colors.primary}
              textColor={colors.text}
              mutedColor={colors.textMuted}
              surfaceColor={colors.bgCard}
              borderColor={colors.border}
              errorColor={colors.danger}
              inputBg={colors.inputBg}
              inputPlaceholder={colors.inputPlaceholder}
            />
          )}

          {/* Skills */}
          {tender.skillsRequired.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Skills</Text>
              <FreelanceTenderSkillTags skills={tender.skillsRequired} />
            </View>
          )}

          {/* Brief */}
          {tender.briefDescription ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
              <Text style={[styles.body, { color: colors.text }]}>{tender.briefDescription}</Text>
            </View>
          ) : null}

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Full Description</Text>
            <Text style={[styles.body, { color: colors.text }]}>
              {tender.description.replace(/<[^>]+>/g, ' ').trim()}
            </Text>
          </View>

          {/* Project details */}
          <View style={[styles.detailsCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Details</Text>
            <DetailRow label="Type"       value={tender.details.projectType.replace(/_/g, ' ')}    textColor={colors.text} mutedColor={colors.textMuted} />
            <DetailRow label="Location"   value={tender.details.locationType.replace(/_/g, ' ')}   textColor={colors.text} mutedColor={colors.textMuted} />
            <DetailRow label="Experience" value={tender.details.experienceLevel}                    textColor={colors.text} mutedColor={colors.textMuted} />
            <DetailRow label="Positions"  value={String(tender.details.numberOfPositions ?? 1)}    textColor={colors.text} mutedColor={colors.textMuted} />
            {tender.details.estimatedTimeline && (
              <DetailRow
                label="Timeline"
                value={`${tender.details.estimatedTimeline.value} ${tender.details.estimatedTimeline.unit}`}
                textColor={colors.text} mutedColor={colors.textMuted}
              />
            )}
            {tender.details.weeklyHours != null && (
              <DetailRow label="Weekly hrs" value={`${tender.details.weeklyHours} hrs/wk`} textColor={colors.text} mutedColor={colors.textMuted} />
            )}
            {tender.details.languagePreference && (
              <DetailRow label="Language" value={tender.details.languagePreference} textColor={colors.text} mutedColor={colors.textMuted} />
            )}
            {tender.details.ndaRequired && (
              <DetailRow label="NDA" value="Required" textColor={colors.text} mutedColor={colors.textMuted} />
            )}
            {tender.details.portfolioRequired && (
              <DetailRow label="Portfolio" value="Required" textColor={colors.text} mutedColor={colors.textMuted} />
            )}
          </View>

          {/* Screening questions */}
          {screeningQCount > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Screening Questions ({screeningQCount})
              </Text>
              {tender.details.screeningQuestions!.map((q, i) => (
                <View
                  key={i}
                  style={[styles.questionItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                >
                  <Text style={[styles.questionNum, { color: colors.textMuted }]}>Q{i + 1}</Text>
                  <Text style={[styles.questionText, { color: colors.text }]}>
                    {q.question}
                    {q.required && <Text style={{ color: colors.danger }}> *</Text>}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Attachments */}
          {tender.attachments.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Attachments ({tender.attachments.length})
              </Text>
              {tender.attachments.map(att => (
                <View
                  key={att._id}
                  style={[styles.attachItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                >
                  <Ionicons name="attach-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.attachName, { color: colors.text }]} numberOfLines={1}>
                    {att.originalName}
                  </Text>
                  <Text style={[styles.attachMeta, { color: colors.textMuted }]}>
                    {att.mimetype.split('/')[1]?.toUpperCase() ?? 'FILE'}
                    {att.size ? ` · ${(att.size / (1024 * 1024)).toFixed(1)} MB` : ''}
                  </Text>
                </View>
              ))}
              <Text style={[styles.downloadNote, { color: colors.textMuted }]}>
                Download attachments via the web app.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const formStyles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20 },
  formTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 50 },
  coverInput: { minHeight: 130, paddingTop: 12, textAlignVertical: 'top' },
  hint: { fontSize: 11, marginTop: 4 },
  error: { fontSize: 12, marginTop: 4 },
  rateRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  currencyBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, minHeight: 44, justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  submitBtn: { flex: 2, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minHeight: 44, justifyContent: 'center', paddingRight: 12 },
  saveBtn: { minHeight: 44, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
  content: { padding: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  urgentText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 6 },
  ownerName: { fontSize: 14, marginBottom: 4 },
  category: { fontSize: 13, marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  statsRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  statPill: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statPillValue: { fontSize: 18, fontWeight: '800' },
  statPillLabel: { fontSize: 11, marginTop: 2 },
  applySection: { marginBottom: 20, gap: 8 },
  applyBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { fontSize: 16, fontWeight: '700' },
  applyDisabledReason: { fontSize: 12, textAlign: 'center', paddingHorizontal: 8 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 22 },
  detailsCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 20, gap: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize', flex: 1, textAlign: 'right' },
  questionItem: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  questionNum: { fontSize: 11, fontWeight: '700', width: 20 },
  questionText: { flex: 1, fontSize: 13, lineHeight: 20 },
  attachItem: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  attachName: { flex: 1, fontSize: 13 },
  attachMeta: { fontSize: 11 },
  downloadNote: { fontSize: 11, marginTop: 4, fontStyle: 'italic' },
});

export default FreelancerTenderDetailScreen;