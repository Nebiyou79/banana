// src/screens/company/bids/MyBidsScreen.tsx
// UPDATED: Migrated to useTheme(), uses MyBidCard, proper navigation
// FIXED: Navigation to MyBidDetail with correct params
// FIXED: Proper data extraction from API response
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, StyleSheet,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import { useGetMyAllBids } from '../../../hooks/useBid';
import { BidSkeleton } from '../../../components/bids/BidSkeleton';
import { BidEmptyState } from '../../../components/bids/BidEmptyState';
import { MyBidCard } from '../../../components/bids/MyBidCard';
import { BidListItem, BidStatus } from '../../../types/bid';

// ── Filter / sort config ───────────────────────────────────────────────────────

type FilterKey = 'all' | BidStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: BidStatus.Submitted, label: 'Submitted' },
  { key: BidStatus.UnderReview, label: 'Under Review' },
  { key: BidStatus.Shortlisted, label: 'Shortlisted' },
  { key: BidStatus.Awarded, label: 'Awarded' },
  { key: BidStatus.Rejected, label: 'Rejected' },
];

type SortKey = 'newest' | 'awarded' | 'pending';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'awarded', label: 'Awarded' },
  { key: 'pending', label: 'Pending' },
];

function sortBids(bids: BidListItem[], sort: SortKey): BidListItem[] {
  return [...bids].sort((a, b) => {
    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === 'awarded') {
      return (a.status === BidStatus.Awarded ? 0 : 1) - (b.status === BidStatus.Awarded ? 0 : 1);
    }
    if (sort === 'pending') {
      const pending = [BidStatus.Submitted, BidStatus.UnderReview, BidStatus.Shortlisted, BidStatus.InterviewScheduled];
      return (pending.includes(a.status) ? 0 : 1) - (pending.includes(b.status) ? 0 : 1);
    }
    return 0;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export const MyBidsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, spacing, radius } = useTheme();

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [activeSort, setActiveSort] = useState<SortKey>('newest');
  const [refreshing, setRefreshing] = useState(false);

  const queryStatus = activeFilter === 'all' ? undefined : (activeFilter as BidStatus);
  const { data, isLoading, refetch, error } = useGetMyAllBids(
    queryStatus ? { status: queryStatus } : undefined,
  );

  // 🔍 DEBUG
  useEffect(() => {
    console.log('📋 MyBidsScreen:');
    console.log('  data:', data ? 'present' : 'null');
    console.log('  data keys:', data ? Object.keys(data as any) : 'none');
    if (data) {
      const arr = (data as any).data || (data as any).bids || data;
      console.log('  bids array length:', Array.isArray(arr) ? arr.length : 'not an array');
    }
  }, [data]);

  // FIX: Handle different response shapes
  const rawBids: BidListItem[] = useMemo(() => {
    if (!data) return [];
    
    let bids: any[] = [];
    if (Array.isArray((data as any).data)) {
      bids = (data as any).data;
    } else if (Array.isArray((data as any).bids)) {
      bids = (data as any).bids;
    } else if (Array.isArray(data)) {
      bids = data as any[];
    }
    
    console.log('  extracted bids count:', bids.length);
    if (bids.length > 0) {
      console.log('  first bid keys:', Object.keys(bids[0]));
      console.log('  first bid tender type:', typeof bids[0].tender);
    }
    
    return bids as BidListItem[];
  }, [data]);

  const bids = useMemo(() => sortBids(rawBids, activeSort), [rawBids, activeSort]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ── FIXED: Navigation to bid detail ──────────────────────────────────────
// In MyBidsScreen.tsx - goToDetail function
const goToDetail = useCallback((bid: BidListItem) => {
  const tenderId = typeof bid.tender === 'object' 
    ? (bid.tender as any)._id 
    : bid.tender as string;
  
  console.log('🔵 goToDetail:', { bidId: bid._id, tenderId });
  
  // Option A: Navigate to the parent navigator which has access to the Pro stack
  const parentNav = navigation.getParent(); // Gets the CompanyBidsStack parent
  if (parentNav) {
    // Navigate to the Pro entry stack's MyBidDetail screen
    parentNav.navigate('MyBidDetail', { bidId: bid._id, tenderId });
  } else {
    // Fallback: try direct navigation
    navigation.navigate('MyBidDetail', { bidId: bid._id, tenderId });
  }
}, [navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Bids</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter chips */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border, backgroundColor: colors.bgCard }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = f.key === activeFilter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? colors.primary : colors.surface, borderRadius: radius.full },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? colors.textInverse : colors.textMuted }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort control */}
      <View style={[styles.sortBar, { borderBottomColor: colors.border, backgroundColor: colors.bgCard }]}>
        <Text style={[styles.sortLabel, { color: colors.textMuted }]}>Sort:</Text>
        {SORTS.map((s) => {
          const active = s.key === activeSort;
          return (
            <Pressable
              key={s.key}
              onPress={() => setActiveSort(s.key)}
              style={[
                styles.sortChip,
                {
                  backgroundColor: active ? colors.primary : 'transparent',
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: radius.full,
                },
              ]}
            >
              <Text style={[styles.sortChipText, { color: active ? colors.textInverse : colors.textMuted }]}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {isLoading ? (
        <ScrollView contentContainerStyle={[styles.listContent, { padding: spacing.lg }]}>
          <BidSkeleton count={4} />
        </ScrollView>
      ) : error ? (
        <BidEmptyState
          icon="alert-circle-outline"
          title="Failed to load bids"
          message={(error as any)?.message ?? 'Please try again.'}
          ctaLabel="Retry"
          onCta={() => refetch()}
        />
      ) : bids.length === 0 ? (
        <BidEmptyState
          icon="paper-plane-outline"
          title="No bids yet"
          message={activeFilter === 'all'
            ? 'Your submitted bids will appear here.'
            : `No bids with status "${activeFilter.replace(/_/g, ' ')}".`}
          ctaLabel={activeFilter !== 'all' ? 'Show all bids' : undefined}
          onCta={() => setActiveFilter('all')}
        />
      ) : (
        <FlashList
          data={bids}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            // Determine tenderId for MyBidCard
            const tenderId = typeof item.tender === 'object' 
              ? (item.tender as any)._id 
              : item.tender as string;
            
            return (
              <MyBidCard
                bid={item as any}
                tenderId={tenderId}
                onClick={() => goToDetail(item)}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      )}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, gap: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  filterBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  filterRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, minHeight: 30, justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  sortBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 8,
  },
  sortLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  sortChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  sortChipText: { fontSize: 11, fontWeight: '700' },
  listContent: { padding: 14, paddingBottom: 40 },
});

export default MyBidsScreen;