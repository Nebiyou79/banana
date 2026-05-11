/**
 * src/components/jobs/JobHeader.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Gradient job header with company/organization avatar.
 *
 * FIXED: Avatar display with proper entity conversion
 */
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import { Job } from '../../services/jobService';
import { Avatar, jobOwnerToEntity } from '../shared/Avatar';
import { formatLocation } from '../../utils/jobHelpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDeadlineInfo = (d?: string): { text: string; urgent: boolean } => {
  if (!d) return { text: 'No deadline', urgent: false };
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
  if (diff < 0)  return { text: 'Expired',       urgent: true };
  if (diff === 0) return { text: 'Closes today!', urgent: true };
  if (diff <= 3)  return { text: `${diff} days left!`, urgent: true };
  if (diff <= 7)  return { text: `${diff} days left`,  urgent: false };
  return {
    text: new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    }),
    urgent: false,
  };
};

const getGradientColors = (
  job: Job,
  isDark: boolean,
): [string, string, string] => {
  if (job.jobType === 'organization') {
    return isDark
      ? ['#1E1142', '#2D1B69', '#0F2040']
      : ['#6D28D9', '#7C3AED', '#4F46E5'];
  }
  return isDark
    ? ['#0A1628', '#162035', '#1C2B45']
    : ['#0F2040', '#1C3A60', '#243352'];
};

