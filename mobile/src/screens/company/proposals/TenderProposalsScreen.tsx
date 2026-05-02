// src/screens/company/proposals/TenderProposalsScreen.tsx
// Banana Mobile App — Module 6B: Proposals
// Company / Organization view: all non-draft proposals for a specific tender.
// Features: stats bar, status filter tabs, sort sheet, shortlist toggle per card,
// compare selection (up to 4), pull-to-refresh, pagination.

import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../../store/themeStore';
import {
  useTenderProposals,
  useTenderProposalStats,
  useToggleShortlist,
} from '../../../hooks/useProposal';
import { ProposalCard } from '../../../components/proposals/ProposalCard';
import { ProposalCardSkeleton } from '../../../components/proposals/ProposalSkeleton';
import { ProposalEmptyState } from '../../../components/proposals/ProposalEmptyState';
import type {
  ProposalListItem,
  ProposalStatus,
  ProposalFilters,
  ProposalSortBy,
  ProposalStats,
} from '../../../types/proposal';

// ─── Navigation types ─────────────────────────────────────────────────────────

// These param list types should match your navigator definitions.
// Using a generic type here so this screen works for both Company and Org navigators.
type ScreenRouteProp = RouteProp<
  {
    TenderProposals: {
      tenderId: string;
      tenderTitle: string;
      role: 'company' | 'organization';
    };
  },
  'TenderProposals'
>;

// ─── Constants ────────────────────────────────────────────────────────────────

type StatusFilter = ProposalStatus | 'all' | 'shortlisted';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'New' },
  { key: 'under_review', label: 'Reviewing' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'awarded', label: 'Awarded' },
  { key: 'rejected', label: 'Rejected' },
];

const SORT_OPTIONS: { value: ProposalSortBy; label: string; icon: string }[] = [
  { value: 'newest', label: 'Newest first', icon: '🕐' },
  { value: 'highest_bid', label: 'Highest bid', icon: '💰' },
  { value: 'lowest_bid', label: 'Lowest bid', icon: '💸' },
  { value: 'best_rating', label: 'Best rated', icon: '⭐' },
];

const PAGE_SIZE = 12;

// ─── Stats bar ────────────────────────────────────────────────────────────────

interface StatsBarProps {
  stats: ProposalStats;
  colors: {
    card: string;
    border: string;
    text: string;
    textMuted: string;
    textSecondary: string;
    surface: string;
  };
}

