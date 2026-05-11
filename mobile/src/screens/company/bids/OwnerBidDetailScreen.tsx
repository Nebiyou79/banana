// src/screens/company/bids/OwnerBidDetailScreen.tsx
// 4-tab owner review of a specific bid.
// Tabs: Overview | Company | Documents | Status
// Status tab: valid-transition action buttons + owner notes + confirm sheet.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, ActivityIndicator,
  TextInput, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../../store/themeStore';
import { useGetBids, useUpdateBidStatus } from '../../../hooks/useBid';
import { useProfessionalTender } from '../../../hooks/useProfessionalTender';
import { BidStatusBadge } from '../../../components/bids/BidStatusBadge';
import { BidSealedIndicator } from '../../../components/bids/BidSealedIndicator';
import { BidCoverSheetDisplay } from '../../../components/bids/BidCoverSheetDisplay';
import { BidDocumentList } from '../../../components/bids/BidDocumentList';
import { BidStatusTimeline } from '../../../components/bids/BidStatusTimeline';
import SealedBidBanner from '../../../components/professionalTenders/SealedBidBanner';
import { areSealedBidsViewable } from '../../../types/professionalTender';
import { Bid, BidStatus } from '../../../types/bid';

// ── Route params ──────────────────────────────────────────────────────────────

interface RouteParams { bidId: string; tenderId: string }

// ── Status transitions map ────────────────────────────────────────────────────
// Only show buttons for valid next states from current state.

const VALID_TRANSITIONS: Partial<Record<BidStatus, BidStatus[]>> = {
  [BidStatus.Submitted]:          [BidStatus.UnderReview, BidStatus.Rejected],
  [BidStatus.UnderReview]:        [BidStatus.Shortlisted, BidStatus.Rejected],
  [BidStatus.Shortlisted]:        [BidStatus.InterviewScheduled, BidStatus.Awarded, BidStatus.Rejected],
  [BidStatus.InterviewScheduled]: [BidStatus.Awarded, BidStatus.Rejected],
};

interface ActionConfig {
  status: BidStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
  confirmTitle: string;
  confirmMsg: string;
}

