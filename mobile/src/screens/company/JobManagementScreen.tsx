/**
 * src/screens/company/JobManagementScreen.tsx
 * FIXED: Removed SafeAreaView, removed useSafeAreaInsets manual padding
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useCompanyJobs, useDeleteJob, useUpdateJob } from '../../hooks/useJobs';
import { Job, JobStatus } from '../../services/jobService';
import { CompanyJobCard } from '../../components/jobs/CompanyJobCard';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { FONT_SIZE } from '../../theme/tokens';

interface Props { navigation: any }

type TabStatus = Exclude<JobStatus, undefined> | 'expired';

export const JobManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const [activeStatus, setActiveStatus] = useState<TabStatus | undefined>(undefined);
  const [search, setSearch] = useState('');

  const STATUS_TABS = useMemo(() => [
    { key: undefined,  label: 'All',     color: colors.textMuted },
    { key: 'active',   label: 'Active',  color: colors.success },
    { key: 'expired',  label: 'Expired', color: colors.danger },
    { key: 'draft',    label: 'Draft',   color: colors.textMuted },
    { key: 'paused',   label: 'Paused',  color: colors.warning },
    { key: 'closed',   label: 'Closed',  color: colors.danger },
  ], [colors]);

  // When the "expired" tab is selected, query active jobs and filter client-side.
  // Expired = active status but applicationDeadline has passed.
  const queryStatus = activeStatus === 'expired' ? 'active' : activeStatus as JobStatus | undefined;

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } =
    useCompanyJobs({ status: queryStatus, limit: 50 });

  const deleteMut = useDeleteJob();
  const updateMut = useUpdateJob();

  const now = Date.now();

  const allJobs: Job[] = useMemo(() => (data?.pages ?? []).flatMap(p => p.jobs), [data]);

  // When tab = 'active': exclude jobs whose deadline has passed
  // When tab = 'expired': only jobs whose deadline has passed
  const tabFilteredJobs = useMemo(() => {
    if (activeStatus === 'active') {
      return allJobs.filter(j => {
        if (!j.applicationDeadline) return true;
        return new Date(j.applicationDeadline).getTime() > now;
      });
    }
    if (activeStatus === 'expired') {
      return allJobs.filter(j =>
        j.applicationDeadline && new Date(j.applicationDeadline).getTime() <= now
      );
    }
    return allJobs;
  }, [allJobs, activeStatus, now]);

  const jobs = useMemo(() => {
    if (!search.trim()) return tabFilteredJobs;
    const q = search.toLowerCase();
    return tabFilteredJobs.filter(j =>
      j.title.toLowerCase().includes(q) || (j.category ?? '').toLowerCase().includes(q),
    );
  }, [tabFilteredJobs, search]);

  const totalJobs = data?.pages[0]?.pagination?.totalResults ?? 0;

  const handleDelete = useCallback((job: Job) => {
    Alert.alert(
      'Delete Job',
      `Delete "${job.title ?? 'this job'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(job._id) },
      ],
    );
  }, [deleteMut]);

  const handleStatusToggle = useCallback((job: Job, newStatus: 'active' | 'paused' | 'closed') => {
    updateMut.mutate({ id: job._id, data: { status: newStatus } });
  }, [updateMut]);

  const renderItem = useCallback(({ item }: { item: Job }) => (
    <CompanyJobCard
      job={item}
      onEdit={() => navigation.navigate('JobEdit', { jobId: item._id })}
      onDelete={() => handleDelete(item)}
      onViewApplicants={() => navigation.navigate('ApplicationList', { jobId: item._id })}
      onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}
      onToggleStatus={(status) => handleStatusToggle(item, status)}
    />
  ), [navigation, handleDelete, handleStatusToggle]);

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[s.header, { paddingHorizontal: spacing.lg }]}>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Job Postings</Text>
          <Text style={[s.subtitle, { color: colors.textMuted }]}>
            {totalJobs} total job{totalJobs !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('JobCreate') ?? navigation.navigate('JobCreate')}
          style={[s.createBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text style={[s.createBtnText, { color: colors.textInverse }]}>Post Job</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[s.searchRow, { backgroundColor: colors.bgCard, borderColor: colors.border, marginHorizontal: spacing.lg }]}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={[s.searchInput, { color: colors.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search jobs..."
          placeholderTextColor={colors.inputPlaceholder}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status tabs */}
      <View style={[s.tabsWrapper, { borderBottomColor: colors.border }]}>
        <FlashList
          data={STATUS_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md }}
          renderItem={({ item: tab }) => {
            const active = activeStatus === tab.key;
            return (
              <TouchableOpacity
                onPress={() => setActiveStatus(tab.key as TabStatus | undefined)}
                style={[
                  s.tab,
                  active && {
                    backgroundColor: `${tab.color}18`,
                    borderBottomColor: tab.color,
                    borderBottomWidth: 2,
                  },
                ]}
              >
                {tab.key && <View style={[s.tabDot, { backgroundColor: tab.color }]} />}
                <Text style={[
                  s.tabText,
                  { color: active ? tab.color : colors.textMuted },
                  active && { fontWeight: '700' },
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={item => String(item.key ?? 'all')}
        />
      </View>

      {/* List */}
      {isLoading ? (
        <ListSkeleton count={4} type="job" />
      ) : (
        <FlashList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          onRefresh={refetch}
          refreshing={false}
          ListFooterComponent={isFetchingNextPage ? <ListSkeleton count={2} type="job" /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title={
                search ? 'No matching jobs'
                : activeStatus === 'expired' ? 'No expired jobs'
                : activeStatus ? `No ${activeStatus} jobs`
                : 'No jobs posted yet'
              }
              subtitle={!activeStatus && !search ? 'Create your first job posting to start hiring.' : undefined}
              actionLabel="Post a Job"
              onAction={() => navigation.getParent()?.navigate('JobCreate') ?? navigation.navigate('JobCreate')}
            />
          }
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 10 },
  title:         { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  subtitle:      { fontSize: FONT_SIZE.sm, marginTop: 2 },
  createBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  createBtnText: { fontSize: FONT_SIZE.base, fontWeight: '700' },
  searchRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput:   { flex: 1, fontSize: FONT_SIZE.base },
  tabsWrapper:   { borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  tab:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  tabDot:        { width: 6, height: 6, borderRadius: 3 },
  tabText:       { fontSize: FONT_SIZE.sm },
});