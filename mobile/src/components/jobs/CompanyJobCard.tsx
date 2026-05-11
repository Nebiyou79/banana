/**
 * src/components/jobs/CompanyJobCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Company owner job card with avatar display.
 *
 * FIXED: Avatar display for company/organization owners
 * ✅ All colours via useTheme() — zero hardcoded hex.
 * ✅ Avatar properly integrated with jobOwnerToEntity
 */
import React, { useRef, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha, formatShortDate } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/color';
import { Job } from '../../services/jobService';
import { Avatar, jobOwnerToEntity } from '../shared/Avatar';
import { formatDeadline, formatLocation } from '../../utils/jobHelpers';

// ─── Status stripe config ─────────────────────────────────────────────────────

export const JOB_STATUS_STRIPE = (c: ThemeColors): Record<string, string> => ({
  active:  c.success,
  draft:   c.textMuted,
  paused:  c.warning,
  closed:  c.danger,
  expired: c.danger,
});

// ─── StatCell — extracted stable sub-component ────────────────────────────────

interface StatCellProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: number | string;
  label: string;
  color: string;
  textColor: string;
  mutedColor: string;
  dividerColor: string;
  showDivider?: boolean;
}

const StatCell = React.memo<StatCellProps>(
  ({ icon, value, label, color, textColor, mutedColor, dividerColor, showDivider }) => (
    <>
      <View style={sc.cell}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={[sc.val, { color: textColor }]}>{value}</Text>
        <Text style={[sc.label, { color: mutedColor }]}>{label}</Text>
      </View>
      {showDivider && <View style={[sc.div, { backgroundColor: dividerColor }]} />}
    </>
  ),
);
StatCell.displayName = 'CompanyJobCard.StatCell';

