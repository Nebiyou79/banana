// src/screens/organization/bids/OrgBidsDashboardScreen.tsx
// FIXED: Proper data extraction, navigation to OrgIncomingBids
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import { useGetBids } from '../../../hooks/useBid';
import { useMyPostedProfessionalTenders } from '../../../hooks/useProfessionalTender';
import type { ProfessionalTenderStatus } from '../../../types/professionalTender';
import { Bid, BidCompany, BidUser } from '../../../types/bid';

const TEAL = '#0D9488';
const TEAL_BG = '#0D948820';

// ─── Live countdown hook ──────────────────────────────────────────────────────

interface TimeLeft { days: number; hours: number; minutes: number; isPast: boolean }

function useCountdown(deadline: string): TimeLeft {
  const calc = (): TimeLeft => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, isPast: true };
    return {
      days: Math.floor(diff / 864e5),
      hours: Math.floor((diff % 864e5) / 36e5),
      minutes: Math.floor((diff % 36e5) / 6e4),
      isPast: false,
    };
  };
  const [tl, setTl] = useState<TimeLeft>(calc);
  useEffect(() => {
    const id = setInterval(() => setTl(calc()), 60_000);
    return () => clearInterval(id);
  }, [deadline]);
  return tl;
}

function getBidderName(bid: Bid): string {
  if (bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'name' in bid.bidderCompany)
    return (bid.bidderCompany as BidCompany).name;
  if (bid.bidder && typeof bid.bidder === 'object' && 'firstName' in bid.bidder) {
    const u = bid.bidder as BidUser;
    return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Bidder';
  }
  return 'Bidder';
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  published: { bg: '#D1FAE5', text: '#047857' },
  open: { bg: '#D1FAE5', text: '#047857' },
  closed: { bg: '#FEE2E2', text: '#B91C1C' },
  locked: { bg: '#EDE9FE', text: '#6D28D9' },
  revealed: { bg: '#DBEAFE', text: '#1D4ED8' },
  awarded: { bg: '#FEF9C3', text: '#92400E' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
};

type FilterKey = 'all' | 'draft' | 'published' | 'open' | 'closed' | 'locked' | 'revealed' | 'awarded' | 'cancelled';
const STATUS_FILTERS: { label: string; value: FilterKey }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
  { label: 'Awarded', value: 'awarded' },
];

// ─── TenderBidCard ────────────────────────────────────────────────────────────

