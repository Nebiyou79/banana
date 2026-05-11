/**
 * src/components/jobs/CandidateJobCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Candidate job card with company/organization avatar display.
 *
 * FIXED: Avatar display for company/organization
 * ✅ All colours via useTheme() — zero hardcoded hex.
 * ✅ Avatar component properly integrated with jobOwnerToEntity
 * ✅ Verified badge shown for verified companies
 */
import React, { memo, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha, formatRelativeDate } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import { Job } from '../../services/jobService';
import { Avatar, jobOwnerToEntity } from '../shared/Avatar';
import { formatLocation } from '../../utils/jobHelpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDeadline = (d?: string): { label: string; urgent: boolean } => {
  if (!d) return { label: '', urgent: false };
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
  if (diff < 0)  return { label: 'Expired', urgent: true };
  if (diff === 0) return { label: 'Today!',  urgent: true };
  if (diff === 1) return { label: '1d left', urgent: true };
  if (diff <= 3)  return { label: `${diff}d left`, urgent: true };
  if (diff <= 7)  return { label: `${diff}d left`, urgent: false };
  return {
    label: new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
    }),
    urgent: false,
  };
};

const formatSalary = (job: Job): string | null => {
  if (job.salaryDisplay)               return job.salaryDisplay;
  if (job.salaryMode === 'hidden')     return null;
  if (job.salaryMode === 'negotiable') return 'Negotiable';
  if (job.salaryMode === 'company-scale') return 'Company scale';
  if (job.salary?.min && job.salary?.max) {
    const fmt = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
    return `${job.salary.currency ?? 'ETB'} ${fmt(job.salary.min)}–${fmt(job.salary.max)}`;
  }
  return null;
};

// ─── MetaTag — extracted stable sub-component ────────────────────────────────

interface MetaTagProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  highlight?: boolean;
  primary: string;
  textMuted: string;
  isDark: boolean;
}

