// src/screens/company/bids/MyBidsScreen.tsx
// All bids submitted by this company across all tenders.
// FlashList + filter chips + sort control + pull-to-refresh.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, StyleSheet,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../../store/themeStore';
import { useGetMyAllBids } from '../../../hooks/useBid';
import { BidCard } from '../../../components/bids/BidCard';
import { BidSkeleton } from '../../../components/bids/BidSkeleton';
import { BidEmptyState } from '../../../components/bids/BidEmptyState';
import { BidListItem, BidStatus } from '../../../types/bid';

// ── Filter / sort config ───────────────────────────────────────────────────────

type FilterKey = 'all' | BidStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',                         label: 'All' },
  { key: BidStatus.Submitted,           label: 'Submitted' },
  { key: BidStatus.UnderReview,         label: 'Under Review' },
  { key: BidStatus.Shortlisted,         label: 'Shortlisted' },
  { key: BidStatus.Awarded,             label: 'Awarded' },
  { key: BidStatus.Rejected,            label: 'Rejected' },
];

type SortKey = 'newest' | 'awarded' | 'pending';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest',  label: 'Newest' },
  { key: 'awarded', label: 'Awarded' },
  { key: 'pending', label: 'Pending' },
];

function sortBids(bids: BidListItem[], sort: SortKey): BidListItem[] {
  return [...bids].sort((a, b) => {
    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === 'awarded') {
      const aVal = a.status === BidStatus.Awarded ? 0 : 1;
      const bVal = b.status === BidStatus.Awarded ? 0 : 1;
      return aVal - bVal;
    }
    if (sort === 'pending') {
      const pendingStatuses: BidStatus[] = [BidStatus.Submitted, BidStatus.UnderReview, BidStatus.Shortlisted, BidStatus.InterviewScheduled];
      const aVal = pendingStatuses.includes(a.status) ? 0 : 1;
      const bVal = pendingStatuses.includes(b.status) ? 0 : 1;
      return aVal - bVal;
    }
    return 0;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export const MyBidsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isDark = useThemeStore((s) => s.theme.isDark);

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [activeSort, setActiveSort] = useState<SortKey>('newest');
  const [refreshing, setRefreshing] = useState(false);

  const palette = {
    bg:          isDark ? '#0F172A' : '#F8FAFC',
    header:      isDark ? '#1E293B' : '#FFFFFF',
    border:      isDark ? '#334155' : '#E2E8F0',
    text:        isDark ? '#F1F5F9' : '#0F172A',
    muted:       isDark ? '#94A3B8' : '#64748B',
    chipActive:  '#0A2540',
    chipActiveFg:'#FFFFFF',
    chipBg:      isDark ? '#1E293B' : '#F1F5F9',
    chipText:    isDark ? '#94A3B8' : '#64748B',
    sortActive:  '#F1BB03',
    sortActiveFg:'#0A2540',
    sortBg:      isDark ? '#1E293B' : '#F1F5F9',
    sortText:    isDark ? '#94A3B8' : '#64748B',
  };

  const queryStatus = activeFilter === 'all' ? undefined : (activeFilter as BidStatus);
  const { data, isLoading, refetch } = useGetMyAllBids(
    queryStatus ? { status: queryStatus } : undefined,
  );

  const rawBids: BidListItem[] = (data?.data ?? []) as BidListItem[];
  const bids = sortBids(rawBids, activeSort);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const goToDetail = useCallback((bid: BidListItem) => {
    const tenderId = typeof bid.tender === 'object' ? bid.tender._id : bid.tender;
    navigation.navigate('MyBidDetail', { bidId: bid._id, tenderId });
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['bottom']}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: palette.header, borderBottomColor: palette.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.text }]}>My Bids</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Filter chips ── */}
      <View style={[styles.filterBar, { borderBottomColor: palette.border, backgroundColor: palette.header }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = f.key === activeFilter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? palette.chipActive : palette.chipBg },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? palette.chipActiveFg : palette.chipText }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Sort control ── */}
      <View style={[styles.sortBar, { borderBottomColor: palette.border, backgroundColor: palette.header }]}>
        <Text style={[styles.sortLabel, { color: palette.muted }]}>Sort:</Text>
        {SORTS.map((s) => {
          const active = s.key === activeSort;
          return (
            <Pressable
              key={s.key}
              onPress={() => setActiveSort(s.key)}
              style={[
                styles.sortChip,
                { backgroundColor: active ? palette.sortActive : 'transparent', borderColor: active ? palette.sortActive : palette.border },
              ]}
            >
              <Text style={[styles.sortChipText, { color: active ? palette.sortActiveFg : palette.sortText }]}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          <BidSkeleton count={4} />
        </ScrollView>
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
          estimatedItemSize={110}
          contentContainerStyle={styles.listContent as any}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.chipActive} />
          }
          renderItem={({ item }) => (
            <BidCard bid={item} onPress={() => goToDetail(item)} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, gap: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },

  filterBar:   { borderBottomWidth: StyleSheet.hairlineWidth },
  filterRow:   { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
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
  sortLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  sortChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1,
  },
  sortChipText: { fontSize: 11, fontWeight: '700' },

  listContent: { padding: 14, paddingBottom: 40 },
});

export default MyBidsScreen;
