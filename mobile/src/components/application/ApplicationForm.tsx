/**
 * src/components/application/ApplicationForm.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXES:
 *  1. DatePickerField integrated for experience startDate/endDate and
 *     reference (no date fields on reference, kept as-is but experience uses picker).
 *  2. Profile pre-fill on mount (name, email, phone, location, skills).
 *  3. Skills pre-filled from candidate profile.
 *  4. File submission with proper types.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeStore } from '../../store/themeStore';
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

const STEPS = [
  { num: 1, label: 'Profile',   icon: 'person-outline' },
  { num: 2, label: 'Letter',    icon: 'document-text-outline' },
  { num: 3, label: 'Documents', icon: 'briefcase-outline' },
  { num: 4, label: 'Review',    icon: 'checkmark-circle-outline' },
];

const genTmpId = () =>
  `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ─── Section Header ───────────────────────────────────────────────────────────

const SH = ({ icon, title, c }: { icon: string; title: string; c: any }) => (
  <View style={fi.sectionHeader}>
    <View style={[fi.sectionIconBox, { backgroundColor: `${c.primary}20` }]}>
      <Ionicons name={icon as any} size={18} color={c.primary} />
    </View>
    <Text style={[fi.sectionTitle, { color: c.text }]}>{title}</Text>
  </View>
);

// ─── STEP 1 — Profile & CVs ───────────────────────────────────────────────────

const Step1 = ({
  c,
  contactEmail, setContactEmail,
  contactPhone, setContactPhone,
  contactLocation, setContactLocation,
  myCVs, cvsLoading,
  selectedCVIds, toggleCV,
  profileLoading,
}: any) => (
  <View>
    <SH icon="person-outline" title="Contact Information" c={c} />
    <Text style={[fi.hint, { color: c.textMuted }]}>
      This information will be shared with the employer.
    </Text>

    {profileLoading ? (
      <View style={[fi.loadingBox, { backgroundColor: c.surface }]}>
        <ActivityIndicator color={c.primary} />
        <Text style={[fi.loadingText, { color: c.textMuted }]}>Loading your profile…</Text>
      </View>
    ) : (
      <>
        <Text style={[fi.label, { color: c.text }]}>Email *</Text>
        <TextInput
          style={[fi.input, { backgroundColor: c.inputBg ?? c.surface, borderColor: c.border, color: c.text }]}
          value={contactEmail}
          onChangeText={setContactEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="your@email.com"
          placeholderTextColor={c.textMuted}
        />

        <Text style={[fi.label, { color: c.text }]}>Phone *</Text>
        <TextInput
          style={[fi.input, { backgroundColor: c.inputBg ?? c.surface, borderColor: c.border, color: c.text }]}
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
          placeholder="+1 555 000 0000"
          placeholderTextColor={c.textMuted}
        />

        <Text style={[fi.label, { color: c.text }]}>Location *</Text>
        <TextInput
          style={[fi.input, { backgroundColor: c.inputBg ?? c.surface, borderColor: c.border, color: c.text }]}
          value={contactLocation}
          onChangeText={setContactLocation}
          placeholder="City, Country"
          placeholderTextColor={c.textMuted}
        />
      </>
    )}

    <View style={[fi.divider, { backgroundColor: c.border }]} />
    <SH icon="document-outline" title="Select CV(s) *" c={c} />
    <Text style={[fi.hint, { color: c.textMuted }]}>
      Select at least one CV to submit with your application.
    </Text>

    {cvsLoading ? (
      <ActivityIndicator style={{ marginVertical: 16 }} color={c.primary} />
    ) : myCVs.length === 0 ? (
      <View style={[fi.emptyBox, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name="document-outline" size={32} color={c.textMuted} />
        <Text style={[fi.emptyText, { color: c.textMuted }]}>
          No CVs found. Upload a CV to your profile first.
        </Text>
      </View>
    ) : (
      myCVs.map((cv: CV) => {
        const selected = selectedCVIds.includes(cv._id);
        const name = applicationService.getCVDisplayName(cv);
        const size = applicationService.formatFileSize(cv.fileSize ?? cv.size);
        return (
          <TouchableOpacity
            key={cv._id}
            onPress={() => toggleCV(cv._id)}
            style={[
              fi.cvCard,
              {
                backgroundColor: selected ? `${c.primary}10` : c.surface,
                borderColor: selected ? c.primary : c.border,
              },
            ]}
          >
            <View style={[fi.cvIcon, { backgroundColor: selected ? `${c.primary}20` : `${c.border}50` }]}>
              <Ionicons name="document-text" size={20} color={selected ? c.primary : c.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[fi.cvName, { color: c.text }]} numberOfLines={1}>{name}</Text>
              {size ? <Text style={[fi.cvSize, { color: c.textMuted }]}>{size}</Text> : null}
              {(cv.isPrimary || (cv as any).isDefault) && (
                <Text style={[fi.cvPrimary, { color: c.primary }]}>Primary CV</Text>
              )}
            </View>
            <View style={[fi.checkbox, {
              backgroundColor: selected ? c.primary : 'transparent',
              borderColor: selected ? c.primary : c.border,
            }]}>
              {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })
    )}

    {selectedCVIds.length > 0 && (
      <View style={[fi.selectionInfo, { backgroundColor: `${c.primary}10`, borderColor: `${c.primary}40` }]}>
        <Ionicons name="checkmark-circle" size={16} color={c.primary} />
        <Text style={[fi.selectionText, { color: c.primary }]}>
          {selectedCVIds.length} CV{selectedCVIds.length > 1 ? 's' : ''} selected
        </Text>
      </View>
    )}
  </View>
);

// ─── STEP 2 — Cover Letter & Skills ──────────────────────────────────────────

const Step2 = ({
  c, coverLetter, setCoverLetter,
  skillInput, setSkillInput,
  skills, setSkills,
}: any) => {
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput('');
    }
  };

  return (
    <View>
      <SH icon="document-text-outline" title="Cover Letter *" c={c} />
      <Text style={[fi.hint, { color: c.textMuted }]}>
        Introduce yourself. Minimum 50 characters.
      </Text>
      <View style={[fi.textAreaWrapper, { backgroundColor: c.inputBg ?? c.surface, borderColor: c.border }]}>
        <TextInput
          style={[fi.textArea, { color: c.text }]}
          value={coverLetter}
          onChangeText={setCoverLetter}
          placeholder="Dear Hiring Manager, I am excited to apply for this position because…"
          placeholderTextColor={c.textMuted}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />
      </View>
      <Text style={[fi.charCount, { color: coverLetter.length < 50 ? '#EF4444' : c.textMuted }]}>
        {coverLetter.length}/5000{coverLetter.length < 50 ? ` (need ${50 - coverLetter.length} more)` : ''}
      </Text>

      <View style={[fi.divider, { backgroundColor: c.border }]} />
      <SH icon="flash-outline" title="Skills" c={c} />
      {skills.length > 0 && (
        <Text style={[fi.hint, { color: c.textMuted }]}>
          Pre-filled from your profile. Add or remove as needed.
        </Text>
      )}
      <View style={fi.skillInputRow}>
        <TextInput
          style={[fi.input, { flex: 1, backgroundColor: c.inputBg ?? c.surface, borderColor: c.border, color: c.text }]}
          value={skillInput}
          onChangeText={setSkillInput}
          placeholder="Add a skill"
          placeholderTextColor={c.textMuted}
          onSubmitEditing={addSkill}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[fi.addBtn, { backgroundColor: c.primary }]}
          onPress={addSkill}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={fi.skillCloud}>
        {skills.map((sk: string) => (
          <TouchableOpacity
            key={sk}
            onPress={() => setSkills(skills.filter((s: string) => s !== sk))}
            style={[fi.skillChip, { backgroundColor: `${c.primary}15`, borderColor: `${c.primary}40` }]}
          >
            <Text style={[fi.skillText, { color: c.primary }]}>{sk}</Text>
            <Ionicons name="close" size={13} color={c.primary} />
          </TouchableOpacity>
        ))}
      </View>
      {skills.length === 0 && (
        <View style={[fi.emptyBox, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[fi.emptyText, { color: c.textMuted }]}>No skills added yet.</Text>
        </View>
      )}
    </View>
  );
};

// ─── STEP 3 — Work Experience & References (with DatePickerField) ─────────────

const Step3 = ({
  c,
  experiences, setExperiences,
  expFiles, setExpFiles,
  references, setReferences,
  refFiles, setRefFiles,
}: any) => {
  const pickFile = async (type: 'exp' | 'ref', index: number) => {
    const res = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset) return;

    const tmpId = genTmpId();
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
        ...expFiles.filter((f: DocFile) => f._tempId !== experiences[index]?._tempId),
        docFile,
      ]);
    } else {
      const updated = [...references];
      updated[index] = { ...updated[index], _tempId: tmpId };
      setReferences(updated);
      setRefFiles([
        ...refFiles.filter((f: DocFile) => f._tempId !== references[index]?._tempId),
        docFile,
      ]);
    }
  };

  const addExperience = (asDoc: boolean) => {
    setExperiences([
      ...experiences,
      {
        company: '', position: '', startDate: '', endDate: '',
        current: false, description: '', skills: [],
        providedAsDocument: asDoc,
        _tempId: asDoc ? genTmpId() : undefined,
      },
    ]);
  };

  const addReference = (asDoc: boolean) => {
    setReferences([
      ...references,
      {
        name: '', position: '', company: '', email: '', phone: '',
        relationship: '', allowsContact: false, notes: '',
        providedAsDocument: asDoc,
        _tempId: asDoc ? genTmpId() : undefined,
      },
    ]);
  };

  const updateExp = (i: number, field: string, value: any) => {
    const updated = [...experiences];
    updated[i] = { ...updated[i], [field]: value };
    setExperiences(updated);
  };

  const updateRef = (i: number, field: string, value: any) => {
    const updated = [...references];
    updated[i] = { ...updated[i], [field]: value };
    setReferences(updated);
  };

  const getExpFile = (tmpId?: string) =>
    expFiles.find((f: DocFile) => f._tempId === tmpId);
  const getRefFile = (tmpId?: string) =>
    refFiles.find((f: DocFile) => f._tempId === tmpId);

  return (
    <View>
      {/* Work Experience */}
      <SH icon="briefcase-outline" title="Work Experience" c={c} />
      <Text style={[fi.hint, { color: c.textMuted }]}>
        Fill a form or upload a document for each entry.
      </Text>

      {experiences.map((exp: WorkExperience & { _tempId?: string; providedAsDocument?: boolean }, i: number) => (
        <View key={i} style={[fi.docCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={fi.docCardHeader}>
            <Text style={[fi.docCardTitle, { color: c.text }]}>
              {exp.providedAsDocument ? '📄 Document Upload' : '📝 Form Entry'}
            </Text>
            <TouchableOpacity onPress={() => {
              setExperiences(experiences.filter((_: any, j: number) => j !== i));
              if ((exp as any)._tempId) setExpFiles(expFiles.filter((f: DocFile) => f._tempId !== (exp as any)._tempId));
            }}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {exp.providedAsDocument ? (
            <TouchableOpacity
              style={[fi.uploadBtn, { borderColor: c.border, backgroundColor: c.background }]}
              onPress={() => pickFile('exp', i)}
            >
              {getExpFile((exp as any)._tempId) ? (
                <View style={fi.fileRow}>
                  <Ionicons name="document-text" size={20} color={c.primary} />
                  <Text style={[fi.fileName, { color: c.text }]} numberOfLines={1}>
                    {getExpFile((exp as any)._tempId)?.name}
                  </Text>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                </View>
              ) : (
                <View style={fi.uploadPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={24} color={c.textMuted} />
                  <Text style={[fi.uploadHint, { color: c.textMuted }]}>
                    Tap to upload experience document
                  </Text>
                  <Text style={[fi.uploadFormats, { color: c.textMuted }]}>PDF, DOC, DOCX</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 8 }}>
              {/* Company */}
              <TextInput
                style={[fi.input, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
                placeholder="Company"
                placeholderTextColor={c.textMuted}
                value={exp.company}
                onChangeText={v => updateExp(i, 'company', v)}
              />
              {/* Position */}
              <TextInput
                style={[fi.input, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
                placeholder="Position/Role"
                placeholderTextColor={c.textMuted}
                value={exp.position}
                onChangeText={v => updateExp(i, 'position', v)}
              />

              {/* ── DatePickerField for Start Date ── */}
              <DatePickerField
                label="Start Date *"
                value={exp.startDate}
                onChange={v => updateExp(i, 'startDate', v)}
                maxDate={new Date()}
                containerStyle={{ marginBottom: 0 }}
              />

              {/* Currently working toggle */}
              <View style={fi.switchRow}>
                <Switch
                  value={exp.current}
                  onValueChange={v => updateExp(i, 'current', v)}
                  trackColor={{ true: c.primary }}
                />
                <Text style={[fi.switchLabel, { color: c.text }]}>Currently working here</Text>
              </View>

              {/* ── DatePickerField for End Date (only if not current) ── */}
              {!exp.current && (
                <DatePickerField
                  label="End Date"
                  value={exp.endDate}
                  onChange={v => updateExp(i, 'endDate', v)}
                  minDate={exp.startDate ? new Date(exp.startDate) : undefined}
                  maxDate={new Date()}
                  optional
                  containerStyle={{ marginBottom: 0 }}
                />
              )}

              {/* Description */}
              <TextInput
                style={[fi.input, { backgroundColor: c.background, borderColor: c.border, color: c.text, height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Brief description (optional)"
                placeholderTextColor={c.textMuted}
                value={exp.description}
                onChangeText={v => updateExp(i, 'description', v)}
                multiline
              />
            </View>
          )}
        </View>
      ))}

      <View style={fi.addBtnRow}>
        <TouchableOpacity
          style={[fi.addDocBtn, { borderColor: c.primary, backgroundColor: `${c.primary}10` }]}
          onPress={() => addExperience(false)}
        >
          <Ionicons name="create-outline" size={16} color={c.primary} />
          <Text style={[fi.addDocBtnText, { color: c.primary }]}>Fill Form</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[fi.addDocBtn, { borderColor: '#8B5CF6', backgroundColor: '#8B5CF610' }]}
          onPress={() => addExperience(true)}
        >
          <Ionicons name="document-attach-outline" size={16} color="#8B5CF6" />
          <Text style={[fi.addDocBtnText, { color: '#8B5CF6' }]}>Upload Document</Text>
        </TouchableOpacity>
      </View>

      <View style={[fi.divider, { backgroundColor: c.border }]} />

      {/* References */}
      <SH icon="people-outline" title="References" c={c} />
      <Text style={[fi.hint, { color: c.textMuted }]}>
        Fill a form or upload a document for each reference.
      </Text>

      {references.map((ref: Reference & { _tempId?: string; providedAsDocument?: boolean }, i: number) => (
        <View key={i} style={[fi.docCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={fi.docCardHeader}>
            <Text style={[fi.docCardTitle, { color: c.text }]}>
              {ref.providedAsDocument ? '📄 Document Upload' : '📝 Form Entry'}
            </Text>
            <TouchableOpacity onPress={() => {
              setReferences(references.filter((_: any, j: number) => j !== i));
              if (ref._tempId) setRefFiles(refFiles.filter((f: DocFile) => f._tempId !== ref._tempId));
            }}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {ref.providedAsDocument ? (
            <TouchableOpacity
              style={[fi.uploadBtn, { borderColor: c.border, backgroundColor: c.background }]}
              onPress={() => pickFile('ref', i)}
            >
              {getRefFile(ref._tempId) ? (
                <View style={fi.fileRow}>
                  <Ionicons name="document-text" size={20} color="#8B5CF6" />
                  <Text style={[fi.fileName, { color: c.text }]} numberOfLines={1}>
                    {getRefFile(ref._tempId)?.name}
                  </Text>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                </View>
              ) : (
                <View style={fi.uploadPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={24} color={c.textMuted} />
                  <Text style={[fi.uploadHint, { color: c.textMuted }]}>
                    Tap to upload reference document
                  </Text>
                  <Text style={[fi.uploadFormats, { color: c.textMuted }]}>PDF, DOC, DOCX</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 8 }}>
              <TextInput
                style={[fi.input, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
                placeholder="Full name *" placeholderTextColor={c.textMuted}
                value={ref.name} onChangeText={v => updateRef(i, 'name', v)}
              />
              <TextInput
                style={[fi.input, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
                placeholder="Position" placeholderTextColor={c.textMuted}
                value={ref.position} onChangeText={v => updateRef(i, 'position', v)}
              />
              <TextInput
                style={[fi.input, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
                placeholder="Company" placeholderTextColor={c.textMuted}
                value={ref.company} onChangeText={v => updateRef(i, 'company', v)}
              />
              <TextInput
                style={[fi.input, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
                placeholder="Email *" placeholderTextColor={c.textMuted}
                value={ref.email} keyboardType="email-address"
                onChangeText={v => updateRef(i, 'email', v)}
              />
              <TextInput
                style={[fi.input, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
                placeholder="Phone" placeholderTextColor={c.textMuted}
                value={ref.phone} keyboardType="phone-pad"
                onChangeText={v => updateRef(i, 'phone', v)}
              />
              <TextInput
                style={[fi.input, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
                placeholder="Relationship (e.g. Manager)" placeholderTextColor={c.textMuted}
                value={ref.relationship} onChangeText={v => updateRef(i, 'relationship', v)}
              />
              <View style={fi.switchRow}>
                <Switch
                  value={ref.allowsContact}
                  onValueChange={v => updateRef(i, 'allowsContact', v)}
                  trackColor={{ true: c.primary }}
                />
                <Text style={[fi.switchLabel, { color: c.text }]}>Allows contact</Text>
              </View>
            </View>
          )}
        </View>
      ))}

      <View style={fi.addBtnRow}>
        <TouchableOpacity
          style={[fi.addDocBtn, { borderColor: '#10B981', backgroundColor: '#10B98110' }]}
          onPress={() => addReference(false)}
        >
          <Ionicons name="create-outline" size={16} color="#10B981" />
          <Text style={[fi.addDocBtnText, { color: '#10B981' }]}>Fill Form</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[fi.addDocBtn, { borderColor: '#F59E0B', backgroundColor: '#F59E0B10' }]}
          onPress={() => addReference(true)}
        >
          <Ionicons name="document-attach-outline" size={16} color="#F59E0B" />
          <Text style={[fi.addDocBtnText, { color: '#F59E0B' }]}>Upload Document</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── STEP 4 — Review & Submit ─────────────────────────────────────────────────

const Step4 = ({
  c, candidateName,
  contactEmail, contactPhone, contactLocation,
  selectedCVIds, myCVs,
  coverLetter, skills,
  experiences, references,
  jobTitle, companyName,
}: any) => {
  const ReviewSection = ({ title, icon, children }: any) => (
    <View style={[fi.reviewSection, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={fi.reviewSectionHeader}>
        <Ionicons name={icon} size={16} color={c.primary} />
        <Text style={[fi.reviewSectionTitle, { color: c.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const ReviewRow = ({ label, value }: { label: string; value: string }) => (
    <View style={fi.reviewRow}>
      <Text style={[fi.reviewLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[fi.reviewValue, { color: c.text }]}>{value || '—'}</Text>
    </View>
  );

  const selectedCVs = myCVs.filter((cv: CV) => selectedCVIds.includes(cv._id));

  return (
    <View style={{ gap: 12 }}>
      <View style={[fi.jobSummary, { backgroundColor: `${c.primary}10`, borderColor: `${c.primary}40` }]}>
        <Text style={[fi.jobSummaryTitle, { color: c.primary }]}>Applying for</Text>
        <Text style={[fi.jobSummaryJob, { color: c.text }]}>{jobTitle}</Text>
        <Text style={[fi.jobSummaryCompany, { color: c.textMuted }]}>{companyName}</Text>
      </View>

      <ReviewSection title="Contact" icon="person-outline">
        {candidateName ? <ReviewRow label="Name" value={candidateName} /> : null}
        <ReviewRow label="Email" value={contactEmail} />
        <ReviewRow label="Phone" value={contactPhone} />
        <ReviewRow label="Location" value={contactLocation} />
      </ReviewSection>

      <ReviewSection title={`CV (${selectedCVs.length})`} icon="document-outline">
        {selectedCVs.length === 0 ? (
          <Text style={[fi.reviewValue, { color: '#EF4444' }]}>⚠ No CV selected</Text>
        ) : (
          selectedCVs.map((cv: CV) => (
            <Text key={cv._id} style={[fi.reviewValue, { color: c.text }]}>
              • {applicationService.getCVDisplayName(cv)}
            </Text>
          ))
        )}
      </ReviewSection>

      <ReviewSection title="Cover Letter" icon="document-text-outline">
        <Text style={[fi.reviewCoverLetter, { color: c.textMuted }]} numberOfLines={5}>
          {coverLetter || '—'}
        </Text>
      </ReviewSection>

      {skills.length > 0 && (
        <ReviewSection title="Skills" icon="flash-outline">
          <View style={fi.skillCloud}>
            {skills.map((s: string) => (
              <View
                key={s}
                style={[fi.skillChip, { backgroundColor: `${c.primary}15`, borderColor: `${c.primary}40` }]}
              >
                <Text style={[fi.skillText, { color: c.primary }]}>{s}</Text>
              </View>
            ))}
          </View>
        </ReviewSection>
      )}

      {experiences.length > 0 && (
        <ReviewSection title={`Experience (${experiences.length})`} icon="briefcase-outline">
          {experiences.map((exp: any, i: number) => (
            <Text key={i} style={[fi.reviewValue, { color: c.text }]}>
              {exp.providedAsDocument
                ? '📄 Document uploaded'
                : `• ${exp.position || '(no title)'} at ${exp.company || '(no company)'}`}
            </Text>
          ))}
        </ReviewSection>
      )}

      {references.length > 0 && (
        <ReviewSection title={`References (${references.length})`} icon="people-outline">
          {references.map((ref: any, i: number) => (
            <Text key={i} style={[fi.reviewValue, { color: c.text }]}>
              {ref.providedAsDocument
                ? '📄 Document uploaded'
                : `• ${ref.name || '(no name)'} (${ref.company || ''})`}
            </Text>
          ))}
        </ReviewSection>
      )}
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobId, jobTitle, companyName, onSuccess, onClose,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const { user } = useAuthStore();

  const { data: cvsData, isLoading: cvsLoading } = useMyCVs();
  const myCVs: CV[] = Array.isArray(cvsData)
    ? cvsData
    : Array.isArray((cvsData as any)?.data)
    ? (cvsData as any).data
    : [];

  const applyMut = useApplyForJob();

  const [profileLoading, setProfileLoading] = useState(true);
  const candidateProfileRef = useRef<CandidateProfile | null>(null);

  const [step, setStep] = useState(1);

  const [candidateName, setCandidateName]     = useState('');
  const [contactEmail, setContactEmail]       = useState(user?.email ?? '');
  const [contactPhone, setContactPhone]       = useState('');
  const [contactLocation, setContactLocation] = useState('');

  const [coverLetter, setCoverLetter] = useState('');
  const [skillInput, setSkillInput]   = useState('');
  const [skills, setSkills]           = useState<string[]>([]);

  const [selectedCVIds, setSelectedCVIds] = useState<string[]>([]);

  const [experiences, setExperiences] = useState<any[]>([]);
  const [expFiles, setExpFiles]       = useState<DocFile[]>([]);
  const [references, setReferences]   = useState<any[]>([]);
  const [refFiles, setRefFiles]       = useState<DocFile[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const profile = await candidateService.getProfile();
        if (!mounted) return;

        candidateProfileRef.current = profile;
        setCandidateName(profile.name ?? '');
        setContactEmail(profile.email ?? user?.email ?? '');
        setContactPhone(profile.phone ?? '');
        setContactLocation(profile.location ?? '');

        if (profile.skills && profile.skills.length > 0) {
          setSkills(profile.skills);
        }

        const defaultCover = generateCoverLetter(profile, jobTitle, companyName);
        setCoverLetter(defaultCover);
      } catch {
        if (!mounted) return;
        const fallbackName = (user as any)?.name ?? '';
        setCandidateName(fallbackName);
        setContactEmail(user?.email ?? '');
        const defaultCover = generateCoverLetterFallback(fallbackName, jobTitle, companyName);
        setCoverLetter(defaultCover);
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (myCVs.length > 0 && selectedCVIds.length === 0) {
      const primary = myCVs.find(cv => cv.isPrimary || (cv as any).isDefault) ?? myCVs[0];
      setSelectedCVIds([primary._id]);
    }
  }, [myCVs]);

  const toggleCV = useCallback((id: string) => {
    setSelectedCVIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
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
    if (step === 2) {
      if (coverLetter.trim().length < 50) {
        Alert.alert('Cover Letter', `Please write at least 50 characters (${coverLetter.length}/50).`);
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, 4));
  };

  const handleSubmit = useCallback(async () => {
    if (!validateStep()) return;

    const profile = candidateProfileRef.current;
    const resolvedName = profile?.name?.trim()
      || (user as any)?.name?.trim()
      || contactEmail.split('@')[0];

    if (!resolvedName) {
      Alert.alert('Profile Incomplete', 'Could not determine your name. Please update your profile.');
      return;
    }

    const selectedCVObjects = myCVs
      .filter(cv => selectedCVIds.includes(cv._id))
      .map(cv => ({
        cvId: cv._id,
        filename: (cv as any).filename,
        originalName: cv.originalName,
        url: (cv as any).url ?? '',
        downloadUrl: cv.downloadUrl ?? (cv as any).url ?? '',
        size: (cv as any).fileSize ?? cv.size ?? 0,
        mimetype: cv.mimetype ?? 'application/pdf',
      }));

    try {
      const res = await applyMut.mutateAsync({
        jobId,
        data: {
          coverLetter: coverLetter.trim(),
          skills,
          selectedCVs: selectedCVObjects,
          contactInfo: {
            email: contactEmail.trim(),
            phone: contactPhone.trim(),
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
          workExperience: experiences,
          referenceFiles: refFiles,
          experienceFiles: expFiles,
        },
      });
      onSuccess(res.data.application);
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message ?? 'Please try again.');
    }
  }, [
    applyMut, jobId, coverLetter, skills, selectedCVIds, myCVs,
    contactEmail, contactPhone, contactLocation,
    references, experiences, refFiles, expFiles, user,
  ]);

  return (
    <View style={[fi.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[fi.header, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <TouchableOpacity
          onPress={onClose}
          style={fi.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[fi.headerTitle, { color: c.text }]} numberOfLines={1}>
            Apply: {jobTitle}
          </Text>
          <Text style={[fi.headerSub, { color: c.textMuted }]} numberOfLines={1}>
            {companyName}
          </Text>
        </View>
      </View>

      {/* Step indicator */}
      <View style={[fi.stepBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        {STEPS.map(s => {
          const done   = step > s.num;
          const active = step === s.num;
          return (
            <View key={s.num} style={fi.stepItem}>
              <View style={[
                fi.stepCircle,
                done   && { backgroundColor: '#10B981', borderColor: '#10B981' },
                active && { backgroundColor: c.primary, borderColor: c.primary },
                !done && !active && { borderColor: c.border },
              ]}>
                {done ? (
                  <Ionicons name="checkmark" size={13} color="#fff" />
                ) : (
                  <Text style={[fi.stepNum, { color: active ? '#fff' : c.textMuted }]}>
                    {s.num}
                  </Text>
                )}
              </View>
              <Text style={[fi.stepLabel, { color: active ? c.primary : c.textMuted }]}>
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Body */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={fi.body}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
      >
        {step === 1 && (
          <Step1
            c={c}
            contactEmail={contactEmail} setContactEmail={setContactEmail}
            contactPhone={contactPhone} setContactPhone={setContactPhone}
            contactLocation={contactLocation} setContactLocation={setContactLocation}
            myCVs={myCVs} cvsLoading={cvsLoading}
            selectedCVIds={selectedCVIds} toggleCV={toggleCV}
            profileLoading={profileLoading}
          />
        )}
        {step === 2 && (
          <Step2
            c={c}
            coverLetter={coverLetter} setCoverLetter={setCoverLetter}
            skillInput={skillInput} setSkillInput={setSkillInput}
            skills={skills} setSkills={setSkills}
          />
        )}
        {step === 3 && (
          <Step3
            c={c}
            experiences={experiences} setExperiences={setExperiences}
            expFiles={expFiles} setExpFiles={setExpFiles}
            references={references} setReferences={setReferences}
            refFiles={refFiles} setRefFiles={setRefFiles}
          />
        )}
        {step === 4 && (
          <Step4
            c={c}
            candidateName={candidateName}
            contactEmail={contactEmail} contactPhone={contactPhone}
            contactLocation={contactLocation}
            selectedCVIds={selectedCVIds} myCVs={myCVs}
            coverLetter={coverLetter} skills={skills}
            experiences={experiences} references={references}
            jobTitle={jobTitle} companyName={companyName}
          />
        )}
      </KeyboardAwareScrollView>

      {/* Footer navigation */}
      <View style={[fi.footer, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        {step > 1 && (
          <TouchableOpacity
            style={[fi.backBtn, { borderColor: c.border }]}
            onPress={() => setStep(s => s - 1)}
          >
            <Ionicons name="arrow-back" size={16} color={c.text} />
            <Text style={[fi.backBtnText, { color: c.text }]}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {step < 4 ? (
          <TouchableOpacity
            style={[fi.nextBtn, { backgroundColor: c.primary }]}
            onPress={nextStep}
          >
            <Text style={fi.nextBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[fi.submitBtn, { backgroundColor: c.primary }, applyMut.isPending && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={applyMut.isPending}
          >
            {applyMut.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={fi.submitBtnText}>Submit Application</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Cover Letter Generators ──────────────────────────────────────────────────

function generateCoverLetter(profile: CandidateProfile, jobTitle: string, companyName: string): string {
  const topSkill = profile.skills?.[0] ?? 'this field';
  const name = profile.name ?? 'Candidate';
  return `Dear Hiring Manager,

I am excited to apply for the ${jobTitle} position at ${companyName}. With my background in ${topSkill} and passion for the industry, I believe I would be a valuable addition to your team.

Key qualifications that make me a strong candidate:
${profile.skills?.slice(0, 3).map(s => `• ${s}`).join('\n') ?? '• Relevant skills and experience'}

I am particularly drawn to this opportunity because of ${companyName}'s reputation for innovation and excellence.

I look forward to discussing how my skills can contribute to your team's success.

Sincerely,
${name}`;
}

function generateCoverLetterFallback(name: string, jobTitle: string, companyName: string): string {
  return `Dear Hiring Manager,

I am excited to apply for the ${jobTitle} position at ${companyName}. I believe my skills and experience make me a strong candidate for this role.

I look forward to discussing how I can contribute to your team's success.

Sincerely,
${name || 'Applicant'}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const fi = StyleSheet.create({
  root:              { flex: 1 },
  header:            { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  closeBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:       { fontSize: 16, fontWeight: '700' },
  headerSub:         { fontSize: 12, marginTop: 1 },
  stepBar:           { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  stepItem:          { alignItems: 'center', flex: 1 },
  stepCircle:        { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepNum:           { fontSize: 12, fontWeight: '700' },
  stepLabel:         { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  body:              { padding: 16, paddingBottom: 40 },
  footer:            { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1 },
  backBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  backBtnText:       { fontSize: 14, fontWeight: '600' },
  nextBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  nextBtnText:       { color: '#fff', fontWeight: '700', fontSize: 15 },
  submitBtn:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  submitBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 },
  sectionIconBox:    { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:      { fontSize: 15, fontWeight: '700' },
  hint:              { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  label:             { fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  input:             { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 14, marginBottom: 4 },
  divider:           { height: 1, marginVertical: 16 },
  loadingBox:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, marginBottom: 8 },
  loadingText:       { fontSize: 13 },
  emptyBox:          { padding: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 8, marginTop: 4 },
  emptyText:         { fontSize: 13, textAlign: 'center' },
  cvCard:            { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 2, marginBottom: 8 },
  cvIcon:            { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cvName:            { fontSize: 14, fontWeight: '600' },
  cvSize:            { fontSize: 11, marginTop: 2 },
  cvPrimary:         { fontSize: 10, fontWeight: '700', marginTop: 1 },
  checkbox:          { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  selectionInfo:     { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 4 },
  selectionText:     { fontSize: 13, fontWeight: '600' },
  textAreaWrapper:   { borderWidth: 1, borderRadius: 10, marginBottom: 4 },
  textArea:          { padding: 12, fontSize: 14, minHeight: 140, textAlignVertical: 'top' },
  charCount:         { fontSize: 11, textAlign: 'right', marginBottom: 4 },
  skillInputRow:     { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  addBtn:            { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  skillCloud:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  skillText:         { fontSize: 13, fontWeight: '600' },
  docCard:           { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  docCardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  docCardTitle:      { fontSize: 13, fontWeight: '600' },
  uploadBtn:         { padding: 16, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed' },
  uploadPlaceholder: { alignItems: 'center', gap: 6 },
  uploadHint:        { fontSize: 13 },
  uploadFormats:     { fontSize: 11 },
  fileRow:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileName:          { flex: 1, fontSize: 13, fontWeight: '600' },
  addBtnRow:         { flexDirection: 'row', gap: 10, marginTop: 6 },
  addDocBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, borderWidth: 1 },
  addDocBtnText:     { fontSize: 13, fontWeight: '600' },
  switchRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  switchLabel:       { fontSize: 13 },
  reviewSection:     { padding: 14, borderRadius: 12, borderWidth: 1, gap: 6 },
  reviewSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reviewSectionTitle:{ fontSize: 14, fontWeight: '700' },
  reviewRow:         { flexDirection: 'row', justifyContent: 'space-between' },
  reviewLabel:       { fontSize: 13 },
  reviewValue:       { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  reviewCoverLetter: { fontSize: 13, lineHeight: 18 },
  jobSummary:        { padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  jobSummaryTitle:   { fontSize: 11, fontWeight: '600' },
  jobSummaryJob:     { fontSize: 17, fontWeight: '800', marginTop: 2 },
  jobSummaryCompany: { fontSize: 13, marginTop: 2 },
});