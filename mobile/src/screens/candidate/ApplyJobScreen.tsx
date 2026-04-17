/**
 * src/screens/candidate/ApplyJobScreen.tsx
 * Modal screen that wraps the ApplicationForm.
 */
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { ApplicationForm } from '../../components/application/ApplicationForm';
import { Application } from '../../services/applicationService';

interface Props {
  navigation: any;
  route: { params: { jobId: string; jobTitle: string; companyName?: string } };
}

export const ApplyJobScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId, jobTitle, companyName = '' } = route.params;
  const { theme } = useThemeStore();

  const handleSuccess = (app: Application) => {
    navigation.replace('ApplicationDetail', { applicationId: app._id });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ApplicationForm
        jobId={jobId}
        jobTitle={jobTitle}
        companyName={companyName}
        onSuccess={handleSuccess}
        onClose={() => navigation.goBack()}
      />
    </SafeAreaView>
  );
};
