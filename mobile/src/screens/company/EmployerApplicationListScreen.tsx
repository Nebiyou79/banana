/**
 * src/screens/company/EmployerApplicationListScreen.tsx
 * Company/org applications list — used by both roles (role-aware via authStore).
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import {
  useJobApplicationsPaginated,
  useCompanyApplicationsPaginated,
  useOrgApplicationsPaginated,
  useUpdateApplicationStatus,
} from '../../hooks/useApplications';
import { Application, ApplicationFilters, ApplicationStatus } from '../../services/applicationService';
import { ApplicantCard } from '../../components/application/ApplicantCard';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';

interface Props {
  navigation: any;
  route: { params?: { jobId?: string; jobTitle?: string } };
}

const STATUS_TABS = [
  { key: undefined,            label: 'All',        color: '#64748B' },
  { key: 'applied',            label: 'New',        color: '#3B82F6' },
  { key: 'under-review',       label: 'Reviewing',  color: '#F59E0B' },
  { key: 'shortlisted',        label: 'Shortlisted',color: '#10B981' },
  { key: 'interview-scheduled',label: 'Interview',  color: '#8B5CF6' },
  { key: 'rejected',           label: 'Rejected',   color: '#EF4444' },
] as const;

export const EmployerApplicationListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useThemeStore();
  const { user }  = useAuthStore();
  const c = theme.colors;

  const jobId    = route.params?.jobId;
  const jobTitle = route.params?.jobTitle;
  const isOrg    = user?.role === 'organization';

  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');

  const filters: Omit<ApplicationFilters, 'page'> = useMemo(() =>
    ({ status: activeStatus, limit: 20 }),
    [activeStatus],
  );

  // Pick correct hook based on whether we're drilling into a specific job or viewing all
  const jobQ     = useJobApplicationsPaginated(jobId ?? '', filters);
  const companyQ = useCompanyApplicationsPaginated(filters);
  const orgQ     = useOrgApplicationsPaginated(filters);

  const activeQ  = jobId ? jobQ : (isOrg ? orgQ : companyQ);
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } = activeQ;

  const updateMut = useUpdateApplicationStatus();

  const allApps: Application[] = useMemo(
    () => (data?.pages ?? []).flatMap(p => p.data),
    [data],
  );

  const apps = useMemo(() => {
    if (!search.trim()) return allApps;
    const q = search.toLowerCase();
    return allApps.filter(a =>
      (a.userInfo?.name ?? a.candidate?.name ?? '').toLowerCase().includes(q) ||
      (a.userInfo?.email ?? a.candidate?.email ?? '').toLowerCase().includes(q) ||
      (a.job?.title ?? '').toLowerCase().includes(q),
    );
  }, [allApps, search]);

  const total = data?.pages[0]?.pagination?.totalResults ?? 0;

  const handleQuickUpdate = useCallback((applicationId: string, status: ApplicationStatus) => {
    updateMut.mutate({ applicationId, data: { status } });
  }, [updateMut]);

  const renderItem = useCallback(({ item }: { item: Application }) => (
    <ApplicantCard
      application={item}
      onPress={() => navigation.navigate('ApplicationDetail', { applicationId: item._id })}
      onShortlist={() => handleQuickUpdate(item._id, 'shortlisted')}
      onReject={() => handleQuickUpdate(item._id, 'rejected')}
      onScheduleInterview={() => {
        navigation.navigate('ApplicationDetail', { applicationId: item._id });
      }}
    />
  ), [navigation, handleQuickUpdate]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: c.text }]} numberOfLines={1}>
            {jobTitle ?? 'Applications'}
          </Text>
          <Text style={[s.subtitle, { color: c.textMuted }]}>{total} applicant{total !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[s.searchRow, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name="search-outline" size={16} color={c.textMuted} />
        <TextInput
          style={[s.searchInput, { color: c.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email..."
          placeholderTextColor={c.placeholder ?? c.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status tabs */}
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
                onPress={() => setActiveStatus(tab.key as any)}
                style={[s.tab, active && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}
              >
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
              icon="people-outline"
              title={activeStatus ? `No ${activeStatus} applications` : 'No applications yet'}
              subtitle="Applications will appear here once candidates apply."
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 12 },
  backBtn:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 18, fontWeight: '800' },
  subtitle:   { fontSize: 12, marginTop: 1 },
  searchRow:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput:{ flex: 1, fontSize: 14 },
  tabsWrapper:{ borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  tab:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 5 },
  tabText:    { fontSize: 12 },
  list:       { padding: 14 },
});
