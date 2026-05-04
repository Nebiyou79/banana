/**
 * src/components/application/ApplicationCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Candidate-facing application card — complete redesign with:
 * - Universal Avatar for company/org logos (no more broken images)
 * - Status pipeline progress bar
 * - Modern badge + chip design
 * - Memoized for FlashList performance
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Application,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../services/applicationService';
import { Avatar, jobOwnerToEntity } from '../shared/Avatar';

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const STATUS_PIPELINE: ApplicationStatus[] = [
  'applied', 'under-review', 'shortlisted', 'interview-scheduled', 'offer-made',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ApplicationCardProps {
  application: Application;
  onPress: () => void;
  onWithdraw?: () => void;
  colors: any;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ApplicationCard = memo<ApplicationCardProps>(
  ({ application, onPress, onWithdraw, colors: c }) => {
    const appStatus   = application.status as ApplicationStatus;
    const sc          = STATUS_COLORS[appStatus] ?? STATUS_COLORS['applied'];
    const statusLabel = STATUS_LABELS[appStatus] ?? application.status;

    // Build entity for Avatar using the same job owner logic
    const ownerEntity = application.job
      ? jobOwnerToEntity({
          jobType: application.job.jobType,
          company: application.job.company,
          organization: application.job.organization,
        })
      : { type: 'generic' as const, name: '?' };

    const owner = application.job?.jobType === 'organization'
      ? application.job?.organization
      : application.job?.company;

    const pipelineIdx = STATUS_PIPELINE.indexOf(appStatus);
    const isDark = !c.bgCard?.includes('fff'); // rough dark detection

    const dateLabel = new Date(application.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          ac.card,
          {
            backgroundColor: isDark ? (c.bgCard ?? c.surface) : '#fff',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            shadowColor: isDark ? '#000' : '#0A2540',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.07,
            shadowRadius: 10,
            elevation: 3,
          },
        ]}
        activeOpacity={0.78}
      >
        {/* Status stripe */}
        <View style={[ac.stripe, { backgroundColor: sc.dot }]} />

        <View style={ac.content}>
          {/* Top row */}
          <View style={ac.topRow}>
            <Avatar
              entity={ownerEntity}
              size={48}
              borderRadius={13}
              verified={owner?.verified}
            />

            <View style={ac.headerInfo}>
              <Text style={[ac.jobTitle, { color: c.text ?? c.textPrimary }]} numberOfLines={2}>
                {application.job?.title ?? 'Position'}
              </Text>
              <View style={ac.ownerRow}>
                <Text style={[ac.ownerName, { color: c.primary }]} numberOfLines={1}>
                  {owner?.name ?? ''}
                </Text>
                {owner?.verified && (
                  <Ionicons name="checkmark-circle" size={13} color={c.primary} style={{ marginLeft: 3 }} />
                )}
              </View>
            </View>

            <View style={[ac.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
              <View style={[ac.statusDot, { backgroundColor: sc.dot }]} />
              <Text style={[ac.statusText, { color: sc.text }]} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Pipeline progress */}
          {pipelineIdx >= 0 && (
            <View style={ac.pipeline}>
              {STATUS_PIPELINE.map((st, i) => {
                const done   = i < pipelineIdx;
                const active = i === pipelineIdx;
                return (
                  <React.Fragment key={st}>
                    <View style={[
                      ac.pipeDot,
                      done   && { backgroundColor: '#10B981', borderColor: '#10B981' },
                      active && { backgroundColor: c.primary, borderColor: c.primary },
                      !done && !active && {
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                        backgroundColor: 'transparent',
                      },
                    ]}>
                      {done && <Ionicons name="checkmark" size={9} color="#fff" />}
                      {active && <View style={[ac.pipeActiveDot, { backgroundColor: '#fff' }]} />}
                    </View>
                    {i < STATUS_PIPELINE.length - 1 && (
                      <View style={[
                        ac.pipeLine,
                        {
                          backgroundColor: done
                            ? '#10B981'
                            : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                        },
                      ]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {/* Skills */}
          {(application.skills ?? []).length > 0 && (
            <View style={ac.skillRow}>
              {application.skills.slice(0, 3).map((sk) => (
                <View
                  key={sk}
                  style={[ac.skillChip, {
                    backgroundColor: `${c.primary}12`,
                    borderColor: `${c.primary}28`,
                  }]}
                >
                  <Text style={[ac.skillText, { color: c.primary }]}>{sk}</Text>
                </View>
              ))}
              {application.skills.length > 3 && (
                <Text style={[ac.moreSkills, { color: c.textMuted }]}>
                  +{application.skills.length - 3}
                </Text>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={ac.footer}>
            <View style={ac.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
              <Text style={[ac.date, { color: c.textMuted }]}>{dateLabel}</Text>
            </View>
            {onWithdraw && appStatus === 'applied' && (
              <TouchableOpacity
                onPress={onWithdraw}
                style={ac.withdrawBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={ac.withdrawText}>Withdraw</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

ApplicationCard.displayName = 'ApplicationCard';

// ─── Styles ───────────────────────────────────────────────────────────────────

const ac = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  stripe:      { width: 4 },
  content:     { flex: 1, padding: 13 },
  topRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  headerInfo:  { flex: 1 },
  jobTitle:    { fontSize: 14, fontWeight: '700', lineHeight: 19, marginBottom: 3 },
  ownerRow:    { flexDirection: 'row', alignItems: 'center' },
  ownerName:   { fontSize: 12, fontWeight: '600' },
  statusPill:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 10, fontWeight: '700' },

  pipeline:      { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  pipeDot:       { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pipeActiveDot: { width: 6, height: 6, borderRadius: 3 },
  pipeLine:      { flex: 1, height: 2 },

  skillRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 9 },
  skillChip:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  skillText:   { fontSize: 10, fontWeight: '600' },
  moreSkills:  { fontSize: 10, alignSelf: 'center' },

  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date:        { fontSize: 11 },
  withdrawBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  withdrawText: { color: '#EF4444', fontSize: 11, fontWeight: '600' },
});