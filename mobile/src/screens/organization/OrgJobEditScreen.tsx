/**
 * src/screens/organization/OrgJobEditScreen.tsx
 * Wraps OrgJobForm in edit mode — pre-populates with existing data.
 */
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useJob, useUpdateOrganizationJob } from '../../hooks/useJobs';
import { OrgJobForm } from '../../components/jobs/OrgJobForm';
import { CreateJobData } from '../../services/jobService';

interface Props {
  navigation: any;
  route: { params: { jobId: string } };
}

export const OrgJobEditScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;

  const jobQ = useJob(jobId);
  const updateMut = useUpdateOrganizationJob();

  const handleSubmit = async (data: CreateJobData, isDraft: boolean) => {
    await updateMut.mutateAsync({ id: jobId, data: { ...data, status: isDraft ? 'draft' : 'active' } });
    navigation.goBack();
  };

  if (jobQ.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <OrgJobForm
        initialData={jobQ.data}
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        isLoading={updateMut.isPending}
      />
    </SafeAreaView>
  );
};
