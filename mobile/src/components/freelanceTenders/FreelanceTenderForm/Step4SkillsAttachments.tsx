// mobile/src/components/freelanceTenders/FreelanceTenderForm/Step4SkillsAttachments.tsx
// UPDATED: useTheme() instead of useThemeStore(), all colors from theme

import React, { memo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { MIN_TOUCH_TARGET } from '../../../theme/tokens';
import type { FreelanceTenderFormData } from '../../../types/freelanceTender';

export interface Step4SkillsAttachmentsProps {
  skillsRequired: string[];
  attachmentFiles: Array<{ uri: string; name: string; mimeType: string; size?: number }>;
  onChange: (patch: Partial<FreelanceTenderFormData>) => void;
  onAttachmentsChange: (
    files: Array<{ uri: string; name: string; mimeType: string; size?: number }>
  ) => void;
  errors: Record<string, string>;
}

const MAX_SKILLS = 20;
const MAX_ATTACHMENTS = 20;

// ─── Skill chip ───────────────────────────────────────────────────────────────

interface SkillChipProps {
  label: string;
  onRemove: () => void;
}

const SkillChip: React.FC<SkillChipProps> = memo(({ label, onRemove }) => {
  const { colors: c, radius } = useTheme();
  return (
    <View style={[styles.skillChip, { backgroundColor: c.primaryBg, borderColor: c.borderAccent, borderRadius: radius.full }]}>
      <Text style={[styles.skillChipText, { color: c.primary }]}>{label}</Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Remove skill ${label}`}
        style={styles.skillRemove}
      >
        <Text style={[styles.skillRemoveText, { color: c.danger }]}>×</Text>
      </TouchableOpacity>
    </View>
  );
});

// ─── Attachment row ───────────────────────────────────────────────────────────

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentRowProps {
  file: { name: string; mimeType: string; size?: number };
  onRemove: () => void;
}

const AttachmentRow: React.FC<AttachmentRowProps> = memo(({ file, onRemove }) => {
  const { colors: c, radius } = useTheme();
  return (
    <View style={[styles.attachRow, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.md }]}>
      <View style={styles.attachInfo}>
        <Text style={[styles.attachName, { color: c.text }]} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={[styles.attachMeta, { color: c.textMuted }]}>
          {file.mimeType.split('/')[1]?.toUpperCase() ?? 'FILE'}
          {file.size ? ` · ${formatBytes(file.size)}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onRemove}
        style={styles.attachRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Remove file ${file.name}`}
      >
        <Text style={[styles.attachRemoveText, { color: c.danger }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

const Step4SkillsAttachments: React.FC<Step4SkillsAttachmentsProps> = memo(
  ({ skillsRequired, attachmentFiles, onChange, onAttachmentsChange, errors }) => {
    const { colors: c, radius, spacing, type } = useTheme();
    const [skillInput, setSkillInput] = useState('');
    const inputRef = useRef<TextInput>(null);

    const addSkill = (raw: string) => {
      const skill = raw.trim().replace(/,+$/, '');
      if (!skill) return;
      if (skillsRequired.length >= MAX_SKILLS) return;
      if (skillsRequired.map((s) => s.toLowerCase()).includes(skill.toLowerCase())) return;
      onChange({ skillsRequired: [...skillsRequired, skill] });
      setSkillInput('');
    };

    const removeSkill = (skill: string) => {
      onChange({ skillsRequired: skillsRequired.filter((s) => s !== skill) });
    };

    const handleSkillKeySubmit = () => {
      addSkill(skillInput);
    };

    const removeAttachment = (index: number) => {
      onAttachmentsChange(attachmentFiles.filter((_, i) => i !== index));
    };

    const handlePickFiles = () => {
      Alert.alert(
        'Attach Files',
        'Use expo-document-picker in the parent screen to pick files, then pass them via onAttachmentsChange.',
        [{ text: 'OK' }]
      );
    };

    const inputStyle = [
      styles.input,
      {
        backgroundColor: c.inputBg,
        borderColor: c.border,
        color: c.text,
        borderRadius: radius.md,
      },
    ];
    const labelStyle = [styles.label, { color: c.text }];
    const errorStyle = [styles.error, { color: c.danger }];
    const hintStyle = [styles.hint, { color: c.textMuted }];

    return (
      <View style={styles.container}>
        {/* Skills */}
        <View style={styles.field}>
          <View style={styles.sectionHeader}>
            <Text style={labelStyle}>Required Skills</Text>
            <Text style={[styles.count, { color: c.textMuted }]}>
              {skillsRequired.length}/{MAX_SKILLS}
            </Text>
          </View>

          {skillsRequired.length > 0 && (
            <View style={styles.chipWrap}>
              {skillsRequired.map((skill) => (
                <SkillChip
                  key={skill}
                  label={skill}
                  onRemove={() => removeSkill(skill)}
                />
              ))}
            </View>
          )}

          {skillsRequired.length < MAX_SKILLS && (
            <View style={styles.skillInputRow}>
              <TextInput
                ref={inputRef}
                style={[inputStyle, { flex: 1 }]}
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={handleSkillKeySubmit}
                placeholder="Type a skill, press Add"
                placeholderTextColor={c.textMuted}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                onPress={handleSkillKeySubmit}
                style={[styles.addSkillBtn, { backgroundColor: c.primary, borderRadius: radius.md }]}
                disabled={!skillInput.trim()}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={[styles.addSkillBtnText, { color: c.textInverse }]}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={hintStyle}>
            Press Add or comma to add. Up to {MAX_SKILLS} skills.
          </Text>
          {errors.skillsRequired ? <Text style={errorStyle}>{errors.skillsRequired}</Text> : null}
        </View>

        {/* Attachments */}
        <View style={styles.field}>
          <View style={styles.sectionHeader}>
            <Text style={labelStyle}>Attachments (optional)</Text>
            <Text style={[styles.count, { color: c.textMuted }]}>
              {attachmentFiles.length}/{MAX_ATTACHMENTS}
            </Text>
          </View>
          <Text style={hintStyle}>
            PDF, DOC, DOCX, XLS, TXT, images — max 10 MB each, up to 20 files.
          </Text>

          {attachmentFiles.length > 0 && (
            <View style={styles.attachList}>
              {attachmentFiles.map((file, i) => (
                <AttachmentRow
                  key={`${file.name}-${i}`}
                  file={file}
                  onRemove={() => removeAttachment(i)}
                />
              ))}
            </View>
          )}

          {attachmentFiles.length < MAX_ATTACHMENTS && (
            <TouchableOpacity
              onPress={handlePickFiles}
              style={[
                styles.dropzone,
                {
                  borderColor: c.borderAccent,
                  backgroundColor: c.primaryBg,
                  borderRadius: radius.md,
                },
              ]}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Text style={[styles.dropzoneIcon, { color: c.primary }]}>📎</Text>
              <Text style={[styles.dropzoneText, { color: c.primary }]}>
                Tap to attach documents
              </Text>
              <Text style={[styles.dropzoneHint, { color: c.textMuted }]}>
                Use expo-document-picker
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

Step4SkillsAttachments.displayName = 'Step4SkillsAttachments';

const styles = StyleSheet.create({
  container: { gap: 4 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  count: { fontSize: 12 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: MIN_TOUCH_TARGET + 6,
  },
  error: { fontSize: 12, marginTop: 4 },
  hint: { fontSize: 11, marginTop: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    borderWidth: 1,
    gap: 4,
  },
  skillChipText: { fontSize: 13, fontWeight: '600' },
  skillRemove: { minWidth: MIN_TOUCH_TARGET - 20, minHeight: MIN_TOUCH_TARGET - 20, alignItems: 'center', justifyContent: 'center' },
  skillRemoveText: { fontSize: 18, lineHeight: 20 },
  skillInputRow: { flexDirection: 'row', gap: 10 },
  addSkillBtn: {
    paddingHorizontal: 18,
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET + 6,
    minWidth: 60,
  },
  addSkillBtnText: { fontSize: 14, fontWeight: '700' },
  attachList: { gap: 8, marginTop: 10 },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  attachInfo: { flex: 1 },
  attachName: { fontSize: 14, fontWeight: '600' },
  attachMeta: { fontSize: 11, marginTop: 2 },
  attachRemove: {
    minWidth: MIN_TOUCH_TARGET - 20,
    minHeight: MIN_TOUCH_TARGET - 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachRemoveText: { fontSize: 18 },
  dropzone: {
    marginTop: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
  },
  dropzoneIcon: { fontSize: 28 },
  dropzoneText: { fontSize: 14, fontWeight: '600' },
  dropzoneHint: { fontSize: 11 },
});

export default Step4SkillsAttachments;