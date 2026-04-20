/**
 * src/screens/candidate/ApplicationDetailsScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Candidate application detail.
 * Fetches its own application data, displays ApplicationHeader + 3-tab
 * CandidateApplicationDetails component.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import {
  View, StyleSheet, ActivityIndicator, Text, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useMyApplicationsPaginated } from '../../hooks/useApplications';
import { ApplicationHeader } from '../../components/application/ApplicationHeader';
import { CandidateApplicationDetails } from '../../components/application/CandidateApplicationDetails';
import { Application } from '../../services/applicationService';
import { ListSkeleton } from '../../components/skeletons';

interface Props {
  navigation: any;
  route: { params: { applicationId: string } };
}

export const ApplicationDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { applicationId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;
  const isDark = theme.isDark ?? false;

  // Load from candidate list; filter by id
  const { data, isLoading, isError, refetch } = useMyApplicationsPaginated({ limit: 50 });

  const [localApp, setLocalApp] = useState<Application | null>(null);

  const pagesApps = data?.pages?.flatMap((p) => p.data) ?? [];
  const application: Application | undefined = localApp ?? pagesApps.find((a) => a._id === applicationId);

  if (isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <ListSkeleton count={6} />
      </SafeAreaView>
    );
  }

  if (isError || !application) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[s.errorTitle, { color: c.text }]}>Application not found</Text>
          <TouchableOpacity
            style={[s.retryBtn, { backgroundColor: c.primary }]}
            onPress={() => refetch()}
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
        role="candidate"
        onBack={() => navigation.goBack()}
        isDark={isDark}
      />

      {/* 3-tab detail */}
      <CandidateApplicationDetails
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
