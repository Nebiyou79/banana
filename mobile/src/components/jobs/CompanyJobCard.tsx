/**
 * mobile/src/components/jobs/CompanyJobCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXES:
 *  1. onPress now correctly navigates to CompanyJobDetailScreen (was broken
 *     with a duplicate TouchableOpacity wrapping and a thrown Error stub).
 *  2. Company/Org logo displayed using real Image component.
 *  3. Refreshed card design: cleaner layout, better visual hierarchy,
 *     micro-interaction on press via Animated scale.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useRef, useCallback, memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Alert, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Job } from '../../services/jobService';
import { getJobStatusColor, formatDeadline, formatPostedDate, formatLocation } from '../../utils/jobHelpers';

// ─── Company Logo ─────────────────────────────────────────────────────────────

const getInitials = (name?: string): string =>
  (name ?? 'CO').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const OwnerLogo: React.FC<{ job: Job; size?: number }> = ({ job, size = 46 }) => {
  const owner = job.jobType === 'organization' ? job.organization : job.company;
  const logoUrl = (owner as any)?.logoUrl ?? (owner as any)?.logo;
  const name = owner?.name ?? 'CO';
  const initials = getInitials(name);
  const bgColor = job.jobType === 'organization' ? '#7C3AED' : '#F1BB03';
  const radius = size * 0.22;

  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={{ width: size, height: size, borderRadius: radius, borderWidth: 1.5, borderColor: `${bgColor}40` }}
      />
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.3, fontWeight: '800' }}>{initials}</Text>
    </View>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  job: Job;
  onEdit: () => void;
  onDelete: () => void;
  onViewApplicants: () => void;
  onPress?: () => void;
  onToggleStatus?: (newStatus: 'active' | 'paused' | 'closed') => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CompanyJobCard = memo<Props>(({
  job, onEdit, onDelete, onViewApplicants, onPress, onToggleStatus,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const sc = getJobStatusColor(job.status, theme.isDark);

  // Press scale animation
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  }, [scaleAnim]);
  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  }, [scaleAnim]);

  const shadow = Platform.OS === 'ios'
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10 }
    : { elevation: 3 };

  const appCount = job.applicationCount ?? 0;
  const deadline = formatDeadline(job.applicationDeadline);

  const confirmDelete = () =>
    Alert.alert('Delete Job', `Delete "${job.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);

  const isUrgent   = job.urgent;
  const isFeatured = job.featured;

  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      activeOpacity={1}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          s.card,
          { backgroundColor: c.card ?? c.surface, borderColor: c.border },
          shadow,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Left accent bar — status color */}
        <View style={[s.accentBar, { backgroundColor: sc.border }]} />

        <View style={s.inner}>
          {/* ── Banners ── */}
          {(isUrgent || isFeatured) && (
            <View style={s.bannerRow}>
              {isUrgent && (
                <View style={[s.banner, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="flash" size={10} color="#DC2626" />
                  <Text style={[s.bannerText, { color: '#DC2626' }]}>URGENT</Text>
                </View>
              )}
              {isFeatured && (
                <View style={[s.banner, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="star" size={10} color="#D97706" />
                  <Text style={[s.bannerText, { color: '#D97706' }]}>FEATURED</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Header: Logo + Title + Status ── */}
          <View style={s.header}>
            <OwnerLogo job={job} size={46} />

            <View style={s.titleBlock}>
              <Text style={[s.title, { color: c.text }]} numberOfLines={2}>
                {job.title}
              </Text>
              <Text style={[s.category, { color: c.textMuted }]}>
                {(job.category ?? '').replace(/-/g, ' ')}
              </Text>
            </View>

            <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
              <View style={[s.dot, { backgroundColor: sc.text }]} />
              <Text style={[s.statusText, { color: sc.text }]}>
                {(job.status ?? 'draft').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* ── Stats strip ── */}
          <View style={[s.statsRow, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: c.border }]}>
            <StatCell icon="people-outline"  value={appCount}             label="Applied"   color="#3B82F6" c={c} />
            <View style={[s.statDiv, { backgroundColor: c.border }]} />
            <StatCell icon="eye-outline"     value={job.viewCount ?? 0}   label="Views"     color="#F59E0B" c={c} />
            <View style={[s.statDiv, { backgroundColor: c.border }]} />
            <StatCell icon="person-outline"  value={job.candidatesNeeded ?? 1} label="Needed" color="#10B981" c={c} />
            <View style={[s.statDiv, { backgroundColor: c.border }]} />
            <StatCell icon="bookmark-outline" value={job.saveCount ?? 0}  label="Saves"     color="#8B5CF6" c={c} />
          </View>

          {/* ── Meta row ── */}
          <View style={s.meta}>
            <MetaItem icon="location-outline" label={formatLocation(job.location)} c={c} />
            <MetaItem icon="time-outline"     label={deadline}                     c={c} />
            <MetaItem icon="calendar-outline" label={formatPostedDate(job.createdAt)} c={c} />
            {job.type && (
              <View style={[s.typePill, { backgroundColor: `${c.primary ?? '#F1BB03'}18` }]}>
                <Text style={[s.typePillText, { color: c.primary }]}>{job.type}</Text>
              </View>
            )}
          </View>

          {/* ── Actions ── */}
          <View style={[s.actions, { borderTopColor: c.border }]}>
            {/* Applicants CTA */}
            <TouchableOpacity
              style={[s.actionPrimary, { backgroundColor: `${c.primary ?? '#F1BB03'}15` }]}
              onPress={onViewApplicants}
              activeOpacity={0.75}
            >
              <Ionicons name="people-outline" size={15} color={c.primary} />
              <Text style={[s.actionPrimaryText, { color: c.primary }]}>
                Applicants ({appCount})
              </Text>
            </TouchableOpacity>

            {/* Edit */}
            <TouchableOpacity
              style={[s.iconBtn, { borderColor: c.border }]}
              onPress={onEdit}
              activeOpacity={0.75}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="create-outline" size={17} color={c.textSecondary ?? c.textMuted} />
            </TouchableOpacity>

            {/* Pause/Activate */}
            {onToggleStatus && (
              <TouchableOpacity
                style={[s.iconBtn, { borderColor: job.status === 'active' ? '#F59E0B40' : '#10B98140' }]}
                onPress={() => onToggleStatus(job.status === 'active' ? 'paused' : 'active')}
                activeOpacity={0.75}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons
                  name={job.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={17}
                  color={job.status === 'active' ? '#F59E0B' : '#10B981'}
                />
              </TouchableOpacity>
            )}

            {/* Delete */}
            <TouchableOpacity
              style={[s.iconBtn, { borderColor: '#EF444440' }]}
              onPress={confirmDelete}
              activeOpacity={0.75}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="trash-outline" size={17} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

CompanyJobCard.displayName = 'CompanyJobCard';

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCell = ({ icon, value, label, color, c }: any) => (
  <View style={s.stat}>
    <Ionicons name={icon} size={14} color={color} />
    <Text style={[s.statValue, { color: c.text }]}>{value}</Text>
    <Text style={[s.statLabel, { color: c.textMuted }]}>{label}</Text>
  </View>
);

const MetaItem = ({ icon, label, c }: any) => {
  if (!label) return null;
  return (
    <View style={s.metaItem}>
      <Ionicons name={icon} size={11} color={c.textMuted} />
      <Text style={[s.metaText, { color: c.textMuted }]} numberOfLines={1}>{label}</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card:           { flexDirection: 'row', borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  accentBar:      { width: 4 },
  inner:          { flex: 1, padding: 14 },

  bannerRow:      { flexDirection: 'row', gap: 6, marginBottom: 10 },
  banner:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 3 },
  bannerText:     { fontSize: 10, fontWeight: '700' },

  header:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  titleBlock:     { flex: 1 },
  title:          { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  category:       { fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  dot:            { width: 6, height: 6, borderRadius: 3 },
  statusText:     { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  statsRow:       { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  stat:           { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 1 },
  statDiv:        { width: 1 },
  statValue:      { fontSize: 16, fontWeight: '800' },
  statLabel:      { fontSize: 9, fontWeight: '600' },

  meta:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' },
  metaItem:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:       { fontSize: 11 },
  typePill:       { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  typePillText:   { fontSize: 10, fontWeight: '700' },

  actions:        { flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  actionPrimary:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10, gap: 5 },
  actionPrimaryText: { fontSize: 12, fontWeight: '700' },
  iconBtn:        { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1 },
});