/**
 * src/screens/candidate/ApplyJobScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal / full-screen wrapper that hosts the 4-step ApplicationForm.
 * On success it navigates to the ApplicationDetail screen.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { ApplicationForm } from '../../components/application/ApplicationForm';
import { Application } from '../../services/applicationService';

interface Props {
  navigation: any;
  route: {
    params: {
      jobId: string;
      jobTitle: string;
      companyName?: string;
    };
  };
}

export const ApplyJobScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId, jobTitle, companyName = '' } = route.params;
  const { theme } = useThemeStore();

  const handleSuccess = (app: Application) => {
    // Navigate to the candidate's own detail view
    navigation.replace('ApplicationDetail', { applicationId: app._id });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['top']}
    >
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
