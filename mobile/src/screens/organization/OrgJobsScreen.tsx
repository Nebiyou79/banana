/**
 * src/screens/organization/OrgJobsScreen.tsx
 * Organization job management — same pattern as CompanyJobManagement
 * but uses org endpoints and OrgJobForm.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useOrganizationJobs, useDeleteOrganizationJob, useUpdateOrganizationJob } from '../../hooks/useJobs';
import { Job, JobStatus } from '../../services/jobService';
import { CompanyJobCard } from '../../components/jobs/CompanyJobCard';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';

interface Props { navigation: any }

type TabStatus = Exclude<JobStatus, undefined>;
const STATUS_TABS = [
  { key: undefined,   label: 'All' },
  { key: 'active',    label: 'Active',   color: '#10B981' },
  { key: 'draft',     label: 'Draft',    color: '#94A3B8' },
  { key: 'paused',    label: 'Paused',   color: '#F59E0B' },
  { key: 'closed',    label: 'Closed',   color: '#EF4444' },
] as const;

export const OrgJobsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [activeStatus, setActiveStatus] = useState<TabStatus | undefined>(undefined);
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } =
    useOrganizationJobs({ status: activeStatus, limit: 15 });

  const deleteMut = useDeleteOrganizationJob();
  const updateMut = useUpdateOrganizationJob();

  const allJobs: Job[] = useMemo(
    () => (data?.pages ?? []).flatMap(p => p.jobs),
    [data],
  );

  const jobs = useMemo(() => {
    if (!search.trim()) return allJobs;
    const q = search.toLowerCase();
    return allJobs.filter(j => j.title.toLowerCase().includes(q));
  }, [allJobs, search]);

  const totalJobs = data?.pages[0]?.pagination?.totalResults ?? 0;

  const handleDelete = useCallback((job: Job) => {
    Alert.alert(
      'Delete Opportunity',
      `Delete "${job.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(job._id) },
      ],
    );
  }, [deleteMut]);

  const handleStatusToggle = useCallback((job: Job, newStatus: 'active' | 'paused') => {
    updateMut.mutate({ id: job._id, data: { status: newStatus } });
  }, [updateMut]);

  const renderItem = useCallback(({ item }: { item: Job }) => (
    <CompanyJobCard
      job={item}
      onEdit={() => navigation.navigate('OrgJobEdit', { jobId: item._id })}
      onDelete={() => handleDelete(item)}
      onViewApplicants={() => navigation.navigate('ApplicationList', { jobId: item._id })}
      onPress={() => navigation.navigate('OrgJobDetail', { jobId: item._id })}
      onToggleStatus={(status) => handleStatusToggle(item, status)}
    />
  ), [navigation, handleDelete, handleStatusToggle]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: c.text }]}>Opportunities</Text>
          <Text style={[s.subtitle, { color: c.textMuted }]}>{totalJobs} posting{totalJobs !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('OrgJobCreate')}
          style={[s.createBtn, { backgroundColor: '#7C3AED' }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.createBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[s.searchRow, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name="search-outline" size={16} color={c.textMuted} />
        <TextInput
          style={[s.searchInput, { color: c.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search opportunities..."
          placeholderTextColor={c.placeholder ?? c.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[s.tabsWrapper, { borderBottomColor: c.border }]}>
        <FlashList
          data={STATUS_TABS as unknown as any[]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item: tab }) => {
            const active = activeStatus === tab.key;
            return (
              <TouchableOpacity
                onPress={() => setActiveStatus(tab.key)}
                style={[
                  s.tab,
                  active && {
                    backgroundColor: tab.color ? `${tab.color}18` : '#7C3AED18',
                    borderBottomColor: tab.color ?? '#7C3AED',
                    borderBottomWidth: 2,
                  },
                ]}
              >
                {tab.color && <View style={[s.tabDot, { backgroundColor: tab.color }]} />}
                <Text style={[s.tabText, { color: active ? (tab.color ?? '#7C3AED') : c.textMuted }, active && { fontWeight: '700' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={item => String(item.key ?? 'all')}
        />
      </View>

      {isLoading ? (
        <ListSkeleton count={4} type="job" />
      ) : (
        <FlashList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={s.list}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          onRefresh={refetch}
          refreshing={false}
          ListFooterComponent={isFetchingNextPage ? <ListSkeleton count={2} type="job" /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title={search ? 'No matches' : activeStatus ? `No ${activeStatus} postings` : 'No opportunities posted yet'}
              subtitle="Post your first opportunity to start finding talent."
              actionLabel="Post Opportunity"
              onAction={() => navigation.navigate('OrgJobCreate')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  title:         { fontSize: 24, fontWeight: '800' },
  subtitle:      { fontSize: 13, marginTop: 2 },
  createBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  searchRow:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput:   { flex: 1, fontSize: 14 },
  tabsWrapper:   { borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  tab:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  tabDot:        { width: 6, height: 6, borderRadius: 3 },
  tabText:       { fontSize: 13 },
  list:          { padding: 16 },
});
