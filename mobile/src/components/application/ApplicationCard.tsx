/**
 * src/components/application/ApplicationCard.tsx
 * Candidate-facing application card with company logo, status, progress pipeline.
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import {
  Application, ApplicationStatus,
  STATUS_LABELS, STATUS_COLORS, STATUS_COLORS_DARK,
  STATUS_PIPELINE, applicationService,
} from '../../services/applicationService';

const formatDate = (d?: string): string => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  if (diff < 7) return `${diff} days ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getInitials = (name?: string) =>
  (name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

interface ApplicationCardProps {
  application: Application;
  onPress: () => void;
  onWithdraw?: () => void;
}

export const ApplicationCard = memo<ApplicationCardProps>(({ application, onPress, onWithdraw }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const isDark = theme.isDark;

  const SC = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc = SC[application.status] ?? SC.applied;

  const owner = application.job?.company ?? application.job?.organization;
  const logoUrl = owner?.logoUrl;
  const ownerColor = application.job?.jobType === 'organization' ? '#7C3AED' : '#2563EB';

  const pipelineIdx = STATUS_PIPELINE.indexOf(application.status as ApplicationStatus);
  const canWithdraw = applicationService.canWithdraw(application.status);

  const confirmWithdraw = () => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this application? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Withdraw', style: 'destructive', onPress: onWithdraw },
      ],
    );
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={[s.card, { backgroundColor: c.card ?? c.surface, borderColor: c.border }]}>
      {/* Header */}
      <View style={s.header}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={[s.logo, { borderColor: c.border }]} />
        ) : (
          <View style={[s.logoFallback, { backgroundColor: ownerColor }]}>
            <Text style={s.logoInitials}>{getInitials(owner?.name)}</Text>
          </View>
        )}
        <View style={s.headerInfo}>
          <Text style={[s.jobTitle, { color: c.text }]} numberOfLines={2}>{application.job?.title ?? 'Position'}</Text>
          <View style={s.ownerRow}>
            <Text style={[s.ownerName, { color: c.primary }]} numberOfLines={1}>{owner?.name ?? ''}</Text>
            {owner?.verified && <Ionicons name="checkmark-circle" size={13} color={c.primary} style={{ marginLeft: 3 }} />}
          </View>
        </View>
        <View style={[s.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
          <Text style={[s.statusText, { color: sc.text }]} numberOfLines={1}>
            {STATUS_LABELS[application.status as ApplicationStatus] ?? application.status}
          </Text>
        </View>
      </View>

      {/* Progress pipeline */}
      {pipelineIdx >= 0 && (
        <View style={s.pipeline}>
          {STATUS_PIPELINE.map((st, i) => {
            const done   = i < pipelineIdx;
            const active = i === pipelineIdx;
            return (
              <React.Fragment key={st}>
                <View style={[
                  s.pipeDot,
                  done   && { backgroundColor: '#10B981', borderColor: '#10B981' },
                  active && { backgroundColor: c.primary, borderColor: c.primary },
                  !done && !active && { borderColor: c.border },
                ]}>
                  {done && <Ionicons name="checkmark" size={9} color="#fff" />}
                  {active && <View style={[s.pipeActiveDot, { backgroundColor: '#fff' }]} />}
                </View>
                {i < STATUS_PIPELINE.length - 1 && (
                  <View style={[s.pipeLine, { backgroundColor: done ? '#10B981' : c.border }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}

      {/* Skills */}
      {(application.skills ?? []).length > 0 && (
        <View style={s.skillsRow}>
          {application.skills.slice(0, 4).map((sk, i) => (
            <View key={i} style={[s.skillTag, { backgroundColor: `${c.primary}10`, borderColor: `${c.primary}20` }]}>
              <Text style={[s.skillTagText, { color: c.primary }]}>{sk}</Text>
            </View>
          ))}
          {application.skills.length > 4 && (
            <Text style={[s.skillMore, { color: c.textMuted }]}>+{application.skills.length - 4}</Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={[s.footer, { borderTopColor: c.border }]}>
        <View style={s.footerLeft}>
          <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
          <Text style={[s.footerDate, { color: c.textMuted }]}>{formatDate(application.createdAt)}</Text>
          {(application.selectedCVs?.length ?? 0) > 0 && (
            <>
              <View style={[s.dot, { backgroundColor: c.border }]} />
              <Ionicons name="document-outline" size={12} color={c.textMuted} />
              <Text style={[s.footerDate, { color: c.textMuted }]}>{application.selectedCVs.length} CV</Text>
            </>
          )}
        </View>
        {canWithdraw && onWithdraw && (
          <TouchableOpacity onPress={confirmWithdraw} style={[s.withdrawBtn, { borderColor: c.error }]}>
            <Text style={[s.withdrawText, { color: c.error }]}>Withdraw</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

ApplicationCard.displayName = 'ApplicationCard';

const s = StyleSheet.create({
  card:        { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  header:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  logo:        { width: 48, height: 48, borderRadius: 12, borderWidth: 1, resizeMode: 'cover' },
  logoFallback:{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoInitials:{ color: '#fff', fontWeight: '700', fontSize: 16 },
  headerInfo:  { flex: 1 },
  jobTitle:    { fontSize: 15, fontWeight: '700', lineHeight: 21, marginBottom: 3 },
  ownerRow:    { flexDirection: 'row', alignItems: 'center' },
  ownerName:   { fontSize: 13, fontWeight: '600' },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, flexShrink: 1 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 10, fontWeight: '700' },
  pipeline:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pipeDot:     { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pipeActiveDot:{ width: 6, height: 6, borderRadius: 3 },
  pipeLine:    { flex: 1, height: 2 },
  skillsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  skillTag:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  skillTagText:{ fontSize: 11, fontWeight: '600' },
  skillMore:   { fontSize: 11, alignSelf: 'center' },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  footerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerDate:  { fontSize: 11 },
  dot:         { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 2 },
  withdrawBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  withdrawText:{ fontSize: 11, fontWeight: '700' },
});
