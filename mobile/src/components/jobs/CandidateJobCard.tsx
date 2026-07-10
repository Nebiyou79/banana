/**
 * src/components/jobs/CandidateJobCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * CHANGES IN THIS VERSION:
 *
 * APPLY BUTTON STRIP — Three mutually-exclusive states shown at the bottom
 *   of each card, derived purely from job data (no extra API call needed):
 *
 *   1. "Apply"            — canApply=true, hasApplied=false
 *                           → filled primary pill, navigates to Apply screen
 *   2. "Applied"          — hasApplied=true (regardless of deadline)
 *                           → filled success pill, non-interactive (visual only)
 *   3. "Applications Closed" — canApply=false, hasApplied=false
 *                           → outlined danger pill, non-interactive
 *
 *  `canApply` logic:
 *    - job.isApplyEnabled === true
 *    - applicationDeadline is absent OR still in the future
 *    - job.status === 'active'
 *
 *  `hasApplied` is driven by the optional `isApplied` prop passed by the
 *  parent screen (which knows the candidate's application set).
 *
 * AVATAR FIX — CompanyAvatar (unchanged from previous version).
 * All other logic and styling preserved exactly.
 * ─────────────────────────────────────────────────────────────────────────────
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
import CompanyAvatar from '../shared/CompanyAvatar';
import { formatLocation } from '../../utils/jobHelpers';

// ─── Debug flag ──────────────────────────────────────────────────────────────
const DEBUG_AVATAR = __DEV__ && false;

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
    label: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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

/**
 * Derive whether a candidate can still apply to this job.
 * Mirrors the same logic used in JobDetailScreen.handleApply().
 */
const deriveCanApply = (job: Job): boolean => {
  if (!job.isApplyEnabled)        return false;
  if (job.status !== 'active')    return false;
  if (job.applicationDeadline) {
    const deadlinePast = new Date(job.applicationDeadline) < new Date();
    if (deadlinePast)             return false;
  }
  // Also respect applicationInfo if the backend sent it
  if (job.applicationInfo !== undefined) {
    return !!job.applicationInfo.canApply;
  }
  return true;
};

// ─── Apply Button Strip ───────────────────────────────────────────────────────

type ApplyState = 'can-apply' | 'applied' | 'closed';

interface ApplyStripProps {
  state: ApplyState;
  onApply: () => void;
  primary: string;
  success: string;
  danger: string;
  isDark: boolean;
}

const ApplyStrip = React.memo<ApplyStripProps>(
  ({ state, onApply, primary, success, danger, isDark }) => {
    if (state === 'applied') {
      return (
        <View style={[ap.pill, { backgroundColor: withAlpha(success, 0.14), borderColor: withAlpha(success, 0.35) }]}>
          <Ionicons name="checkmark-circle" size={15} color={success} />
          <Text style={[ap.label, { color: success }]}>Applied</Text>
        </View>
      );
    }

    if (state === 'closed') {
      return (
        <View style={[ap.pill, { backgroundColor: withAlpha(danger, 0.08), borderColor: withAlpha(danger, 0.30) }]}>
          <Ionicons name="close-circle-outline" size={15} color={danger} />
          <Text style={[ap.label, { color: danger }]}>Applications Closed</Text>
        </View>
      );
    }

    // can-apply
    return (
      <TouchableOpacity
        onPress={onApply}
        activeOpacity={0.82}
        style={[ap.pill, ap.pillFilled, { backgroundColor: primary }]}
        accessibilityRole="button"
        accessibilityLabel="Apply for this job"
      >
        <Ionicons name="send-outline" size={14} color="#FFFFFF" />
        <Text style={[ap.label, ap.labelFilled]}>Apply</Text>
      </TouchableOpacity>
    );
  },
);
ApplyStrip.displayName = 'CandidateJobCard.ApplyStrip';

const ap = StyleSheet.create({
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    alignSelf:         'flex-start',
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
    gap:               6,
  },
  pillFilled: {
    borderColor: 'transparent',
  },
  label: {
    fontSize:   13,
    fontWeight: '700',
  },
  labelFilled: {
    color: '#FFFFFF',
  },
});

