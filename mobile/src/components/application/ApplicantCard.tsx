/**
 * src/components/application/ApplicantCard.tsx
 * Employer-facing applicant card for the applications list.
 * Shows candidate avatar, skills, cover letter preview, quick actions.
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import {
  Application, ApplicationStatus,
  STATUS_LABELS, STATUS_COLORS, STATUS_COLORS_DARK,
} from '../../services/applicationService';

const formatDate = (d?: string): string => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getInitials = (name?: string) =>
  (name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

interface ApplicantCardProps {
  application: Application;
  onPress: () => void;
  onShortlist?: () => void;
  onReject?: () => void;
  onScheduleInterview?: () => void;
}

export const ApplicantCard = memo<ApplicantCardProps>(({
  application, onPress, onShortlist, onReject, onScheduleInterview,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const isDark = theme.isDark;

  const SC = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc = SC[application.status as ApplicationStatus] ?? SC.applied;

  const candidate = application.candidate;
  const userInfo  = application.userInfo;
  const name      = userInfo?.name ?? candidate?.name ?? 'Candidate';
  const email     = userInfo?.email ?? candidate?.email ?? '';
  const avatar    = candidate?.avatar;
  const initials  = getInitials(name);

  const isShortlisted = application.status === 'shortlisted';
  const isRejected    = application.status === 'rejected';
  const isInterviewed = ['interview-scheduled', 'interviewed'].includes(application.status);

  const cvCount  = application.selectedCVs?.length ?? 0;
  const refCount = (application.references ?? []).filter(r => r.name).length;
  const expCount = (application.workExperience ?? []).filter(e => e.company).length;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={[ac.card, { backgroundColor: c.card ?? c.surface, borderColor: c.border }]}>
      {/* Header */}
      <View style={ac.header}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={ac.avatar} />
        ) : (
          <View style={[ac.avatarFallback, { backgroundColor: c.primary }]}>
            <Text style={ac.avatarInitials}>{initials}</Text>
          </View>
        )}

        <View style={ac.headerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[ac.name, { color: c.text }]} numberOfLines={1}>{name}</Text>
          </View>
          <Text style={[ac.email, { color: c.textMuted }]} numberOfLines={1}>{email}</Text>
          {userInfo?.phone && (
            <Text style={[ac.phone, { color: c.textMuted }]}>{userInfo.phone}</Text>
          )}
        </View>

        <View style={[ac.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <View style={[ac.statusDot, { backgroundColor: sc.dot }]} />
          <Text style={[ac.statusText, { color: sc.text }]}>
            {STATUS_LABELS[application.status as ApplicationStatus] ?? application.status}
          </Text>
        </View>
      </View>

      {/* Stats strip */}
      <View style={[ac.statsRow, { backgroundColor: `${c.border}30`, borderColor: c.border }]}>
        <StatChip icon="document-outline" label={`${cvCount} CV`} c={c} />
        <View style={[ac.statDiv, { backgroundColor: c.border }]} />
        <StatChip icon="sparkles-outline" label={`${application.skills?.length ?? 0} skills`} c={c} />
        <View style={[ac.statDiv, { backgroundColor: c.border }]} />
        <StatChip icon="briefcase-outline" label={`${expCount} exp`} c={c} />
        <View style={[ac.statDiv, { backgroundColor: c.border }]} />
        <StatChip icon="people-outline" label={`${refCount} refs`} c={c} />
      </View>

      {/* Skills */}
      {(application.skills ?? []).length > 0 && (
        <View style={ac.skillsRow}>
          {application.skills.slice(0, 4).map((sk, i) => (
            <View key={i} style={[ac.skillTag, { backgroundColor: `${c.primary}10` }]}>
              <Text style={[ac.skillTagText, { color: c.primary }]}>{sk}</Text>
            </View>
          ))}
          {application.skills.length > 4 && (
            <Text style={[ac.skillMore, { color: c.textMuted }]}>+{application.skills.length - 4}</Text>
          )}
        </View>
      )}

      {/* Cover letter preview */}
      {application.coverLetter && (
        <Text style={[ac.coverPreview, { color: c.textMuted }]} numberOfLines={2}>
          {application.coverLetter}
        </Text>
      )}

      {/* Footer: date + actions */}
      <View style={[ac.footer, { borderTopColor: c.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
          <Text style={[ac.date, { color: c.textMuted }]}>{formatDate(application.createdAt)}</Text>
        </View>
        <View style={ac.actions}>
          {!isRejected && !isShortlisted && onShortlist && (
            <QuickBtn icon="checkmark-circle-outline" label="Shortlist" onPress={onShortlist}
              color="#10B981" bg="#ECFDF5" />
          )}
          {!isRejected && !isInterviewed && onScheduleInterview && (
            <QuickBtn icon="calendar-outline" label="Interview" onPress={onScheduleInterview}
              color="#8B5CF6" bg="#F5F3FF" />
          )}
          {!isRejected && onReject && (
            <QuickBtn icon="close-circle-outline" label="Reject" onPress={onReject}
              color="#EF4444" bg="#FEF2F2" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

ApplicantCard.displayName = 'ApplicantCard';

const StatChip = ({ icon, label, c }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
    <Ionicons name={icon} size={12} color={c.textMuted} />
    <Text style={{ fontSize: 11, color: c.textMuted, fontWeight: '500' }}>{label}</Text>
  </View>
);

const QuickBtn = ({ icon, label, onPress, color, bg }: any) => (
  <TouchableOpacity onPress={onPress} style={[ac.quickBtn, { backgroundColor: bg }]}>
    <Ionicons name={icon} size={14} color={color} />
    <Text style={[ac.quickBtnText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const ac = StyleSheet.create({
  card:          { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  header:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar:        { width: 52, height: 52, borderRadius: 14, resizeMode: 'cover' },
  avatarFallback:{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:{ color: '#fff', fontWeight: '700', fontSize: 18 },
  headerInfo:    { flex: 1 },
  name:          { fontSize: 15, fontWeight: '700' },
  email:         { fontSize: 12, marginTop: 2 },
  phone:         { fontSize: 12, marginTop: 1 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusDot:     { width: 6, height: 6, borderRadius: 3 },
  statusText:    { fontSize: 10, fontWeight: '700' },
  statsRow:      { flexDirection: 'row', borderRadius: 10, borderWidth: 1, marginBottom: 10, overflow: 'hidden', paddingVertical: 8 },
  statDiv:       { width: 1 },
  skillsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  skillTag:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  skillTagText:  { fontSize: 11, fontWeight: '600' },
  skillMore:     { fontSize: 11, alignSelf: 'center' },
  coverPreview:  { fontSize: 12, lineHeight: 17, marginBottom: 10, fontStyle: 'italic' },
  footer:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  date:          { fontSize: 11 },
  actions:       { flexDirection: 'row', gap: 6 },
  quickBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  quickBtnText:  { fontSize: 11, fontWeight: '700' },
});
