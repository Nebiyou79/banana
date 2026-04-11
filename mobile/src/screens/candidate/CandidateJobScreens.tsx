// ─────────────────────────────────────────────────────────────────────────────
// screens/candidate/JobListScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore }  from '../../store/themeStore';
import { useAuthStore }   from '../../store/authStore';
import { useJobs, useCandidateJobs, useSavedJobs, useSaveJob, useUnsaveJob } from '../../hooks/useJobs';
import { JobCard }        from '../../components/jobs/JobCard';
import { JobFilter }      from '../../components/jobs/JobComponents';
import { Job, JobFilters } from '../../services/jobService';
import type { CandidateStackParamList } from '../../navigation/CandidateNavigator';

type Nav = NativeStackNavigationProp<CandidateStackParamList>;

export const JobListScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const { role } = useAuthStore();

  const [search,      setSearch]      = useState('');
  const [filters,     setFilters]     = useState<Omit<JobFilters, 'page' | 'search'>>({});
  const [showFilter,  setShowFilter]  = useState(false);
  const [searchActive, setSearchActive] = useState('');

  // Use candidate jobs if authenticated as candidate, public jobs otherwise
  const isCandidate = role === 'candidate';
  const mergedFilters = { ...filters, search: searchActive || undefined };

  const candidateQuery = useCandidateJobs(isCandidate ? mergedFilters : undefined);
  const publicQuery    = useJobs(!isCandidate ? mergedFilters : undefined);
  const query          = isCandidate ? candidateQuery : publicQuery;

  const { data: savedJobsData } = useSavedJobs();
  const savedIds = new Set((savedJobsData ?? []).map((j) => j._id));
  const saveJob   = useSaveJob();
  const unsaveJob = useUnsaveJob();

  const allJobs: Job[] = query.data?.pages.flatMap((p) => p.jobs) ?? [];

  const handleSaveToggle = (job: Job) => {
    if (savedIds.has(job._id)) unsaveJob.mutate(job._id);
    else saveJob.mutate(job._id);
  };

  const handleSearchSubmit = () => setSearchActive(search);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <Text style={[s.headerTitle, { color: colors.text, fontSize: typography.xl }]}>Find Jobs</Text>
        <TouchableOpacity onPress={() => setShowFilter(true)} style={s.filterBtn}>
          <Ionicons name="options-outline" size={22} color={colors.primary} />
          {activeFilterCount > 0 && (
            <View style={[s.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={[s.searchWrap, { paddingHorizontal: spacing[4], paddingBottom: 8 }]}>
        <View style={[s.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[s.searchInput, { color: colors.text, fontSize: typography.base, flex: 1 }]}
            placeholder="Search jobs, companies…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setSearchActive(''); }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <View style={[s.activeChips, { paddingHorizontal: spacing[4] }]}>
          {Object.entries(filters).map(([k, v]) =>
            v ? (
              <TouchableOpacity
                key={k}
                style={[s.activeChip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
                onPress={() => setFilters((f) => ({ ...f, [k]: undefined }))}
              >
                <Text style={[{ color: colors.primary, fontSize: typography.xs, fontWeight: '600' }]}>
                  {String(v)} ×
                </Text>
              </TouchableOpacity>
            ) : null
          )}
        </View>
      )}

      {/* Job list */}
      <FlatList
        data={allJobs}
        keyExtractor={(j) => j._id}
        contentContainerStyle={{ paddingHorizontal: spacing[4], paddingTop: 8, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => navigation.navigate('JobDetails', { jobId: item._id })}
            onSave={() => handleSaveToggle(item)}
            isSaved={savedIds.has(item._id)}
          />
        )}
        onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); }}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          !query.isLoading ? (
            <View style={s.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={[s.emptyTitle, { color: colors.text, fontSize: typography.lg }]}>No jobs found</Text>
              <Text style={[s.emptySubtitle, { color: colors.textMuted, fontSize: typography.sm }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          ) : <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
        }
      />

      {/* Filter bottom sheet */}
      <JobFilter
        visible={showFilter}
        filters={filters}
        onApply={(f) => { setFilters(f); query.refetch(); }}
        onReset={() => setFilters({})}
        onClose={() => setShowFilter(false)}
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// screens/candidate/SavedJobsScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────

export const SavedJobsScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const { data: savedJobs = [], isLoading, refetch, isRefetching } = useSavedJobs();
  const unsaveJob = useUnsaveJob();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text, fontSize: typography.xl, flex: 1 }]}>Saved Jobs</Text>
        {savedJobs.length > 0 && (
          <View style={[sv.countBadge, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[{ color: colors.primary, fontSize: typography.xs, fontWeight: '700' }]}>{savedJobs.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={savedJobs}
        keyExtractor={(j) => j._id}
        contentContainerStyle={{ paddingHorizontal: spacing[4], paddingTop: 12, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => navigation.navigate('JobDetails', { jobId: item._id })}
            onSave={() => unsaveJob.mutate(item._id)}
            isSaved
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color={colors.textMuted} />
              <Text style={[s.emptyTitle, { color: colors.text, fontSize: typography.lg }]}>No saved jobs yet</Text>
              <Text style={[s.emptySubtitle, { color: colors.textMuted, fontSize: typography.sm }]}>
                Browse jobs and save ones you like
              </Text>
              <TouchableOpacity
                style={[sv.browseBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('JobList')}
              >
                <Text style={[{ color: '#fff', fontWeight: '700', fontSize: typography.base }]}>Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          ) : <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
        }
      />
    </SafeAreaView>
  );
};

const sv = StyleSheet.create({
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  browseBtn:  { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99, marginTop: 16 },
});

// ─────────────────────────────────────────────────────────────────────────────
// screens/candidate/JobDetailsScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { ScrollView, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useJob } from '../../hooks/useJobs';
import { JobDetailsHeader } from '../../components/jobs/JobComponents';

type JobDetailsRoute = RouteProp<CandidateStackParamList, 'JobDetails'>;

export const JobDetailsScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const route      = useRoute<JobDetailsRoute>();
  const { jobId }  = route.params;

  const { data: job, isLoading, isError, refetch } = useJob(jobId);
  const savedJobsQuery = useSavedJobs();
  const saveJob        = useSaveJob();
  const unsaveJob      = useUnsaveJob();

  const savedIds = new Set((savedJobsQuery.data ?? []).map((j) => j._id));
  const isSaved  = savedIds.has(jobId);

  if (isLoading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );

  if (isError || !job) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={s.emptyState}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[s.emptyTitle, { color: colors.text, fontSize: typography.lg }]}>Job not found</Text>
        <TouchableOpacity onPress={() => refetch()} style={[sv.browseBtn, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.base }}>Retry</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const canApply = job.isApplyEnabled && job.applicationInfo?.canApply !== false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Back button overlay */}
      <TouchableOpacity
        style={[jd.backBtn, { backgroundColor: colors.surface + 'CC' }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <JobDetailsHeader job={job} />

        <View style={{ paddingHorizontal: spacing[5] }}>
          {/* About the Role */}
          <Text style={[jd.sectionTitle, { color: colors.text, fontSize: typography.lg }]}>About the Role</Text>
          <Text style={[{ color: colors.textMuted, fontSize: typography.base, lineHeight: 24 }]}>
            {job.description}
          </Text>

          {/* Requirements */}
          {job.requirements?.length > 0 && (
            <>
              <Text style={[jd.sectionTitle, { color: colors.text, fontSize: typography.lg }]}>Requirements</Text>
              {job.requirements.map((r, i) => (
                <View key={i} style={jd.bulletRow}>
                  <View style={[jd.bullet, { backgroundColor: colors.primary }]} />
                  <Text style={[{ color: colors.textMuted, fontSize: typography.base, lineHeight: 22, flex: 1 }]}>{r}</Text>
                </View>
              ))}
            </>
          )}

          {/* Skills */}
          {job.skills?.length > 0 && (
            <>
              <Text style={[jd.sectionTitle, { color: colors.text, fontSize: typography.lg }]}>Skills Required</Text>
              <View style={jd.chipsRow}>
                {job.skills.map((sk) => (
                  <View key={sk} style={[jd.chip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
                    <Text style={[{ color: colors.primary, fontSize: typography.sm, fontWeight: '600' }]}>{sk}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* About the company */}
          <Text style={[jd.sectionTitle, { color: colors.text, fontSize: typography.lg }]}>About the Company</Text>
          <Text style={[{ color: colors.textMuted, fontSize: typography.base }]}>
            {job.company?.name ?? job.organization?.name ?? 'Company details not available'}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[jd.stickyBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[jd.saveOutlineBtn, { borderColor: colors.border }]}
          onPress={() => isSaved ? unsaveJob.mutate(jobId) : saveJob.mutate(jobId)}
        >
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            jd.applyBtn,
            { backgroundColor: canApply ? colors.primary : colors.border, flex: 1 },
          ]}
          disabled={!canApply}
          onPress={() => navigation.navigate('ApplyJob', { jobId, jobTitle: job.title })}
        >
          <Text style={[{ color: canApply ? '#fff' : colors.textMuted, fontWeight: '700', fontSize: typography.base }]}>
            {canApply ? 'Apply Now' : 'Applications Closed'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const jd = StyleSheet.create({
  backBtn:     { position: 'absolute', top: 44, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:{ fontWeight: '700', marginTop: 20, marginBottom: 10 },
  bulletRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet:      { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  chipsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip:        { borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  stickyBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 32, borderTopWidth: 1 },
  saveOutlineBtn:{ width: 50, height: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  applyBtn:    { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// screens/candidate/ApplyJobScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
type ApplyJobRoute = RouteProp<CandidateStackParamList, 'ApplyJob'>;

export const ApplyJobScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const route      = useRoute<ApplyJobRoute>();
  const { jobId, jobTitle } = route.params;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[s.headerTitle, { color: colors.text, fontSize: typography.base, flex: 1, marginLeft: 12 }]}
          numberOfLines={1}
        >
          Apply: {jobTitle}
        </Text>
      </View>

      {/* ApplyForm is defined in the Applications module (PROMPT 02).
          Import it from src/components/applications/ApplyForm when built. */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[5] }}>
        <Ionicons name="document-text-outline" size={56} color={colors.textMuted} />
        <Text style={[{ color: colors.text, fontWeight: '700', fontSize: typography.xl, marginTop: 16 }]}>
          Application Form
        </Text>
        <Text style={[{ color: colors.textMuted, textAlign: 'center', fontSize: typography.base, marginTop: 8 }]}>
          The ApplyForm component will be rendered here once the Applications module (Prompt 02) is built.
        </Text>
        <Text style={[{ color: colors.textMuted, fontSize: typography.sm, marginTop: 8 }]}>
          Job ID: {jobId}
        </Text>
      </View>
    </SafeAreaView>
  );
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontWeight: '700' },
  filterBtn:   { position: 'relative', padding: 4 },
  filterBadge: { position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  searchWrap:  { paddingTop: 8 },
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: {},
  activeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  activeChip:  { borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  emptyState:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, marginTop: 40 },
  emptyTitle:  { fontWeight: '700', marginTop: 12, marginBottom: 6 },
  emptySubtitle:{ textAlign: 'center' },
});
