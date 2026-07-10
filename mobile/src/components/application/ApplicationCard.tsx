/**
 * src/components/application/ApplicationCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Candidate-facing application card.
 *
 * AVATAR FIX — removed inline resolveOwnerEntity() function and replaced
 * Avatar + manual entity building with CompanyAvatar which automatically
 * prefers application.job.ownerPreview (Profile-backed Cloudinary URL).
 *
 * DEBUG TOOLS — Added showAvatarDebug prop to trace resolution issues.
 * All other logic and styling preserved exactly.
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
} from '../../services/applicationService';
// AVATAR FIX: use CompanyAvatar instead of Avatar + inline resolveOwnerEntity
import CompanyAvatar from '../shared/CompanyAvatar';

// ─── Debug flag ──────────────────────────────────────────────────────────────
const DEBUG_AVATAR = __DEV__ && false; // Set to true to debug avatar resolution

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const STATUS_PIPELINE: ApplicationStatus[] = [
  'applied',
  'under-review',
  'shortlisted',
  'interview-scheduled',
  'offer-made',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ApplicationCardProps {
  application: Application;
  onPress: () => void;
  onWithdraw?: () => void;
  showAvatarDebug?: boolean; // DEBUG: overlays check/cross on avatar
}

// ─── Pipe dot — extracted stable sub-component ────────────────────────────────

interface PipeDotProps {
  done: boolean;
  active: boolean;
  primary: string;
  success: string;
  inactiveBorder: string;
}

const PipeDot = React.memo<PipeDotProps>(
  ({ done, active, primary, success, inactiveBorder }) => (
    <View
      style={[
        pd.dot,
        done   && { backgroundColor: success,  borderColor: success },
        active && { backgroundColor: primary,  borderColor: primary },
        !done && !active && { borderColor: inactiveBorder, backgroundColor: 'transparent' },
      ]}
    >
      {done   && <Ionicons name="checkmark" size={9}  color="#FFFFFF" />}
      {active && <View style={[pd.inner, { backgroundColor: '#FFFFFF' }]} />}
    </View>
  ),
);
PipeDot.displayName = 'ApplicationCard.PipeDot';

const pd = StyleSheet.create({
  dot:   { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  inner: { width: 6, height: 6, borderRadius: 3 },
});

// ─── Component ────────────────────────────────────────────────────────────────

export const ApplicationCard = memo<ApplicationCardProps>(
  ({ application, onPress, onWithdraw, showAvatarDebug = DEBUG_AVATAR }) => {
    const { colors: c, isDark, shadows } = useTheme();

    const appStatus   = application.status as ApplicationStatus;
    const sc          = STATUS_COLORS[appStatus] ?? STATUS_COLORS['applied'];
    const statusLabel = STATUS_LABELS[appStatus] ?? application.status;

    // Owner name: prefer ownerPreview then fall through to populated doc
    const isOrg = application.job?.jobType === 'organization';
    const owner = isOrg
      ? (application.job?.organization as any)
      : (application.job?.company as any);
    const ownerName = application.job?.ownerPreview?.name
      ?? owner?.name
      ?? (isOrg ? 'Organization' : 'Company');

    const ownerVerified = application.job?.ownerPreview?.verified ?? owner?.verified ?? false;

    const pipelineIdx = STATUS_PIPELINE.indexOf(appStatus);
    const dateLabel   = formatShortDate(application.createdAt);

    // ── Memoised styles ─────────────────────────────────────────────────────
    const s = useMemo(
      () =>
        StyleSheet.create({
          card: {
            flexDirection:   'row',
            borderRadius:    RADIUS.xl,
            borderWidth:     1,
            borderColor:     c.border,
            marginBottom:    SPACING.md,
            overflow:        'hidden',
            backgroundColor: c.bgCard,
            ...shadows.sm,
          },
          stripe:  { width: 4, backgroundColor: sc.dot },
          content: { flex: 1, padding: 13 },

          topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
          headerInfo: { flex: 1 },
          jobTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19, marginBottom: 3, color: c.text },
          ownerRow:  { flexDirection: 'row', alignItems: 'center' },
          ownerName: { fontSize: 12, fontWeight: '600', color: c.primary },

          statusPill: {
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 7, paddingVertical: 3,
            borderRadius: RADIUS.full, borderWidth: 1,
            backgroundColor: sc.bg, borderColor: sc.border,
          },
          statusDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: sc.dot },
          statusText: { fontSize: 10, fontWeight: '700', color: sc.text },

          pipeline:       { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
          pipeLine:       { flex: 1, height: 2 },
          pipeLineDone:   { backgroundColor: c.success },
          pipeLineUndone: { backgroundColor: withAlpha(c.text, isDark ? 0.08 : 0.07) },

          skillRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 9 },
          skillChip:  {
            paddingHorizontal: SPACING.sm, paddingVertical: 3,
            borderRadius: RADIUS.full, borderWidth: 1,
            backgroundColor: withAlpha(c.primary, 0.12),
            borderColor:     withAlpha(c.primary, 0.28),
          },
          skillText:  { fontSize: 10, fontWeight: '600', color: c.primary },
          moreSkills: { fontSize: 10, alignSelf: 'center', color: c.textMuted },

          footer:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
          dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
          date:    { fontSize: 11, color: c.textMuted },

          withdrawBtn: {
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: RADIUS.sm, borderWidth: 1,
            borderColor: withAlpha(c.danger, 0.30),
          },
          withdrawText: { color: c.danger, fontSize: 11, fontWeight: '600' },
        }),
      [c, isDark, sc, shadows],
    );

    return (
      <TouchableOpacity
        onPress={onPress}
        style={s.card}
        activeOpacity={0.78}
        accessibilityRole="button"
      >
        {/* Left status stripe */}
        <View style={s.stripe} />

        <View style={s.content}>
          {/* Top row */}
          <View style={s.topRow}>
            {/* AVATAR FIX: CompanyAvatar resolves from application.job.ownerPreview */}
            <CompanyAvatar
              application={application}
              size={48}
              borderRadius={RADIUS.md}
              verified={ownerVerified}
              showDebug={showAvatarDebug}
            />

            <View style={s.headerInfo}>
              <Text style={s.jobTitle} numberOfLines={2}>
                {application.job?.title ?? 'Position'}
              </Text>
              <View style={s.ownerRow}>
                <Text style={s.ownerName} numberOfLines={1}>{ownerName}</Text>
                {ownerVerified && (
                  <Ionicons name="checkmark-circle" size={13} color={c.primary} style={{ marginLeft: 3 }} />
                )}
              </View>
            </View>

            <View style={s.statusPill}>
              <View style={s.statusDot} />
              <Text style={s.statusText} numberOfLines={1}>{statusLabel}</Text>
            </View>
          </View>

          {/* Pipeline progress */}
          {pipelineIdx >= 0 && (
            <View style={s.pipeline}>
              {STATUS_PIPELINE.map((st, i) => {
                const done   = i < pipelineIdx;
                const active = i === pipelineIdx;
                return (
                  <React.Fragment key={st}>
                    <PipeDot
                      done={done}
                      active={active}
                      primary={c.primary}
                      success={c.success}
                      inactiveBorder={withAlpha(c.text, isDark ? 0.12 : 0.10)}
                    />
                    {i < STATUS_PIPELINE.length - 1 && (
                      <View style={[s.pipeLine, done ? s.pipeLineDone : s.pipeLineUndone]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {/* Skills */}
          {(application.skills ?? []).length > 0 && (
            <View style={s.skillRow}>
              {application.skills.slice(0, 3).map((sk) => (
                <View key={sk} style={s.skillChip}>
                  <Text style={s.skillText}>{sk}</Text>
                </View>
              ))}
              {application.skills.length > 3 && (
                <Text style={s.moreSkills}>+{application.skills.length - 3}</Text>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={s.footer}>
            <View style={s.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
              <Text style={s.date}>{dateLabel}</Text>
            </View>

            {onWithdraw && appStatus === 'applied' && (
              <TouchableOpacity
                onPress={onWithdraw}
                style={s.withdrawBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Withdraw application"
              >
                <Text style={s.withdrawText}>Withdraw</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

ApplicationCard.displayName = 'ApplicationCard';