// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/company/professionalTenders/IncomingBidsScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Owner-side bid list for one tender.
//
//  ⚠ Sealed-bid integrity:
//   • For closed workflow + status not in (revealed, closed): bid amounts and
//     bidder identities are HIDDEN.  Only the count + sealed status visible.
//   • The single gate is areSealedBidsViewable(status, workflowType).
//   • Defense-in-depth — backend already masks, but client gates too.
//
//  When `closed` workflow is at `deadline_reached`: show inline Reveal CTA.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../../store/themeStore';
import {
  useProfessionalTender,
  useRevealProfessionalTender,
  useTenderBids,
} from '../../../hooks/useProfessionalTender';
import SealedBidBanner from '../../../components/professionalTenders/SealedBidBanner';
import {
  areSealedBidsViewable,
  type ProfessionalTenderBid,
} from '../../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  ROUTE PARAMS
// ═════════════════════════════════════════════════════════════════════════════

interface RouteParams {
  tenderId: string;
}

// ═════════════════════════════════════════════════════════════════════════════
//  STATS BAR
// ═════════════════════════════════════════════════════════════════════════════

interface BidStats {
  total: number;
  submitted: number;
  underReview: number;
  shortlisted: number;
  awarded: number;
  rejected: number;
}

const computeStats = (bids: ProfessionalTenderBid[]): BidStats => {
  const stats: BidStats = { total: bids.length, submitted: 0, underReview: 0, shortlisted: 0, awarded: 0, rejected: 0 };
  for (const b of bids) {
    switch (b.status) {
      case 'submitted':       stats.submitted++; break;
      case 'under_review':    stats.underReview++; break;
      case 'shortlisted':     stats.shortlisted++; break;
      case 'awarded':         stats.awarded++; break;
      case 'rejected':        stats.rejected++; break;
    }
  }
  return stats;
};

