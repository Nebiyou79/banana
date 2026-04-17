/**
 * src/screens/candidate/ApplicationDetailsScreen.tsx
 * Candidate application detail with ApplicationHeader + CandidateApplicationDetails.
 */
import React from 'react';
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useMyApplications } from '../../hooks/useApplications';
import { ApplicationHeader } from '../../components/application/ApplicationHeader';
import { CandidateApplicationDetails } from '../../components/application/CandidateApplicationDetails';

interface Props {
  navigation: any;
  route: { params: { applicationId: string } };
}

export const ApplicationDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { applicationId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;

  // Fetch from candidate's own list; filter to find the one we want
  const appsQ = useMyApplications();
  const apps = appsQ.data?.data ?? [];
  const application = apps.find(a => a._id === applicationId);

  if (appsQ.isLoading) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }]} edges={[]}>
        <View style={{ height: 160, backgroundColor: '#1D4ED8', paddingTop: 50, paddingLeft: 16 }}>
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
          role="candidate"
          onBack={() => navigation.goBack()}
          isDark={theme.isDark}
        />
        <View style={{ padding: 16 }}>
          <CandidateApplicationDetails
            application={application}
            onWithdraw={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
