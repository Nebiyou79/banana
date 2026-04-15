/**
 * mobile/src/screens/company/ApplicantManager.tsx
 * Performance-List-Specialist: FlashList of applicants per job with inline status actions.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useJobApplications, useUpdateApplicationStatus } from '../../hooks/useApplications';
import { Application } from '../../services/applicationService';
import { ApplicantCard } from '../../components/application/ApplicantCard';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenHeader } from '../../components/shared/ScreenHeader';

interface Props {
  navigation: any;
  route: { params: { jobId: string; jobTitle: string } };
}

const TABS = [
  { key: undefined,       label: 'All' },
  { key: 'applied',       label: 'New' },
  { key: 'under-review',  label: 'Reviewing' },
  { key: 'shortlisted',   label: 'Shortlisted' },
  { key: 'rejected',      label: 'Rejected' },
] as const;

export const ApplicantManager: React.FC<Props> = ({ navigation, route }) => {
  const { jobId, jobTitle } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  const appsQ   = useJobApplications(jobId, { status: activeTab, limit: 20 });
  const updateMut = useUpdateApplicationStatus();

  const items: Application[] = useMemo(() =>
    (appsQ.data?.data ?? []),
    [appsQ.data]
  );

  const total = appsQ.data?.pagination?.totalResults ?? 0;

  const handleShortlist = useCallback((app: Application) => {
    updateMut.mutate({ applicationId: app._id, data: { status: 'shortlisted', message: 'You have been shortlisted for this position.' } });
  }, [updateMut]);

  const handleReject = useCallback((app: Application) => {
    updateMut.mutate({ applicationId: app._id, data: { status: 'rejected', message: 'Thank you for your application.' } });
  }, [updateMut]);

  const renderItem = useCallback(({ item }: { item: Application }) => (
    <ApplicantCard
      application={item}
      onPress={() => navigation.navigate('ApplicantDetail', { applicationId: item._id, jobTitle })}
      onShortlist={() => handleShortlist(item)}
      onReject={() => handleReject(item)}
    />
  ), [navigation, jobTitle, handleShortlist, handleReject]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader
        title="Applicants"
        subtitle={`${jobTitle} · ${total} total`}
        onBack={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={[s.tabBar, { borderBottomColor: c.border }]}>
        <FlashList
          data={TABS as any}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
          renderItem={({ item }: any) => {
            const active = activeTab === item.key;
            return (
              <TouchableOpacity
                style={[s.tab, {
                  backgroundColor: active ? c.primary : c.inputBg,
                  borderColor: active ? c.primary : c.border,
                }]}
                onPress={() => setActiveTab(item.key)}
              >
                <Text style={[s.tabText, { color: active ? '#fff' : c.textSecondary }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item: any) => String(item.key ?? 'all')}
        />
      </View>

      {/* List */}
      {appsQ.isLoading ? (
        <ListSkeleton count={4} type="applicant" />
      ) : (
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onRefresh={() => appsQ.refetch()}
          refreshing={false}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No applicants yet"
              subtitle={activeTab ? `No ${activeTab} applications` : 'Applications will appear here when candidates apply'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:    { flex: 1 },
  tabBar:  { borderBottomWidth: StyleSheet.hairlineWidth },
  tab:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  tabText: { fontSize: 13, fontWeight: '600' },
  list:    { padding: 16 },
});