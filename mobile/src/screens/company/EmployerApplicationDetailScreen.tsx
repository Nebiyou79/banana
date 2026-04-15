/**
 * mobile/src/screens/company/EmployerApplicationDetailScreen.tsx
 *
 * Full employer view of one application.
 * Wraps the existing CompanyApplicationDetails component with a proper
 * screen shell: SafeAreaView, ScreenHeader, data-fetching, and query invalidation.
 */

import React, { useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useCompanyApplicationDetails, useOrganizationApplicationDetails, useUpdateApplicationStatus } from '../../hooks/useApplications';
import { useAuthStore } from '../../store/authStore';
import { Application } from '../../services/applicationService';
import { CompanyApplicationDetails } from '../../components/application/CompanyApplicationDetails';
import { ScreenHeader } from '../../components/shared/ScreenHeader';

interface Props {
  navigation: any;
  route: { params: { applicationId: string } };
}

export const EmployerApplicationDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { applicationId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;
  const { user } = useAuthStore();

  const isOrg = user?.role === 'organization';

  // Use the appropriate hook based on the viewer's role
  const companyQ = useCompanyApplicationDetails(!isOrg ? applicationId : undefined);
  const orgQ     = useOrganizationApplicationDetails(isOrg ? applicationId : undefined);

  const appQ = isOrg ? orgQ : companyQ;
  const application: Application | undefined = appQ.data as Application | undefined;

  const updateMut = useUpdateApplicationStatus();

  const handleStatusUpdate = useCallback((updated: Application) => {
    // optimistic update already handled inside CompanyApplicationDetails;
    // invalidation happens via the mutation's onSuccess in useApplications.ts
  }, []);

  if (appQ.isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="Application" onBack={() => navigation.goBack()} />
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="Not Found" onBack={() => navigation.goBack()} />
        <View style={s.center}>
          <Text style={{ color: c.textMuted }}>Application not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const candidateName =
    application.userInfo?.name ??
    (application as any).candidate?.name ??
    'Applicant';

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader
        title={candidateName}
        subtitle={`Applied for ${application.job?.title ?? 'position'}`}
        onBack={() => navigation.goBack()}
      />
      <CompanyApplicationDetails
        application={application}
        onStatusUpdate={handleStatusUpdate}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});