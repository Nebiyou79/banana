/**
 * mobile/src/components/applications/CandidateApplicationDetails.tsx
 *
 * Full application detail view for the candidate role.
 * Mirrors the web frontend's CandidateApplicationDetails component.
 *
 * Shows: status banner, company response/message, status timeline,
 *        cover letter, skills, contact info, CVs, references, work experience.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator,
} from 'react-native';
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
import { formatDate, getJobTypeLabel } from '../../utils/jobHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidateApplicationDetailsProps {
  application: Application;
  onWithdraw?: (updatedApp: Application) => void;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: string; label: string; value: string; colors: any }> = ({ icon, label, value, colors }) => (
  <View style={ir.row}>
    <Ionicons name={icon as any} size={15} color={colors.textMuted} style={{ width: 20 }} />
    <Text style={[ir.label, { color: colors.textMuted }]}>{label}:</Text>
    <Text style={[ir.value, { color: colors.text }]} numberOfLines={2}>{value}</Text>
  </View>
);

const ir = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  label: { fontSize: 13, fontWeight: '600', width: 90 },
  value: { flex: 1, fontSize: 13 },
});

const SectionCard: React.FC<{ title: string; icon: string; iconColor: string; colors: any; children: React.ReactNode }> = ({ title, icon, iconColor, colors, children }) => (
  <View style={[sc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={sc.header}>
      <Ionicons name={icon as any} size={16} color={iconColor} />
      <Text style={[sc.title, { color: colors.text }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const sc = StyleSheet.create({
  card:   { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title:  { fontSize: 15, fontWeight: '700' },
});

// ─── Timeline entry ───────────────────────────────────────────────────────────

const TimelineEntry: React.FC<{ entry: any; isFirst: boolean; colors: any; isDark: boolean }> = ({ entry, isFirst, colors, isDark }) => {
  const SC = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc = SC[entry.status as ApplicationStatus] ?? SC.applied;
  return (
    <View style={te.row}>
      <View style={te.track}>
        <View style={[te.dot, { backgroundColor: isFirst ? colors.primary : sc.dot, borderColor: isFirst ? colors.primary : sc.dot }]} />
        {!isFirst && <View style={[te.line, { backgroundColor: colors.border }]} />}
      </View>
      <View style={te.body}>
        <View style={[te.badge, { backgroundColor: sc.bg }]}>
          <Text style={[te.badgeText, { color: sc.text }]}>{STATUS_LABELS[entry.status as ApplicationStatus] ?? entry.status}</Text>
        </View>
        <Text style={[te.date, { color: colors.textMuted }]}>{formatDate(entry.changedAt)}</Text>
        {entry.message && <Text style={[te.msg, { color: colors.textSecondary }]}>{entry.message}</Text>}
        {entry.changedBy?.name && (
          <Text style={[te.by, { color: colors.textMuted }]}>by {entry.changedBy.name}</Text>
        )}
      </View>
    </View>
  );
};

const te = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 12, marginBottom: 16 },
  track:     { alignItems: 'center', width: 14 },
  dot:       { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  line:      { flex: 1, width: 2, marginTop: 4 },
  body:      { flex: 1, paddingBottom: 8 },
  badge:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  date:      { fontSize: 11, marginBottom: 3 },
  msg:       { fontSize: 13, lineHeight: 18, marginTop: 4 },
  by:        { fontSize: 11, marginTop: 2, fontStyle: 'italic' },
});

// ─── Main component ───────────────────────────────────────────────────────────

export const CandidateApplicationDetails: React.FC<CandidateApplicationDetailsProps> = ({
  application, onWithdraw,
}) => {
  const { theme: { colors, isDark } } = useThemeStore();
  const c = colors;

  const [withdrawing, setWithdrawing] = useState(false);

  const SC = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc = SC[application.status] ?? SC.applied;
  const owner  = application.job?.company ?? application.job?.organization;
  const canWd  = applicationService.canWithdraw(application.status);

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Application',
      `Are you sure you want to withdraw your application for "${application.job?.title ?? 'this job'}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Withdraw', style: 'destructive', onPress: async () => {
          setWithdrawing(true);
          try {
            await applicationService.withdrawApplication(application._id);
            onWithdraw?.({ ...application, status: 'withdrawn' });
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to withdraw application');
          } finally { setWithdrawing(false); }
        }},
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>

      {/* ── Status banner ── */}
      <View style={[s.statusBanner, { backgroundColor: sc.bg }]}>
        <View style={[s.statusBannerDot, { backgroundColor: sc.dot }]} />
        <View style={{ flex: 1 }}>
          <Text style={[s.statusBannerLabel, { color: sc.text }]}>{STATUS_LABELS[application.status]}</Text>
          <Text style={[s.statusBannerDate, { color: sc.text, opacity: 0.7 }]}>Updated {formatDate(application.updatedAt)}</Text>
        </View>
        <Ionicons name="checkmark-shield" size={22} color={sc.dot} />
      </View>

      {/* ── Job info ── */}
      <SectionCard title="Job Details" icon="briefcase-outline" iconColor={c.primary} colors={c}>
        <View style={[s.jobHero, { backgroundColor: c.isDark ? '#1F2937' : '#F8FAFC', borderColor: c.border }]}>
          <View style={[s.jobAvatar, { backgroundColor: c.primaryLight }]}>
            <Text style={[s.jobAvatarText, { color: c.primary }]}>{(owner?.name ?? 'J').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.jobTitle, { color: c.text }]}>{application.job?.title ?? '—'}</Text>
            <Text style={[s.jobCompany, { color: c.textSecondary }]}>{owner?.name ?? '—'}</Text>
            {application.job?.type && (
              <Text style={[s.jobType, { color: c.textMuted }]}>{getJobTypeLabel(application.job.type)}</Text>
            )}
          </View>
        </View>
        <InfoRow icon="calendar-outline"  label="Applied"   value={formatDate(application.createdAt)} colors={c} />
        <InfoRow icon="location-outline"  label="Location"  value={application.job?.location?.city ?? application.job?.location?.region ?? '—'} colors={c} />
      </SectionCard>

      {/* ── Company response message ── */}
      {application.companyResponse?.message && (
        <View style={[s.responseCard, { backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF', borderColor: isDark ? '#1E3A8A' : '#BFDBFE' }]}>
          <View style={s.responseHdr}>
            <Ionicons name="chatbubble-ellipses" size={16} color={c.primary} />
            <Text style={[s.responseTitle, { color: c.primary }]}>Message from Employer</Text>
          </View>
          <Text style={[s.responseMsg, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
            {application.companyResponse.message}
          </Text>
          {application.companyResponse.interviewLocation && (
            <View style={s.interviewLocRow}>
              <Ionicons name="location-outline" size={13} color={c.primary} />
              <Text style={[s.interviewLoc, { color: c.primary }]}>{application.companyResponse.interviewLocation}</Text>
            </View>
          )}
          {application.companyResponse.interviewDetails?.date && (
            <View style={s.interviewLocRow}>
              <Ionicons name="calendar-outline" size={13} color={c.primary} />
              <Text style={[s.interviewLoc, { color: c.primary }]}>
                {formatDate(application.companyResponse.interviewDetails.date)}
                {application.companyResponse.interviewDetails.type && ` · ${application.companyResponse.interviewDetails.type}`}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Cover letter ── */}
      <SectionCard title="Cover Letter" icon="document-text-outline" iconColor="#8B5CF6" colors={c}>
        <Text style={[s.bodyText, { color: c.textSecondary }]}>{application.coverLetter}</Text>
      </SectionCard>

      {/* ── Skills ── */}
      {(application.skills ?? []).length > 0 && (
        <SectionCard title="Skills Submitted" icon="construct-outline" iconColor="#F59E0B" colors={c}>
          <View style={s.tagsWrap}>
            {application.skills!.map(sk => (
              <View key={sk} style={[s.tag, { backgroundColor: c.primaryLight }]}>
                <Text style={[s.tagText, { color: c.primary }]}>{sk}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      {/* ── Contact info ── */}
      {application.contactInfo && (
        <SectionCard title="Contact Info" icon="call-outline" iconColor={c.success} colors={c}>
          {application.contactInfo.email    && <InfoRow icon="mail-outline"     label="Email"    value={application.contactInfo.email} colors={c} />}
          {application.contactInfo.phone    && <InfoRow icon="phone-portrait-outline" label="Phone" value={application.contactInfo.phone} colors={c} />}
          {application.contactInfo.location && <InfoRow icon="location-outline" label="Location" value={application.contactInfo.location} colors={c} />}
          {application.contactInfo.telegram && <InfoRow icon="paper-plane-outline" label="Telegram" value={application.contactInfo.telegram} colors={c} />}
        </SectionCard>
      )}

      {/* ── CVs ── */}
      {(application.selectedCVs ?? []).length > 0 && (
        <SectionCard title="Submitted CVs" icon="document-attach-outline" iconColor="#06B6D4" colors={c}>
          {application.selectedCVs.map((cv, i) => (
            <View key={i} style={[s.cvRow, { borderBottomColor: c.border }]}>
              <Ionicons name="document-text-outline" size={18} color={c.primary} />
              <Text style={[s.cvName, { color: c.text }]} numberOfLines={1}>
                {cv.originalName ?? cv.filename ?? 'CV Document'}
              </Text>
            </View>
          ))}
        </SectionCard>
      )}

      {/* ── Work experience ── */}
      {(application.workExperience ?? []).length > 0 && (
        <SectionCard title="Work Experience" icon="briefcase-outline" iconColor="#7C3AED" colors={c}>
          {application.workExperience.map((exp, i) => (
            <View key={i} style={[s.expItem, { borderBottomColor: c.border }]}>
              <Text style={[s.expCompany, { color: c.text }]}>{exp.company}</Text>
              {exp.position && <Text style={[s.expPosition, { color: c.textSecondary }]}>{exp.position}</Text>}
              {exp.startDate && (
                <Text style={[s.expDates, { color: c.textMuted }]}>
                  {formatDate(exp.startDate)} — {exp.current ? 'Present' : exp.endDate ? formatDate(exp.endDate) : '—'}
                </Text>
              )}
              {exp.description && <Text style={[s.expDesc, { color: c.textSecondary }]}>{exp.description}</Text>}
            </View>
          ))}
        </SectionCard>
      )}

      {/* ── References ── */}
      {(application.references ?? []).length > 0 && (
        <SectionCard title="References" icon="people-outline" iconColor="#EC4899" colors={c}>
          {application.references.map((ref, i) => (
            <View key={i} style={[s.refItem, { borderBottomColor: c.border }]}>
              <Text style={[s.refName, { color: c.text }]}>{ref.name}</Text>
              {ref.position     && <Text style={[s.refSub, { color: c.textSecondary }]}>{ref.position}</Text>}
              {ref.organization && <Text style={[s.refSub, { color: c.textMuted }]}>{ref.organization}</Text>}
              {ref.email        && <InfoRow icon="mail-outline"  label="Email"  value={ref.email} colors={c} />}
              {ref.phone        && <InfoRow icon="call-outline"  label="Phone"  value={ref.phone} colors={c} />}
            </View>
          ))}
        </SectionCard>
      )}

      {/* ── Status timeline ── */}
      {(application.statusHistory ?? []).length > 0 && (
        <SectionCard title="Application Timeline" icon="time-outline" iconColor={c.warning} colors={c}>
          {[...application.statusHistory].reverse().map((entry, i) => (
            <TimelineEntry key={i} entry={entry} isFirst={i === 0} colors={c} isDark={isDark} />
          ))}
        </SectionCard>
      )}

      {/* ── Withdraw button ── */}
      {canWd && (
        <TouchableOpacity
          style={[s.wdBtn, { borderColor: c.error, backgroundColor: isDark ? '#450A0A18' : '#FEF2F218' }]}
          onPress={handleWithdraw} disabled={withdrawing}
        >
          {withdrawing
            ? <ActivityIndicator color={c.error} size="small" />
            : <>
              <Ionicons name="close-circle-outline" size={20} color={c.error} />
              <Text style={[s.wdBtnText, { color: c.error }]}>Withdraw Application</Text>
            </>}
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  statusBanner:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, gap: 10, marginBottom: 14 },
  statusBannerDot: { width: 10, height: 10, borderRadius: 5 },
  statusBannerLabel:{ fontSize: 15, fontWeight: '700' },
  statusBannerDate: { fontSize: 12, marginTop: 2 },
  jobHero:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  jobAvatar:       { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  jobAvatarText:   { fontSize: 18, fontWeight: '700' },
  jobTitle:        { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  jobCompany:      { fontSize: 13, marginTop: 2 },
  jobType:         { fontSize: 11, marginTop: 2 },
  responseCard:    { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  responseHdr:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  responseTitle:   { fontSize: 14, fontWeight: '700' },
  responseMsg:     { fontSize: 14, lineHeight: 21 },
  interviewLocRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  interviewLoc:    { fontSize: 13 },
  bodyText:        { fontSize: 14, lineHeight: 22 },
  tagsWrap:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:             { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText:         { fontSize: 12, fontWeight: '500' },
  cvRow:           { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  cvName:          { flex: 1, fontSize: 14, fontWeight: '500' },
  expItem:         { paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1 },
  expCompany:      { fontSize: 15, fontWeight: '700' },
  expPosition:     { fontSize: 13, marginTop: 2 },
  expDates:        { fontSize: 12, marginTop: 3 },
  expDesc:         { fontSize: 13, marginTop: 5, lineHeight: 18 },
  refItem:         { paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1 },
  refName:         { fontSize: 15, fontWeight: '700' },
  refSub:          { fontSize: 13, marginTop: 2 },
  wdBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1.5, padding: 14, marginTop: 8 },
  wdBtnText:       { fontSize: 15, fontWeight: '700' },
});
