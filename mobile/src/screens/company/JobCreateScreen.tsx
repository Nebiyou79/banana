/**
 * src/screens/company/JobCreateScreen.tsx
 * — Uses View (not SafeAreaView) — SafeArea handled by root navigator.
 * — AppHeader for consistent back-button + title.
 */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useCreateJob } from '../../hooks/useJobs';
import { JobForm } from '../../components/jobs/JobForm';
import { CreateJobData } from '../../services/jobService';
import { AppHeader } from '../../components/shared';

interface Props { navigation: any }

export const JobCreateScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const createMut  = useCreateJob();

  const handleSubmit = async (data: CreateJobData, isDraft: boolean) => {
    const payload = { ...data, status: isDraft ? 'draft' as const : 'active' as const };
    await createMut.mutateAsync(payload);
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <JobForm
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        isLoading={createMut.isPending}
      />
    </View>
  );
};