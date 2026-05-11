// src/screens/company/bids/MyBidDetailScreen.tsx
// 5-tab bidder view of their own submitted bid.
// Tabs: Overview | Details | Files | Tender | Status
// Header right: Withdraw button (only if status=submitted)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, ActivityIndicator,
  StyleSheet, TextStyle,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../../store/themeStore';
import { useGetMyBid, useWithdrawBid } from '../../../hooks/useBid';
import { useProfessionalTender } from '../../../hooks/useProfessionalTender';
import { BidStatusBadge } from '../../../components/bids/BidStatusBadge';
import { BidSealedIndicator } from '../../../components/bids/BidSealedIndicator';
import { BidCoverSheetDisplay } from '../../../components/bids/BidCoverSheetDisplay';
import { BidFinancialBreakdownDisplay } from '../../../components/bids/BidFinancialBreakdownDisplay';
import { BidDocumentList } from '../../../components/bids/BidDocumentList';
import { BidStatusTimeline } from '../../../components/bids/BidStatusTimeline';
import { BidStatus, Bid } from '../../../types/bid';

// ── Status descriptions ────────────────────────────────────────────────────────

const STATUS_DESCRIPTIONS: Record<BidStatus, string> = {
  [BidStatus.Submitted]:           'Your bid has been successfully submitted and is awaiting initial review by the tender owner.',
  [BidStatus.UnderReview]:         'The tender owner is actively reviewing your bid submission.',
  [BidStatus.Shortlisted]:         'Congratulations! Your bid has been shortlisted as a finalist.',
  [BidStatus.InterviewScheduled]:  'An interview or meeting has been arranged to discuss your bid further.',
  [BidStatus.Awarded]:             '🏆 Your bid has been awarded the contract. Congratulations!',
  [BidStatus.Rejected]:            'Your bid was not selected for this tender.',
  [BidStatus.Withdrawn]:           'You withdrew this bid.',
};

// ── Route params ──────────────────────────────────────────────────────────────

