/**
 * mobile/src/screens/company/CompanyJobDetail.tsx
 * Admin-view of a posted job with Edit, Delete, and Applicant management.
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useJob, useDeleteJob } from '../../hooks/useJobs';
import {
  formatDeadline, formatPostedDate, getJobStatusColor,
  getJobTypeLabel, getExperienceLevelLabel, formatSalary,
} from '../../utils/jobHelpers';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { ListSkeleton } from '../../components/skeletons';

interface Props {
  navigation: any;
  route: { params: { jobId: string } };
}

export const CompanyJobDetail: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;
  const jobQ     = useJob(jobId);
  const deleteMut = useDeleteJob();

  const job = jobQ.data;
  const sc  = getJobStatusColor(job?.status, theme.isDark);

  const confirmDelete = useCallback(() => {
    Alert.alert('Delete Job', `Delete "${job?.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteMut.mutateAsync(jobId);
          navigation.goBack();
        },
      },
    ]);
  }, [job, jobId, deleteMut, navigation]);

  if (jobQ.isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="Job Details" onBack={() => navigation.goBack()} />
        <ListSkeleton count={2} type="companyJob" />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="Not Found" onBack={() => navigation.goBack()} />
        <View style={s.center}>
          <Text style={{ color: c.textMuted }}>Job not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader
        title="Job Details"
        subtitle={job.title}
        onBack={() => navigation.goBack()}
        rightIcon="create-outline"
        onRightPress={() => navigation.navigate('JobEdit', { jobId: job._id })}
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Title card */}
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderLeftWidth: 4, borderLeftColor: sc.border }]}>
          <View style={s.titleRow}>
            <Text style={[s.title, { color: c.text }]}>{job.title}</Text>
            <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[s.statusText, { color: sc.text }]}>{job.status?.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={[s.category, { color: c.textMuted }]}>{job.category?.replace(/-/g, ' ')}</Text>

          {/* Stats */}
          <View style={[s.statsRow, { borderTopColor: c.border }]}>
            {[
              { icon: 'people-outline',  value: job.applicationCount ?? 0, label: 'Applicants' },
              { icon: 'eye-outline',     value: job.viewCount ?? 0,         label: 'Views' },
              { icon: 'person-outline',  value: job.candidatesNeeded,       label: 'Needed' },
            ].map((st, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={[s.statDiv, { backgroundColor: c.border }]} />}
                <View style={s.stat}>
                  <Text style={[s.statVal, { color: c.text }]}>{st.value}</Text>
                  <Text style={[s.statLabel, { color: c.textMuted }]}>{st.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Meta */}
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
          {[
            { icon: 'location-outline',  label: 'Location',  value: `${job.location?.city ?? ''} ${job.location?.region ?? ''}`.trim() || 'N/A' },
            { icon: 'briefcase-outline', label: 'Type',      value: getJobTypeLabel(job.type) },
            { icon: 'school-outline',    label: 'Experience',value: getExperienceLevelLabel(job.experienceLevel) },
            { icon: 'cash-outline',      label: 'Salary',    value: formatSalary(job) },
            { icon: 'time-outline',      label: 'Deadline',  value: formatDeadline(job.applicationDeadline) },
            { icon: 'calendar-outline',  label: 'Posted',    value: formatPostedDate(job.createdAt) },
          ].map((item, i) => (
            <View key={i} style={[s.metaItem, i > 0 && { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Ionicons name={item.icon as any} size={16} color={c.primary} />
              <Text style={[s.metaLabel, { color: c.textMuted }]}>{item.label}</Text>
              <Text style={[s.metaValue, { color: c.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {job.description && (
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[s.sectionTitle, { color: c.text }]}>Description</Text>
            <Text style={[s.bodyText, { color: c.textSecondary }]}>{job.description}</Text>
          </View>
        )}

        {/* Requirements */}
        {(job.requirements ?? []).length > 0 && (
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[s.sectionTitle, { color: c.text }]}>Requirements</Text>
            {job.requirements!.map((r, i) => (
              <View key={i} style={s.bulletRow}>
                <View style={[s.bullet, { backgroundColor: c.primary }]} />
                <Text style={[s.bulletText, { color: c.textSecondary }]}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.actionPrimary, { backgroundColor: c.primary }]}
            onPress={() => navigation.navigate('ApplicantManager', { jobId: job._id, jobTitle: job.title })}
            activeOpacity={0.85}
          >
            <Ionicons name="people-outline" size={18} color="#fff" />
            <Text style={s.actionPrimaryText}>View Applicants ({job.applicationCount ?? 0})</Text>
          </TouchableOpacity>

          <View style={s.row2}>
            <TouchableOpacity
              style={[s.actionSecondary, { borderColor: c.border, flex: 1 }]}
              onPress={() => navigation.navigate('JobEdit', { jobId: job._id })}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color={c.textSecondary} />
              <Text style={[s.actionSecText, { color: c.textSecondary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionSecondary, { borderColor: c.errorLight, flex: 1 }]}
              onPress={confirmDelete}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color={c.error} />
              <Text style={[s.actionSecText, { color: c.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:            { flex: 1 },
  scroll:          { padding: 16, gap: 16, paddingBottom: 40 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card:            { borderRadius: 16, borderWidth: 1, padding: 16 },
  titleRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  title:           { flex: 1, fontSize: 18, fontWeight: '800', lineHeight: 24 },
  statusBadge:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText:      { fontSize: 10, fontWeight: '800' },
  category:        { fontSize: 13, textTransform: 'capitalize', marginBottom: 14 },
  statsRow:        { flexDirection: 'row', paddingTop: 14, borderTopWidth: 1 },
  stat:            { flex: 1, alignItems: 'center' },
  statDiv:         { width: 1 },
  statVal:         { fontSize: 20, fontWeight: '800' },
  statLabel:       { fontSize: 11, marginTop: 2 },
  metaItem:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  metaLabel:       { flex: 1, fontSize: 13 },
  metaValue:       { fontSize: 13, fontWeight: '600' },
  sectionTitle:    { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  bodyText:        { fontSize: 14, lineHeight: 22 },
  bulletRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet:          { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText:      { flex: 1, fontSize: 14, lineHeight: 21 },
  actions:         { gap: 10 },
  actionPrimary:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, gap: 8 },
  actionPrimaryText:{ color: '#fff', fontSize: 15, fontWeight: '700' },
  row2:            { flexDirection: 'row', gap: 10 },
  actionSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 12, borderWidth: 1, gap: 6 },
  actionSecText:   { fontSize: 14, fontWeight: '600' },
});