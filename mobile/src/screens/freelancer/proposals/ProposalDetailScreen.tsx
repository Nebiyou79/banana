// screens/freelancer/proposals/ProposalDetailScreen.tsx
// Enhanced to show complete proposal information

import React, { useLayoutEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Linking,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import { FONT_SIZE } from '../../../theme/tokens';
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
import {
  PROPOSAL_STATUS_CONFIGS,
  getProposalStatusColors,
} from '../../../components/proposals/proposalStatusConfig';
import type { ProposalStatus } from '../../../types/proposal';
import type { FreelancerStackParamList } from '../../../navigation/FreelancerNavigator';

type ScreenRouteProp = RouteProp<{ ProposalDetail: { proposalId: string } }, 'ProposalDetail'>;
type NavProp = NativeStackNavigationProp<FreelancerStackParamList>;

const LIFECYCLE_STEPS: { status: ProposalStatus; label: string }[] = [
  { status: 'submitted', label: 'Submitted' },
  { status: 'under_review', label: 'Under Review' },
  { status: 'shortlisted', label: 'Shortlisted' },
  { status: 'interview_scheduled', label: 'Interview' },
  { status: 'awarded', label: 'Awarded' },
];

const STEP_ORDER: ProposalStatus[] = [
  'submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'awarded',
];

interface SectionCardColors { bgCard: string; border: string; textMuted: string; }

const SectionCard: React.FC<{ title: string; children: React.ReactNode; colors: SectionCardColors }> = ({
  title, children, colors,
}) => (
  <View style={[sectionStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
    <Text style={[sectionStyles.title, { color: colors.textMuted }]}>{title}</Text>
    {children}
  </View>
);

const sectionStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  title: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: -4 },
});