interface RouteParams { bidId: string; tenderId: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Shared palette ─────────────────────────────────────────────────────────────

function usePalette(isDark: boolean) {
  return {
    bg:         isDark ? '#0F172A' : '#F8FAFC',
    card:       isDark ? '#1E293B' : '#FFFFFF',
    border:     isDark ? '#334155' : '#E2E8F0',
    text:       isDark ? '#F1F5F9' : '#0F172A',
    muted:      isDark ? '#94A3B8' : '#64748B',
    accent:     '#F1BB03',
    accentDark: '#0A2540',
    tabActive:  '#0A2540',
    tabActiveFg:'#FFFFFF',
    tabInactive: isDark ? '#334155' : '#F1F5F9',
    tabInactiveFg: isDark ? '#94A3B8' : '#64748B',
    primary:    '#0A2540',
    danger:     '#EF4444',
    amountBg:   isDark ? '#162032' : '#F8FAFC',
    bidNumBg:   isDark ? '#162032' : '#EFF6FF',
    bidNumText: isDark ? '#93C5FD' : '#1E40AF',
  };
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

type TabId = 'Overview' | 'Details' | 'Files' | 'Tender' | 'Status';
const TABS: TabId[] = ['Overview', 'Details', 'Files', 'Tender', 'Status'];

// ── Component ─────────────────────────────────────────────────────────────────

export const MyBidDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { bidId, tenderId } = route.params as RouteParams;

  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = usePalette(isDark);

  const [activeTab, setActiveTab] = useState<TabId>('Overview');

  const { data: bid, isLoading: bidLoading } = useGetMyBid(tenderId);
  const { data: tender, isLoading: tenderLoading } = useProfessionalTender(tenderId);
  const { mutate: withdraw, isPending: withdrawing } = useWithdrawBid();

  const isLoading = bidLoading || tenderLoading;

  // ── Sealed state ──────────────────────────────────────────────────────────
  const isSealed = bid?.sealed ?? false;
  const isBidsRevealed =
    tender?.status === 'revealed' || tender?.status === 'closed';
  const amountHidden = isSealed && !isBidsRevealed;

  // ── Withdraw handler ──────────────────────────────────────────────────────
  const handleWithdraw = useCallback(() => {
    if (!bid) return;
    Alert.alert(
      'Withdraw Bid',
      'Are you sure you want to withdraw this bid? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () =>
            withdraw(
              { tenderId, bidId: bid._id },
              { onSuccess: () => navigation.goBack() },
            ),
        },
      ],
    );
  }, [bid, tenderId, withdraw, navigation]);

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (!bid) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: palette.bg }]}>
        <Ionicons name="alert-circle-outline" size={36} color={palette.muted} />
        <Text style={[styles.errorText, { color: palette.muted }]}>Bid not found.</Text>
        <Pressable onPress={() => navigation.goBack()} style={[styles.errorBtn, { backgroundColor: palette.primary }]}>
          <Text style={styles.errorBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 1 — OVERVIEW
  // ─────────────────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Bid number */}
      <View style={[styles.bidNumBanner, { backgroundColor: palette.bidNumBg }]}>
        <Ionicons name="document-text-outline" size={14} color={palette.bidNumText} />
        <Text style={[styles.bidNumLabel, { color: palette.bidNumText }]}>Bid Number</Text>
        <Text style={[styles.bidNum, { color: palette.bidNumText }]}>{bid.bidNumber}</Text>
      </View>

      {/* Status + sealed row */}
      <View style={styles.badgeRow}>
        <BidStatusBadge status={bid.status} />
        <BidSealedIndicator sealed={isSealed} isBidsRevealed={isBidsRevealed} />
      </View>

      {/* Bid amount */}
      <View style={[styles.amountCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.amountLabel, { color: palette.muted }]}>Your Bid Amount</Text>
        {amountHidden ? (
          <View style={styles.hiddenRow}>
            <Ionicons name="lock-closed" size={14} color={palette.muted} />
            <Text style={[styles.hiddenText, { color: palette.muted }]}>Hidden until bid reveal</Text>
          </View>
        ) : (
          <Text style={[styles.amountValue, { color: palette.accentDark }]}>
            {fmtCurrency(bid.bidAmount, bid.currency)}
          </Text>
        )}
      </View>

      {/* Tender context */}
      {tender && (
        <View style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <InfoRow label="Tender" value={tender.title} textColor={palette.text} mutedColor={palette.muted} />
          <InfoRow label="Deadline" value={fmtDate(tender.deadline)} textColor={palette.text} mutedColor={palette.muted} />
          <InfoRow label="Submitted" value={fmtDate(bid.createdAt)} textColor={palette.text} mutedColor={palette.muted} />
        </View>
      )}
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 2 — DETAILS
  // ─────────────────────────────────────────────────────────────────────────
  const renderDetails = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {bid.coverSheet && <BidCoverSheetDisplay coverSheet={bid.coverSheet} />}

      {!!bid.technicalProposal && (
        <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Technical Proposal</Text>
          <Text style={[styles.bodyText, { color: palette.muted }]}>{bid.technicalProposal}</Text>
        </View>
      )}

      {bid.financialBreakdown?.length > 0 && (
        <BidFinancialBreakdownDisplay items={bid.financialBreakdown} currency={bid.currency} />
      )}
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 3 — FILES
  // ─────────────────────────────────────────────────────────────────────────
  const renderFiles = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <BidDocumentList
        documents={bid.documents ?? []}
        isBidsRevealed={isBidsRevealed}
        isOwner={false}
        tenderId={tenderId}
        bidId={bid._id}
      />
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 4 — TENDER
  // ─────────────────────────────────────────────────────────────────────────
  const renderTender = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {tender ? (
        <>
          <View style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.tenderTitle, { color: palette.text }]}>{tender.title}</Text>
            {tender.referenceNumber && (
              <Text style={[styles.tenderRef, { color: palette.muted }]}>Ref: {tender.referenceNumber}</Text>
            )}
            <View style={{ height: 12 }} />
            <InfoRow label="Category" value={tender.procurementCategory?.replace(/_/g, ' ')} textColor={palette.text} mutedColor={palette.muted} />
            <InfoRow label="Type" value={tender.tenderType?.replace(/_/g, ' ')} textColor={palette.text} mutedColor={palette.muted} />
            <InfoRow label="Deadline" value={fmtDate(tender.deadline)} textColor={palette.text} mutedColor={palette.muted} />
            <InfoRow label="Status" value={tender.status} textColor={palette.text} mutedColor={palette.muted} />
            <InfoRow label="Workflow" value={tender.workflowType === 'closed' ? 'Sealed Bid' : 'Open Tender'} textColor={palette.text} mutedColor={palette.muted} />
          </View>

          <Pressable
            onPress={() => navigation.navigate('ProfessionalTenderDetail', { tenderId })}
            style={[styles.viewTenderBtn, { backgroundColor: palette.accentDark }]}
          >
            <Text style={styles.viewTenderBtnText}>View Full Tender</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </>
      ) : (
        <Text style={[styles.bodyText, { color: palette.muted }]}>Tender information not available.</Text>
      )}
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 5 — STATUS
  // ─────────────────────────────────────────────────────────────────────────
  const renderStatus = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Status description */}
      <View style={[styles.statusDescCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <BidStatusBadge status={bid.status} />
        <Text style={[styles.statusDesc, { color: palette.muted }]}>
          {STATUS_DESCRIPTIONS[bid.status] ?? ''}
        </Text>
      </View>

      {/* Timeline */}
      <BidStatusTimeline
        statusHistory={bid.statusHistory ?? []}
        currentStatus={bid.status}
      />
    </ScrollView>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.card, borderBottomColor: palette.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.text }]} numberOfLines={1}>Bid Detail</Text>
        {bid.status === BidStatus.Submitted ? (
          <Pressable onPress={handleWithdraw} disabled={withdrawing} style={styles.withdrawBtn}>
            {withdrawing
              ? <ActivityIndicator size="small" color={palette.danger} />
              : <Text style={[styles.withdrawText, { color: palette.danger }]}>Withdraw</Text>}
          </Pressable>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { borderBottomColor: palette.border, backgroundColor: palette.card }]}>
        <View style={styles.tabBarInner}>
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabBtn,
                  { backgroundColor: active ? palette.tabActive : 'transparent' },
                ]}
              >
                <Text style={[styles.tabBtnText, { color: active ? palette.tabActiveFg : palette.muted }]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Tab content */}
      {activeTab === 'Overview' && renderOverview()}
      {activeTab === 'Details'  && renderDetails()}
      {activeTab === 'Files'    && renderFiles()}
      {activeTab === 'Tender'   && renderTender()}
      {activeTab === 'Status'   && renderStatus()}
    </SafeAreaView>
  );
};

