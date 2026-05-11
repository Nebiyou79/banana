/**
 * src/screens/company/CompanyJobDetailScreen.tsx
 */
import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useJob, useDeleteJob, useUpdateJob } from '../../hooks/useJobs';
import { ListSkeleton } from '../../components/skeletons';
import { JobHeader } from '../../components/jobs/JobHeader';
import { formatLocation } from '../../utils/jobHelpers';
import { FONT_SIZE } from '../../theme/tokens';

interface Props {
  navigation: any;
  route: { params: { jobId: string } };
}

export const CompanyJobDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  // STATUS_COLORS built from theme tokens — never module-level hex
  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    active:   { color: colors.success,   bg: `${colors.success}20` },
    draft:    { color: colors.textMuted, bg: colors.border },
    paused:   { color: colors.warning,   bg: `${colors.warning}20` },
    closed:   { color: colors.danger,    bg: `${colors.danger}20` },
    archived: { color: colors.textMuted, bg: `${colors.border}` },
  };

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
          text: 'Delete', style: 'destructive',
          onPress: () => deleteMut.mutate(jobId, { onSuccess: () => navigation.goBack() }),
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
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={[]}>
        <View style={[s.loadingHeader, { backgroundColor: colors.bgCard }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: `${colors.text}15` }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ListSkeleton count={3} type="job" />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={52} color={colors.textMuted} />
          <Text style={[s.notFound, { color: colors.text }]}>Job not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[s.goBack, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.textInverse, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const st = STATUS_COLORS[job.status ?? 'draft'] ?? STATUS_COLORS.draft;
  const applicantCount = job.applicationCount ?? 0;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
      >
        <JobHeader job={job} onBack={() => navigation.goBack()} />

        {/* Action buttons */}
        <View style={[s.actions, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
          <ActionButton
            icon="pencil-outline"
            label="Edit"
            color={colors.primary}
            onPress={() => navigation.navigate('JobEdit', { jobId })}
          />
          <View style={[s.actionDivider, { backgroundColor: colors.border }]} />
          <ActionButton
            icon="people-outline"
            label={`${applicantCount} Applicants`}
            color={colors.organization}
            onPress={() => navigation.navigate('ApplicationList', { jobId })}
          />
          <View style={[s.actionDivider, { backgroundColor: colors.border }]} />
          <ActionButton
            icon={job.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
            label={job.status === 'active' ? 'Pause' : 'Activate'}
            color={job.status === 'active' ? colors.warning : colors.success}
            onPress={handleStatusToggle}
            loading={updateMut.isPending}
          />
          <View style={[s.actionDivider, { backgroundColor: colors.border }]} />
          <ActionButton
            icon="trash-outline"
            label="Delete"
            color={colors.danger}
            onPress={handleDelete}
            loading={deleteMut.isPending}
          />
        </View>

        {/* Stats */}
        <View style={[s.statsCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <StatItem value={applicantCount}           label="Applicants" icon="people-outline"   color={colors.info}         colors={colors} />
          <StatItem value={job.candidatesNeeded ?? 1} label="Positions" icon="person-outline"   color={colors.success}      colors={colors} />
          <StatItem value={job.viewCount ?? 0}        label="Views"     icon="eye-outline"       color={colors.warning}      colors={colors} />
          <StatItem value={job.saveCount ?? 0}        label="Saves"     icon="bookmark-outline"  color={colors.organization} colors={colors} />
        </View>

        {/* Status badge */}
        <View style={[s.statusRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[s.statusLabel, { color: colors.textMuted }]}>Status</Text>
          <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[s.statusText, { color: st.color }]}>{(job.status ?? 'draft').toUpperCase()}</Text>
          </View>
        </View>

        {/* Description */}
        <Section title="Description" icon="document-text-outline" colors={colors}>
          <Text style={[s.bodyText, { color: colors.textMuted }]}>{job.description}</Text>
        </Section>

        {/* Requirements */}
        {(job.requirements ?? []).length > 0 && (
          <Section title="Requirements" icon="checkmark-circle-outline" colors={colors}>
            {job.requirements!.map((r, i) => (
              <BulletItem key={i} text={r} colors={colors} color={colors.primary} />
            ))}
          </Section>
        )}

        {/* Responsibilities */}
        {(job.responsibilities ?? []).length > 0 && (
          <Section title="Responsibilities" icon="list-outline" colors={colors}>
            {job.responsibilities!.map((r, i) => (
              <BulletItem key={i} text={r} colors={colors} color={colors.warning} />
            ))}
          </Section>
        )}

        {/* Skills */}
        {(job.skills ?? []).length > 0 && (
          <Section title="Required Skills" icon="sparkles-outline" colors={colors}>
            <View style={s.tagsRow}>
              {job.skills!.map((sk, i) => (
                <View key={i} style={[s.tag, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
                  <Text style={[s.tagText, { color: colors.primary }]}>{sk}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Info grid */}
        <Section title="Job Details" icon="information-circle-outline" colors={colors}>
          {[
            { icon: 'briefcase-outline',    label: 'Type',       value: job.type },
            { icon: 'trending-up-outline',  label: 'Experience', value: job.experienceLevel },
            { icon: 'school-outline',       label: 'Education',  value: job.educationLevel ?? 'Not specified' },
            { icon: 'location-outline',     label: 'Location',   value: formatLocation(job.location) },
            { icon: 'globe-outline',        label: 'Work Mode',  value: job.remote },
            { icon: 'calendar-outline',     label: 'Deadline',   value: job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No deadline' },
            { icon: 'document-outline',     label: 'Reference #',value: job.jobNumber ?? '—' },
          ].map((row, i) => (
            <View key={i} style={[s.detailRow, { borderBottomColor: colors.border }]}>
              <Ionicons name={row.icon as any} size={16} color={colors.primary} />
              <Text style={[s.detailLabel, { color: colors.textMuted }]}>{row.label}</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>{row.value ?? '—'}</Text>
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

const StatItem = ({ value, label, icon, color, colors }: any) => (
  <View style={s.statItem}>
    <View style={[s.statIcon, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={[s.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[s.statLabel, { color: colors.textMuted }]}>{label}</Text>
  </View>
);

const Section = ({ title, icon, colors, children }: any) => (
  <View style={[s.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
    <View style={[s.sectionHeader, { borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[s.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
    <View style={s.sectionBody}>{children}</View>
  </View>
);

const BulletItem = ({ text, colors, color }: any) => (
  <View style={s.bulletRow}>
    <Ionicons name="checkmark-circle" size={15} color={color} style={{ marginTop: 2 }} />
    <Text style={[s.bulletText, { color: colors.textMuted }]}>{text}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:          { flex: 1 },
  loadingHeader: { height: 160, paddingTop: 50, paddingLeft: 16 },
  backBtn:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFound:      { fontSize: FONT_SIZE.md, fontWeight: '700' },
  goBack:        { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  actions:       { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 4 },
  actionBtn:     { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  actionLabel:   { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  actionDivider: { width: 1, height: '60%', alignSelf: 'center' },
  statsCard:     { flexDirection: 'row', margin: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  statItem:      { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue:     { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  statLabel:     { fontSize: 10, fontWeight: '600' },
  statusRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  statusLabel:   { fontSize: FONT_SIZE.base, fontWeight: '600' },
  statusBadge:   { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText:    { fontSize: FONT_SIZE.sm, fontWeight: '700', letterSpacing: 0.5 },
  section:       { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  sectionTitle:  { fontSize: 15, fontWeight: '700' },
  sectionBody:   { padding: 16 },
  bodyText:      { fontSize: FONT_SIZE.base, lineHeight: 22 },
  tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tagText:       { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  bulletRow:     { flexDirection: 'row', gap: 10, marginBottom: 8 },
  bulletText:    { flex: 1, fontSize: FONT_SIZE.base, lineHeight: 21 },
  detailRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  detailLabel:   { fontSize: FONT_SIZE.sm, width: 90 },
  detailValue:   { flex: 1, fontSize: FONT_SIZE.sm + 1, fontWeight: '500', textAlign: 'right' },
});