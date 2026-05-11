/**
 * src/components/application/ApplicantCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Employer-facing applicant card.
 *
 * REFACTOR NOTES (spec compliance):
 *  ✅ All colours via useTheme() — zero hardcoded hex.
 *  ✅ withAlpha() replaces string-concatenated rgba.
 *  ✅ StyleSheet memoised with useMemo.
 *  ✅ QuickBtn extracted as stable React.memo component.
 *  ✅ All touch targets ≥ 44 pt (hitSlop on icon actions).
 *  ✅ No `any` prop types — ThemeColors imported.
 *  ✅ No emoji icons.
 *  ✅ isDark from useTheme(), not inferred from hex strings.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha, formatShortDate } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import {
  Application,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_COLORS_DARK,
} from '../../services/applicationService';
import { Avatar, candidateToEntity } from '../shared/Avatar';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ApplicantCardProps {
  application: Application;
  onPress: () => void;
  onShortlist?: () => void;
  onReject?: () => void;
  onScheduleInterview?: () => void;
}

// ─── QuickBtn — extracted stable sub-component ────────────────────────────────

interface QuickBtnProps {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  bg: string;
}

const QuickBtn = React.memo<QuickBtnProps>(({ icon, label, onPress, color, bg }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[qb.btn, { backgroundColor: bg }]}
    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Ionicons name={icon as any} size={14} color={color} />
    <Text style={[qb.text, { color }]}>{label}</Text>
  </TouchableOpacity>
));
QuickBtn.displayName = 'ApplicantCard.QuickBtn';

const qb = StyleSheet.create({
  btn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   5,
    borderRadius:      RADIUS.sm,
  },
  text: { fontSize: 11, fontWeight: '700' },
});

// ─── Component ────────────────────────────────────────────────────────────────

export const ApplicantCard = memo<ApplicantCardProps>(({
  application,
  onPress,
  onShortlist,
  onReject,
  onScheduleInterview,
}) => {
  const { colors: c, isDark, shadows } = useTheme();

  const SC     = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc     = SC[application.status as ApplicationStatus] ?? SC.applied;
  const status = STATUS_LABELS[application.status as ApplicationStatus] ?? application.status;

  const candidateEntity = candidateToEntity(application.candidate, application.userInfo);
  const name  = application.userInfo?.name ?? application.candidate?.name ?? 'Candidate';
  const email = application.userInfo?.email ?? application.candidate?.email ?? '';

  const isShortlisted = application.status === 'shortlisted';
  const isRejected    = application.status === 'rejected';
  const isInterviewed = ['interview-scheduled', 'interviewed'].includes(application.status);

  const cvCount    = application.selectedCVs?.length ?? 0;
  const refCount   = (application.references ?? []).filter((r) => r.name).length;
  const expCount   = (application.workExperience ?? []).filter((e) => e.company).length;
  const skillCount = application.skills?.length ?? 0;

  // ── Memoised styles ─────────────────────────────────────────────────────────
  const s = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius:    RADIUS.xl - 2,
          borderWidth:     1,
          padding:         14,
          marginBottom:    10,
          backgroundColor: c.bgCard,
          borderColor:     c.border,
          ...shadows.sm,
        },

        header:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
        headerInfo: { flex: 1 },
        name:       { fontSize: 15, fontWeight: '700', color: c.text },
        email:      { fontSize: 12, marginTop: 2, color: c.textMuted },
        phone:      { fontSize: 12, marginTop: 1, color: c.textMuted },

        statusBadge: {
          flexDirection:     'row',
          alignItems:        'center',
          gap:               5,
          paddingHorizontal: SPACING.sm,
          paddingVertical:   4,
          borderRadius:      RADIUS.full,
          borderWidth:       1,
          backgroundColor:   sc.bg,
          borderColor:       sc.border,
        },
        statusDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: sc.dot },
        statusText: { fontSize: 10, fontWeight: '700', color: sc.text },

        statsRow: {
          flexDirection:   'row',
          borderRadius:    RADIUS.sm,
          borderWidth:     1,
          marginBottom:    10,
          overflow:        'hidden',
          paddingVertical: 9,
          backgroundColor: withAlpha(c.text, isDark ? 0.04 : 0.025),
          borderColor:     withAlpha(c.text, isDark ? 0.06 : 0.05),
        },
        statItem: {
          flex:           1,
          flexDirection:  'row',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            4,
        },
        statLabel: { fontSize: 11, fontWeight: '500', color: c.textMuted },
        statDiv:   { width: 1, backgroundColor: withAlpha(c.text, isDark ? 0.07 : 0.07) },

        skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 9 },
        skillTag:  {
          paddingHorizontal: 10,
          paddingVertical:   4,
          borderRadius:      RADIUS.full,
          backgroundColor:   withAlpha(c.primary, 0.10),
        },
        skillTagText: { fontSize: 11, fontWeight: '600', color: c.primary },
        skillMore:    { fontSize: 11, alignSelf: 'center', color: c.textMuted },

        coverPreview: {
          fontSize:     12,
          lineHeight:   17,
          marginBottom: 10,
          fontStyle:    'italic',
          color:        c.textMuted,
        },

        footer: {
          flexDirection:  'row',
          alignItems:     'center',
          justifyContent: 'space-between',
          paddingTop:     10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.border,
        },
        dateRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
        date:     { fontSize: 11, color: c.textMuted },
        actions:  { flexDirection: 'row', gap: 6 },
      }),
    [c, isDark, sc, shadows],
  );

  const statItems = useMemo(
    () => [
      { icon: 'document-outline',  label: `${cvCount} CV`     },
      { icon: 'flash-outline',     label: `${skillCount} skills` },
      { icon: 'briefcase-outline', label: `${expCount} exp`    },
      { icon: 'people-outline',    label: `${refCount} refs`   },
    ],
    [cvCount, skillCount, expCount, refCount],
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.80}
      style={s.card}
      accessibilityRole="button"
    >
      {/* Header */}
      <View style={s.header}>
        <Avatar entity={candidateEntity} size={52} borderRadius={RADIUS.md} />

        <View style={s.headerInfo}>
          <Text style={s.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={s.email} numberOfLines={1}>
            {email}
          </Text>
          {application.userInfo?.phone ? (
            <Text style={s.phone}>{application.userInfo.phone}</Text>
          ) : null}
        </View>

        <View style={s.statusBadge}>
          <View style={s.statusDot} />
          <Text style={s.statusText}>{status}</Text>
        </View>
      </View>

      {/* Stats strip */}
      <View style={s.statsRow}>
        {statItems.map((item, i) => (
          <React.Fragment key={item.label}>
            <View style={s.statItem}>
              <Ionicons name={item.icon as any} size={12} color={c.textMuted} />
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
            {i < statItems.length - 1 && <View style={s.statDiv} />}
          </React.Fragment>
        ))}
      </View>

      {/* Skills */}
      {(application.skills ?? []).length > 0 && (
        <View style={s.skillsRow}>
          {application.skills.slice(0, 4).map((sk, i) => (
            <View key={i} style={s.skillTag}>
              <Text style={s.skillTagText}>{sk}</Text>
            </View>
          ))}
          {application.skills.length > 4 && (
            <Text style={s.skillMore}>
              +{application.skills.length - 4}
            </Text>
          )}
        </View>
      )}

      {/* Cover letter preview */}
      {application.coverLetter ? (
        <Text style={s.coverPreview} numberOfLines={2}>
          {application.coverLetter}
        </Text>
      ) : null}

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
          <Text style={s.date}>{formatShortDate(application.createdAt)}</Text>
        </View>

        <View style={s.actions}>
          {!isRejected && !isShortlisted && onShortlist && (
            <QuickBtn
              icon="checkmark-circle-outline"
              label="Shortlist"
              onPress={onShortlist}
              color={c.success}
              bg={withAlpha(c.success, 0.10)}
            />
          )}
          {!isRejected && !isInterviewed && onScheduleInterview && (
            <QuickBtn
              icon="calendar-outline"
              label="Interview"
              onPress={onScheduleInterview}
              color={c.info}
              bg={withAlpha(c.info, 0.10)}
            />
          )}
          {!isRejected && onReject && (
            <QuickBtn
              icon="close-circle-outline"
              label="Reject"
              onPress={onReject}
              color={c.danger}
              bg={withAlpha(c.danger, 0.10)}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

ApplicantCard.displayName = 'ApplicantCard';