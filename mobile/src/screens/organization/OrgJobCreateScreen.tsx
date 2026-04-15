/**
 * mobile/src/screens/organization/OrgJobCreateScreen.tsx
 * Wraps master JobForm in org create mode with isOrg=true.
 */

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useCreateOrganizationJob } from '../../hooks/useJobs';
import { JobForm } from '../../components/jobs/JobForm';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { CreateJobData } from '../../services/jobService';

interface Props { navigation: any }

export const OrgJobCreateScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const createMut = useCreateOrganizationJob();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScreenHeader title="Post Opportunity" onBack={() => navigation.goBack()} />
      <JobForm
        isOrg
        onSubmit={async (data: CreateJobData, isDraft: boolean) => {
          await createMut.mutateAsync({ ...data, status: isDraft ? 'draft' : 'active' });
          navigation.goBack();
        }}
        onCancel={() => navigation.goBack()}
        isLoading={createMut.isPending}
      />
    </SafeAreaView>
  );
};