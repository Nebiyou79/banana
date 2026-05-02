// src/screens/freelancer/proposals/ProposalDetailScreen.tsx
// Banana Mobile App — Module 6B: Proposals
// Freelancer's own proposal detail view — cover letter, bid, milestones,
// attachments, status timeline, withdraw button.

import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../../store/themeStore';
import {
  useProposalDetail,
  useWithdrawProposal,
} from '../../../hooks/useProposal';
import { ProposalStatusBadge } from '../../../components/proposals/ProposalStatusBadge';
import { ProposalBudgetDisplay } from '../../../components/proposals/ProposalBudgetDisplay';
import { ProposalMilestoneList } from '../../../components/proposals/ProposalMilestoneList';
import { ProposalAttachmentList } from '../../../components/proposals/ProposalAttachmentList';
import { ProposalScreeningAnswers } from '../../../components/proposals/ProposalScreeningAnswers';
import { ProposalDetailSkeleton } from '../../../components/proposals/ProposalSkeleton';
import { canWithdraw } from '../../../types/proposal';
import type {
  ProposalTender,
  ProposalStatus,
} from '../../../types/proposal';
import type { FreelancerStackParamList } from '../../../navigation/FreelancerNavigator';

// ─── Navigation ───────────────────────────────────────────────────────────────

type ScreenRouteProp = RouteProp<
  { ProposalDetail: { proposalId: string } },
  'ProposalDetail'
>;
type NavProp = NativeStackNavigationProp<FreelancerStackParamList>;

// ─── Status lifecycle steps ───────────────────────────────────────────────────

const LIFECYCLE_STEPS: { status: ProposalStatus; label: string }[] = [
  { status: 'submitted', label: 'Submitted' },
  { status: 'under_review', label: 'Under Review' },
  { status: 'shortlisted', label: 'Shortlisted' },
  { status: 'interview_scheduled', label: 'Interview' },
  { status: 'awarded', label: 'Awarded' },
];

const STEP_ORDER: ProposalStatus[] = [
  'submitted',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'awarded',
];

const STATUS_MESSAGES: Partial<Record<ProposalStatus, { icon: string; text: string; bg: string; color: string }>> = {
  submitted: {
    icon: '📤',
    text: 'Your proposal has been submitted and is awaiting review by the client.',
    bg: 'rgba(59,130,246,0.08)',
    color: '#2563EB',
  },
  under_review: {
    icon: '🔍',
    text: 'The client is actively reviewing your proposal — a great sign!',
    bg: 'rgba(99,102,241,0.08)',
    color: '#4F46E5',
  },
  shortlisted: {
    icon: '⭐',
    text: "You've been shortlisted! The client may reach out for an interview.",
    bg: 'rgba(20,184,166,0.08)',
    color: '#0D9488',
  },
  interview_scheduled: {
    icon: '📅',
    text: 'An interview has been scheduled. Check the details carefully.',
    bg: 'rgba(139,92,246,0.08)',
    color: '#7C3AED',
  },
  awarded: {
    icon: '🏆',
    text: "Congratulations! You've been awarded this project.",
    bg: 'rgba(16,185,129,0.08)',
    color: '#059669',
  },
  rejected: {
    icon: '✕',
    text: 'This proposal was not selected. Keep applying — persistence pays off!',
    bg: 'rgba(239,68,68,0.08)',
    color: '#DC2626',
  },
  withdrawn: {
    icon: '↩',
    text: 'You have withdrawn this proposal.',
    bg: 'rgba(100,116,139,0.08)',
    color: '#64748B',
  },
};

// ─── Section card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  colors: { card: string; border: string; textMuted: string };
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, colors }) => (
  <View style={[sectionStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Text style={[sectionStyles.title, { color: colors.textMuted }]}>{title}</Text>
    {children}
  </View>
);

const sectionStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  title: {
    fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: -4,
  },
});

// ─── Status timeline ──────────────────────────────────────────────────────────

