/**
 * src/components/jobs/CandidateJobCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Candidate job card — redesigned with:
 * - Universal Avatar component (no more broken logos)
 * - Modern LinkedIn/Uber-inspired design
 * - Soft shadows, rounded corners, proper hierarchy
 * - Animated press feedback
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { memo, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Job } from '../../services/jobService';
import { Avatar, jobOwnerToEntity } from '../shared/Avatar';
import { formatLocation } from '../../utils/jobHelpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDeadline = (d?: string): { label: string; urgent: boolean } => {
  if (!d) return { label: '', urgent: false };
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return { label: 'Expired', urgent: true };
  if (diff === 0) return { label: 'Today!', urgent: true };
  if (diff === 1) return { label: '1d left', urgent: true };
  if (diff <= 3)  return { label: `${diff}d left`, urgent: true };
  if (diff <= 7)  return { label: `${diff}d left`, urgent: false };
  return {
    label: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    urgent: false,
  };
};

const formatPostedDate = (d?: string): string => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7)   return `${diff}d ago`;
  if (diff < 30)  return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
};

const formatSalary = (job: Job): string | null => {
  if (job.salaryDisplay) return job.salaryDisplay;
  if (job.salaryMode === 'hidden') return null;
  if (job.salaryMode === 'negotiable') return 'Negotiable';
  if (job.salaryMode === 'company-scale') return 'Company scale';
  if (job.salary?.min && job.salary?.max) {
    const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
    return `${job.salary.currency ?? 'ETB'} ${fmt(job.salary.min)}–${fmt(job.salary.max)}`;
  }
  return null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const MetaTag = ({ icon, label, highlight, c }: {
  icon: string; label: string; highlight?: boolean; c: any;
}) => {
  if (!label) return null;
  return (
    <View style={[
      cs.metaTag,
      {
        backgroundColor: highlight ? `${c.primary}18` : (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
        borderColor: highlight ? `${c.primary}40` : 'transparent',
      },
    ]}>
      <Ionicons name={icon as any} size={10} color={highlight ? c.primary : c.textMuted} />
      <Text style={[cs.metaTagText, { color: highlight ? c.primary : c.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CandidateJobCardProps {
  job: Job;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  compact?: boolean;
}

// ─── Main Card ────────────────────────────────────────────────────────────────

export const CandidateJobCard = memo<CandidateJobCardProps>(({
  job, onPress, onSave, isSaved = false, compact = false,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const isDark = theme.isDark;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 3 }).start();
  }, [scaleAnim]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 3 }).start();
  }, [scaleAnim]);

  const ownerEntity = jobOwnerToEntity(job);
  const owner = job.jobType === 'organization' ? job.organization : job.company;
  const salary = formatSalary(job);
  const deadline = formatDeadline(job.applicationDeadline);

  // ── Compact variant ──────────────────────────────────────────────────────
  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.78}
        style={[
          cs.compactCard,
          {
            backgroundColor: isDark ? c.card : '#fff',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <Avatar entity={ownerEntity} size={40} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[cs.compactTitle, { color: c.text }]} numberOfLines={1}>{job.title}</Text>
          <Text style={[cs.compactOwner, { color: c.textSecondary }]} numberOfLines={1}>{owner?.name ?? ''}</Text>
        </View>
        {deadline.urgent && <View style={[cs.urgentDot, { backgroundColor: '#EF4444' }]} />}
      </TouchableOpacity>
    );
  }

  // ── Full card ──────────────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          cs.card,
          {
            backgroundColor: isDark ? c.card : '#fff',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            shadowColor: isDark ? '#000' : '#0A2540',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isDark ? 0.35 : 0.08,
            shadowRadius: 12,
            elevation: 4,
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Urgent / Featured banners */}
        {(job.urgent || job.featured) && (
          <View style={cs.bannerRow}>
            {job.urgent && (
              <View style={cs.bannerUrgent}>
                <Text style={cs.bannerTextUrgent}>⚡ URGENT</Text>
              </View>
            )}
            {job.featured && (
              <View style={cs.bannerFeatured}>
                <Text style={cs.bannerTextFeatured}>★ FEATURED</Text>
              </View>
            )}
          </View>
        )}

        {/* Header: Avatar + Title + Save */}
        <View style={cs.header}>
          <Avatar
            entity={ownerEntity}
            size={52}
            borderRadius={14}
          />

          <View style={[cs.titleBlock, { marginLeft: 12 }]}>
            <Text style={[cs.jobTitle, { color: c.text }]} numberOfLines={2}>
              {job.title}
            </Text>
            <View style={cs.ownerRow}>
              <Text style={[cs.ownerName, { color: c.primary ?? '#1A73E8' }]} numberOfLines={1}>
                {owner?.name ?? ''}
              </Text>
              {owner?.verified && (
                <Ionicons name="checkmark-circle" size={13} color={c.primary ?? '#1A73E8'} style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>

          {onSave && (
            <TouchableOpacity
              onPress={onSave}
              style={cs.saveBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isSaved ? (c.primary ?? '#1A73E8') : c.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Meta tags row */}
        <View style={cs.metaRow}>
          <MetaTag icon="location-outline" label={formatLocation(job.location)} c={c} />
          <MetaTag icon="briefcase-outline" label={job.type ?? ''} c={c} />
          <MetaTag icon="trending-up-outline" label={job.experienceLevel ?? ''} c={c} />
          {job.remote && job.remote !== 'on-site' && (
            <MetaTag icon="globe-outline" label={job.remote} c={c} highlight />
          )}
        </View>

        {/* Salary + Deadline + Type */}
        <View style={cs.bottomRow}>
          {salary && (
            <View style={[cs.salaryBadge, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Text style={[cs.salaryText, { color: '#059669' }]}>{salary}</Text>
            </View>
          )}

          {deadline.label && (
            <View style={[
              cs.deadlineBadge,
              {
                backgroundColor: deadline.urgent ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.04)',
              },
            ]}>
              <Ionicons
                name="time-outline"
                size={11}
                color={deadline.urgent ? '#EF4444' : c.textMuted}
              />
              <Text style={[
                cs.deadlineText,
                { color: deadline.urgent ? '#EF4444' : c.textMuted },
              ]}>
                {deadline.label}
              </Text>
            </View>
          )}
        </View>

        {/* Skills */}
        {(job.skills ?? []).length > 0 && (
          <View style={cs.skillsRow}>
            {job.skills!.slice(0, 3).map((sk, i) => (
              <View
                key={i}
                style={[
                  cs.skillTag,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  },
                ]}
              >
                <Text style={[cs.skillTagText, { color: c.textSecondary }]}>{sk}</Text>
              </View>
            ))}
            {job.skills!.length > 3 && (
              <Text style={[cs.skillMore, { color: c.textMuted }]}>
                +{job.skills!.length - 3}
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={[cs.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[cs.postedText, { color: c.textMuted }]}>
            {formatPostedDate(job.createdAt)}
          </Text>
          {(job.applicationCount ?? 0) > 0 && (
            <View style={cs.appCountRow}>
              <Ionicons name="people-outline" size={12} color={c.textMuted} />
              <Text style={[cs.appCountText, { color: c.textMuted }]}>
                {job.applicationCount} applicant{job.applicationCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

CandidateJobCard.displayName = 'CandidateJobCard';

// ─── Styles ───────────────────────────────────────────────────────────────────

const cs = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  compactTitle:  { fontSize: 14, fontWeight: '600' },
  compactOwner:  { fontSize: 12, marginTop: 2 },
  urgentDot:     { width: 8, height: 8, borderRadius: 4 },

  bannerRow:     { flexDirection: 'row', gap: 6, marginBottom: 12 },
  bannerUrgent:  {
    backgroundColor: 'rgba(220,38,38,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bannerFeatured: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bannerTextUrgent:   { fontSize: 10, fontWeight: '700', color: '#DC2626' },
  bannerTextFeatured: { fontSize: 10, fontWeight: '700', color: '#D97706' },

  header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  titleBlock: { flex: 1 },
  jobTitle:   { fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 4 },
  ownerRow:   { flexDirection: 'row', alignItems: 'center' },
  ownerName:  { fontSize: 13, fontWeight: '600' },
  saveBtn:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  metaRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 3,
  },
  metaTagText: { fontSize: 11, fontWeight: '500' },

  bottomRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  salaryBadge:  {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  salaryText:   { fontSize: 12, fontWeight: '700' },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deadlineText: { fontSize: 11, fontWeight: '600' },

  skillsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillTag:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  skillTagText: { fontSize: 11, fontWeight: '500' },
  skillMore:    { fontSize: 11, alignSelf: 'center' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  postedText:  { fontSize: 11 },
  appCountRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  appCountText: { fontSize: 11 },
});