const StatusTimeline: React.FC<{ currentStatus: ProposalStatus; colors: any }> = ({ currentStatus, colors }) => {
  const isTerminal = ['withdrawn', 'rejected', 'draft'].includes(currentStatus);
  if (isTerminal) return null;

  const currentIdx = STEP_ORDER.indexOf(currentStatus);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
      {LIFECYCLE_STEPS.map((step, i) => {
        const done = currentIdx > i;
        const active = currentStatus === step.status;
        const isLast = i === LIFECYCLE_STEPS.length - 1;

        return (
          <React.Fragment key={step.status}>
            <View style={timelineStyles.stepCol}>
              <View style={[
                timelineStyles.dot,
                {
                  backgroundColor: active ? colors.primary : done ? colors.success : colors.border,
                  borderColor: active ? colors.primary : done ? colors.success : colors.border,
                  transform: [{ scale: active ? 1.15 : 1 }],
                },
              ]}>
                {done ? (
                  <Ionicons name="checkmark" size={10} color="#fff" />
                ) : (
                  <Text style={[timelineStyles.numText, { color: active ? '#fff' : colors.textMuted }]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  timelineStyles.stepLabel,
                  {
                    color: active ? colors.primary : done ? colors.success : colors.textMuted,
                    fontWeight: active ? '700' : '400',
                  },
                ]}
                numberOfLines={2}
              >
                {step.label}
              </Text>
            </View>
            {!isLast && (
              <View style={[timelineStyles.line, { backgroundColor: done ? colors.success : colors.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
};

const timelineStyles = StyleSheet.create({
  stepCol: { alignItems: 'center', width: 62, gap: 4 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 9, textAlign: 'center', lineHeight: 12 },
  line: { width: 24, height: 2, marginBottom: 20 },
});

const StatusMessageBox: React.FC<{ status: ProposalStatus }> = ({ status }) => {
  const { colors } = useTheme();
  const cfg = PROPOSAL_STATUS_CONFIGS[status];
  if (!cfg) return null;
  const { iconColor, bg } = getProposalStatusColors(status, colors);

  return (
    <View style={[smStyles.box, { backgroundColor: bg }]}>
      <Ionicons name={cfg.icon} size={18} color={iconColor} />
      <Text style={[smStyles.text, { color: iconColor }]}>{cfg.text}</Text>
    </View>
  );
};

const smStyles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 10, borderRadius: 12, padding: 12, alignItems: 'flex-start' },
  text: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },
});

const ProposalDetailScreen: React.FC = () => {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const { proposalId } = route.params;

  const { data: proposal, isLoading, error, refetch } = useProposalDetail(proposalId);
  const withdrawMutation = useWithdrawProposal();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Proposal Details',
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={{ marginRight: 16 }}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, proposal]);

  const handleShare = async () => {
    if (!proposal) return;
    try {
      await Share.share({
        message: `Check out my proposal for "${tender?.title}" - ${proposal.currency} ${proposal.proposedAmount.toLocaleString()}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleWithdraw = () => {
    if (!proposal) return;
    Alert.alert(
      'Withdraw Proposal',
      'Are you sure you want to withdraw? This cannot be undone.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Withdraw', style: 'destructive',
          onPress: () => {
            withdrawMutation.mutate(proposal._id, {
              onSuccess: () => {
                Alert.alert('Withdrawn', 'Your proposal has been withdrawn.');
                navigation.goBack();
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

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open link.');
    }
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatDateTime = (d?: string) =>
    d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <ProposalDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!proposal || error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.text }]}>Proposal not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: colors.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isRejected = proposal.status === 'rejected';
  const tender = typeof proposal.tender === 'object' && proposal.tender !== null
    ? proposal.tender as { title?: string; _id?: string; ownerEntity?: any; details?: any }
    : null;

  const freelancerProfile = typeof proposal.freelancerProfile === 'object'
    ? proposal.freelancerProfile as { headline?: string; successRate?: number; onTimeDelivery?: number; ratings?: { average: number; count: number } }
    : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.accentStrip, { backgroundColor: colors.primary }]} />
          {proposal.status === 'awarded' && (
            <View style={[styles.awardedBanner, { backgroundColor: colors.success }]}>
              <Text style={styles.awardedText}>AWARDED — Congratulations!</Text>
            </View>
          )}
          {proposal.isShortlisted && proposal.status !== 'awarded' && (
            <View style={[styles.shortlistedBanner, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
              <Ionicons name="star" size={14} color={colors.primary} />
              <Text style={[styles.shortlistedText, { color: colors.primary }]}>Shortlisted</Text>
            </View>
          )}
          <View style={styles.heroBody}>
            <View style={styles.heroHeader}>
              <View style={styles.heroTitleBlock}>
                <Text style={[styles.heroLabel, { color: colors.textMuted }]}>PROPOSAL FOR</Text>
                <Text style={[styles.heroTitle, { color: colors.text }]} numberOfLines={2}>
                  {tender?.title ?? 'Tender'}
                </Text>
                {tender?.ownerEntity && typeof tender.ownerEntity === 'object' && (
                  <Text style={[styles.clientName, { color: colors.textMuted }]}>
                    {tender.ownerEntity.name || ''}
                  </Text>
                )}
              </View>
              <ProposalStatusBadge status={proposal.status} size="md" />
            </View>

            <ProposalBudgetDisplay proposal={proposal} layout="card" />

            <View style={styles.metaRow}>
              {proposal.submittedAt && (
                <Text style={[styles.metaItem, { color: colors.textMuted }]}>
                  Submitted {formatDate(proposal.submittedAt)}
                </Text>
              )}
              {proposal.viewCount > 0 && (
                <Text style={[styles.metaItem, { color: colors.textMuted }]}>
                  Viewed {proposal.viewCount} time{proposal.viewCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {/* Status timeline */}
            {!['draft', 'withdrawn', 'rejected'].includes(proposal.status) && (
              <StatusTimeline currentStatus={proposal.status} colors={colors} />
            )}

            <StatusMessageBox status={proposal.status} />

            {/* Interview scheduled */}
            {proposal.interviewDate && (
              <View style={[styles.interviewBox, {
                backgroundColor: withAlpha(colors.organization, 0.08),
                borderColor: withAlpha(colors.organization, 0.25),
              }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar-outline" size={14} color={colors.organization} />
                  <Text style={[styles.interviewTitle, { color: colors.organization }]}>Interview Scheduled</Text>
                </View>
                <Text style={[styles.interviewDateTime, { color: colors.organization }]}>
                  {formatDateTime(proposal.interviewDate)}
                </Text>
                {proposal.interviewNotes ? (
                  <Text style={[styles.interviewNotes, { color: colors.organization }]}>
                    {proposal.interviewNotes}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Client feedback */}
            {proposal.ownerNotes && (
              <View style={[styles.feedbackBox, {
                backgroundColor: isRejected ? withAlpha(colors.danger, 0.08) : withAlpha(colors.primary, 0.06),
                borderColor: isRejected ? colors.danger : withAlpha(colors.primary, 0.30),
              }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={isRejected ? 'document-text-outline' : 'chatbubble-outline'}
                    size={12}
                    color={isRejected ? colors.danger : colors.warning}
                  />
                  <Text style={[styles.feedbackLabel, { color: isRejected ? colors.danger : colors.warning }]}>
                    {isRejected ? 'Client Feedback' : 'Client Note'}
                  </Text>
                </View>
                <Text style={[styles.feedbackText, { color: isRejected ? colors.danger : colors.warning }]}>
                  {proposal.ownerNotes}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Cover Letter */}
        <SectionCard title="Cover Letter" colors={colors}>
          <Text style={[styles.coverText, { color: colors.textSecondary }]}>
            {proposal.coverLetter}
          </Text>
        </SectionCard>

        {/* Work Plan */}
        {proposal.proposalPlan && (
          <SectionCard title="Work Plan" colors={colors}>
            <Text style={[styles.coverText, { color: colors.textSecondary }]}>
              {proposal.proposalPlan}
            </Text>
          </SectionCard>
        )}

        {/* Bid Details */}
        <SectionCard title="Bid Details" colors={colors}>
          <View style={styles.bidDetailsGrid}>
            <View style={styles.bidDetailItem}>
              <Text style={[styles.bidDetailLabel, { color: colors.textMuted }]}>Bid Type</Text>
              <Text style={[styles.bidDetailValue, { color: colors.text }]}>
                {proposal.bidType === 'hourly' ? 'Hourly Rate' : 'Fixed Price'}
              </Text>
            </View>
            {proposal.bidType === 'hourly' && proposal.hourlyRate && (
              <View style={styles.bidDetailItem}>
                <Text style={[styles.bidDetailLabel, { color: colors.textMuted }]}>Hourly Rate</Text>
                <Text style={[styles.bidDetailValue, { color: colors.text }]}>
                  {proposal.currency} {proposal.hourlyRate.toLocaleString()}/hr
                </Text>
              </View>
            )}
            {proposal.bidType === 'hourly' && proposal.estimatedWeeklyHours && (
              <View style={styles.bidDetailItem}>
                <Text style={[styles.bidDetailLabel, { color: colors.textMuted }]}>Weekly Hours</Text>
                <Text style={[styles.bidDetailValue, { color: colors.text }]}>
                  {proposal.estimatedWeeklyHours} hrs/week
                </Text>
              </View>
            )}
            <View style={styles.bidDetailItem}>
              <Text style={[styles.bidDetailLabel, { color: colors.textMuted }]}>Delivery Time</Text>
              <Text style={[styles.bidDetailValue, { color: colors.text }]}>
                {proposal.deliveryTime?.value} {proposal.deliveryTime?.unit}
              </Text>
            </View>
            <View style={styles.bidDetailItem}>
              <Text style={[styles.bidDetailLabel, { color: colors.textMuted }]}>Availability</Text>
              <Text style={[styles.bidDetailValue, { color: colors.text }]}>
                {proposal.availability === 'full-time' ? 'Full-time' : proposal.availability === 'part-time' ? 'Part-time' : 'Flexible'}
              </Text>
            </View>
            {proposal.proposedStartDate && (
              <View style={styles.bidDetailItem}>
                <Text style={[styles.bidDetailLabel, { color: colors.textMuted }]}>Proposed Start Date</Text>
                <Text style={[styles.bidDetailValue, { color: colors.text }]}>
                  {formatDate(proposal.proposedStartDate)}
                </Text>
              </View>
            )}
          </View>
        </SectionCard>

        {/* Milestones */}
        {proposal.milestones && proposal.milestones.length > 0 && (
          <SectionCard title={`Payment Milestones (${proposal.milestones.length})`} colors={colors}>
            <ProposalMilestoneList
              milestones={proposal.milestones}
              currency={proposal.currency}
              totalBid={proposal.proposedAmount}
            />
          </SectionCard>
        )}

        {/* Screening Answers */}
        {proposal.screeningAnswers && proposal.screeningAnswers.length > 0 && (
          <SectionCard title={`Screening Answers (${proposal.screeningAnswers.length})`} colors={colors}>
            <ProposalScreeningAnswers answers={proposal.screeningAnswers} />
          </SectionCard>
        )}

        {/* Portfolio Links */}
        {proposal.portfolioLinks && proposal.portfolioLinks.filter(l => l).length > 0 && (
          <SectionCard title={`Portfolio Links (${proposal.portfolioLinks.filter(l => l).length})`} colors={colors}>
            {proposal.portfolioLinks.filter(l => l).map((link, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleOpenLink(link)}
                style={[styles.linkRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              >
                <Ionicons name="link-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>{link}</Text>
                <Ionicons name="open-outline" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </SectionCard>
        )}

        {/* Attachments */}
        {proposal.attachments && proposal.attachments.length > 0 && (
          <SectionCard title={`Attachments (${proposal.attachments.length})`} colors={colors}>
            <ProposalAttachmentList attachments={proposal.attachments} canDelete={false} />
          </SectionCard>
        )}

        {/* Freelancer Profile (self-view) */}
        {freelancerProfile && (
          <SectionCard title="Your Profile Info" colors={colors}>
            {freelancerProfile.headline && (
              <Text style={[styles.profileHeadline, { color: colors.textSecondary }]}>
                {freelancerProfile.headline}
              </Text>
            )}
            <View style={styles.perfMetrics}>
              {freelancerProfile.successRate != null && (
                <View style={styles.perfMetric}>
                  <Text style={[styles.perfValue, { color: colors.success }]}>{freelancerProfile.successRate}%</Text>
                  <Text style={[styles.perfLabel, { color: colors.textMuted }]}>Success Rate</Text>
                </View>
              )}
              {freelancerProfile.onTimeDelivery != null && (
                <View style={styles.perfMetric}>
                  <Text style={[styles.perfValue, { color: colors.info }]}>{freelancerProfile.onTimeDelivery}%</Text>
                  <Text style={[styles.perfLabel, { color: colors.textMuted }]}>On-time Delivery</Text>
                </View>
              )}
              {freelancerProfile.ratings && freelancerProfile.ratings.count > 0 && (
                <View style={styles.perfMetric}>
                  <Text style={[styles.perfValue, { color: colors.warning }]}>{freelancerProfile.ratings.average.toFixed(1)}</Text>
                  <Text style={[styles.perfLabel, { color: colors.textMuted }]}>Rating ({freelancerProfile.ratings.count})</Text>
                </View>
              )}
            </View>
          </SectionCard>
        )}

        {/* Audit log */}
        {proposal.auditLog && proposal.auditLog.length > 0 && (
          <SectionCard title="Activity History" colors={colors}>
            {[...proposal.auditLog].reverse().slice(0, 6).map((entry: any, i: number) => (
              <View key={i} style={styles.auditRow}>
                <View style={[styles.auditDot, { backgroundColor: colors.primary }]} />
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
                    <Text style={[styles.auditNote, { color: colors.textMuted }]}>"{entry.note}"</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </SectionCard>
        )}

        {/* Withdraw button */}
        {canWithdraw(proposal.status) && (
          <TouchableOpacity
            onPress={handleWithdraw}
            disabled={withdrawMutation.isPending}
            activeOpacity={0.75}
            style={[styles.withdrawBtn, {
              borderColor: colors.danger,
              backgroundColor: withdrawMutation.isPending ? withAlpha(colors.danger, 0.1) : 'transparent',
            }]}
          >
            {withdrawMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={[styles.withdrawText, { color: colors.danger }]}>Withdraw Proposal</Text>
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
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16 },
  backBtn: { padding: 8 },
  backBtnText: { fontSize: 15, fontWeight: '600' },
  heroCard: { borderRadius: 18, borderWidth: 1.5, overflow: 'hidden' },
  accentStrip: { height: 4, width: '100%' },
  awardedBanner: { paddingHorizontal: 16, paddingVertical: 6 },
  awardedText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  shortlistedBanner: { paddingHorizontal: 16, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  shortlistedText: { fontSize: 12, fontWeight: '700' },
  heroBody: { padding: 16, gap: 14 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  heroTitleBlock: { flex: 1, gap: 3 },
  heroLabel: { fontSize: 11, fontWeight: '600' },
  heroTitle: { fontSize: 17, fontWeight: '700', lineHeight: 24 },
  clientName: { fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { fontSize: 12 },
  interviewBox: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  interviewTitle: { fontSize: 12, fontWeight: '700' },
  interviewDateTime: { fontSize: 14, fontWeight: '700' },
  interviewNotes: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  feedbackBox: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  feedbackLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  feedbackText: { fontSize: 13, lineHeight: 20 },
  coverText: { fontSize: 14, lineHeight: 22 },
  linkRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  linkText: { flex: 1, fontSize: 13 },
  auditRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  auditDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  auditContent: { flex: 1, gap: 2 },
  auditAction: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  auditDate: { fontSize: 11 },
  auditNote: { fontSize: 12, fontStyle: 'italic' },
  withdrawBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  withdrawText: { fontSize: 15, fontWeight: '700' },
  bottomSpacer: { height: 24 },
  bidDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bidDetailItem: { flex: 1, minWidth: '45%', gap: 4 },
  bidDetailLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  bidDetailValue: { fontSize: 14, fontWeight: '600' },
  profileHeadline: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  perfMetrics: { flexDirection: 'row', gap: 16, marginTop: 8 },
  perfMetric: { alignItems: 'center' },
  perfValue: { fontSize: 18, fontWeight: '800' },
  perfLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
});

export default ProposalDetailScreen;