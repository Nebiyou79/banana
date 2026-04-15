/**
 * mobile/src/components/applications/ApplicationCard.tsx
 *
 * Candidate-facing application row card used on the My Applications list.
 * Shows job title, company, status badge, timeline, and quick actions.
 * Mirrors the web CandidateApplicationDetails list item.
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
  applicationService,
} from '../../services/applicationService';
import { formatDate, getCompanyInitials } from '../../utils/jobHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplicationCardProps {
  application: Application;
  onPress: () => void;
  onWithdraw?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application, onPress, onWithdraw,
}) => {
  const { theme: { colors, isDark, shadows } } = useThemeStore();
  const c = colors;

  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

  const SC     = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc     = SC[application.status] ?? SC.applied;
  const owner  = application.job?.company ?? application.job?.organization;
  const canWd  = applicationService.canWithdraw(application.status);

  // Progress indicator — which steps are complete
  const statusOrder: ApplicationStatus[] = [
    'applied', 'under-review', 'shortlisted', 'interview-scheduled', 'offer-made',
  ];
  const stepIdx = statusOrder.indexOf(application.status as ApplicationStatus);

  return (
    <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
      <Animated.View style={[s.card, { backgroundColor: c.card, borderColor: c.border, transform: [{ scale }] }, shadows.sm]}>

        {/* ── Header row ── */}
        <View style={s.header}>
          {/* Company avatar */}
          <View style={[s.avatar, { backgroundColor: c.primaryLight }]}>
            <Text style={[s.avatarText, { color: c.primary }]}>
              {getCompanyInitials(owner?.name)}
            </Text>
          </View>

          {/* Job info */}
          <View style={s.info}>
            <Text style={[s.jobTitle, { color: c.text }]} numberOfLines={2}>
              {application.job?.title ?? 'Job Position'}
            </Text>
            <View style={s.companyRow}>
              <Text style={[s.company, { color: c.textSecondary }]} numberOfLines={1}>
                {owner?.name ?? '—'}
              </Text>
              {application.job?.type && (
                <>
                  <Text style={[s.dot, { color: c.border }]}>·</Text>
                  <Text style={[s.jobType, { color: c.textMuted }]}>{application.job.type}</Text>
                </>
              )}
            </View>
          </View>

          {/* Status badge */}
          <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
            <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[s.statusText, { color: sc.text }]}>{STATUS_LABELS[application.status]}</Text>
          </View>
        </View>

        {/* ── Progress track (for positive statuses) ── */}
        {stepIdx >= 0 && !['rejected', 'withdrawn', 'on-hold', 'offer-rejected'].includes(application.status) && (
          <View style={s.progressRow}>
            {statusOrder.map((st, i) => {
              const done = i <= stepIdx;
              const col  = done ? c.primary : c.border;
              return (
                <React.Fragment key={st}>
                  <View style={[s.progDot, { backgroundColor: col, borderColor: col }]}>
                    {done && <Ionicons name="checkmark" size={8} color="#fff" />}
                  </View>
                  {i < statusOrder.length - 1 && (
                    <View style={[s.progLine, { backgroundColor: i < stepIdx ? c.primary : c.border }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        )}

        {/* ── Company response message ── */}
        {application.companyResponse?.message && (
          <View style={[s.messageBox, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: c.border }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={c.primary} />
            <Text style={[s.messageText, { color: c.textSecondary }]} numberOfLines={2}>
              {application.companyResponse.message}
            </Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={[s.footer, { borderTopColor: c.border }]}>
          <View style={s.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
            <Text style={[s.date, { color: c.textMuted }]}>Applied {formatDate(application.createdAt)}</Text>
          </View>
          <View style={s.actions}>
            {canWd && onWithdraw && (
              <TouchableOpacity style={[s.wdBtn, { borderColor: c.error }]} onPress={onWithdraw}>
                <Text style={[s.wdText, { color: c.error }]}>Withdraw</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.viewBtn} onPress={onPress}>
              <Text style={[s.viewText, { color: c.primary }]}>View</Text>
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
  avatar:      { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 16, fontWeight: '700' },
  info:        { flex: 1 },
  jobTitle:    { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  companyRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  company:     { fontSize: 13 },
  dot:         { fontSize: 12, marginHorizontal: 5 },
  jobType:     { fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4, alignSelf: 'flex-start' },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 11, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  progDot:     { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  progLine:    { flex: 1, height: 2 },
  messageBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 10 },
  messageText: { flex: 1, fontSize: 13, lineHeight: 18 },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date:        { fontSize: 11 },
  actions:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wdBtn:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  wdText:      { fontSize: 12, fontWeight: '600' },
  viewBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText:    { fontSize: 13, fontWeight: '600' },
});