const ACTION_CONFIGS: Record<BidStatus, ActionConfig> = {
  [BidStatus.UnderReview]:        { status: BidStatus.UnderReview,        label: 'Move to Under Review', icon: 'search-outline',      bg: '#DBEAFE', fg: '#1E40AF', confirmTitle: 'Move to Under Review?',    confirmMsg: 'This bid will be marked as actively under review.' },
  [BidStatus.Shortlisted]:        { status: BidStatus.Shortlisted,        label: 'Shortlist',            icon: 'star-outline',        bg: '#CCFBF1', fg: '#0F766E', confirmTitle: 'Shortlist this bid?',      confirmMsg: 'This bid will be added to the shortlist.' },
  [BidStatus.InterviewScheduled]: { status: BidStatus.InterviewScheduled, label: 'Schedule Interview',   icon: 'calendar-outline',    bg: '#F3E8FF', fg: '#6B21A8', confirmTitle: 'Schedule an interview?',   confirmMsg: 'This will mark an interview as scheduled with this bidder.' },
  [BidStatus.Awarded]:            { status: BidStatus.Awarded,            label: 'Award Contract',       icon: 'trophy-outline',      bg: '#FEF9C3', fg: '#854D0E', confirmTitle: 'Award this contract? 🏆',  confirmMsg: 'This action awards the contract. Other bids will remain unchanged. This cannot be undone.' },
  [BidStatus.Rejected]:           { status: BidStatus.Rejected,           label: 'Reject',               icon: 'close-circle-outline', bg: '#FEE2E2', fg: '#991B1B', confirmTitle: 'Reject this bid?',         confirmMsg: 'This bid will be marked as rejected.' },
  [BidStatus.Submitted]: { status: BidStatus.Submitted, label: 'Submitted', icon: 'paper-plane-outline', bg: '#FEF3C7', fg: '#92400E', confirmTitle: '', confirmMsg: '' },
  [BidStatus.Withdrawn]: { status: BidStatus.Withdrawn, label: 'Withdrawn', icon: 'arrow-undo-circle-outline', bg: '#F3F4F6', fg: '#4B5563', confirmTitle: '', confirmMsg: '' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getBidderName(bid: Bid): string {
  if (bid.coverSheet?.companyName) return bid.coverSheet.companyName;
  if (typeof bid.bidderCompany === 'object' && bid.bidderCompany !== null && 'name' in bid.bidderCompany)
    return (bid.bidderCompany as any).name;
  return 'Company';
}

// ── Tab config ────────────────────────────────────────────────────────────────

type TabId = 'Overview' | 'Company' | 'Documents' | 'Status';
const TABS: TabId[] = ['Overview', 'Company', 'Documents', 'Status'];

// ── Component ─────────────────────────────────────────────────────────────────

export const OwnerBidDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { bidId, tenderId } = route.params as RouteParams;

  const isDark = useThemeStore((s) => s.theme.isDark);
  const [activeTab, setActiveTab] = useState<TabId>('Overview');
  const [ownerNotes, setOwnerNotes] = useState('');

  const palette = {
    bg:          isDark ? '#0F172A' : '#F8FAFC',
    card:        isDark ? '#1E293B' : '#FFFFFF',
    border:      isDark ? '#334155' : '#E2E8F0',
    text:        isDark ? '#F1F5F9' : '#0F172A',
    muted:       isDark ? '#94A3B8' : '#64748B',
    accent:      '#F1BB03',
    accentDark:  '#0A2540',
    tabActive:   '#0A2540',
    tabActiveFg: '#FFFFFF',
    inputBg:     isDark ? '#0F172A' : '#F8FAFC',
    inputBorder: isDark ? '#475569' : '#CBD5E1',
    placeholder: isDark ? '#475569' : '#94A3B8',
    bidNumBg:    isDark ? '#162032' : '#EFF6FF',
    bidNumText:  isDark ? '#93C5FD' : '#1E40AF',
    labelBg:     isDark ? '#162032' : '#F1F5F9',
  };

  const { data: bidsData, isLoading: bidsLoading, refetch } = useGetBids(tenderId);
  const { data: tender, isLoading: tenderLoading }           = useProfessionalTender(tenderId);
  const { mutate: updateStatus, isPending: updating }        = useUpdateBidStatus();

  const isLoading = bidsLoading || tenderLoading;

  // Find the specific bid from the list
  const bid: Bid | undefined = bidsData?.bids?.find((b) => b._id === bidId) as Bid | undefined;

  const isSealed      = bid?.sealed ?? false;
  const isBidsRevealed = bidsData?.isBidsRevealed ?? false;
  const amountHidden  = isSealed && !isBidsRevealed;

  // Populate notes from bid on first load
  React.useEffect(() => {
    if (bid?.ownerNotes && !ownerNotes) setOwnerNotes(bid.ownerNotes);
  }, [bid]);

  // ── Status action handler ─────────────────────────────────────────────────
  const handleStatusAction = useCallback((nextStatus: BidStatus) => {
    const cfg = ACTION_CONFIGS[nextStatus];
    if (!cfg.confirmTitle) return;

    Alert.alert(
      cfg.confirmTitle,
      cfg.confirmMsg + (ownerNotes.trim() ? `\n\nNotes: "${ownerNotes.trim()}"` : ''),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: cfg.label,
          style: nextStatus === BidStatus.Rejected ? 'destructive' : 'default',
          onPress: () =>
            updateStatus(
              { tenderId, bidId, status: nextStatus, ownerNotes: ownerNotes.trim() || undefined },
              { onSuccess: () => refetch() },
            ),
        },
      ],
    );
  }, [ownerNotes, tenderId, bidId, updateStatus, refetch]);

  // ── Loading / error ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={palette.accentDark} />
      </View>
    );
  }

  if (!bid) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: palette.bg }]}>
        <Ionicons name="alert-circle-outline" size={36} color={palette.muted} />
        <Text style={[styles.errorText, { color: palette.muted }]}>Bid not found.</Text>
        <Pressable onPress={() => navigation.goBack()} style={[styles.errorBtn, { backgroundColor: palette.accentDark }]}>
          <Text style={styles.errorBtnFg}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const validNextStates = VALID_TRANSITIONS[bid.status] ?? [];

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 1 — OVERVIEW
  // ─────────────────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Sealed banner */}
      {isSealed && tender && (
        <SealedBidBanner
          workflowType={tender.workflowType}
          status={tender.status}
          isRevealed={isBidsRevealed}
          deadline={tender.deadline}
          isOwner
        />
      )}

      {/* Bid number */}
      <View style={[styles.bidNumBanner, { backgroundColor: palette.bidNumBg }]}>
        <Ionicons name="document-text-outline" size={14} color={palette.bidNumText} />
        <Text style={[styles.bidNumLabel, { color: palette.bidNumText }]}>Bid Number</Text>
        <Text style={[styles.bidNum, { color: palette.bidNumText }]}>{bid.bidNumber}</Text>
      </View>

      {/* Status + Sealed row */}
      <View style={styles.badgeRow}>
        <BidStatusBadge status={bid.status} />
        <BidSealedIndicator sealed={isSealed} isBidsRevealed={isBidsRevealed} />
      </View>

      {/* Company + rep */}
      <View style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.companyName, { color: palette.text }]}>{getBidderName(bid)}</Text>
        {bid.coverSheet?.representative && (
          <Text style={[styles.repName, { color: palette.muted }]}>
            {bid.coverSheet.representative}
            {bid.coverSheet.representativeTitle ? ` — ${bid.coverSheet.representativeTitle}` : ''}
          </Text>
        )}
        <View style={{ height: 8 }} />
        {!amountHidden ? (
          <View style={[styles.amountRow, { backgroundColor: palette.labelBg }]}>
            <Text style={[styles.amountLabel, { color: palette.muted }]}>Bid Amount</Text>
            <Text style={[styles.amountValue, { color: palette.accentDark }]}>
              {fmtCurrency(bid.bidAmount, bid.currency)}
            </Text>
          </View>
        ) : (
          <View style={[styles.amountRow, { backgroundColor: palette.labelBg }]}>
            <Ionicons name="lock-closed" size={13} color={palette.muted} />
            <Text style={[styles.amountLabel, { color: palette.muted }]}>Hidden until reveal</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 2 — COMPANY
  // ─────────────────────────────────────────────────────────────────────────
  const renderCompany = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {bid.coverSheet && <BidCoverSheetDisplay coverSheet={bid.coverSheet} />}
      {!!bid.technicalProposal && (
        <View style={[styles.techCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.techTitle, { color: palette.text }]}>Technical Proposal</Text>
          <Text style={[styles.techBody, { color: palette.muted }]}>{bid.technicalProposal}</Text>
        </View>
      )}
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 3 — DOCUMENTS
  // ─────────────────────────────────────────────────────────────────────────
  const renderDocuments = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <BidDocumentList
        documents={bid.documents ?? []}
        isBidsRevealed={isBidsRevealed}
        isOwner={true}
        tenderId={tenderId}
        bidId={bid._id}
      />
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 4 — STATUS
  // ─────────────────────────────────────────────────────────────────────────
  const renderStatusTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Current status */}
      <View style={[styles.currentStatusCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.currentStatusLabel, { color: palette.muted }]}>Current Status</Text>
        <BidStatusBadge status={bid.status} />
      </View>

      {/* Owner notes input */}
      <View style={[styles.notesCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.notesLabel, { color: palette.muted }]}>Owner Notes</Text>
        <TextInput
          value={ownerNotes}
          onChangeText={setOwnerNotes}
          placeholder="Add notes about this bid (shared with status update)…"
          placeholderTextColor={palette.placeholder}
          multiline
          textAlignVertical="top"
          style={[styles.notesInput, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder, color: palette.text }]}
        />
      </View>

      {/* Action buttons — only valid transitions */}
      {validNextStates.length > 0 && (
        <View style={styles.actionsCard}>
          <Text style={[styles.actionsLabel, { color: palette.muted }]}>Update Status</Text>
          <View style={styles.actionsList}>
            {validNextStates.map((nextStatus) => {
              const cfg = ACTION_CONFIGS[nextStatus];
              return (
                <Pressable
                  key={nextStatus}
                  onPress={() => handleStatusAction(nextStatus)}
                  disabled={updating}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: cfg.bg, opacity: pressed || updating ? 0.7 : 1 },
                  ]}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color={cfg.fg} />
                  ) : (
                    <>
                      <Ionicons name={cfg.icon} size={16} color={cfg.fg} />
                      <Text style={[styles.actionBtnText, { color: cfg.fg }]}>{cfg.label}</Text>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Timeline */}
      <View style={{ marginTop: 4 }}>
        <Text style={[styles.actionsLabel, { color: palette.muted, marginBottom: 10 }]}>Status History</Text>
        <BidStatusTimeline
          statusHistory={bid.statusHistory ?? []}
          currentStatus={bid.status}
        />
      </View>
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
        <Text style={[styles.headerTitle, { color: palette.text }]} numberOfLines={1}>
          {getBidderName(bid)}
        </Text>
        <View style={{ width: 40 }} />
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
                style={[styles.tabBtn, { backgroundColor: active ? palette.tabActive : 'transparent' }]}
              >
                <Text style={[styles.tabBtnText, { color: active ? palette.tabActiveFg : palette.muted }]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {activeTab === 'Overview'   && renderOverview()}
      {activeTab === 'Company'    && renderCompany()}
      {activeTab === 'Documents'  && renderDocuments()}
      {activeTab === 'Status'     && renderStatusTab()}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:       { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText:  { fontSize: 14 },
  errorBtn:   { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  errorBtnFg: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', textAlign: 'center' },

  tabBar:      { flexGrow: 0, borderBottomWidth: 1 },
  tabBarInner: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  tabBtn:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, justifyContent: 'center' },
  tabBtnText:  { fontSize: 12, fontWeight: '700' },

  tabContent:  { padding: 14, gap: 12, paddingBottom: 40 },

  bidNumBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  bidNumLabel:  { fontSize: 11, fontWeight: '700', flex: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
  bidNum:       { fontSize: 13, fontWeight: '800' },

  badgeRow:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  infoCard:     { borderRadius: 14, borderWidth: 1, padding: 14 },
  companyName:  { fontSize: 17, fontWeight: '800', marginBottom: 3 },
  repName:      { fontSize: 13 },
  amountRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
  amountLabel:  { fontSize: 12, fontWeight: '600' },
  amountValue:  { flex: 1, textAlign: 'right', fontSize: 16, fontWeight: '800' },

  techCard:  { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  techTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  techBody:  { fontSize: 13, lineHeight: 19 },

  currentStatusCard:  { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  currentStatusLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  notesCard:   { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  notesLabel:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  notesInput:  { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 13, lineHeight: 19, minHeight: 90 },

  actionsCard:   { gap: 10 },
  actionsLabel:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  actionsList:   { gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 12, minHeight: 48,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
});

export default OwnerBidDetailScreen;