const StatsBar: React.FC<StatsBarProps> = ({ stats, colors }) => {
  const items = [
    { label: 'Total', value: stats.total, color: colors.text },
    { label: 'Shortlisted', value: stats.shortlistedCount, color: '#0D9488' },
    { label: 'Avg Bid', value: `ETB ${Math.round(stats.avgBid).toLocaleString()}`, color: '#F1BB03', isString: true },
    { label: 'Reviewed', value: stats.viewedByOwner, color: '#7C3AED' },
  ];

  return (
    <View
      style={[
        statsStyles.container,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
      ]}
    >
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          <View style={statsStyles.item}>
            <Text style={[statsStyles.value, { color: item.color }]}>
              {item.isString ? item.value : item.value}
            </Text>
            <Text style={[statsStyles.label, { color: colors.textMuted }]}>
              {item.label}
            </Text>
          </View>
          {i < items.length - 1 && (
            <View style={[statsStyles.divider, { backgroundColor: colors.border }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const statsStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: 16, fontWeight: '800' },
  label: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { width: 1, marginVertical: 4 },
});

// ─── Compare selection bar ────────────────────────────────────────────────────

interface CompareBarProps {
  count: number;
  onCompare: () => void;
  onClear: () => void;
  colors: { card: string; border: string; text: string; textMuted: string };
}

const CompareBar: React.FC<CompareBarProps> = ({ count, onCompare, onClear, colors }) => (
  <View
    style={[
      compareStyles.bar,
      { backgroundColor: '#0A2540', borderTopColor: colors.border },
    ]}
  >
    <TouchableOpacity onPress={onClear} style={compareStyles.clearBtn}>
      <Text style={compareStyles.clearText}>✕ Clear</Text>
    </TouchableOpacity>
    <Text style={compareStyles.countText}>
      {count} selected — select up to 4 to compare
    </Text>
    <TouchableOpacity
      onPress={onCompare}
      disabled={count < 2}
      style={[
        compareStyles.compareBtn,
        { opacity: count < 2 ? 0.5 : 1 },
      ]}
    >
      <Text style={compareStyles.compareBtnText}>Compare →</Text>
    </TouchableOpacity>
  </View>
);

const compareStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  clearBtn: { padding: 4 },
  clearText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  countText: { flex: 1, color: '#fff', fontSize: 12, textAlign: 'center' },
  compareBtn: {
    backgroundColor: '#F1BB03',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  compareBtnText: { color: '#0A2540', fontSize: 13, fontWeight: '800' },
});

// ─── Sort sheet ───────────────────────────────────────────────────────────────

interface SortSheetProps {
  current: ProposalSortBy;
  onSelect: (v: ProposalSortBy) => void;
  onClose: () => void;
  colors: { card: string; border: string; text: string; textMuted: string; background: string };
}

const SortSheet: React.FC<SortSheetProps> = ({ current, onSelect, onClose, colors }) => (
  <TouchableOpacity
    style={sortStyles.overlay}
    activeOpacity={1}
    onPress={onClose}
  >
    <View
      style={[
        sortStyles.sheet,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[sortStyles.header, { color: colors.text }]}>Sort proposals by</Text>
      {SORT_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => { onSelect(opt.value); onClose(); }}
          style={[
            sortStyles.option,
            { borderBottomColor: colors.border },
            current === opt.value && { backgroundColor: 'rgba(241,187,3,0.08)' },
          ]}
        >
          <Text style={sortStyles.optionIcon}>{opt.icon}</Text>
          <Text style={[sortStyles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
          {current === opt.value && (
            <Text style={sortStyles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  </TouchableOpacity>
);

const sortStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    overflow: 'hidden',
  },
  header: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    gap: 12,
  },
  optionIcon: { fontSize: 18 },
  optionLabel: { flex: 1, fontSize: 15 },
  checkmark: { color: '#F1BB03', fontSize: 16, fontWeight: '800' },
});

// ─── Main component ───────────────────────────────────────────────────────────

export const TenderProposalsScreen: React.FC = () => {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { theme } = useThemeStore();
  const { colors } = theme;

  const { tenderId, tenderTitle, role } = route.params;

  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<ProposalSortBy>('newest');
  const [showSort, setShowSort] = useState(false);
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Set header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Proposals',
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowSort(true)}
          style={{ marginRight: 4, padding: 6 }}
        >
          <Text style={{ fontSize: 18 }}>⇅</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Build query filters
  const filters: ProposalFilters = useMemo(() => {
    const isShortlistedTab = activeTab === 'shortlisted';
    const statusVal = isShortlistedTab
      ? undefined
      : activeTab !== 'all'
      ? (activeTab as ProposalStatus)
      : undefined;
    return {
      status: statusVal,
      sortBy,
      isShortlisted: isShortlistedTab || shortlistedOnly || undefined,
      page,
      limit: PAGE_SIZE,
    };
  }, [activeTab, sortBy, shortlistedOnly, page]);

  const { data: statsData, refetch: refetchStats } = useTenderProposalStats(tenderId);
  const { data, isLoading, isFetching, refetch } = useTenderProposals(tenderId, filters);
  const toggleShortlistMutation = useToggleShortlist();

  const proposals: ProposalListItem[] = data?.proposals ?? [];
  const pagination = data?.pagination;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleTabChange = (tab: StatusFilter) => {
    setActiveTab(tab);
    setPage(1);
    setShortlistedOnly(false);
  };

  const handleRefresh = () => {
    setPage(1);
    refetch();
    refetchStats();
  };

  const handleLoadMore = () => {
    if (pagination && page < pagination.totalPages && !isFetching) {
      setPage((p) => p + 1);
    }
  };

  const handleCardPress = (proposal: ProposalListItem) => {
    navigation.navigate('ProposalDetail', {
      proposalId: proposal._id,
      tenderId,
      role,
    });
  };

  const handleShortlistToggle = (proposalId: string) => {
    toggleShortlistMutation.mutate(proposalId, {
      onError: () => Alert.alert('Error', 'Could not update shortlist. Please try again.'),
    });
  };

  const handleSelectToggle = (proposalId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(proposalId)) {
        next.delete(proposalId);
      } else {
        if (next.size >= 4) {
          Alert.alert('Compare limit', 'You can compare up to 4 proposals at a time.');
          return prev;
        }
        next.add(proposalId);
      }
      return next;
    });
  };

  const handleCompare = () => {
    const ids = Array.from(selectedIds);
    navigation.navigate('CompareProposals', { proposalIds: ids, tenderId, role });
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: ProposalListItem }) => (
      <View style={styles.cardWrapper}>
        {/* Compare checkbox */}
        <TouchableOpacity
          onPress={() => handleSelectToggle(item._id)}
          style={[
            styles.checkbox,
            {
              backgroundColor: selectedIds.has(item._id) ? '#F1BB03' : colors.card,
              borderColor: selectedIds.has(item._id) ? '#F1BB03' : colors.border,
            },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {selectedIds.has(item._id) && (
            <Text style={styles.checkboxTick}>✓</Text>
          )}
        </TouchableOpacity>

        <ProposalCard
          proposal={item}
          viewMode="company"
          onPress={() => handleCardPress(item)}
          onShortlistToggle={() => handleShortlistToggle(item._id)}
          style={styles.card}
        />
      </View>
    ),
    [selectedIds, colors, navigation, toggleShortlistMutation],
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <ProposalEmptyState
        variant={activeTab !== 'all' ? 'no_results' : 'no_tender_proposals'}
        actionLabel={activeTab !== 'all' ? 'Show all proposals' : undefined}
        onAction={activeTab !== 'all' ? () => handleTabChange('all') : undefined}
      />
    );
  };

  const renderFooter = () => {
    if (!isFetching || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#F1BB03" />
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonList}>
      {[0, 1, 2, 3].map((i) => (
        <ProposalCardSkeleton key={i} style={styles.card} />
      ))}
    </View>
  );

  // ── Status tab counts from stats ──────────────────────────────────────────

  const getTabCount = (tab: StatusFilter): number | null => {
    if (!statsData) return null;
    if (tab === 'all') return statsData.total;
    if (tab === 'shortlisted') return statsData.shortlistedCount;
    return statsData.byStatus?.[tab as ProposalStatus] ?? null;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Sort sheet overlay */}
      {showSort && (
        <SortSheet
          current={sortBy}
          onSelect={(v) => { setSortBy(v); setPage(1); }}
          onClose={() => setShowSort(false)}
          colors={colors as any}
        />
      )}

      {/* Stats bar */}
      {statsData && (
        <StatsBar stats={statsData} colors={colors as any} />
      )}

      {/* Status filter tabs */}
      <View
        style={[
          styles.tabBarWrapper,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {STATUS_TABS.map(({ key, label }) => {
            const active = activeTab === key;
            const count = getTabCount(key);
            return (
              <TouchableOpacity
                key={key}
                onPress={() => handleTabChange(key)}
                style={[
                  styles.tab,
                  active && { borderBottomColor: '#F1BB03', borderBottomWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? '#F1BB03' : colors.textMuted },
                    active && styles.tabTextActive,
                  ]}
                >
                  {label}
                </Text>
                {count !== null && count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor: active
                          ? '#F1BB03'
                          : colors.surface ?? colors.card,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        { color: active ? '#0A2540' : colors.textMuted },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Shortlisted-only toggle pill */}
      <View
        style={[
          styles.filterPillRow,
          { backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity
          onPress={() => { setShortlistedOnly(!shortlistedOnly); setPage(1); }}
          style={[
            styles.filterPill,
            {
              backgroundColor: shortlistedOnly
                ? 'rgba(241,187,3,0.12)'
                : colors.card,
              borderColor: shortlistedOnly ? '#F1BB03' : colors.border,
            },
          ]}
        >
          <Text style={[styles.filterPillText, { color: shortlistedOnly ? '#D97706' : colors.textMuted }]}>
            ⭐ Shortlisted only
          </Text>
        </TouchableOpacity>

        {/* Proposal count */}
        {pagination && (
          <Text style={[styles.countText, { color: colors.textMuted }]}>
            {pagination.total} proposal{pagination.total !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Main list */}
      {isLoading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={proposals}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            proposals.length === 0 && styles.emptyContent,
          ]}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && page === 1}
              onRefresh={handleRefresh}
              tintColor="#F1BB03"
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Compare bar (appears when items are selected) */}
      {selectedIds.size > 0 && (
        <CompareBar
          count={selectedIds.size}
          onCompare={handleCompare}
          onClear={() => setSelectedIds(new Set())}
          colors={colors as any}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  tabBarWrapper: { borderBottomWidth: 1 },
  tabBarContent: { paddingHorizontal: 12, gap: 0 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 13, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeText: { fontSize: 10, fontWeight: '700' },
  filterPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    gap: 4,
  },
  filterPillText: { fontSize: 13, fontWeight: '600' },
  countText: { fontSize: 12, marginLeft: 'auto' },
  listContent: { padding: 16, paddingBottom: 32 },
  emptyContent: { flex: 1 },
  cardWrapper: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    flexShrink: 0,
  },
  checkboxTick: { color: '#0A2540', fontSize: 12, fontWeight: '800' },
  card: { flex: 1 },
  separator: { height: 10 },
  skeletonList: { padding: 16, gap: 10 },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});

export default TenderProposalsScreen;
