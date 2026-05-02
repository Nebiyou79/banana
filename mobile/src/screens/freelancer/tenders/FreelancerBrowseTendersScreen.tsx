// mobile/src/screens/freelancer/tenders/FreelancerBrowseTendersScreen.tsx

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
import { useThemeStore } from '../../../store/themeStore';
import { useFreelanceTenders } from '../../../hooks/useFreelanceTender';
import type {
  FreelanceTenderFilters,
  FreelanceTenderListItem,
} from '../../../types/freelanceTender';
import FreelanceTenderCard from '../../../components/freelanceTenders/FreelanceTenderCard';
import FreelanceTenderSkeleton from '../../../components/freelanceTenders/FreelanceTenderSkeleton';
import FreelanceTenderEmptyState from '../../../components/freelanceTenders/FreelanceTenderEmptyState';
import FreelanceTenderFiltersSheet from '../../../components/freelanceTenders/FreelanceTenderFilters';

// ─── Active filter chips ──────────────────────────────────────────────────────

function countFilters(f: FreelanceTenderFilters): number {
  let n = 0;
  if (f.procurementCategory) n++;
  if (f.engagementType) n++;
  if (f.minBudget != null || f.maxBudget != null) n++;
  if (f.experienceLevel && f.experienceLevel !== 'any') n++;
  if (f.urgency) n++;
  if (f.projectType) n++;
  return n;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

const FreelancerBrowseTendersScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const navigation = useNavigation<any>();

  const [filters, setFilters] = useState<FreelanceTenderFilters>({
    page: 1,
    limit: 15,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useFreelanceTenders(filters);

  const allTenders: FreelanceTenderListItem[] = (data?.pages ?? []).flatMap((p) => p.tenders);
  const totalCount = data?.pages?.[0]?.pagination?.total ?? 0;
  const activeFilterCount = countFilters(filters);

  // Debounced search
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: text || undefined, page: 1 }));
    }, 350);
  };

  const clearSearch = () => {
    setSearchText('');
    setFilters((prev) => ({ ...prev, search: undefined, page: 1 }));
  };

  const applyFilters = useCallback((newFilters: FreelanceTenderFilters) => {
    setFilters({ ...newFilters, search: filters.search, page: 1 });
  }, [filters.search]);

  const renderItem = useCallback(
    ({ item }: { item: FreelanceTenderListItem }) => (
      <FreelanceTenderCard
        tender={item}
        onPress={() => navigation.navigate('FreelancerTenderDetail', { tenderId: item._id })}
        role="freelancer"
      />
    ),
    [navigation]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background ?? c.card }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.screenTitle, { color: c.text }]}>Find Work</Text>
          <Text style={[styles.screenSubtitle, { color: c.textMuted }]}>
            {isLoading ? 'Loading…' : `${totalCount.toLocaleString()} projects`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('FreelancerSavedTenders')}
          style={[styles.savedBtn, { borderColor: c.border ?? c.textMuted + '44' }]}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <Ionicons name="bookmark-outline" size={18} color={c.primary} />
          <Text style={[styles.savedBtnText, { color: c.primary }]}>Saved</Text>
        </TouchableOpacity>
      </View>

      {/* Search + Filter row */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchField,
            { backgroundColor: c.surface ?? c.card, borderColor: c.border ?? c.textMuted + '44' },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={c.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            value={searchText}
            onChangeText={handleSearchChange}
            placeholder="Search projects, skills…"
            placeholderTextColor={c.textMuted}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={16} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={[
            styles.filterBtn,
            {
              backgroundColor: activeFilterCount > 0 ? c.primary : c.surface ?? c.card,
              borderColor: activeFilterCount > 0 ? c.primary : c.border ?? c.textMuted + '44',
            },
          ]}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFilterCount > 0 ? '#fff' : c.textMuted}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sort info */}
      {!isLoading && allTenders.length > 0 && (
        <View style={[styles.sortBar, { borderBottomColor: c.border ?? c.textMuted + '22' }]}>
          <Text style={[styles.sortText, { color: c.textMuted }]}>
            Sorted by {filters.sortBy === 'deadline' ? 'deadline' : 'newest first'}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity
              onPress={() =>
                setFilters({ page: 1, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' })
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
            >
              <Text style={[styles.clearFiltersText, { color: c.primary }]}>
                Clear filters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <FreelanceTenderSkeleton count={4} />
      ) : (
        <FlashList
          data={allTenders}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={c.primary}
            />
          }
          ListEmptyComponent={
            <FreelanceTenderEmptyState
              message={
                filters.search
                  ? `No results for "${filters.search}"`
                  : 'No tenders available right now'
              }
              actionLabel={filters.search ? 'Clear search' : undefined}
              onAction={filters.search ? clearSearch : undefined}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={c.primary} style={{ padding: 20 }} />
            ) : null
          }
        />
      )}

      {/* Filters bottom sheet */}
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: 24, fontWeight: '800' },
  screenSubtitle: { fontSize: 13, marginTop: 2 },
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
  savedBtnText: { fontSize: 13, fontWeight: '600' },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    minHeight: 48,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortText: { fontSize: 12 },
  clearFiltersText: { fontSize: 12, fontWeight: '600' },
  list: { padding: 16 },
});

export default FreelancerBrowseTendersScreen;