const sc = StyleSheet.create({
  cell:  { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm, gap: 1 },
  val:   { fontSize: 15, fontWeight: '800' },
  label: { fontSize: 9, fontWeight: '600' },
  div:   { width: 1 },
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface CompanyJobCardProps {
  job: Job;
  onEdit: () => void;
  onDelete: () => void;
  onViewApplicants: () => void;
  onPress?: () => void;
  onToggleStatus?: (newStatus: 'active' | 'paused' | 'closed') => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CompanyJobCard = memo<CompanyJobCardProps>(({
  job,
  onEdit,
  onDelete,
  onViewApplicants,
  onPress,
  onToggleStatus,
}) => {
  const { colors: c, isDark, shadows } = useTheme();

  // ── Resolved values ─────────────────────────────────────────────────────────
  const stripeColor  = JOB_STATUS_STRIPE(c)[job.status ?? 'draft'] ?? c.textMuted;
  const dividerColor = withAlpha(c.text, isDark ? 0.08 : 0.07);
  // FIXED: Proper entity for Avatar
  const ownerEntity  = jobOwnerToEntity(job);
  const appCount     = job.applicationCount ?? 0;
  const deadlineText = formatDeadline(job.applicationDeadline);

  // Status badge colours
  const statusColors = useMemo(() => {
    const map: Record<string, { bg: string; text: string }> = {
      active:  { bg: withAlpha(c.success, 0.14), text: c.success },
      draft:   { bg: withAlpha(c.textMuted, 0.14), text: c.textMuted },
      paused:  { bg: withAlpha(c.warning, 0.14), text: c.warning },
      closed:  { bg: withAlpha(c.danger, 0.14), text: c.danger },
      expired: { bg: withAlpha(c.danger, 0.14), text: c.danger },
    };
    return map[job.status ?? 'draft'] ?? map.draft;
  }, [c, job.status]);

  // ── Animations ──────────────────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue:        0.976,
      useNativeDriver: true,
      speed:           50,
      bounciness:      2,
    }).start();
  }, [scaleAnim]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue:        1,
      useNativeDriver: true,
      speed:           50,
      bounciness:      2,
    }).start();
  }, [scaleAnim]);

  const confirmDelete = useCallback(
    () =>
      Alert.alert(
        'Delete Job',
        `Delete "${job.title ?? 'this job'}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ],
      ),
    [job.title, onDelete],
  );

  // ── Memoised styles ─────────────────────────────────────────────────────────
  const s = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection:   'row',
          borderRadius:    RADIUS.xl,
          borderWidth:     1,
          marginBottom:    14,
          overflow:        'hidden',
          backgroundColor: c.bgCard,
          borderColor:     c.border,
          ...shadows.sm,
        },
        stripe: {
          position:              'absolute',
          left:                  0,
          top:                   0,
          bottom:                0,
          width:                 4,
          borderTopLeftRadius:   RADIUS.xl,
          borderBottomLeftRadius: RADIUS.xl,
          backgroundColor:       stripeColor,
        },
        inner: { flex: 1, padding: 14, paddingLeft: 18 },

        bannerRow: {
          flexDirection: 'row',
          flexWrap:      'wrap',
          gap:           6,
          marginBottom:  10,
        },
        banner: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.sm },

        header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
        titleBlock: { flex: 1 },
        title:      { fontSize: 15, fontWeight: '700', lineHeight: 20, color: c.text },
        category:   { fontSize: 11, marginTop: 3, color: c.textMuted, textTransform: 'capitalize' },

        statusBadge: {
          flexDirection:     'row',
          alignItems:        'center',
          paddingHorizontal: SPACING.sm,
          paddingVertical:   4,
          borderRadius:      RADIUS.full,
          gap:               4,
          backgroundColor:   statusColors.bg,
        },
        statusDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: statusColors.text },
        statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, color: statusColors.text },

        statsStrip: {
          flexDirection:   'row',
          borderRadius:    RADIUS.md,
          borderWidth:     1,
          marginBottom:    10,
          overflow:        'hidden',
          backgroundColor: withAlpha(c.text, isDark ? 0.04 : 0.025),
          borderColor:     withAlpha(c.text, isDark ? 0.06 : 0.06),
        },

        meta: {
          flexDirection: 'row',
          flexWrap:      'wrap',
          gap:           SPACING.sm,
          marginBottom:  12,
          alignItems:    'center',
        },
        metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        metaText:  { fontSize: 11, color: c.textMuted },
        typePill: {
          paddingHorizontal: 9,
          paddingVertical:   3,
          borderRadius:      RADIUS.full,
          backgroundColor:   withAlpha(c.primary, 0.13),
        },
        typePillText: { fontSize: 10, fontWeight: '700', color: c.primary },

        actions: {
          flexDirection:  'row',
          gap:            SPACING.sm,
          paddingTop:     10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.border,
        },
        actionPrimary: {
          flex:           1,
          flexDirection:  'row',
          alignItems:     'center',
          justifyContent: 'center',
          paddingVertical: 9,
          borderRadius:   RADIUS.sm,
          gap:            5,
          backgroundColor: withAlpha(c.primary, 0.13),
          minHeight:      36,
        },
        actionPrimaryText: {
          fontSize:   12,
          fontWeight: '700',
          color:      c.primary,
        },
        iconBtn: {
          width:          38,
          height:         38,
          alignItems:     'center',
          justifyContent: 'center',
          borderRadius:   RADIUS.sm,
          borderWidth:    1,
          borderColor:    c.border,
        },
      }),
    [c, isDark, shadows, stripeColor, statusColors, dividerColor],
  );

  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      activeOpacity={1}
      disabled={!onPress}
    >
      <Animated.View
        style={[s.card, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* Status stripe — absolute so Android elevation is unclipped */}
        <View style={s.stripe} />

        <View style={s.inner}>
          {/* Banners */}
          {(job.urgent || job.featured) && (
            <View style={s.bannerRow}>
              {job.urgent && (
                <View style={[s.banner, { backgroundColor: withAlpha(c.danger, 0.10) }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: c.danger }}>
                    URGENT
                  </Text>
                </View>
              )}
              {job.featured && (
                <View style={[s.banner, { backgroundColor: withAlpha(c.warning, 0.10) }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: c.warning }}>
                    FEATURED
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* FIXED: Header with Avatar */}
          <View style={s.header}>
            <Avatar entity={ownerEntity} size={48} borderRadius={RADIUS.md} />

            <View style={[s.titleBlock, { marginLeft: 12 }]}>
              <Text style={s.title} numberOfLines={2}>
                {job.title}
              </Text>
              <Text style={s.category} numberOfLines={1}>
                {(job.category ?? '').replace(/-/g, ' ')}
              </Text>
            </View>

            <View style={s.statusBadge}>
              <View style={s.statusDot} />
              <Text style={s.statusText}>
                {(job.status ?? 'DRAFT').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Stats strip */}
          <View style={s.statsStrip}>
            <StatCell
              icon="people-outline"
              value={appCount}
              label="Applied"
              color={c.info}
              textColor={c.text}
              mutedColor={c.textMuted}
              dividerColor={dividerColor}
              showDivider
            />
            <StatCell
              icon="eye-outline"
              value={job.viewCount ?? 0}
              label="Views"
              color={c.warning}
              textColor={c.text}
              mutedColor={c.textMuted}
              dividerColor={dividerColor}
              showDivider
            />
            <StatCell
              icon="person-outline"
              value={job.candidatesNeeded ?? 1}
              label="Needed"
              color={c.success}
              textColor={c.text}
              mutedColor={c.textMuted}
              dividerColor={dividerColor}
              showDivider
            />
            <StatCell
              icon="bookmark-outline"
              value={job.saveCount ?? 0}
              label="Saves"
              color={c.primary}
              textColor={c.text}
              mutedColor={c.textMuted}
              dividerColor={dividerColor}
            />
          </View>

          {/* Meta */}
          <View style={s.meta}>
            {job.location && (
              <View style={s.metaItem}>
                <Ionicons name="location-outline" size={11} color={c.textMuted} />
                <Text style={s.metaText} numberOfLines={1}>
                  {formatLocation(job.location)}
                </Text>
              </View>
            )}
            {deadlineText && (
              <View style={s.metaItem}>
                <Ionicons name="time-outline" size={11} color={c.textMuted} />
                <Text style={s.metaText}>{deadlineText}</Text>
              </View>
            )}
            {job.type && (
              <View style={s.typePill}>
                <Text style={s.typePillText}>{job.type}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity
              style={s.actionPrimary}
              onPress={onViewApplicants}
              activeOpacity={0.75}
            >
              <Ionicons name="people-outline" size={15} color={c.primary} />
              <Text style={s.actionPrimaryText}>
                Applicants ({appCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.iconBtn}
              onPress={onEdit}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Edit job"
            >
              <Ionicons name="create-outline" size={17} color={c.textSecondary} />
            </TouchableOpacity>

            {onToggleStatus && (
              <TouchableOpacity
                style={[
                  s.iconBtn,
                  {
                    borderColor:
                      job.status === 'active'
                        ? withAlpha(c.warning, 0.30)
                        : withAlpha(c.success, 0.30),
                  },
                ]}
                onPress={() =>
                  onToggleStatus(job.status === 'active' ? 'paused' : 'active')
                }
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                accessibilityRole="button"
                accessibilityLabel={
                  job.status === 'active' ? 'Pause job' : 'Activate job'
                }
              >
                <Ionicons
                  name={
                    job.status === 'active'
                      ? 'pause-circle-outline'
                      : 'play-circle-outline'
                  }
                  size={17}
                  color={
                    job.status === 'active' ? c.warning : c.success
                  }
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[s.iconBtn, { borderColor: withAlpha(c.danger, 0.25) }]}
              onPress={confirmDelete}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Delete job"
            >
              <Ionicons name="trash-outline" size={17} color={c.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

CompanyJobCard.displayName = 'CompanyJobCard';