// ── Shared sub-component ──────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value?: string; textColor: string; mutedColor: string }> = ({
  label, value, textColor, mutedColor,
}) => {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, { color: mutedColor }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: textColor }]}>{value}</Text>
    </View>
  );
};

const infoStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(148,163,184,0.15)' },
  label: { width: 110, fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  value: { flex: 1, fontSize: 13, lineHeight: 18 },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText:    { fontSize: 14, textAlign: 'center' },
  errorBtn:     { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  errorBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, gap: 8,
  },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerTitle:  { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  withdrawBtn:  { width: 80, alignItems: 'flex-end', paddingRight: 4, justifyContent: 'center', minHeight: 40 },
  withdrawText: { fontSize: 13, fontWeight: '700' },

  tabBar:       { flexGrow: 0, borderBottomWidth: 1 },
  tabBarInner:  { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  tabBtn:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, minHeight: 30, justifyContent: 'center' },
  tabBtnText:   { fontSize: 12, fontWeight: '700' },

  tabContent:   { padding: 14, gap: 12, paddingBottom: 40 },

  bidNumBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10,
  },
  bidNumLabel:  { fontSize: 11, fontWeight: '700', flex: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
  bidNum:       { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },

  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  amountCard: {
    borderRadius: 14, borderWidth: 1,
    padding: 16, gap: 6,
  },
  amountLabel:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  amountValue:  { fontSize: 22, fontWeight: '800' },
  hiddenRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hiddenText:   { fontSize: 13, fontStyle: 'italic' },

  infoCard:     { borderRadius: 14, borderWidth: 1, padding: 14, gap: 0 },
  sectionCard:  { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  bodyText:     { fontSize: 13, lineHeight: 19 },

  tenderTitle:  { fontSize: 16, fontWeight: '700', lineHeight: 21, marginBottom: 2 },
  tenderRef:    { fontSize: 11, fontVariant: ['tabular-nums'] },

  viewTenderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12, minHeight: 48,
  },
  viewTenderBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  statusDescCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  statusDesc:     { fontSize: 13, lineHeight: 19 },
});

export default MyBidDetailScreen;