const TenderBidCard: React.FC<{
  tender: any;
  onPress: () => void;
  colors: any;
  radius: any;
  spacing: any;
}> = ({ tender, onPress, colors, radius, spacing }) => {
  const { data: bidsData } = useGetBids(tender._id);
  const bidCount = bidsData?.totalBids ?? tender.bidCount ?? 0;
  const isSealed = (tender.workflowType ?? 'open') === 'closed';
  const tl = useCountdown(tender.deadline);
  const statusStyle = STATUS_COLORS[tender.status] ?? STATUS_COLORS.draft;
  const bids: Bid[] = bidsData?.bids ?? [];
  const visibleBids = bids.slice(0, 5);
  const overflow = Math.max(0, bidCount - 5);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tenderCard,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.xl,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.accentStrip, { backgroundColor: isSealed ? '#8B5CF6' : TEAL }]} />
      <View style={[styles.tenderBody, { gap: spacing.sm }]}>
        {/* Header */}
        <View style={styles.tenderHeader}>
          <View style={{ flex: 1 }}>
            {tender.category && (
              <View style={[styles.categoryBadge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.categoryText, { color: colors.textMuted }]}>{tender.category}</Text>
              </View>
            )}
            <Text style={[styles.tenderTitle, { color: colors.text }]} numberOfLines={2}>
              {tender.title}
            </Text>
            {tender.referenceNumber && (
              <Text style={[styles.tenderRef, { color: colors.textMuted }]}>Ref: {tender.referenceNumber}</Text>
            )}
          </View>
          <View style={styles.tenderBadges}>
            <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusPillText, { color: statusStyle.text }]}>{tender.status}</Text>
            </View>
            <View style={[styles.workflowPill, { backgroundColor: isSealed ? '#EDE9FE' : '#CCFBF1' }]}>
              <Ionicons name={isSealed ? 'lock-closed' : 'lock-open'} size={8} color={isSealed ? '#6D28D9' : TEAL} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: isSealed ? '#6D28D9' : TEAL }}>
                {isSealed ? 'Sealed' : 'Open'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Body */}
        {isSealed ? (
          <View style={{ gap: spacing.sm }}>
            <View style={[styles.bidCountRow, { backgroundColor: TEAL, borderRadius: radius.md }]}>
              <Ionicons name="mail-outline" size={14} color="#FFFFFF" />
              <Text style={styles.bidCountText}>{bidCount} Bid{bidCount !== 1 ? 's' : ''} Received</Text>
            </View>
            <View style={[styles.deadlineRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
              <View>
                <Text style={[styles.deadlineLabel, { color: colors.textMuted }]}>Deadline</Text>
                <Text style={[styles.deadlineDate, { color: colors.text }]}>{fmtDate(tender.deadline)}</Text>
              </View>
              {!tl.isPast ? (
                <View style={styles.countdownRow}>
                  {[{ v: tl.days, l: 'd' }, { v: tl.hours, l: 'h' }, { v: tl.minutes, l: 'm' }].map(({ v, l }) => (
                    <View key={l} style={[styles.countBlock, { backgroundColor: colors.warningBg }]}>
                      <Text style={[styles.countNum, { color: colors.warning }]}>{v}</Text>
                      <Text style={[styles.countLabel, { color: colors.warning }]}>{l}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>⏰ Passed</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <View style={[styles.bidCountRow, { backgroundColor: TEAL, borderRadius: radius.md }]}>
              <Ionicons name="mail-outline" size={14} color="#FFFFFF" />
              <Text style={styles.bidCountText}>{bidCount} Bid{bidCount !== 1 ? 's' : ''} Received</Text>
            </View>
            {bidCount > 0 ? (
              <View style={[styles.applicantsRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
                <Text style={[styles.applicantsLabel, { color: colors.textMuted }]}>Companies that applied</Text>
                <View style={styles.avatarRow}>
                  <View style={styles.avatarStack}>
                    {visibleBids.map((b, i) => (
                      <View key={b._id} style={[styles.avatarCircle, { backgroundColor: TEAL_BG, marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i }]}>
                        <Text style={[styles.avatarInitial, { color: TEAL }]}>
                          {getBidderName(b).charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    ))}
                    {overflow > 0 && (
                      <View style={[styles.avatarCircle, { backgroundColor: colors.surface, marginLeft: -8 }]}>
                        <Text style={[styles.avatarInitial, { color: colors.textMuted }]}>+{overflow}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    {visibleBids.slice(0, 3).map((b) => (
                      <Text key={b._id} style={[styles.applicantName, { color: colors.text }]} numberOfLines={1}>
                        {getBidderName(b)}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.noBidsRow, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
                <Text style={{ color: colors.textMuted }}>No bids received yet</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={[styles.tenderFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerDate, { color: colors.textMuted }]}>Deadline: {fmtDate(tender.deadline)}</Text>
          <Text style={[styles.footerAction, { color: TEAL }]}>View Bids →</Text>
        </View>
      </View>
    </Pressable>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard: React.FC<{ colors: any }> = ({ colors }) => (
  <View style={[styles.tenderCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: 16 }]}>
    <View style={[styles.accentStrip, { backgroundColor: colors.skeleton }]} />
    <View style={[styles.tenderBody, { gap: 12 }]}>
      <View style={{ gap: 8 }}>
        <View style={[styles.skelLine, { backgroundColor: colors.skeleton, width: '30%' }]} />
        <View style={[styles.skelLine, { backgroundColor: colors.skeleton, width: '80%' }]} />
        <View style={[styles.skelLine, { backgroundColor: colors.skeleton, width: '40%' }]} />
      </View>
      <View style={[styles.skelLine, { backgroundColor: colors.skeleton, height: 1, width: '100%' }]} />
      <View style={[styles.skelLine, { backgroundColor: colors.skeleton, width: '100%', height: 60 }]} />
      <View style={[styles.skelLine, { backgroundColor: colors.skeleton, width: '100%', height: 40 }]} />
    </View>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const OrgBidsDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, spacing, radius } = useTheme();

  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useMyPostedProfessionalTenders({
    ...(statusFilter !== 'all' ? { status: statusFilter as ProfessionalTenderStatus } : {}),
    limit: 50,
  });

  // FIX: Safe extraction of tenders array
  const tenders = useMemo(() => {
    if (!data) return [];
    return (data as any).tenders ?? (data as any).data ?? [];
  }, [data]);

  const stats = useMemo(() => ({
    totalBids: tenders.reduce((s: number, t: any) => s + (t.bidCount ?? 0), 0),
    activeTenders: tenders.filter((t: any) => ['published', 'open'].includes(t.status)).length,
    sealedTenders: tenders.filter((t: any) => t.workflowType === 'closed').length,
    awardedTenders: tenders.filter((t: any) => (t.metadata?.bidsByStatus?.awarded ?? 0) > 0).length,
  }), [tenders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // FIX: Navigate to OrgIncomingBids (must be registered in navigator)
  const handleTenderPress = useCallback((tenderId: string) => {
    navigation.navigate('OrgIncomingBids', { tenderId });
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Incoming Bids</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} />}
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Bids', value: isLoading ? '—' : stats.totalBids, icon: 'mail-outline' },
            { label: 'Active Tenders', value: isLoading ? '—' : stats.activeTenders, icon: 'checkmark-circle-outline' },
            { label: 'Sealed Tenders', value: isLoading ? '—' : stats.sealedTenders, icon: 'lock-closed-outline' },
            { label: 'Awarded', value: isLoading ? '—' : stats.awardedTenders, icon: 'trophy-outline' },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
              <Ionicons name={stat.icon as any} size={20} color={TEAL} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {STATUS_FILTERS.map(({ label, value }) => (
            <Pressable
              key={value}
              onPress={() => setStatusFilter(value)}
              style={[styles.filterChip, { backgroundColor: statusFilter === value ? TEAL : colors.surface, borderRadius: radius.full }]}
            >
              <Text style={[styles.filterChipText, { color: statusFilter === value ? '#FFFFFF' : colors.textMuted }]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tender cards */}
        {isLoading ? (
          <View style={{ gap: spacing.md }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} colors={colors} />)}
          </View>
        ) : tenders.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.xl }]}>
            <Ionicons name="mail-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No tenders posted yet</Text>
            <Text style={[styles.emptyMsg, { color: colors.textMuted }]}>
              Post your first tender to start receiving bids.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {tenders.map((tender: any) => (
              <TenderBidCard
                key={tender._id}
                tender={tender}
                onPress={() => handleTenderPress(tender._id)}
                colors={colors}
                radius={radius}
                spacing={spacing}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles (unchanged) ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', padding: 12, borderWidth: 1, gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7 },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  tenderCard: { borderWidth: 1, overflow: 'hidden' },
  accentStrip: { height: 4 },
  tenderBody: { padding: 14 },
  tenderHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  categoryText: { fontSize: 9, fontWeight: '600' },
  tenderTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  tenderRef: { fontSize: 10, marginTop: 2 },
  tenderBadges: { alignItems: 'flex-end', gap: 4 },
  statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  statusPillText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  workflowPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  divider: { height: 1 },
  bidCountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  bidCountText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  deadlineLabel: { fontSize: 10, fontWeight: '600', marginBottom: 1 },
  deadlineDate: { fontSize: 13, fontWeight: '600' },
  countdownRow: { flexDirection: 'row', gap: 4 },
  countBlock: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 36 },
  countNum: { fontSize: 14, fontWeight: '800' },
  countLabel: { fontSize: 8, fontWeight: '600' },
  applicantsRow: { borderWidth: 1, padding: 12, gap: 8 },
  applicantsLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarStack: { flexDirection: 'row' },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarInitial: { fontSize: 11, fontWeight: '800' },
  applicantName: { fontSize: 12, lineHeight: 18 },
  noBidsRow: { padding: 20, alignItems: 'center' },
  tenderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1 },
  footerDate: { fontSize: 11 },
  footerAction: { fontSize: 12, fontWeight: '700' },
  emptyCard: { borderWidth: 1, padding: 32, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyMsg: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  skelLine: { borderRadius: 4, height: 14 },
});

export default OrgBidsDashboardScreen;