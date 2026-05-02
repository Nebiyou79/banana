// mobile/src/screens/freelancer/tenders/FreelancerTenderDetailScreen.tsx
//
// Apply button disable logic (per spec Section E.1):
//   1. tender.status !== 'published'
//   2. deadline has passed
//   3. freelancer hasApplied
//   4. application cap reached (maxApplications && totalApplications >= maxApplications)
// An inline reason is shown below the disabled button for all 4 cases.

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../../store/themeStore';
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

// ─── Apply disable helpers ────────────────────────────────────────────────────

interface ApplyState {
  disabled: boolean;
  reason: string | null;
}

function getApplyState(tender: {
  status: string;
  deadline: string;
  maxApplications?: number;
  metadata: { totalApplications: number };
  hasApplied?: boolean;
  acceptingApplications?: boolean;
}): ApplyState {
  if (tender.status !== 'published') {
    return { disabled: true, reason: `This tender is ${tender.status} — not accepting applications.` };
  }
  if (new Date(tender.deadline) <= new Date()) {
    return { disabled: true, reason: 'The application deadline has passed.' };
  }
  if (tender.hasApplied) {
    return { disabled: true, reason: "You've already applied to this tender." };
  }
  if (
    tender.maxApplications != null &&
    tender.metadata.totalApplications >= tender.maxApplications
  ) {
    return { disabled: true, reason: 'This tender has reached its maximum number of applications.' };
  }
  return { disabled: false, reason: null };
}

// ─── Application form (inline bottom sheet alternative) ───────────────────────

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
  hasScreeningQuestions: boolean;
  questionCount: number;
}

