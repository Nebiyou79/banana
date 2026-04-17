/**
 * src/components/application/ApplicationHeader.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Colourful gradient header used on both:
 *  - CandidateApplicationDetailScreen (shows job info + status)
 *  - EmployerApplicationDetailScreen  (shows candidate info + status)
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
  (name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const formatDate = (d?: string): string => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Gradient palettes per role ───────────────────────────────────────────────
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
  const isEmployer  = role === 'employer';
  const gradColors  = isEmployer ? EMPLOYER_GRADIENT : CANDIDATE_GRADIENT;

  const SC     = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc     = SC[application.status as ApplicationStatus] ?? SC['applied'];
  const status = STATUS_LABELS[application.status as ApplicationStatus] ?? application.status;

  // What to show in the avatar + name block
  const avatarUrl  = isEmployer ? application.candidate?.avatar      : application.job?.company?.logoUrl ?? application.job?.organization?.logoUrl;
  const mainName   = isEmployer ? application.candidate?.name        : application.job?.title ?? 'Position';
  const subName    = isEmployer ? (application.userInfo?.bio ?? application.candidate?.email) : (application.job?.company?.name ?? application.job?.organization?.name ?? '');
  const initials   = isEmployer ? getInitials(application.candidate?.name) : getInitials(application.job?.company?.name ?? application.job?.organization?.name);
  const avatarBg   = isEmployer ? '#1D4ED8' : (application.job?.jobType === 'organization' ? '#7C3AED' : '#F1BB03');

  // Stats bar items
  const appliedDate = formatDate(application.createdAt);
  const jobType = application.job?.jobType === 'organization' ? 'Org' : 'Company';

  return (
    <LinearGradient
      colors={gradColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      {/* Nav row */}
      <View style={s.nav}>
        <TouchableOpacity onPress={onBack} style={s.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.navTitle} numberOfLines={1}>
          {isEmployer ? 'Application Review' : 'My Application'}
        </Text>
        {onShare ? (
          <TouchableOpacity onPress={onShare} style={s.navBtn}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
        ) : <View style={s.navBtn} />}
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
          {/* Verified badge for company logo */}
          {!isEmployer && (application.job?.company?.verified ?? application.job?.organization?.verified) && (
            <View style={s.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            </View>
          )}
        </View>

        <View style={s.heroInfo}>
          <Text style={s.mainName} numberOfLines={2}>{mainName}</Text>
          <Text style={s.subName} numberOfLines={1}>{subName}</Text>

          {/* Status pill */}
          <View style={[s.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[s.statusText, { color: sc.text }]}>{status}</Text>
          </View>
        </View>
      </View>

      {/* Info strip */}
      <View style={s.strip}>
        <StripItem icon="calendar-outline" label={`Applied ${appliedDate}`} />
        <StripDivider />
        <StripItem icon="briefcase-outline" label={jobType} />
        {(application.skills?.length ?? 0) > 0 && (
          <>
            <StripDivider />
            <StripItem icon="sparkles-outline" label={`${application.skills.length} skill${application.skills.length !== 1 ? 's' : ''}`} />
          </>
        )}
        {(application.selectedCVs?.length ?? 0) > 0 && (
          <>
            <StripDivider />
            <StripItem icon="document-outline" label={`${application.selectedCVs.length} CV`} />
          </>
        )}
      </View>

      {/* Pipeline progress (candidate view only) */}
      {!isEmployer && (
        <View style={s.pipeline}>
          {['applied', 'under-review', 'shortlisted', 'interview-scheduled', 'offer-made'].map((st, i) => {
            const order = ['applied','under-review','shortlisted','interview-scheduled','offer-made'];
            const currentIdx = order.indexOf(application.status as string);
            const done   = i < currentIdx;
            const active = i === currentIdx;
            return (
              <React.Fragment key={st}>
                <View style={[
                  s.pipelineDot,
                  done   && s.pipelineDotDone,
                  active && s.pipelineDotActive,
                ]}>
                  {done && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
                {i < 4 && (
                  <View style={[s.pipelineLine, done && s.pipelineLineDone]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}
    </LinearGradient>
  );
};

// ─── Sub-atoms ────────────────────────────────────────────────────────────────
const StripItem = ({ icon, label }: { icon: string; label: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <Ionicons name={icon as any} size={13} color="rgba(255,255,255,0.7)" />
    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>{label}</Text>
  </View>
);
const StripDivider = () => (
  <View style={{ width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.2)' }} />
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  gradient:       { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 20 },
  nav:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  navBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  navTitle:       { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#fff', marginHorizontal: 8 },
  heroRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  avatarWrapper:  { position: 'relative' },
  avatarImg:      { width: 68, height: 68, borderRadius: 18, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)' },
  avatarFallback: { width: 68, height: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)' },
  avatarInitials: { fontSize: 24, fontWeight: '800', color: '#fff' },
  verifiedBadge:  { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', borderRadius: 10, padding: 1 },
  heroInfo:       { flex: 1, gap: 4 },
  mainName:       { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 24 },
  subName:        { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  statusPill:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', marginTop: 4 },
  statusDot:      { width: 7, height: 7, borderRadius: 3.5 },
  statusText:     { fontSize: 12, fontWeight: '700' },
  strip:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14, alignItems: 'center' },
  pipeline:       { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pipelineDot:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  pipelineDotDone:{ backgroundColor: '#10B981', borderColor: '#10B981' },
  pipelineDotActive:{ backgroundColor: '#fff', borderColor: '#fff' },
  pipelineLine:   { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  pipelineLineDone:{ backgroundColor: '#10B981' },
});