const StatPill: React.FC<{ label: string; value: number; tone: 'neutral' | 'blue' | 'amber' | 'purple' | 'green' | 'red' }> = ({
  label, value, tone,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = (() => {
    if (isDark) {
      switch (tone) {
        case 'neutral': return { bg: 'rgba(148,163,184,0.15)', fg: '#CBD5E1' };
        case 'blue':    return { bg: 'rgba(59,130,246,0.18)',  fg: '#60A5FA' };
        case 'amber':   return { bg: 'rgba(245,158,11,0.18)',  fg: '#FCD34D' };
        case 'purple':  return { bg: 'rgba(168,85,247,0.18)',  fg: '#D8B4FE' };
        case 'green':   return { bg: 'rgba(34,197,94,0.15)',   fg: '#34D399' };
        case 'red':     return { bg: 'rgba(248,113,113,0.18)', fg: '#F87171' };
      }
    }
    switch (tone) {
      case 'neutral': return { bg: '#F1F5F9', fg: '#475569' };
      case 'blue':    return { bg: '#DBEAFE', fg: '#1D4ED8' };
      case 'amber':   return { bg: '#FEF3C7', fg: '#B45309' };
      case 'purple':  return { bg: '#EDE9FE', fg: '#6D28D9' };
      case 'green':   return { bg: '#D1FAE5', fg: '#047857' };
      case 'red':     return { bg: '#FEE2E2', fg: '#B91C1C' };
    }
  })();
  return (
    <View style={[pillStyles.root, { backgroundColor: palette.bg }]}>
      <Text style={[pillStyles.value, { color: palette.fg }]}>{value}</Text>
      <Text style={[pillStyles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  BID CARD — hard-gates sealed contents
// ═════════════════════════════════════════════════════════════════════════════

const BID_STATUS_LABELS: Record<string, { label: string; tone: Parameters<typeof StatPill>[0]['tone'] }> = {
  submitted:           { label: 'Submitted',           tone: 'blue' },
  under_review:        { label: 'Under Review',        tone: 'amber' },
  shortlisted:         { label: 'Shortlisted',         tone: 'purple' },
  interview_scheduled: { label: 'Interview',           tone: 'purple' },
  awarded:             { label: 'Awarded',             tone: 'green' },
  rejected:            { label: 'Rejected',            tone: 'red' },
  withdrawn:           { label: 'Withdrawn',           tone: 'neutral' },
};

const formatAmount = (amount?: number, currency: string = 'ETB'): string => {
  if (amount === undefined || amount === null) return '—';
  return `${amount.toLocaleString()} ${currency}`;
};

const resolveBidderName = (bid: ProfessionalTenderBid): string => {
  if (typeof bid.bidderCompany === 'object' && bid.bidderCompany?.name) {
    return bid.bidderCompany.name;
  }
  return 'Bidder';
};

// Inline status badge — shares tones with StatPill but renders a label only
const BidStatusBadge: React.FC<{
  label: string;
  tone: 'neutral' | 'blue' | 'amber' | 'purple' | 'green' | 'red';
}> = ({ label, tone }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = (() => {
    if (isDark) {
      switch (tone) {
        case 'neutral': return { bg: 'rgba(148,163,184,0.15)', fg: '#CBD5E1' };
        case 'blue':    return { bg: 'rgba(59,130,246,0.18)',  fg: '#60A5FA' };
        case 'amber':   return { bg: 'rgba(245,158,11,0.18)',  fg: '#FCD34D' };
        case 'purple':  return { bg: 'rgba(168,85,247,0.18)',  fg: '#D8B4FE' };
        case 'green':   return { bg: 'rgba(34,197,94,0.15)',   fg: '#34D399' };
        case 'red':     return { bg: 'rgba(248,113,113,0.18)', fg: '#F87171' };
      }
    }
    switch (tone) {
      case 'neutral': return { bg: '#F1F5F9', fg: '#475569' };
      case 'blue':    return { bg: '#DBEAFE', fg: '#1D4ED8' };
      case 'amber':   return { bg: '#FEF3C7', fg: '#B45309' };
      case 'purple':  return { bg: '#EDE9FE', fg: '#6D28D9' };
      case 'green':   return { bg: '#D1FAE5', fg: '#047857' };
      case 'red':     return { bg: '#FEE2E2', fg: '#B91C1C' };
    }
  })();
  return (
    <View style={[badgeStyles.root, { backgroundColor: palette.bg }]}>
      <Text style={[badgeStyles.label, { color: palette.fg }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

const BidCard: React.FC<{
  bid: ProfessionalTenderBid;
  index: number;
  contentsHidden: boolean;
}> = ({ bid, index, contentsHidden }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { bg: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', subtle: '#64748B', accentBg: '#0F172A' }
    : { bg: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', subtle: '#94A3B8', accentBg: '#F1F5F9' };

  const statusMeta = BID_STATUS_LABELS[bid.status] ?? { label: bid.status, tone: 'neutral' as const };
  const submittedAt = new Date(bid.submittedAt);

  return (
    <View
      style={[
        cardStyles.root,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      {/* Header: index + bidder name (or sealed) */}
      <View style={cardStyles.head}>
        <View style={[cardStyles.indexBadge, { backgroundColor: palette.accentBg }]}>
          <Text style={[cardStyles.indexText, { color: palette.muted }]}>#{index + 1}</Text>
        </View>
        <View style={cardStyles.headText}>
          {contentsHidden ? (
            <View style={cardStyles.sealedRow}>
              <Ionicons name="lock-closed" size={13} color={palette.muted} />
              <Text style={[cardStyles.sealedLabel, { color: palette.muted }]}>
                Sealed bidder
              </Text>
            </View>
          ) : (
            <Text style={[cardStyles.bidderName, { color: palette.text }]} numberOfLines={1}>
              {resolveBidderName(bid)}
            </Text>
          )}
          <Text style={[cardStyles.submitted, { color: palette.subtle }]}>
            Submitted {submittedAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
            {' · '}
            {submittedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <BidStatusBadge label={statusMeta.label} tone={statusMeta.tone} />
      </View>

      {/* Amount row — hidden when sealed */}
      <View style={[cardStyles.amountRow, { borderTopColor: palette.border }]}>
        <Text style={[cardStyles.amountLabel, { color: palette.muted }]}>BID AMOUNT</Text>
        {contentsHidden ? (
          <View style={cardStyles.sealedAmount}>
            <Ionicons name="lock-closed" size={14} color={palette.muted} />
            <Text style={[cardStyles.sealedAmountText, { color: palette.muted }]}>
              Hidden until reveal
            </Text>
          </View>
        ) : (
          <Text style={[cardStyles.amountValue, { color: palette.text }]}>
            {formatAmount(bid.bidAmount, bid.currency ?? 'ETB')}
          </Text>
        )}
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  EMPTY STATE
// ═════════════════════════════════════════════════════════════════════════════

const EmptyBids: React.FC<{ message: string; submessage?: string }> = ({ message, submessage }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { iconBg: '#1E293B', text: '#F1F5F9', muted: '#94A3B8' }
    : { iconBg: '#F1F5F9', text: '#0F172A', muted: '#64748B' };
  return (
    <View style={emptyStyles.root}>
      <View style={[emptyStyles.iconWrap, { backgroundColor: palette.iconBg }]}>
        <Ionicons name="people-outline" size={32} color={palette.muted} />
      </View>
      <Text style={[emptyStyles.title, { color: palette.text }]}>{message}</Text>
      {!!submessage && (
        <Text style={[emptyStyles.desc, { color: palette.muted }]}>{submessage}</Text>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════════

export const IncomingBidsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: RouteParams }>();
  const isDark = useThemeStore((s) => s.theme.isDark);
  const tenderId = route.params?.tenderId;

  const palette = useMemo(
    () => isDark
      ? { background: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', primary: '#60A5FA', primaryFg: '#0F172A' }
      : { background: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', primary: '#2563EB', primaryFg: '#FFFFFF' },
    [isDark],
  );

  const { data: tenderData, isLoading: tenderLoading, refetch: refetchTender } =
    useProfessionalTender(tenderId);
  const tender = tenderData?.data;

  // Compute whether to even fetch the bids list
  const sealedViewable = tender
    ? areSealedBidsViewable(tender.status, tender.workflowType)
    : true;
  const bidsAreFetchable = !!tender && (tender.workflowType === 'open' || sealedViewable);

  const {
    data: bidsData,
    isLoading: bidsLoading,
    refetch: refetchBids,
  } = useTenderBids(tenderId, { enabled: bidsAreFetchable });

  const revealMut = useRevealProfessionalTender();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchTender(),
      bidsAreFetchable ? refetchBids() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [refetchTender, refetchBids, bidsAreFetchable]);

  const handleReveal = useCallback(() => {
    if (!tenderId) return;
    Alert.alert(
      'Reveal sealed bids?',
      'Once revealed, all bid amounts and bidder identities become visible. This action is permanent and is logged in the audit trail.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reveal Bids',
          onPress: async () => {
            try {
              await revealMut.mutateAsync(tenderId);
              await refetchBids();
            } catch (err: any) {
              Alert.alert('Couldn\'t reveal bids', err?.message ?? 'Please try again.');
            }
          },
        },
      ],
    );
  }, [tenderId, revealMut, refetchBids]);

  // ─── Loading guard ──────────────────────────────────────────────────────
  if (tenderLoading || !tender) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  // ─── Defense-in-depth filter ────────────────────────────────────────────
  // Even though the backend masks sealed contents, we filter the bid list
  // again here. If the backend ever returns leaked data, this gate stops
  // it from rendering.
  const allBids = bidsData ?? [];
  const contentsHidden = tender.workflowType === 'closed' && !sealedViewable;
  const stats = contentsHidden
    ? null
    : computeStats(allBids);

  const sealedCount = tender.bidCount ?? tender.metadata?.totalBids ?? 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['bottom']}>
      <FlatList
        data={contentsHidden ? [] : allBids}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }: { item: ProfessionalTenderBid; index: number }) => (
          <BidCard bid={item} index={index} contentsHidden={false} />
        )}
        ListHeaderComponent={
          <View style={styles.headerCol}>
            {/* Sealed banner */}
            <SealedBidBanner
              workflowType={tender.workflowType}
              status={tender.status}
              isRevealed={tender.status === 'revealed' || tender.status === 'closed'}
              deadline={tender.deadline}
              isOwner
              isRevealing={revealMut.isPending}
              onReveal={handleReveal}
            />

            {/* Tender context */}
            <View style={[styles.contextBar, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.contextLabel, { color: palette.muted }]}>BIDS FOR</Text>
              <Text style={[styles.contextTitle, { color: palette.text }]} numberOfLines={2}>
                {tender.title}
              </Text>
              {!!tender.referenceNumber && (
                <Text
                  style={[styles.contextRef, { color: palette.muted, fontFamily: 'monospace' }]}
                >
                  {tender.referenceNumber}
                </Text>
              )}
            </View>

            {/* Stats — only shown when bids are viewable */}
            {!contentsHidden && stats && stats.total > 0 && (
              <View style={styles.statsRow}>
                <StatPill label="TOTAL"        value={stats.total}        tone="neutral" />
                <StatPill label="REVIEW"       value={stats.underReview}  tone="amber" />
                <StatPill label="SHORTLISTED"  value={stats.shortlisted}  tone="purple" />
                <StatPill label="AWARDED"      value={stats.awarded}      tone="green" />
              </View>
            )}

            {/* When sealed, show the count alone, not the breakdown */}
            {contentsHidden && (
              <View
                style={[
                  styles.sealedCountCard,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                ]}
              >
                <Ionicons name="lock-closed" size={20} color={palette.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sealedCountTitle, { color: palette.text }]}>
                    {sealedCount} sealed bid{sealedCount === 1 ? '' : 's'} received
                  </Text>
                  <Text style={[styles.sealedCountDesc, { color: palette.muted }]}>
                    Bid amounts and bidder identities are hidden until you reveal them.
                  </Text>
                </View>
              </View>
            )}

            {/* Loading state for bids list */}
            {bidsAreFetchable && bidsLoading && (
              <View style={styles.bidsLoadingRow}>
                <ActivityIndicator size="small" color={palette.primary} />
                <Text style={[styles.bidsLoadingText, { color: palette.muted }]}>
                  Loading bids…
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          contentsHidden ? null : (
            <EmptyBids
              message="No bids yet"
              submessage={
                tender.status === 'draft'
                  ? 'Bids will appear here after the tender is published.'
                  : 'Bids will appear here as bidders submit them.'
              }
            />
          )
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent: { padding: 14, gap: 10, paddingBottom: 32 },
  headerCol: { gap: 12, marginBottom: 4 },

  contextBar: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  contextLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  contextTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  contextRef:   { fontSize: 11 },

  statsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  sealedCountCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sealedCountTitle: { fontSize: 13, fontWeight: '700' },
  sealedCountDesc:  { fontSize: 11, lineHeight: 15, marginTop: 2 },

  bidsLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  bidsLoadingText: { fontSize: 12 },
});

const cardStyles = StyleSheet.create({
  root: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  indexBadge: {
    width: 28, height: 28,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  indexText: { fontSize: 11, fontWeight: '700' },
  headText:  { flex: 1, gap: 2 },
  bidderName:    { fontSize: 14, fontWeight: '700' },
  submitted:     { fontSize: 11 },
  sealedRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sealedLabel:   { fontSize: 13, fontWeight: '600', fontStyle: 'italic' },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  amountLabel:  { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  amountValue:  { fontSize: 16, fontWeight: '800' },
  sealedAmount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sealedAmountText: { fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
});

const pillStyles = StyleSheet.create({
  root: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 22,
  },
  value: { fontSize: 11, fontWeight: '800' },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});

const emptyStyles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  iconWrap: {
    width: 64, height: 64,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 14, fontWeight: '700' },
  desc:  { fontSize: 12, textAlign: 'center', lineHeight: 17, maxWidth: 260 },
});

const badgeStyles = StyleSheet.create({
  root: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

export default IncomingBidsScreen;
