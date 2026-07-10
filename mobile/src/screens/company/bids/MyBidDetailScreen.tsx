// src/screens/company/bids/MyBidDetailScreen.tsx
// 5-tab bidder view of their own submitted bid.
// Uses BidHeader, BidTabBar, updated components, useTheme()
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import { useGetMyBid, useWithdrawBid } from '../../../hooks/useBid';
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
import { SealedBidBanner } from '../../../components/bids/SealedBidBanner';
import { Bid, BidStatus } from '../../../types/bid';

// ── Status descriptions ────────────────────────────────────────────────────────

const STATUS_DESCRIPTIONS: Record<BidStatus, string> = {
  [BidStatus.Submitted]: 'Your bid has been successfully submitted and is awaiting initial review.',
  [BidStatus.UnderReview]: 'The tender owner is actively reviewing your bid submission.',
  [BidStatus.Shortlisted]: 'Congratulations! Your bid has been shortlisted as a finalist.',
  [BidStatus.InterviewScheduled]: 'An interview has been arranged to discuss your bid further.',
  [BidStatus.Awarded]: '🏆 Your bid has been awarded the contract. Congratulations!',
  [BidStatus.Rejected]: 'Your bid was not selected for this tender.',
  [BidStatus.Withdrawn]: 'You withdrew this bid.',
};

// ── Route params ──────────────────────────────────────────────────────────────

interface RouteParams { bidId: string; tenderId: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function fmtCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const MyBidDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { bidId, tenderId } = route.params as RouteParams;
  const { colors, spacing, radius } = useTheme();

  const [activeTab, setActiveTab] = useState('Overview');

  const { data: bid, isLoading: bidLoading } = useGetMyBid(tenderId);
  const { data: tender, isLoading: tenderLoading } = useProfessionalTender(tenderId);
  const { mutate: withdraw, isPending: withdrawing } = useWithdrawBid();

  const isLoading = bidLoading || tenderLoading;
  const isSealed = isSealedTender(tender);
  const isBidsRevealed = (tender as any)?.status === 'revealed' || (tender as any)?.status === 'closed';
  const amountHidden = isSealed && !isBidsRevealed;

