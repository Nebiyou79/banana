/**
 * src/components/application/CompanyApplicationDetails.tsx
 * Full applicant review for employer. Status management + interview scheduling.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import {
  Application, ApplicationStatus, COMPANY_STATUSES,
  STATUS_LABELS, STATUS_COLORS, STATUS_COLORS_DARK,
  UpdateStatusData,
} from '../../services/applicationService';
import { useUpdateApplicationStatus } from '../../hooks/useApplications';

interface Props {
  application: Application;
  onStatusUpdate?: (updated: Application) => void;
}

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

export const CompanyApplicationDetails: React.FC<Props> = ({ application, onStatusUpdate }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const isDark = theme.isDark;
  const SC = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc = SC[application.status] ?? SC.applied;

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | null>(null);
  const [message, setMessage] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewType, setInterviewType] = useState<'in-person' | 'video' | 'phone'>('in-person');

  const updateMut = useUpdateApplicationStatus();
  const showInterviewFields = selectedStatus === 'interview-scheduled';

  const candidate = application.candidate;
  const userInfo  = application.userInfo;
  const name      = userInfo?.name ?? candidate?.name ?? 'Candidate';

  const submitStatusUpdate = () => {
    if (!selectedStatus) return;
    const data: UpdateStatusData = {
      status: selectedStatus,
      message: message.trim() || undefined,
    };
    if (showInterviewFields) {
      data.interviewDate     = interviewDate;
      data.interviewTime     = interviewTime;
      data.interviewLocation = interviewLocation;
      data.interviewType     = interviewType;
    }
    updateMut.mutate(
      { applicationId: application._id, data },
      {
        onSuccess: () => {
          setShowStatusModal(false);
          setSelectedStatus(null);
          setMessage('');
        },
      },
    );
  };

  return (
    <>
      {/* Status banner */}
      <View style={[cp.statusBanner, { backgroundColor: sc.bg, borderColor: sc.border }]}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[cp.statusDot, { backgroundColor: sc.dot }]} />
          <Text style={[cp.statusLabel, { color: sc.text }]}>
            {STATUS_LABELS[application.status as ApplicationStatus] ?? application.status}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowStatusModal(true)}
          style={[cp.changeBtn, { borderColor: sc.dot, backgroundColor: sc.bg }]}
        >
          <Ionicons name="swap-horizontal-outline" size={14} color={sc.dot} />
          <Text style={[cp.changeBtnText, { color: sc.dot }]}>Update</Text>
        </TouchableOpacity>
      </View>

      {/* Quick action buttons */}
      <View style={cp.quickRow}>
        {['shortlisted', 'interview-scheduled', 'rejected'].map(st => {
          const stSC = SC[st] ?? SC.applied;
          const isCurrent = application.status === st;
          return (
            <TouchableOpacity
              key={st}
              onPress={() => {
                setSelectedStatus(st as ApplicationStatus);
                setShowStatusModal(true);
              }}
              disabled={isCurrent}
              style={[cp.quickBtn, { backgroundColor: isCurrent ? stSC.dot : `${stSC.dot}20`, opacity: isCurrent ? 0.5 : 1 }]}
            >
              <Ionicons
                name={st === 'shortlisted' ? 'checkmark-circle' : st === 'interview-scheduled' ? 'calendar' : 'close-circle'}
                size={15}
                color={isCurrent ? '#fff' : stSC.dot}
              />
              <Text style={[cp.quickBtnText, { color: isCurrent ? '#fff' : stSC.dot }]}>
                {st === 'shortlisted' ? 'Shortlist' : st === 'interview-scheduled' ? 'Interview' : 'Reject'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Candidate hero */}
      <SectionCard title="Candidate Profile" icon="person-outline" iconColor="#3B82F6" c={c}>
        <View style={cp.candHero}>
          <View style={[cp.candAvatar, { backgroundColor: c.primary }]}>
            <Text style={cp.candAvatarText}>{(name ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[cp.candName, { color: c.text }]}>{name}</Text>
            <Text style={[cp.candEmail, { color: c.textMuted }]}>{userInfo?.email ?? candidate?.email ?? ''}</Text>
            {(userInfo?.phone ?? candidate?.phone) && (
              <Text style={[cp.candPhone, { color: c.textMuted }]}>{userInfo?.phone ?? candidate?.phone}</Text>
            )}
          </View>
        </View>
        {userInfo?.bio && <Text style={[cp.bio, { color: c.textMuted }]}>{userInfo.bio}</Text>}
        {application.contactInfo && (
          <View style={{ marginTop: 8 }}>
            {application.contactInfo.telegram && <InfoRow icon="paper-plane-outline" label="Telegram" value={application.contactInfo.telegram} c={c} />}
            {application.contactInfo.location && <InfoRow icon="location-outline" label="Location" value={application.contactInfo.location} c={c} />}
          </View>
        )}
      </SectionCard>

      {/* Cover letter */}
      <SectionCard title="Cover Letter" icon="document-text-outline" iconColor="#6D28D9" c={c}>
        <Text style={[cp.body, { color: c.textSecondary ?? c.textMuted }]}>{application.coverLetter}</Text>
      </SectionCard>

      {/* CVs */}
      {(application.selectedCVs ?? []).length > 0 && (
        <SectionCard title={`CVs (${application.selectedCVs.length})`} icon="document-outline" iconColor="#F59E0B" c={c}>
          {application.selectedCVs.map((cv, i) => (
            <View key={i} style={[cp.fileRow, { backgroundColor: c.background, borderColor: c.border }]}>
              <Ionicons name="document-text" size={20} color="#EF4444" />
              <Text style={[cp.fileName, { color: c.text }]} numberOfLines={1}>
                {cv.originalName ?? cv.filename ?? 'CV Document'}
              </Text>
            </View>
          ))}
        </SectionCard>
      )}

      {/* Skills */}
      {(application.skills ?? []).length > 0 && (
        <SectionCard title="Skills" icon="sparkles-outline" iconColor="#10B981" c={c}>
          <View style={cp.tagsRow}>
            {application.skills.map((sk, i) => (
              <View key={i} style={[cp.tag, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Text style={[cp.tagText, { color: '#15803D' }]}>{sk}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      {/* Work experience */}
      {(application.workExperience ?? []).filter(e => e.company).length > 0 && (
        <SectionCard title="Work Experience" icon="briefcase-outline" iconColor="#7C3AED" c={c}>
          {application.workExperience.filter(e => e.company).map((exp, i) => (
            <View key={i} style={[cp.expItem, { borderBottomColor: c.border }]}>
              <Text style={[cp.expCompany, { color: c.text }]}>{exp.company}</Text>
              {exp.position  && <Text style={[cp.expPos, { color: c.textSecondary ?? c.textMuted }]}>{exp.position}</Text>}
              {exp.startDate && (
                <Text style={[cp.expDates, { color: c.textMuted }]}>
                  {fmt(exp.startDate)} — {exp.current ? 'Present' : exp.endDate ? fmt(exp.endDate) : '—'}
                </Text>
              )}
              {exp.description && <Text style={[cp.expDesc, { color: c.textMuted }]}>{exp.description}</Text>}
            </View>
          ))}
        </SectionCard>
      )}

      {/* References */}
      {(application.references ?? []).filter(r => r.name).length > 0 && (
        <SectionCard title="References" icon="people-outline" iconColor="#EC4899" c={c}>
          {application.references.filter(r => r.name).map((ref, i) => (
            <View key={i} style={[cp.refItem, { borderBottomColor: c.border }]}>
              <Text style={[cp.refName, { color: c.text }]}>{ref.name}</Text>
              {ref.position     && <Text style={[cp.refSub, { color: c.textSecondary ?? c.textMuted }]}>{ref.position}</Text>}
              {ref.organization && <Text style={[cp.refSub, { color: c.textMuted }]}>{ref.organization}</Text>}
              {ref.email        && <InfoRow icon="mail-outline" label="Email" value={ref.email} c={c} />}
              {ref.phone        && <InfoRow icon="call-outline" label="Phone" value={ref.phone} c={c} />}
            </View>
          ))}
        </SectionCard>
      )}

      {/* Status timeline */}
      {(application.statusHistory ?? []).length > 0 && (
        <SectionCard title="Status Timeline" icon="time-outline" iconColor="#64748B" c={c}>
          {[...application.statusHistory].reverse().map((entry, i, arr) => {
            const esc = SC[entry.status as ApplicationStatus] ?? SC.applied;
            return (
              <View key={i} style={cp.timeRow}>
                <View style={cp.timeTrack}>
                  <View style={[cp.timeDot, { backgroundColor: i === 0 ? esc.dot : c.border }]} />
                  {i < arr.length - 1 && <View style={[cp.timeLine, { backgroundColor: c.border }]} />}
                </View>
                <View style={cp.timeContent}>
                  <View style={[cp.timeStatus, { backgroundColor: esc.bg }]}>
                    <Text style={[cp.timeStatusText, { color: esc.text }]}>
                      {STATUS_LABELS[entry.status as ApplicationStatus] ?? entry.status}
                    </Text>
                  </View>
                  <Text style={[cp.timeDate, { color: c.textMuted }]}>{fmt(entry.changedAt)}</Text>
                  {entry.message && <Text style={[cp.timeMsg, { color: c.textMuted }]}>{entry.message}</Text>}
                </View>
              </View>
            );
          })}
        </SectionCard>
      )}

      {/* Status update modal */}
      <Modal visible={showStatusModal} animationType="slide" transparent>
        <View style={[cp.overlay]}>
          <View style={[cp.modalSheet, { backgroundColor: c.surface }]}>
            <View style={[cp.modalHeader, { borderBottomColor: c.border }]}>
              <Text style={[cp.modalTitle, { color: c.text }]}>Update Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color={c.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: '75%' }} contentContainerStyle={{ padding: 16 }}>
              {/* Status options */}
              {COMPANY_STATUSES.map(st => {
                const stSC = SC[st];
                const isSelected = selectedStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setSelectedStatus(st)}
                    style={[cp.statusOption, { backgroundColor: isSelected ? stSC.bg : c.background, borderColor: isSelected ? stSC.dot : c.border }]}
                  >
                    <View style={[cp.statusOptionDot, { backgroundColor: stSC.dot }]} />
                    <Text style={[cp.statusOptionText, { color: isSelected ? stSC.text : c.text, fontWeight: isSelected ? '700' : '400' }]}>
                      {STATUS_LABELS[st]}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color={stSC.dot} />}
                  </TouchableOpacity>
                );
              })}

              {/* Message */}
              <Text style={[cp.modalLabel, { color: c.textMuted }]}>Message to Candidate (optional)</Text>
              <View style={[cp.modalInput, { backgroundColor: c.background, borderColor: c.border }]}>
                <TextInput
                  style={[{ color: c.text, fontSize: 14, padding: 4, minHeight: 70 }]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Add a note for the candidate..."
                  placeholderTextColor={c.textMuted}
                  multiline textAlignVertical="top"
                />
              </View>

              {/* Interview fields */}
              {showInterviewFields && (
                <>
                  <Text style={[cp.modalLabel, { color: c.textMuted }]}>Interview Details</Text>
                  {[
                    { label: 'Date (YYYY-MM-DD)', val: interviewDate, set: setInterviewDate, placeholder: '2024-12-01' },
                    { label: 'Time', val: interviewTime, set: setInterviewTime, placeholder: '10:00 AM' },
                    { label: 'Location / Meeting Link', val: interviewLocation, set: setInterviewLocation, placeholder: 'Office / Zoom link' },
                  ].map(field => (
                    <View key={field.label}>
                      <Text style={[{ fontSize: 12, color: c.textMuted, marginBottom: 4 }]}>{field.label}</Text>
                      <View style={[cp.modalInput, { backgroundColor: c.background, borderColor: c.border, marginBottom: 8 }]}>
                        <TextInput
                          style={[{ color: c.text, fontSize: 14, padding: 4 }]}
                          value={field.val}
                          onChangeText={field.set}
                          placeholder={field.placeholder}
                          placeholderTextColor={c.textMuted}
                        />
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Submit */}
              <TouchableOpacity
                onPress={submitStatusUpdate}
                disabled={!selectedStatus || updateMut.isPending}
                style={[cp.submitBtn, { backgroundColor: selectedStatus ? (SC[selectedStatus]?.dot ?? c.primary) : c.border }]}
              >
                {updateMut.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={cp.submitBtnText}>Update Status</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Atoms ────────────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon, iconColor, c, children }: any) => (
  <View style={[cp.card, { backgroundColor: c.card ?? c.surface, borderColor: c.border }]}>
    <View style={[cp.cardHeader, { borderBottomColor: c.border }]}>
      <Ionicons name={icon} size={17} color={iconColor} />
      <Text style={[cp.cardTitle, { color: c.text }]}>{title}</Text>
    </View>
    <View style={cp.cardBody}>{children}</View>
  </View>
);

const InfoRow = ({ icon, label, value, c }: any) => (
  <View style={cp.infoRow}>
    <Ionicons name={icon} size={14} color={c.textMuted} />
    <Text style={[cp.infoLabel, { color: c.textMuted }]}>{label}:</Text>
    <Text style={[cp.infoValue, { color: c.text }]} numberOfLines={1}>{value}</Text>
  </View>
);

const cp = StyleSheet.create({
  statusBanner:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, gap: 8, marginBottom: 12, borderWidth: 1 },
  statusDot:       { width: 10, height: 10, borderRadius: 5 },
  statusLabel:     { fontSize: 15, fontWeight: '700' },
  changeBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  changeBtnText:   { fontSize: 12, fontWeight: '700' },
  quickRow:        { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 11, borderRadius: 12 },
  quickBtnText:    { fontSize: 12, fontWeight: '700' },
  candHero:        { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 8 },
  candAvatar:      { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  candAvatarText:  { fontSize: 22, fontWeight: '700', color: '#fff' },
  candName:        { fontSize: 16, fontWeight: '700' },
  candEmail:       { fontSize: 13, marginTop: 2 },
  candPhone:       { fontSize: 13, marginTop: 2 },
  bio:             { fontSize: 13, lineHeight: 19 },
  card:            { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1 },
  cardTitle:       { fontSize: 15, fontWeight: '700' },
  cardBody:        { padding: 14 },
  body:            { fontSize: 14, lineHeight: 22 },
  infoRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoLabel:       { fontSize: 12, width: 70 },
  infoValue:       { flex: 1, fontSize: 13, fontWeight: '500' },
  fileRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  fileName:        { flex: 1, fontSize: 13, fontWeight: '500' },
  tagsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:             { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagText:         { fontSize: 12, fontWeight: '600' },
  expItem:         { paddingBottom: 12, marginBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  expCompany:      { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  expPos:          { fontSize: 13, marginBottom: 2 },
  expDates:        { fontSize: 12, marginBottom: 4 },
  expDesc:         { fontSize: 12, lineHeight: 18 },
  refItem:         { paddingBottom: 12, marginBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  refName:         { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  refSub:          { fontSize: 12, marginBottom: 4 },
  timeRow:         { flexDirection: 'row', gap: 12, marginBottom: 12 },
  timeTrack:       { alignItems: 'center', width: 14 },
  timeDot:         { width: 14, height: 14, borderRadius: 7 },
  timeLine:        { flex: 1, width: 2, marginTop: 4 },
  timeContent:     { flex: 1 },
  timeStatus:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 3 },
  timeStatusText:  { fontSize: 12, fontWeight: '700' },
  timeDate:        { fontSize: 11, marginBottom: 3 },
  timeMsg:         { fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
  overlay:         { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 16, maxHeight: '90%' },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle:      { fontSize: 18, fontWeight: '700' },
  modalLabel:      { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  modalInput:      { borderRadius: 12, borderWidth: 1.5, padding: 10, marginBottom: 6 },
  statusOption:    { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 12, borderWidth: 1.5, marginBottom: 8, gap: 10 },
  statusOptionDot: { width: 10, height: 10, borderRadius: 5 },
  statusOptionText:{ flex: 1, fontSize: 14 },
  submitBtn:       { paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  submitBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});
