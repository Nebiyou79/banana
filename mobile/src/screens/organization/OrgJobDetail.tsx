/**
 * mobile/src/screens/organization/OrgJobDetail.tsx
 */

import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useJob, useDeleteJob } from '../../hooks/useJobs';
import { formatDeadline, formatPostedDate, getJobStatusColor, getJobTypeLabel, getExperienceLevelLabel } from '../../utils/jobHelpers';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { ListSkeleton } from '../../components/skeletons';

interface OrgJobDetailProps { navigation: any; route: { params: { jobId: string } } }

export const OrgJobDetail: React.FC<OrgJobDetailProps> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;
  const jobQ = useJob(jobId);
  const deleteMut = useDeleteJob();
  const job = jobQ.data;
  const sc = getJobStatusColor(job?.status, theme.isDark);

  const confirmDelete = useCallback(() => {
    Alert.alert('Delete', `Delete "${job?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMut.mutateAsync(jobId); navigation.goBack(); } },
    ]);
  }, [job, jobId, deleteMut, navigation]);

  if (jobQ.isLoading) {
    return (
      <SafeAreaView style={[d.root, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="Opportunity" onBack={() => navigation.goBack()} />
        <ListSkeleton count={2} type="companyJob" />
      </SafeAreaView>
    );
  }
  if (!job) {
    return (
      <SafeAreaView style={[d.root, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="Not Found" onBack={() => navigation.goBack()} />
        <View style={d.center}><Text style={{ color: c.textMuted }}>Not found</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[d.root, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title="Opportunity Details" subtitle={job.title} onBack={() => navigation.goBack()}
        rightIcon="create-outline" onRightPress={() => navigation.navigate('OrgJobEdit', { jobId: job._id })} />
      <ScrollView contentContainerStyle={d.scroll}>
        <View style={[d.card, { backgroundColor: c.card, borderColor: c.border, borderLeftWidth: 4, borderLeftColor: '#059669' }]}>
          <View style={d.titleRow}>
            <Text style={[d.title, { color: c.text }]}>{job.title}</Text>
            <View style={[d.badge, { backgroundColor: sc.bg }]}>
              <Text style={[d.badgeText, { color: sc.text }]}>{job.status?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={d.statsRow}>
            {[
              { v: job.applicationCount ?? 0, l: 'Applicants' },
              { v: job.viewCount ?? 0,         l: 'Views' },
              { v: job.candidatesNeeded ?? 1,  l: 'Needed' },
            ].map((st, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={[d.div, { backgroundColor: c.border }]} />}
                <View style={d.stat}>
                  <Text style={[d.statVal, { color: c.text }]}>{st.v}</Text>
                  <Text style={[d.statLabel, { color: c.textMuted }]}>{st.l}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {[
          { icon: 'briefcase-outline', l: 'Type',       v: getJobTypeLabel(job.type) },
          { icon: 'school-outline',    l: 'Experience', v: getExperienceLevelLabel(job.experienceLevel) },
          { icon: 'location-outline',  l: 'Region',     v: job.location?.region ?? 'N/A' },
          { icon: 'time-outline',      l: 'Deadline',   v: formatDeadline(job.applicationDeadline) },
          { icon: 'calendar-outline',  l: 'Posted',     v: formatPostedDate(job.createdAt) },
        ].map((m, i) => (
          <View key={i} style={[d.metaRow, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name={m.icon as any} size={16} color={c.primary} />
            <Text style={[d.metaLabel, { color: c.textMuted }]}>{m.l}</Text>
            <Text style={[d.metaVal, { color: c.text }]}>{m.v}</Text>
          </View>
        ))}

        <View style={d.actions}>
          <TouchableOpacity
            style={[d.actionPrimary, { backgroundColor: c.primary }]}
            onPress={() => navigation.navigate('OrgApplicants', { jobId: job._id, jobTitle: job.title })}
          >
            <Ionicons name="people-outline" size={18} color="#fff" />
            <Text style={d.actionPrimaryText}>View Applicants ({job.applicationCount ?? 0})</Text>
          </TouchableOpacity>
          <View style={d.row2}>
            <TouchableOpacity style={[d.secBtn, { borderColor: c.border, flex: 1 }]} onPress={() => navigation.navigate('OrgJobEdit', { jobId: job._id })}>
              <Ionicons name="create-outline" size={16} color={c.textSecondary} />
              <Text style={[d.secText, { color: c.textSecondary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[d.secBtn, { borderColor: c.errorLight, flex: 1 }]} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={16} color={c.error} />
              <Text style={[d.secText, { color: c.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const d = StyleSheet.create({
  root: { flex: 1 }, scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  title: { flex: 1, fontSize: 17, fontWeight: '800' },
  badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 14, borderTopColor: '#E2E8F0' },
  stat: { flex: 1, alignItems: 'center' },
  div: { width: 1 },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 10 },
  metaLabel: { flex: 1, fontSize: 13 },
  metaVal: { fontSize: 13, fontWeight: '600' },
  actions: { gap: 10, marginTop: 4 },
  actionPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, gap: 8 },
  actionPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  row2: { flexDirection: 'row', gap: 10 },
  secBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, borderWidth: 1, gap: 6 },
  secText: { fontSize: 14, fontWeight: '600' },
});