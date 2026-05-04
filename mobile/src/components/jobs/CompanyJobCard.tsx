/**
 * src/components/jobs/CompanyJobCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Company owner job card — redesigned with:
 * - Universal Avatar component
 * - Modern stats strip
 * - Clean action row
 * - Animated press micro-interaction
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useRef, useCallback, memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Job } from '../../services/jobService';
import { Avatar, jobOwnerToEntity } from '../shared/Avatar';
import { formatDeadline, formatPostedDate, formatLocation } from '../../utils/jobHelpers';
import { getJobStatusColor } from '../../utils/jobHelpers';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  job: Job;
  onEdit: () => void;
  onDelete: () => void;
  onViewApplicants: () => void;
  onPress?: () => void;
  onToggleStatus?: (newStatus: 'active' | 'paused' | 'closed') => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCell = ({ icon, value, label, color, c }: {
  icon: string; value: number | string; label: string; color: string; c: any;
}) => (
  <View style={st.cell}>
    <Ionicons name={icon as any} size={14} color={color} />
    <Text style={[st.val, { color: c.textPrimary }]}>{value}</Text>
    <Text style={[st.label, { color: c.textMuted }]}>{label}</Text>
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const CompanyJobCard = memo<Props>(({
  job, onEdit, onDelete, onViewApplicants, onPress, onToggleStatus,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const isDark = theme.isDark;

  const sc = getJobStatusColor(job.status, isDark);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.976, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
  }, [scaleAnim]);
  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
  }, [scaleAnim]);

  const confirmDelete = () =>
    Alert.alert('Delete Job', `Delete "${job.title ?? 'this job'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);

  const ownerEntity = jobOwnerToEntity(job);
  const appCount = job.applicationCount ?? 0;
  const deadline = formatDeadline(job.applicationDeadline);

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
          cjc.card,
          {
            backgroundColor: isDark ? c.card : '#fff',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            shadowColor: isDark ? '#000' : '#0A2540',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isDark ? 0.3 : 0.07,
            shadowRadius: 14,
            elevation: 4,
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Left accent bar — status color */}
        <View style={[cjc.accentBar, { backgroundColor: sc.border }]} />

        <View style={cjc.inner}>
          {/* Banners */}
          {(job.urgent || job.featured) && (
            <View style={cjc.bannerRow}>
              {job.urgent && (
                <View style={[cjc.banner, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>⚡ URGENT</Text>
                </View>
              )}
              {job.featured && (
                <View style={[cjc.banner, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#D97706' }}>★ FEATURED</Text>
                </View>
              )}
            </View>
          )}

          {/* Header */}
          <View style={cjc.header}>
            <Avatar
              entity={ownerEntity}
              size={48}
              borderRadius={13}
            />

            <View style={[cjc.titleBlock, { marginLeft: 12 }]}>
              <Text style={[cjc.title, { color: c.text }]} numberOfLines={2}>
                {job.title}
              </Text>
              <Text style={[cjc.category, { color: c.textMuted }]}>
                {(job.category ?? '').replace(/-/g, ' ')}
              </Text>
            </View>

            <View style={[cjc.statusBadge, { backgroundColor: sc.bg }]}>
              <View style={[cjc.statusDot, { backgroundColor: sc.text }]} />
              <Text style={[cjc.statusText, { color: sc.text }]}>
                {(job.status ?? 'draft').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Stats strip */}
          <View style={[
            st.strip,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            },
          ]}>
            <StatCell icon="people-outline"   value={appCount}              label="Applied"  color="#3B82F6" c={c} />
            <View style={[st.div, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]} />
            <StatCell icon="eye-outline"      value={job.viewCount ?? 0}    label="Views"    color="#F59E0B" c={c} />
            <View style={[st.div, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]} />
            <StatCell icon="person-outline"   value={job.candidatesNeeded ?? 1} label="Needed" color="#10B981" c={c} />
            <View style={[st.div, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]} />
            <StatCell icon="bookmark-outline" value={job.saveCount ?? 0}    label="Saves"    color="#8B5CF6" c={c} />
          </View>

          {/* Meta */}
          <View style={cjc.meta}>
            {job.location && (
              <View style={cjc.metaItem}>
                <Ionicons name="location-outline" size={11} color={c.textMuted} />
                <Text style={[cjc.metaText, { color: c.textMuted }]} numberOfLines={1}>
                  {formatLocation(job.location)}
                </Text>
              </View>
            )}
            {deadline && (
              <View style={cjc.metaItem}>
                <Ionicons name="time-outline" size={11} color={c.textMuted} />
                <Text style={[cjc.metaText, { color: c.textMuted }]}>{deadline}</Text>
              </View>
            )}
            {job.type && (
              <View style={[cjc.typePill, { backgroundColor: `${c.primary ?? '#1A73E8'}15` }]}>
                <Text style={[cjc.typePillText, { color: c.primary ?? '#1A73E8' }]}>{job.type}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={[cjc.actions, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity
              style={[cjc.actionPrimary, { backgroundColor: `${c.primary ?? '#1A73E8'}15` }]}
              onPress={onViewApplicants}
              activeOpacity={0.75}
            >
              <Ionicons name="people-outline" size={15} color={c.primary ?? '#1A73E8'} />
              <Text style={[cjc.actionPrimaryText, { color: c.primary ?? '#1A73E8' }]}>
                Applicants ({appCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[cjc.iconBtn, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)' }]}
              onPress={onEdit}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="create-outline" size={17} color={c.textSecondary} />
            </TouchableOpacity>

            {onToggleStatus && (
              <TouchableOpacity
                style={[
                  cjc.iconBtn,
                  {
                    borderColor: job.status === 'active'
                      ? 'rgba(245,158,11,0.3)'
                      : 'rgba(16,185,129,0.3)',
                  },
                ]}
                onPress={() => onToggleStatus(job.status === 'active' ? 'paused' : 'active')}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons
                  name={job.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={17}
                  color={job.status === 'active' ? '#F59E0B' : '#10B981'}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[cjc.iconBtn, { borderColor: 'rgba(239,68,68,0.25)' }]}
              onPress={confirmDelete}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const cjc = StyleSheet.create({
  card:        { flexDirection: 'row', borderRadius: 20, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  accentBar:   { width: 4 },
  inner:       { flex: 1, padding: 14 },
  bannerRow:   { flexDirection: 'row', gap: 6, marginBottom: 10 },
  banner:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  header:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  titleBlock:  { flex: 1 },
  title:       { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  category:    { fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  meta:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:    { fontSize: 11 },
  typePill:    { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  typePillText: { fontSize: 10, fontWeight: '700' },
  actions:     { flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  actionPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10, gap: 5 },
  actionPrimaryText: { fontSize: 12, fontWeight: '700' },
  iconBtn:     { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1 },
});

const st = StyleSheet.create({
  strip:  { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  cell:   { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 1 },
  div:    { width: 1 },
  val:    { fontSize: 15, fontWeight: '800' },
  label:  { fontSize: 9, fontWeight: '600' },
});