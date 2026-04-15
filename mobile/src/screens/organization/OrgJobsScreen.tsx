/**
 * mobile/src/screens/organization/OrgJobsScreen.tsx
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useOrganizationJobs, useDeleteJob } from '../../hooks/useJobs';
import { Job } from '../../services/jobService';
import { CompanyJobCard } from '../../components/jobs/CompanyJobCard';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';

interface Props { navigation: any }

const STATUS_TABS = [
  { key: undefined, label: 'All' },
  { key: 'active',  label: 'Active' },
  { key: 'draft',   label: 'Draft' },
  { key: 'closed',  label: 'Closed' },
] as const;

type JobStatus = typeof STATUS_TABS[number]['key'] | 'paused' | 'archived';

export const OrgJobsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [activeStatus, setActiveStatus] = useState<JobStatus>(undefined);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useOrganizationJobs({
        status: activeStatus, limit: 15,
        remote: ''
    });
  const deleteMut = useDeleteJob();

  const jobs: Job[] = useMemo(() => (data?.pages ?? []).flatMap(p => p.jobs), [data]);

  const renderItem = useCallback(({ item }: { item: Job }) => (
    <CompanyJobCard
      job={item}
      onEdit={() => navigation.navigate('OrgJobEdit', { jobId: item._id })}
      onDelete={() => deleteMut.mutate(item._id)}
      onViewApplicants={() => navigation.navigate('OrgApplicants', { jobId: item._id, jobTitle: item.title })}
    />
  ), [navigation, deleteMut]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[s.header, { borderBottomColor: c.border }]}>
        <Text style={[s.title, { color: c.text }]}>Opportunities</Text>
        <TouchableOpacity
          style={[s.createBtn, { backgroundColor: c.primary }]}
          onPress={() => navigation.navigate('OrgJobCreate')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.createBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={STATUS_TABS as any}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
        renderItem={({ item }: any) => {
          const active = activeStatus === item.key;
          return (
            <TouchableOpacity
              style={[s.tab, { backgroundColor: active ? c.primary : c.inputBg, borderColor: active ? c.primary : c.border }]}
              onPress={() => setActiveStatus(item.key)}
            >
              <Text style={[s.tabText, { color: active ? '#fff' : c.textSecondary }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item: any) => String(item.key ?? 'all')}
      />

      {isLoading ? <ListSkeleton count={4} type="companyJob" /> : (
        <FlashList
          data={jobs} renderItem={renderItem} keyExtractor={i => i._id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3} onRefresh={refetch} refreshing={false}
          ListFooterComponent={isFetchingNextPage ? <ListSkeleton count={1} type="companyJob" /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title="No opportunities posted"
              subtitle="Post your first opportunity to start receiving applications"
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
  root:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title:        { fontSize: 22, fontWeight: '800' },
  createBtn:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  createBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
  tab:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  tabText:      { fontSize: 13, fontWeight: '600' },
  list:         { padding: 16 },
});