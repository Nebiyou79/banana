/**
 * src/screens/company/EmployerApplicationDetailScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Company / Org application detail screen.
 * Shows ApplicationHeader + 3-tab CompanyApplicationDetails.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import {
  View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import {
  useCompanyApplicationDetails,
  useOrgApplicationDetails,
} from '../../hooks/useApplications';
import { ApplicationHeader } from '../../components/application/ApplicationHeader';
import { CompanyApplicationDetails } from '../../components/application/CompanyApplicationDetails';
import { Application } from '../../services/applicationService';
import { ListSkeleton } from '../../components/skeletons';

interface Props {
  navigation: any;
  route: { params: { applicationId: string } };
}

export const EmployerApplicationDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { applicationId } = route.params;
  const { theme } = useThemeStore();
  const { user }  = useAuthStore();
  const c         = theme.colors;
  const isDark    = theme.isDark ?? false;
  const isOrg     = user?.role === 'organization';

  const companyQ  = useCompanyApplicationDetails(!isOrg ? applicationId : undefined);
  const orgQ      = useOrgApplicationDetails(isOrg ? applicationId : undefined);
  const appQ      = isOrg ? orgQ : companyQ;

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
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <ListSkeleton count={6} />
      </SafeAreaView>
    );
  }

  if (appQ.isError || !application) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[s.errorTitle, { color: c.text }]}>Could not load application</Text>
          <TouchableOpacity
            style={[s.retryBtn, { backgroundColor: c.primary }]}
            onPress={() => appQ.refetch()}
          >
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      {/* Gradient header */}
      <ApplicationHeader
        application={application}
        role="employer"
        onBack={() => navigation.goBack()}
        onShare={handleShare}
        isDark={isDark}
      />

      {/* 3-tab detail */}
      <CompanyApplicationDetails
        application={application}
        colors={c}
        onUpdated={(updated) => setLocalApp(updated)}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:       { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  retryBtn:   { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText:  { color: '#fff', fontWeight: '700' },
});
