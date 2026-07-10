// screens/freelancer/tenders/FreelancerBrowseTendersScreen.tsx

import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import {
  useFreelanceTenders,
  useSaveUnsaveTender,
} from '../../../hooks/useFreelanceTender';
import type {
  FreelanceTenderFilters,
  FreelanceTenderListItem,
} from '../../../types/freelanceTender';
import { FreelanceTenderBrowserCard } from '../../../components/freelanceTenders/FreelanceTenderCard';
import FreelanceTenderSkeleton     from '../../../components/freelanceTenders/FreelanceTenderSkeleton';
import FreelanceTenderEmptyState   from '../../../components/freelanceTenders/FreelanceTenderEmptyState';
import FreelanceTenderFiltersSheet from '../../../components/freelanceTenders/FreelanceTenderFilters';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countFilters(f: FreelanceTenderFilters): number {
  let n = 0;
  if (f.procurementCategory)                      n++;
  if (f.engagementType)                           n++;
  if (f.minBudget != null || f.maxBudget != null) n++;
  if (f.experienceLevel && f.experienceLevel !== 'any') n++;
  if (f.urgency)                                  n++;
  if (f.projectType)                              n++;
  return n;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const FreelancerBrowseTendersScreen: React.FC = () => {
  const { colors, type, radius, spacing } = useTheme();
  const navigation = useNavigation<any>();

  const [filters, setFilters] = useState<FreelanceTenderFilters>({
    page: 1, limit: 15, sortBy: 'createdAt', sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText]   = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch, isRefetching,
  } = useFreelanceTenders(filters);

  const saveMutation = useSaveUnsaveTender();

  const allTenders: FreelanceTenderListItem[] = (data?.pages ?? []).flatMap(p => p.tenders);
  const totalCount     = data?.pages?.[0]?.pagination?.total ?? 0;
  const activeFilters  = countFilters(filters);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: text || undefined, page: 1 }));
    }, 350);
  };

  const clearSearch = useCallback(() => {
    setSearchText('');
    setFilters(prev => ({ ...prev, search: undefined, page: 1 }));
  }, []);

  const applyFilters = useCallback(
    (newFilters: FreelanceTenderFilters) =>
      setFilters({ ...newFilters, search: filters.search, page: 1 }),
    [filters.search],
  );

  const clearFilters = useCallback(() =>
    setFilters({ page: 1, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' }), []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSaveToggle = useCallback(
    (tenderId: string) => saveMutation.mutate(tenderId),
    [saveMutation],
  );

  // ── Render item ─────────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: FreelanceTenderListItem }) => (
      <FreelanceTenderBrowserCard
        tender={item}
        onPress={() => navigation.navigate('FreelancerTenderDetail', { tenderId: item._id })}
        onSaveToggle={() => handleSaveToggle(item._id)}
      />
    ),
    [navigation, handleSaveToggle],
  );

  // ── UI ──────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[type.h2, { color: colors.text, fontWeight: '800' }]}>Find Work</Text>
          <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
            {isLoading ? 'Loading…' : `${totalCount.toLocaleString()} projects available`}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('FreelancerSavedTenders')}
          style={[styles.savedBtn, { backgroundColor: withAlpha(colors.primary, 0.09), borderColor: withAlpha(colors.primary, 0.22) }]}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Saved tenders"
        >
          <Ionicons name="bookmark" size={15} color={colors.primary} />
          <Text style={[type.caption, { color: colors.primary, fontWeight: '700' }]}>Saved</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search + Filter row ── */}
      <View style={[styles.searchRow, { paddingHorizontal: spacing.md }]}>
        <View
          style={[
            styles.searchField,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchText}
            onChangeText={handleSearchChange}
            placeholder="Search projects, skills, category…"
            placeholderTextColor={colors.inputPlaceholder}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={[
            styles.filterBtn,
            {
              backgroundColor: activeFilters > 0 ? colors.primary : colors.bgCard,
              borderColor:     activeFilters > 0 ? colors.primary : colors.border,
            },
          ]}
          activeOpacity={0.78}
          accessibilityRole="button"
          accessibilityLabel={`Filters${activeFilters > 0 ? `, ${activeFilters} active` : ''}`}
        >
          <Ionicons
            name="options-outline"
            size={19}
            color={activeFilters > 0 ? '#fff' : colors.textMuted}
          />
          {activeFilters > 0 && (
            <View style={[styles.filterDot, { backgroundColor: '#fff' }]}>
              <Text style={[styles.filterDotText, { color: colors.primary }]}>{activeFilters}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Sort / clear strip ── */}
      {!isLoading && allTenders.length > 0 && (
        <View style={[styles.sortStrip, { borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="funnel-outline" size={12} color={colors.textMuted} />
            <Text style={[type.caption, { color: colors.textMuted }]}>
              {filters.sortBy === 'deadline' ? 'By deadline' : 'Newest first'}
            </Text>
          </View>
          {activeFilters > 0 && (
            <TouchableOpacity onPress={clearFilters} hitSlop={8} accessibilityRole="button">
              <Text style={[type.caption, { color: colors.primary, fontWeight: '700' }]}>
                Clear filters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── List ── */}
      {isLoading ? (
        <FreelanceTenderSkeleton count={4} />
      ) : (
        <FlashList
          data={allTenders}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <FreelanceTenderEmptyState
              message={
                filters.search
                  ? `No results for "${filters.search}"`
                  : 'No tenders available right now'
              }
              subtitle={
                activeFilters > 0
                  ? 'Try adjusting your filters'
                  : 'Check back soon — new projects are posted daily'
              }
              icon="briefcase-outline"
              actionLabel={filters.search ? 'Clear search' : activeFilters > 0 ? 'Clear filters' : undefined}
              onAction={filters.search ? clearSearch : activeFilters > 0 ? clearFilters : undefined}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={{ padding: 20 }} />
            ) : null
          }
        />
      )}

      {/* ── Filters sheet ── */}
      {showFilters && (
        <FreelanceTenderFiltersSheet
          initialFilters={filters}
          onApply={applyFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },

  savedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },

  searchRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    gap: 10,
  },

  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    minHeight: 48,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },

  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterDotText: { fontSize: 9, fontWeight: '800' },

  sortStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  list: { padding: 16 },
});

export default FreelancerBrowseTendersScreen;