import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import {
  Job,
  jobService,
} from '../../services/jobService';
import {
  formatSalary,
  formatDeadline,
  formatPostedDate,
  isDeadlineSoon,
  isDeadlinePast,
  getJobTypeColor,
  getExperienceLevelLabel,
  getCompanyInitials,
} from '../../utils/jobHelpers';

interface JobCardProps {
  job: Job;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress, onSave, isSaved }) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;

  const companyName  = jobService.getCompanyName(job);
  const logoUrl      = jobService.getCompanyLogo(job);
  const initials     = getCompanyInitials(companyName);
  const typeColor    = getJobTypeColor(job.jobType);
  const deadlineSoon = isDeadlineSoon(job.applicationDeadline);
  const deadlinePast = isDeadlinePast(job.applicationDeadline);
  const salaryText   = formatSalary(job.salary);
  const deadlineText = formatDeadline(job.applicationDeadline);
  const postedText   = formatPostedDate(job.createdAt);

  const jobTypeLabel = job.jobType?.replace('-', ' ')?.replace(/\b\w/g, (l) => l.toUpperCase()) ?? '';
  const expLabel     = getExperienceLevelLabel(job.experienceLevel);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        s.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: borderRadius.xl,
        },
        theme.shadows.sm,
      ]}
    >
      {/* Row 1: Company logo + name + save button */}
      <View style={s.row1}>
        <View style={s.logoWrap}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={s.logo} resizeMode="contain" />
          ) : (
            <View style={[s.logoFallback, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[s.logoInitials, { color: colors.primary, fontSize: typography.sm }]}>
                {initials}
              </Text>
            </View>
          )}
        </View>
        <Text style={[s.companyName, { color: colors.textMuted, fontSize: typography.sm, flex: 1 }]} numberOfLines={1}>
          {companyName}
        </Text>
        {onSave && (
          <TouchableOpacity onPress={onSave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Row 2: Job title */}
      <Text style={[s.title, { color: colors.text, fontSize: typography.lg }]} numberOfLines={2}>
        {job.title}
      </Text>

      {/* Row 3: Location + Job type badge */}
      <View style={s.row3}>
        <View style={s.locationRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={[s.locationText, { color: colors.textMuted, fontSize: typography.sm }]} numberOfLines={1}>
            {job.location?.remote
              ? 'Remote 🌍'
              : [job.location?.city, job.location?.region].filter(Boolean).join(', ') || 'Not specified'}
          </Text>
        </View>
        <View style={[s.typeBadge, { backgroundColor: typeColor.bg }]}>
          <Text style={[s.typeBadgeText, { color: typeColor.text, fontSize: typography.xs }]}>
            {jobTypeLabel}
          </Text>
        </View>
      </View>

      {/* Row 4: Salary + experience */}
      <View style={s.row4}>
        {salaryText !== 'Not specified' && (
          <View style={s.salaryRow}>
            <Ionicons name="cash-outline" size={13} color={colors.textMuted} />
            <Text style={[s.salaryText, { color: colors.text, fontSize: typography.sm }]}>
              {salaryText}
            </Text>
          </View>
        )}
        {expLabel ? (
          <View style={[s.expChip, { backgroundColor: colors.border }]}>
            <Text style={[s.expChipText, { color: colors.textMuted, fontSize: typography.xs }]}>
              {expLabel}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Row 5: Posted date + deadline */}
      <View style={s.row5}>
        <Text style={[s.postedText, { color: colors.textMuted, fontSize: typography.xs }]}>
          {postedText}
        </Text>
        {deadlineText && !deadlinePast && (
          <Text
            style={[
              s.deadlineText,
              { fontSize: typography.xs, color: deadlineSoon ? colors.warning : colors.textMuted },
            ]}
          >
            {deadlineSoon && '⚠️ '}{deadlineText}
          </Text>
        )}
        {deadlinePast && (
          <Text style={[s.deadlineText, { fontSize: typography.xs, color: colors.error }]}>
            Deadline passed
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card:       { padding: 16, marginBottom: 12, borderWidth: 1 },
  row1:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  logoWrap:   { width: 40, height: 40, borderRadius: 10, overflow: 'hidden' },
  logo:       { width: 40, height: 40, borderRadius: 10 },
  logoFallback:{ width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoInitials:{ fontWeight: '700' },
  companyName: { fontWeight: '500' },
  title:      { fontWeight: '700', marginBottom: 8, lineHeight: 24 },
  row3:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  locationRow:{ flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  locationText:{ marginLeft: 2 },
  typeBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  typeBadgeText:{ fontWeight: '600', textTransform: 'capitalize' },
  row4:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  salaryRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  salaryText: { fontWeight: '500' },
  expChip:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  expChipText:{ fontWeight: '500' },
  row5:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postedText: {},
  deadlineText:{ fontWeight: '500' },
});
