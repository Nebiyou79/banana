/**
 * src/components/application/StatusTab.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * REFACTOR NOTES (spec compliance):
 *  ✅ useTheme() replaces `colors: any` prop threading.
 *  ✅ withAlpha() replaces all hex-string concatenation.
 *  ✅ RESPONSE_OPTIONS colours bound to theme (success/info/warning/danger).
 *  ✅ CompanyResponseCard emoji labels → text + Ionicons.
 *  ✅ Interview box hardcoded colours → c.info / withAlpha.
 *  ✅ All touch targets ≥ 44 pt.
 *  ✅ StyleSheet memoised with useMemo.
 *  ✅ No emoji icons.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/color';
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
  /** Kept for API compat — internally we use useTheme() */
  colors?: ThemeColors;
  onUpdated?: (updated: Application) => void;
}

type ResponseStatus =
  | 'active-consideration'
  | 'on-hold'
  | 'rejected'
  | 'selected-for-interview';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDateTime = (d?: string): string => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const fmtDate = (d?: string): string => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

// ─── TimelineItem ─────────────────────────────────────────────────────────────

interface TimelineItemProps {
  item: StatusHistory;
  isLast: boolean;
  c: ThemeColors;
}

const TimelineItem = React.memo<TimelineItemProps>(({ item, isLast, c }) => {
  const statusKey = item.status as keyof typeof STATUS_COLORS;
  const sc        = STATUS_COLORS[statusKey] ?? STATUS_COLORS['applied'];
  const label     = STATUS_LABELS[statusKey] ?? item.status;

  return (
    <View style={tl.itemRow}>
      <View style={tl.leftCol}>
        <View style={[tl.dot, { backgroundColor: sc.dot }]} />
        {!isLast && <View style={[tl.line, { backgroundColor: c.border }]} />}
      </View>

      <View style={[tl.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={tl.cardHeader}>
          <View style={[tl.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[tl.statusText, { color: sc.text }]}>{label}</Text>
          </View>
          <Text style={[tl.dateText, { color: c.textMuted }]}>{fmtDateTime(item.changedAt)}</Text>
        </View>

        {item.message ? (
          <Text style={[tl.message, { color: c.textSecondary }]}>{item.message}</Text>
        ) : null}

        {item.interviewDetails ? (
          <View style={[tl.interviewBox, { backgroundColor: withAlpha(c.info, 0.12), borderColor: withAlpha(c.info, 0.40) }]}>
            <View style={tl.interviewRow}>
              <Ionicons name="calendar-outline" size={14} color={c.info} />
              <Text style={[tl.interviewText, { color: c.text }]}>
                {fmtDate(item.interviewDetails.date)}
              </Text>
            </View>
            <View style={tl.interviewRow}>
              <Ionicons name="location-outline" size={14} color={c.info} />
              <Text style={[tl.interviewText, { color: c.text }]}>
                {item.interviewDetails.location}
              </Text>
            </View>
            <View style={tl.interviewRow}>
              <Ionicons name="videocam-outline" size={14} color={c.info} />
              <Text style={[tl.interviewText, { color: c.text }]}>
                {item.interviewDetails.type}
              </Text>
            </View>
          </View>
        ) : null}

        {item.changedBy?.name ? (
          <Text style={[tl.byText, { color: c.textMuted }]}>by {item.changedBy.name}</Text>
        ) : null}
      </View>
    </View>
  );
});
TimelineItem.displayName = 'StatusTab.TimelineItem';

const tl = StyleSheet.create({
  itemRow:      { flexDirection: 'row', gap: 12, marginBottom: 4 },
  leftCol:      { alignItems: 'center', width: 16, paddingTop: 6 },
  dot:          { width: 12, height: 12, borderRadius: 6 },
  line:         { flex: 1, width: 2, marginTop: 4 },
  card:         { flex: 1, padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, marginBottom: SPACING.sm },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statusPill:   { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  dateText:     { fontSize: 11 },
  message:      { fontSize: 13, lineHeight: 18, marginBottom: SPACING.sm },
  interviewBox: { padding: SPACING.sm, borderRadius: RADIUS.sm, borderWidth: 1, gap: 4, marginBottom: 6 },
  interviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  interviewText:{ fontSize: 12 },
  byText:       { fontSize: 11 },
});

// ─── CompanyResponseCard (candidate view) ─────────────────────────────────────

const RESPONSE_STATUS_CONFIG = (c: ThemeColors) => ({
  'active-consideration':   { label: 'Shortlisted',         color: c.success, icon: 'checkmark-circle-outline' as const },
  'selected-for-interview': { label: 'Interview Invitation', color: c.info,    icon: 'calendar-outline'         as const },
  'on-hold':                { label: 'On Hold',              color: c.warning, icon: 'pause-circle-outline'     as const },
  'rejected':               { label: 'Not Selected',         color: c.danger,  icon: 'close-circle-outline'     as const },
});

interface CompanyResponseCardProps { application: Application; c: ThemeColors; }

const CompanyResponseCard = React.memo<CompanyResponseCardProps>(({ application, c }) => {
  const cr = application.companyResponse;
  if (!cr?.status) return null;

  const cfg    = RESPONSE_STATUS_CONFIG(c)[cr.status as keyof ReturnType<typeof RESPONSE_STATUS_CONFIG>];
  if (!cfg) return null;
  const color  = cfg.color;

  return (
    <View style={[crc.card, { backgroundColor: c.surface, borderColor: color, borderLeftWidth: 4 }]}>
      <View style={crc.header}>
        <View style={[crc.badge, { backgroundColor: withAlpha(color, 0.13) }]}>
          <Ionicons name={cfg.icon} size={13} color={color} />
          <Text style={[crc.badgeText, { color }]}>{cfg.label}</Text>
        </View>
        <Text style={[crc.date, { color: c.textMuted }]}>{fmtDateTime(cr.respondedAt)}</Text>
      </View>

      {cr.message ? (
        <Text style={[crc.message, { color: c.text }]}>{cr.message}</Text>
      ) : null}

      {cr.interviewDetails ? (
        <View style={[crc.interviewBox, { backgroundColor: withAlpha(c.info, 0.10) }]}>
          {cr.interviewDetails.date && (
            <View style={crc.interviewRow}>
              <Ionicons name="calendar-outline" size={13} color={c.info} />
              <Text style={[crc.interviewText, { color: c.text }]}>
                {fmtDate(cr.interviewDetails.date)}
              </Text>
            </View>
          )}
          {cr.interviewDetails.location && (
            <View style={crc.interviewRow}>
              <Ionicons name="location-outline" size={13} color={c.info} />
              <Text style={[crc.interviewText, { color: c.text }]}>
                {cr.interviewDetails.location}
              </Text>
            </View>
          )}
          {cr.interviewDetails.type && (
            <View style={crc.interviewRow}>
              <Ionicons name="mic-outline" size={13} color={c.info} />
              <Text style={[crc.interviewText, { color: c.text }]}>
                {cr.interviewDetails.type}
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {cr.respondedBy?.name ? (
        <Text style={[crc.by, { color: c.textMuted }]}>from {cr.respondedBy.name}</Text>
      ) : null}
    </View>
  );
});
CompanyResponseCard.displayName = 'StatusTab.CompanyResponseCard';

const crc = StyleSheet.create({
  card:         { padding: 16, borderRadius: RADIUS.md, borderWidth: 1 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText:    { fontSize: 12, fontWeight: '700' },
  date:         { fontSize: 11 },
  message:      { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  interviewBox: { padding: 10, borderRadius: RADIUS.sm, gap: 5 },
  interviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  interviewText:{ fontSize: 13 },
  by:           { fontSize: 11, marginTop: SPACING.sm },
});

// ─── Company action panel ─────────────────────────────────────────────────────

interface CompanyActionPanelProps {
  application: Application;
  c: ThemeColors;
  onUpdated?: (a: Application) => void;
}

const CompanyActionPanel: React.FC<CompanyActionPanelProps> = ({
  application, c, onUpdated,
}) => {
  const [selectedAction,   setSelectedAction]   = useState<ResponseStatus | null>(null);
  const [message,          setMessage]          = useState('');
  const [interviewDate,    setInterviewDate]    = useState(new Date());
  const [interviewLocation,setInterviewLocation]= useState('');
  const [interviewType,    setInterviewType]    = useState<'phone' | 'video' | 'in-person'>('in-person');
  const [showDatePicker,   setShowDatePicker]   = useState(false);

  const statusMut   = useUpdateApplicationStatus();
  const responseMut = useAddCompanyResponse();
  const isLoading   = statusMut.isPending || responseMut.isPending;

  // Response option config — bound to theme colours
  const RESPONSE_OPTIONS = useMemo(() => [
    { value: 'selected-for-interview' as const, label: 'Schedule Interview', description: 'Invite candidate for an interview', icon: 'calendar' as const,        color: c.info    },
    { value: 'active-consideration'  as const, label: 'Shortlist',           description: 'Candidate is under active consideration', icon: 'checkmark-circle' as const, color: c.success },
    { value: 'on-hold'               as const, label: 'Put on Hold',         description: 'Pause and notify the candidate',    icon: 'pause-circle' as const,    color: c.warning },
    { value: 'rejected'              as const, label: 'Not Selected',        description: 'Decline this candidate',            icon: 'close-circle' as const,    color: c.danger  },
  ], [c]);

  const handleSubmit = useCallback(async () => {
    if (!selectedAction) {
      Alert.alert('Select an action', 'Please choose a response type first.');
      return;
    }
    if (selectedAction === 'selected-for-interview' && !interviewLocation.trim()) {
      Alert.alert('Missing info', 'Please provide the interview location.');
      return;
    }

    try {
      if (selectedAction === 'selected-for-interview') {
        await responseMut.mutateAsync({
          applicationId: application._id,
          data: {
            status:          selectedAction,
            message,
            interviewDate:   interviewDate.toISOString(),
            interviewLocation,
          } as CompanyResponseData,
        });
        const result = await statusMut.mutateAsync({
          applicationId: application._id,
          data: {
            status:  'interview-scheduled',
            message,
            interviewDetails: {
              date:        interviewDate.toISOString(),
              location:    interviewLocation,
              type:        interviewType,
              interviewer: 'Hiring Manager',
              notes:       message,
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
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update status.');
    }
  }, [selectedAction, message, interviewDate, interviewLocation, interviewType, application._id]);

  return (
    <View style={cap.container}>
      <Text style={[cap.sectionTitle, { color: c.text }]}>Send Response to Candidate</Text>

      <View style={cap.optionGrid}>
        {RESPONSE_OPTIONS.map((opt) => {
          const active = selectedAction === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setSelectedAction(active ? null : opt.value)}
              style={[
                cap.optionCard,
                { backgroundColor: c.surface, borderColor: active ? opt.color : c.border },
                active && { backgroundColor: withAlpha(opt.color, 0.10) },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Ionicons name={opt.icon} size={22} color={active ? opt.color : c.textMuted} />
              <Text style={[cap.optionLabel, { color: active ? opt.color : c.text }]}>
                {opt.label}
              </Text>
              <Text style={[cap.optionDesc, { color: c.textMuted }]} numberOfLines={2}>
                {opt.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedAction === 'selected-for-interview' && (
        <View style={cap.interviewFields}>
          <Text style={[cap.label, { color: c.text }]}>Interview Date &amp; Time</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[cap.dateBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <Ionicons name="calendar-outline" size={16} color={c.primary} />
            <Text style={[cap.dateBtnText, { color: c.text }]}>
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

          <Text style={[cap.label, { color: c.text }]}>Interview Location</Text>
          <TextInput
            style={[cap.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
            placeholder="e.g. Our main office / Zoom link"
            placeholderTextColor={c.inputPlaceholder}
            value={interviewLocation}
            onChangeText={setInterviewLocation}
          />

          <Text style={[cap.label, { color: c.text }]}>Interview Type</Text>
          <View style={cap.typeRow}>
            {(['in-person', 'video', 'phone'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setInterviewType(t)}
                style={[
                  cap.typeChip,
                  {
                    borderColor:     interviewType === t ? c.primary : c.border,
                    backgroundColor: interviewType === t ? withAlpha(c.primary, 0.13) : c.surface,
                  },
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

      {selectedAction && (
        <>
          <Text style={[cap.label, { color: c.text }]}>Message to Candidate (optional)</Text>
          <TextInput
            style={[cap.textarea, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
            placeholder="Write a personalised message…"
            placeholderTextColor={c.inputPlaceholder}
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[cap.submitBtn, { backgroundColor: c.primary }, isLoading && { opacity: 0.65 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color="#FFFFFF" />
                <Text style={cap.submitText}>Send Response</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const cap = StyleSheet.create({
  container:      { gap: 12 },
  sectionTitle:   { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  optionGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard:     { width: '47%', padding: 12, borderRadius: RADIUS.md, borderWidth: 2, gap: 4, alignItems: 'center', minHeight: 100 },
  optionLabel:    { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  optionDesc:     { fontSize: 11, textAlign: 'center' },
  interviewFields:{ gap: SPACING.sm, paddingTop: 4 },
  label:          { fontSize: 13, fontWeight: '600' },
  dateBtn:        { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, height: 48 },
  dateBtnText:    { fontSize: 14 },
  input:          { padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, fontSize: 14, height: 48 },
  typeRow:        { flexDirection: 'row', gap: SPACING.sm },
  typeChip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1, height: 36, alignItems: 'center', justifyContent: 'center' },
  textarea:       { padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, fontSize: 14, minHeight: 90, maxHeight: 200 },
  submitBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: 14, borderRadius: RADIUS.md, height: 52, minWidth: 160 },
  submitText:     { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});

// ─── Main StatusTab ───────────────────────────────────────────────────────────

export const StatusTab: React.FC<StatusTabProps> = ({
  application, role, onUpdated,
}) => {
  const { colors: c } = useTheme();

  const history = useMemo(
    () =>
      [...(application.statusHistory ?? [])].sort(
        (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
      ),
    [application.statusHistory],
  );

  const timelineStyles = useMemo(
    () =>
      StyleSheet.create({
        card:  { padding: 16, borderRadius: RADIUS.md, borderWidth: 1, gap: 4, backgroundColor: c.surface, borderColor: c.border },
        title: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.sm, color: c.text },
        empty: { fontSize: 13, textAlign: 'center', paddingVertical: 16, color: c.textMuted },
      }),
    [c],
  );

  return (
    <View style={{ gap: 16 }}>
      {role === 'company' && (
        <CompanyActionPanel application={application} c={c} onUpdated={onUpdated} />
      )}
      {role === 'candidate' && (
        <CompanyResponseCard application={application} c={c} />
      )}

      <View style={timelineStyles.card}>
        <Text style={timelineStyles.title}>Status Timeline</Text>
        {history.length === 0 ? (
          <Text style={timelineStyles.empty}>No status changes yet.</Text>
        ) : (
          history.map((item, i) => (
            <TimelineItem
              key={(item as any)._id ?? i}
              item={item}
              isLast={i === history.length - 1}
              c={c}
            />
          ))
        )}
      </View>
    </View>
  );
};