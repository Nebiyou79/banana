// screens/freelancer/proposals/SubmitProposalScreen.tsx

import React, { useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import { FONT_SIZE } from '../../../theme/tokens';
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
import {
  PROPOSAL_STATUS_CONFIGS,
  getProposalStatusColors,
} from '../../../components/proposals/proposalStatusConfig';
import type { ProposalTender, ProposalStatus } from '../../../types/proposal';
import type { FreelancerStackParamList } from '../../../navigation/FreelancerNavigator';

type ScreenRouteProp = RouteProp<
  { SubmitProposal: { tenderId: string; tender: ProposalTender } },
  'SubmitProposal'
>;
type NavProp = NativeStackNavigationProp<FreelancerStackParamList>;

// ─── StatusMessage — Ionicons only ───────────────────────────────────────────

interface StatusMessageProps {
  status: ProposalStatus;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status }) => {
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
  box: { flexDirection: 'row', gap: 10, borderRadius: 12, padding: 12, alignItems: 'flex-start', marginTop: 4 },
  text: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const SubmitProposalScreen: React.FC = () => {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const { tenderId, tender } = route.params;

  const { data: existingProposal, isLoading } = useMyProposalForTender(tenderId);
  const withdrawMutation = useWithdrawProposal();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Apply to Tender' });
  }, [navigation]);

  const handleWithdraw = () => {
    if (!existingProposal) return;
    Alert.alert(
      'Withdraw Proposal',
      'Are you sure you want to withdraw your proposal? This cannot be undone.',
      [
        { text: 'Keep Proposal', style: 'cancel' },
        {
          text: 'Withdraw', style: 'destructive',
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

  const handleSuccess = (proposalId: string) => {
    Alert.alert(
      'Proposal Submitted',
      'Your proposal has been submitted successfully. You will be notified when the client reviews it.',
      [
        {
          text: 'View My Proposal',
          onPress: () => navigation.navigate('ProposalDetail', { proposalId: proposalId }),
        },
        { text: 'Done', onPress: () => navigation.goBack() },
      ],
    );
  };

  const isTenderClosed =
    tender.status !== 'published' ||
    (tender.deadline && new Date(tender.deadline) < new Date());

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <ProposalDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (isTenderClosed && !existingProposal) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
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

  if (existingProposal && !existingProposal.isDraft) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Status hero */}
          <View style={[styles.statusCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.statusHeader}>
              <Text style={[styles.statusHeadline, { color: colors.text }]}>Your Proposal</Text>
              <ProposalStatusBadge status={existingProposal.status} size="md" />
            </View>

            <Text style={[styles.tenderTitle, { color: colors.textSecondary }]}>{tender.title}</Text>

            <ProposalBudgetDisplay proposal={existingProposal} layout="card" style={styles.budgetCard} />

            {existingProposal.submittedAt && (
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                Submitted{' '}
                {new Date(existingProposal.submittedAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>
            )}

            <StatusMessage status={existingProposal.status} />

            {existingProposal.ownerNotes ? (
              <View style={[styles.ownerNoteBox, {
                backgroundColor: withAlpha(colors.primary, 0.06),
                borderColor: withAlpha(colors.primary, 0.25),
              }]}>
                <Text style={[styles.ownerNoteLabel, { color: colors.warning }]}>Client Feedback</Text>
                <Text style={[styles.ownerNoteText, { color: colors.textSecondary }]}>
                  {existingProposal.ownerNotes}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Cover letter preview */}
          {existingProposal.coverLetter && (
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>COVER LETTER</Text>
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
              onPress={() => navigation.navigate('ProposalDetail', { proposalId: existingProposal._id })}
              style={[styles.viewBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.viewBtnText, { color: colors.textInverse }]}>View Full Proposal</Text>
            </TouchableOpacity>

            {canWithdraw(existingProposal.status) && (
              <TouchableOpacity
                onPress={handleWithdraw}
                disabled={withdrawMutation.isPending}
                style={[styles.withdrawBtn, { borderColor: colors.danger }]}
              >
                {withdrawMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Text style={[styles.withdrawBtnText, { color: colors.danger }]}>Withdraw Proposal</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <ProposalForm
      tender={tender}
      existingDraft={existingProposal ?? null}
      onSuccess={handleSuccess}
      onCancel={() => navigation.goBack()}
    />
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  centeredContent: { flex: 1, justifyContent: 'center' },
  statusCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 12 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusHeadline: { fontSize: 18, fontWeight: '700' },
  tenderTitle: { fontSize: 14, lineHeight: 20 },
  budgetCard: { marginTop: 4 },
  metaText: { fontSize: 12 },
  ownerNoteBox: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4, marginTop: 4 },
  ownerNoteLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  ownerNoteText: { fontSize: 13, lineHeight: 20 },
  sectionCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionBody: { fontSize: 13, lineHeight: 20 },
  actions: { gap: 10 },
  viewBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  viewBtnText: { fontSize: 15, fontWeight: '800' },
  withdrawBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  withdrawBtnText: { fontSize: 14, fontWeight: '600' },
});

export default SubmitProposalScreen;