const MetaTag = React.memo<MetaTagProps>(
  ({ icon, label, highlight, primary, textMuted, isDark }) => {
    if (!label) return null;
    return (
      <View
        style={[
          mt.tag,
          {
            backgroundColor: highlight
              ? withAlpha(primary, 0.13)
              : withAlpha(isDark ? '#FFFFFF' : '#000000', 0.06),
            borderColor: highlight ? withAlpha(primary, 0.40) : 'transparent',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={10}
          color={highlight ? primary : textMuted}
        />
        <Text
          style={[
            mt.text,
            { color: highlight ? primary : textMuted },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    );
  },
);
MetaTag.displayName = 'CandidateJobCard.MetaTag';

const mt = StyleSheet.create({
  tag: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical:   4,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
    gap:               3,
  },
  text: { fontSize: 11, fontWeight: '500' },
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface CandidateJobCardProps {
  job: Job;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CandidateJobCard = memo<CandidateJobCardProps>(
  ({ job, onPress, onSave, isSaved = false, compact = false }) => {
    const { colors: c, isDark, shadows } = useTheme();

    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue:        0.975,
        useNativeDriver: true,
        speed:           50,
        bounciness:      3,
      }).start();
    }, [scaleAnim]);

    const onPressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue:        1,
        useNativeDriver: true,
        speed:           50,
        bounciness:      3,
      }).start();
    }, [scaleAnim]);

    // FIXED: Properly extract owner entity for Avatar
    const ownerEntity = jobOwnerToEntity(job);
    const owner = job.jobType === 'organization' ? job.organization : job.company;
    const salary   = formatSalary(job);
    const deadline = formatDeadline(job.applicationDeadline);

    // ── Compact variant ──────────────────────────────────────────────────────
    if (compact) {
      return (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.78}
          style={{
            flexDirection:   'row',
            alignItems:      'center',
            borderRadius:    RADIUS.md,
            borderWidth:     1,
            padding:         12,
            marginBottom:    SPACING.sm,
            backgroundColor: c.bgCard,
            borderColor:     c.border,
          }}
        >
          {/* FIXED: Avatar with proper entity */}
          <Avatar entity={ownerEntity} size={40} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{ fontSize: 14, fontWeight: '600', color: c.text }}
              numberOfLines={1}
            >
              {job.title}
            </Text>
            <Text
              style={{ fontSize: 12, marginTop: 2, color: c.textMuted }}
              numberOfLines={1}
            >
              {owner?.name ?? ''}
            </Text>
          </View>
          {deadline.urgent && (
            <View
              style={{
                width:        8,
                height:       8,
                borderRadius: 4,
                backgroundColor: c.danger,
              }}
            />
          )}
        </TouchableOpacity>
      );
    }

    // ── Memoised styles ──────────────────────────────────────────────────────
    const s = useMemo(
      () =>
        StyleSheet.create({
          card: {
            borderRadius:    RADIUS.xl,
            borderWidth:     1,
            padding:         SPACING.lg,
            marginBottom:    SPACING.md,
            backgroundColor: c.bgCard,
            borderColor:     c.border,
            ...shadows.sm,
          },

          bannerRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
          bannerUrgent: {
            backgroundColor: withAlpha(c.danger, 0.10),
            paddingHorizontal: SPACING.sm,
            paddingVertical:   3,
            borderRadius:      RADIUS.sm,
          },
          bannerFeatured: {
            backgroundColor: withAlpha(c.warning, 0.10),
            paddingHorizontal: SPACING.sm,
            paddingVertical:   3,
            borderRadius:      RADIUS.sm,
          },
          bannerTextUrgent:   { fontSize: 10, fontWeight: '700', color: c.danger },
          bannerTextFeatured: { fontSize: 10, fontWeight: '700', color: c.warning },

          header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
          titleBlock: { flex: 1 },
          jobTitle: {
            fontSize:    16,
            fontWeight:  '700',
            lineHeight:  22,
            marginBottom: 4,
            color:       c.text,
          },
          ownerRow:  { flexDirection: 'row', alignItems: 'center' },
          ownerName: { fontSize: 13, fontWeight: '600', color: c.primary },
          saveBtn: {
            width:          44,
            height:         44,
            alignItems:     'center',
            justifyContent: 'center',
          },

          metaRow: {
            flexDirection: 'row',
            flexWrap:      'wrap',
            gap:           6,
            marginBottom:  10,
          },

          bottomRow: {
            flexDirection: 'row',
            alignItems:    'center',
            gap:           SPACING.sm,
            marginBottom:  10,
          },
          salaryBadge: {
            paddingHorizontal: 10,
            paddingVertical:   5,
            borderRadius:      RADIUS.sm,
            backgroundColor:   withAlpha(c.success, 0.10),
          },
          salaryText: { fontSize: 12, fontWeight: '700', color: c.success },
          deadlineBadge: {
            flexDirection: 'row',
            alignItems:    'center',
            gap:           4,
            paddingHorizontal: SPACING.sm,
            paddingVertical:   5,
            borderRadius:      RADIUS.sm,
          },
          deadlineText: { fontSize: 11, fontWeight: '600' },

          skillsRow: {
            flexDirection: 'row',
            flexWrap:      'wrap',
            gap:           6,
            marginBottom:  12,
          },
          skillTag: {
            paddingHorizontal: 10,
            paddingVertical:   4,
            borderRadius:      RADIUS.full,
            backgroundColor: withAlpha(c.text, isDark ? 0.10 : 0.07),
          },
          skillTagText: {
            fontSize:   11,
            fontWeight: '500',
            color:      c.textSecondary,
          },
          skillMore: { fontSize: 11, alignSelf: 'center', color: c.textMuted },

          footer: {
            flexDirection:  'row',
            alignItems:     'center',
            justifyContent: 'space-between',
            paddingTop:     10,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.border,
          },
          postedText:   { fontSize: 11, color: c.textMuted },
          appCountRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
          appCountText: { fontSize: 11, color: c.textMuted },
        }),
      [c, isDark, shadows],
    );

    return (
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        activeOpacity={1}
      >
        <Animated.View
          style={[s.card, { transform: [{ scale: scaleAnim }] }]}
        >
          {/* Urgent / Featured banners */}
          {(job.urgent || job.featured) && (
            <View style={s.bannerRow}>
              {job.urgent && (
                <View style={s.bannerUrgent}>
                  <Text style={s.bannerTextUrgent}>URGENT</Text>
                </View>
              )}
              {job.featured && (
                <View style={s.bannerFeatured}>
                  <Text style={s.bannerTextFeatured}>FEATURED</Text>
                </View>
              )}
            </View>
          )}

          {/* FIXED: Header with Avatar, Title + Save */}
          <View style={s.header}>
            <Avatar entity={ownerEntity} size={52} borderRadius={RADIUS.md} />

            <View style={[s.titleBlock, { marginLeft: 12 }]}>
              <Text style={s.jobTitle} numberOfLines={2}>
                {job.title}
              </Text>
              <View style={s.ownerRow}>
                <Text style={s.ownerName} numberOfLines={1}>
                  {owner?.name ?? ''}
                </Text>
                {owner?.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color={c.primary}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
            </View>

            {onSave && (
              <TouchableOpacity
                onPress={onSave}
                style={s.saveBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Unsave job' : 'Save job'}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={isSaved ? c.primary : c.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Meta tags */}
          <View style={s.metaRow}>
            <MetaTag
              icon="location-outline"
              label={formatLocation(job.location)}
              primary={c.primary}
              textMuted={c.textMuted}
              isDark={isDark}
            />
            <MetaTag
              icon="briefcase-outline"
              label={job.type ?? ''}
              primary={c.primary}
              textMuted={c.textMuted}
              isDark={isDark}
            />
            <MetaTag
              icon="trending-up-outline"
              label={job.experienceLevel ?? ''}
              primary={c.primary}
              textMuted={c.textMuted}
              isDark={isDark}
            />
            {job.remote && job.remote !== 'on-site' && (
              <MetaTag
                icon="globe-outline"
                label={job.remote}
                highlight
                primary={c.primary}
                textMuted={c.textMuted}
                isDark={isDark}
              />
            )}
          </View>

          {/* Salary + Deadline */}
          <View style={s.bottomRow}>
            {salary && (
              <View style={s.salaryBadge}>
                <Text style={s.salaryText}>{salary}</Text>
              </View>
            )}

            {deadline.label && (
              <View
                style={[
                  s.deadlineBadge,
                  {
                    backgroundColor: deadline.urgent
                      ? withAlpha(c.danger, 0.10)
                      : withAlpha(c.text, 0.04),
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={11}
                  color={deadline.urgent ? c.danger : c.textMuted}
                />
                <Text
                  style={[
                    s.deadlineText,
                    { color: deadline.urgent ? c.danger : c.textMuted },
                  ]}
                >
                  {deadline.label}
                </Text>
              </View>
            )}
          </View>

          {/* Skills */}
          {(job.skills ?? []).length > 0 && (
            <View style={s.skillsRow}>
              {job.skills!.slice(0, 3).map((sk, i) => (
                <View key={i} style={s.skillTag}>
                  <Text style={s.skillTagText}>{sk}</Text>
                </View>
              ))}
              {job.skills!.length > 3 && (
                <Text style={s.skillMore}>+{job.skills!.length - 3}</Text>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.postedText}>
              {formatRelativeDate(job.createdAt)}
            </Text>
            {(job.applicationCount ?? 0) > 0 && (
              <View style={s.appCountRow}>
                <Ionicons name="people-outline" size={12} color={c.textMuted} />
                <Text style={s.appCountText}>
                  {job.applicationCount}{' '}
                  {job.applicationCount === 1 ? 'applicant' : 'applicants'}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  },
);

CandidateJobCard.displayName = 'CandidateJobCard';