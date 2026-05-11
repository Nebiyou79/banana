/**
 * src/screens/candidate/ApplicationTracker.tsx
 * Refactored: useTheme(), correct color aliases, estimatedItemSize on FlashList.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import {
  useMyApplicationsPaginated,
  useWithdrawApplication,
  useApplicationStats,
} from '../../hooks/useApplications';
import {
  Application,
  ApplicationFilters,
  STATUS_LABELS,
  STATUS_COLORS,
  ApplicationStatus,
} from '../../services/applicationService';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { ApplicationCard } from '../../components/application';

interface Props { navigation: any }

const STATUS_FILTERS: Array<{ key?: string; label: string; color: string }> = [
  { key: undefined,             label: 'All',         color: '#64748B' },
  { key: 'applied',             label: 'Applied',     color: '#3B82F6' },
  { key: 'under-review',        label: 'In Review',   color: '#F59E0B' },
  { key: 'shortlisted',         label: 'Shortlisted', color: '#10B981' },
  { key: 'interview-scheduled', label: 'Interview',   color: '#8B5CF6' },
  { key: 'offer-made',          label: 'Offer',       color: '#059669' },
  { key: 'rejected',            label: 'Rejected',    color: '#EF4444' },
];

// ─── Stats banner ─────────────────────────────────────────────────────────────

const StatsBanner = ({ stats, total, colors: c }: { stats: any; total: number; colors: any }) => (
  <View style={[sb.container, { backgroundColor: c.bgCard, borderColor: c.border }]}>
    <StatItem label="Total"       value={total}                      color="#3B82F6" c={c} />
    <StatItem label="In Review"   value={stats?.underReview ?? 0}    color="#F59E0B" c={c} />
    <StatItem label="Shortlisted" value={stats?.shortlisted ?? 0}    color="#10B981" c={c} />
    <StatItem label="Interviews"  value={stats?.interviewScheduled ?? 0} color="#8B5CF6" c={c} />
  </View>
);

const StatItem = ({
  label, value, color, c,
}: { label: string; value: number; color: string; c: any }) => (
  <View style={sb.item}>
    <Text style={[sb.value, { color }]}>{value}</Text>
    <Text style={[sb.label, { color: c.textMuted }]}>{label}</Text>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

export const ApplicationTracker: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [refreshing,   setRefreshing]   = useState(false);

  const filters: Omit<ApplicationFilters, 'page'> = useMemo(
    () => (activeStatus ? { status: activeStatus, limit: 20 } : { limit: 20 }),
    [activeStatus],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useMyApplicationsPaginated(filters);

  const statsQ = useApplicationStats();
  const stats  = statsQ.data;

  const apps: Application[] = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.data),
    [data],
  );

  const total = data?.pages[0]?.pagination?.totalResults ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[s.headerTitle, { color: colors.text }]}>My Applications</Text>
        <Text style={[s.headerSub, { color: colors.textMuted }]}>{total} total</Text>
      </View>

      {/* Stats */}
      {!isLoading && <StatsBanner stats={stats} total={total} colors={colors} />}

      {/* Status filter chips */}
      <View style={[s.filtersWrap, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <FlashList
          data={STATUS_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
          renderItem={({ item }) => {
            const active = activeStatus === item.key;
            return (
              <TouchableOpacity
                onPress={() => setActiveStatus(item.key)}
                style={[
                  s.chip,
                  {
                    backgroundColor: active ? item.color : item.color + '15',
                    borderColor:     active ? item.color : item.color + '40',
                  },
                ]}
              >
                <Text style={[s.chipText, { color: active ? '#fff' : item.color }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.label}
        />
      </View>

      {/* List */}
      {isLoading ? (
        <ListSkeleton count={5} />
      ) : apps.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No applications yet"
          subtitle="Start applying to jobs and track them here."
          actionLabel="Browse Jobs"
          onAction={() => navigation.navigate('Jobs')}
        />
      ) : (
        <FlashList
          data={apps}
          keyExtractor={(a) => a._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <ApplicationCard
              application={item}
              // colors={colors}
              onPress={() =>
                navigation.navigate('ApplicationDetail', { applicationId: item._id })
              }
            />
          )}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <Text style={[s.loadMore, { color: colors.textMuted }]}>Loading more…</Text>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub:   { fontSize: 13, marginTop: 2 },
  filtersWrap: { borderBottomWidth: 1 },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  chipText:    { fontSize: 13, fontWeight: '600' },
  loadMore:    { textAlign: 'center', padding: 16, fontSize: 13 },
});

const sb = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  item:      { alignItems: 'center' },
  value:     { fontSize: 22, fontWeight: '800' },
  label:     { fontSize: 11, marginTop: 2 },
});