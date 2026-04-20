/**
 * src/components/application/ApplicationHeader.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Gradient header used on both:
 *  - CandidateApplicationDetailScreen  (shows job info + status)
 *  - EmployerApplicationDetailScreen   (shows candidate info + status)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Application,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_COLORS_DARK,
} from '../../services/applicationService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name?: string): string =>
  (name ?? '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const formatDate = (d?: string): string => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

// ─── Gradient palettes ────────────────────────────────────────────────────────

const CANDIDATE_GRADIENT: [string, string, string] = ['#1D4ED8', '#2563EB', '#0F2040'];
const EMPLOYER_GRADIENT:  [string, string, string] = ['#065F46', '#059669', '#0A2540'];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ApplicationHeaderProps {
  application: Application;
  /** 'candidate' shows job info; 'employer' shows candidate info */
  role: 'candidate' | 'employer';
  onBack: () => void;
  onShare?: () => void;
  isDark?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({
  application, role, onBack, onShare, isDark = false,
}) => {
  const isEmployer = role === 'employer';
  const gradColors = isEmployer ? EMPLOYER_GRADIENT : CANDIDATE_GRADIENT;

  const SC     = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc     = SC[application.status as ApplicationStatus] ?? SC['applied'];
  const status = STATUS_LABELS[application.status as ApplicationStatus] ?? application.status;

  // Avatar + name block
  const avatarUrl = isEmployer
    ? application.candidate?.avatar
    : application.job?.company?.logoUrl ?? application.job?.organization?.logoUrl;
  const mainName  = isEmployer
    ? (application.userInfo?.name ?? application.candidate?.name ?? 'Candidate')
    : (application.job?.title ?? 'Position');
  const subName   = isEmployer
    ? (application.userInfo?.email ?? application.candidate?.email ?? '')
    : (application.job?.company?.name ?? application.job?.organization?.name ?? '');
  const initials  = isEmployer
    ? getInitials(application.userInfo?.name ?? application.candidate?.name)
    : getInitials(application.job?.company?.name ?? application.job?.organization?.name);
  const avatarBg  = isEmployer
    ? '#1D4ED8'
    : (application.job?.jobType === 'organization' ? '#7C3AED' : '#F1BB03');

  const appliedDate = formatDate(application.createdAt);
  const jobType     = application.job?.jobType === 'organization' ? 'Org' : 'Company';

  // Stats for the bottom bar
  const cvCount  = application.selectedCVs?.length ?? 0;
  const refCount = application.references?.length   ?? 0;
  const expCount = application.workExperience?.length ?? 0;

  return (
    <LinearGradient
      colors={gradColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      {/* Nav row */}
      <View style={s.nav}>
        <TouchableOpacity
          onPress={onBack}
          style={s.navBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.navTitle} numberOfLines={1}>
          {isEmployer ? 'Application Review' : 'My Application'}
        </Text>
        {onShare ? (
          <TouchableOpacity onPress={onShare} style={s.navBtn}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={s.navBtn} />
        )}
      </View>

      {/* Avatar + name block */}
      <View style={s.heroRow}>
        <View style={s.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
          ) : (
            <View style={[s.avatarFallback, { backgroundColor: avatarBg }]}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
          )}
          {/* Verified tick for company logos */}
          {!isEmployer && (application.job?.company?.verified ?? application.job?.organization?.verified) && (
            <View style={s.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            </View>
          )}
        </View>

        <View style={s.nameBlock}>
          <Text style={s.mainName} numberOfLines={2}>{mainName}</Text>
          {subName ? (
            <Text style={s.subName} numberOfLines={1}>{subName}</Text>
          ) : null}
          {/* Status pill */}
          <View style={[s.statusPill, { backgroundColor: `${sc.dot}30`, borderColor: `${sc.dot}60` }]}>
            <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[s.statusText, { color: '#fff' }]}>{status}</Text>
          </View>
        </View>
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        <StatItem icon="calendar-outline" label="Applied" value={appliedDate} />
        <View style={s.statDivider} />
        <StatItem icon="document-text-outline" label="CVs" value={String(cvCount)} />
        <View style={s.statDivider} />
        <StatItem icon="people-outline" label="Refs" value={String(refCount)} />
        <View style={s.statDivider} />
        <StatItem icon="briefcase-outline" label="Exp" value={String(expCount)} />
        {!isEmployer && (
          <>
            <View style={s.statDivider} />
            <StatItem icon="business-outline" label="Type" value={jobType} />
          </>
        )}
      </View>
    </LinearGradient>
  );
};

// ─── Stat cell ────────────────────────────────────────────────────────────────

const StatItem = ({
  icon, label, value,
}: { icon: string; label: string; value: string }) => (
  <View style={s.statItem}>
    <Ionicons name={icon as any} size={13} color="rgba(255,255,255,0.7)" />
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  gradient:       { paddingBottom: 0 },
  nav:            {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 14, paddingBottom: 8,
  },
  navBtn:         { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle:       { flex: 1, textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 16 },
  heroRow:        {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  avatarWrapper:  { position: 'relative' },
  avatarImg:      { width: 64, height: 64, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarFallback: {
    width: 64, height: 64, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitials: { color: '#fff', fontSize: 24, fontWeight: '800' },
  verifiedBadge:  {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#fff', borderRadius: 10, padding: 1,
  },
  nameBlock:      { flex: 1, gap: 4 },
  mainName:       { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 22 },
  subName:        { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  statusPill:     {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginTop: 2,
  },
  statusDot:      { width: 7, height: 7, borderRadius: 4 },
  statusText:     { fontSize: 11, fontWeight: '700' },
  statsBar:       {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center',
  },
  statItem:       { flex: 1, alignItems: 'center', gap: 2 },
  statValue:      { color: '#fff', fontSize: 12, fontWeight: '700' },
  statLabel:      { color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: '600' },
  statDivider:    { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },
});
