/**
 * src/screens/company/EmployerApplicationDetailScreen.tsx
 */
import React, { useState } from 'react';
import {
  View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import {
  useCompanyApplicationDetails,
  useOrgApplicationDetails,
} from '../../hooks/useApplications';
import { ApplicationHeader } from '../../components/application/ApplicationHeader';
import { CompanyApplicationDetails } from '../../components/application/CompanyApplicationDetails';
import { Application } from '../../services/applicationService';
import { ListSkeleton } from '../../components/skeletons';
import { FONT_SIZE } from '../../theme/tokens';

interface Props {
  navigation: any;
  route: { params: { applicationId: string } };
}

export const EmployerApplicationDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { applicationId } = route.params;
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const isOrg    = user?.role === 'organization';

  const companyQ = useCompanyApplicationDetails(!isOrg ? applicationId : undefined);
  const orgQ     = useOrgApplicationDetails(isOrg ? applicationId : undefined);
  const appQ     = isOrg ? orgQ : companyQ;

  const [localApp, setLocalApp] = useState<Application | null>(null);
  const application: Application | undefined = localApp ?? appQ.data;

  const handleShare = async () => {
    if (!application) return;
    const name = application.userInfo?.name ?? application.candidate?.name ?? 'Candidate';
    await Share.share({
      message: `Reviewing application: ${name} for ${application.job?.title ?? 'a position'}`,
    });
  };

  if (appQ.isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <ListSkeleton count={6} />
      </SafeAreaView>
    );
  }

  if (appQ.isError || !application) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={[s.errorTitle, { color: colors.text }]}>Could not load application</Text>
          <TouchableOpacity
            style={[s.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => appQ.refetch()}
          >
            <Text style={[s.retryText, { color: colors.textInverse }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <ApplicationHeader
        application={application}
        role="employer"
        onBack={() => navigation.goBack()}
        onShare={handleShare}
        isDark={isDark}
      />
      <CompanyApplicationDetails
        application={application}
        colors={colors}
        onUpdated={(updated) => setLocalApp(updated)}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:       { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', textAlign: 'center' },
  retryBtn:   { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText:  { fontWeight: '700' },
});