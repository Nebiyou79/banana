/**
 * mobile/src/screens/organization/OrgJobEditScreen.tsx
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useJob, useUpdateOrganizationJob } from '../../hooks/useJobs';
import { JobForm } from '../../components/jobs/JobForm';
import { ScreenHeader } from '../../components/shared/ScreenHeader';

interface Props { navigation: any; route: { params: { jobId: string } } }

export const OrgJobEditScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;
  const jobQ     = useJob(jobId);
  const updateMut = useUpdateOrganizationJob();

  if (jobQ.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
        <ScreenHeader title="Edit Opportunity" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScreenHeader title="Edit Opportunity" subtitle={jobQ.data?.title} onBack={() => navigation.goBack()} />
      <JobForm
        isOrg
        initialData={jobQ.data}
        onSubmit={async (data, isDraft) => {
          await updateMut.mutateAsync({ id: jobId, data: { ...data, status: isDraft ? 'draft' : 'active' } });
          navigation.goBack();
        }}
        onCancel={() => navigation.goBack()}
        isLoading={updateMut.isPending}
      />
    </SafeAreaView>
  );
};