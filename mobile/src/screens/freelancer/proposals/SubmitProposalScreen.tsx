// src/screens/freelancer/proposals/SubmitProposalScreen.tsx
// Banana Mobile App — Module 6B: Proposals
//
// Entry point from TenderDetailScreen when a freelancer taps "Apply".
// CRITICAL FLOW:
//   1. Call useMyProposalForTender(tenderId) to check existing state.
//   2. If draft exists → open ProposalForm with existingDraft (resume mode).
//   3. If submitted/active → show read-only status + Withdraw button.
//   4. If null → open ProposalForm for new submission.
//   5. If tender is closed/expired → show locked state.

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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../../store/themeStore';
import {
  useMyProposalForTender,
  useWithdrawProposal,
} from '../../../hooks/useProposal';
import { ProposalForm } from '../../../components/proposals/ProposalForm';
import { ProposalStatusBadge } from '../../../components/proposals/ProposalStatusBadge';
import { ProposalBudgetDisplay } from '../../../components/proposals/ProposalBudgetDisplay';
import { ProposalDetailSkeleton } from '../../../components/proposals/ProposalSkeleton';
import { ProposalEmptyState } from '../../../components/proposals/ProposalEmptyState';
import { canWithdraw } from '../../../types/proposal';
import type { ProposalTender } from '../../../types/proposal';
import type { FreelancerStackParamList } from '../../../navigation/FreelancerNavigator';

// ─── Navigation types ─────────────────────────────────────────────────────────

type ScreenRouteProp = RouteProp<
  { SubmitProposal: { tenderId: string; tender: ProposalTender } },
  'SubmitProposal'
>;
type NavProp = NativeStackNavigationProp<FreelancerStackParamList>;

// ─── Component ────────────────────────────────────────────────────────────────

