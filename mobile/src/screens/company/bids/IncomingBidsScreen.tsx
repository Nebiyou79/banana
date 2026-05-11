// src/screens/company/bids/IncomingBidsScreen.tsx
// Owner-side: all bids received on a specific tender.
// Sealed guard: show count-only + SealedBidBanner until reveal.
// Revealed: FlashList with company name, amount, status. Sort control.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator,
  Alert, StyleSheet,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../../store/themeStore';
import { useGetBids } from '../../../hooks/useBid';
import { useProfessionalTender, useRevealProfessionalTender } from '../../../hooks/useProfessionalTender';
import SealedBidBanner from '../../../components/professionalTenders/SealedBidBanner';
import { BidStatusBadge } from '../../../components/bids/BidStatusBadge';
import { areSealedBidsViewable } from '../../../types/professionalTender';
import { Bid, BidStatus } from '../../../types/bid';

// ── Route params ──────────────────────────────────────────────────────────────

interface RouteParams { tenderId: string }

// ── Sort config ───────────────────────────────────────────────────────────────

type SortKey = 'highest' | 'lowest' | 'newest';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'highest', label: 'Highest Bid' },
  { key: 'lowest',  label: 'Lowest Bid' },
  { key: 'newest',  label: 'Newest' },
];

function sortBids(bids: Bid[], sort: SortKey): Bid[] {
  return [...bids].sort((a, b) => {
    if (sort === 'highest') return (b.bidAmount ?? 0) - (a.bidAmount ?? 0);
    if (sort === 'lowest')  return (a.bidAmount ?? 0) - (b.bidAmount ?? 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function fmtCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getBidderName(bid: Bid): string {
  if (bid.coverSheet?.companyName) return bid.coverSheet.companyName;
  if (typeof bid.bidderCompany === 'object' && bid.bidderCompany !== null && 'name' in bid.bidderCompany)
    return (bid.bidderCompany as any).name;
  return 'Company';
}

function getRepresentative(bid: Bid): string {
  if (bid.coverSheet?.representative) return bid.coverSheet.representative;
  return '';
}

// ── Bid row card ──────────────────────────────────────────────────────────────

const BidRow: React.FC<{
  bid: Bid;
  onPress: () => void;
  palette: any;
}> = ({ bid, onPress, palette }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      rowStyles.root,
      { backgroundColor: palette.card, borderColor: palette.border, opacity: pressed ? 0.9 : 1 },
    ]}
  >
    <View style={rowStyles.leftStrip} />
    <View style={rowStyles.body}>
      <View style={rowStyles.topRow}>
        <Text style={[rowStyles.company, { color: palette.text }]} numberOfLines={1}>
          {getBidderName(bid)}
        </Text>
        <BidStatusBadge status={bid.status} size="sm" />
      </View>
      {getRepresentative(bid) ? (
        <Text style={[rowStyles.rep, { color: palette.muted }]} numberOfLines={1}>
          {getRepresentative(bid)}
        </Text>
      ) : null}
      <View style={rowStyles.bottomRow}>
        <Text style={[rowStyles.amount, { color: palette.accentDark }]}>
          {fmtCurrency(bid.bidAmount, bid.currency)}
        </Text>
        <View style={rowStyles.dateRow}>
          <Ionicons name="calendar-outline" size={10} color={palette.muted} />
          <Text style={[rowStyles.date, { color: palette.muted }]}>{fmtDate(bid.createdAt)}</Text>
        </View>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={15} color={palette.muted} style={{ marginRight: 10 }} />
  </Pressable>
);

const rowStyles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  leftStrip: { width: 4, alignSelf: 'stretch', backgroundColor: '#F1BB03' },
  body: { flex: 1, padding: 12, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  company: { flex: 1, fontSize: 14, fontWeight: '700' },
  rep:     { fontSize: 11 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  amount: { fontSize: 14, fontWeight: '800' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  date:   { fontSize: 11 },
});

// ── Main component ────────────────────────────────────────────────────────────

export const IncomingBidsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { tenderId } = route.params as RouteParams;

  const isDark = useThemeStore((s) => s.theme.isDark);
  const [sort, setSort] = useState<SortKey>('newest');
  const [refreshing, setRefreshing] = useState(false);

  const palette = {
    bg:        isDark ? '#0F172A' : '#F8FAFC',
    card:      isDark ? '#1E293B' : '#FFFFFF',
    border:    isDark ? '#334155' : '#E2E8F0',
    text:      isDark ? '#F1F5F9' : '#0F172A',
    muted:     isDark ? '#94A3B8' : '#64748B',
    accent:    '#F1BB03',
    accentDark:'#0A2540',
    sortActive: '#F1BB03',
    sortFg:    '#0A2540',
    sortBg:    isDark ? '#1E293B' : '#F1F5F9',
    sortText:  isDark ? '#94A3B8' : '#64748B',
    sealedBg:  isDark ? '#1E293B' : '#FFFFFF',
    statBg:    isDark ? '#162032' : '#F1F5F9',
  };

  const { data: tender, isLoading: tenderLoading, refetch: refetchTender } = useProfessionalTender(tenderId);
  const { data: bidsData, isLoading: bidsLoading, refetch: refetchBids } = useGetBids(tenderId);
  const { mutate: revealBids, isPending: revealing } = useRevealProfessionalTender();

  const isLoading = tenderLoading;
  const bids: Bid[] = (bidsData?.bids ?? []) as Bid[];
  const isBidsRevealed = bidsData?.isBidsRevealed ?? false;
  const isSealed = tender?.workflowType === 'closed';
  const contentsHidden = isSealed && !areSealedBidsViewable(tender?.status ?? '', tender?.workflowType ?? '');

  const sortedBids = sortBids(bids, sort);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchTender(), refetchBids()]);
    setRefreshing(false);
  }, [refetchTender, refetchBids]);

  const handleReveal = useCallback(() => {
    Alert.alert(
      'Reveal sealed bids?',
      'Once revealed, all bid amounts and bidder identities become visible. This is permanent.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reveal Bids',
          onPress: () => revealBids(tenderId, { onSuccess: () => refetchBids() }),
        },
      ],
    );
  }, [tenderId, revealBids, refetchBids]);

  if (isLoading) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={palette.accentDark} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.card, borderBottomColor: palette.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Incoming Bids</Text>
          {tender?.referenceNumber && (
            <Text style={[styles.headerSub, { color: palette.muted }]} numberOfLines={1}>{tender.referenceNumber}</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlashList
        data={contentsHidden ? [] : sortedBids}
        keyExtractor={(item) => item._id}
        estimatedItemSize={90}
        contentContainerStyle={{ padding: 14, paddingBottom: 40 } as any}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accentDark} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={(
          <View style={{ gap: 12, marginBottom: 12 }}>
            {/* Sealed banner */}
            {isSealed && tender && (
              <SealedBidBanner
                workflowType={tender.workflowType}
                status={tender.status}
                isRevealed={isBidsRevealed}
                deadline={tender.deadline}
                isOwner
                isRevealing={revealing}
                onReveal={handleReveal}
              />
            )}

            {/* Tender context */}
            {tender && (
              <View style={[styles.contextCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Text style={[styles.contextLabel, { color: palette.muted }]}>Bids for</Text>
                <Text style={[styles.contextTitle, { color: palette.text }]} numberOfLines={2}>{tender.title}</Text>
              </View>
            )}

            {/* Sealed count card */}
            {contentsHidden && (
              <View style={[styles.sealedCount, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Ionicons name="lock-closed" size={22} color={palette.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sealedCountTitle, { color: palette.text }]}>
                    {tender?.bidCount ?? bids.length} sealed bid{(tender?.bidCount ?? bids.length) !== 1 ? 's' : ''} received
                  </Text>
                  <Text style={[styles.sealedCountDesc, { color: palette.muted }]}>
                    Bid amounts and bidder identities are hidden until you reveal them.
                  </Text>
                </View>
              </View>
            )}

            {/* Stats */}
            {!contentsHidden && bids.length > 0 && (
              <View style={styles.statsRow}>
                {[
                  { label: 'Total',      value: bids.length,                                            bg: palette.statBg },
                  { label: 'Reviewing',  value: bids.filter(b => b.status === BidStatus.UnderReview).length, bg: '#DBEAFE' },
                  { label: 'Shortlisted',value: bids.filter(b => b.status === BidStatus.Shortlisted).length, bg: '#CCFBF1' },
                  { label: 'Awarded',    value: bids.filter(b => b.status === BidStatus.Awarded).length,     bg: '#FEF9C3' },
                ].map((s) => (
                  <View key={s.label} style={[styles.statPill, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statVal, { color: palette.accentDark }]}>{s.value}</Text>
                    <Text style={[styles.statLabel, { color: palette.muted }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Sort row */}
            {!contentsHidden && (
              <View style={styles.sortRow}>
                {SORTS.map((s) => {
                  const active = s.key === sort;
                  return (
                    <Pressable
                      key={s.key}
                      onPress={() => setSort(s.key)}
                      style={[styles.sortChip, {
                        backgroundColor: active ? palette.sortActive : palette.sortBg,
                        borderColor: active ? palette.sortActive : palette.border,
                      }]}
                    >
                      <Text style={[styles.sortChipText, { color: active ? palette.sortFg : palette.sortText }]}>
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          contentsHidden ? null : (
            <View style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Ionicons name="documents-outline" size={28} color={palette.muted} />
              <Text style={[styles.emptyText, { color: palette.muted }]}>No bids received yet</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <BidRow
            bid={item}
            palette={palette}
            onPress={() => navigation.navigate('OwnerBidDetail', { bidId: item._id, tenderId })}
          />
        )}
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:       { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub:   { fontSize: 11 },

  contextCard:  { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 3 },
  contextLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  contextTitle: { fontSize: 14, fontWeight: '700' },

  sealedCount: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, borderWidth: 1, padding: 16 },
  sealedCountTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  sealedCountDesc:  { fontSize: 12, lineHeight: 17 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 10, gap: 3 },
  statVal:  { fontSize: 18, fontWeight: '800' },
  statLabel:{ fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  sortRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  sortChipText: { fontSize: 12, fontWeight: '700' },

  emptyCard: { alignItems: 'center', gap: 8, padding: 28, borderRadius: 14, borderWidth: 1 },
  emptyText: { fontSize: 13 },
});

export default IncomingBidsScreen;
