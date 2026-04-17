/**
 * src/screens/candidate/ApplicationTracker.tsx
 * Candidate's "My Applications" tab with status filters, stats banner, FlashList.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import {
  useMyApplicationsPaginated, useWithdrawApplication, useApplicationStats,
} from '../../hooks/useApplications';
import { Application, ApplicationFilters } from '../../services/applicationService';
import { ApplicationCard } from '../../components/application/ApplicationCard';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';

interface Props { navigation: any }

const STATUS_FILTERS = [
  { key: undefined,            label: 'All',        color: '#64748B' },
  { key: 'applied',            label: 'Applied',    color: '#3B82F6' },
  { key: 'under-review',       label: 'In Review',  color: '#F59E0B' },
  { key: 'shortlisted',        label: 'Shortlisted',color: '#10B981' },
  { key: 'interview-scheduled',label: 'Interview',  color: '#8B5CF6' },
  { key: 'offer-made',         label: 'Offer',      color: '#059669' },
  { key: 'rejected',           label: 'Rejected',   color: '#EF4444' },
] as const;

export const ApplicationTracker: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);

  const filters: Omit<ApplicationFilters, 'page'> = useMemo(() =>
    activeStatus ? { status: activeStatus, limit: 15 } : { limit: 15 },
    [activeStatus],
  );

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } =
    useMyApplicationsPaginated(filters);
  const withdrawMut = useWithdrawApplication();
  const statsQ = useApplicationStats();
  const stats = statsQ.data;

  const apps: Application[] = useMemo(
    () => (data?.pages ?? []).flatMap(p => p.data),
    [data],
  );
  const total = data?.pages[0]?.pagination?.totalResults ?? 0;

  const renderItem = useCallback(({ item }: { item: Application }) => (
    <ApplicationCard
      application={item}
      onPress={() => navigation.navigate('ApplicationDetail', { applicationId: item._id })}
      onWithdraw={() => withdrawMut.mutate(item._id)}
    />
  ), [navigation, withdrawMut]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={[s.title, { color: c.text }]}>My Applications</Text>
        <Text style={[s.count, { color: c.textMuted }]}>{total} total</Text>
      </View>

      {/* Stats cards */}
      {stats && (
        <View style={s.statsRow}>
          <StatCard label="Applied" value={stats.totalApplications ?? 0} color="#3B82F6" c={c} />
          <StatCard label="Shortlisted" value={stats.shortlisted ?? 0} color="#10B981" c={c} />
          <StatCard label="Interviews" value={stats.interviewScheduled ?? 0} color="#8B5CF6" c={c} />
          <StatCard label="Offers" value={stats.hired ?? 0} color="#F59E0B" c={c} />
        </View>
      )}

      {/* Status filter tabs */}
      <View style={[s.tabsWrapper, { borderBottomColor: c.border }]}>
        <FlashList
          data={STATUS_FILTERS as unknown as any[]}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item: tab }) => {
            const active = activeStatus === tab.key;
            return (
              <TouchableOpacity
                onPress={() => setActiveStatus(tab.key as any)}
                style={[s.tab, active && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}
              >
                {tab.color !== '#64748B' && (
                  <View style={[s.tabDot, { backgroundColor: tab.color }]} />
                )}
                <Text style={[s.tabText, { color: active ? tab.color : c.textMuted }, active && { fontWeight: '700' }]}>
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
        <ListSkeleton count={4} type="application" />
      ) : (
        <FlashList
          data={apps}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={s.list}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          onRefresh={refetch}
          refreshing={false}
          ListFooterComponent={isFetchingNextPage ? <ListSkeleton count={2} type="application" /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title={activeStatus ? `No ${activeStatus} applications` : "No applications yet"}
              subtitle="Start applying to jobs to track your progress here."
              actionLabel="Browse Jobs"
              onAction={() => navigation.navigate('Jobs')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const StatCard = ({ label, value, color, c }: any) => (
  <View style={[ss.card, { backgroundColor: `${color}12`, borderColor: `${color}25` }]}>
    <Text style={[ss.value, { color }]}>{value}</Text>
    <Text style={[ss.label, { color: c.textMuted }]}>{label}</Text>
  </View>
);

const ss = StyleSheet.create({
  card:  { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, marginHorizontal: 3 },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title:      { fontSize: 24, fontWeight: '800' },
  count:      { fontSize: 13 },
  statsRow:   { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 12 },
  tabsWrapper:{ borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  tab:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 5 },
  tabDot:     { width: 6, height: 6, borderRadius: 3 },
  tabText:    { fontSize: 12 },
  list:       { padding: 14 },
});