export const SubmitProposalScreen: React.FC = () => {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { theme } = useThemeStore();
  const { colors } = theme;

  const { tenderId, tender } = route.params;

  const { data: existingProposal, isLoading } = useMyProposalForTender(tenderId);
  const withdrawMutation = useWithdrawProposal();

  // Set header title
  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Apply to Tender' });
  }, [navigation]);

  // ── Handle withdraw ─────────────────────────────────────────────────────────

  const handleWithdraw = () => {
    if (!existingProposal) return;
    Alert.alert(
      'Withdraw Proposal',
      'Are you sure you want to withdraw your proposal? This cannot be undone.',
      [
        { text: 'Keep Proposal', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () => {
            withdrawMutation.mutate(existingProposal._id, {
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

  // ── Handle form success ─────────────────────────────────────────────────────

  const handleSuccess = (proposalId: string) => {
    Alert.alert(
      '🎉 Proposal Submitted!',
      'Your proposal has been submitted successfully. You will be notified when the client reviews it.',
      [
        {
          text: 'View My Proposal',
          onPress: () => {
            navigation.navigate('ProposalDetail' as never, { proposalId } as never);
          },
        },
        {
          text: 'Done',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  // ── Check if tender is closed ───────────────────────────────────────────────

  const isTenderClosed =
    tender.status !== 'published' ||
    (tender.deadline && new Date(tender.deadline) < new Date());

  // ── Loading state ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ProposalDetailSkeleton />
      </SafeAreaView>
    );
  }

  // ── Tender closed ───────────────────────────────────────────────────────────

  if (isTenderClosed && !existingProposal) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.centeredContent}>
          <ProposalEmptyState
            variant="tender_closed"
            actionLabel="Browse Other Tenders"
            onAction={() => navigation.goBack()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Existing submitted/active proposal — read-only ─────────────────────────

  if (existingProposal && !existingProposal.isDraft) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status hero */}
          <View
            style={[
              styles.statusCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.statusHeader}>
              <Text style={[styles.statusHeadline, { color: colors.text }]}>
                Your Proposal
              </Text>
              <ProposalStatusBadge status={existingProposal.status} size="md" />
            </View>

            <Text style={[styles.tenderTitle, { color: colors.textSecondary }]}>
              {tender.title}
            </Text>

            {/* Bid summary */}
            <ProposalBudgetDisplay proposal={existingProposal} layout="card" style={styles.budgetCard} />

            {/* Timeline info */}
            {existingProposal.submittedAt && (
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                Submitted{' '}
                {new Date(existingProposal.submittedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            )}

            {/* Status message */}
            <StatusMessage status={existingProposal.status} colors={colors} />

            {/* Client notes (if any) */}
            {existingProposal.ownerNotes ? (
              <View
                style={[
                  styles.ownerNoteBox,
                  { backgroundColor: 'rgba(241,187,3,0.06)', borderColor: 'rgba(241,187,3,0.25)' },
                ]}
              >
                <Text style={[styles.ownerNoteLabel, { color: '#D97706' }]}>
                  Client Feedback
                </Text>
                <Text style={[styles.ownerNoteText, { color: colors.textSecondary }]}>
                  {existingProposal.ownerNotes}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Cover letter preview */}
          {existingProposal.coverLetter && (
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                COVER LETTER
              </Text>
              <Text
                style={[styles.sectionBody, { color: colors.textSecondary }]}
                numberOfLines={8}
              >
                {existingProposal.coverLetter}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ProposalDetail' as never, {
                  proposalId: existingProposal._id,
                } as never)
              }
              style={[styles.viewBtn, { backgroundColor: '#F1BB03' }]}
            >
              <Text style={styles.viewBtnText}>View Full Proposal</Text>
            </TouchableOpacity>

            {canWithdraw(existingProposal.status) && (
              <TouchableOpacity
                onPress={handleWithdraw}
                disabled={withdrawMutation.isPending}
                style={[
                  styles.withdrawBtn,
                  { borderColor: '#EF4444' },
                ]}
              >
                {withdrawMutation.isPending ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text style={styles.withdrawBtnText}>Withdraw Proposal</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── ProposalForm — draft or new submission ─────────────────────────────────

  return (
    <ProposalForm
      tender={tender}
      existingDraft={existingProposal ?? null}
      onSuccess={handleSuccess}
      onCancel={() => navigation.goBack()}
    />
  );
};

// ─── Helper: Status message ───────────────────────────────────────────────────

interface StatusMessageProps {
  status: string;
  colors: { text: string; textMuted: string; surface: string; border: string };
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status, colors }) => {
  const messages: Record<string, { icon: string; text: string; bg: string; textColor: string }> = {
    submitted: {
      icon: '📤',
      text: 'Your proposal has been submitted and is awaiting review by the client.',
      bg: 'rgba(59,130,246,0.08)',
      textColor: '#2563EB',
    },
    under_review: {
      icon: '🔍',
      text: 'The client is actively reviewing your proposal. Good sign!',
      bg: 'rgba(59,130,246,0.08)',
      textColor: '#2563EB',
    },
    shortlisted: {
      icon: '⭐',
      text: "You've been shortlisted! The client may reach out for an interview.",
      bg: 'rgba(20,184,166,0.08)',
      textColor: '#0D9488',
    },
    interview_scheduled: {
      icon: '📅',
      text: 'An interview has been scheduled. Check the details carefully.',
      bg: 'rgba(139,92,246,0.08)',
      textColor: '#7C3AED',
    },
    awarded: {
      icon: '🏆',
      text: "Congratulations! You've been awarded this project.",
      bg: 'rgba(16,185,129,0.08)',
      textColor: '#059669',
    },
    rejected: {
      icon: '✕',
      text: 'This proposal was not selected. Keep applying — persistence pays off!',
      bg: 'rgba(239,68,68,0.08)',
      textColor: '#DC2626',
    },
    withdrawn: {
      icon: '↩',
      text: 'You have withdrawn this proposal.',
      bg: 'rgba(100,116,139,0.08)',
      textColor: '#64748B',
    },
  };

  const msg = messages[status];
  if (!msg) return null;

  return (
    <View
      style={[
        statusStyles.box,
        { backgroundColor: msg.bg },
      ]}
    >
      <Text style={statusStyles.icon}>{msg.icon}</Text>
      <Text style={[statusStyles.text, { color: msg.textColor }]}>
        {msg.text}
      </Text>
    </View>
  );
};

const statusStyles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  icon: { fontSize: 16, flexShrink: 0 },
  text: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  centeredContent: { flex: 1, justifyContent: 'center' },
  statusCard: {
    borderRadius: 16, borderWidth: 1, padding: 18, gap: 12,
  },
  statusHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  statusHeadline: { fontSize: 18, fontWeight: '700' },
  tenderTitle: { fontSize: 14, lineHeight: 20 },
  budgetCard: { marginTop: 4 },
  metaText: { fontSize: 12 },
  ownerNoteBox: {
    borderWidth: 1, borderRadius: 12, padding: 12, gap: 4, marginTop: 4,
  },
  ownerNoteLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  ownerNoteText: { fontSize: 13, lineHeight: 20 },
  sectionCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 8,
  },
  sectionTitle: {
    fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sectionBody: { fontSize: 13, lineHeight: 20 },
  actions: { gap: 10 },
  viewBtn: {
    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
  },
  viewBtnText: { color: '#0A2540', fontSize: 15, fontWeight: '800' },
  withdrawBtn: {
    borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, alignItems: 'center',
  },
  withdrawBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
});

export default SubmitProposalScreen;
