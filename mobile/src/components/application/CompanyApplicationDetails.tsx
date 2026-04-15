/**
 * mobile/src/components/applications/CompanyApplicationDetails.tsx
 *
 * Full applicant review component for company/organization role.
 * Mirrors the web frontend's CompanyApplicationDetails + StatusManager.
 *
 * Features:
 *  - Candidate profile hero with contact info
 *  - Quick action buttons (Shortlist · Interview · Reject)
 *  - Full status update modal with all statuses
 *  - Interview scheduling
 *  - Company response messaging
 *  - Cover letter, skills, work experience, references
 *  - Status timeline
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, Platform,
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
  CompanyResponseData,
  UpdateStatusData,
} from '../../services/applicationService';
import { formatDate, getCompanyInitials, getJobTypeLabel } from '../../utils/jobHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyApplicationDetailsProps {
  application: Application;
  onStatusUpdate: (updated: Application) => void;
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

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { status: 'under-review',        label: 'Mark Under Review',  icon: 'eye-outline',              section: 'Review' },
  { status: 'shortlisted',         label: 'Shortlist',          icon: 'checkmark-circle-outline', section: 'Shortlist' },
  { status: 'interview-scheduled', label: 'Schedule Interview', icon: 'calendar-outline',         section: 'Interview' },
  { status: 'interviewed',         label: 'Mark Interviewed',   icon: 'mic-outline',              section: 'Post-Interview' },
  { status: 'offer-pending',       label: 'Offer Pending',      icon: 'hourglass-outline',        section: 'Offer' },
  { status: 'offer-made',          label: 'Send Offer',         icon: 'gift-outline',             section: 'Offer' },
  { status: 'on-hold',             label: 'Put On Hold',        icon: 'pause-circle-outline',     section: 'Hold' },
  { status: 'rejected',            label: 'Reject',             icon: 'close-circle-outline',     section: 'Reject' },
] as const;

const STATUS_COLORS_MAP: Record<string, string> = {
  'under-review': '#F97316', shortlisted: '#22C55E',
  'interview-scheduled': '#A855F7', interviewed: '#A855F7',
  'offer-pending': '#F97316', 'offer-made': '#22C55E',
  'on-hold': '#F59E0B', rejected: '#EF4444',
};

// ─── Main component ───────────────────────────────────────────────────────────

export const CompanyApplicationDetails: React.FC<CompanyApplicationDetailsProps> = ({
  application, onStatusUpdate,
}) => {
  const { theme: { colors, isDark } } = useThemeStore();
  const c = colors;

  const [showModal,   setShowModal]   = useState(false);
  const [updating,    setUpdating]    = useState(false);
  const [selStatus,   setSelStatus]   = useState('');
  const [message,     setMessage]     = useState('');
  const [intDate,     setIntDate]     = useState('');
  const [intLocation, setIntLocation] = useState('Our Main Office');
  const [intType,     setIntType]     = useState('in-person');

  const SC   = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc   = SC[application.status] ?? SC.applied;
  const owner = application.job?.company ?? application.job?.organization;

  // ── Generate default message for a status ────────────────────────────────

  const getDefaultMsg = (status: string): string => {
    const name = application.userInfo?.name ?? 'Candidate';
    const job  = application.job?.title ?? 'the position';
    const co   = owner?.name ?? 'Our organization';
    switch (status) {
      case 'shortlisted':         return `Dear ${name},\n\nCongratulations! Your application for ${job} has been shortlisted.\n\nBest regards,\n${co} Hiring Team`;
      case 'interview-scheduled': return `Dear ${name},\n\nYou have been selected for an interview for the ${job} position.\n\nInterview Details:\n- Date: ${intDate || 'To be confirmed'}\n- Location: ${intLocation}\n- Type: ${intType}\n\nPlease arrive 15 minutes early.\n\nBest regards,\n${co} Hiring Team`;
      case 'rejected':            return `Dear ${name},\n\nThank you for your interest in the ${job} position. After careful consideration, we have decided to move forward with other candidates.\n\nWe appreciate the time you invested and wish you the best in your search.\n\nSincerely,\n${co} Hiring Team`;
      case 'on-hold':             return `Dear ${name},\n\nYour application for ${job} is currently on hold. We will contact you if a suitable position opens up.\n\nThank you for your patience.\n\nBest regards,\n${co} Hiring Team`;
      default:                    return '';
    }
  };

  const selectStatus = (status: string) => {
    setSelStatus(status);
    setMessage(getDefaultMsg(status));
  };

  const submit = async () => {
    if (!selStatus) { Alert.alert('Select a status first'); return; }
    setUpdating(true);
    try {
      const data: UpdateStatusData = {
        status: selStatus,
        message: message.trim() || undefined,
      };
      if (selStatus === 'interview-scheduled' && intDate) {
        data.interviewDetails = {
          date:        new Date(intDate + 'T09:00:00').toISOString(),
          location:    intLocation,
          type:        intType,
          interviewer: 'Hiring Manager',
        };
      }
      const res = await applicationService.updateApplicationStatus(application._id, data);
      onStatusUpdate(res.data.application);
      setShowModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update status');
    } finally { setUpdating(false); }
  };

  // ── Quick actions ─────────────────────────────────────────────────────────

  const quickAction = async (status: string, msg?: string) => {
    setUpdating(true);
    try {
      const res = await applicationService.updateApplicationStatus(application._id, { status, message: msg });
      onStatusUpdate(res.data.application);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setUpdating(false); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>

        {/* ── Status banner ── */}
        <View style={[s.statusBanner, { backgroundColor: sc.bg }]}>
          <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
          <Text style={[s.statusLabel, { color: sc.text }]}>{STATUS_LABELS[application.status]}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={[s.changeStatusBtn, { borderColor: sc.dot }]} onPress={() => setShowModal(true)}>
            <Text style={[s.changeStatusText, { color: sc.text }]}>Change</Text>
            <Ionicons name="chevron-down" size={14} color={sc.dot} />
          </TouchableOpacity>
        </View>

        {/* ── Quick actions ── */}
        <View style={s.quickRow}>
          {[
            { label: 'Shortlist',  color: c.success,  fn: () => quickAction('shortlisted') },
            { label: 'Interview',  color: '#A855F7',   fn: () => { selectStatus('interview-scheduled'); setShowModal(true); } },
            { label: 'Reject',     color: c.error,     fn: () => quickAction('rejected', getDefaultMsg('rejected')) },
          ].map(btn => (
            <TouchableOpacity key={btn.label}
              style={[s.quickBtn, { backgroundColor: btn.color }]}
              onPress={btn.fn} disabled={updating} activeOpacity={0.8}>
              <Text style={s.quickBtnText}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Candidate hero ── */}
        <SectionCard title="Candidate" icon="person-outline" iconColor={c.primary} colors={c}>
          <View style={s.candHero}>
            <View style={[s.candAvatar, { backgroundColor: c.primaryLight }]}>
              <Text style={[s.candAvatarText, { color: c.primary }]}>
                {getCompanyInitials(application.userInfo?.name ?? application.candidate?.name)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.candName, { color: c.text }]}>{application.userInfo?.name ?? '—'}</Text>
              <Text style={[s.candEmail, { color: c.textSecondary }]}>{application.userInfo?.email}</Text>
              {application.userInfo?.phone && (
                <Text style={[s.candPhone, { color: c.textMuted }]}>{application.userInfo.phone}</Text>
              )}
            </View>
          </View>
          {application.userInfo?.bio && (
            <Text style={[s.candBio, { color: c.textMuted }]}>{application.userInfo.bio}</Text>
          )}
          <View style={[s.separator, { backgroundColor: c.border }]} />
          <InfoRow icon="calendar-outline" label="Applied"  value={formatDate(application.createdAt)} colors={c} />
          {application.job?.type && (
            <InfoRow icon="briefcase-outline" label="Job Type" value={getJobTypeLabel(application.job.type)} colors={c} />
          )}
          {(application.contactInfo?.location) && (
            <InfoRow icon="location-outline" label="Location" value={application.contactInfo.location} colors={c} />
          )}
        </SectionCard>

        {/* ── Cover letter ── */}
        <SectionCard title="Cover Letter" icon="document-text-outline" iconColor="#8B5CF6" colors={c}>
          <Text style={[s.bodyText, { color: c.textSecondary }]}>{application.coverLetter}</Text>
        </SectionCard>

        {/* ── Skills ── */}
        {(application.skills ?? []).length > 0 && (
          <SectionCard title="Skills" icon="construct-outline" iconColor="#F59E0B" colors={c}>
            <View style={s.tagsWrap}>
              {application.skills!.map(sk => (
                <View key={sk} style={[s.tag, { backgroundColor: c.primaryLight }]}>
                  <Text style={[s.tagText, { color: c.primary }]}>{sk}</Text>
                </View>
              ))}
            </View>
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
                {exp.position  && <Text style={[s.expPosition, { color: c.textSecondary }]}>{exp.position}</Text>}
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
                {ref.email        && <InfoRow icon="mail-outline" label="Email" value={ref.email} colors={c} />}
                {ref.phone        && <InfoRow icon="call-outline" label="Phone" value={ref.phone} colors={c} />}
                {ref.relationship && <InfoRow icon="heart-outline" label="Relation" value={ref.relationship} colors={c} />}
              </View>
            ))}
          </SectionCard>
        )}

        {/* ── Status timeline ── */}
        {(application.statusHistory ?? []).length > 0 && (
          <SectionCard title="Status Timeline" icon="time-outline" iconColor={c.warning} colors={c}>
            {[...application.statusHistory].reverse().map((entry, i) => {
              const esc = (isDark ? STATUS_COLORS_DARK : STATUS_COLORS)[entry.status as ApplicationStatus] ?? STATUS_COLORS.applied;
              return (
                <View key={i} style={[s.timeRow, { marginTop: i === 0 ? 0 : 0 }]}>
                  <View style={[s.timeDot, { backgroundColor: i === 0 ? c.primary : c.border }]} />
                  <View style={{ flex: 1, marginLeft: 12, paddingBottom: 14 }}>
                    <View style={[s.timeBadge, { backgroundColor: esc.bg }]}>
                      <Text style={[s.timeBadgeText, { color: esc.text }]}>
                        {STATUS_LABELS[entry.status as ApplicationStatus] ?? entry.status}
                      </Text>
                    </View>
                    <Text style={[s.timeDate, { color: c.textMuted }]}>{formatDate(entry.changedAt)}</Text>
                    {entry.message && <Text style={[s.timeMsg, { color: c.textSecondary }]}>{entry.message}</Text>}
                  </View>
                </View>
              );
            })}
          </SectionCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Status update modal ── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={m.overlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowModal(false)} />
          <View style={[m.sheet, { backgroundColor: c.surface }]}>
            <View style={m.handle} />
            <Text style={[m.title, { color: c.text }]}>Update Application Status</Text>
            <Text style={[m.subtitle, { color: c.textMuted }]}>
              {application.userInfo?.name} · {application.job?.title}
            </Text>

            {/* Status picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={m.statusScroll}>
              {STATUS_OPTIONS.map(opt => {
                const col = STATUS_COLORS_MAP[opt.status] ?? c.primary;
                const active = selStatus === opt.status;
                return (
                  <TouchableOpacity key={opt.status}
                    style={[m.statusChip, { backgroundColor: active ? col + '20' : c.inputBg, borderColor: active ? col : c.border, borderWidth: active ? 1.5 : 1 }]}
                    onPress={() => selectStatus(opt.status)}>
                    <Ionicons name={opt.icon as any} size={14} color={active ? col : c.textMuted} />
                    <Text style={[m.statusChipText, { color: active ? col : c.textSecondary }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Interview fields */}
            {selStatus === 'interview-scheduled' && (
              <View style={m.interviewFields}>
                <Text style={[m.fieldLabel, { color: c.textSecondary }]}>Interview Date</Text>
                <TextInput style={[m.input, { color: c.text, backgroundColor: c.inputBg, borderColor: c.border }]}
                  value={intDate} onChangeText={setIntDate} placeholder="YYYY-MM-DD" placeholderTextColor={c.placeholder} />
                <Text style={[m.fieldLabel, { color: c.textSecondary }]}>Location</Text>
                <TextInput style={[m.input, { color: c.text, backgroundColor: c.inputBg, borderColor: c.border }]}
                  value={intLocation} onChangeText={setIntLocation} placeholder="Interview location" placeholderTextColor={c.placeholder} />
                <Text style={[m.fieldLabel, { color: c.textSecondary }]}>Interview Type</Text>
                <View style={m.typeRow}>
                  {['in-person', 'virtual', 'phone'].map(t => (
                    <TouchableOpacity key={t}
                      style={[m.typeChip, { backgroundColor: intType === t ? c.primaryLight : c.inputBg, borderColor: intType === t ? c.primary : c.border }]}
                      onPress={() => setIntType(t)}>
                      <Text style={[m.typeChipText, { color: intType === t ? c.primary : c.textSecondary }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Message */}
            {selStatus && (
              <View>
                <Text style={[m.fieldLabel, { color: c.textSecondary }]}>Message to Candidate</Text>
                <View style={[m.taWrap, { backgroundColor: c.inputBg, borderColor: c.border }]}>
                  <TextInput style={[m.ta, { color: c.text }]} value={message} onChangeText={setMessage}
                    placeholder="Write a message to the candidate…" placeholderTextColor={c.placeholder}
                    multiline numberOfLines={5} textAlignVertical="top" />
                </View>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[m.submitBtn, { backgroundColor: selStatus ? STATUS_COLORS_MAP[selStatus] ?? c.primary : c.border }]}
              onPress={submit} disabled={updating || !selStatus}
            >
              {updating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={m.submitBtnText}>Update Status</Text>}
            </TouchableOpacity>

            <View style={{ height: Platform.OS === 'ios' ? 24 : 8 }} />
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  statusBanner:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, gap: 8, marginBottom: 14 },
  statusDot:       { width: 10, height: 10, borderRadius: 5 },
  statusLabel:     { fontSize: 15, fontWeight: '700' },
  changeStatusBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, gap: 4 },
  changeStatusText:{ fontSize: 12, fontWeight: '600' },
  quickRow:        { flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickBtn:        { flex: 1, alignItems: 'center', padding: 11, borderRadius: 12 },
  quickBtnText:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  candHero:        { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 10 },
  candAvatar:      { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  candAvatarText:  { fontSize: 20, fontWeight: '700' },
  candName:        { fontSize: 17, fontWeight: '700' },
  candEmail:       { fontSize: 13, marginTop: 2 },
  candPhone:       { fontSize: 13, marginTop: 2 },
  candBio:         { fontSize: 14, lineHeight: 20, marginTop: 6 },
  separator:       { height: 1, marginVertical: 12 },
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
  timeRow:         { flexDirection: 'row', alignItems: 'flex-start' },
  timeDot:         { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timeBadge:       { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 3 },
  timeBadgeText:   { fontSize: 12, fontWeight: '700' },
  timeDate:        { fontSize: 11 },
  timeMsg:         { fontSize: 13, lineHeight: 18, marginTop: 4 },
});

const m = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 16 },
  title:       { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle:    { fontSize: 13, marginBottom: 16 },
  statusScroll:{ marginBottom: 16 },
  statusChip:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, gap: 6 },
  statusChipText:{ fontSize: 12, fontWeight: '600' },
  interviewFields:{ marginBottom: 12 },
  fieldLabel:  { fontSize: 13, fontWeight: '600', marginBottom: 5, marginTop: 8 },
  input:       { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  typeRow:     { flexDirection: 'row', gap: 8 },
  typeChip:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  typeChipText:{ fontSize: 13, fontWeight: '500' },
  taWrap:      { borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 12 },
  ta:          { fontSize: 14, lineHeight: 21, minHeight: 100 },
  submitBtn:   { borderRadius: 14, padding: 15, alignItems: 'center' },
  submitBtnText:{ color: '#fff', fontSize: 16, fontWeight: '700' },
});
