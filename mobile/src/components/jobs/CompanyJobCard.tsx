/**
 * mobile/src/components/jobs/CompanyJobCard.tsx
 * Management-focused card with status badge, stats, and action buttons.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Job } from '../../services/jobService';
import { getJobStatusColor, formatDeadline, formatPostedDate, formatLocation } from '../../utils/jobHelpers';

interface Props {
  job:                Job;
  onEdit:             () => void;
  onDelete:           () => void;
  onViewApplicants:   () => void;
  onPress?:           () => void;                                    // ← add this
  onToggleStatus?:    (newStatus: 'active' | 'paused' | 'closed') => void;
}

export const CompanyJobCard = React.memo<Props>(({ job, onEdit, onDelete, onViewApplicants, onToggleStatus }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const sc = getJobStatusColor(job.status, theme.isDark);

  const shadow = Platform.OS === 'ios'
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10 }
    : { elevation: 3 };

  const appCount = job.applicationCount ?? 0;
  const deadline = formatDeadline(job.applicationDeadline);

  const confirmDelete = () =>
    Alert.alert('Delete Job', `Delete "${job.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);

  function onPress(event: GestureResponderEvent): void {
    throw new Error('Function not implemented.');
  }

  return (
    <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderLeftColor: sc.border, borderLeftWidth: 4 }, shadow]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.titleBlock}>
          <Text style={[s.title, { color: c.text }]} numberOfLines={2}>{job.title}</Text>
          <Text style={[s.category, { color: c.textMuted }]}>{job.category?.replace(/-/g, ' ')}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
          <View style={[s.dot, { backgroundColor: sc.text }]} />
          <Text style={[s.statusText, { color: sc.text }]}>{job.status?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={[s.statsRow, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC', borderColor: c.border }]}>
        {[
          { icon: 'people-outline',    value: appCount,                      label: 'Applicants' },
          { icon: 'eye-outline',       value: job.viewCount ?? 0,            label: 'Views' },
          { icon: 'person-outline',    value: job.candidatesNeeded ?? 1,     label: 'Needed' },
        ].map((stat, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={[s.statDivider, { backgroundColor: c.border }]} />}
            <View style={s.stat}>
              <Ionicons name={stat.icon as any} size={15} color={c.primary} />
              <Text style={[s.statValue, { color: c.text }]}>{stat.value}</Text>
              <Text style={[s.statLabel, { color: c.textMuted }]}>{stat.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Meta */}
      <View style={s.meta}>
        <View style={s.metaItem}>
          <Ionicons name="location-outline" size={12} color={c.textMuted} />
          {/* ✅ FIX: use formatLocation instead of raw job.location?.region */}
          <Text style={[s.metaText, { color: c.textMuted }]}>{formatLocation(job.location)}</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="time-outline" size={12} color={c.textMuted} />
          <Text style={[s.metaText, { color: c.textMuted }]}>{deadline}</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
          <Text style={[s.metaText, { color: c.textMuted }]}>{formatPostedDate(job.createdAt)}</Text>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity  onPress={onPress}
  style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderLeftColor: sc.border, borderLeftWidth: 4 }, shadow]}
>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: c.primaryLight }]} onPress={onViewApplicants} activeOpacity={0.75}>
          <Ionicons name="people-outline" size={15} color={c.primary} />
          <Text style={[s.actionText, { color: c.primary }]}>Applicants ({appCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.iconBtn, { borderColor: c.border }]} onPress={onEdit} activeOpacity={0.75} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Ionicons name="create-outline" size={18} color={c.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.iconBtn, { borderColor: c.errorLight }]} onPress={confirmDelete} activeOpacity={0.75} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Ionicons name="trash-outline" size={18} color={c.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
});

CompanyJobCard.displayName = 'CompanyJobCard';

const s = StyleSheet.create({
  card:         { borderRadius: 16, borderWidth: 1, padding: 16, overflow: 'hidden' },
  header:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  titleBlock:   { flex: 1 },
  title:        { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  category:     { fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, gap: 5 },
  dot:          { width: 6, height: 6, borderRadius: 3 },
  statusText:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  statsRow:     { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  stat:         { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  statDivider:  { width: 1 },
  statValue:    { fontSize: 18, fontWeight: '800' },
  statLabel:    { fontSize: 10 },
  meta:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  metaItem:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:     { fontSize: 12 },
  actions:      { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1 },
  actionBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10, gap: 6 },
  actionText:   { fontSize: 13, fontWeight: '700' },
  iconBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1 },
});