interface StatusTimelineProps {
  currentStatus: ProposalStatus;
  colors: { border: string; textMuted: string; text: string };
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus, colors }) => {
  const isTerminal = ['withdrawn', 'rejected', 'draft'].includes(currentStatus);
  if (isTerminal) return null;

  const currentIdx = STEP_ORDER.indexOf(currentStatus);

  return (
    <View style={timelineStyles.container}>
      {LIFECYCLE_STEPS.map((step, i) => {
        const done = currentIdx > i;
        const active = currentStatus === step.status;
        const isLast = i === LIFECYCLE_STEPS.length - 1;

        return (
          <React.Fragment key={step.status}>
            <View style={timelineStyles.stepCol}>
              <View
                style={[
                  timelineStyles.dot,
                  {
                    backgroundColor: active ? '#F1BB03' : done ? '#10B981' : colors.border,
                    borderColor: active ? '#F1BB03' : done ? '#10B981' : colors.border,
                    transform: [{ scale: active ? 1.15 : 1 }],
                  },
                ]}
              >
                {done ? (
                  <Text style={timelineStyles.checkText}>✓</Text>
                ) : (
                  <Text style={[timelineStyles.numText, { color: active ? '#0A2540' : colors.textMuted }]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  timelineStyles.stepLabel,
                  {
                    color: active ? '#F1BB03' : done ? '#10B981' : colors.textMuted,
                    fontWeight: active ? '700' : '400',
                  },
                ]}
                numberOfLines={2}
              >
                {step.label}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[
                  timelineStyles.line,
                  { backgroundColor: done ? '#10B981' : colors.border },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const timelineStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  stepCol: { alignItems: 'center', gap: 4, width: 48 },
  dot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  numText: { fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 9, textAlign: 'center', lineHeight: 13 },
  line: { flex: 1, height: 2, borderRadius: 1, marginTop: 13 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const ProposalDetailScreen: React.FC = () => {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { theme } = useThemeStore();
  const { colors } = theme;

  const { proposalId } = route.params;

  const { data: proposal, isLoading, refetch } = useProposalDetail(proposalId);
  const withdrawMutation = useWithdrawProposal();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'My Proposal' });
  }, [navigation]);

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Proposal',
      'Are you sure you want to withdraw this proposal? This action cannot be undone.',
      [
        { text: 'Keep Proposal', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () => {
            withdrawMutation.mutate(proposalId, {
              onSuccess: () => {
                Alert.alert('Withdrawn', 'Your proposal has been withdrawn successfully.');
              },
              onError: (err: Error) => {
                Alert.alert('Error', err.message ?? 'Could not withdraw proposal.');
              },
            });
          },
        },
      ],
    );
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Cannot open link', 'The URL could not be opened.'),
    );
  };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ProposalDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!proposal) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textMuted }]}>
            Proposal not found.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tender = typeof proposal.tender === 'object' ? (proposal.tender as ProposalTender) : null;
  const tenderTitle = tender?.title ?? 'Untitled Tender';
  const isAwarded = proposal.status === 'awarded';
  const isRejected = proposal.status === 'rejected';
  const statusMsg = STATUS_MESSAGES[proposal.status];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero status card ──────────────────────────────────────────── */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: isAwarded ? '#10B981' : colors.border,
            },
          ]}
        >
          {/* Accent strip */}
          <View
            style={[
              styles.accentStrip,
              {
                backgroundColor: isAwarded
                  ? '#10B981'
                  : isRejected
                  ? '#EF4444'
                  : '#F1BB03',
              },
            ]}
          />

          {/* Awarded banner */}
          {isAwarded && (
            <View style={styles.awardedBanner}>
              <Text style={styles.awardedText}>🏆 Contract Awarded!</Text>
            </View>
          )}

          <View style={styles.heroBody}>
            {/* Tender title + status */}
            <View style={styles.heroHeader}>
              <View style={styles.heroTitleBlock}>
                <Text style={[styles.heroLabel, { color: colors.textMuted }]}>
                  Applied to
                </Text>
                <Text
                  style={[styles.heroTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {tenderTitle}
                </Text>
              </View>
              <ProposalStatusBadge status={proposal.status} size="md" />
            </View>

            {/* Budget display */}
            <ProposalBudgetDisplay proposal={proposal} layout="card" />

            {/* Meta row */}
            <View style={styles.metaRow}>
              {proposal.submittedAt && (
                <Text style={[styles.metaItem, { color: colors.textMuted }]}>
                  📅 Submitted {formatDate(proposal.submittedAt)}
                </Text>
              )}
              {proposal.viewCount > 0 && (
                <Text style={[styles.metaItem, { color: colors.textMuted }]}>
                  👁 Viewed {proposal.viewCount} time{proposal.viewCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {/* Status timeline */}
            {!['draft', 'withdrawn', 'rejected'].includes(proposal.status) && (
              <StatusTimeline currentStatus={proposal.status} colors={colors} />
            )}

            {/* Status message */}
            {statusMsg && (
              <View style={[styles.statusMsgBox, { backgroundColor: statusMsg.bg }]}>
                <Text style={styles.statusMsgIcon}>{statusMsg.icon}</Text>
                <Text style={[styles.statusMsgText, { color: statusMsg.color }]}>
                  {statusMsg.text}
                </Text>
              </View>
            )}

            {/* Interview scheduled info */}
            {proposal.interviewDate && (
              <View
                style={[
                  styles.interviewBox,
                  { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.25)' },
                ]}
              >
                <Text style={[styles.interviewTitle, { color: '#7C3AED' }]}>
                  📅 Interview Scheduled
                </Text>
                <Text style={[styles.interviewDateTime, { color: '#7C3AED' }]}>
                  {formatDateTime(proposal.interviewDate)}
                </Text>
                {proposal.interviewNotes ? (
                  <Text style={[styles.interviewNotes, { color: '#7C3AED' }]}>
                    {proposal.interviewNotes}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Client feedback (if rejected with notes) */}
            {(proposal.ownerNotes) && (
              <View
                style={[
                  styles.feedbackBox,
                  {
                    backgroundColor: isRejected
                      ? 'rgba(239,68,68,0.06)'
                      : 'rgba(241,187,3,0.06)',
                    borderColor: isRejected ? '#EF4444' : 'rgba(241,187,3,0.3)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.feedbackLabel,
                    { color: isRejected ? '#DC2626' : '#D97706' },
                  ]}
                >
                  {isRejected ? '🗒 Client Feedback' : '💬 Client Note'}
                </Text>
                <Text
                  style={[
                    styles.feedbackText,
                    { color: isRejected ? '#DC2626' : '#D97706' },
                  ]}
                >
                  {proposal.ownerNotes}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Cover Letter ────────────────────────────────────────────────── */}
        <SectionCard title="Cover Letter" colors={colors}>
          <Text style={[styles.coverText, { color: colors.textSecondary }]}>
            {proposal.coverLetter}
          </Text>
        </SectionCard>

        {/* ── Proposal Plan ────────────────────────────────────────────────── */}
        {proposal.proposalPlan ? (
          <SectionCard title="Work Plan" colors={colors}>
            <Text style={[styles.coverText, { color: colors.textSecondary }]}>
              {proposal.proposalPlan}
            </Text>
          </SectionCard>
        ) : null}

        {/* ── Milestones ───────────────────────────────────────────────────── */}
        {proposal.milestones && proposal.milestones.length > 0 && (
          <SectionCard
            title={`Payment Milestones (${proposal.milestones.length})`}
            colors={colors}
          >
            <ProposalMilestoneList
              milestones={proposal.milestones}
              currency={proposal.currency}
              totalBid={proposal.proposedAmount}
            />
          </SectionCard>
        )}

        {/* ── Screening Answers ────────────────────────────────────────────── */}
        {proposal.screeningAnswers && proposal.screeningAnswers.length > 0 && (
          <SectionCard
            title={`Screening Answers (${proposal.screeningAnswers.length})`}
            colors={colors}
          >
            <ProposalScreeningAnswers answers={proposal.screeningAnswers} />
          </SectionCard>
        )}

        {/* ── Portfolio Links ──────────────────────────────────────────────── */}
        {proposal.portfolioLinks && proposal.portfolioLinks.filter((l) => l).length > 0 && (
          <SectionCard
            title={`Portfolio Links (${proposal.portfolioLinks.filter((l) => l).length})`}
            colors={colors}
          >
            {proposal.portfolioLinks.filter((l) => l).map((link, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleOpenLink(link)}
                style={[
                  styles.linkRow,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.linkIcon]}>🔗</Text>
                <Text
                  style={[styles.linkText, { color: '#2563EB' }]}
                  numberOfLines={1}
                >
                  {link}
                </Text>
                <Text style={[styles.linkArrow, { color: colors.textMuted }]}>↗</Text>
              </TouchableOpacity>
            ))}
          </SectionCard>
        )}

        {/* ── Attachments ──────────────────────────────────────────────────── */}
        {proposal.attachments && proposal.attachments.length > 0 && (
          <SectionCard
            title={`Attachments (${proposal.attachments.length})`}
            colors={colors}
          >
            <ProposalAttachmentList
              attachments={proposal.attachments}
              canDelete={false}
            />
          </SectionCard>
        )}

        {/* ── Audit log ────────────────────────────────────────────────────── */}
        {proposal.auditLog && proposal.auditLog.length > 0 && (
          <SectionCard title="Activity History" colors={colors}>
            {[...proposal.auditLog]
              .reverse()
              .slice(0, 6)
              .map((entry, i) => (
                <View key={i} style={styles.auditRow}>
                  <View style={[styles.auditDot, { backgroundColor: '#F1BB03' }]} />
                  <View style={styles.auditContent}>
                    <Text style={[styles.auditAction, { color: colors.text }]}>
                      {String(entry.action ?? '').replace(/_/g, ' ')}
                    </Text>
                    {entry.performedAt && (
                      <Text style={[styles.auditDate, { color: colors.textMuted }]}>
                        {formatDateTime(entry.performedAt)}
                      </Text>
                    )}
                    {entry.note ? (
                      <Text style={[styles.auditNote, { color: colors.textMuted }]}>
                        "{entry.note}"
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
          </SectionCard>
        )}

        {/* ── Withdraw action ───────────────────────────────────────────────── */}
        {canWithdraw(proposal.status) && (
          <TouchableOpacity
            onPress={handleWithdraw}
            disabled={withdrawMutation.isPending}
            activeOpacity={0.75}
            style={[
              styles.withdrawBtn,
              {
                borderColor: '#EF4444',
                backgroundColor: withdrawMutation.isPending
                  ? 'rgba(239,68,68,0.04)'
                  : 'transparent',
              },
            ]}
          >
            {withdrawMutation.isPending ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Text style={styles.withdrawText}>Withdraw Proposal</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  errorContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  errorText: { fontSize: 16 },
  backBtn: { padding: 8 },
  backBtnText: { color: '#F1BB03', fontSize: 15, fontWeight: '600' },

  // Hero card
  heroCard: { borderRadius: 18, borderWidth: 1.5, overflow: 'hidden' },
  accentStrip: { height: 4, width: '100%' },
  awardedBanner: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 6 },
  awardedText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  heroBody: { padding: 16, gap: 14 },
  heroHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 10,
  },
  heroTitleBlock: { flex: 1, gap: 3 },
  heroLabel: { fontSize: 11, fontWeight: '600' },
  heroTitle: { fontSize: 17, fontWeight: '700', lineHeight: 24 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { fontSize: 12 },

  // Status message
  statusMsgBox: {
    flexDirection: 'row', gap: 10, borderRadius: 12,
    padding: 12, alignItems: 'flex-start',
  },
  statusMsgIcon: { fontSize: 16, flexShrink: 0 },
  statusMsgText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },

  // Interview box
  interviewBox: {
    borderWidth: 1, borderRadius: 12, padding: 12, gap: 4,
  },
  interviewTitle: { fontSize: 12, fontWeight: '700' },
  interviewDateTime: { fontSize: 14, fontWeight: '700' },
  interviewNotes: { fontSize: 12, lineHeight: 18, marginTop: 2 },

  // Feedback box
  feedbackBox: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  feedbackLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  feedbackText: { fontSize: 13, lineHeight: 20 },

  // Content
  coverText: { fontSize: 14, lineHeight: 22 },

  // Links
  linkRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 10,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  linkIcon: { fontSize: 14 },
  linkText: { flex: 1, fontSize: 13 },
  linkArrow: { fontSize: 14, flexShrink: 0 },

  // Audit
  auditRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  auditDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  auditContent: { flex: 1, gap: 2 },
  auditAction: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  auditDate: { fontSize: 11 },
  auditNote: { fontSize: 12, fontStyle: 'italic' },

  // Withdraw
  withdrawBtn: {
    borderWidth: 1.5, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  withdrawText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },

  bottomSpacer: { height: 24 },
});

export default ProposalDetailScreen;
