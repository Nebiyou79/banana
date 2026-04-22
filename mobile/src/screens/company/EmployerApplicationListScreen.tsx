/**
 * src/screens/company/EmployerApplicationsScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Company / Org view of all received applications.
 * Each card shows: candidate name · applied job · date stamp · status pill.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import {
  useCompanyApplicationsPaginated,
  useOrgApplicationsPaginated,
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
import { ApplicantCard } from '../../components/application/ApplicantCard';

interface Props { navigation: any }

const getInitials = (name?: string) =>
  (name ?? '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

// ─── Card ─────────────────────────────────────────────────────────────────────

const AppCard = React.memo<{
  application: Application;
  onPress: () => void;
  colors: any;
}>(({ application, onPress, colors: c }) => {
  const sc = STATUS_COLORS[application.status as ApplicationStatus] ?? STATUS_COLORS['applied'];
  const label = STATUS_LABELS[application.status as ApplicationStatus] ?? application.status;

  const candidateName =
    application.userInfo?.name ?? application.candidate?.name ?? 'Candidate';
  const jobTitle = application.job?.title ?? 'Position';
  const dateLabel = new Date(application.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[card.root, { backgroundColor: c.surface, borderColor: c.border }]}
      activeOpacity={0.75}
    >
      {/* Left stripe */}
      <View style={[card.stripe, { backgroundColor: sc.dot }]} />

      <View style={card.body}>
        {/* Top: avatar + name + status */}
        <View style={card.topRow}>
          <View style={[card.avatar, { backgroundColor: c.primary }]}>
            <Text style={card.avatarText}>{getInitials(candidateName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[card.name, { color: c.text }]} numberOfLines={1}>
              {candidateName}
            </Text>
            <Text style={[card.job, { color: c.primary }]} numberOfLines={1}>
              {jobTitle}
            </Text>
          </View>
          <View style={[card.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <View style={[card.dot, { backgroundColor: sc.dot }]} />
            <Text style={[card.statusText, { color: sc.text }]}>{label}</Text>
          </View>
        </View>

        {/* Footer: date + arrow */}
        <View style={card.footer}>
          <View style={card.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
            <Text style={[card.date, { color: c.textMuted }]}>Applied {dateLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export const EmployerApplicationsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { user }  = useAuthStore();
  const c         = theme.colors;
  const isOrg     = user?.role === 'organization';

  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const filters: Omit<ApplicationFilters, 'page'> = useMemo(
    () => ({
      ...(statusFilter && { status: statusFilter }),
      ...(search.trim() && { search: search.trim() }),
      limit: 20,
    }),
    [statusFilter, search],
  );

  const companyQ = useCompanyApplicationsPaginated(!isOrg ? filters : undefined);
  const orgQ     = useOrgApplicationsPaginated(isOrg ? filters : undefined);
  const q        = isOrg ? orgQ : companyQ;

  const apps: Application[] = useMemo(
    () => (q.data?.pages ?? []).flatMap((p) => p.data),
    [q.data],
  );

  const total = q.data?.pages[0]?.pagination?.totalResults ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await q.refetch();
    setRefreshing(false);
  }, [q]);

  const STATUS_OPTIONS = [
    { key: undefined,             label: 'All',        color: '#64748B' },
    { key: 'applied',             label: 'New',        color: '#3B82F6' },
    { key: 'under-review',        label: 'In Review',  color: '#F59E0B' },
    { key: 'shortlisted',         label: 'Shortlisted',color: '#10B981' },
    { key: 'interview-scheduled', label: 'Interview',  color: '#8B5CF6' },
    { key: 'rejected',            label: 'Rejected',   color: '#EF4444' },
  ];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <View>
          <Text style={[s.title, { color: c.text }]}>Applications</Text>
          <Text style={[s.sub, { color: c.textMuted }]}>{total} received</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[s.searchWrap, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <View style={[s.searchBox, { backgroundColor: c.background, borderColor: c.border }]}>
          <Ionicons name="search-outline" size={16} color={c.textMuted} />
          <TextInput
            style={[s.searchInput, { color: c.text }]}
            placeholder="Search by candidate or job..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status filter */}
      <View style={[s.filtersWrap, { borderBottomColor: c.border }]}>
        <FlashList
          data={STATUS_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
          renderItem={({ item }) => {
            const active = statusFilter === item.key;
            return (
              <TouchableOpacity
                onPress={() => setStatus(item.key)}
                style={[
                  s.chip,
                  {
                    backgroundColor: active ? item.color : `${item.color}15`,
                    borderColor:     active ? item.color : `${item.color}40`,
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
      {q.isLoading ? (
        <ListSkeleton count={5} />
      ) : apps.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No applications yet"
          description="Applications to your posted jobs will appear here."
        />
      ) : (
        <FlashList
          data={apps}
          keyExtractor={(a) => a._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <ApplicantCard
              application={item}
              onPress={() =>
                navigation.navigate('ApplicationDetail', { applicationId: item._id })
              }
            />
          )}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            q.isFetchingNextPage ? (
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
  header:       { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title:        { fontSize: 22, fontWeight: '800' },
  sub:          { fontSize: 13, marginTop: 2 },
  searchWrap:   { padding: 12, borderBottomWidth: 1 },
  searchBox:    {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  searchInput:  { flex: 1, fontSize: 14 },
  filtersWrap:  { borderBottomWidth: 1 },
  chip:         {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, marginRight: 8,
  },
  chipText:     { fontSize: 13, fontWeight: '600' },
  loadMore:     { textAlign: 'center', padding: 16, fontSize: 13 },
});

const card = StyleSheet.create({
  root:       {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1,
    marginBottom: 10, overflow: 'hidden',
  },
  stripe:     { width: 4 },
  body:       { flex: 1, padding: 12 },
  topRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  name:       { fontSize: 15, fontWeight: '700' },
  job:        { fontSize: 12, fontWeight: '600', marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  dot:        { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date:       { fontSize: 11 },
});
