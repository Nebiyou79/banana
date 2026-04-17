/**
 * src/screens/organization/OrgJobCreateScreen.tsx
 * Wraps OrgJobForm for creating new organization opportunities.
 */
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useCreateOrganizationJob } from '../../hooks/useJobs';
import { OrgJobForm } from '../../components/jobs/OrgJobForm';
import { CreateJobData } from '../../services/jobService';

interface Props { navigation: any }

export const OrgJobCreateScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const createMut = useCreateOrganizationJob();

  const handleSubmit = async (data: CreateJobData, isDraft: boolean) => {
    await createMut.mutateAsync({ ...data, status: isDraft ? 'draft' : 'active' });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <OrgJobForm
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        isLoading={createMut.isPending}
      />
    </SafeAreaView>
  );
};
