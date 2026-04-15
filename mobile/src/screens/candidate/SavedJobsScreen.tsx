/**
 * mobile/src/screens/candidate/SavedJobsScreen.tsx
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useThemeStore } from '../../store/themeStore';
import { useSavedJobs, useUnsaveJob } from '../../hooks/useJobs';
import { Job } from '../../services/jobService';
import { CandidateJobCard } from '../../components/jobs/CandidateJobCard';
import { ListSkeleton } from '../../components/skeletons';
import { EmptyState } from '../../components/ui/EmptyState';

interface Props { navigation: any }

export const SavedJobsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const savedQ    = useSavedJobs();
  const unsaveMut = useUnsaveJob();

  const jobs = savedQ.data ?? [];

  const renderItem = useCallback(({ item }: { item: Job }) => (
    <CandidateJobCard
      job={item}
      onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}
      onSave={() => unsaveMut.mutate(item._id)}
      isSaved={true}
    />
  ), [navigation, unsaveMut]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[s.header, { borderBottomColor: c.border }]}>
        <Text style={[s.title, { color: c.text }]}>Saved Jobs</Text>
        <Text style={[s.count, { color: c.textMuted }]}>{jobs.length} saved</Text>
      </View>

      {savedQ.isLoading ? (
        <ListSkeleton count={4} type="job" />
      ) : (
        <FlashList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onRefresh={() => savedQ.refetch()}
          refreshing={savedQ.isRefetching}
          ListEmptyComponent={
            <EmptyState
              icon="bookmark-outline"
              title="No saved jobs"
              subtitle="Bookmark jobs you're interested in to find them here"
              actionLabel="Browse Jobs"
              onAction={() => navigation.navigate('JobExplorer')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title:  { fontSize: 22, fontWeight: '800' },
  count:  { fontSize: 13 },
  list:   { padding: 16 },
});