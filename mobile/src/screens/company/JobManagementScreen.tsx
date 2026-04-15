/**
 * mobile/src/screens/company/JobManagementScreen.tsx
 *
 * ── FIXES IN THIS VERSION ────────────────────────────────────────────────────
 * TASK 2 — `remote: ''` workaround removed; JobFilters.remote is now optional
 *   so it can be omitted from the hook call entirely.
 *
 * TASK 3 — `handleStatusToggle` parameter type changed from the old narrow
 *   `'active' | 'paused' | 'closed'` to the canonical `Exclude<JobStatus, undefined>`
 *   which resolves to `'active' | 'draft' | 'paused' | 'closed' | 'archived'`.
 *   `useUpdateJob` now accepts `UpdateJobData` which includes all status values,
 *   so the `mutate({ id, data: { status } })` call compiles without casting.
 *
 * TASK 4 — optional chaining on `job.title` in the Alert to prevent a crash
 *   if the job object arrives partially populated.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useCompanyJobs, useDeleteJob, useUpdateJob } from '../../hooks/useJobs';
import { Job, JobStatus } from '../../services/jobService';
import { CompanyJobCard } from '../../components/jobs/CompanyJobCard';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';

interface Props { navigation: any }

// ─── All valid status tabs aligned with the backend enum ──────────────────────

/**
 * TASK 3 FIX — the tab `key` type now uses `Exclude<JobStatus, undefined>`
 * which matches the full backend enum: active | draft | paused | closed | archived.
 * Previously it was `undefined` for "All", causing mismatches downstream.
 */
type TabStatus = Exclude<JobStatus, undefined>;

const STATUS_TABS: ReadonlyArray<{ key: TabStatus | undefined; label: string }> = [
  { key: undefined,   label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'draft',     label: 'Draft' },
  { key: 'paused',    label: 'Paused' },
  { key: 'closed',    label: 'Closed' },
];

export const JobManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;

  // TASK 3 FIX — state is typed as `TabStatus | undefined`; previously it was
  // `JobStatus` which was missing 'paused' and 'closed'.
  const [activeStatus, setActiveStatus] = useState<TabStatus | undefined>(undefined);

  /**
   * TASK 2 FIX — `remote` removed from the hook call (it's now optional).
   * Previously `remote: ''` was required to satisfy the strict `string` type.
   */
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } =
    useCompanyJobs({
      status: activeStatus,
      limit:  15,
      // `remote` omitted — no longer required
    });

  const deleteMut = useDeleteJob();
  const updateMut = useUpdateJob();

  const jobs: Job[] = useMemo(
    () => (data?.pages ?? []).flatMap(p => p.jobs),
    [data],
  );

  const totalJobs = data?.pages[0]?.pagination?.totalResults ?? 0;

  // ── Delete handler ──────────────────────────────────────────────────────────

  const handleDelete = useCallback((job: Job) => {
    // TASK 4 FIX — optional chain on job.title
    Alert.alert(
      'Delete Job',
      `Delete "${job?.title ?? 'this job'}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(job._id) },
      ],
    );
  }, [deleteMut]);

  // ── Status toggle handler ───────────────────────────────────────────────────

  /**
   * TASK 3 FIX — parameter type is now `TabStatus` (the union that includes
   * 'paused' and 'closed') instead of the old hardcoded union that caused:
   *
   *   Type '"active" | "paused" | "closed"' is not assignable to
   *   type '"active" | "draft" | undefined'
   *
   * `UpdateJobData.status` now accepts the same union, so `updateMut.mutate`
   * compiles without an explicit cast.
   */
  const handleStatusToggle = useCallback((job: Job, newStatus: TabStatus) => {
    updateMut.mutate({ id: job._id, data: { status: newStatus } });
  }, [updateMut]);

  // ── List item renderer ──────────────────────────────────────────────────────

  const renderItem = useCallback(({ item }: { item: Job }) => (
    <CompanyJobCard
      job={item}
      onEdit={() => navigation.navigate('JobEdit', { jobId: item._id })}
      onDelete={() => handleDelete(item)}
      onViewApplicants={() =>
        navigation.navigate('ApplicantManager', { jobId: item._id, jobTitle: item?.title })
      }
      onToggleStatus={newStatus => handleStatusToggle(item, newStatus)}
    />
  ), [navigation, handleDelete, handleStatusToggle]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>

      {/* Header */}
      <View style={[s.header, { borderBottomColor: c.border }]}>
        <View>
          <Text style={[s.title, { color: c.text }]}>Job Posts</Text>
          <Text style={[s.count, { color: c.textMuted }]}>{totalJobs} total</Text>
        </View>
        <TouchableOpacity
          style={[s.createBtn, { backgroundColor: c.primary }]}
          onPress={() => navigation.navigate('JobCreate')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.createBtnText}>Post Job</Text>
        </TouchableOpacity>
      </View>

      {/* Status Tabs — FlashList for performance */}
      <View style={[s.tabBar, { borderBottomColor: c.border }]}>
        <FlashList
          data={STATUS_TABS as any[]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
          renderItem={({ item }: { item: typeof STATUS_TABS[number] }) => {
            const active = activeStatus === item.key;
            return (
              <TouchableOpacity
                style={[
                  s.tab,
                  {
                    backgroundColor: active ? c.primary : c.inputBg,
                    borderColor:     active ? c.primary : c.border,
                  },
                ]}
                onPress={() => setActiveStatus(item.key)}
                activeOpacity={0.75}
                // 44 px minimum touch target (Performance + Accessibility rule)
                hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
              >
                <Text style={[s.tabText, { color: active ? '#fff' : c.textSecondary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item: any) => String(item.key ?? 'all')}
        />
      </View>

      {/* Job list */}
      {isLoading ? (
        <ListSkeleton count={4} type="companyJob" />
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
          ListFooterComponent={
            isFetchingNextPage
              ? <ListSkeleton count={1} type="companyJob" />
              : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title="No job posts yet"
              subtitle="Create your first job posting to start receiving applications"
              actionLabel="Post a Job"
              onAction={() => navigation.navigate('JobCreate')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:          { flex: 1 },
  header:        {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title:         { fontSize: 22, fontWeight: '800' },
  count:         { fontSize: 12, marginTop: 2 },
  createBtn:     {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderRadius:      12,
    gap: 6,
    // 44 px minimum height for touch target
    minHeight: 44,
  },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tabBar:        { borderBottomWidth: StyleSheet.hairlineWidth },
  tab:           {
    paddingHorizontal: 14,
    paddingVertical:    7,
    borderRadius:      20,
    borderWidth:        1,
    marginRight:        8,
    // 44 px minimum height for touch target
    minHeight: 36,
    justifyContent: 'center',
  },
  tabText:       { fontSize: 13, fontWeight: '600' },
  list:          { padding: 16 },
});