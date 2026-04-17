/**
 * src/components/application/ApplicationForm.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 4-step application form. Mirrors frontend web ApplicationForm exactly.
 *
 * Step 1 – Profile & CVs     (user info verification + multi-CV selection)
 * Step 2 – Cover Letter      (cover letter + skills)
 * Step 3 – Docs              (work experience + references with optional file uploads)
 * Step 4 – Review & Submit
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, Switch, Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useMyCVs, useApplyForJob } from '../../hooks/useApplications';
import {
  applicationService, Application, CV,
  Reference, WorkExperience,
} from '../../services/applicationService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onSuccess: (app: Application) => void;
  onClose: () => void;
}

interface DocFile { uri: string; name: string; type: string; _tempId: string }

const STEPS = [
  { num: 1, label: 'Profile',     icon: 'person-outline' },
  { num: 2, label: 'Application', icon: 'document-text-outline' },
  { num: 3, label: 'Documents',   icon: 'briefcase-outline' },
  { num: 4, label: 'Review',      icon: 'checkmark-circle-outline' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobId, jobTitle, companyName, onSuccess, onClose,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const { user } = useAuthStore();
  const { data: cvsData, isLoading: cvsLoading } = useMyCVs();
  // Guard: useMyCVs may return { data: CV[] } or CV[] directly — normalise to array
  const myCVs: CV[] = Array.isArray(cvsData)
    ? cvsData
    : Array.isArray((cvsData as any)?.data)
    ? (cvsData as any).data
    : [];
  const applyMut = useApplyForJob();

  const [step, setStep] = useState(1);

  // Step 1 — Contact info
  // user may have phone/location on the profile object even if AuthUser type doesn't declare them
  const userAny = user as any;
  const [contactEmail, setContactEmail]       = useState<string>(user?.email ?? '');
  const [contactPhone, setContactPhone]       = useState<string>(userAny?.phone ?? userAny?.roleSpecific?.phone ?? '');
  const [contactLocation, setContactLocation] = useState<string>(userAny?.location ?? userAny?.roleSpecific?.location ?? '');
  const [contactTelegram, setContactTelegram] = useState<string>('');
  const [selectedCVIds, setSelectedCVIds]   = useState<string[]>([]);

  // Step 2 — Cover letter + skills
  const [coverLetter, setCoverLetter] = useState('');
  const [skillInput, setSkillInput]   = useState('');
  const [skills, setSkills]           = useState<string[]>([]);

  // Step 3 — References
  const [references, setReferences] = useState<Reference[]>([{
    name: '', position: '', organization: '', email: '', phone: '',
    relationship: '', providedAsDocument: false,
  }]);
  const [referenceFiles, setReferenceFiles] = useState<Map<number, DocFile>>(new Map());

  // Step 3 — Work experience
  const [workExps, setWorkExps] = useState<WorkExperience[]>([{
    company: '', position: '', startDate: '', endDate: '',
    current: false, description: '', skills: [], providedAsDocument: false,
  }]);
  const [expFiles, setExpFiles] = useState<Map<number, DocFile>>(new Map());

  // ── Skill helpers ─────────────────────────────────────────────────────────
  const addSkill = () => {
    const t = skillInput.trim();
    if (t && !skills.includes(t)) { setSkills(s => [...s, t]); setSkillInput(''); }
  };

  // ── CV helpers ────────────────────────────────────────────────────────────
  const toggleCV = (cvId: string) => {
    setSelectedCVIds(prev =>
      prev.includes(cvId) ? prev.filter(id => id !== cvId) : [...prev, cvId]
    );
  };

  // ── Reference helpers ─────────────────────────────────────────────────────
  const updateRef = (i: number, field: string, val: any) => {
    setReferences(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  };
  const addRef = () => setReferences(prev => [...prev, {
    name: '', position: '', organization: '', email: '', phone: '',
    relationship: '', providedAsDocument: false,
  }]);
  const removeRef = (i: number) => setReferences(prev => prev.filter((_, idx) => idx !== i));

  const pickRefFile = async (i: number) => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    const tempId = applicationService.generateTempId();
    setReferenceFiles(prev => new Map(prev).set(i, { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/pdf', _tempId: tempId }));
    updateRef(i, '_tempId', tempId);
  };

  // ── Work experience helpers ───────────────────────────────────────────────
  const updateExp = (i: number, field: string, val: any) => {
    setWorkExps(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  };
  const addExp = () => setWorkExps(prev => [...prev, {
    company: '', position: '', startDate: '', endDate: '',
    current: false, description: '', skills: [], providedAsDocument: false,
  }]);
  const removeExp = (i: number) => setWorkExps(prev => prev.filter((_, idx) => idx !== i));

  const pickExpFile = async (i: number) => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    const tempId = applicationService.generateTempId();
    setExpFiles(prev => new Map(prev).set(i, { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/pdf', _tempId: tempId }));
    updateExp(i, '_tempId', tempId);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep = (): string | null => {
    if (step === 1) {
      if (!contactEmail.trim()) return 'Email is required';
      if (!contactPhone.trim()) return 'Phone number is required';
      if (selectedCVIds.length === 0) return 'Please select at least one CV';
    }
    if (step === 2) {
      if (coverLetter.trim().length < 50) return 'Cover letter must be at least 50 characters';
      if (skills.length === 0) return 'Please add at least one skill';
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep();
    if (err) { Alert.alert('Required', err); return; }
    setStep(s => Math.min(s + 1, 4));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { Alert.alert('Required', err); return; }

    const selectedCVData = myCVs
      .filter(cv => selectedCVIds.includes(cv._id))
      .map(cv => ({
        cvId: cv._id,
        filename:     applicationService.getCVDisplayName(cv),
        originalName: applicationService.getCVDisplayName(cv),
        url:          cv.fileUrl ?? cv.downloadUrl ?? cv.url ?? '',
        downloadUrl:  cv.downloadUrl ?? cv.fileUrl ?? cv.url ?? '',
        size:         cv.fileSize ?? cv.size ?? 0,
        mimetype:     cv.mimetype ?? 'application/pdf',
      }));

    const refFiles = Array.from(referenceFiles.entries()).map(([_, f]) => f);
    const expFilesList = Array.from(expFiles.entries()).map(([_, f]) => f);

    try {
      const result = await applyMut.mutateAsync({
        jobId,
        data: {
          coverLetter: coverLetter.trim(),
          skills,
          selectedCVs: selectedCVData,
          contactInfo: {
            email:    contactEmail.trim(),
            phone:    contactPhone.trim(),
            location: contactLocation.trim(),
            telegram: contactTelegram.trim(),
          },
          userInfo: {
            name:  user?.name ?? '',
            email: contactEmail.trim(),
            phone: contactPhone.trim(),
            location: contactLocation.trim(),
          },
          references: references.filter(r => (r.name?.trim() ?? '') !== '' || r.providedAsDocument),
          workExperience: workExps.filter(e => (e.company?.trim() ?? '') !== '' || e.providedAsDocument),
          referenceFiles: refFiles.length ? refFiles : undefined,
          experienceFiles: expFilesList.length ? expFilesList : undefined,
        },
      });
      onSuccess(result.data.application);
    } catch (e: any) {
      Alert.alert('Submission Failed', e?.message ?? 'Failed to submit application');
    }
  };

  const loading = applyMut.isPending;

  return (
    <View style={[f.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[f.header, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={onClose} style={f.closeBtn}>
          <Ionicons name="close" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[f.headerTitle, { color: c.text }]} numberOfLines={1}>{jobTitle}</Text>
          <Text style={[f.headerSub, { color: c.textMuted }]} numberOfLines={1}>{companyName}</Text>
        </View>
      </View>

      {/* Step bar */}
      <View style={[f.stepBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        {STEPS.map(s => (
          <View key={s.num} style={f.stepItem}>
            <View style={[f.stepDot, {
              backgroundColor: step >= s.num ? c.primary : c.border,
            }]}>
              {step > s.num
                ? <Ionicons name="checkmark" size={11} color="#fff" />
                : <Text style={[f.stepNum, { color: step >= s.num ? '#fff' : c.textMuted }]}>{s.num}</Text>
              }
            </View>
            <Text style={[f.stepLabel, { color: step === s.num ? c.primary : c.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Body */}
      <KeyboardAwareScrollView
        contentContainerStyle={[f.scroll, { backgroundColor: c.background }]}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={60}
      >
        {step === 1 && (
          <Step1
            c={c} cvsLoading={cvsLoading} myCVs={myCVs}
            selectedCVIds={selectedCVIds} toggleCV={toggleCV}
            contactEmail={contactEmail} setContactEmail={setContactEmail}
            contactPhone={contactPhone} setContactPhone={setContactPhone}
            contactLocation={contactLocation} setContactLocation={setContactLocation}
            contactTelegram={contactTelegram} setContactTelegram={setContactTelegram}
            user={user}
          />
        )}
        {step === 2 && (
          <Step2
            c={c} coverLetter={coverLetter} setCoverLetter={setCoverLetter}
            skillInput={skillInput} setSkillInput={setSkillInput}
            skills={skills} setSkills={setSkills} addSkill={addSkill}
          />
        )}
        {step === 3 && (
          <Step3
            c={c}
            references={references} updateRef={updateRef} addRef={addRef} removeRef={removeRef}
            referenceFiles={referenceFiles} pickRefFile={pickRefFile}
            workExps={workExps} updateExp={updateExp} addExp={addExp} removeExp={removeExp}
            expFiles={expFiles} pickExpFile={pickExpFile}
          />
        )}
        {step === 4 && (
          <Step4
            c={c} jobTitle={jobTitle} companyName={companyName}
            coverLetter={coverLetter} skills={skills}
            selectedCVCount={selectedCVIds.length}
            refCount={references.filter(r => (r.name?.trim() ?? '') !== '' || r.providedAsDocument).length}
            expCount={workExps.filter(e => (e.company?.trim() ?? '') !== '' || e.providedAsDocument).length}
            contactEmail={contactEmail} contactPhone={contactPhone}
          />
        )}
      </KeyboardAwareScrollView>

      {/* Footer */}
      <View style={[f.footer, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        {step > 1 && (
          <TouchableOpacity onPress={() => setStep(s => s - 1)} style={[f.btn, f.outline, { borderColor: c.border, flex: 0.45 }]} disabled={loading}>
            <Text style={[f.btnText, { color: c.text }]}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 4 ? (
          <TouchableOpacity onPress={goNext} style={[f.btn, f.filled, { backgroundColor: c.primary, flex: step > 1 ? 0.52 : 1 }]}>
            <Text style={f.filledText}>Continue</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[f.btn, f.filled, { backgroundColor: loading ? c.border : '#10B981', flex: 0.52 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={f.filledText}>Submit Application</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── STEP 1 ───────────────────────────────────────────────────────────────────
const Step1 = ({ c, cvsLoading, myCVs, selectedCVIds, toggleCV, contactEmail, setContactEmail, contactPhone, setContactPhone, contactLocation, setContactLocation, contactTelegram, setContactTelegram, user }: any) => (
  <View>
    <SH icon="person-outline" title="Contact Information" c={c} />

    <FLabel text="Full Name" c={c} />
    <View style={[fi.input, { backgroundColor: c.inputBg ?? c.surface, borderColor: c.border, opacity: 0.7 }]}>
      <Text style={[fi.inputText, { color: c.textMuted }]}>{user?.name ?? 'From your profile'}</Text>
    </View>

    <FLabel text="Email Address" required c={c} />
    <TI value={contactEmail} onChange={setContactEmail} placeholder="your@email.com" keyboard="email-address" c={c} />

    <FLabel text="Phone Number" required c={c} />
    <TI value={contactPhone} onChange={setContactPhone} placeholder="+251 9XX XXX XXX" keyboard="phone-pad" c={c} />

    <FLabel text="Location" c={c} />
    <TI value={contactLocation} onChange={setContactLocation} placeholder="City, Country" c={c} />

    <FLabel text="Telegram (optional)" c={c} />
    <TI value={contactTelegram} onChange={setContactTelegram} placeholder="@username" c={c} />

    <SH icon="document-outline" title="Select CVs to Attach" c={c} />
    <Text style={[fi.hint, { color: c.textMuted }]}>Select one or more CVs from your profile to attach to this application.</Text>

    {cvsLoading ? (
      <View style={fi.loadingRow}><ActivityIndicator color={c.primary} /></View>
    ) : myCVs.length === 0 ? (
      <View style={[fi.emptyBox, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name="document-outline" size={32} color={c.textMuted} />
        <Text style={[fi.emptyText, { color: c.textMuted }]}>No CVs found. Upload a CV to your profile first.</Text>
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
            style={[fi.cvCard, { backgroundColor: selected ? `${c.primary}10` : c.surface, borderColor: selected ? c.primary : c.border }]}
          >
            <View style={[fi.cvIcon, { backgroundColor: selected ? `${c.primary}20` : `${c.border}50` }]}>
              <Ionicons name="document-text" size={20} color={selected ? c.primary : c.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[fi.cvName, { color: c.text }]} numberOfLines={1}>{name}</Text>
              {size ? <Text style={[fi.cvSize, { color: c.textMuted }]}>{size}</Text> : null}
              {cv.isPrimary && <Text style={[fi.cvPrimary, { color: c.primary }]}>Primary CV</Text>}
            </View>
            <View style={[fi.checkbox, { backgroundColor: selected ? c.primary : 'transparent', borderColor: selected ? c.primary : c.border }]}>
              {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })
    )}
  </View>
);

// ─── STEP 2 ───────────────────────────────────────────────────────────────────
const Step2 = ({ c, coverLetter, setCoverLetter, skillInput, setSkillInput, skills, setSkills, addSkill }: any) => (
  <View>
    <SH icon="document-text-outline" title="Cover Letter" c={c} />
    <Text style={[fi.hint, { color: c.textMuted }]}>Introduce yourself and explain why you're a great fit. Min 50 characters.</Text>
    <View style={[fi.textAreaWrapper, { backgroundColor: c.inputBg ?? c.surface, borderColor: c.border }]}>
      <TextInput
        style={[fi.textArea, { color: c.text }]}
        value={coverLetter}
        onChangeText={setCoverLetter}
        placeholder="Dear Hiring Manager, I am excited to apply for this position because..."
        placeholderTextColor={c.placeholder ?? c.textMuted}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
      />
    </View>
    <Text style={[fi.charCount, { color: coverLetter.length < 50 ? c.error : c.textMuted }]}>
      {coverLetter.length}/5000 chars {coverLetter.length < 50 ? `(${50 - coverLetter.length} more needed)` : '✓'}
    </Text>

    <SH icon="sparkles-outline" title="Your Skills" c={c} />
    <Text style={[fi.hint, { color: c.textMuted }]}>Add skills relevant to this position.</Text>

    <View style={fi.skillInputRow}>
      <View style={[fi.skillInput, { backgroundColor: c.inputBg ?? c.surface, borderColor: c.border, flex: 1 }]}>
        <TextInput
          style={[fi.input2, { color: c.text }]}
          value={skillInput}
          onChangeText={setSkillInput}
          placeholder="e.g. React Native, TypeScript..."
          placeholderTextColor={c.placeholder ?? c.textMuted}
          onSubmitEditing={addSkill}
          returnKeyType="done"
          blurOnSubmit={false}
        />
      </View>
      <TouchableOpacity onPress={addSkill} disabled={!skillInput.trim()} style={[fi.addBtn, { backgroundColor: skillInput.trim() ? c.primary : c.border }]}>
        <Ionicons name="add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>

    <View style={fi.tagsRow}>
      {skills.map((sk: string) => (
        <TouchableOpacity key={sk} onPress={() => setSkills((p: string[]) => p.filter(s => s !== sk))}
          style={[fi.tag, { backgroundColor: `${c.primary}15`, borderColor: `${c.primary}30` }]}>
          <Text style={[fi.tagText, { color: c.primary }]}>{sk}</Text>
          <Ionicons name="close" size={12} color={c.primary} />
        </TouchableOpacity>
      ))}
      {skills.length === 0 && <Text style={[fi.hint, { color: c.textMuted }]}>No skills added yet.</Text>}
    </View>
  </View>
);

// ─── STEP 3 ───────────────────────────────────────────────────────────────────
const Step3 = ({ c, references, updateRef, addRef, removeRef, referenceFiles, pickRefFile, workExps, updateExp, addExp, removeExp, expFiles, pickExpFile }: any) => (
  <View>
    {/* Work Experience */}
    <SH icon="briefcase-outline" title="Work Experience" c={c} />
    <Text style={[fi.hint, { color: c.textMuted }]}>Add your relevant work experience, or upload a document.</Text>
    {workExps.map((exp: WorkExperience, i: number) => (
      <View key={i} style={[fi.docCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={fi.docCardHeader}>
          <Text style={[fi.docCardTitle, { color: c.text }]}>Experience {i + 1}</Text>
          {workExps.length > 1 && (
            <TouchableOpacity onPress={() => removeExp(i)}>
              <Ionicons name="trash-outline" size={18} color={c.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Toggle: form vs document */}
        <View style={[fi.toggleRow, { backgroundColor: c.background, borderColor: c.border }]}>
          <Text style={[fi.toggleLabel, { color: c.text }]}>Upload document instead</Text>
          <Switch
            value={exp.providedAsDocument}
            onValueChange={v => updateExp(i, 'providedAsDocument', v)}
            trackColor={{ true: c.primary }}
          />
        </View>

        {exp.providedAsDocument ? (
          <TouchableOpacity onPress={() => pickExpFile(i)} style={[fi.fileBtn, { backgroundColor: `${c.primary}10`, borderColor: c.primary }]}>
            <Ionicons name="cloud-upload-outline" size={20} color={c.primary} />
            <Text style={[fi.fileBtnText, { color: c.primary }]}>
              {expFiles.get(i) ? expFiles.get(i)!.name : 'Choose PDF / Image'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TI value={exp.company ?? ''} onChange={(v: any) => updateExp(i, 'company', v)} placeholder="Company name" c={c} />
            <TI value={exp.position ?? ''} onChange={(v: any) => updateExp(i, 'position', v)} placeholder="Job title / position" c={c} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><TI value={exp.startDate ?? ''} onChange={(v: any) => updateExp(i, 'startDate', v)} placeholder="Start (YYYY-MM)" c={c} /></View>
              <View style={{ flex: 1 }}><TI value={exp.endDate ?? ''} onChange={(v: any) => updateExp(i, 'endDate', v)} placeholder="End (YYYY-MM)" c={c} /></View>
            </View>
            <View style={[fi.toggleRow, { backgroundColor: c.background, borderColor: c.border }]}>
              <Text style={[fi.toggleLabel, { color: c.text }]}>Currently working here</Text>
              <Switch value={!!exp.current} onValueChange={v => updateExp(i, 'current', v)} trackColor={{ true: c.primary }} />
            </View>
            <TextInput
              style={[fi.textArea, fi.shortArea, { color: c.text, backgroundColor: c.inputBg ?? c.surface, borderColor: c.border, borderRadius: 12, borderWidth: 1.5, padding: 12 }]}
              value={exp.description ?? ''}
              onChangeText={v => updateExp(i, 'description', v)}
              placeholder="Brief description of your role and achievements..."
              placeholderTextColor={c.placeholder ?? c.textMuted}
              multiline numberOfLines={3} textAlignVertical="top"
            />
          </>
        )}
      </View>
    ))}
    <TouchableOpacity onPress={addExp} style={[fi.addMoreBtn, { borderColor: c.primary }]}>
      <Ionicons name="add-circle-outline" size={18} color={c.primary} />
      <Text style={[fi.addMoreText, { color: c.primary }]}>Add Work Experience</Text>
    </TouchableOpacity>

    {/* References */}
    <SH icon="people-outline" title="References" c={c} />
    <Text style={[fi.hint, { color: c.textMuted }]}>Provide professional references, or upload a reference letter.</Text>
    {references.map((ref: Reference, i: number) => (
      <View key={i} style={[fi.docCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={fi.docCardHeader}>
          <Text style={[fi.docCardTitle, { color: c.text }]}>Reference {i + 1}</Text>
          {references.length > 1 && (
            <TouchableOpacity onPress={() => removeRef(i)}>
              <Ionicons name="trash-outline" size={18} color={c.error} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[fi.toggleRow, { backgroundColor: c.background, borderColor: c.border }]}>
          <Text style={[fi.toggleLabel, { color: c.text }]}>Upload reference letter</Text>
          <Switch
            value={ref.providedAsDocument}
            onValueChange={v => updateRef(i, 'providedAsDocument', v)}
            trackColor={{ true: c.primary }}
          />
        </View>

        {ref.providedAsDocument ? (
          <TouchableOpacity onPress={() => pickRefFile(i)} style={[fi.fileBtn, { backgroundColor: `${c.primary}10`, borderColor: c.primary }]}>
            <Ionicons name="cloud-upload-outline" size={20} color={c.primary} />
            <Text style={[fi.fileBtnText, { color: c.primary }]}>
              {referenceFiles.get(i) ? referenceFiles.get(i)!.name : 'Choose PDF / Image'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TI value={ref.name ?? ''} onChange={(v: any) => updateRef(i, 'name', v)} placeholder="Full name *" c={c} />
            <TI value={ref.position ?? ''} onChange={(v: any) => updateRef(i, 'position', v)} placeholder="Job title" c={c} />
            <TI value={ref.organization ?? ''} onChange={(v: any) => updateRef(i, 'organization', v)} placeholder="Company / Organization" c={c} />
            <TI value={ref.email ?? ''} onChange={(v: any) => updateRef(i, 'email', v)} placeholder="Email address" c={c} keyboard="email-address" />
            <TI value={ref.phone ?? ''} onChange={(v: any) => updateRef(i, 'phone', v)} placeholder="Phone number" c={c} keyboard="phone-pad" />
            <TI value={ref.relationship ?? ''} onChange={(v: any) => updateRef(i, 'relationship', v)} placeholder="Relationship (e.g. Former manager)" c={c} />
          </>
        )}
      </View>
    ))}
    <TouchableOpacity onPress={addRef} style={[fi.addMoreBtn, { borderColor: c.primary }]}>
      <Ionicons name="add-circle-outline" size={18} color={c.primary} />
      <Text style={[fi.addMoreText, { color: c.primary }]}>Add Reference</Text>
    </TouchableOpacity>
  </View>
);

// ─── STEP 4 ───────────────────────────────────────────────────────────────────
const Step4 = ({ c, jobTitle, companyName, coverLetter, skills, selectedCVCount, refCount, expCount, contactEmail, contactPhone }: any) => (
  <View>
    <SH icon="checkmark-circle-outline" title="Review Your Application" c={c} />

    <View style={[fi.reviewCard, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={[fi.reviewJob, { color: c.text }]}>{jobTitle}</Text>
      <Text style={[fi.reviewCompany, { color: c.primary }]}>{companyName}</Text>
    </View>

    {[
      { icon: 'mail-outline',     label: 'Email',       value: contactEmail },
      { icon: 'call-outline',     label: 'Phone',       value: contactPhone },
      { icon: 'document-outline', label: 'CVs attached', value: `${selectedCVCount} CV${selectedCVCount !== 1 ? 's' : ''}` },
      { icon: 'sparkles-outline', label: 'Skills',      value: `${skills.length} skill${skills.length !== 1 ? 's' : ''}` },
      { icon: 'briefcase-outline',label: 'Experience',  value: `${expCount} entr${expCount !== 1 ? 'ies' : 'y'}` },
      { icon: 'people-outline',   label: 'References',  value: `${refCount} reference${refCount !== 1 ? 's' : ''}` },
    ].map(row => (
      <View key={row.label} style={[fi.reviewRow, { borderBottomColor: c.border }]}>
        <Ionicons name={row.icon as any} size={16} color={c.primary} />
        <Text style={[fi.reviewLabel, { color: c.textMuted }]}>{row.label}</Text>
        <Text style={[fi.reviewValue, { color: c.text }]}>{row.value}</Text>
      </View>
    ))}

    {coverLetter ? (
      <View style={[fi.coverPreview, { backgroundColor: c.background, borderColor: c.border }]}>
        <Text style={[fi.coverPreviewLabel, { color: c.textMuted }]}>Cover Letter Preview</Text>
        <Text style={[fi.coverPreviewText, { color: c.text }]} numberOfLines={4}>{coverLetter}</Text>
      </View>
    ) : null}

    <View style={[fi.warningBox, { backgroundColor: `${c.warning}15`, borderColor: `${c.warning}30` }]}>
      <Ionicons name="information-circle-outline" size={18} color={c.warning} />
      <Text style={[fi.warningText, { color: c.textMuted }]}>
        Once submitted, you cannot edit this application. You may withdraw it from your applications list.
      </Text>
    </View>
  </View>
);

// ─── Shared atoms ─────────────────────────────────────────────────────────────
const SH = ({ icon, title, c }: any) => (
  <View style={[fi.sh, { borderBottomColor: c.border }]}>
    <Ionicons name={icon} size={18} color={c.primary} />
    <Text style={[fi.shTitle, { color: c.text }]}>{title}</Text>
  </View>
);
const FLabel = ({ text, required, c }: any) => (
  <Text style={[fi.label, { color: c.text }]}>
    {text}{required && <Text style={{ color: c.error }}> *</Text>}
  </Text>
);
const TI = ({ value, onChange, placeholder, c, keyboard, multiline }: any) => (
  <View style={[fi.input, { backgroundColor: c.inputBg ?? c.surface, borderColor: c.border }]}>
    <TextInput
      style={[fi.inputText, { color: c.text }, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={c.placeholder ?? c.textMuted}
      keyboardType={keyboard ?? 'default'}
      multiline={multiline}
    />
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const f = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  closeBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontSize: 16, fontWeight: '700' },
  headerSub:  { fontSize: 12, marginTop: 1 },
  stepBar:    { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  stepItem:   { flex: 1, alignItems: 'center', gap: 3 },
  stepDot:    { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepNum:    { fontSize: 11, fontWeight: '700' },
  stepLabel:  { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  scroll:     { padding: 16, paddingBottom: 40 },
  footer:     { flexDirection: 'row', padding: 16, borderTopWidth: 1, gap: 10 },
  btn:        { paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  outline:    { borderWidth: 1.5 },
  filled:     {},
  btnText:    { fontSize: 15, fontWeight: '600' },
  filledText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

const fi = StyleSheet.create({
  sh:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  shTitle:      { fontSize: 16, fontWeight: '700' },
  label:        { fontSize: 13, fontWeight: '600', marginBottom: 5, marginTop: 8 },
  input:        { borderRadius: 12, borderWidth: 1.5, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 0 },
  inputText:    { fontSize: 15, paddingVertical: 12 },
  input2:       { fontSize: 15, paddingVertical: 12, paddingHorizontal: 14 },
  hint:         { fontSize: 12, marginBottom: 10, lineHeight: 17 },
  charCount:    { fontSize: 11, textAlign: 'right', marginTop: -6, marginBottom: 12 },
  loadingRow:   { padding: 24, alignItems: 'center' },
  emptyBox:     { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8, marginBottom: 12 },
  emptyText:    { fontSize: 13, textAlign: 'center' },
  cvCard:       { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12, marginBottom: 8, gap: 12 },
  cvIcon:       { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cvName:       { fontSize: 14, fontWeight: '600' },
  cvSize:       { fontSize: 11, marginTop: 2 },
  cvPrimary:    { fontSize: 10, fontWeight: '700', marginTop: 2 },
  checkbox:     { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  textAreaWrapper:{ borderRadius: 12, borderWidth: 1.5, overflow: 'hidden', marginBottom: 6 },
  textArea:     { fontSize: 14, padding: 14, minHeight: 160 },
  shortArea:    { minHeight: 80 },
  skillInputRow:{ flexDirection: 'row', gap: 8, marginBottom: 10 },
  skillInput:   { borderRadius: 12, borderWidth: 1.5, overflow: 'hidden' },
  addBtn:       { width: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tagsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 5 },
  tagText:      { fontSize: 13, fontWeight: '600' },
  docCard:      { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  docCardHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  docCardTitle: { fontSize: 14, fontWeight: '700' },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  toggleLabel:  { flex: 1, fontSize: 13, fontWeight: '500' },
  fileBtn:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed' },
  fileBtnText:  { fontSize: 14, fontWeight: '600', flex: 1 },
  addMoreBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', marginBottom: 16 },
  addMoreText:  { fontSize: 14, fontWeight: '600' },
  reviewCard:   { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  reviewJob:    { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  reviewCompany:{ fontSize: 14, fontWeight: '600' },
  reviewRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  reviewLabel:  { fontSize: 13, flex: 1, marginLeft: 4 },
  reviewValue:  { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  coverPreview: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 8, marginBottom: 12 },
  coverPreviewLabel:{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  coverPreviewText: { fontSize: 13, lineHeight: 19 },
  warningBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  warningText:  { flex: 1, fontSize: 12, lineHeight: 17 },
});