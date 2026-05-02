// src/screens/freelancer/proposals/MyProposalsScreen.tsx
// Banana Mobile App — Module 6B: Proposals
// Freelancer's proposals list — filter tabs: All / Active / Awarded / Rejected.
// Pull-to-refresh, pagination, search.

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../../store/themeStore';
import { useMyProposals } from '../../../hooks/useProposal';
import { ProposalCard } from '../../../components/proposals/ProposalCard';
import { ProposalCardSkeleton } from '../../../components/proposals/ProposalSkeleton';
import { ProposalEmptyState } from '../../../components/proposals/ProposalEmptyState';
import type { ProposalListItem, ProposalStatus, ProposalFilters } from '../../../types/proposal';
import type { FreelancerStackParamList } from '../../../navigation/FreelancerNavigator';

// ─── Navigation ───────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<FreelancerStackParamList>;

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'active' | 'awarded' | 'rejected';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'awarded', label: 'Awarded' },
  { key: 'rejected', label: 'Rejected' },
];

const ACTIVE_STATUSES: ProposalStatus[] = [
  'submitted',
  'under_review',
  'shortlisted',
  'interview_scheduled',
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'submittedAt:-1', label: 'Newest first' },
  { value: 'submittedAt:1', label: 'Oldest first' },
  { value: 'proposedAmount:-1', label: 'Highest bid' },
  { value: 'proposedAmount:1', label: 'Lowest bid' },
];

const PAGE_SIZE = 12;

// ─── Component ────────────────────────────────────────────────────────────────

export const MyProposalsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { theme } = useThemeStore();
  const { colors } = theme;

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('submittedAt:-1');
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(1);

  // Derive status filter from tab
  const statusFilter: ProposalStatus | undefined = useMemo(() => {
    if (activeTab === 'awarded') return 'awarded';
    if (activeTab === 'rejected') return 'rejected';
    return undefined; // 'all' and 'active' handled client-side
  }, [activeTab]);

  const filters: ProposalFilters = {
    status: statusFilter,
    sortBy: sortBy as ProposalFilters['sortBy'],
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isFetching, refetch } = useMyProposals(filters);

  const allProposals = data?.proposals ?? [];
  const pagination = data?.pagination;

  // Client-side filter for 'active' tab (no single API status for multi-status)
  const filteredProposals = useMemo(() => {
    let result = allProposals;
    if (activeTab === 'active') {
      result = result.filter((p) =>
        ACTIVE_STATUSES.includes(p.status),
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const tender =
          typeof p.tender === 'object' && p.tender !== null
            ? (p.tender as { title?: string }).title ?? ''
            : '';
        const freelancer =
          typeof p.freelancer === 'object' && p.freelancer !== null
            ? (p.freelancer as { name?: string }).name ?? ''
            : '';
        return (
          tender.toLowerCase().includes(q) ||
          freelancer.toLowerCase().includes(q) ||
          (p.coverLetter ?? '').toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [allProposals, activeTab, searchQuery]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleRefresh = () => {
    setPage(1);
    refetch();
  };

  const handleLoadMore = () => {
    if (pagination && page < pagination.totalPages && !isFetching) {
      setPage((p) => p + 1);
    }
  };

  const handleCardPress = (proposal: ProposalListItem) => {
    navigation.navigate('ProposalDetail' as never, {
      proposalId: proposal._id,
    } as never);
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: ProposalListItem }) => (
      <ProposalCard
        proposal={item}
        viewMode="freelancer"
        onPress={() => handleCardPress(item)}
        style={styles.card}
      />
    ),
    [navigation],
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonList}>
      {[0, 1, 2, 3].map((i) => (
        <ProposalCardSkeleton key={i} style={styles.card} />
      ))}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    const isFiltered = searchQuery.trim() || activeTab !== 'all';
    return (
      <ProposalEmptyState
        variant={isFiltered ? 'no_results' : 'no_proposals'}
        actionLabel={isFiltered ? 'Clear filters' : 'Browse Tenders'}
        onAction={() => {
          if (isFiltered) {
            setSearchQuery('');
            setActiveTab('all');
          } else {
            navigation.navigate('TendersList' as never);
          }
        }}
      />
    );
  };

  const renderFooter = () => {
    if (!isFetching || isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#F1BB03" />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Sort sheet (simple inline overlay) */}
      {showSort && (
        <TouchableOpacity
          style={styles.sortOverlay}
          activeOpacity={1}
          onPress={() => setShowSort(false)}
        >
          <View
            style={[
              styles.sortSheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  setSortBy(opt.value);
                  setPage(1);
                  setShowSort(false);
                }}
                style={[
                  styles.sortOption,
                  sortBy === opt.value && styles.sortOptionActive,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    { color: sortBy === opt.value ? '#F1BB03' : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
                {sortBy === opt.value && (
                  <Text style={styles.sortCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}

      {/* Search bar */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.searchInput,
            { backgroundColor: colors.inputBg, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.searchIcon, { color: colors.textMuted }]}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by tender or keyword…"
            placeholderTextColor={colors.placeholder}
            style={[styles.searchTextField, { color: colors.text }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowSort(!showSort)}
          style={[
            styles.sortBtn,
            { backgroundColor: colors.inputBg, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sortBtnText, { color: colors.textSecondary }]}>⇅</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        {FILTER_TABS.map(({ key, label }) => {
          const active = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => handleTabChange(key)}
              style={[
                styles.tab,
                active && styles.tabActive,
                active && { borderBottomColor: '#F1BB03' },
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
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {isLoading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={filteredProposals}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            filteredProposals.length === 0 && styles.emptyContent,
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

      {/* Stats summary bar */}
      {!isLoading && pagination && (
        <View
          style={[
            styles.statsBar,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <Text style={[styles.statsText, { color: colors.textMuted }]}>
            {pagination.total} proposal{pagination.total !== 1 ? 's' : ''} total
            {activeTab !== 'all' && ` · ${filteredProposals.length} shown`}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  searchIcon: { fontSize: 14 },
  searchTextField: { flex: 1, fontSize: 14, height: 40 },
  sortBtn: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  sortBtnText: { fontSize: 16, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },
  emptyContent: { flex: 1, justifyContent: 'center' },
  card: {},
  separator: { height: 0 },
  skeletonList: { padding: 16, gap: 12 },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  statsBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  statsText: { fontSize: 12 },
  // Sort overlay
  sortOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 110 : 90,
    paddingRight: 16,
  },
  sortSheet: {
    width: 200,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sortOptionActive: { backgroundColor: 'rgba(241,187,3,0.06)' },
  sortOptionText: { fontSize: 14 },
  sortCheck: { color: '#F1BB03', fontSize: 14, fontWeight: '700' },
});

export default MyProposalsScreen;
