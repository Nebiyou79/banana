/**
 * src/components/application/StatusTab.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared "Status" tab.
 *
 * Candidate view  → read-only timeline + company response cards
 * Company view    → status picker + interview scheduler + history
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Application,
  StatusHistory,
  STATUS_LABELS,
  STATUS_COLORS,
  UpdateStatusData,
  CompanyResponseData,
} from '../../services/applicationService';
import {
  useUpdateApplicationStatus,
  useAddCompanyResponse,
} from '../../hooks/useApplications';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusTabProps {
  application: Application;
  role: 'candidate' | 'company';
  colors: any;
  onUpdated?: (updated: Application) => void;
}

type ResponseStatus = 'active-consideration' | 'on-hold' | 'rejected' | 'selected-for-interview';

const RESPONSE_OPTIONS: Array<{
  value: ResponseStatus;
  label: string;
  description: string;
  icon: string;
  color: string;
}> = [
  {
    value: 'selected-for-interview',
    label: 'Schedule Interview',
    description: 'Invite candidate for an interview',
    icon: 'calendar',
    color: '#8B5CF6',
  },
  {
    value: 'active-consideration',
    label: 'Shortlist',
    description: 'Candidate is under active consideration',
    icon: 'checkmark-circle',
    color: '#10B981',
  },
  {
    value: 'on-hold',
    label: 'Put on Hold',
    description: 'Pause and notify the candidate',
    icon: 'pause-circle',
    color: '#F59E0B',
  },
  {
    value: 'rejected',
    label: 'Not Selected',
    description: 'Decline this candidate',
    icon: 'close-circle',
    color: '#EF4444',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d?: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatDateOnly = (d?: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

// ─── Timeline item ────────────────────────────────────────────────────────────

const TimelineItem: React.FC<{
  item: StatusHistory;
  isLast: boolean;
  colors: any;
}> = ({ item, isLast, colors: c }) => {
  const statusKey = item.status as keyof typeof STATUS_COLORS;
  const sc = STATUS_COLORS[statusKey] ?? STATUS_COLORS['applied'];
  const label = STATUS_LABELS[statusKey] ?? item.status;

  return (
    <View style={t.itemRow}>
      {/* Left column — dot + line */}
      <View style={t.leftCol}>
        <View style={[t.dot, { backgroundColor: sc.dot }]} />
        {!isLast && <View style={[t.line, { backgroundColor: c.border }]} />}
      </View>

      {/* Content */}
      <View style={[t.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={t.cardHeader}>
          <View style={[t.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[t.statusText, { color: sc.text }]}>{label}</Text>
          </View>
          <Text style={[t.dateText, { color: c.textMuted }]}>{formatDate(item.changedAt)}</Text>
        </View>

        {item.message ? (
          <Text style={[t.message, { color: c.textSecondary ?? c.text }]}>{item.message}</Text>
        ) : null}

        {item.interviewDetails ? (
          <View style={[t.interviewBox, { backgroundColor: `#8B5CF620`, borderColor: '#8B5CF6' }]}>
            <View style={t.interviewRow}>
              <Ionicons name="calendar-outline" size={14} color="#8B5CF6" />
              <Text style={[t.interviewText, { color: c.text }]}>
                {formatDateOnly(item.interviewDetails.date)}
              </Text>
            </View>
            <View style={t.interviewRow}>
              <Ionicons name="location-outline" size={14} color="#8B5CF6" />
              <Text style={[t.interviewText, { color: c.text }]}>
                {item.interviewDetails.location}
              </Text>
            </View>
            <View style={t.interviewRow}>
              <Ionicons name="videocam-outline" size={14} color="#8B5CF6" />
              <Text style={[t.interviewText, { color: c.text }]}>
                {item.interviewDetails.type}
              </Text>
            </View>
          </View>
        ) : null}

        {item.changedBy?.name ? (
          <Text style={[t.byText, { color: c.textMuted }]}>by {item.changedBy.name}</Text>
        ) : null}
      </View>
    </View>
  );
};

// ─── Company response card (candidate view) ───────────────────────────────────

const CompanyResponseCard: React.FC<{ application: Application; colors: any }> = ({
  application,
  colors: c,
}) => {
  const cr = application.companyResponse;
  if (!cr?.status) return null;

  const label =
    cr.status === 'active-consideration' ? 'Shortlisted' :
    cr.status === 'selected-for-interview' ? 'Interview Invitation' :
    cr.status === 'on-hold' ? 'On Hold' : 'Not Selected';

  const color =
    cr.status === 'active-consideration' ? '#10B981' :
    cr.status === 'selected-for-interview' ? '#8B5CF6' :
    cr.status === 'on-hold' ? '#F59E0B' : '#EF4444';

  return (
    <View style={[cr_s.card, { backgroundColor: c.surface, borderColor: color, borderLeftWidth: 4 }]}>
      <View style={cr_s.header}>
        <View style={[cr_s.badge, { backgroundColor: `${color}18` }]}>
          <Text style={[cr_s.badgeText, { color }]}>{label}</Text>
        </View>
        <Text style={[cr_s.date, { color: c.textMuted }]}>{formatDate(cr.respondedAt)}</Text>
      </View>
      {cr.message ? (
        <Text style={[cr_s.message, { color: c.text }]}>{cr.message}</Text>
      ) : null}
      {cr.interviewDetails ? (
        <View style={[cr_s.interviewBox, { backgroundColor: `#8B5CF610` }]}>
          {cr.interviewDetails.date && (
            <Text style={[cr_s.interviewLine, { color: c.text }]}>
              📅 {formatDateOnly(cr.interviewDetails.date)}
            </Text>
          )}
          {cr.interviewDetails.location && (
            <Text style={[cr_s.interviewLine, { color: c.text }]}>
              📍 {cr.interviewDetails.location}
            </Text>
          )}
          {cr.interviewDetails.type && (
            <Text style={[cr_s.interviewLine, { color: c.text }]}>
              🎙 {cr.interviewDetails.type}
            </Text>
          )}
        </View>
      ) : null}
      {cr.respondedBy?.name ? (
        <Text style={[cr_s.by, { color: c.textMuted }]}>from {cr.respondedBy.name}</Text>
      ) : null}
    </View>
  );
};

// ─── Company action panel ─────────────────────────────────────────────────────

const CompanyActionPanel: React.FC<{
  application: Application;
  colors: any;
  onUpdated?: (a: Application) => void;
}> = ({ application, colors: c, onUpdated }) => {
  const [selectedAction, setSelectedAction] = useState<ResponseStatus | null>(null);
  const [message, setMessage] = useState('');
  const [interviewDate, setInterviewDate] = useState(new Date());
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewType, setInterviewType] = useState<'phone' | 'video' | 'in-person'>('in-person');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const statusMut    = useUpdateApplicationStatus();
  const responseMut  = useAddCompanyResponse();
  const isLoading    = statusMut.isPending || responseMut.isPending;

  const handleSubmit = useCallback(async () => {
    if (!selectedAction) {
      Alert.alert('Select an action', 'Please choose a response type first.');
      return;
    }
    if (
      selectedAction === 'selected-for-interview' &&
      (!interviewLocation.trim())
    ) {
      Alert.alert('Missing info', 'Please provide the interview location.');
      return;
    }

    try {
      if (selectedAction === 'selected-for-interview') {
        // Step 1: company-response
        await responseMut.mutateAsync({
          applicationId: application._id,
          data: {
            status: selectedAction,
            message,
            interviewDate: interviewDate.toISOString(),
            interviewLocation,
          } as CompanyResponseData,
        });
        // Step 2: update main status with interview details
        const result = await statusMut.mutateAsync({
          applicationId: application._id,
          data: {
            status: 'interview-scheduled',
            message,
            interviewDetails: {
              date: interviewDate.toISOString(),
              location: interviewLocation,
              type: interviewType,
              interviewer: 'Hiring Manager',
              notes: message,
            },
          } as UpdateStatusData,
        });
        onUpdated?.(result.data.application);
      } else {
        const statusMap: Record<string, string> = {
          'active-consideration': 'shortlisted',
          'on-hold':              'on-hold',
          'rejected':             'rejected',
        };
        const result = await statusMut.mutateAsync({
          applicationId: application._id,
          data: { status: statusMap[selectedAction] ?? selectedAction, message } as UpdateStatusData,
        });
        onUpdated?.(result.data.application);
      }

      Alert.alert('Done', 'Candidate has been notified.');
      setSelectedAction(null);
      setMessage('');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to update status.');
    }
  }, [selectedAction, message, interviewDate, interviewLocation, interviewType, application._id]);

  return (
    <View style={cp.container}>
      <Text style={[cp.sectionTitle, { color: c.text }]}>Send Response to Candidate</Text>

      {/* Action buttons */}
      <View style={cp.optionGrid}>
        {RESPONSE_OPTIONS.map((opt) => {
          const active = selectedAction === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setSelectedAction(active ? null : opt.value)}
              style={[
                cp.optionCard,
                { backgroundColor: c.surface, borderColor: active ? opt.color : c.border },
                active && { backgroundColor: `${opt.color}10` },
              ]}
            >
              <Ionicons name={opt.icon as any} size={22} color={active ? opt.color : c.textMuted} />
              <Text style={[cp.optionLabel, { color: active ? opt.color : c.text }]}>
                {opt.label}
              </Text>
              <Text style={[cp.optionDesc, { color: c.textMuted }]} numberOfLines={2}>
                {opt.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Interview fields */}
      {selectedAction === 'selected-for-interview' && (
        <View style={cp.interviewFields}>
          <Text style={[cp.label, { color: c.text }]}>Interview Date & Time</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[cp.dateBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <Ionicons name="calendar-outline" size={16} color={c.primary} />
            <Text style={[cp.dateBtnText, { color: c.text }]}>
              {interviewDate.toLocaleString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={interviewDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setInterviewDate(date);
              }}
            />
          )}

          <Text style={[cp.label, { color: c.text }]}>Interview Location</Text>
          <TextInput
            style={[cp.input, { backgroundColor: c.inputBg ?? c.surface, borderColor: c.border, color: c.text }]}
            placeholder="e.g. Our main office / Zoom link"
            placeholderTextColor={c.textMuted}
            value={interviewLocation}
            onChangeText={setInterviewLocation}
          />

          <Text style={[cp.label, { color: c.text }]}>Interview Type</Text>
          <View style={cp.typeRow}>
            {(['in-person', 'video', 'phone'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setInterviewType(t)}
                style={[
                  cp.typeChip,
                  { borderColor: interviewType === t ? c.primary : c.border,
                    backgroundColor: interviewType === t ? `${c.primary}15` : c.surface },
                ]}
              >
                <Text style={{ color: interviewType === t ? c.primary : c.textMuted, fontSize: 13 }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Message */}
      {selectedAction && (
        <>
          <Text style={[cp.label, { color: c.text }]}>Message to Candidate (optional)</Text>
          <TextInput
            style={[cp.textarea, { backgroundColor: c.inputBg ?? c.surface, borderColor: c.border, color: c.text }]}
            placeholder="Write a personalised message..."
            placeholderTextColor={c.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[cp.submitBtn, { backgroundColor: c.primary }, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color="#fff" />
                <Text style={cp.submitText}>Send Response</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// ─── Main StatusTab ───────────────────────────────────────────────────────────

export const StatusTab: React.FC<StatusTabProps> = ({
  application, role, colors: c, onUpdated,
}) => {
  const history = [...(application.statusHistory ?? [])].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  return (
    <View style={{ gap: 16 }}>
      {/* Company actions (employer only) */}
      {role === 'company' && (
        <CompanyActionPanel application={application} colors={c} onUpdated={onUpdated} />
      )}

      {/* Company response (candidate view) */}
      {role === 'candidate' && (
        <CompanyResponseCard application={application} colors={c} />
      )}

      {/* Status timeline */}
      <View style={[sec.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[sec.title, { color: c.text }]}>Status Timeline</Text>
        {history.length === 0 ? (
          <Text style={[sec.empty, { color: c.textMuted }]}>No status changes yet.</Text>
        ) : (
          history.map((item, i) => (
            <TimelineItem
              key={item._id ?? i}
              item={item}
              isLast={i === history.length - 1}
              colors={c}
            />
          ))
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const t = StyleSheet.create({
  itemRow:      { flexDirection: 'row', gap: 12, marginBottom: 4 },
  leftCol:      { alignItems: 'center', width: 16, paddingTop: 6 },
  dot:          { width: 12, height: 12, borderRadius: 6 },
  line:         { flex: 1, width: 2, marginTop: 4 },
  card:         { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statusPill:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  dateText:     { fontSize: 11 },
  message:      { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  interviewBox: { padding: 8, borderRadius: 8, borderWidth: 1, gap: 4, marginBottom: 6 },
  interviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  interviewText:{ fontSize: 12 },
  byText:       { fontSize: 11 },
});

const cr_s = StyleSheet.create({
  card:         { padding: 16, borderRadius: 12, borderWidth: 1 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:    { fontSize: 12, fontWeight: '700' },
  date:         { fontSize: 11 },
  message:      { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  interviewBox: { padding: 10, borderRadius: 8, gap: 4 },
  interviewLine:{ fontSize: 13 },
  by:           { fontSize: 11, marginTop: 8 },
});

const cp = StyleSheet.create({
  container:      { gap: 12 },
  sectionTitle:   { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  optionGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard:     {
    width: '47%', padding: 12, borderRadius: 12, borderWidth: 2,
    gap: 4, alignItems: 'center',
  },
  optionLabel:    { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  optionDesc:     { fontSize: 11, textAlign: 'center' },
  interviewFields:{ gap: 8, paddingTop: 4 },
  label:          { fontSize: 13, fontWeight: '600' },
  dateBtn:        {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  dateBtnText:    { fontSize: 14 },
  input:          { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 14 },
  typeRow:        { flexDirection: 'row', gap: 8 },
  typeChip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  textarea:       { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 14, minHeight: 90 },
  submitBtn:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 12,
  },
  submitText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const sec = StyleSheet.create({
  card:   { padding: 16, borderRadius: 12, borderWidth: 1, gap: 4 },
  title:  { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  empty:  { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
});
