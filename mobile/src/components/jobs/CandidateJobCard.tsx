/**
 * src/components/jobs/CandidateJobCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Job card for the Candidate browse/saved screens.
 * Shows company/org logo prominently.
 * Uses React Native built-in Animated API (no react-native-reanimated).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { memo, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Job } from '../../services/jobService';
import { formatLocation } from '../../utils/jobHelpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDeadline = (d?: string): string => {
  if (!d) return '';
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Expired';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) return `${diff}d left`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatPostedDate = (d?: string): string => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
};

const getInitials = (name?: string): string =>
  (name ?? 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const getOwnerColor = (jobType?: string): string =>
  jobType === 'organization' ? '#8B5CF6' : '#10B981';

// ─── CompanyLogo ─────────────────────────────────────────────────────────────
interface LogoProps {
  job: Job;
  size?: number;
}

const CompanyLogo: React.FC<LogoProps> = ({ job, size = 52 }) => {
  const owner = job.jobType === 'organization' ? job.organization : job.company;
  const logoUrl = (owner as any)?.logoUrl ?? (owner as any)?.logo;
  const name = owner?.name ?? 'Co';
  const bgColor = getOwnerColor(job.jobType);
  const initials = getInitials(name);

  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={[logo.img, { width: size, height: size, borderRadius: size * 0.25 }]}
        defaultSource={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor.replace('#', '')}&color=fff&size=${size * 2}` }}
      />
    );
  }

  return (
    <View style={[logo.fallback, { width: size, height: size, borderRadius: size * 0.25, backgroundColor: bgColor }]}>
      <Text style={[logo.initials, { fontSize: size * 0.3 }]}>{initials}</Text>
    </View>
  );
};

const logo = StyleSheet.create({
  img:      { resizeMode: 'cover' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700' },
});

// ─── Salary helper ────────────────────────────────────────────────────────────
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

// ─── Props ────────────────────────────────────────────────────────────────────
interface CandidateJobCardProps {
  job: Job;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  compact?: boolean;
}

// ─── Card Component ───────────────────────────────────────────────────────────
export const CandidateJobCard = memo<CandidateJobCardProps>(({
  job, onPress, onSave, isSaved = false, compact = false,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;

  // Built-in RN Animated for press scale effect
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const owner = job.jobType === 'organization' ? job.organization : job.company;
  const isUrgent = job.urgent;
  const isFeatured = job.featured;
  const salary = formatSalary(job);
  const deadline = formatDeadline(job.applicationDeadline);
  const isExpiring = (() => {
    if (!job.applicationDeadline) return false;
    const diff = Math.ceil((new Date(job.applicationDeadline).getTime() - Date.now()) / 86400000);
    return diff >= 0 && diff <= 3;
  })();

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[cs.compact, { backgroundColor: c.card ?? c.surface, borderColor: c.border }]}
        activeOpacity={0.75}
      >
        <CompanyLogo job={job} size={40} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[cs.compactTitle, { color: c.text }]} numberOfLines={1}>{job.title}</Text>
          <Text style={[cs.compactOwner, { color: c.textMuted }]} numberOfLines={1}>{owner?.name ?? ''}</Text>
        </View>
        {isExpiring && <View style={[cs.urgentDot, { backgroundColor: c.error }]} />}
      </TouchableOpacity>
    );
  }

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
          { backgroundColor: c.card ?? c.surface, borderColor: c.border },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Urgent / Featured banners */}
        {(isUrgent || isFeatured) && (
          <View style={cs.bannerRow}>
            {isUrgent && (
              <View style={[cs.banner, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="flash" size={10} color="#DC2626" />
                <Text style={[cs.bannerText, { color: '#DC2626' }]}>URGENT</Text>
              </View>
            )}
            {isFeatured && (
              <View style={[cs.banner, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="star" size={10} color="#D97706" />
                <Text style={[cs.bannerText, { color: '#D97706' }]}>FEATURED</Text>
              </View>
            )}
          </View>
        )}

        {/* Row 1: Logo + Title + Save */}
        <View style={cs.row1}>
          <CompanyLogo job={job} size={52} />
          <View style={[cs.titleBlock, { marginLeft: 12 }]}>
            <Text style={[cs.title, { color: c.text }]} numberOfLines={2}>{job.title}</Text>
            <View style={cs.ownerRow}>
              <Text style={[cs.owner, { color: c.primary }]} numberOfLines={1}>
                {owner?.name ?? ''}
              </Text>
              {(owner as any)?.verified && (
                <Ionicons name="checkmark-circle" size={13} color={c.primary} style={{ marginLeft: 3 }} />
              )}
            </View>
          </View>
          {onSave && (
            <TouchableOpacity onPress={onSave} style={cs.saveBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isSaved ? c.primary : c.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Meta chips */}
        <View style={cs.metaRow}>
          <MetaChip icon="location-outline" label={formatLocation(job.location)} c={c} />
          <MetaChip icon="briefcase-outline" label={job.type ?? ''} c={c} />
          <MetaChip icon="trending-up-outline" label={job.experienceLevel ?? ''} c={c} />
          {job.remote && job.remote !== 'on-site' && (
            <MetaChip icon="globe-outline" label={job.remote} c={c} highlight />
          )}
        </View>

        {/* Salary + Deadline */}
        <View style={cs.row3}>
          {salary && (
            <View style={[cs.salaryBadge, { backgroundColor: `${c.success ?? '#10B981'}15` }]}>
              <Ionicons name="cash-outline" size={12} color={c.success ?? '#10B981'} />
              <Text style={[cs.salaryText, { color: c.success ?? '#10B981' }]}>{salary}</Text>
            </View>
          )}
          {deadline && (
            <View style={[cs.deadlineBadge, { backgroundColor: isExpiring ? `${c.error}15` : `${c.border}50` }]}>
              <Ionicons name="calendar-outline" size={12} color={isExpiring ? c.error : c.textMuted} />
              <Text style={[cs.deadlineText, { color: isExpiring ? c.error : c.textMuted }]}>{deadline}</Text>
            </View>
          )}
          {job.type && (
            <View style={[cs.typePill, { backgroundColor: `${c.primary}15` }]}>
              <Text style={[cs.typePillText, { color: c.primary }]}>{job.type}</Text>
            </View>
          )}
        </View>

        {/* Skills */}
        {(job.skills ?? []).length > 0 && (
          <View style={cs.skillsRow}>
            {(job.skills ?? []).slice(0, 3).map((sk, i) => (
              <View key={i} style={[cs.skillTag, { backgroundColor: c.inputBg ?? `${c.border}60` }]}>
                <Text style={[cs.skillTagText, { color: c.textMuted }]}>{sk}</Text>
              </View>
            ))}
            {(job.skills ?? []).length > 3 && (
              <Text style={[cs.skillMore, { color: c.textMuted }]}>+{(job.skills ?? []).length - 3}</Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={[cs.footer, { borderTopColor: c.border }]}>
          <Text style={[cs.posted, { color: c.textMuted }]}>{formatPostedDate(job.createdAt)}</Text>
          {(job.applicationCount ?? 0) > 0 && (
            <View style={cs.appCount}>
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

// ─── MetaChip ─────────────────────────────────────────────────────────────────
const MetaChip = ({ icon, label, c, highlight = false }: any) => {
  if (!label) return null;
  return (
    <View style={[cs.metaChip, { backgroundColor: highlight ? `${c.primary}15` : `${c.border}50` }]}>
      <Ionicons name={icon} size={11} color={highlight ? c.primary : c.textMuted} />
      <Text style={[cs.metaText, { color: highlight ? c.primary : c.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  card:          { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  compact:       { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8 },
  compactTitle:  { fontSize: 14, fontWeight: '600' },
  compactOwner:  { fontSize: 12, marginTop: 2 },
  urgentDot:     { width: 8, height: 8, borderRadius: 4 },
  bannerRow:     { flexDirection: 'row', gap: 6, marginBottom: 10 },
  banner:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 3 },
  bannerText:    { fontSize: 10, fontWeight: '700' },
  row1:          { flexDirection: 'row', alignItems: 'flex-start' },
  titleBlock:    { flex: 1 },
  title:         { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  ownerRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  owner:         { fontSize: 13, fontWeight: '600' },
  saveBtn:       { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  metaChip:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, gap: 3 },
  metaText:      { fontSize: 11, fontWeight: '500' },
  row3:          { flexDirection: 'row', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 6 },
  salaryBadge:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, gap: 4 },
  salaryText:    { fontSize: 12, fontWeight: '600' },
  deadlineBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, gap: 4 },
  deadlineText:  { fontSize: 12, fontWeight: '600' },
  typePill:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  typePillText:  { fontSize: 11, fontWeight: '700' },
  skillsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  skillTag:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  skillTagText:  { fontSize: 11 },
  skillMore:     { fontSize: 11, alignSelf: 'center' },
  footer:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  posted:        { fontSize: 11 },
  appCount:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  appCountText:  { fontSize: 11 },
});