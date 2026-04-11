import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useMyApplications } from '../../hooks/useApplications';
import { ApplicationCard } from '../../components/applications/ApplicationCard';
import { Application, ApplicationStatus } from '../../services/applicationService';

// Extend your CandidateStackParamList to include:
//   ApplicationDetails: { applicationId: string };
type CandidateStack = {
  ApplicationDetails: { applicationId: string };
};
type Nav = NativeStackNavigationProp<CandidateStack>;

type FilterGroup = {
  label: string;
  statuses: ApplicationStatus[];
};

const FILTERS: FilterGroup[] = [
  { label: 'All',       statuses: [] },
  { label: 'Applied',   statuses: ['applied'] },
  { label: 'In Review', statuses: ['under-review', 'shortlisted'] },
  { label: 'Interview', statuses: ['interview-scheduled', 'interviewed'] },
  { label: 'Offer',     statuses: ['offer-pending', 'offer-made', 'offer-accepted', 'offer-rejected'] },
  { label: 'Rejected',  statuses: ['rejected'] },
];

export const ApplicationListScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();

  const [activeFilter, setActiveFilter] = useState(0);
  const [refreshing, setRefreshing]     = useState(false);

  const { data, isLoading, refetch } = useMyApplications();
  const applications: Application[]   = data?.data ?? [];

  const filteredApps = activeFilter === 0
    ? applications
    : applications.filter((a) =>
        FILTERS[activeFilter].statuses.includes(a.status)
      );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderEmpty = () => (
    <View style={s.empty}>
      <Ionicons name="document-text-outline" size={56} color={colors.textMuted} />
      <Text style={[s.emptyTitle, { color: colors.text, fontSize: typography.lg }]}>
        {activeFilter === 0 ? 'No applications yet' : 'No matches'}
      </Text>
      <Text style={[s.emptySub, { color: colors.textMuted, fontSize: typography.sm }]}>
        {activeFilter === 0
          ? 'Start applying to jobs and track them here.'
          : 'Try a different filter.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border, paddingHorizontal: spacing[5] }]}>
        <Text style={[s.headerTitle, { color: colors.text, fontSize: typography['2xl'] }]}>
          Applications
        </Text>
        {applications.length > 0 && (
          <View style={[s.countBadge, { backgroundColor: colors.primary + '18' }]}>
            <Text style={{ color: colors.primary, fontSize: typography.sm, fontWeight: '700' }}>
              {applications.length}
            </Text>
          </View>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.filterBar, { paddingHorizontal: spacing[5] }]}
      >
        {FILTERS.map((f, i) => (
          <TouchableOpacity
            key={f.label}
            style={[
              s.filterChip,
              {
                backgroundColor: activeFilter === i ? colors.primary : colors.surface,
                borderColor:     activeFilter === i ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveFilter(i)}
          >
            <Text
              style={{
                color: activeFilter === i ? '#fff' : colors.textSecondary,
                fontSize: typography.sm,
                fontWeight: '600',
              }}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {isLoading ? (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            { padding: spacing[5], paddingTop: spacing[4] },
            !filteredApps.length && { flex: 1 },
          ]}
          renderItem={({ item }) => (
            <ApplicationCard
              application={item}
              onPress={() => navigation.navigate('ApplicationDetails', { applicationId: item._id })}
              colors={colors}
              typography={typography}
            />
          )}
          ListEmptyComponent={renderEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontWeight: '800', flex: 1 },
  countBadge:  { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  filterBar:   { paddingVertical: 10, gap: 8 },
  filterChip:  { borderRadius: 99, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  loading:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  emptyTitle:  { fontWeight: '700' },
  emptySub:    { textAlign: 'center', maxWidth: 260 },
});