  const handleWithdraw = useCallback(() => {
    if (!bid) return;
    Alert.alert(
      'Withdraw Bid',
      'Are you sure you want to withdraw this bid? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw', style: 'destructive',
          onPress: () => withdraw(
            { tenderId, bidId: bid._id },
            { onSuccess: () => navigation.goBack() },
          ),
        },
      ],
    );
  }, [bid, tenderId, withdraw, navigation]);

  const tabs: TabConfig[] = useMemo(() => [
    { key: 'Overview', label: 'Overview', icon: 'eye-outline' },
    { key: 'Details', label: 'Details', icon: 'document-text-outline' },
    { key: 'Files', label: 'Files', icon: 'attach-outline' },
    { key: 'Tender', label: 'Tender', icon: 'business-outline' },
    { key: 'Status', label: 'Status', icon: 'time-outline' },
  ], []);

  if (isLoading) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!bid) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
        <View style={styles.fullCenter}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textMuted }]}>Bid not found.</Text>
          <Pressable onPress={() => navigation.goBack()} style={[styles.errorBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.errorBtnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderOverview = () => (
    <ScrollView contentContainerStyle={[styles.tabContent, { padding: spacing.lg, gap: spacing.md }]}>
      <View style={[styles.bidNumBanner, { backgroundColor: colors.primaryBg, borderRadius: radius.md }]}>
        <Ionicons name="document-text-outline" size={14} color={colors.primary} />
        <Text style={[styles.bidNumLabel, { color: colors.primary }]}>Bid Number</Text>
        <Text style={[styles.bidNum, { color: colors.primary }]}>{bid.bidNumber}</Text>
      </View>
      <View style={styles.badgeRow}>
        <BidStatusBadge status={bid.status} />
        <BidSealedIndicator sealed={isSealed} isBidsRevealed={isBidsRevealed} />
      </View>
      <View style={[styles.amountCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
        <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Your Bid Amount</Text>
        {amountHidden ? (
          <View style={styles.hiddenRow}>
            <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
            <Text style={[styles.hiddenText, { color: colors.textMuted }]}>Hidden until bid reveal</Text>
          </View>
        ) : (
          <Text style={[styles.amountValue, { color: colors.primary }]}>
            {fmtCurrency(bid.bidAmount, bid.currency)}
          </Text>
        )}
      </View>
      {tender && (
        <View style={[styles.infoCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
          <InfoRow label="Tender" value={(tender as any)?.data?.title ?? (tender as any)?.title} colors={colors} />
          <InfoRow label="Deadline" value={fmtDate(getSafeDeadline(tender))} colors={colors} />
          <InfoRow label="Submitted" value={fmtDate(bid.submittedAt || bid.createdAt)} colors={colors} />
        </View>
      )}
    </ScrollView>
  );

  const renderDetails = () => (
    <ScrollView contentContainerStyle={[styles.tabContent, { padding: spacing.lg, gap: spacing.md }]}>
      {bid.coverSheet && <BidCoverSheetDisplay coverSheet={bid.coverSheet} />}
      {!!bid.technicalProposal && (
        <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Technical Proposal</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>{bid.technicalProposal}</Text>
        </View>
      )}
      {bid.financialBreakdown && (
        <BidFinancialBreakdownDisplay
          items={Array.isArray(bid.financialBreakdown) ? bid.financialBreakdown : bid.financialBreakdown.items ?? []}
          currency={bid.currency}
        />
      )}
    </ScrollView>
  );

  const renderFiles = () => (
    <ScrollView contentContainerStyle={[styles.tabContent, { padding: spacing.lg }]}>
      <BidDocumentList
        documents={bid.documents ?? []}
        isBidsRevealed={isBidsRevealed}
        isOwner={false}
        tenderId={tenderId}
        bidId={bid._id}
      />
    </ScrollView>
  );

  const renderTender = () => (
    <ScrollView contentContainerStyle={[styles.tabContent, { padding: spacing.lg, gap: spacing.md }]}>
      {tender ? (
        <>
          <View style={[styles.infoCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
            <Text style={[styles.tenderTitle, { color: colors.text }]}>{(tender as any)?.data?.title ?? (tender as any)?.title ?? 'Tender'}</Text>
            {(tender as any)?.referenceNumber && (
              <Text style={[styles.tenderRef, { color: colors.textMuted }]}>Ref: {(tender as any).referenceNumber}</Text>
            )}
            <View style={{ height: spacing.md }} />
            <InfoRow label="Type" value={getSafeWorkflowType(tender) === 'closed' ? 'Sealed Bid' : 'Open Tender'} colors={colors} />
            <InfoRow label="Deadline" value={fmtDate(getSafeDeadline(tender))} colors={colors} />
            <InfoRow label="Status" value={(tender as any)?.status ?? (tender as any)?.data?.status ?? '—'} colors={colors} />
          </View>
          <Pressable
            onPress={() => navigation.navigate('ProfessionalTenderDetail', { tenderId })}
            style={[styles.viewTenderBtn, { backgroundColor: colors.primary, borderRadius: radius.md }]}
          >
            <Text style={styles.viewTenderBtnText}>View Full Tender</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
          </Pressable>
        </>
      ) : (
        <Text style={[styles.bodyText, { color: colors.textMuted }]}>Tender information not available.</Text>
      )}
    </ScrollView>
  );

  const renderStatus = () => (
    <ScrollView contentContainerStyle={[styles.tabContent, { padding: spacing.lg, gap: spacing.md }]}>
      <View style={[styles.statusDescCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
        <BidStatusBadge status={bid.status} />
        <Text style={[styles.statusDesc, { color: colors.textMuted }]}>
          {STATUS_DESCRIPTIONS[bid.status] ?? ''}
        </Text>
      </View>
      <BidStatusTimeline statusHistory={bid.statusHistory ?? []} currentStatus={bid.status} />
    </ScrollView>
  );

  const tabContent: Record<string, React.ReactNode> = {
    Overview: renderOverview(),
    Details: renderDetails(),
    Files: renderFiles(),
    Tender: renderTender(),
    Status: renderStatus(),
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <BidHeader
        bid={bid}
        tender={tender ?? { _id: tenderId, title: 'Tender', status: '', deadline: '', workflowType: 'open' }}
        viewerRole="bidder"
        onBack={() => navigation.goBack()}
      />

      {isSealed && tender && (
        <SealedBidBanner
          workflowType={getSafeWorkflowType(tender)}
          isRevealed={isBidsRevealed}
          deadline={getSafeDeadline(tender)}
        />
      )}

      <BidTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      {tabContent[activeTab]}

      {bid.status === BidStatus.Submitted && (
        <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.bgCard }]}>
          <Pressable
            onPress={handleWithdraw}
            disabled={withdrawing}
            style={({ pressed }) => [
              styles.withdrawBtn,
              { backgroundColor: colors.dangerBg, borderRadius: radius.md, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {withdrawing ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={[styles.withdrawBtnText, { color: colors.danger }]}>Withdraw Bid</Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value?: string; colors: any }> = ({ label, value, colors }) => {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
};

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(148,163,184,0.15)' },
  label: { width: 110, fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  value: { flex: 1, fontSize: 13, lineHeight: 18 },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { fontSize: 14, textAlign: 'center' },
  errorBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  errorBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  tabContent: { paddingBottom: 40 },
  bidNumBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  bidNumLabel: { fontSize: 11, fontWeight: '700', flex: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
  bidNum: { fontSize: 13, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  amountCard: { borderWidth: 1, padding: 16, gap: 6 },
  amountLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  amountValue: { fontSize: 22, fontWeight: '800' },
  hiddenRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hiddenText: { fontSize: 13, fontStyle: 'italic' },
  infoCard: { borderWidth: 1, padding: 14 },
  sectionCard: { borderWidth: 1, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  bodyText: { fontSize: 13, lineHeight: 19 },
  tenderTitle: { fontSize: 16, fontWeight: '700', lineHeight: 21, marginBottom: 2 },
  tenderRef: { fontSize: 11 },
  viewTenderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, minHeight: 48 },
  viewTenderBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  statusDescCard: { borderWidth: 1, padding: 14, gap: 10 },
  statusDesc: { fontSize: 13, lineHeight: 19 },
  bottomBar: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  withdrawBtn: { paddingVertical: 13, alignItems: 'center' },
  withdrawBtnText: { fontSize: 14, fontWeight: '700' },
});

export default MyBidDetailScreen;