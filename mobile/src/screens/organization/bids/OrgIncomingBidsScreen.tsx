// src/screens/organization/bids/OrgIncomingBidsScreen.tsx
// FIXED: Safe route params access to prevent crash
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, Pressable, RefreshControl, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import { useGetBids } from '../../../hooks/useBid';
import { useProfessionalTender, useRevealProfessionalTender } from '../../../hooks/useProfessionalTender';
import { getSafeDeadline, getSafeWorkflowType, isSealedTender } from '../../../utils/tenderHelpers';
import { SealedBidBanner } from '../../../components/bids/SealedBidBanner';
import { OpenBidCard } from '../../../components/bids/OpenBidCard';
import { Bid, BidStatus } from '../../../types/bid';

const TEAL = '#0D9488';

interface RouteParams { tenderId: string }

type SortKey = 'highest' | 'lowest' | 'newest';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'highest', label: 'Highest Bid' }, { key: 'lowest', label: 'Lowest Bid' }, { key: 'newest', label: 'Newest' },
];

function sortBids(bids: Bid[], sort: SortKey): Bid[] {
  return [...bids].sort((a, b) => {
    if (sort === 'highest') return (b.bidAmount ?? 0) - (a.bidAmount ?? 0);
    if (sort === 'lowest') return (a.bidAmount ?? 0) - (b.bidAmount ?? 0);
    return new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime();
  });
}

export const OrgIncomingBidsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  
  // FIX: Safe extraction of tenderId
  const params = (route.params as RouteParams) ?? {};
  const tenderId = params.tenderId ?? '';
  
  const { colors, spacing, radius } = useTheme();
  const [sort, setSort] = useState<SortKey>('newest');
  const [refreshing, setRefreshing] = useState(false);

  console.log('📋 OrgIncomingBidsScreen - tenderId:', tenderId);

  const { data: tender, isLoading: tenderLoading, refetch: refetchTender } = useProfessionalTender(tenderId);
  const { data: bidsData, isLoading: bidsLoading, refetch: refetchBids } = useGetBids(tenderId);
  const { mutate: revealBids, isPending: revealing } = useRevealProfessionalTender();

  const isLoading = tenderLoading || bidsLoading;
  const bids: Bid[] = (bidsData?.bids ?? []) as Bid[];
  const isBidsRevealed = bidsData?.isBidsRevealed ?? false;
  const isSealed = isSealedTender(tender);
  const contentsHidden = isSealed && !isBidsRevealed;
  const sortedBids = useMemo(() => sortBids(bids, sort), [bids, sort]);

  const onRefresh = useCallback(async () => { 
    setRefreshing(true); 
    await Promise.all([refetchTender(), refetchBids()]); 
    setRefreshing(false); 
  }, [refetchTender, refetchBids]);

  const handleReveal = useCallback(() => {
    Alert.alert('Reveal Sealed Bids?', 'This will unlock all sealed bids. This action is recorded in the committee audit trail.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reveal Bids', onPress: () => revealBids(tenderId, { onSuccess: () => refetchBids() }) },
    ]);
  }, [tenderId, revealBids, refetchBids]);

  // Handle missing tenderId
  if (!tenderId) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
        <View style={styles.fullCenter}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textMuted }]}>No tender selected.</Text>
          <Pressable onPress={() => navigation.goBack()} style={[styles.errorBtn, { backgroundColor: TEAL }]}>
            <Text style={styles.errorBtnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) return <View style={[styles.fullCenter, { backgroundColor: colors.bg }]}><ActivityIndicator size="large" color={TEAL} /></View>;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Committee Bids Review</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlashList
        data={contentsHidden ? [] : sortedBids}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
            {isSealed && tender && (
              <SealedBidBanner workflowType={getSafeWorkflowType(tender)} isRevealed={isBidsRevealed} deadline={getSafeDeadline(tender)} isOwner isRevealing={revealing} onReveal={handleReveal} />
            )}
            {tender && (
              <View style={[styles.contextCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.md }]}>
                <Text style={[styles.contextLabel, { color: colors.textMuted }]}>Tender</Text>
                <Text style={[styles.contextTitle, { color: colors.text }]} numberOfLines={2}>{(tender as any)?.data?.title ?? (tender as any)?.title ?? 'Tender'}</Text>
              </View>
            )}
            {contentsHidden && (
              <View style={[styles.sealedCount, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
                <Ionicons name="lock-closed" size={22} color={colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sealedCountTitle, { color: colors.text }]}>{bidsData?.sealedBids ?? bids.length} sealed bid{((bidsData?.sealedBids ?? bids.length) !== 1) ? 's' : ''} received</Text>
                  <Text style={[styles.sealedCountDesc, { color: colors.textMuted }]}>Bid amounts are encrypted until the committee reveals them.</Text>
                </View>
              </View>
            )}
            {!contentsHidden && bids.length > 0 && (
              <View style={styles.statsRow}>
                {[
                  { label: 'Total', value: bids.length }, { label: 'Reviewing', value: bids.filter(b => b.status === BidStatus.UnderReview).length },
                  { label: 'Shortlisted', value: bids.filter(b => b.status === BidStatus.Shortlisted).length }, { label: 'Awarded', value: bids.filter(b => b.status === BidStatus.Awarded).length },
                ].map((s) => (
                  <View key={s.label} style={[styles.statPill, { backgroundColor: colors.surface, borderRadius: radius.sm }]}>
                    <Text style={[styles.statVal, { color: TEAL }]}>{s.value}</Text><Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}
            {!contentsHidden && (
              <View style={styles.sortRow}>
                {SORTS.map((s) => {
                  const active = s.key === sort;
                  return (
                    <Pressable key={s.key} onPress={() => setSort(s.key)} style={[styles.sortChip, { backgroundColor: active ? TEAL : colors.surface, borderColor: active ? TEAL : colors.border, borderRadius: radius.full }]}>
                      <Text style={[styles.sortChipText, { color: active ? '#FFFFFF' : colors.textMuted }]}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={contentsHidden ? null : (
          <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
            <Ionicons name="documents-outline" size={28} color={colors.textMuted} /><Text style={[styles.emptyText, { color: colors.textMuted }]}>No bids received yet</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <OpenBidCard bid={item} tenderId={tenderId} isBidsRevealed={isBidsRevealed} viewerRole="owner" onClick={() => navigation.navigate('OrgBidDetail', { bidId: item._id, tenderId })} />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 }, fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { fontSize: 14 }, errorBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }, errorBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  contextCard: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 3 },
  contextLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  contextTitle: { fontSize: 14, fontWeight: '700' },
  sealedCount: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, padding: 16 },
  sealedCountTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  sealedCountDesc: { fontSize: 12, lineHeight: 17 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: { flex: 1, alignItems: 'center', padding: 10, gap: 3 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  sortRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  sortChipText: { fontSize: 12, fontWeight: '700' },
  emptyCard: { alignItems: 'center', gap: 8, padding: 28, borderWidth: 1 },
  emptyText: { fontSize: 13 },
});

export default OrgIncomingBidsScreen;