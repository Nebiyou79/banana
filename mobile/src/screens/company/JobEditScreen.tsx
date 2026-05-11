/**
 * src/screens/company/JobEditScreen.tsx
 */
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useJob, useUpdateJob } from '../../hooks/useJobs';
import { JobForm } from '../../components/jobs/JobForm';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { CreateJobData } from '../../services/jobService';
import { AppHeader } from '../../components/shared';

interface Props {
  navigation: any;
  route: { params: { jobId: string } };
}

export const JobEditScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const { colors } = useTheme();

  const jobQ      = useJob(jobId);
  const updateMut = useUpdateJob();

  const handleSubmit = async (data: CreateJobData, isDraft: boolean) => {
    const payload = { ...data, status: isDraft ? 'draft' as const : 'active' as const };
    await updateMut.mutateAsync({ id: jobId, data: payload });
    navigation.goBack();
  };

  if (jobQ.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <AppHeader title="Edit Job" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <AppHeader title="Edit Job" subtitle={jobQ.data?.title} onBack={() => navigation.goBack()} />
      <JobForm
        initialData={jobQ.data}
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        isLoading={updateMut.isPending}
      />
    </SafeAreaView>
  );
};