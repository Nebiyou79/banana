/**
 * src/screens/company/CompanyJobDetailScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Employer admin view of a posted job.
 * Shows: stats, edit/delete, applicants, full job details.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useJob, useDeleteJob, useUpdateJob } from '../../hooks/useJobs';
import { ListSkeleton } from '../../components/skeletons';
import { JobHeader } from '../../components/jobs/JobHeader';
import { formatLocation } from '../../utils/jobHelpers';

interface Props {
  navigation: any;
  route: { params: { jobId: string } };
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active:   { color: '#059669', bg: '#D1FAE5' },
  draft:    { color: '#64748B', bg: '#F1F5F9' },
  paused:   { color: '#D97706', bg: '#FEF3C7' },
  closed:   { color: '#DC2626', bg: '#FEE2E2' },
  archived: { color: '#6B7280', bg: '#F3F4F6' },
};

export const CompanyJobDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;

  const jobQ      = useJob(jobId);
  const deleteMut = useDeleteJob();
  const updateMut = useUpdateJob();
  const job       = jobQ.data;

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Job',
      `Delete "${job?.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMut.mutate(jobId, {
              onSuccess: () => navigation.goBack(),
            });
          },
        },
      ],
    );
  }, [job, jobId, deleteMut, navigation]);

  const handleStatusToggle = useCallback(() => {
    if (!job) return;
    const newStatus = job.status === 'active' ? 'paused' : 'active';
    updateMut.mutate({ id: jobId, data: { status: newStatus } });
  }, [job, jobId, updateMut]);

  if (jobQ.isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={[]}>
        <View style={[s.loadingHeader, { backgroundColor: '#0A1628' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <ListSkeleton count={3} type="job" />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={52} color={c.textMuted} />
          <Text style={[s.notFound, { color: c.text }]}>Job not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[s.goBack, { backgroundColor: c.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const st = STATUS_COLORS[job.status ?? 'draft'] ?? STATUS_COLORS.draft;
  const applicantCount = job.applicationCount ?? 0;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <JobHeader
          job={job}
          onBack={() => navigation.goBack()}
        />

        {/* Action buttons */}
        <View style={[s.actions, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <ActionButton
            icon="pencil-outline"
            label="Edit"
            color={c.primary}
            onPress={() => navigation.navigate('JobEdit', { jobId })}
          />
          <View style={[s.actionDivider, { backgroundColor: c.border }]} />
          <ActionButton
            icon="people-outline"
            label={`${applicantCount} Applicants`}
            color="#8B5CF6"
            onPress={() => navigation.navigate('ApplicationList', { jobId })}
          />
          <View style={[s.actionDivider, { backgroundColor: c.border }]} />
          <ActionButton
            icon={job.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
            label={job.status === 'active' ? 'Pause' : 'Activate'}
            color={job.status === 'active' ? '#D97706' : '#10B981'}
            onPress={handleStatusToggle}
            loading={updateMut.isPending}
          />
          <View style={[s.actionDivider, { backgroundColor: c.border }]} />
          <ActionButton
            icon="trash-outline"
            label="Delete"
            color={c.error}
            onPress={handleDelete}
            loading={deleteMut.isPending}
          />
        </View>

        {/* Stats */}
        <View style={[s.statsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <StatItem value={applicantCount} label="Applicants" icon="people-outline" color="#3B82F6" c={c} />
          <StatItem value={job.candidatesNeeded ?? 1} label="Positions" icon="person-outline" color="#10B981" c={c} />
          <StatItem value={job.viewCount ?? 0} label="Views" icon="eye-outline" color="#F59E0B" c={c} />
          <StatItem value={job.saveCount ?? 0} label="Saves" icon="bookmark-outline" color="#8B5CF6" c={c} />
        </View>

        {/* Status badge */}
        <View style={[s.statusRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[s.statusLabel, { color: c.textMuted }]}>Status</Text>
          <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[s.statusText, { color: st.color }]}>{(job.status ?? 'draft').toUpperCase()}</Text>
          </View>
        </View>

        {/* Description */}
        <Section title="Description" icon="document-text-outline" c={c}>
          <Text style={[s.bodyText, { color: c.textSecondary ?? c.textMuted }]}>{job.description}</Text>
        </Section>

        {/* Requirements */}
        {(job.requirements ?? []).length > 0 && (
          <Section title="Requirements" icon="checkmark-circle-outline" c={c}>
            {job.requirements!.map((r, i) => (
              <BulletItem key={i} text={r} c={c} color={c.primary} />
            ))}
          </Section>
        )}

        {/* Responsibilities */}
        {(job.responsibilities ?? []).length > 0 && (
          <Section title="Responsibilities" icon="list-outline" c={c}>
            {job.responsibilities!.map((r, i) => (
              <BulletItem key={i} text={r} c={c} color="#F59E0B" />
            ))}
          </Section>
        )}

        {/* Skills */}
        {(job.skills ?? []).length > 0 && (
          <Section title="Required Skills" icon="sparkles-outline" c={c}>
            <View style={s.tagsRow}>
              {job.skills!.map((sk, i) => (
                <View key={i} style={[s.tag, { backgroundColor: `${c.primary}15`, borderColor: `${c.primary}30` }]}>
                  <Text style={[s.tagText, { color: c.primary }]}>{sk}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Info grid */}
        <Section title="Job Details" icon="information-circle-outline" c={c}>
          {[
            { icon: 'briefcase-outline', label: 'Type', value: job.type },
            { icon: 'trending-up-outline', label: 'Experience', value: job.experienceLevel },
            { icon: 'school-outline', label: 'Education', value: job.educationLevel ?? 'Not specified' },
            { icon: 'location-outline', label: 'Location', value: formatLocation(job.location) },
            { icon: 'globe-outline', label: 'Work Mode', value: job.remote },
            { icon: 'calendar-outline', label: 'Deadline', value: job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No deadline' },
            { icon: 'document-outline', label: 'Reference #', value: job.jobNumber ?? '—' },
          ].map((row, i) => (
            <View key={i} style={[s.detailRow, { borderBottomColor: c.border }]}>
              <Ionicons name={row.icon as any} size={16} color={c.primary} />
              <Text style={[s.detailLabel, { color: c.textMuted }]}>{row.label}</Text>
              <Text style={[s.detailValue, { color: c.text }]}>{row.value ?? '—'}</Text>
            </View>
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const ActionButton = ({ icon, label, color, onPress, loading }: any) => (
  <TouchableOpacity onPress={onPress} disabled={loading} style={s.actionBtn}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[s.actionLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const StatItem = ({ value, label, icon, color, c }: any) => (
  <View style={s.statItem}>
    <View style={[s.statIcon, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={[s.statValue, { color: c.text }]}>{value}</Text>
    <Text style={[s.statLabel, { color: c.textMuted }]}>{label}</Text>
  </View>
);

const Section = ({ title, icon, c, children }: any) => (
  <View style={[s.section, { backgroundColor: c.surface, borderColor: c.border }]}>
    <View style={[s.sectionHeader, { borderBottomColor: c.border }]}>
      <Ionicons name={icon} size={18} color={c.primary} />
      <Text style={[s.sectionTitle, { color: c.text }]}>{title}</Text>
    </View>
    <View style={s.sectionBody}>{children}</View>
  </View>
);

const BulletItem = ({ text, c, color }: any) => (
  <View style={s.bulletRow}>
    <Ionicons name="checkmark-circle" size={15} color={color} style={{ marginTop: 2 }} />
    <Text style={[s.bulletText, { color: c.textSecondary ?? c.textMuted }]}>{text}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:          { flex: 1 },
  loadingHeader: { height: 160, paddingTop: 50, paddingLeft: 16 },
  backBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFound:      { fontSize: 18, fontWeight: '700' },
  goBack:        { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  actions:       { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 4 },
  actionBtn:     { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  actionLabel:   { fontSize: 11, fontWeight: '600' },
  actionDivider: { width: 1, height: '60%', alignSelf: 'center' },
  statsCard:     { flexDirection: 'row', margin: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  statItem:      { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue:     { fontSize: 20, fontWeight: '800' },
  statLabel:     { fontSize: 10, fontWeight: '600' },
  statusRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  statusLabel:   { fontSize: 14, fontWeight: '600' },
  statusBadge:   { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText:    { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  section:       { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  sectionTitle:  { fontSize: 15, fontWeight: '700' },
  sectionBody:   { padding: 16 },
  bodyText:      { fontSize: 14, lineHeight: 22 },
  tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tagText:       { fontSize: 12, fontWeight: '600' },
  bulletRow:     { flexDirection: 'row', gap: 10, marginBottom: 8 },
  bulletText:    { flex: 1, fontSize: 14, lineHeight: 21 },
  detailRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  detailLabel:   { fontSize: 12, width: 90 },
  detailValue:   { flex: 1, fontSize: 13, fontWeight: '500', textAlign: 'right' },
});