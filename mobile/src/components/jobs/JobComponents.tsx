// ─────────────────────────────────────────────────────────────────────────────
// CompanyJobCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Job } from '../../services/jobService';
import { formatDeadline, getJobStatusColor } from '../../utils/jobHelpers';

interface CompanyJobCardProps {
  job: Job;
  onEdit: () => void;
  onDelete: () => void;
  onViewApplicants: () => void;
}

export const CompanyJobCard: React.FC<CompanyJobCardProps> = ({
  job, onEdit, onDelete, onViewApplicants,
}) => {
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius } = theme;
  const statusColor = getJobStatusColor(job.status);
  const applicantCount = job.applicantCount ?? job.applicationCount ?? 0;

  const confirmDelete = () =>
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete "${job.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );

  return (
    <View
      style={[
        cjc.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: borderRadius.xl,
          borderLeftColor: statusColor.border,
        },
        theme.shadows.sm,
      ]}
    >
      {/* Title + status badge */}
      <View style={cjc.titleRow}>
        <Text style={[cjc.title, { color: colors.text, fontSize: typography.base, flex: 1 }]} numberOfLines={2}>
          {job.title}
        </Text>
        <View style={[cjc.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[cjc.statusText, { color: statusColor.text, fontSize: typography.xs }]}>
            {job.status?.charAt(0).toUpperCase() + (job.status?.slice(1) ?? '')}
          </Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={cjc.metaRow}>
        <View style={cjc.metaItem}>
          <Ionicons name="people-outline" size={14} color={colors.textMuted} />
          <Text style={[cjc.metaText, { color: colors.textMuted, fontSize: typography.sm }]}>
            {applicantCount} applicant{applicantCount !== 1 ? 's' : ''}
          </Text>
        </View>
        {job.applicationDeadline && (
          <View style={cjc.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={[cjc.metaText, { color: colors.textMuted, fontSize: typography.sm }]}>
              {formatDeadline(job.applicationDeadline)}
            </Text>
          </View>
        )}
      </View>

      {/* Action row */}
      <View style={[cjc.actionRow, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={cjc.actionBtn} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
          <Text style={[cjc.actionText, { color: colors.primary, fontSize: typography.sm }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={cjc.actionBtn} onPress={onViewApplicants}>
          <Ionicons name="people-outline" size={16} color={colors.primary} />
          <Text style={[cjc.actionText, { color: colors.primary, fontSize: typography.sm }]}>
            Applicants
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={cjc.actionBtn} onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={[cjc.actionText, { color: '#EF4444', fontSize: typography.sm }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const cjc = StyleSheet.create({
  card:       { borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 12 },
  titleRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  title:      { fontWeight: '700', lineHeight: 22 },
  statusBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' },
  statusText: { fontWeight: '600' },
  metaRow:    { flexDirection: 'row', gap: 16, marginBottom: 10 },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:   {},
  actionRow:  { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, gap: 8 },
  actionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  actionText: { fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// JobFilter.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { Modal, ScrollView, Switch, TextInput } from 'react-native';
import { JobFilters } from '../../services/jobService';

interface JobFilterProps {
  visible: boolean;
  filters: JobFilters;
  onApply: (f: JobFilters) => void;
  onReset: () => void;
  onClose: () => void;
}

const JOB_TYPES    = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
const EXP_LEVELS   = ['entry', 'mid', 'senior', 'executive'];
const EXP_LABELS   = ['Entry', 'Mid', 'Senior', 'Executive'];

export const JobFilter: React.FC<JobFilterProps> = ({
  visible, filters, onApply, onReset, onClose,
}) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const [local, setLocal] = React.useState<JobFilters>(filters);

  React.useEffect(() => { setLocal(filters); }, [filters, visible]);

  const toggle = (key: keyof JobFilters, val: string) =>
    setLocal((f) => ({ ...f, [key]: f[key] === val ? undefined : val }));

  const Chip: React.FC<{ label: string; active: boolean; onPress: () => void; color?: string }> = ({
    label, active, onPress, color,
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        jf.chip,
        {
          backgroundColor: active ? (color ?? colors.primary) + '18' : colors.surface,
          borderColor:     active ? (color ?? colors.primary) : colors.border,
          borderWidth:     active ? 2 : 1,
        },
      ]}
    >
      <Text style={[jf.chipText, { color: active ? (color ?? colors.primary) : colors.textMuted, fontSize: typography.sm }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={jf.overlay}>
        <View style={[jf.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle */}
          <View style={[jf.handle, { backgroundColor: colors.border }]} />

          <View style={jf.header}>
            <Text style={[jf.headerTitle, { color: colors.text, fontSize: typography.lg }]}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

            {/* Job Type */}
            <Text style={[jf.sectionLabel, { color: colors.text, fontSize: typography.sm }]}>Job Type</Text>
            <View style={jf.chipRow}>
              {JOB_TYPES.map((t) => (
                <Chip
                  key={t}
                  label={t.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  active={local.jobType === t}
                  onPress={() => toggle('jobType', t)}
                />
              ))}
            </View>

            {/* Experience Level */}
            <Text style={[jf.sectionLabel, { color: colors.text, fontSize: typography.sm }]}>Experience Level</Text>
            <View style={jf.chipRow}>
              {EXP_LEVELS.map((e, i) => (
                <Chip
                  key={e}
                  label={EXP_LABELS[i]}
                  active={local.experienceLevel === e}
                  onPress={() => toggle('experienceLevel', e)}
                />
              ))}
            </View>

            {/* Location */}
            <Text style={[jf.sectionLabel, { color: colors.text, fontSize: typography.sm }]}>Region</Text>
            <TextInput
              style={[jf.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, fontSize: typography.base }]}
              placeholder="e.g. Addis Ababa"
              placeholderTextColor={colors.textMuted}
              value={local.region ?? ''}
              onChangeText={(v) => setLocal((f) => ({ ...f, region: v || undefined }))}
            />
            <View style={jf.switchRow}>
              <Text style={[{ color: colors.text, fontSize: typography.base }]}>Remote only</Text>
              <Switch
                value={!!local.remote}
                onValueChange={(v) => setLocal((f) => ({ ...f, remote: v || undefined }))}
                trackColor={{ true: colors.primary }}
              />
            </View>

            {/* Salary */}
            <Text style={[jf.sectionLabel, { color: colors.text, fontSize: typography.sm }]}>Salary Range (USD)</Text>
            <View style={jf.salaryRow}>
              <TextInput
                style={[jf.salaryInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, fontSize: typography.base }]}
                placeholder="Min"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={local.minSalary ? String(local.minSalary) : ''}
                onChangeText={(v) => setLocal((f) => ({ ...f, minSalary: v ? Number(v) : undefined }))}
              />
              <Text style={{ color: colors.textMuted }}>–</Text>
              <TextInput
                style={[jf.salaryInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, fontSize: typography.base }]}
                placeholder="Max"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={local.maxSalary ? String(local.maxSalary) : ''}
                onChangeText={(v) => setLocal((f) => ({ ...f, maxSalary: v ? Number(v) : undefined }))}
              />
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={[jf.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[jf.resetBtn, { borderColor: colors.border }]}
              onPress={() => { setLocal({}); onReset(); }}
            >
              <Text style={[{ color: colors.text, fontWeight: '600', fontSize: typography.base }]}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[jf.applyBtn, { backgroundColor: colors.primary }]}
              onPress={() => { onApply(local); onClose(); }}
            >
              <Text style={[{ color: '#fff', fontWeight: '700', fontSize: typography.base }]}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const jf = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '90%' },
  handle:       { width: 40, height: 4, borderRadius: 99, alignSelf: 'center', marginBottom: 12 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle:  { fontWeight: '700' },
  sectionLabel: { fontWeight: '700', marginBottom: 10, marginTop: 16 },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99 },
  chipText:     { fontWeight: '600' },
  textInput:    { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  switchRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  salaryRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  salaryInput:  { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  footer:       { flexDirection: 'row', gap: 12, borderTopWidth: 1, paddingTop: 16, paddingBottom: 8 },
  resetBtn:     { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  applyBtn:     { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailsHeader.tsx
// ─────────────────────────────────────────────────────────────────────────────

interface JobDetailsHeaderProps { job: Job }

export const JobDetailsHeader: React.FC<JobDetailsHeaderProps> = ({ job }) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;

  const companyName = jobService.getCompanyName(job);
  const logoUrl     = jobService.getCompanyLogo(job);
  const initials    = getCompanyInitials(companyName);
  const typeColor   = getJobTypeColor(job.jobType);
  const salaryText  = formatSalary(job.salary);
  const expLabel    = getExperienceLevelLabel(job.experienceLevel);
  const postedText  = formatPostedDate(job.createdAt);
  const deadlineText= formatDeadline(job.applicationDeadline);
  const deadlineSoon= isDeadlineSoon(job.applicationDeadline);

  return (
    <View>
      {/* Cover strip */}
      <View style={[jdh.cover, { backgroundColor: colors.primary + '18' }]} />

      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        {/* Company logo + name */}
        <View style={jdh.companyRow}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={jdh.logo} resizeMode="contain" />
          ) : (
            <View style={[jdh.logoFallback, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[{ color: colors.primary, fontWeight: '800', fontSize: typography.lg }]}>{initials}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[{ color: colors.text, fontWeight: '700', fontSize: typography.base }]}>{companyName}</Text>
            {(job.company?.verified || job.organization?.verified) && (
              <View style={jdh.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text style={[{ color: '#10B981', fontSize: typography.xs, marginLeft: 3, fontWeight: '600' }]}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={[jdh.title, { color: colors.text, fontSize: typography['2xl'] }]}>{job.title}</Text>

        {/* Location */}
        <View style={jdh.infoRow}>
          <Ionicons name="location-outline" size={15} color={colors.textMuted} />
          <Text style={[{ color: colors.textMuted, fontSize: typography.base, marginLeft: 4 }]}>
            {job.location?.remote
              ? 'Remote 🌍'
              : [job.location?.city, job.location?.region].filter(Boolean).join(', ') || 'Not specified'}
          </Text>
        </View>

        {/* Badges row */}
        <View style={jdh.badgeRow}>
          <View style={[jdh.badge, { backgroundColor: typeColor.bg }]}>
            <Text style={[{ color: typeColor.text, fontSize: typography.xs, fontWeight: '700' }]}>
              {job.jobType?.replace('-', ' ')?.replace(/\b\w/g, (l) => l.toUpperCase())}
            </Text>
          </View>
          {expLabel && (
            <View style={[jdh.badge, { backgroundColor: colors.border }]}>
              <Text style={[{ color: colors.textMuted, fontSize: typography.xs, fontWeight: '600' }]}>{expLabel}</Text>
            </View>
          )}
        </View>

        {/* Salary */}
        {salaryText !== 'Not specified' && (
          <View style={jdh.infoRow}>
            <Ionicons name="cash-outline" size={15} color={colors.textMuted} />
            <Text style={[{ color: colors.text, fontSize: typography.base, fontWeight: '600', marginLeft: 4 }]}>
              {salaryText}
            </Text>
          </View>
        )}

        {/* Posted + deadline */}
        <View style={[jdh.infoRow, { marginBottom: 16 }]}>
          <Text style={[{ color: colors.textMuted, fontSize: typography.sm }]}>{postedText}</Text>
          {deadlineText && (
            <Text style={[{ fontSize: typography.sm, marginLeft: 12, color: deadlineSoon ? colors.warning : colors.textMuted }]}>
              {deadlineSoon && '⚠️ '}{deadlineText}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const jdh = StyleSheet.create({
  cover:       { height: 120 },
  companyRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  logo:        { width: 64, height: 64, borderRadius: 14 },
  logoFallback:{ width: 64, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  verifiedBadge:{ flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  title:       { fontWeight: '800', marginBottom: 10, lineHeight: 32 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  badgeRow:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
});
