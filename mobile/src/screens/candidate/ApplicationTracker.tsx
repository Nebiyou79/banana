/**
 * src/screens/candidate/ApplicationTracker.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Candidate "My Applications" list — FlashList with status filter pills,
 * stats banner, date stamps.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
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

interface Props { navigation: any }

const STATUS_FILTERS: Array<{ key?: string; label: string; color: string }> = [
  { key: undefined,             label: 'All',        color: '#64748B' },
  { key: 'applied',             label: 'Applied',    color: '#3B82F6' },
  { key: 'under-review',        label: 'In Review',  color: '#F59E0B' },
  { key: 'shortlisted',         label: 'Shortlisted',color: '#10B981' },
  { key: 'interview-scheduled', label: 'Interview',  color: '#8B5CF6' },
  { key: 'offer-made',          label: 'Offer',      color: '#059669' },
  { key: 'rejected',            label: 'Rejected',   color: '#EF4444' },
];

// ─── Application List Item ────────────────────────────────────────────────────

interface ItemProps {
  application: Application;
  onPress: () => void;
  colors: any;
}

const AppItem = React.memo<ItemProps>(({ application, onPress, colors: c }) => {
  const sc = STATUS_COLORS[application.status as ApplicationStatus] ?? STATUS_COLORS['applied'];
  const label = STATUS_LABELS[application.status as ApplicationStatus] ?? application.status;

  const owner = application.job?.jobType === 'organization'
    ? application.job?.organization
    : application.job?.company;

  const dateLabel = new Date(application.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[item.card, { backgroundColor: c.surface, borderColor: c.border }]}
      activeOpacity={0.75}
    >
      {/* Status stripe */}
      <View style={[item.stripe, { backgroundColor: sc.dot }]} />

      <View style={item.body}>
        <View style={item.topRow}>
          <Text style={[item.jobTitle, { color: c.text }]} numberOfLines={1}>
            {application.job?.title ?? 'Position'}
          </Text>
          <View style={[item.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <View style={[item.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[item.statusText, { color: sc.text }]}>{label}</Text>
          </View>
        </View>

        {owner?.name && (
          <Text style={[item.company, { color: c.primary }]} numberOfLines={1}>
            {owner.name}
          </Text>
        )}

        <View style={item.footer}>
          <View style={item.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
            <Text style={[item.date, { color: c.textMuted }]}>{dateLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Stats banner ─────────────────────────────────────────────────────────────

const StatsBanner = ({ stats, total, colors: c }: { stats: any; total: number; colors: any }) => (
  <View style={[sb.container, { backgroundColor: c.surface, borderColor: c.border }]}>
    <StatItem label="Total" value={total} color="#3B82F6" c={c} />
    <StatItem label="In Review"   value={stats?.underReview ?? 0}      color="#F59E0B" c={c} />
    <StatItem label="Shortlisted" value={stats?.shortlisted ?? 0}      color="#10B981" c={c} />
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
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const filters: Omit<ApplicationFilters, 'page'> = useMemo(
    () => (activeStatus ? { status: activeStatus, limit: 20 } : { limit: 20 }),
    [activeStatus],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useMyApplicationsPaginated(filters);

  const withdrawMut = useWithdrawApplication();
  const statsQ      = useApplicationStats();
  const stats       = statsQ.data;

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
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <Text style={[s.headerTitle, { color: c.text }]}>My Applications</Text>
        <Text style={[s.headerSub, { color: c.textMuted }]}>{total} total</Text>
      </View>

      {/* Stats */}
      {!isLoading && <StatsBanner stats={stats} total={total} colors={c} />}

      {/* Status filter chips */}
      <View style={[s.filtersWrap, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
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
                  { backgroundColor: active ? item.color : `${item.color}15`,
                    borderColor: active ? item.color : `${item.color}40` },
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
          description="Start applying to jobs and track them here."
          actionLabel="Browse Jobs"
          onAction={() => navigation.navigate('Jobs')}
        />
      ) : (
        <FlashList
          data={apps}
          keyExtractor={(a) => a._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <AppItem
              application={item}
              colors={c}
              onPress={() =>
                navigation.navigate('ApplicationDetail', { applicationId: item._id })
              }
            />
          )}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <Text style={[s.loadMore, { color: c.textMuted }]}>Loading more…</Text>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:         { flex: 1 },
  header:       {
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle:  { fontSize: 22, fontWeight: '800' },
  headerSub:    { fontSize: 13, marginTop: 2 },
  filtersWrap:  { borderBottomWidth: 1 },
  chip:         {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, marginRight: 8,
  },
  chipText:     { fontSize: 13, fontWeight: '600' },
  loadMore:     { textAlign: 'center', padding: 16, fontSize: 13 },
});

const item = StyleSheet.create({
  card:       {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1,
    marginBottom: 10, overflow: 'hidden',
  },
  stripe:     { width: 4 },
  body:       { flex: 1, padding: 12 },
  topRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  jobTitle:   { flex: 1, fontSize: 15, fontWeight: '700' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  company:    { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date:       { fontSize: 11 },
});

const sb = StyleSheet.create({
  container:  {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  item:       { alignItems: 'center' },
  value:      { fontSize: 22, fontWeight: '800' },
  label:      { fontSize: 11, marginTop: 2 },
});
