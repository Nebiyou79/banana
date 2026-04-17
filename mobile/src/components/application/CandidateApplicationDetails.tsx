/**
 * src/components/application/CandidateApplicationDetails.tsx
 * Full application detail view for the candidate.
 * Shows: status banner, company response, timeline, cover letter, CVs, skills, experience, refs.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import {
  Application, ApplicationStatus,
  STATUS_LABELS, STATUS_COLORS, STATUS_COLORS_DARK,
  applicationService,
} from '../../services/applicationService';
import { useWithdrawApplication } from '../../hooks/useApplications';

interface Props {
  application: Application;
  onWithdraw?: () => void;
}

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

export const CandidateApplicationDetails: React.FC<Props> = ({ application, onWithdraw }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const isDark = theme.isDark;
  const SC = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc = SC[application.status] ?? SC.applied;

  const withdrawMut = useWithdrawApplication();
  const canWithdraw = applicationService.canWithdraw(application.status);

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw', style: 'destructive',
          onPress: () => withdrawMut.mutate(application._id, { onSuccess: onWithdraw }),
        },
      ],
    );
  };

  return (
    <View>
      {/* Status banner */}
      <View style={[cd.statusBanner, { backgroundColor: sc.bg, borderColor: sc.border }]}>
        <View style={[cd.statusDot, { backgroundColor: sc.dot }]} />
        <View style={{ flex: 1 }}>
          <Text style={[cd.statusLabel, { color: sc.text }]}>
            {STATUS_LABELS[application.status as ApplicationStatus] ?? application.status}
          </Text>
          {application.statusHistory?.length > 0 && (
            <Text style={[cd.statusDate, { color: sc.text, opacity: 0.7 }]}>
              Updated {fmt(application.statusHistory[application.statusHistory.length - 1]?.changedAt)}
            </Text>
          )}
        </View>
        {canWithdraw && (
          <TouchableOpacity
            onPress={handleWithdraw}
            disabled={withdrawMut.isPending}
            style={[cd.withdrawBtn, { borderColor: c.error }]}
          >
            {withdrawMut.isPending
              ? <ActivityIndicator size="small" color={c.error} />
              : <Text style={[cd.withdrawText, { color: c.error }]}>Withdraw</Text>}
          </TouchableOpacity>
        )}
      </View>

      {/* Company response */}
      {application.companyResponse?.status && (
        <SectionCard title="Employer Response" icon="chatbubble-outline" iconColor="#10B981" c={c}>
          <View style={[cd.responseBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <Text style={[cd.responseLabel, { color: '#065F46' }]}>
              Status: {application.companyResponse.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            {application.companyResponse.message && (
              <Text style={[cd.responseText, { color: '#065F46' }]}>{application.companyResponse.message}</Text>
            )}
            {application.companyResponse.interviewDate && (
              <View style={cd.interviewDetails}>
                <InfoRow icon="calendar-outline" label="Interview Date" value={fmt(application.companyResponse.interviewDate)} c={c} />
                {application.companyResponse.interviewTime && (
                  <InfoRow icon="time-outline" label="Time" value={application.companyResponse.interviewTime} c={c} />
                )}
                {application.companyResponse.interviewLocation && (
                  <InfoRow icon="location-outline" label="Location" value={application.companyResponse.interviewLocation} c={c} />
                )}
              </View>
            )}
          </View>
        </SectionCard>
      )}

      {/* Cover letter */}
      <SectionCard title="Cover Letter" icon="document-text-outline" iconColor="#3B82F6" c={c}>
        <Text style={[cd.bodyText, { color: c.textSecondary ?? c.textMuted }]}>{application.coverLetter}</Text>
      </SectionCard>

      {/* Contact info */}
      <SectionCard title="Contact Information" icon="call-outline" iconColor="#8B5CF6" c={c}>
        {application.contactInfo?.email && <InfoRow icon="mail-outline" label="Email" value={application.contactInfo.email} c={c} />}
        {application.contactInfo?.phone && <InfoRow icon="call-outline" label="Phone" value={application.contactInfo.phone} c={c} />}
        {application.contactInfo?.location && <InfoRow icon="location-outline" label="Location" value={application.contactInfo.location} c={c} />}
        {application.contactInfo?.telegram && <InfoRow icon="paper-plane-outline" label="Telegram" value={application.contactInfo.telegram} c={c} />}
      </SectionCard>

      {/* CVs */}
      {(application.selectedCVs ?? []).length > 0 && (
        <SectionCard title={`Attached CVs (${application.selectedCVs.length})`} icon="document-outline" iconColor="#F59E0B" c={c}>
          {application.selectedCVs.map((cv, i) => (
            <View key={i} style={[cd.fileRow, { backgroundColor: c.background, borderColor: c.border }]}>
              <Ionicons name="document-text" size={20} color="#EF4444" />
              <Text style={[cd.fileName, { color: c.text }]} numberOfLines={1}>
                {cv.originalName ?? cv.filename ?? 'CV Document'}
              </Text>
            </View>
          ))}
        </SectionCard>
      )}

      {/* Skills */}
      {(application.skills ?? []).length > 0 && (
        <SectionCard title="Skills" icon="sparkles-outline" iconColor="#10B981" c={c}>
          <View style={cd.tagsRow}>
            {application.skills.map((sk, i) => (
              <View key={i} style={[cd.tag, { backgroundColor: `${c.primary}15`, borderColor: `${c.primary}30` }]}>
                <Text style={[cd.tagText, { color: c.primary }]}>{sk}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      {/* Work experience */}
      {(application.workExperience ?? []).length > 0 && (
        <SectionCard title="Work Experience" icon="briefcase-outline" iconColor="#7C3AED" c={c}>
          {application.workExperience.map((exp, i) => (
            <View key={i} style={[cd.expItem, { borderBottomColor: c.border }]}>
              <Text style={[cd.expCompany, { color: c.text }]}>{exp.company}</Text>
              {exp.position && <Text style={[cd.expPosition, { color: c.textSecondary ?? c.textMuted }]}>{exp.position}</Text>}
              {exp.startDate && (
                <Text style={[cd.expDates, { color: c.textMuted }]}>
                  {fmt(exp.startDate)} — {exp.current ? 'Present' : exp.endDate ? fmt(exp.endDate) : '—'}
                </Text>
              )}
              {exp.description && <Text style={[cd.expDesc, { color: c.textMuted }]}>{exp.description}</Text>}
            </View>
          ))}
        </SectionCard>
      )}

      {/* References */}
      {(application.references ?? []).filter(r => r.name).length > 0 && (
        <SectionCard title="References" icon="people-outline" iconColor="#EC4899" c={c}>
          {application.references.filter(r => r.name).map((ref, i) => (
            <View key={i} style={[cd.refItem, { borderBottomColor: c.border }]}>
              <Text style={[cd.refName, { color: c.text }]}>{ref.name}</Text>
              {ref.position     && <Text style={[cd.refSub, { color: c.textSecondary ?? c.textMuted }]}>{ref.position}</Text>}
              {ref.organization && <Text style={[cd.refSub, { color: c.textMuted }]}>{ref.organization}</Text>}
              {ref.email        && <InfoRow icon="mail-outline" label="Email" value={ref.email} c={c} />}
              {ref.phone        && <InfoRow icon="call-outline" label="Phone" value={ref.phone} c={c} />}
              {ref.relationship && <InfoRow icon="heart-outline" label="Relation" value={ref.relationship} c={c} />}
            </View>
          ))}
        </SectionCard>
      )}

      {/* Timeline */}
      {(application.statusHistory ?? []).length > 0 && (
        <SectionCard title="Status Timeline" icon="time-outline" iconColor="#64748B" c={c}>
          {[...application.statusHistory].reverse().map((entry, i, arr) => {
            const esc = SC[entry.status as ApplicationStatus] ?? SC.applied;
            return (
              <View key={i} style={cd.timeRow}>
                <View style={cd.timeTrack}>
                  <View style={[cd.timeDot, { backgroundColor: i === 0 ? esc.dot : c.border }]} />
                  {i < arr.length - 1 && <View style={[cd.timeLine, { backgroundColor: c.border }]} />}
                </View>
                <View style={cd.timeContent}>
                  <View style={[cd.timeStatus, { backgroundColor: esc.bg }]}>
                    <Text style={[cd.timeStatusText, { color: esc.text }]}>
                      {STATUS_LABELS[entry.status as ApplicationStatus] ?? entry.status}
                    </Text>
                  </View>
                  <Text style={[cd.timeDate, { color: c.textMuted }]}>{fmt(entry.changedAt)}</Text>
                  {entry.message && <Text style={[cd.timeMsg, { color: c.textSecondary ?? c.textMuted }]}>{entry.message}</Text>}
                </View>
              </View>
            );
          })}
        </SectionCard>
      )}
    </View>
  );
};

// ─── Atoms ────────────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon, iconColor, c, children }: any) => (
  <View style={[cd.card, { backgroundColor: c.card ?? c.surface, borderColor: c.border }]}>
    <View style={[cd.cardHeader, { borderBottomColor: c.border }]}>
      <Ionicons name={icon} size={17} color={iconColor} />
      <Text style={[cd.cardTitle, { color: c.text }]}>{title}</Text>
    </View>
    <View style={cd.cardBody}>{children}</View>
  </View>
);

const InfoRow = ({ icon, label, value, c }: any) => (
  <View style={cd.infoRow}>
    <Ionicons name={icon} size={14} color={c.textMuted} />
    <Text style={[cd.infoLabel, { color: c.textMuted }]}>{label}:</Text>
    <Text style={[cd.infoValue, { color: c.text }]} numberOfLines={1}>{value}</Text>
  </View>
);

const cd = StyleSheet.create({
  statusBanner:  { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, gap: 10, marginBottom: 12, borderWidth: 1 },
  statusDot:     { width: 10, height: 10, borderRadius: 5 },
  statusLabel:   { fontSize: 15, fontWeight: '700' },
  statusDate:    { fontSize: 11, marginTop: 2 },
  withdrawBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  withdrawText:  { fontSize: 12, fontWeight: '700' },
  card:          { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1 },
  cardTitle:     { fontSize: 15, fontWeight: '700' },
  cardBody:      { padding: 14 },
  bodyText:      { fontSize: 14, lineHeight: 22 },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoLabel:     { fontSize: 12, width: 70 },
  infoValue:     { flex: 1, fontSize: 13, fontWeight: '500' },
  fileRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  fileName:      { flex: 1, fontSize: 13, fontWeight: '500' },
  tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:           { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagText:       { fontSize: 12, fontWeight: '600' },
  expItem:       { paddingBottom: 12, marginBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  expCompany:    { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  expPosition:   { fontSize: 13, marginBottom: 2 },
  expDates:      { fontSize: 12, marginBottom: 4 },
  expDesc:       { fontSize: 12, lineHeight: 18 },
  refItem:       { paddingBottom: 12, marginBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  refName:       { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  refSub:        { fontSize: 12, marginBottom: 4 },
  responseBox:   { padding: 14, borderRadius: 12, borderWidth: 1 },
  responseLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  responseText:  { fontSize: 13, lineHeight: 19, marginTop: 4 },
  interviewDetails:{ marginTop: 10 },
  timeRow:       { flexDirection: 'row', gap: 12, marginBottom: 12 },
  timeTrack:     { alignItems: 'center', width: 14 },
  timeDot:       { width: 14, height: 14, borderRadius: 7 },
  timeLine:      { flex: 1, width: 2, marginTop: 4 },
  timeContent:   { flex: 1, paddingBottom: 4 },
  timeStatus:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 3 },
  timeStatusText:{ fontSize: 12, fontWeight: '700' },
  timeDate:      { fontSize: 11, marginBottom: 3 },
  timeMsg:       { fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
});