const MetaBadge = React.memo<{ icon: React.ComponentProps<typeof Ionicons>['name']; label: string }>(
  ({ icon, label }) => (
    <View style={mb.badge}>
      <Ionicons name={icon} size={12} color="rgba(255,255,255,0.85)" />
      <Text style={mb.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  ),
);
MetaBadge.displayName = 'JobHeader.MetaBadge';

const mb = StyleSheet.create({
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   withAlpha('#FFFFFF', 0.15),
    paddingHorizontal: 9,
    paddingVertical:   5,
    borderRadius:      RADIUS.full,
    gap:               4,
  },
  text: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface JobHeaderProps {
  job: Job;
  onBack: () => void;
  onSave?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const JobHeader: React.FC<JobHeaderProps> = ({
  job,
  onBack,
  onSave,
  onShare,
  isSaved = false,
}) => {
  const { colors: c, isDark } = useTheme();

  // FIXED: Proper entity for Avatar
  const ownerEntity = jobOwnerToEntity(job);
  const owner       = job.jobType === 'organization' ? job.organization : job.company;
  const gradColors  = getGradientColors(job, isDark);
  const dl          = getDeadlineInfo(job.applicationDeadline);

  const salaryText = useMemo((): string | null => {
    if (job.salaryDisplay)               return job.salaryDisplay;
    if (job.salaryMode === 'negotiable') return 'Negotiable';
    if (job.salaryMode === 'hidden')     return null;
    if (job.salaryMode === 'company-scale') return 'Company scale';
    if (job.salary?.min && job.salary?.max) {
      const fmt = (n: number) =>
        n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
      return `${job.salary.currency ?? 'ETB'} ${fmt(job.salary.min)} – ${fmt(job.salary.max)}`;
    }
    return null;
  }, [job]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        gradient: {
          paddingTop:        12,
          paddingHorizontal: SPACING.lg,
          paddingBottom:     24,
        },
        topNav: {
          flexDirection:  'row',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   12,
        },
        navBtn: {
          width:          40,
          height:         40,
          borderRadius:   RADIUS.full,
          backgroundColor: withAlpha('#FFFFFF', 0.12),
          alignItems:     'center',
          justifyContent: 'center',
        },
        navRight: { flexDirection: 'row', gap: SPACING.sm },
        bannerRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: 10 },
        banner: {
          flexDirection:     'row',
          alignItems:        'center',
          paddingHorizontal: 10,
          paddingVertical:   4,
          borderRadius:      RADIUS.full,
          gap:               4,
        },
        bannerText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
        companyRow: {
          flexDirection: 'row',
          alignItems:    'center',
          marginBottom:  16,
          gap:           12,
        },
        avatarWrapper: { position: 'relative' },
        verifiedBadge: {
          position:        'absolute',
          bottom:          -4,
          right:           -4,
          backgroundColor: '#FFFFFF',
          borderRadius:    10,
          padding:         1,
        },
        companyInfo:  { flex: 1 },
        companyName:  { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
        industryRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
        industryText: { fontSize: 12, color: withAlpha('#FFFFFF', 0.70) },
        typePill: {
          paddingHorizontal: 10,
          paddingVertical:   5,
          borderRadius:      RADIUS.full,
        },
        typePillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
        title: {
          fontSize:    22,
          fontWeight:  '800',
          color:       '#FFFFFF',
          lineHeight:  30,
          marginBottom: 14,
        },
        metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
        strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 10 },
        stripItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
        stripTextNormal: {
          fontSize:   13,
          fontWeight: '600',
          color:      withAlpha('#FFFFFF', 0.75),
        },
        stripTextSalary: { fontSize: 13, fontWeight: '600', color: c.success },
        stripTextUrgent: { fontSize: 13, fontWeight: '600', color: c.danger },
        appStatus: {
          flexDirection: 'row',
          alignItems:    'center',
          gap:           6,
          paddingHorizontal: 12,
          paddingVertical:   SPACING.sm,
          borderRadius:  RADIUS.sm,
          marginTop:     4,
        },
        appStatusText: { fontSize: 13, fontWeight: '600' },
      }),
    [c, isDark],
  );

  return (
    <LinearGradient
      colors={gradColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      {/* Top nav */}
      <View style={s.topNav}>
        <TouchableOpacity
          onPress={onBack}
          style={s.navBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={s.navRight}>
          {onShare && (
            <TouchableOpacity
              onPress={onShare}
              style={s.navBtn}
              accessibilityRole="button"
              accessibilityLabel="Share"
            >
              <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {onSave && (
            <TouchableOpacity
              onPress={onSave}
              style={s.navBtn}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Unsave job' : 'Save job'}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isSaved ? c.primary : '#FFFFFF'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Banners */}
      {(job.urgent || job.featured) && (
        <View style={s.bannerRow}>
          {job.urgent && (
            <View style={[s.banner, { backgroundColor: c.danger }]}>
              <Text style={s.bannerText}>URGENT</Text>
            </View>
          )}
          {job.featured && (
            <View style={[s.banner, { backgroundColor: c.primary }]}>
              <Text style={[s.bannerText, { color: c.textInverse }]}>
                FEATURED
              </Text>
            </View>
          )}
        </View>
      )}

      {/* FIXED: Company row with Avatar */}
      <View style={s.companyRow}>
        <View style={s.avatarWrapper}>
          <Avatar
            entity={ownerEntity}
            size={64}
            borderRadius={RADIUS.lg}
          />
          {owner?.verified && (
            <View style={s.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={c.success} />
            </View>
          )}
        </View>

        <View style={s.companyInfo}>
          <Text style={s.companyName} numberOfLines={1}>
            {owner?.name ?? ''}
          </Text>
          {owner?.industry ? (
            <View style={s.industryRow}>
              <Ionicons
                name="business-outline"
                size={12}
                color={withAlpha('#FFFFFF', 0.70)}
              />
              <Text style={s.industryText} numberOfLines={1}>
                {owner.industry}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            s.typePill,
            {
              backgroundColor:
                job.jobType === 'organization' ? '#7C3AED' : c.primary,
            },
          ]}
        >
          <Text
            style={[
              s.typePillText,
              {
                color:
                  job.jobType === 'organization' ? '#FFFFFF' : c.textInverse,
              },
            ]}
          >
            {job.jobType === 'organization'
              ? (job.opportunityType ?? 'Opportunity').toUpperCase()
              : 'COMPANY'}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={s.title}>{job.title}</Text>

      {/* Meta badges */}
      <View style={s.metaRow}>
        {(job.location?.city || job.location?.region) && (
          <MetaBadge
            icon="location-outline"
            label={formatLocation(job.location)}
          />
        )}
        {job.type && (
          <MetaBadge icon="briefcase-outline" label={job.type} />
        )}
        {job.remote && job.remote !== 'on-site' && (
          <MetaBadge icon="globe-outline" label={job.remote} />
        )}
        {job.experienceLevel && (
          <MetaBadge icon="trending-up-outline" label={job.experienceLevel} />
        )}
      </View>

      {/* Salary + Deadline strip */}
      <View style={s.strip}>
        {salaryText && (
          <View style={s.stripItem}>
            <Ionicons name="cash-outline" size={16} color={c.success} />
            <Text style={s.stripTextSalary}>{salaryText}</Text>
          </View>
        )}

        <View style={s.stripItem}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={dl.urgent ? c.danger : withAlpha('#FFFFFF', 0.70)}
          />
          <Text
            style={
              dl.urgent ? s.stripTextUrgent : s.stripTextNormal
            }
          >
            {dl.text}
          </Text>
        </View>

        <View style={s.stripItem}>
          <Ionicons
            name="people-outline"
            size={16}
            color={withAlpha('#FFFFFF', 0.70)}
          />
          <Text style={s.stripTextNormal}>
            {job.candidatesNeeded ?? 1}{' '}
            {(job.candidatesNeeded ?? 1) === 1 ? 'position' : 'positions'}
          </Text>
        </View>
      </View>

      {/* Application status */}
      {job.applicationInfo && (
        <View
          style={[
            s.appStatus,
            {
              backgroundColor: job.applicationInfo.canApply
                ? withAlpha(c.success, 0.15)
                : withAlpha(c.danger, 0.15),
            },
          ]}
        >
          <Ionicons
            name={
              job.applicationInfo.canApply
                ? 'checkmark-circle-outline'
                : 'close-circle-outline'
            }
            size={14}
            color={job.applicationInfo.canApply ? c.success : c.danger}
          />
          <Text
            style={[
              s.appStatusText,
              {
                color: job.applicationInfo.canApply ? c.success : c.danger,
              },
            ]}
          >
            {job.applicationInfo.canApply
              ? 'Accepting Applications'
              : 'Applications Closed'}
            {job.applicationInfo.candidatesRemaining !== undefined &&
            job.applicationInfo.canApply
              ? ` · ${job.applicationInfo.candidatesRemaining} spot${
                  job.applicationInfo.candidatesRemaining !== 1 ? 's' : ''
                } left`
              : ''}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};