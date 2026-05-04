/**
 * src/components/application/ApplicantCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Employer-facing applicant card — redesigned with:
 * - Universal Avatar for candidate display
 * - Stats strip with CV/skills/exp/refs count
 * - Clean action buttons with proper touch targets
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import {
  Application,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_COLORS_DARK,
} from '../../services/applicationService';
import { Avatar, candidateToEntity } from '../shared/Avatar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (d?: string): string => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ApplicantCardProps {
  application: Application;
  onPress: () => void;
  onShortlist?: () => void;
  onReject?: () => void;
  onScheduleInterview?: () => void;
}

// ─── Quick action button ──────────────────────────────────────────────────────

const QuickBtn = ({ icon, label, onPress, color, bg }: {
  icon: string; label: string; onPress: () => void; color: string; bg: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[ap.quickBtn, { backgroundColor: bg }]}
    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
  >
    <Ionicons name={icon as any} size={14} color={color} />
    <Text style={[ap.quickBtnText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const ApplicantCard = memo<ApplicantCardProps>(({
  application, onPress, onShortlist, onReject, onScheduleInterview,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const isDark = theme.isDark;

  const SC     = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc     = SC[application.status as ApplicationStatus] ?? SC.applied;
  const status = STATUS_LABELS[application.status as ApplicationStatus] ?? application.status;

  const candidateEntity = candidateToEntity(application.candidate, application.userInfo);
  const name  = application.userInfo?.name ?? application.candidate?.name ?? 'Candidate';
  const email = application.userInfo?.email ?? application.candidate?.email ?? '';

  const isShortlisted = application.status === 'shortlisted';
  const isRejected    = application.status === 'rejected';
  const isInterviewed = ['interview-scheduled', 'interviewed'].includes(application.status);

  const cvCount  = application.selectedCVs?.length ?? 0;
  const refCount = (application.references ?? []).filter(r => r.name).length;
  const expCount = (application.workExperience ?? []).filter(e => e.company).length;
  const skillCount = application.skills?.length ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        ap.card,
        {
          backgroundColor: isDark ? c.card : '#fff',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          shadowColor: isDark ? '#000' : '#0A2540',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.07,
          shadowRadius: 10,
          elevation: 3,
        },
      ]}
    >
      {/* Header */}
      <View style={ap.header}>
        <Avatar
          entity={candidateEntity}
          size={52}
          borderRadius={14}
        />

        <View style={ap.headerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[ap.name, { color: c.text ?? c.text }]} numberOfLines={1}>
              {name}
            </Text>
          </View>
          <Text style={[ap.email, { color: c.textMuted }]} numberOfLines={1}>{email}</Text>
          {application.userInfo?.phone && (
            <Text style={[ap.phone, { color: c.textMuted }]}>{application.userInfo.phone}</Text>
          )}
        </View>

        <View style={[ap.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <View style={[ap.statusDot, { backgroundColor: sc.dot }]} />
          <Text style={[ap.statusText, { color: sc.text }]}>{status}</Text>
        </View>
      </View>

      {/* Stats strip */}
      <View style={[
        ap.statsRow,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        },
      ]}>
        {[
          { icon: 'document-outline',  label: `${cvCount} CV`,        },
          { icon: 'flash-outline',      label: `${skillCount} skills`, },
          { icon: 'briefcase-outline',  label: `${expCount} exp`,      },
          { icon: 'people-outline',     label: `${refCount} refs`,     },
        ].map((item, i, arr) => (
          <React.Fragment key={item.label}>
            <View style={ap.statItem}>
              <Ionicons name={item.icon as any} size={12} color={c.textMuted} />
              <Text style={[ap.statLabel, { color: c.textMuted }]}>{item.label}</Text>
            </View>
            {i < arr.length - 1 && (
              <View style={[ap.statDiv, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Skills */}
      {(application.skills ?? []).length > 0 && (
        <View style={ap.skillsRow}>
          {application.skills.slice(0, 4).map((sk, i) => (
            <View
              key={i}
              style={[ap.skillTag, { backgroundColor: `${c.primary}10` }]}
            >
              <Text style={[ap.skillTagText, { color: c.primary }]}>{sk}</Text>
            </View>
          ))}
          {application.skills.length > 4 && (
            <Text style={[ap.skillMore, { color: c.textMuted }]}>
              +{application.skills.length - 4}
            </Text>
          )}
        </View>
      )}

      {/* Cover letter preview */}
      {application.coverLetter && (
        <Text style={[ap.coverPreview, { color: c.textMuted }]} numberOfLines={2}>
          {application.coverLetter}
        </Text>
      )}

      {/* Footer */}
      <View style={[ap.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
          <Text style={[ap.date, { color: c.textMuted }]}>{formatDate(application.createdAt)}</Text>
        </View>

        <View style={ap.actions}>
          {!isRejected && !isShortlisted && onShortlist && (
            <QuickBtn
              icon="checkmark-circle-outline"
              label="Shortlist"
              onPress={onShortlist}
              color="#10B981"
              bg="rgba(16,185,129,0.1)"
            />
          )}
          {!isRejected && !isInterviewed && onScheduleInterview && (
            <QuickBtn
              icon="calendar-outline"
              label="Interview"
              onPress={onScheduleInterview}
              color="#8B5CF6"
              bg="rgba(139,92,246,0.1)"
            />
          )}
          {!isRejected && onReject && (
            <QuickBtn
              icon="close-circle-outline"
              label="Reject"
              onPress={onReject}
              color="#EF4444"
              bg="rgba(239,68,68,0.1)"
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

ApplicantCard.displayName = 'ApplicantCard';

// ─── Styles ───────────────────────────────────────────────────────────────────

const ap = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  header:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  headerInfo:    { flex: 1 },
  name:          { fontSize: 15, fontWeight: '700' },
  email:         { fontSize: 12, marginTop: 2 },
  phone:         { fontSize: 12, marginTop: 1 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusDot:     { width: 6, height: 6, borderRadius: 3 },
  statusText:    { fontSize: 10, fontWeight: '700' },

  statsRow:    { flexDirection: 'row', borderRadius: 10, borderWidth: 1, marginBottom: 10, overflow: 'hidden', paddingVertical: 9 },
  statItem:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  statLabel:   { fontSize: 11, fontWeight: '500' },
  statDiv:     { width: 1 },

  skillsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 9 },
  skillTag:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  skillTagText: { fontSize: 11, fontWeight: '600' },
  skillMore:   { fontSize: 11, alignSelf: 'center' },

  coverPreview: { fontSize: 12, lineHeight: 17, marginBottom: 10, fontStyle: 'italic' },

  footer:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  date:     { fontSize: 11 },
  actions:  { flexDirection: 'row', gap: 6 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  quickBtnText: { fontSize: 11, fontWeight: '700' },
});