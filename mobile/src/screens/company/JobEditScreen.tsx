/**
 * mobile/src/screens/company/JobEditScreen.tsx
 * Wraps the master JobForm in EDIT mode — pre-populates with existing job data.
 * Master-Form-Architect: uses initialData prop to call reset(toFormValues(job)).
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useJob, useUpdateJob } from '../../hooks/useJobs';
import { JobForm } from '../../components/jobs/JobForm';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { CreateJobData } from '../../services/jobService';

interface Props {
  navigation: any;
  route: { params: { jobId: string } };
}

export const JobEditScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;

  const jobQ     = useJob(jobId);
  const updateMut = useUpdateJob();

  const handleSubmit = async (data: CreateJobData, isDraft: boolean) => {
    const payload = { ...data, status: isDraft ? 'draft' as const : 'active' as const };
    await updateMut.mutateAsync({ id: jobId, data: payload });
    navigation.goBack();
  };

  if (jobQ.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
        <ScreenHeader title="Edit Job" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScreenHeader title="Edit Job" subtitle={jobQ.data?.title} onBack={() => navigation.goBack()} />
      <JobForm
        initialData={jobQ.data}
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        isLoading={updateMut.isPending}
      />
    </SafeAreaView>
  );
};