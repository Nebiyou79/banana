/**
 * src/screens/organization/OrgJobEditScreen.tsx
 * — Uses View (not SafeAreaView) — SafeArea handled by root navigator.
 * — AppHeader for consistency with the company flow.
 */
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useJob, useUpdateOrganizationJob } from '../../hooks/useJobs';
import { OrgJobForm } from '../../components/jobs/OrgJobForm';
import { CreateJobData } from '../../services/jobService';
import { AppHeader } from '../../components/shared';

interface Props {
  navigation: any;
  route:      { params: { jobId: string } };
}

export const OrgJobEditScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const { theme } = useThemeStore();
  const c         = theme.colors;
  const jobQ      = useJob(jobId);
  const updateMut = useUpdateOrganizationJob();

  const handleSubmit = async (data: CreateJobData, isDraft: boolean) => {
    await updateMut.mutateAsync({ id: jobId, data: { ...data, status: isDraft ? 'draft' : 'active' } });
    navigation.goBack();
  };

  if (jobQ.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <AppHeader title="Edit Opportunity" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <AppHeader
        title="Edit Opportunity"
        subtitle={jobQ.data?.title}
        onBack={() => navigation.goBack()}
      />
      <OrgJobForm
        initialData={jobQ.data}
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        isLoading={updateMut.isPending}
      />
    </View>
  );
};