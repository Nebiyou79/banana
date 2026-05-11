/**
 * src/screens/company/JobCreateScreen.tsx
 */
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useCreateJob } from '../../hooks/useJobs';
import { JobForm } from '../../components/jobs/JobForm';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { CreateJobData } from '../../services/jobService';
import { AppHeader } from '../../components/shared';

interface Props { navigation: any }

export const JobCreateScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const createMut = useCreateJob();

  const handleSubmit = async (data: CreateJobData, isDraft: boolean) => {
    const payload = { ...data, status: isDraft ? 'draft' as const : 'active' as const };
    await createMut.mutateAsync(payload);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <AppHeader title="Post a Job" onBack={() => navigation.goBack()} />
      <JobForm
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        isLoading={createMut.isPending}
      />
    </SafeAreaView>
  );
};