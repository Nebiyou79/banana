/**
 * src/screens/company/EmployerApplicationDetailScreen.tsx
 * Employer full applicant review — company and org both use this.
 */
import React from 'react';
import {
  View, ScrollView, ActivityIndicator, Text, TouchableOpacity, Share,
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
import { ListSkeleton } from '../../components/skeletons';

interface Props {
  navigation: any;
  route: { params: { applicationId: string } };
}

export const EmployerApplicationDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { applicationId } = route.params;
  const { theme } = useThemeStore();
  const { user }  = useAuthStore();
  const c = theme.colors;
  const isOrg = user?.role === 'organization';

  const companyQ = useCompanyApplicationDetails(!isOrg ? applicationId : undefined);
  const orgQ     = useOrgApplicationDetails(isOrg ? applicationId : undefined);
  const appQ     = isOrg ? orgQ : companyQ;

  const application = appQ.data;

  const handleShare = async () => {
    if (!application) return;
    const name = application.userInfo?.name ?? application.candidate?.name ?? 'Candidate';
    await Share.share({ message: `Application review: ${name} for ${application.job?.title ?? 'position'}` });
  };

  if (appQ.isLoading) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }]} edges={[]}>
        <View style={{ height: 160, backgroundColor: '#065F46', paddingTop: 50, paddingLeft: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }]} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Ionicons name="alert-circle-outline" size={52} color={c.textMuted} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>Application not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: c.primary }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }]} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <ApplicationHeader
          application={application}
          role="employer"
          onBack={() => navigation.goBack()}
          onShare={handleShare}
          isDark={theme.isDark}
        />
        <View style={{ padding: 16 }}>
          <CompanyApplicationDetails application={application} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
