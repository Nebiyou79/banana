/**
 * mobile/src/screens/candidate/ApplicationTracker.tsx
 * Paginated list of all candidate applications with status filter tabs.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useMyApplicationsPaginated, useWithdrawApplication } from '../../hooks/useApplications';
import { Application, ApplicationStatus } from '../../services/applicationService';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { ApplicationCard } from '../../components/application/ApplicationCard';

interface Props { navigation: any }

const STATUS_TABS = [
  { key: undefined,              label: 'All' },
  { key: 'applied',             label: 'Applied' },
  { key: 'under-review',        label: 'Reviewing' },
  { key: 'shortlisted',         label: 'Shortlisted' },
  { key: 'interview-scheduled', label: 'Interview' },
  { key: 'offer-made',          label: 'Offer' },
  { key: 'rejected',            label: 'Rejected' },
] as const;

export const ApplicationTracker: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } =
    useMyApplicationsPaginated({ status: activeTab, limit: 15 });

  const withdrawMut = useWithdrawApplication();

  const items: Application[] = useMemo(() =>
    (data?.pages ?? []).flatMap(p => p.data ?? []),
    [data]
  );

  const handleWithdraw = useCallback((app: Application) => {
    Alert.alert(
      'Withdraw Application',
      `Withdraw your application for "${app.job?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Withdraw', style: 'destructive', onPress: () => withdrawMut.mutate(app._id) },
      ]
    );
  }, [withdrawMut]);

  const renderItem = useCallback(({ item }: { item: Application }) => (
    <ApplicationCard
      application={item}
      onPress={() => navigation.navigate('ApplicationDetail', { applicationId: item._id })}
      onWithdraw={() => handleWithdraw(item)}
    />
  ), [navigation, handleWithdraw]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: c.border }]}>
        <Text style={[s.title, { color: c.text }]}>My Applications</Text>
        <Text style={[s.count, { color: c.textMuted }]}>
          {data?.pages[0]?.pagination?.totalResults ?? 0} total
        </Text>
      </View>

      {/* Status tabs */}
      <View style={[s.tabBar, { borderBottomColor: c.border }]}>
        <FlashList
          data={STATUS_TABS as any}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item }: any) => {
            const active = activeTab === item.key;
            return (
              <TouchableOpacity
                style={[s.tab, {
                  backgroundColor: active ? c.primary : 'transparent',
                  borderColor: active ? c.primary : c.border,
                }]}
                onPress={() => setActiveTab(item.key)}
                activeOpacity={0.7}
              >
                <Text style={[s.tabText, { color: active ? '#fff' : c.textSecondary }]}>{item.label}</Text>
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
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          onRefresh={refetch}
          refreshing={false}
          ListFooterComponent={isFetchingNextPage ? <ListSkeleton count={2} type="application" /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No applications found"
              subtitle={activeTab ? `No ${activeTab} applications` : "You haven't applied to any jobs yet"}
              actionLabel={!activeTab ? "Browse Jobs" : undefined}
              onAction={!activeTab ? () => navigation.navigate('JobExplorer') : undefined}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:    { flex: 1 },
  header:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title:   { fontSize: 22, fontWeight: '800' },
  count:   { fontSize: 13 },
  tabBar:  { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  tab:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  tabText: { fontSize: 13, fontWeight: '600' },
  list:    { padding: 16 },
});