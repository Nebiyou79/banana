/**
 * mobile/src/screens/candidate/JobBrowseScreen.tsx
 * High-performance job explorer with search + advanced filters + FlashList.
 * Performance-List-Specialist: FlashList, React.memo cards, Skeleton, EmptyState.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useCandidateJobs, useSaveJob, useUnsaveJob } from '../../hooks/useJobs';
import { Job, JobFilters } from '../../services/jobService';
import { CandidateJobCard } from '../../components/jobs/CandidateJobCard';
import { JobFilter } from '../../components/jobs/JobFilter';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';

interface Props { navigation: any }

const SORT_OPTIONS = [
  { key: 'createdAt', label: 'Latest' },
  { key: 'relevance', label: 'Relevance' },
  { key: 'salary',    label: 'Salary' },
];

export const JobBrowseScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<JobFilters>({} as JobFilters);
  const [sortBy, setSortBy] = useState('createdAt');
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const searchTimeout = useRef<any>(null);

  const queryFilters = useMemo<JobFilters>(() => ({
    ...filters,
    search: search.length > 1 ? search : undefined,
    sortBy,
    sortOrder: 'desc',
    limit: 15,
  }), [filters, search, sortBy]);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } =
    useCandidateJobs(queryFilters);

  const saveMut   = useSaveJob();
  const unsaveMut = useUnsaveJob();

  const jobs: Job[] = useMemo(() =>
    (data?.pages ?? []).flatMap(p => p.jobs),
    [data]
  );

  const totalResults = data?.pages[0]?.pagination?.totalResults ?? 0;

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleSave = useCallback((jobId: string) => {
    const isSaved = savedJobs.has(jobId);
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(jobId); else next.add(jobId);
      return next;
    });
    if (isSaved) unsaveMut.mutate(jobId); else saveMut.mutate(jobId);
  }, [savedJobs, saveMut, unsaveMut]);

  const activeFilterCount = useMemo(() =>
    Object.values(filters).filter(v => v !== undefined && v !== '').length,
    [filters]
  );

  const renderItem = useCallback(({ item }: { item: Job }) => (
    <CandidateJobCard
      job={item}
      onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}
      onSave={() => handleSave(item._id)}
      isSaved={savedJobs.has(item._id)}
    />
  ), [navigation, handleSave, savedJobs]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={[s.title, { color: c.text }]}>Explore Jobs</Text>
        {totalResults > 0 && (
          <Text style={[s.count, { color: c.textMuted }]}>{totalResults.toLocaleString()} jobs</Text>
        )}
      </View>

      {/* Search bar */}
      <View style={s.searchRow}>
        <View style={[s.searchBar, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="search-outline" size={18} color={c.textMuted} />
          <TextInput
            style={[s.searchInput, { color: c.text }]}
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Search jobs, companies, skills…"
            placeholderTextColor={c.placeholder}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close-circle" size={16} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <JobFilter filters={filters} onChange={setFilters} activeCount={activeFilterCount} />
      </View>

      {/* Sort tabs */}
      <View style={[s.sortRow, { borderBottomColor: c.border }]}>
        {SORT_OPTIONS.map(opt => {
          const active = sortBy === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[s.sortTab, active && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
              onPress={() => setSortBy(opt.key)}
            >
              <Text style={[s.sortText, { color: active ? c.primary : c.textMuted, fontWeight: active ? '700' : '400' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Job list */}
      {isLoading ? (
        <ListSkeleton count={4} type="job" />
      ) : (
        <FlashList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          onRefresh={refetch}
          refreshing={false}
          ListFooterComponent={isFetchingNextPage ? <ListSkeleton count={2} type="job" /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title={search ? 'No results found' : 'No jobs available'}
              subtitle={search ? `No jobs matching "${search}"` : 'Check back later for new opportunities'}
              actionLabel={search || activeFilterCount > 0 ? 'Clear Filters' : undefined}
              onAction={() => { setSearch(''); setFilters({} as JobFilters); }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  title:       { fontSize: 24, fontWeight: '800' },
  count:       { fontSize: 13 },
  searchRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  searchBar:   { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  sortRow:     { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  sortTab:     { paddingVertical: 10, marginRight: 20 },
  sortText:    { fontSize: 14 },
  list:        { padding: 16 },
});