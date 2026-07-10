/**
 * src/screens/organization/OrgJobCreateScreen.tsx
 * — Uses View (not SafeAreaView) — SafeArea handled by root navigator.
 * — AppHeader for consistency with the company flow.
 */
import React from 'react';
import { View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useCreateOrganizationJob } from '../../hooks/useJobs';
import { OrgJobForm } from '../../components/jobs/OrgJobForm';
import { CreateJobData } from '../../services/jobService';
import { AppHeader } from '../../components/shared';

interface Props { navigation: any }

export const OrgJobCreateScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const c         = theme.colors;
  const createMut = useCreateOrganizationJob();

  const handleSubmit = async (data: CreateJobData, isDraft: boolean) => {
    await createMut.mutateAsync({ ...data, status: isDraft ? 'draft' : 'active' });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <OrgJobForm
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        isLoading={createMut.isPending}
      />
    </View>
  );
};