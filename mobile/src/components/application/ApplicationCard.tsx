/**
 * src/components/application/ApplicationCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX: Shows real company/org logo using Image component (was using a
 * placeholder fallback View even when logoUrl existed).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Application,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../services/applicationService';

// ─── Pipeline order ───────────────────────────────────────────────────────────

const STATUS_PIPELINE: ApplicationStatus[] = [
  'applied', 'under-review', 'shortlisted', 'interview-scheduled', 'offer-made',
];

const getInitials = (name?: string): string =>
  (name ?? '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

// ─── Company Logo ─────────────────────────────────────────────────────────────

const OwnerLogo: React.FC<{
  logoUrl?: string;
  name?: string;
  color: string;
  size?: number;
}> = ({ logoUrl, name, color, size = 44 }) => {
  const initials = getInitials(name);
  const radius = size * 0.22;

  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth: 1.5,
          borderColor: `${color}30`,
        }}
        defaultSource={undefined}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.32, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
};

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

    const isOrg    = application.job?.jobType === 'organization';
    const owner    = isOrg ? application.job?.organization : application.job?.company;
    const logoUrl  = (owner as any)?.logoUrl ?? (owner as any)?.logo;
    const ownerColor = isOrg ? '#7C3AED' : '#F1BB03';

    const pipelineIdx = STATUS_PIPELINE.indexOf(appStatus);

    const dateLabel = new Date(application.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

    return (
      <TouchableOpacity
        onPress={onPress}
        style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}
        activeOpacity={0.75}
      >
        {/* Status stripe on left edge */}
        <View style={[s.stripe, { backgroundColor: sc.dot }]} />

        <View style={s.content}>
          {/* Top row: logo + title + status */}
          <View style={s.topRow}>
            {/* ── Company/Org Logo (real Image if available) ── */}
            <OwnerLogo
              logoUrl={logoUrl}
              name={owner?.name}
              color={ownerColor}
              size={44}
            />

            <View style={s.headerInfo}>
              <Text style={[s.jobTitle, { color: c.text }]} numberOfLines={2}>
                {application.job?.title ?? 'Position'}
              </Text>
              <View style={s.ownerRow}>
                <Text style={[s.ownerName, { color: c.primary }]} numberOfLines={1}>
                  {owner?.name ?? ''}
                </Text>
                {(owner as any)?.verified && (
                  <Ionicons name="checkmark-circle" size={13} color={c.primary} style={{ marginLeft: 3 }} />
                )}
              </View>
            </View>

            <View style={[s.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
              <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
              <Text style={[s.statusText, { color: sc.text }]} numberOfLines={1}>
                {statusLabel}
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
                    <View
                      style={[
                        s.pipeDot,
                        done   && { backgroundColor: '#10B981', borderColor: '#10B981' },
                        active && { backgroundColor: c.primary, borderColor: c.primary },
                        !done && !active && { borderColor: c.border },
                      ]}
                    >
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

          {/* Skills chips (max 3) */}
          {(application.skills ?? []).length > 0 && (
            <View style={s.skillRow}>
              {application.skills.slice(0, 3).map((sk) => (
                <View key={sk} style={[s.skillChip, { backgroundColor: `${c.primary}12`, borderColor: `${c.primary}30` }]}>
                  <Text style={[s.skillText, { color: c.primary }]}>{sk}</Text>
                </View>
              ))}
              {application.skills.length > 3 && (
                <Text style={[s.moreSkills, { color: c.textMuted }]}>
                  +{application.skills.length - 3}
                </Text>
              )}
            </View>
          )}

          {/* Footer: date + withdraw */}
          <View style={s.footer}>
            <View style={s.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={c.textMuted} />
              <Text style={[s.date, { color: c.textMuted }]}>{dateLabel}</Text>
            </View>
            {onWithdraw && appStatus === 'applied' && (
              <TouchableOpacity
                onPress={onWithdraw}
                style={[s.withdrawBtn, { borderColor: '#EF444440' }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={s.withdrawText}>Withdraw</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card:         { flexDirection: 'row', borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  stripe:       { width: 4 },
  content:      { flex: 1, padding: 12 },
  topRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  headerInfo:   { flex: 1 },
  jobTitle:     { fontSize: 14, fontWeight: '700', lineHeight: 18, marginBottom: 2 },
  ownerRow:     { flexDirection: 'row', alignItems: 'center' },
  ownerName:    { fontSize: 12, fontWeight: '600' },
  statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  statusDot:    { width: 6, height: 6, borderRadius: 3 },
  statusText:   { fontSize: 10, fontWeight: '700' },
  pipeline:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  pipeDot:      { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pipeActiveDot:{ width: 6, height: 6, borderRadius: 3 },
  pipeLine:     { flex: 1, height: 2 },
  skillRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  skillChip:    { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  skillText:    { fontSize: 10, fontWeight: '600' },
  moreSkills:   { fontSize: 10, alignSelf: 'center' },
  footer:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date:         { fontSize: 11 },
  withdrawBtn:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  withdrawText: { color: '#EF4444', fontSize: 11, fontWeight: '600' },
});