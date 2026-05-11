/**
 * screens/freelancers/FreelancerMarketplaceScreen.tsx
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { FONT_SIZE } from '../../theme/tokens';
import {
  useListFreelancers,
  useToggleShortlist,
} from '../../hooks/useFreelancerMarketplace';
import {
  FreelancerCard,
  FreelancerCardSkeleton,
} from '../../components/freelancer/FreelancerCard';
import {
  FreelancerListItem,
  AvailabilityStatus,
  ExperienceLevel,
} from '../../services/freelancerMarketplaceService';

const AVAILABILITY_OPTIONS: { label: string; value: AvailabilityStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Busy', value: 'busy' },
];

const EXPERIENCE_OPTIONS: { label: string; value: ExperienceLevel | 'all' }[] = [
  { label: 'All',    value: 'all' },
  { label: 'Junior', value: 'junior' },
  { label: 'Mid',    value: 'mid' },
  { label: 'Senior', value: 'senior' },
  { label: 'Expert', value: 'expert' },
];

export const FreelancerMarketplaceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, spacing, radius, isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [availability, setAvailability] = useState<AvailabilityStatus | 'all'>('all');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const searchRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchRef.current !== null) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    availability: availability === 'all' ? undefined : availability,
    experienceLevel: experienceLevel === 'all' ? undefined : experienceLevel,
  }), [debouncedSearch, availability, experienceLevel]);

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching,
  } = useListFreelancers(filters);

  const { mutate: toggleShortlist } = useToggleShortlist();

  const freelancers: FreelancerListItem[] = useMemo(
    () => data?.pages.flatMap(p => p.freelancers) ?? [],
    [data],
  );

  const hasActiveFilters = availability !== 'all' || experienceLevel !== 'all' || debouncedSearch.length > 0;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: FreelancerListItem }) => (
      <FreelancerCard
        freelancer={item}
        onPress={() => navigation.navigate('FreelancerDetail', { freelancerId: item._id })}
        onToggleShortlist={() => toggleShortlist(item._id)}
        style={{ margin: 6 }}
      />
    ),
    [navigation, toggleShortlist],
  );

  const ListHeader = (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
      {/* Search */}
      <View style={[styles.searchRow, {
        backgroundColor: colors.inputBg,
        borderColor: colors.border,
        borderRadius: radius.xl,
      }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name, skill, profession…"
          placeholderTextColor={colors.inputPlaceholder}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setShowFilters(p => !p)}
          style={[styles.filterBtn, { backgroundColor: showFilters ? colors.primary : colors.bg }]}
        >
          <Ionicons name="options-outline" size={17} color={showFilters ? '#fff' : colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={[styles.filterPanel, {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.lg,
        }]}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Availability</Text>
          <View style={styles.chipRow}>
            {AVAILABILITY_OPTIONS.map(opt => {
              const active = availability === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setAvailability(opt.value as AvailabilityStatus | 'all')}
                  style={[styles.chip, {
                    backgroundColor: active ? colors.primary : colors.inputBg,
                    borderColor: active ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : colors.textSecondary }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.filterLabel, { color: colors.textSecondary, marginTop: 10 }]}>Experience</Text>
          <View style={styles.chipRow}>
            {EXPERIENCE_OPTIONS.map(opt => {
              const active = experienceLevel === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setExperienceLevel(opt.value as ExperienceLevel | 'all')}
                  style={[styles.chip, {
                    backgroundColor: active ? colors.primary : colors.inputBg,
                    borderColor: active ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : colors.textSecondary }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Result count */}
      {!isLoading && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, paddingBottom: 4 }}>
          <Text style={[styles.resultCount, { color: colors.textMuted }]}>
            {data?.pages[0]?.pagination.total ?? 0} freelancers found
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={() => {
              setAvailability('all');
              setExperienceLevel('all');
              setSearch('');
              setDebouncedSearch('');
            }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Find Freelancers</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('FreelancerShortlist')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="bookmark-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <FreelancerCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={freelancers}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          numColumns={2}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={52} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No freelancers found</Text>
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Try adjusting your filters</Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, gap: 8, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, height: 22 },
  filterBtn: { padding: 5, borderRadius: 8 },
  filterPanel: { padding: 14, borderWidth: 1, marginBottom: 8 },
  filterLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  resultCount: { fontSize: 12 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 10 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptyHint: { fontSize: 13 },
});