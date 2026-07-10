// src/screens/organization/bids/OrgBidDetailScreen.tsx
// Organization owner — single bid deep-evaluation. Teal accent. Committee labels.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, ActivityIndicator, TextInput, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import { useGetBids, useUpdateBidStatus, useVerifyCPOReturn } from '../../../hooks/useBid';
import { useProfessionalTender } from '../../../hooks/useProfessionalTender';
import { getSafeDeadline, getSafeWorkflowType, isSealedTender } from '../../../utils/tenderHelpers';
import { BidHeader } from '../../../components/bids/BidHeader';
import { BidTabBar, TabConfig } from '../../../components/bids/BidTabBar';
import { BidStatusBadge } from '../../../components/bids/BidStatusBadge';
import { BidSealedIndicator } from '../../../components/bids/BidSealedIndicator';
import { BidCoverSheetDisplay } from '../../../components/bids/BidCoverSheetDisplay';
import { BidFinancialBreakdownDisplay } from '../../../components/bids/BidFinancialBreakdownDisplay';
import { BidDocumentList } from '../../../components/bids/BidDocumentList';
import { BidStatusTimeline } from '../../../components/bids/BidStatusTimeline';
import { BidEvaluationPanel } from '../../../components/bids/BidEvaluationPanel';
import { BidComplianceChecklist } from '../../../components/bids/BidComplianceChecklist';
import { SealedBidBanner } from '../../../components/bids/SealedBidBanner';
import { BidderInfo } from '../../../components/bids/BidderInfo';
import { Bid, BidStatus } from '../../../types/bid';

const TEAL = '#0D9488';

interface RouteParams { bidId: string; tenderId: string }

const VALID_TRANSITIONS: Partial<Record<BidStatus, BidStatus[]>> = {
  [BidStatus.Submitted]: [BidStatus.UnderReview, BidStatus.Rejected],
  [BidStatus.UnderReview]: [BidStatus.Shortlisted, BidStatus.Rejected],
  [BidStatus.Shortlisted]: [BidStatus.InterviewScheduled, BidStatus.Awarded, BidStatus.Rejected],
  [BidStatus.InterviewScheduled]: [BidStatus.Awarded, BidStatus.Rejected],
};

interface ActionConfig { status: BidStatus; label: string; icon: keyof typeof Ionicons.glyphMap; }
const ACTION_CONFIGS: Record<BidStatus, ActionConfig> = {
  [BidStatus.UnderReview]: { status: BidStatus.UnderReview, label: 'Move to Under Review', icon: 'search-outline' },
  [BidStatus.Shortlisted]: { status: BidStatus.Shortlisted, label: 'Shortlist', icon: 'star-outline' },
  [BidStatus.InterviewScheduled]: { status: BidStatus.InterviewScheduled, label: 'Schedule Interview', icon: 'calendar-outline' },
  [BidStatus.Awarded]: { status: BidStatus.Awarded, label: 'Award Contract', icon: 'trophy-outline' },
  [BidStatus.Rejected]: { status: BidStatus.Rejected, label: 'Reject', icon: 'close-circle-outline' },
  [BidStatus.Submitted]: { status: BidStatus.Submitted, label: 'Submitted', icon: 'paper-plane-outline' },
  [BidStatus.Withdrawn]: { status: BidStatus.Withdrawn, label: 'Withdrawn', icon: 'arrow-undo-circle-outline' },
};

