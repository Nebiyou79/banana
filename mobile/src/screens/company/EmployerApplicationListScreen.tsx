/**
 * src/screens/company/EmployerApplicationsScreen.tsx
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
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
import { FONT_SIZE } from '../../theme/tokens';

interface Props { navigation: any }

export const EmployerApplicationsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const isOrg    = user?.role === 'organization';

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

  const STATUS_OPTIONS = useMemo(() => [
    { key: undefined,             label: 'All',         color: colors.textMuted },
    { key: 'applied',             label: 'New',         color: colors.info },
    { key: 'under-review',        label: 'In Review',   color: colors.warning },
    { key: 'shortlisted',         label: 'Shortlisted', color: colors.success },
    { key: 'interview-scheduled', label: 'Interview',   color: colors.organization },
    { key: 'rejected',            label: 'Rejected',    color: colors.danger },
  ], [colors]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Applications</Text>
          <Text style={[s.sub, { color: colors.textMuted }]}>{total} received</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[s.searchWrap, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <View style={[s.searchBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={[s.searchInput, { color: colors.text }]}
            placeholder="Search by candidate or job..."
            placeholderTextColor={colors.inputPlaceholder}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status filter */}
      <View style={[s.filtersWrap, { borderBottomColor: colors.border }]}>
        <FlashList
          data={STATUS_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: 10 }}
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
                <Text style={[s.chipText, { color: active ? colors.textInverse : item.color }]}>
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
          subtitle="Applications to your posted jobs will appear here."
        />
      ) : (
        <FlashList
          data={apps}
          keyExtractor={(a) => a._id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: insets.bottom + spacing.xxl }}
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

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title:       { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  sub:         { fontSize: FONT_SIZE.sm, marginTop: 2 },
  searchWrap:  { padding: 12, borderBottomWidth: 1 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: FONT_SIZE.base },
  filtersWrap: { borderBottomWidth: 1 },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  chipText:    { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  loadMore:    { textAlign: 'center', padding: 16, fontSize: FONT_SIZE.sm },
});