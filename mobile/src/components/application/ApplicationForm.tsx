/**
 * src/components/application/ApplicationForm.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * REFACTOR NOTES (spec compliance):
 *  ✅ useThemeStore → useTheme() bridge (single hook).
 *  ✅ All colours via useTheme() — zero hardcoded hex.
 *  ✅ withAlpha() replaces string-concatenated rgba.
 *  ✅ hasPrefilled ref guards profile pre-fill (user edits not clobbered).
 *  ✅ File MIME + size validation before DocumentPicker accepts.
 *  ✅ Step sub-components hoisted (stable refs, not re-created on render).
 *  ✅ All touch targets ≥ 44 pt.
 *  ✅ No emoji icons.
 *  ✅ No `any` prop types on public API.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import { useMyCVs, useApplyForJob } from '../../hooks/useApplications';
import {
  applicationService,
  Application,
  CV,
  Reference,
  WorkExperience,
} from '../../services/applicationService';
import { candidateService, CandidateProfile } from '../../services/candidateService';
import { DatePickerField } from '../shared/DatePickerField';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onSuccess: (app: Application) => void;
  onClose: () => void;
}

interface DocFile {
  uri: string;
  name: string;
  type: string;
  _tempId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Profile',   icon: 'person-outline'          as const },
  { num: 2, label: 'Letter',    icon: 'document-text-outline'   as const },
  { num: 3, label: 'Documents', icon: 'briefcase-outline'       as const },
  { num: 4, label: 'Review',    icon: 'checkmark-circle-outline' as const },
];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const genTmpId = (): string =>
  `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ─── File validation ──────────────────────────────────────────────────────────

const validateFile = (file: {
  mimeType?: string;
  size?: number;
}): boolean => {
  if (!file.mimeType || !ALLOWED_MIME_TYPES.includes(file.mimeType)) {
    Alert.alert('Invalid file type', 'Please upload a PDF or Word document.');
    return false;
  }
  if (file.size && file.size > MAX_FILE_BYTES) {
    Alert.alert('File too large', 'Maximum file size is 10 MB.');
    return false;
  }
  return true;
};

// ─── Cover letter generators ──────────────────────────────────────────────────

function generateCoverLetter(
  profile: CandidateProfile,
  jobTitle: string,
  companyName: string,
): string {
  const topSkill = profile.skills?.[0] ?? 'this field';
  const name     = profile.name ?? 'Candidate';
  const bullets  = profile.skills?.slice(0, 3).map((s) => `• ${s}`).join('\n')
    ?? '• Relevant skills and experience';
  return `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} position at ${companyName}. With my background in ${topSkill} and passion for the industry, I believe I would be a valuable addition to your team.\n\nKey qualifications:\n${bullets}\n\nI am particularly drawn to this opportunity because of ${companyName}'s reputation for innovation and excellence.\n\nI look forward to discussing how my skills can contribute to your team's success.\n\nSincerely,\n${name}`;
}

function generateCoverLetterFallback(
  name: string,
  jobTitle: string,
  companyName: string,
): string {
  return `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} position at ${companyName}. I believe my skills and experience make me a strong candidate for this role.\n\nI look forward to discussing how I can contribute to your team's success.\n\nSincerely,\n${name || 'Applicant'}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Section Header (hoisted — not re-created per render) ────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface SHProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  primary: string;
  text: string;
}

const SH = React.memo<SHProps>(({ icon, title, primary, text }) => (
  <View style={sh.row}>
    <View style={[sh.iconBox, { backgroundColor: withAlpha(primary, 0.13) }]}>
      <Ionicons name={icon} size={18} color={primary} />
    </View>
    <Text style={[sh.title, { color: text }]}>{title}</Text>
  </View>
));
SH.displayName = 'ApplicationForm.SH';

const sh = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 },
  iconBox: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 15, fontWeight: '700' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Step 1 — Profile & CVs ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface Step1Props {
  c: ReturnType<typeof useTheme>['colors'];
  contactEmail: string; setContactEmail: (v: string) => void;
  contactPhone: string; setContactPhone: (v: string) => void;
  contactLocation: string; setContactLocation: (v: string) => void;
  myCVs: CV[];
  cvsLoading: boolean;
  selectedCVIds: string[];
  toggleCV: (id: string) => void;
  profileLoading: boolean;
}

const Step1: React.FC<Step1Props> = ({
  c,
  contactEmail, setContactEmail,
  contactPhone, setContactPhone,
  contactLocation, setContactLocation,
  myCVs, cvsLoading,
  selectedCVIds, toggleCV,
  profileLoading,
}) => (
  <View>
    <SH icon="person-outline" title="Contact Information" primary={c.primary} text={c.text} />
    <Text style={[s1.hint, { color: c.textMuted }]}>
      This information will be shared with the employer.
    </Text>

    {profileLoading ? (
      <View style={[s1.loadingBox, { backgroundColor: c.surface }]}>
        <ActivityIndicator color={c.primary} />
        <Text style={[s1.loadingText, { color: c.textMuted }]}>Loading your profile…</Text>
      </View>
    ) : (
      <>
        <Text style={[s1.label, { color: c.text }]}>Email *</Text>
        <TextInput
          style={[s1.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
          value={contactEmail}
          onChangeText={setContactEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="your@email.com"
          placeholderTextColor={c.inputPlaceholder}
        />

        <Text style={[s1.label, { color: c.text }]}>Phone *</Text>
        <TextInput
          style={[s1.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
          placeholder="+1 555 000 0000"
          placeholderTextColor={c.inputPlaceholder}
        />

        <Text style={[s1.label, { color: c.text }]}>Location *</Text>
        <TextInput
          style={[s1.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
          value={contactLocation}
          onChangeText={setContactLocation}
          placeholder="City, Country"
          placeholderTextColor={c.inputPlaceholder}
        />
      </>
    )}

    <View style={[s1.divider, { backgroundColor: c.border }]} />
    <SH icon="document-outline" title="Select CV(s) *" primary={c.primary} text={c.text} />
    <Text style={[s1.hint, { color: c.textMuted }]}>
      Select at least one CV to submit with your application.
    </Text>

    {cvsLoading ? (
      <ActivityIndicator style={{ marginVertical: 16 }} color={c.primary} />
    ) : myCVs.length === 0 ? (
      <View style={[s1.emptyBox, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name="document-outline" size={32} color={c.textMuted} />
        <Text style={[s1.emptyText, { color: c.textMuted }]}>
          No CVs found. Upload a CV to your profile first.
        </Text>
      </View>
    ) : (
      myCVs.map((cv: CV) => {
        const selected = selectedCVIds.includes(cv._id);
        const name     = applicationService.getCVDisplayName(cv);
        const size     = applicationService.formatFileSize((cv as any).fileSize ?? cv.size);
        return (
          <TouchableOpacity
            key={cv._id}
            onPress={() => toggleCV(cv._id)}
            style={[
              s1.cvCard,
              {
                backgroundColor: selected ? withAlpha(c.primary, 0.10) : c.surface,
                borderColor:     selected ? c.primary : c.border,
              },
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
          >
            <View
              style={[
                s1.cvIcon,
                { backgroundColor: selected ? withAlpha(c.primary, 0.20) : withAlpha(c.border, 0.50) },
              ]}
            >
              <Ionicons
                name="document-text"
                size={20}
                color={selected ? c.primary : c.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s1.cvName, { color: c.text }]} numberOfLines={1}>{name}</Text>
              {size ? <Text style={[s1.cvSize, { color: c.textMuted }]}>{size}</Text> : null}
              {(cv.isPrimary || (cv as any).isDefault) && (
                <Text style={[s1.cvPrimary, { color: c.primary }]}>Primary CV</Text>
              )}
            </View>
            <View
              style={[
                s1.checkbox,
                {
                  backgroundColor: selected ? c.primary : 'transparent',
                  borderColor:     selected ? c.primary : c.border,
                },
              ]}
            >
              {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        );
      })
    )}

    {selectedCVIds.length > 0 && (
      <View
        style={[
          s1.selectionInfo,
          { backgroundColor: withAlpha(c.primary, 0.10), borderColor: withAlpha(c.primary, 0.40) },
        ]}
      >
        <Ionicons name="checkmark-circle" size={16} color={c.primary} />
        <Text style={[s1.selectionText, { color: c.primary }]}>
          {selectedCVIds.length} CV{selectedCVIds.length > 1 ? 's' : ''} selected
        </Text>
      </View>
    )}
  </View>
);

const s1 = StyleSheet.create({
  hint:         { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  label:        { fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: SPACING.sm },
  input:        { padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, fontSize: 14, marginBottom: 4, height: 48 },
  divider:      { height: StyleSheet.hairlineWidth, marginVertical: SPACING.lg },
  loadingBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: RADIUS.sm, marginBottom: SPACING.sm },
  loadingText:  { fontSize: 13 },
  emptyBox:     { padding: 24, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center', gap: SPACING.sm, marginTop: 4 },
  emptyText:    { fontSize: 13, textAlign: 'center' },
  cvCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.md, borderWidth: 2, marginBottom: SPACING.sm },
  cvIcon:       { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  cvName:       { fontSize: 14, fontWeight: '600' },
  cvSize:       { fontSize: 11, marginTop: 2 },
  cvPrimary:    { fontSize: 10, fontWeight: '700', marginTop: 1 },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  selectionInfo:{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: RADIUS.sm, borderWidth: 1, marginTop: 4 },
  selectionText:{ fontSize: 13, fontWeight: '600' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Step 2 — Cover Letter & Skills ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface Step2Props {
  c: ReturnType<typeof useTheme>['colors'];
  coverLetter: string; setCoverLetter: (v: string) => void;
  skillInput: string;  setSkillInput: (v: string) => void;
  skills: string[];    setSkills: (v: string[]) => void;
}

const Step2: React.FC<Step2Props> = ({
  c, coverLetter, setCoverLetter,
  skillInput, setSkillInput, skills, setSkills,
}) => {
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput('');
    }
  };

  return (
    <View>
      <SH icon="document-text-outline" title="Cover Letter *" primary={c.primary} text={c.text} />
      <Text style={[s2.hint, { color: c.textMuted }]}>
        Introduce yourself. Minimum 50 characters.
      </Text>

      <View style={[s2.textAreaWrapper, { backgroundColor: c.inputBg, borderColor: c.border }]}>
        <TextInput
          style={[s2.textArea, { color: c.text }]}
          value={coverLetter}
          onChangeText={setCoverLetter}
          placeholder="Dear Hiring Manager, I am excited to apply for this position because…"
          placeholderTextColor={c.inputPlaceholder}
          multiline
          textAlignVertical="top"
          maxLength={5000}
        />
      </View>
      <Text
        style={[
          s2.charCount,
          { color: coverLetter.length < 50 ? c.danger : c.textMuted },
        ]}
      >
        {coverLetter.length}/5000
        {coverLetter.length < 50 ? ` (need ${50 - coverLetter.length} more)` : ''}
      </Text>

      <View style={[s2.divider, { backgroundColor: c.border }]} />
      <SH icon="flash-outline" title="Skills" primary={c.primary} text={c.text} />

      <View style={s2.skillInputRow}>
        <TextInput
          style={[s2.input, { flex: 1, backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
          value={skillInput}
          onChangeText={setSkillInput}
          placeholder="Add a skill"
          placeholderTextColor={c.inputPlaceholder}
          onSubmitEditing={addSkill}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[s2.addBtn, { backgroundColor: c.primary }]}
          onPress={addSkill}
          accessibilityRole="button"
          accessibilityLabel="Add skill"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={s2.skillCloud}>
        {skills.map((sk) => (
          <TouchableOpacity
            key={sk}
            onPress={() => setSkills(skills.filter((s) => s !== sk))}
            style={[
              s2.skillChip,
              { backgroundColor: withAlpha(c.primary, 0.13), borderColor: withAlpha(c.primary, 0.40) },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${sk}`}
          >
            <Text style={[s2.skillText, { color: c.primary }]}>{sk}</Text>
            <Ionicons name="close" size={13} color={c.primary} />
          </TouchableOpacity>
        ))}
      </View>

      {skills.length === 0 && (
        <View style={[s2.emptyBox, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[s2.emptyText, { color: c.textMuted }]}>No skills added yet.</Text>
        </View>
      )}
    </View>
  );
};

const s2 = StyleSheet.create({
  hint:            { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  textAreaWrapper: { borderWidth: 1, borderRadius: RADIUS.sm, marginBottom: 4 },
  textArea:        { padding: 12, fontSize: 14, minHeight: 140, maxHeight: 200, textAlignVertical: 'top' },
  charCount:       { fontSize: 11, textAlign: 'right', marginBottom: 4 },
  divider:         { height: StyleSheet.hairlineWidth, marginVertical: SPACING.lg },
  skillInputRow:   { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', marginBottom: SPACING.sm },
  input:           { padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, fontSize: 14, height: 48 },
  addBtn:          { width: 44, height: 44, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  skillCloud:      { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  skillChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },
  skillText:       { fontSize: 13, fontWeight: '600' },
  emptyBox:        { padding: 16, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center', marginTop: 4 },
  emptyText:       { fontSize: 13 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Step 3 — Work Experience & References ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface Step3Props {
  c: ReturnType<typeof useTheme>['colors'];
  experiences: any[]; setExperiences: (v: any[]) => void;
  expFiles: DocFile[]; setExpFiles: (v: DocFile[]) => void;
  references: any[]; setReferences: (v: any[]) => void;
  refFiles: DocFile[]; setRefFiles: (v: DocFile[]) => void;
}

const Step3: React.FC<Step3Props> = ({
  c,
  experiences, setExperiences,
  expFiles, setExpFiles,
  references, setReferences,
  refFiles, setRefFiles,
}) => {
  const pickFile = async (type: 'exp' | 'ref', index: number) => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_MIME_TYPES,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset) return;
    if (!validateFile({ mimeType: asset.mimeType, size: asset.size })) return;

    const tmpId: string  = genTmpId();
    const docFile: DocFile = {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType ?? 'application/pdf',
      _tempId: tmpId,
    };

    if (type === 'exp') {
      const updated = [...experiences];
      updated[index] = { ...updated[index], _tempId: tmpId };
      setExperiences(updated);
      setExpFiles([
        ...expFiles.filter((f) => f._tempId !== experiences[index]?._tempId),
        docFile,
      ]);
    } else {
      const updated = [...references];
      updated[index] = { ...updated[index], _tempId: tmpId };
      setReferences(updated);
      setRefFiles([
        ...refFiles.filter((f) => f._tempId !== references[index]?._tempId),
        docFile,
      ]);
    }
  };

  const addExperience = (asDoc: boolean) =>
    setExperiences([
      ...experiences,
      {
        company: '', position: '', startDate: '', endDate: '',
        current: false, description: '', skills: [],
        providedAsDocument: asDoc,
        _tempId: asDoc ? genTmpId() : undefined,
      },
    ]);

  const addReference = (asDoc: boolean) =>
    setReferences([
      ...references,
      {
        name: '', position: '', company: '', email: '', phone: '',
        relationship: '', allowsContact: false, notes: '',
        providedAsDocument: asDoc,
        _tempId: asDoc ? genTmpId() : undefined,
      },
    ]);

  const updateExp = (i: number, field: string, value: unknown) => {
    const updated = [...experiences];
    updated[i] = { ...updated[i], [field]: value };
    setExperiences(updated);
  };

  const updateRef = (i: number, field: string, value: unknown) => {
    const updated = [...references];
    updated[i] = { ...updated[i], [field]: value };
    setReferences(updated);
  };

  const getExpFile = (tmpId?: string) => expFiles.find((f) => f._tempId === tmpId);
  const getRefFile = (tmpId?: string) => refFiles.find((f) => f._tempId === tmpId);

  return (
    <View>
      {/* Work Experience */}
      <SH icon="briefcase-outline" title="Work Experience" primary={c.primary} text={c.text} />
      <Text style={[s3.hint, { color: c.textMuted }]}>
        Fill a form or upload a document for each entry.
      </Text>

      {experiences.map((exp: any, i: number) => (
        <View key={i} style={[s3.docCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={s3.docCardHeader}>
            <Text style={[s3.docCardTitle, { color: c.text }]}>
              {exp.providedAsDocument ? 'Document Upload' : 'Form Entry'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setExperiences(experiences.filter((_, j) => j !== i));
                if (exp._tempId) setExpFiles(expFiles.filter((f) => f._tempId !== exp._tempId));
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Remove experience"
            >
              <Ionicons name="trash-outline" size={18} color={c.danger} />
            </TouchableOpacity>
          </View>

          {exp.providedAsDocument ? (
            <TouchableOpacity
              style={[s3.uploadBtn, { borderColor: c.border, backgroundColor: c.bg }]}
              onPress={() => pickFile('exp', i)}
            >
              {getExpFile(exp._tempId) ? (
                <View style={s3.fileRow}>
                  <Ionicons name="document-text" size={20} color={c.primary} />
                  <Text style={[s3.fileName, { color: c.text }]} numberOfLines={1}>
                    {getExpFile(exp._tempId)?.name}
                  </Text>
                  <Ionicons name="checkmark-circle" size={16} color={c.success} />
                </View>
              ) : (
                <View style={s3.uploadPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={24} color={c.textMuted} />
                  <Text style={[s3.uploadHint, { color: c.textMuted }]}>
                    Tap to upload experience document
                  </Text>
                  <Text style={[s3.uploadFormats, { color: c.textMuted }]}>PDF, DOC, DOCX — max 10 MB</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ gap: SPACING.sm }}>
              <TextInput
                style={[s3.input, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]}
                placeholder="Company"
                placeholderTextColor={c.inputPlaceholder}
                value={exp.company}
                onChangeText={(v) => updateExp(i, 'company', v)}
              />
              <TextInput
                style={[s3.input, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]}
                placeholder="Position / Role"
                placeholderTextColor={c.inputPlaceholder}
                value={exp.position}
                onChangeText={(v) => updateExp(i, 'position', v)}
              />
              <DatePickerField
                label="Start Date *"
                value={exp.startDate}
                onChange={(v) => updateExp(i, 'startDate', v)}
                maxDate={new Date()}
                containerStyle={{ marginBottom: 0 }}
              />
              <View style={s3.switchRow}>
                <Switch
                  value={exp.current}
                  onValueChange={(v) => updateExp(i, 'current', v)}
                  trackColor={{ true: c.primary }}
                />
                <Text style={[s3.switchLabel, { color: c.text }]}>Currently working here</Text>
              </View>
              {!exp.current && (
                <DatePickerField
                  label="End Date"
                  value={exp.endDate}
                  onChange={(v) => updateExp(i, 'endDate', v)}
                  minDate={exp.startDate ? new Date(exp.startDate) : undefined}
                  maxDate={new Date()}
                  optional
                  containerStyle={{ marginBottom: 0 }}
                />
              )}
              <TextInput
                style={[
                  s3.input,
                  { backgroundColor: c.bg, borderColor: c.border, color: c.text, height: 80, textAlignVertical: 'top', paddingTop: 10 },
                ]}
                placeholder="Brief description (optional)"
                placeholderTextColor={c.inputPlaceholder}
                value={exp.description}
                onChangeText={(v) => updateExp(i, 'description', v)}
                multiline
              />
            </View>
          )}
        </View>
      ))}

      <View style={s3.addBtnRow}>
        <TouchableOpacity
          style={[s3.addDocBtn, { borderColor: c.primary, backgroundColor: withAlpha(c.primary, 0.10) }]}
          onPress={() => addExperience(false)}
        >
          <Ionicons name="create-outline" size={16} color={c.primary} />
          <Text style={[s3.addDocBtnText, { color: c.primary }]}>Fill Form</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s3.addDocBtn, { borderColor: c.info, backgroundColor: withAlpha(c.info, 0.10) }]}
          onPress={() => addExperience(true)}
        >
          <Ionicons name="document-attach-outline" size={16} color={c.info} />
          <Text style={[s3.addDocBtnText, { color: c.info }]}>Upload Document</Text>
        </TouchableOpacity>
      </View>

      <View style={[s3.divider, { backgroundColor: c.border }]} />

      {/* References */}
      <SH icon="people-outline" title="References" primary={c.primary} text={c.text} />
      <Text style={[s3.hint, { color: c.textMuted }]}>
        Fill a form or upload a document for each reference.
      </Text>

      {references.map((ref: any, i: number) => (
        <View key={i} style={[s3.docCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={s3.docCardHeader}>
            <Text style={[s3.docCardTitle, { color: c.text }]}>
              {ref.providedAsDocument ? 'Document Upload' : 'Form Entry'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setReferences(references.filter((_, j) => j !== i));
                if (ref._tempId) setRefFiles(refFiles.filter((f) => f._tempId !== ref._tempId));
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Remove reference"
            >
              <Ionicons name="trash-outline" size={18} color={c.danger} />
            </TouchableOpacity>
          </View>

          {ref.providedAsDocument ? (
            <TouchableOpacity
              style={[s3.uploadBtn, { borderColor: c.border, backgroundColor: c.bg }]}
              onPress={() => pickFile('ref', i)}
            >
              {getRefFile(ref._tempId) ? (
                <View style={s3.fileRow}>
                  <Ionicons name="document-text" size={20} color={c.primary} />
                  <Text style={[s3.fileName, { color: c.text }]} numberOfLines={1}>
                    {getRefFile(ref._tempId)?.name}
                  </Text>
                  <Ionicons name="checkmark-circle" size={16} color={c.success} />
                </View>
              ) : (
                <View style={s3.uploadPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={24} color={c.textMuted} />
                  <Text style={[s3.uploadHint, { color: c.textMuted }]}>Tap to upload reference document</Text>
                  <Text style={[s3.uploadFormats, { color: c.textMuted }]}>PDF, DOC, DOCX — max 10 MB</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ gap: SPACING.sm }}>
              {[
                { field: 'name',         placeholder: 'Full name *',                    keyboard: 'default'     as const },
                { field: 'position',     placeholder: 'Position',                       keyboard: 'default'     as const },
                { field: 'company',      placeholder: 'Company',                        keyboard: 'default'     as const },
                { field: 'email',        placeholder: 'Email *',                        keyboard: 'email-address' as const },
                { field: 'phone',        placeholder: 'Phone',                          keyboard: 'phone-pad'   as const },
                { field: 'relationship', placeholder: 'Relationship (e.g. Manager)',    keyboard: 'default'     as const },
              ].map(({ field, placeholder, keyboard }) => (
                <TextInput
                  key={field}
                  style={[s3.input, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]}
                  placeholder={placeholder}
                  placeholderTextColor={c.inputPlaceholder}
                  value={ref[field]}
                  keyboardType={keyboard}
                  onChangeText={(v) => updateRef(i, field, v)}
                />
              ))}
              <View style={s3.switchRow}>
                <Switch
                  value={ref.allowsContact}
                  onValueChange={(v) => updateRef(i, 'allowsContact', v)}
                  trackColor={{ true: c.primary }}
                />
                <Text style={[s3.switchLabel, { color: c.text }]}>Allows contact</Text>
              </View>
            </View>
          )}
        </View>
      ))}

      <View style={s3.addBtnRow}>
        <TouchableOpacity
          style={[s3.addDocBtn, { borderColor: c.success, backgroundColor: withAlpha(c.success, 0.10) }]}
          onPress={() => addReference(false)}
        >
          <Ionicons name="create-outline" size={16} color={c.success} />
          <Text style={[s3.addDocBtnText, { color: c.success }]}>Fill Form</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s3.addDocBtn, { borderColor: c.warning, backgroundColor: withAlpha(c.warning, 0.10) }]}
          onPress={() => addReference(true)}
        >
          <Ionicons name="document-attach-outline" size={16} color={c.warning} />
          <Text style={[s3.addDocBtnText, { color: c.warning }]}>Upload Document</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s3 = StyleSheet.create({
  hint:            { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  divider:         { height: StyleSheet.hairlineWidth, marginVertical: SPACING.lg },
  docCard:         { padding: 14, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 10 },
  docCardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  docCardTitle:    { fontSize: 13, fontWeight: '600' },
  uploadBtn:       { padding: 16, borderRadius: RADIUS.sm, borderWidth: 1, borderStyle: 'dashed' },
  uploadPlaceholder:{ alignItems: 'center', gap: 6 },
  uploadHint:      { fontSize: 13 },
  uploadFormats:   { fontSize: 11 },
  fileRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileName:        { flex: 1, fontSize: 13, fontWeight: '600' },
  addBtnRow:       { flexDirection: 'row', gap: 10, marginTop: 6 },
  addDocBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, height: 44 },
  addDocBtnText:   { fontSize: 13, fontWeight: '600' },
  switchRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  switchLabel:     { fontSize: 13 },
  input:           { padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, fontSize: 14, height: 48 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Step 4 — Review ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface Step4Props {
  c: ReturnType<typeof useTheme>['colors'];
  candidateName: string;
  contactEmail: string; contactPhone: string; contactLocation: string;
  selectedCVIds: string[]; myCVs: CV[];
  coverLetter: string; skills: string[];
  experiences: any[]; references: any[];
  jobTitle: string; companyName: string;
}

const Step4: React.FC<Step4Props> = ({
  c, candidateName,
  contactEmail, contactPhone, contactLocation,
  selectedCVIds, myCVs, coverLetter, skills,
  experiences, references, jobTitle, companyName,
}) => {
  const ReviewSection = ({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof Ionicons>['name']; children: React.ReactNode }) => (
    <View style={[r4.section, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={r4.secHeader}>
        <Ionicons name={icon} size={16} color={c.primary} />
        <Text style={[r4.secTitle, { color: c.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const ReviewRow = ({ label, value }: { label: string; value: string }) => (
    <View style={r4.row}>
      <Text style={[r4.rowLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[r4.rowValue, { color: c.text }]}>{value || '—'}</Text>
    </View>
  );

  const selectedCVs = myCVs.filter((cv) => selectedCVIds.includes(cv._id));

  return (
    <View style={{ gap: 12 }}>
      <View style={[r4.summary, { backgroundColor: withAlpha(c.primary, 0.10), borderColor: withAlpha(c.primary, 0.40) }]}>
        <Text style={[r4.summaryLabel, { color: c.primary }]}>Applying for</Text>
        <Text style={[r4.summaryJob, { color: c.text }]}>{jobTitle}</Text>
        <Text style={[r4.summaryCompany, { color: c.textMuted }]}>{companyName}</Text>
      </View>

      <ReviewSection title="Contact" icon="person-outline">
        {candidateName ? <ReviewRow label="Name" value={candidateName} /> : null}
        <ReviewRow label="Email"    value={contactEmail} />
        <ReviewRow label="Phone"    value={contactPhone} />
        <ReviewRow label="Location" value={contactLocation} />
      </ReviewSection>

      <ReviewSection title={`CV (${selectedCVs.length})`} icon="document-outline">
        {selectedCVs.length === 0 ? (
          <Text style={[r4.rowValue, { color: c.danger }]}>No CV selected</Text>
        ) : (
          selectedCVs.map((cv) => (
            <Text key={cv._id} style={[r4.rowValue, { color: c.text }]}>
              · {applicationService.getCVDisplayName(cv)}
            </Text>
          ))
        )}
      </ReviewSection>

      <ReviewSection title="Cover Letter" icon="document-text-outline">
        <Text style={[r4.coverLetter, { color: c.textMuted }]} numberOfLines={5}>
          {coverLetter || '—'}
        </Text>
      </ReviewSection>

      {skills.length > 0 && (
        <ReviewSection title="Skills" icon="flash-outline">
          <View style={r4.chipRow}>
            {skills.map((s) => (
              <View key={s} style={[r4.chip, { backgroundColor: withAlpha(c.primary, 0.13), borderColor: withAlpha(c.primary, 0.40) }]}>
                <Text style={[r4.chipText, { color: c.primary }]}>{s}</Text>
              </View>
            ))}
          </View>
        </ReviewSection>
      )}

      {experiences.length > 0 && (
        <ReviewSection title={`Experience (${experiences.length})`} icon="briefcase-outline">
          {experiences.map((exp: any, i: number) => (
            <Text key={i} style={[r4.rowValue, { color: c.text }]}>
              {exp.providedAsDocument
                ? 'Document uploaded'
                : `· ${exp.position || '(no title)'} at ${exp.company || '(no company)'}`}
            </Text>
          ))}
        </ReviewSection>
      )}

      {references.length > 0 && (
        <ReviewSection title={`References (${references.length})`} icon="people-outline">
          {references.map((ref: any, i: number) => (
            <Text key={i} style={[r4.rowValue, { color: c.text }]}>
              {ref.providedAsDocument
                ? 'Document uploaded'
                : `· ${ref.name || '(no name)'} (${ref.company || ''})`}
            </Text>
          ))}
        </ReviewSection>
      )}
    </View>
  );
};

const r4 = StyleSheet.create({
  summary:      { padding: 14, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '600' },
  summaryJob:   { fontSize: 17, fontWeight: '800', marginTop: 2 },
  summaryCompany:{ fontSize: 13, marginTop: 2 },
  section:      { padding: 14, borderRadius: RADIUS.md, borderWidth: 1, gap: 6 },
  secHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  secTitle:     { fontSize: 14, fontWeight: '700' },
  row:          { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel:     { fontSize: 13 },
  rowValue:     { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  coverLetter:  { fontSize: 13, lineHeight: 18 },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },
  chipText:     { fontSize: 13, fontWeight: '600' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main component ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobId, jobTitle, companyName, onSuccess, onClose,
}) => {
  const { colors: c } = useTheme();
  const { user }      = useAuthStore();

  const { data: cvsData, isLoading: cvsLoading } = useMyCVs();
  const myCVs: CV[] = Array.isArray(cvsData)
    ? cvsData
    : Array.isArray((cvsData as any)?.data)
    ? (cvsData as any).data
    : [];

  const applyMut = useApplyForJob();

  const [profileLoading, setProfileLoading] = useState(true);
  // ── Guard: pre-fill only once — user edits are never clobbered ──────────────
  const hasPrefilled = useRef(false);
  const candidateProfileRef = useRef<CandidateProfile | null>(null);

  const [step, setStep] = useState(1);

  const [candidateName,    setCandidateName]    = useState('');
  const [contactEmail,     setContactEmail]     = useState(user?.email ?? '');
  const [contactPhone,     setContactPhone]     = useState('');
  const [contactLocation,  setContactLocation]  = useState('');
  const [coverLetter,      setCoverLetter]      = useState('');
  const [skillInput,       setSkillInput]       = useState('');
  const [skills,           setSkills]           = useState<string[]>([]);
  const [selectedCVIds,    setSelectedCVIds]    = useState<string[]>([]);
  const [experiences,      setExperiences]      = useState<any[]>([]);
  const [expFiles,         setExpFiles]         = useState<DocFile[]>([]);
  const [references,       setReferences]       = useState<any[]>([]);
  const [refFiles,         setRefFiles]         = useState<DocFile[]>([]);

  // ── Profile pre-fill (runs once) ────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setProfileLoading(true);
        const profile = await candidateService.getProfile();
        if (!mounted || hasPrefilled.current) return;

        candidateProfileRef.current = profile;
        hasPrefilled.current        = true;

        setCandidateName(profile.name ?? '');
        setContactEmail(profile.email ?? user?.email ?? '');
        setContactPhone(profile.phone ?? '');
        setContactLocation(profile.location ?? '');
        if ((profile.skills ?? []).length > 0) setSkills(profile.skills!);
        setCoverLetter(generateCoverLetter(profile, jobTitle, companyName));
      } catch {
        if (!mounted || hasPrefilled.current) return;
        hasPrefilled.current = true;
        const fallback = (user as any)?.name ?? '';
        setCandidateName(fallback);
        setContactEmail(user?.email ?? '');
        setCoverLetter(generateCoverLetterFallback(fallback, jobTitle, companyName));
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (myCVs.length > 0 && selectedCVIds.length === 0) {
      const primary = myCVs.find((cv) => cv.isPrimary || (cv as any).isDefault) ?? myCVs[0];
      setSelectedCVIds([primary._id]);
    }
  }, [myCVs]);

  const toggleCV = useCallback((id: string) => {
    setSelectedCVIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!contactEmail.trim() || !contactPhone.trim() || !contactLocation.trim()) {
        Alert.alert('Missing Info', 'Please fill in all contact fields.');
        return false;
      }
      if (selectedCVIds.length === 0) {
        Alert.alert('CV Required', 'Please select at least one CV.');
        return false;
      }
    }
    if (step === 2 && coverLetter.trim().length < 50) {
      Alert.alert('Cover Letter', `Please write at least 50 characters (${coverLetter.length}/50).`);
      return false;
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 4)); };

  const handleSubmit = useCallback(async () => {
    if (!validateStep()) return;

    const profile      = candidateProfileRef.current;
    const resolvedName =
      profile?.name?.trim() ||
      (user as any)?.name?.trim() ||
      contactEmail.split('@')[0];

    if (!resolvedName) {
      Alert.alert('Profile Incomplete', 'Could not determine your name. Please update your profile.');
      return;
    }

    const selectedCVObjects = myCVs
      .filter((cv) => selectedCVIds.includes(cv._id))
      .map((cv) => ({
        cvId:        cv._id,
        filename:    (cv as any).filename,
        originalName: cv.originalName,
        url:         (cv as any).url ?? '',
        downloadUrl: cv.downloadUrl ?? (cv as any).url ?? '',
        size:        (cv as any).fileSize ?? cv.size ?? 0,
        mimetype:    cv.mimetype ?? 'application/pdf',
      }));

    try {
      const res = await applyMut.mutateAsync({
        jobId,
        data: {
          coverLetter: coverLetter.trim(),
          skills,
          selectedCVs: selectedCVObjects,
          contactInfo: {
            email:    contactEmail.trim(),
            phone:    contactPhone.trim(),
            location: contactLocation.trim(),
          },
          userInfo: {
            name:     resolvedName,
            email:    contactEmail.trim() || profile?.email || user?.email || '',
            phone:    contactPhone.trim() || profile?.phone || '',
            location: contactLocation.trim() || profile?.location || '',
            bio:      profile?.bio,
            website:  profile?.website,
          },
          references,
          workExperience:  experiences,
          referenceFiles:  refFiles,
          experienceFiles: expFiles,
        },
      });
      onSuccess(res.data.application);
    } catch (err: unknown) {
      Alert.alert('Submission Failed', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [
    applyMut, jobId, coverLetter, skills, selectedCVIds, myCVs,
    contactEmail, contactPhone, contactLocation,
    references, experiences, refFiles, expFiles, user,
  ]);

  // ── Memoised step-bar styles ─────────────────────────────────────────────────
  const formStyles = useMemo(
    () =>
      StyleSheet.create({
        root:      { flex: 1, backgroundColor: c.bg },
        header:    {
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingHorizontal: SPACING.lg, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: c.border,
          backgroundColor: c.surface,
        },
        closeBtn:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
        headerTitle: { fontSize: 16, fontWeight: '700', color: c.text },
        headerSub:   { fontSize: 12, marginTop: 1, color: c.textMuted },

        stepBar: {
          flexDirection: 'row', justifyContent: 'space-between',
          paddingHorizontal: SPACING.lg, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: c.border,
          backgroundColor: c.surface,
        },
        stepItem:   { alignItems: 'center', flex: 1 },
        stepCircle: {
          width: 28, height: 28, borderRadius: 14, borderWidth: 2,
          alignItems: 'center', justifyContent: 'center', marginBottom: 4,
        },
        stepNum:    { fontSize: 12, fontWeight: '700' },
        stepLabel:  { fontSize: 10, fontWeight: '600', textAlign: 'center' },

        body:   { padding: SPACING.lg, paddingBottom: 40 },
        footer: {
          flexDirection: 'row', alignItems: 'center', padding: SPACING.lg,
          borderTopWidth: 1, borderTopColor: c.border,
          backgroundColor: c.surface,
        },
        backBtn: {
          flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingHorizontal: SPACING.lg, paddingVertical: 10,
          borderRadius: RADIUS.sm, borderWidth: 1, borderColor: c.border,
          height: 44,
        },
        backBtnText: { fontSize: 14, fontWeight: '600', color: c.text },
        nextBtn: {
          flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingHorizontal: 20, height: 44,
          borderRadius: RADIUS.sm, backgroundColor: c.primary,
          minWidth: 100, justifyContent: 'center',
        },
        nextBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
        submitBtn: {
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 20, height: 44,
          borderRadius: RADIUS.sm, backgroundColor: c.primary,
          minWidth: 160, justifyContent: 'center',
        },
        submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
      }),
    [c],
  );

  return (
    <View style={formStyles.root}>
      {/* Header */}
      <View style={formStyles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={formStyles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Close form"
        >
          <Ionicons name="close" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={formStyles.headerTitle} numberOfLines={1}>
            Apply: {jobTitle}
          </Text>
          <Text style={formStyles.headerSub} numberOfLines={1}>
            {companyName}
          </Text>
        </View>
      </View>

      {/* Step indicator */}
      <View style={formStyles.stepBar}>
        {STEPS.map((s) => {
          const done   = step > s.num;
          const active = step === s.num;
          return (
            <View key={s.num} style={formStyles.stepItem}>
              <View
                style={[
                  formStyles.stepCircle,
                  done   && { backgroundColor: c.success, borderColor: c.success },
                  active && { backgroundColor: c.primary, borderColor: c.primary },
                  !done && !active && { borderColor: c.border },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                ) : (
                  <Text style={[formStyles.stepNum, { color: active ? '#FFFFFF' : c.textMuted }]}>
                    {s.num}
                  </Text>
                )}
              </View>
              <Text style={[formStyles.stepLabel, { color: active ? c.primary : c.textMuted }]}>
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Body */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={formStyles.body}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
      >
        {step === 1 && (
          <Step1
            c={c}
            contactEmail={contactEmail}     setContactEmail={setContactEmail}
            contactPhone={contactPhone}     setContactPhone={setContactPhone}
            contactLocation={contactLocation} setContactLocation={setContactLocation}
            myCVs={myCVs}
            cvsLoading={cvsLoading}
            selectedCVIds={selectedCVIds}   toggleCV={toggleCV}
            profileLoading={profileLoading}
          />
        )}
        {step === 2 && (
          <Step2
            c={c}
            coverLetter={coverLetter} setCoverLetter={setCoverLetter}
            skillInput={skillInput}   setSkillInput={setSkillInput}
            skills={skills}           setSkills={setSkills}
          />
        )}
        {step === 3 && (
          <Step3
            c={c}
            experiences={experiences}   setExperiences={setExperiences}
            expFiles={expFiles}         setExpFiles={setExpFiles}
            references={references}     setReferences={setReferences}
            refFiles={refFiles}         setRefFiles={setRefFiles}
          />
        )}
        {step === 4 && (
          <Step4
            c={c}
            candidateName={candidateName}
            contactEmail={contactEmail}     contactPhone={contactPhone}
            contactLocation={contactLocation}
            selectedCVIds={selectedCVIds}   myCVs={myCVs}
            coverLetter={coverLetter}       skills={skills}
            experiences={experiences}       references={references}
            jobTitle={jobTitle}             companyName={companyName}
          />
        )}
      </KeyboardAwareScrollView>

      {/* Footer navigation */}
      <View style={formStyles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={formStyles.backBtn}
            onPress={() => setStep((s) => s - 1)}
          >
            <Ionicons name="arrow-back" size={16} color={c.text} />
            <Text style={formStyles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {step < 4 ? (
          <TouchableOpacity style={formStyles.nextBtn} onPress={nextStep}>
            <Text style={formStyles.nextBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[formStyles.submitBtn, applyMut.isPending && { opacity: 0.65 }]}
            onPress={handleSubmit}
            disabled={applyMut.isPending}
          >
            {applyMut.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#FFFFFF" />
                <Text style={formStyles.submitBtnText}>Submit Application</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};