const ApplyForm: React.FC<ApplyFormProps> = ({
  tenderId,
  onSuccess,
  onCancel,
  primaryColor,
  textColor,
  mutedColor,
  surfaceColor,
  borderColor,
  errorColor,
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
    submitMutation.mutate(
      { tenderId, data },
      { onSuccess }
    );
  };

  const inputStyle = [
    formStyles.input,
    { backgroundColor: surfaceColor, borderColor, color: textColor },
  ];

  return (
    <View style={[formStyles.container, { backgroundColor: surfaceColor, borderColor }]}>
      <Text style={[formStyles.formTitle, { color: textColor }]}>Apply for This Tender</Text>

      {/* Cover letter */}
      <View style={formStyles.field}>
        <Text style={[formStyles.label, { color: textColor }]}>
          Cover Letter <Text style={{ color: errorColor }}>*</Text>
        </Text>
        <TextInput
          style={[inputStyle, formStyles.coverInput]}
          value={coverLetter}
          onChangeText={setCoverLetter}
          placeholder="Describe your relevant experience and why you're a great fit…"
          placeholderTextColor={mutedColor}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={5000}
        />
        <Text style={[formStyles.hint, { color: mutedColor }]}>
          {coverLetter.length}/5000
        </Text>
        {errors.coverLetter ? (
          <Text style={[formStyles.error, { color: errorColor }]}>{errors.coverLetter}</Text>
        ) : null}
      </View>

      {/* Proposed rate */}
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
            placeholderTextColor={mutedColor}
            keyboardType="numeric"
          />
          {/* Currency selector */}
          {(['ETB', 'USD', 'EUR', 'GBP'] as const).map((cur) => (
            <TouchableOpacity
              key={cur}
              onPress={() => setCurrency(cur)}
              style={[
                formStyles.currencyBtn,
                {
                  backgroundColor: currency === cur ? primaryColor : surfaceColor,
                  borderColor: currency === cur ? primaryColor : borderColor,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text style={{ color: currency === cur ? '#fff' : mutedColor, fontSize: 11, fontWeight: '700' }}>
                {cur}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.proposedRate ? (
          <Text style={[formStyles.error, { color: errorColor }]}>{errors.proposedRate}</Text>
        ) : null}
      </View>

      {/* Actions */}
      <View style={formStyles.actions}>
        <TouchableOpacity
          onPress={onCancel}
          style={[formStyles.cancelBtn, { borderColor: mutedColor + '55' }]}
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
          {submitMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={formStyles.submitText}>Submit Application</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const FreelancerTenderDetailScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const c = theme.colors;
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
      <SafeAreaView style={[styles.root, { backgroundColor: c.background ?? c.card }]} edges={['top']}>
        <ActivityIndicator color={c.primary} style={{ flex: 1 }} />
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

  const ownerEntity =
    typeof tender.ownerEntity === 'object' ? tender.ownerEntity : null;
  const ownerName = ownerEntity?.name ?? (typeof tender.owner === 'object' ? tender.owner.name : 'Unknown');

  const screeningQCount = tender.details.screeningQuestions?.length ?? 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background ?? c.card }]} edges={['top']}>
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: c.border ?? c.textMuted + '22' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backBtnText, { color: c.primary }]}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleToggleSave}
          disabled={saveMutation.isPending}
          style={styles.saveBtn}
          accessibilityRole="button"
          accessibilityLabel={tender.isSaved ? 'Unsave tender' : 'Save tender'}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color={c.primary} />
          ) : (
            <Text style={[styles.saveBtnText, { color: tender.isSaved ? c.primary : c.textMuted }]}>
              {tender.isSaved ? '🔖 Saved' : '🔖 Save'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Status */}
          <View style={styles.badgeRow}>
            <FreelanceTenderStatusBadge status={tender.status} />
            {tender.details.urgency === 'urgent' && (
              <View style={[styles.urgentBadge, { backgroundColor: '#EF4444' + '18' }]}>
                <Text style={[styles.urgentText, { color: '#EF4444' }]}>⚡ Urgent</Text>
              </View>
            )}
          </View>

          {/* Title + owner */}
          <Text style={[styles.title, { color: c.text }]}>{tender.title}</Text>
          <Text style={[styles.ownerName, { color: c.textMuted }]}>
            Posted by {ownerName}
          </Text>

          {/* Category */}
          <Text style={[styles.category, { color: c.textMuted }]}>
            {tender.procurementCategory}
          </Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <FreelanceTenderBudgetTag details={tender.details} />
            <FreelanceTenderDeadlineTimer deadline={tender.deadline} />
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: c.surface ?? c.card, borderColor: c.border ?? c.textMuted + '33' }]}>
            <StatPill label="Views" value={String(tender.metadata?.views ?? 0)} color={c.textMuted} />
            <StatPill label="Applied" value={String(tender.metadata?.totalApplications ?? 0)} color={c.textMuted} />
            {tender.maxApplications != null && (
              <StatPill label="Max" value={String(tender.maxApplications)} color={c.textMuted} />
            )}
          </View>

          {/* ── APPLY BUTTON SECTION ─────────────────────────────────────────
              Role guard: only rendered for freelancer role — the detail screen
              itself is only navigable from FreelancerNavigator.
              Disable conditions: status, deadline, hasApplied, cap.            */}
          {!showApplyForm && (
            <View style={styles.applySection}>
              <TouchableOpacity
                onPress={() => setShowApplyForm(true)}
                disabled={applyState.disabled}
                style={[
                  styles.applyBtn,
                  {
                    backgroundColor: applyState.disabled ? c.textMuted + '33' : c.primary,
                  },
                ]}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ disabled: applyState.disabled }}
                accessibilityLabel={applyState.disabled ? `Cannot apply: ${applyState.reason}` : 'Apply for this tender'}
              >
                <Text
                  style={[
                    styles.applyBtnText,
                    { color: applyState.disabled ? c.textMuted : '#fff' },
                  ]}
                >
                  {tender.hasApplied ? '✓ Applied' : 'Apply Now'}
                </Text>
              </TouchableOpacity>

              {/* Inline reason shown below disabled button */}
              {applyState.reason && (
                <Text style={[styles.applyDisabledReason, { color: c.textMuted }]}>
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
              primaryColor={c.primary}
              textColor={c.text}
              mutedColor={c.textMuted}
              surfaceColor={c.surface ?? c.card}
              borderColor={c.border ?? c.textMuted + '44'}
              errorColor={c.error ?? '#EF4444'}
              hasScreeningQuestions={screeningQCount > 0}
              questionCount={screeningQCount}
            />
          )}

          {/* Skills */}
          {tender.skillsRequired.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Required Skills</Text>
              <FreelanceTenderSkillTags skills={tender.skillsRequired} />
            </View>
          )}

          {/* Brief */}
          {tender.briefDescription ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Summary</Text>
              <Text style={[styles.body, { color: c.text }]}>{tender.briefDescription}</Text>
            </View>
          ) : null}

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Full Description</Text>
            <Text style={[styles.body, { color: c.text }]}>
              {tender.description.replace(/<[^>]+>/g, ' ').trim()}
            </Text>
          </View>

          {/* Project details */}
          <View style={[styles.detailsCard, { backgroundColor: c.surface ?? c.card, borderColor: c.border ?? c.textMuted + '33' }]}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Project Details</Text>
            <DetailRow label="Type" value={tender.details.projectType.replace(/_/g, ' ')} textColor={c.text} mutedColor={c.textMuted} />
            <DetailRow label="Location" value={tender.details.locationType.replace(/_/g, ' ')} textColor={c.text} mutedColor={c.textMuted} />
            <DetailRow label="Experience" value={tender.details.experienceLevel} textColor={c.text} mutedColor={c.textMuted} />
            <DetailRow label="Positions" value={String(tender.details.numberOfPositions ?? 1)} textColor={c.text} mutedColor={c.textMuted} />
            {tender.details.estimatedTimeline && (
              <DetailRow
                label="Timeline"
                value={`${tender.details.estimatedTimeline.value} ${tender.details.estimatedTimeline.unit}`}
                textColor={c.text}
                mutedColor={c.textMuted}
              />
            )}
            {tender.details.weeklyHours != null && (
              <DetailRow label="Weekly hrs" value={`${tender.details.weeklyHours} hrs/wk`} textColor={c.text} mutedColor={c.textMuted} />
            )}
            {tender.details.languagePreference && (
              <DetailRow label="Language" value={tender.details.languagePreference} textColor={c.text} mutedColor={c.textMuted} />
            )}
            {tender.details.ndaRequired && (
              <DetailRow label="NDA" value="Required" textColor={c.text} mutedColor={c.textMuted} />
            )}
            {tender.details.portfolioRequired && (
              <DetailRow label="Portfolio" value="Required" textColor={c.text} mutedColor={c.textMuted} />
            )}
          </View>

          {/* Screening questions */}
          {screeningQCount > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>
                Screening Questions ({screeningQCount})
              </Text>
              {tender.details.screeningQuestions!.map((q, i) => (
                <View
                  key={i}
                  style={[styles.questionItem, { backgroundColor: c.surface ?? c.card, borderColor: c.border ?? c.textMuted + '33' }]}
                >
                  <Text style={[styles.questionNum, { color: c.textMuted }]}>Q{i + 1}</Text>
                  <Text style={[styles.questionText, { color: c.text }]}>
                    {q.question}
                    {q.required && (
                      <Text style={{ color: c.error ?? '#EF4444' }}> *</Text>
                    )}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Attachments */}
          {tender.attachments.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>
                Attachments ({tender.attachments.length})
              </Text>
              {tender.attachments.map((att) => (
                <View
                  key={att._id}
                  style={[styles.attachItem, { backgroundColor: c.surface ?? c.card, borderColor: c.border ?? c.textMuted + '33' }]}
                >
                  <Text style={[styles.attachName, { color: c.text }]} numberOfLines={1}>
                    📎 {att.originalName}
                  </Text>
                  <Text style={[styles.attachMeta, { color: c.textMuted }]}>
                    {att.mimetype.split('/')[1]?.toUpperCase() ?? 'FILE'}
                    {att.size ? ` · ${(att.size / (1024 * 1024)).toFixed(1)} MB` : ''}
                  </Text>
                </View>
              ))}
              <Text style={[styles.downloadNote, { color: c.textMuted }]}>
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

// ─── Apply form styles ────────────────────────────────────────────────────────

const formStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  formTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 50 },
  coverInput: { minHeight: 130, paddingTop: 12, textAlignVertical: 'top' },
  hint: { fontSize: 11, marginTop: 4 },
  error: { fontSize: 12, marginTop: 4 },
  rateRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  currencyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600' },
  submitBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minHeight: 44, justifyContent: 'center', paddingRight: 12 },
  backBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { minHeight: 44, minWidth: 80, alignItems: 'flex-end', justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '600' },
  content: { padding: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  urgentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  urgentText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 6 },
  ownerName: { fontSize: 13, marginBottom: 4 },
  category: { fontSize: 13, marginBottom: 14 },
  metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  statsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
    gap: 4,
  },
  statPill: { flex: 1, alignItems: 'center' },
  statPillValue: { fontSize: 16, fontWeight: '800' },
  statPillLabel: { fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  applySection: { marginBottom: 20 },
  applyBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { fontSize: 16, fontWeight: '700' },
  applyDisabledReason: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 17,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  body: { fontSize: 15, lineHeight: 24 },
  detailsCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 20 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600' },
  questionItem: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  questionNum: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', paddingTop: 2, minWidth: 24 },
  questionText: { flex: 1, fontSize: 14, lineHeight: 20 },
  attachItem: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  attachName: { fontSize: 14, fontWeight: '600' },
  attachMeta: { fontSize: 11, marginTop: 2 },
  downloadNote: { fontSize: 11, marginTop: 4, fontStyle: 'italic' },
});

export default FreelancerTenderDetailScreen;