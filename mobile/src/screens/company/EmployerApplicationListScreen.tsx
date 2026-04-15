/**
 * mobile/src/screens/company/EmployerApplicationListScreen.tsx
 * 
 * FlashList of candidate applications for a specific job.
 * Used by both Company and Organization roles.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useJobApplications, useUpdateApplicationStatus } from '../../hooks/useApplications';
import { Application, ApplicationStatus, STATUS_LABELS, STATUS_COLORS, STATUS_COLORS_DARK } from '../../services/applicationService';
import { ApplicantCard } from '../../components/application/ApplicantCard';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';

interface Props {
  navigation: any;
  route: { params: { jobId: string; jobTitle: string } };
}

const STATUS_TABS = [
  { key: undefined,              label: 'All' },
  { key: 'applied',             label: 'Applied' },
  { key: 'under-review',        label: 'Reviewing' },
  { key: 'shortlisted',         label: 'Shortlisted' },
  { key: 'interview-scheduled', label: 'Interview' },
  { key: 'rejected',            label: 'Rejected' },
] as const;

export const EmployerApplicationListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId, jobTitle } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;

  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const updateMut = useUpdateApplicationStatus();

  const { data, isLoading, refetch, isRefetching } = useJobApplications(jobId, {
    status: activeTab,
    limit: 50,
  } as any);

  const SC = theme.isDark ? STATUS_COLORS_DARK : STATUS_COLORS;

  // Safely unwrap — service returns { data: Application[], pagination }
  const applications: Application[] = useMemo(() => {
    const raw = (data as any);
    return raw?.data ?? raw?.applications ?? [];
  }, [data]);

  const handleShortlist = useCallback((app: Application) => {
    updateMut.mutate({ applicationId: app._id, data: { status: 'shortlisted' } });
  }, [updateMut]);

  const handleReject = useCallback((app: Application) => {
    updateMut.mutate({ applicationId: app._id, data: { status: 'rejected' } });
  }, [updateMut]);

  const renderItem = useCallback(({ item }: { item: Application }) => (
    <ApplicantCard
      application={item}
      onPress={() => navigation.navigate('ApplicationDetail', { applicationId: item._id })}
      onShortlist={() => handleShortlist(item)}
      onReject={() => handleReject(item)}
    />
  ), [navigation, handleShortlist, handleReject]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader
        title="Applicants"
        subtitle={jobTitle}
        onBack={() => navigation.goBack()}
      />

      {/* Stats row */}
      <View style={[s.statsBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <View style={s.stat}>
          <Text style={[s.statVal, { color: c.text }]}>{applications.length}</Text>
          <Text style={[s.statLabel, { color: c.textMuted }]}>Total</Text>
        </View>
        <View style={[s.statDiv, { backgroundColor: c.border }]} />
        <View style={s.stat}>
          <Text style={[s.statVal, { color: '#22C55E' }]}>
            {applications.filter(a => a.status === 'shortlisted').length}
          </Text>
          <Text style={[s.statLabel, { color: c.textMuted }]}>Shortlisted</Text>
        </View>
        <View style={[s.statDiv, { backgroundColor: c.border }]} />
        <View style={s.stat}>
          <Text style={[s.statVal, { color: '#A855F7' }]}>
            {applications.filter(a => a.status === 'interview-scheduled').length}
          </Text>
          <Text style={[s.statLabel, { color: c.textMuted }]}>Interviews</Text>
        </View>
      </View>

      {/* Status tabs */}
      <View style={[s.tabBar, { borderBottomColor: c.border }]}>
        <FlashList
          data={STATUS_TABS as any}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
          renderItem={({ item }: any) => {
            const active = activeTab === item.key;
            const count = item.key
              ? applications.filter(a => a.status === item.key).length
              : applications.length;
            return (
              <TouchableOpacity
                style={[s.tab, {
                  backgroundColor: active ? c.primary : c.inputBg,
                  borderColor: active ? c.primary : c.border,
                }]}
                onPress={() => setActiveTab(item.key)}
                activeOpacity={0.7}
              >
                <Text style={[s.tabText, { color: active ? '#fff' : c.textSecondary }]}>
                  {item.label}
                </Text>
                {count > 0 && (
                  <View style={[s.tabBadge, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : c.border }]}>
                    <Text style={[s.tabBadgeText, { color: active ? '#fff' : c.textMuted }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item: any) => String(item.key ?? 'all')}
        />
      </View>

      {/* List */}
      {isLoading ? (
        <ListSkeleton count={5} type="application" />
      ) : (
        <FlashList
          data={activeTab
            ? applications.filter(a => a.status === activeTab)
            : applications
          }
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No applications"
              subtitle={activeTab
                ? `No ${STATUS_LABELS[activeTab as ApplicationStatus] ?? activeTab} applications for this job`
                : 'No candidates have applied for this position yet'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:         { flex: 1 },
  statsBar:     { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1 },
  stat:         { flex: 1, alignItems: 'center' },
  statDiv:      { width: 1 },
  statVal:      { fontSize: 20, fontWeight: '800' },
  statLabel:    { fontSize: 11, marginTop: 2 },
  tabBar:       { borderBottomWidth: StyleSheet.hairlineWidth },
  tab:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8, gap: 6 },
  tabText:      { fontSize: 13, fontWeight: '600' },
  tabBadge:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText: { fontSize: 10, fontWeight: '700' },
  list:         { padding: 16 },
});