export const OrgBidDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
const params = (route.params as RouteParams) ?? {};
const bidId = params.bidId ?? '';
const tenderId = params.tenderId ?? '';  const { colors, spacing, radius } = useTheme();
  const [activeTab, setActiveTab] = useState('Overview');
  const [committeeNotes, setCommitteeNotes] = useState('');

  const { data: bidsData, isLoading: bidsLoading, refetch } = useGetBids(tenderId);
  const { data: tender, isLoading: tenderLoading } = useProfessionalTender(tenderId);
  const { mutate: updateStatus, isPending: updating } = useUpdateBidStatus();
  const { mutate: cpoReturn, isPending: cpoReturning } = useVerifyCPOReturn();

  const bid: Bid | undefined = bidsData?.bids?.find((b) => b._id === bidId) as Bid | undefined;
  const isLoading = bidsLoading || tenderLoading;
  const isSealed = isSealedTender(tender);
  const isBidsRevealed = bidsData?.isBidsRevealed ?? false;
  const amountHidden = isSealed && !isBidsRevealed;

  useEffect(() => { if (bid?.ownerNotes && !committeeNotes) setCommitteeNotes(bid.ownerNotes); }, [bid]);

  const handleStatusAction = useCallback((nextStatus: BidStatus) => {
    const cfg = ACTION_CONFIGS[nextStatus];
    const isAwarded = nextStatus === BidStatus.Awarded;
    Alert.alert(
      isAwarded ? 'Award Contract? 🏆' : `Update to ${cfg.label}?`,
      isAwarded ? 'This awards the contract. Recorded in the committee audit trail.' : `Mark as "${cfg.label}". Recorded in the committee audit trail.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: cfg.label, style: nextStatus === BidStatus.Rejected ? 'destructive' : 'default', onPress: () => updateStatus({ tenderId, bidId, status: nextStatus, ownerNotes: committeeNotes.trim() || undefined }, { onSuccess: () => refetch() }) },
      ],
    );
  }, [committeeNotes, tenderId, bidId, updateStatus, refetch]);

  const tabs: TabConfig[] = useMemo(() => [
    { key: 'Overview', label: 'Overview', icon: 'eye-outline' },
    { key: 'Details', label: 'Details', icon: 'document-text-outline' },
    { key: 'Files', label: 'Files', icon: 'attach-outline' },
    { key: 'Company', label: 'Company', icon: 'business-outline' },
    { key: 'Evaluation', label: 'Evaluation', icon: 'analytics-outline' },
  ], []);

  if (isLoading) return <View style={[styles.fullCenter, { backgroundColor: colors.bg }]}><ActivityIndicator size="large" color={TEAL} /></View>;
  if (!bid) return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.fullCenter}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
        <Text style={[styles.errorText, { color: colors.textMuted }]}>Bid not found.</Text>
        <Pressable onPress={() => navigation.goBack()} style={[styles.errorBtn, { backgroundColor: TEAL }]}><Text style={styles.errorBtnText}>Go back</Text></Pressable>
      </View>
    </SafeAreaView>
  );

  const validNextStates = VALID_TRANSITIONS[bid.status] ?? [];

  const renderOverview = () => (
    <ScrollView contentContainerStyle={[styles.tabContent, { padding: spacing.lg, gap: spacing.md }]}>
      {isSealed && tender && <SealedBidBanner workflowType={getSafeWorkflowType(tender)} isRevealed={isBidsRevealed} deadline={getSafeDeadline(tender)} isOwner />}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
        <BidderInfo bidder={bid.bidder} company={bid.bidderCompany} coverSheetName={bid.coverSheet?.companyName} />
        <View style={{ height: spacing.sm }} />
        <View style={styles.badgeRow}><BidStatusBadge status={bid.status} /><BidSealedIndicator sealed={isSealed} isBidsRevealed={isBidsRevealed} /></View>
      </View>
      {!amountHidden && (
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
          <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Bid Amount</Text>
          <Text style={[styles.amountValue, { color: TEAL }]}>{bid.currency} {bid.bidAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderDetails = () => (
    <ScrollView contentContainerStyle={[styles.tabContent, { padding: spacing.lg, gap: spacing.md }]}>
      {bid.coverSheet && <BidCoverSheetDisplay coverSheet={bid.coverSheet} />}
      {bid.financialBreakdown && <BidFinancialBreakdownDisplay items={Array.isArray(bid.financialBreakdown) ? bid.financialBreakdown : bid.financialBreakdown.items ?? []} currency={bid.currency} />}
    </ScrollView>
  );

  const renderFiles = () => (
    <ScrollView contentContainerStyle={[styles.tabContent, { padding: spacing.lg }]}>
      <BidDocumentList documents={bid.documents ?? []} isBidsRevealed={isBidsRevealed} isOwner tenderId={tenderId} bidId={bid._id} />
    </ScrollView>
  );

  const renderCompany = () => (
    <ScrollView contentContainerStyle={[styles.tabContent, { padding: spacing.lg, gap: spacing.md }]}>
      {bid.coverSheet && <BidCoverSheetDisplay coverSheet={bid.coverSheet} />}
      <BidComplianceChecklist bid={bid} tenderId={tenderId} isOwner isEditable />
    </ScrollView>
  );

  const renderEvaluation = () => (
    <ScrollView contentContainerStyle={[styles.tabContent, { padding: spacing.lg, gap: spacing.md }]}>
      <BidEvaluationPanel bid={bid} tenderId={tenderId} isOwner label="Committee Evaluation" />
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Committee Notes</Text>
        <TextInput value={committeeNotes} onChangeText={setCommitteeNotes} placeholder="Add private committee notes…" placeholderTextColor={colors.inputPlaceholder} multiline textAlignVertical="top" style={[styles.notesInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, borderRadius: radius.md }]} />
      </View>
      {validNextStates.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Update Status</Text>
          {validNextStates.map((nextStatus) => {
            const cfg = ACTION_CONFIGS[nextStatus];
            const isRejected = nextStatus === BidStatus.Rejected;
            return (
              <Pressable key={nextStatus} onPress={() => handleStatusAction(nextStatus)} disabled={updating} style={({ pressed }) => [styles.actionBtn, { backgroundColor: isRejected ? colors.dangerBg : TEAL + '20', borderColor: isRejected ? colors.danger : TEAL, borderRadius: radius.md, opacity: pressed || updating ? 0.7 : 1 }]}>
                {updating ? <ActivityIndicator size="small" color={isRejected ? colors.danger : TEAL} /> : <><Ionicons name={cfg.icon} size={16} color={isRejected ? colors.danger : TEAL} /><Text style={[styles.actionBtnText, { color: isRejected ? colors.danger : TEAL }]}>{cfg.label}</Text></>}
              </Pressable>
            );
          })}
        </View>
      )}
      {bid.cpo && bid.cpo.returnStatus !== 'returned' && (
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🏦 CPO Return</Text>
          <Text style={[styles.cpoStatus, { color: colors.textMuted }]}>Current: {bid.cpo.returnStatus ?? 'pending'}</Text>
          <View style={styles.cpoRow}>
            <Pressable onPress={() => cpoReturn({ tenderId, bidId: bid._id, returnStatus: 'returned' })} disabled={cpoReturning} style={[styles.cpoBtn, { backgroundColor: colors.successBg, borderRadius: radius.md }]}><Text style={{ color: colors.success, fontWeight: '700', fontSize: 12 }}>✓ Returned</Text></Pressable>
            <Pressable onPress={() => cpoReturn({ tenderId, bidId: bid._id, returnStatus: 'forfeited' })} disabled={cpoReturning} style={[styles.cpoBtn, { backgroundColor: colors.dangerBg, borderRadius: radius.md }]}><Text style={{ color: colors.danger, fontWeight: '700', fontSize: 12 }}>✗ Forfeited</Text></Pressable>
          </View>
        </View>
      )}
      <BidStatusTimeline statusHistory={bid.statusHistory ?? []} currentStatus={bid.status} />
    </ScrollView>
  );

  const tabContent: Record<string, React.ReactNode> = {
    Overview: renderOverview(), Details: renderDetails(), Files: renderFiles(), Company: renderCompany(), Evaluation: renderEvaluation(),
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <BidHeader bid={bid} tender={tender ?? { _id: tenderId, title: 'Tender', status: '', deadline: '', workflowType: 'open' }} viewerRole="owner" onBack={() => navigation.goBack()} />
      <BidTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      {tabContent[activeTab]}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 }, fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { fontSize: 14 }, errorBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }, errorBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  tabContent: { paddingBottom: 40 }, card: { borderWidth: 1, padding: 14 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  amountLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }, amountValue: { fontSize: 22, fontWeight: '800' },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  notesInput: { borderWidth: 1, padding: 10, fontSize: 13, minHeight: 90 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1, minHeight: 48 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  cpoStatus: { fontSize: 12 }, cpoRow: { flexDirection: 'row', gap: 8 }, cpoBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
});

export default OrgBidDetailScreen;