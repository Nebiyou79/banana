import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ApplicationStatus,
  STATUS_LABEL,
  STATUS_COLOR,
  ALLOWED_TRANSITIONS,
} from '../../services/applicationService';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';

interface Props {
  applicationId: string;
  currentStatus: ApplicationStatus;
  visible: boolean;
  onClose: () => void;
  onUpdate: (status: ApplicationStatus, notes?: string) => void;
  isLoading?: boolean;
  colors: any;
  typography: any;
  spacing: any;
}

const ALL_STATUSES: ApplicationStatus[] = [
  'under-review','shortlisted','interview-scheduled','interviewed',
  'offer-pending','offer-made','offer-accepted','offer-rejected','on-hold','rejected',
];

export const StatusUpdateModal: React.FC<Props> = ({
  applicationId,
  currentStatus,
  visible,
  onClose,
  onUpdate,
  isLoading,
  colors,
  typography,
  spacing,
}) => {
  const [selected, setSelected] = useState<ApplicationStatus | null>(null);
  const [notes, setNotes]       = useState('');

  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  const handleUpdate = () => {
    if (!selected) return;
    onUpdate(selected, notes.trim() || undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle */}
          <View style={[s.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={[s.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[s.title, { color: colors.text, fontSize: typography.lg }]}>
                Update Status
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Text style={{ color: colors.textMuted, fontSize: typography.sm }}>Current:</Text>
                <ApplicationStatusBadge status={currentStatus} size="sm" />
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Status list */}
          <ScrollView style={s.scroll} contentContainerStyle={{ padding: spacing[4], gap: 8 }}>
            <Text style={[s.sectionLabel, { color: colors.textMuted, fontSize: typography.xs }]}>
              CHOOSE NEW STATUS
            </Text>
            {ALL_STATUSES.map((status) => {
              const isAllowed  = allowed.includes(status);
              const isSelected = selected === status;
              const color      = STATUS_COLOR[status];

              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    s.statusRow,
                    {
                      backgroundColor: isSelected ? color + '18' : colors.background,
                      borderColor: isSelected ? color : colors.border,
                      opacity: isAllowed ? 1 : 0.35,
                    },
                  ]}
                  onPress={() => isAllowed && setSelected(status)}
                  disabled={!isAllowed}
                >
                  {/* Dot */}
                  <View style={[s.dot, { backgroundColor: color }]} />

                  <Text style={[{ flex: 1, fontSize: typography.base, fontWeight: '600', color: colors.text }]}>
                    {STATUS_LABEL[status]}
                  </Text>

                  {!isAllowed && (
                    <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>locked</Text>
                  )}

                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={color} />}
                </TouchableOpacity>
              );
            })}

            {/* Notes */}
            <Text style={[s.sectionLabel, { color: colors.textMuted, fontSize: typography.xs, marginTop: 8 }]}>
              NOTES FOR CANDIDATE (OPTIONAL)
            </Text>
            <TextInput
              style={[
                s.notes,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.text,
                  fontSize: typography.base,
                },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a message for the candidate…"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Footer */}
          <View style={[s.footer, { borderTopColor: colors.border, padding: spacing[4] }]}>
            <TouchableOpacity
              style={[s.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: typography.base }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.updateBtn,
                { backgroundColor: selected ? colors.primary : colors.border },
              ]}
              onPress={handleUpdate}
              disabled={!selected || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.base }}>
                  Update Status
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  handle:     { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title:      { fontWeight: '800' },
  scroll:     { flexShrink: 1 },
  sectionLabel: { fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1.5, padding: 12 },
  dot:        { width: 10, height: 10, borderRadius: 5 },
  notes:      { borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 96 },
  footer:     { flexDirection: 'row', gap: 10, borderTopWidth: 1 },
  cancelBtn:  { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  updateBtn:  { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
});
