/**
 * mobile/src/components/applications/ApplicantCard.tsx
 *
 * Employer-facing applicant row card for the Applicant List screen.
 * Mirrors the web frontend's applicant listing inside company/org dashboards.
 *
 * Shows: candidate name/avatar, email, status badge, skills preview,
 *        applied date, and quick action buttons.
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import {
  Application,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_COLORS_DARK,
} from '../../services/applicationService';
import { formatDate, getCompanyInitials } from '../../utils/jobHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplicantCardProps {
  application: Application;
  onPress: () => void;
  onShortlist?: () => void;
  onReject?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ApplicantCard: React.FC<ApplicantCardProps> = ({
  application, onPress, onShortlist, onReject,
}) => {
  const { theme: { colors, isDark, shadows } } = useThemeStore();
  const c = colors;

  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

  const SC = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc = SC[application.status] ?? SC.applied;

  const initials = getCompanyInitials(application.userInfo?.name ?? application.candidate?.name ?? 'C');

  const isShortlisted = application.status === 'shortlisted' ||
                        application.status === 'interview-scheduled' ||
                        application.status === 'offer-made';
  const isRejected    = application.status === 'rejected' || application.status === 'withdrawn';

  return (
    <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
      <Animated.View style={[s.card, { backgroundColor: c.card, borderColor: c.border, transform: [{ scale }] }, shadows.sm]}>

        {/* ── Header ── */}
        <View style={s.header}>
          {/* Avatar */}
          <View style={[s.avatar, { backgroundColor: c.primaryLight }]}>
            <Text style={[s.avatarText, { color: c.primary }]}>{initials}</Text>
          </View>

          {/* Name + email */}
          <View style={{ flex: 1 }}>
            <Text style={[s.name, { color: c.text }]} numberOfLines={1}>
              {application.userInfo?.name ?? 'Candidate'}
            </Text>
            <Text style={[s.email, { color: c.textSecondary }]} numberOfLines={1}>
              {application.userInfo?.email ?? '—'}
            </Text>
            {application.userInfo?.phone && (
              <Text style={[s.phone, { color: c.textMuted }]}>{application.userInfo.phone}</Text>
            )}
          </View>

          {/* Status badge */}
          <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
            <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[s.statusText, { color: sc.text }]}>{STATUS_LABELS[application.status]}</Text>
          </View>
        </View>

        {/* ── Skills ── */}
        {(application.skills ?? []).length > 0 && (
          <View style={s.skillsRow}>
            {application.skills!.slice(0, 4).map(sk => (
              <View key={sk} style={[s.skillTag, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                <Text style={[s.skillTagText, { color: c.textSecondary }]}>{sk}</Text>
              </View>
            ))}
            {application.skills!.length > 4 && (
              <Text style={[s.skillMore, { color: c.textMuted }]}>+{application.skills!.length - 4}</Text>
            )}
          </View>
        )}

        {/* ── Cover letter preview ── */}
        {application.coverLetter && (
          <Text style={[s.coverPreview, { color: c.textMuted }]} numberOfLines={2}>
            {application.coverLetter}
          </Text>
        )}

        {/* ── Footer ── */}
        <View style={[s.footer, { borderTopColor: c.border }]}>
          <View style={s.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
            <Text style={[s.date, { color: c.textMuted }]}>Applied {formatDate(application.createdAt)}</Text>
          </View>

          <View style={s.actions}>
            {!isRejected && !isShortlisted && onShortlist && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: c.successLight, borderColor: c.success }]}
                onPress={onShortlist} activeOpacity={0.7}>
                <Ionicons name="checkmark" size={14} color={c.success} />
                <Text style={[s.actionBtnText, { color: c.success }]}>Shortlist</Text>
              </TouchableOpacity>
            )}
            {!isRejected && onReject && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: c.errorLight, borderColor: c.error }]}
                onPress={onReject} activeOpacity={0.7}>
                <Ionicons name="close" size={14} color={c.error} />
                <Text style={[s.actionBtnText, { color: c.error }]}>Reject</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.viewBtn} onPress={onPress} activeOpacity={0.7}>
              <Text style={[s.viewText, { color: c.primary }]}>Review</Text>
              <Ionicons name="chevron-forward" size={14} color={c.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card:        { borderRadius: 16, borderWidth: 1, padding: 16 },
  header:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar:      { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 18, fontWeight: '700' },
  name:        { fontSize: 15, fontWeight: '700' },
  email:       { fontSize: 13, marginTop: 2 },
  phone:       { fontSize: 12, marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4, alignSelf: 'flex-start' },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 11, fontWeight: '600' },
  skillsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  skillTag:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  skillTagText:{ fontSize: 12 },
  skillMore:   { fontSize: 12, alignSelf: 'center' },
  coverPreview:{ fontSize: 13, lineHeight: 18, marginTop: 8, fontStyle: 'italic' },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, flexWrap: 'wrap', gap: 8 },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date:        { fontSize: 11 },
  actions:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, gap: 4 },
  actionBtnText:{ fontSize: 12, fontWeight: '600' },
  viewBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText:    { fontSize: 13, fontWeight: '600' },
});