// ─── MetaTag ──────────────────────────────────────────────────────────────────

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
        <Ionicons name={icon} size={10} color={highlight ? primary : textMuted} />
        <Text style={[mt.text, { color: highlight ? primary : textMuted }]} numberOfLines={1}>
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
  onApply?: () => void;       // navigates to Apply screen — only called when state='can-apply'
  onSave?: () => void;
  isSaved?: boolean;
  isApplied?: boolean;        // true when the candidate has already applied
  compact?: boolean;
  showAvatarDebug?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CandidateJobCard = memo<CandidateJobCardProps>(
  ({
    job,
    onPress,
    onApply,
    onSave,
    isSaved    = false,
    isApplied  = false,
    compact    = false,
    showAvatarDebug = DEBUG_AVATAR,
  }) => {
    const { colors: c, isDark, shadows } = useTheme();

    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 3,
      }).start();
    }, [scaleAnim]);

    const onPressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 1, useNativeDriver: true, speed: 50, bounciness: 3,
      }).start();
    }, [scaleAnim]);

    // Derive apply state
    const applyState = useMemo<ApplyState>(() => {
      if (isApplied)          return 'applied';
      if (deriveCanApply(job)) return 'can-apply';
      return 'closed';
    }, [isApplied, job]);

    const handleApply = useCallback(() => {
      if (applyState === 'can-apply' && onApply) onApply();
    }, [applyState, onApply]);

    // Owner display text
    const owner         = job.jobType === 'organization' ? job.organization : job.company;
    const ownerName     = job.ownerPreview?.name ?? owner?.name ?? '';
    const ownerVerified = job.ownerPreview?.verified ?? owner?.verified ?? false;
    const salary        = formatSalary(job);
    const deadline      = formatDeadline(job.applicationDeadline);

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
          <CompanyAvatar job={job} size={40} showDebug={showAvatarDebug} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }} numberOfLines={1}>
              {job.title}
            </Text>
            <Text style={{ fontSize: 12, marginTop: 2, color: c.textMuted }} numberOfLines={1}>
              {ownerName}
            </Text>
          </View>
          {deadline.urgent && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.danger }} />
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
          bannerRow:          { flexDirection: 'row', gap: 6, marginBottom: 12 },
          bannerUrgent:       { backgroundColor: withAlpha(c.danger, 0.10), paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.sm },
          bannerFeatured:     { backgroundColor: withAlpha(c.warning, 0.10), paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.sm },
          bannerTextUrgent:   { fontSize: 10, fontWeight: '700', color: c.danger },
          bannerTextFeatured: { fontSize: 10, fontWeight: '700', color: c.warning },
          header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
          titleBlock: { flex: 1 },
          jobTitle:   { fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 4, color: c.text },
          ownerRow:   { flexDirection: 'row', alignItems: 'center' },
          ownerName:  { fontSize: 13, fontWeight: '600', color: c.primary },
          saveBtn:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
          metaRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
          bottomRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 10 },
          salaryBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.sm, backgroundColor: withAlpha(c.success, 0.10) },
          salaryText:    { fontSize: 12, fontWeight: '700', color: c.success },
          deadlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.sm },
          deadlineText:  { fontSize: 11, fontWeight: '600' },
          skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
          skillTag:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: withAlpha(c.text, isDark ? 0.10 : 0.07) },
          skillTagText: { fontSize: 11, fontWeight: '500', color: c.textSecondary },
          skillMore:    { fontSize: 11, alignSelf: 'center', color: c.textMuted },
          divider:      { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginBottom: 12 },
          footer:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
          postedText:   { fontSize: 11, color: c.textMuted },
          appCountRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
          appCountText: { fontSize: 11, color: c.textMuted },
          // Apply strip row: left-aligns the pill, keeps footer metadata on the right
          applyRow: {
            flexDirection:  'row',
            alignItems:     'center',
            justifyContent: 'space-between',
            paddingTop:     10,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.border,
          },
        }),
      [c, isDark, shadows],
    );

    return (
      <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} activeOpacity={1}>
        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* Urgent / Featured banners */}
          {(job.urgent || job.featured) && (
            <View style={s.bannerRow}>
              {job.urgent   && <View style={s.bannerUrgent}>  <Text style={s.bannerTextUrgent}>URGENT</Text>  </View>}
              {job.featured && <View style={s.bannerFeatured}><Text style={s.bannerTextFeatured}>FEATURED</Text></View>}
            </View>
          )}

          {/* Header */}
          <View style={s.header}>
            <CompanyAvatar job={job} size={52} borderRadius={RADIUS.md} showDebug={showAvatarDebug} />

            <View style={[s.titleBlock, { marginLeft: 12 }]}>
              <Text style={s.jobTitle} numberOfLines={2}>{job.title}</Text>
              <View style={s.ownerRow}>
                <Text style={s.ownerName} numberOfLines={1}>{ownerName}</Text>
                {ownerVerified && (
                  <Ionicons name="checkmark-circle" size={13} color={c.primary} style={{ marginLeft: 4 }} />
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
            <MetaTag icon="location-outline"    label={formatLocation(job.location)} primary={c.primary} textMuted={c.textMuted} isDark={isDark} />
            <MetaTag icon="briefcase-outline"   label={job.type ?? ''}              primary={c.primary} textMuted={c.textMuted} isDark={isDark} />
            <MetaTag icon="trending-up-outline" label={job.experienceLevel ?? ''}   primary={c.primary} textMuted={c.textMuted} isDark={isDark} />
            {job.remote && job.remote !== 'on-site' && (
              <MetaTag icon="globe-outline" label={job.remote} highlight primary={c.primary} textMuted={c.textMuted} isDark={isDark} />
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
              <View style={[s.deadlineBadge, { backgroundColor: deadline.urgent ? withAlpha(c.danger, 0.10) : withAlpha(c.text, 0.04) }]}>
                <Ionicons name="time-outline" size={11} color={deadline.urgent ? c.danger : c.textMuted} />
                <Text style={[s.deadlineText, { color: deadline.urgent ? c.danger : c.textMuted }]}>
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

          {/* ── Apply strip + footer meta ──────────────────────────────────── */}
          <View style={s.applyRow}>
            {/* LEFT: apply pill */}
            <ApplyStrip
              state={applyState}
              onApply={handleApply}
              primary={c.primary}
              success={c.success}
              danger={c.danger}
              isDark={isDark}
            />

            {/* RIGHT: posted date + applicant count */}
            <View style={{ alignItems: 'flex-end', gap: 3 }}>
              <Text style={s.postedText}>{formatRelativeDate(job.createdAt)}</Text>
              {(job.applicationCount ?? 0) > 0 && (
                <View style={s.appCountRow}>
                  <Ionicons name="people-outline" size={12} color={c.textMuted} />
                  <Text style={s.appCountText}>
                    {job.applicationCount} {job.applicationCount === 1 ? 'applicant' : 'applicants'}
                  </Text>
                </View>
              )}
            </View>
          </View>

        </Animated.View>
      </TouchableOpacity>
    );
  },
);

CandidateJobCard.displayName = 'CandidateJobCard';