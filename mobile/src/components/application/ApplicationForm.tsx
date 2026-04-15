/**
 * mobile/src/components/applications/ApplicationForm.tsx
 *
 * Complete 4-step application form component.
 * Mirrors the web frontend's ApplicationForm component.
 *
 * Steps:
 *  1 – Profile & CV selection    (contact info + pick CVs from profile)
 *  2 – Cover Letter & Skills     (cover letter text + skill tags)
 *  3 – Experience & References   (work history + references)
 *  4 – Review & Submit           (summary + submit)
 *
 * Usage:
 *  <ApplicationForm jobId={id} jobTitle={title} companyName={company} onSuccess={fn} onClose={fn} />
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { applicationService, Application, ApplyJobData } from '../../services/applicationService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onSuccess: (application: Application) => void;
  onClose: () => void;
}

interface CV {
  _id: string;
  fileName?: string;
  filename?: string;
  originalName?: string;
  isPrimary?: boolean;
  uploadedAt?: string;
  fileSize?: number;
}

interface Reference {
  name: string;
  position?: string;
  organization?: string;
  email?: string;
  phone?: string;
  relationship?: string;
}

interface WorkExp {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

interface FormState {
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
  contactTelegram: string;
  selectedCvIds: string[];
  coverLetter: string;
  skills: string[];
  references: Reference[];
  workExperience: WorkExp[];
}

const STEPS = [
  { num: 1, title: 'Profile',      sub: 'Contact Info & CVs',       icon: 'person-outline' },
  { num: 2, title: 'Application',  sub: 'Cover Letter & Skills',     icon: 'document-text-outline' },
  { num: 3, title: 'Documents',    sub: 'Experience & References',   icon: 'briefcase-outline' },
  { num: 4, title: 'Review',       sub: 'Review & Submit',           icon: 'checkmark-circle-outline' },
];

// ─── Atoms ────────────────────────────────────────────────────────────────────

const FieldLabel: React.FC<{ text: string; required?: boolean; colors: any }> = ({ text, required, colors }) => (
  <Text style={[al.lbl, { color: colors.textSecondary }]}>{text}{required && <Text style={{ color: colors.error }}> *</Text>}</Text>
);

const StyledInput: React.FC<{
  value: string; onChangeText(t: string): void; placeholder: string;
  multiline?: boolean; lines?: number; keyboard?: string; colors: any; error?: string;
}> = ({ value, onChangeText, placeholder, multiline, lines, keyboard, colors, error }) => (
  <View>
    {multiline ? (
      <View style={[al.taWrap, { backgroundColor: colors.inputBg, borderColor: error ? colors.error : colors.border }]}>
        <TextInput style={[al.ta, { color: colors.text }]} value={value} onChangeText={onChangeText}
          placeholder={placeholder} placeholderTextColor={colors.placeholder} multiline numberOfLines={lines ?? 6} textAlignVertical="top" />
      </View>
    ) : (
      <TextInput style={[al.inp, { color: colors.text, backgroundColor: colors.inputBg, borderColor: error ? colors.error : colors.border }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.placeholder}
        keyboardType={keyboard as any ?? 'default'} />
    )}
    {error && <Text style={[al.err, { color: colors.error }]}>{error}</Text>}
  </View>
);

const al = StyleSheet.create({
  lbl:    { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  inp:    { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  taWrap: { borderRadius: 12, borderWidth: 1, padding: 12 },
  ta:     { fontSize: 15, lineHeight: 22, minHeight: 140 },
  err:    { fontSize: 12, marginTop: 4 },
});

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepBar: React.FC<{ current: number; colors: any }> = ({ current, colors }) => (
  <View style={sb.row}>
    {STEPS.map((step, i) => {
      const done    = current > step.num;
      const active  = current === step.num;
      const col     = done || active ? colors.primary : colors.border;
      return (
        <React.Fragment key={step.num}>
          <View style={sb.item}>
            <View style={[sb.circle, { backgroundColor: done ? colors.primary : active ? colors.primaryLight : colors.inputBg, borderColor: col }]}>
              {done
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={[sb.num, { color: active ? colors.primary : colors.textMuted }]}>{step.num}</Text>}
            </View>
            <Text style={[sb.label, { color: active ? colors.primary : colors.textMuted }]}>{step.title}</Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={[sb.line, { backgroundColor: current > step.num ? colors.primary : colors.border }]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

const sb = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  item:   { alignItems: 'center', width: 50 },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  num:    { fontSize: 12, fontWeight: '700' },
  label:  { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  line:   { flex: 1, height: 2, marginHorizontal: -6, marginBottom: 14 },
});

// ─── Main component ───────────────────────────────────────────────────────────

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobId, jobTitle, companyName, onSuccess, onClose,
}) => {
  const { theme: { colors } } = useThemeStore();
  const { user } = useAuthStore();
  const c = colors;

  const [step,       setStep]       = useState(1);
  const [cvs,        setCvs]        = useState<CV[]>([]);
  const [loadingCvs, setLoadingCvs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormState>({
    contactEmail:    user?.email ?? '',
    contactPhone:    '',
    contactLocation: '',
    contactTelegram: '',
    selectedCvIds:   [],
    coverLetter:     `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} position at ${companyName}. I believe my skills and experience make me a strong candidate for this role.\n\nI look forward to the opportunity to contribute to your team.\n\nSincerely,\n${user?.name ?? ''}`,
    skills:          [],
    references:      [],
    workExperience:  [],
  });

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(p => ({ ...p, [key]: val })), []);

  useEffect(() => {
    applicationService.getMyCVs()
      .then(data => {
        setCvs(data);
        // Auto-select primary or first CV
        const primary = data.find((cv: CV) => cv.isPrimary) ?? data[0];
        if (primary) set('selectedCvIds', [primary._id]);
      })
      .catch(() => {})
      .finally(() => setLoadingCvs(false));
  }, []);

  // ── Validation per step ────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!form.contactEmail.trim())    e.email    = 'Email is required';
      if (!form.contactPhone.trim())    e.phone    = 'Phone is required';
      if (!form.contactLocation.trim()) e.location = 'Location is required';
      if (form.selectedCvIds.length === 0) e.cv   = 'Please select at least one CV';
    }
    if (step === 2) {
      if (!form.coverLetter.trim())     e.cover    = 'Cover letter is required';
      if (form.coverLetter.trim().length < 50) e.cover = 'Cover letter must be at least 50 characters';
      if (form.skills.length === 0)     e.skills   = 'Add at least one skill';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(p => Math.min(p + 1, 4)); };
  const prev = () => setStep(p => Math.max(p - 1, 1));

  const addSkill = () => {
    const t = skillInput.trim();
    if (t && !form.skills.includes(t)) set('skills', [...form.skills, t]);
    setSkillInput('');
  };

  const addReference = () => set('references', [...form.references, { name: '', email: '' }]);
  const updateRef    = (i: number, k: keyof Reference, v: string) => {
    const refs = [...form.references];
    (refs[i] as any)[k] = v;
    set('references', refs);
  };
  const removeRef = (i: number) => set('references', form.references.filter((_, idx) => idx !== i));

  const addExp = () => set('workExperience', [...form.workExperience, { company: '', position: '', startDate: '', current: false }]);
  const updateExp   = (i: number, k: keyof WorkExp, v: any) => {
    const exps = [...form.workExperience];
    (exps[i] as any)[k] = v;
    set('workExperience', exps);
  };
  const removeExp = (i: number) => set('workExperience', form.workExperience.filter((_, idx) => idx !== i));

  // ── Submit ────────────────────────────────────────────────────────────────

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload: ApplyJobData = {
        coverLetter:   form.coverLetter,
        skills:        form.skills,
        selectedCVs:   form.selectedCvIds.map(id => ({ cvId: id })),
        contactInfo:   { email: form.contactEmail, phone: form.contactPhone, location: form.contactLocation, telegram: form.contactTelegram || undefined },
        references:    form.references.filter(r => r.name.trim()),
        workExperience:form.workExperience.filter(e => e.company.trim() && e.position.trim()),
      };
      const res = await applicationService.applyForJob(jobId, payload);
      onSuccess(res.data.application);
    } catch (e: any) {
      Alert.alert('Application Failed', e.message ?? 'Could not submit. Please try again.');
    } finally { setSubmitting(false); }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[f.sheet, { backgroundColor: c.background }]}>

      {/* Header */}
      <View style={[f.hdr, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={step > 1 ? prev : onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Ionicons name={step > 1 ? 'arrow-back' : 'close'} size={24} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[f.hdrTitle, { color: c.text }]} numberOfLines={1}>Apply: {jobTitle}</Text>
          <Text style={[f.hdrSub, { color: c.textMuted }]}>{companyName}</Text>
        </View>
      </View>

      {/* Step bar */}
      <View style={{ backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <StepBar current={step} colors={c} />
        {/* Progress track */}
        <View style={[f.progTrack, { backgroundColor: c.border }]}>
          <View style={[f.progFill, { backgroundColor: c.primary, width: `${(step / 4) * 100}%` as any }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── STEP 1: Profile & CV ── */}
        {step === 1 && (
          <>
            <Text style={[f.stepTitle, { color: c.text }]}>Contact Information</Text>
            <Text style={[f.stepSub, { color: c.textMuted }]}>Your contact details for this application</Text>

            {[
              { lbl:'Email Address', key:'contactEmail',    req:true,  kb:'email-address', placeholder:'your@email.com' },
              { lbl:'Phone Number',  key:'contactPhone',    req:true,  kb:'phone-pad',      placeholder:'+251 9xx xxx xxxx' },
              { lbl:'Location',      key:'contactLocation', req:true,  kb:'default',        placeholder:'City, Country' },
              { lbl:'Telegram',      key:'contactTelegram', req:false, kb:'default',        placeholder:'@username (optional)' },
            ].map(f2 => (
              <React.Fragment key={f2.key}>
                <FieldLabel text={f2.lbl} required={f2.req} colors={c} />
                <StyledInput value={(form as any)[f2.key]} onChangeText={v => set(f2.key as keyof FormState, v)}
                  placeholder={f2.placeholder} keyboard={f2.kb} colors={c} error={errors[f2.key.replace('contact','').toLowerCase()]} />
              </React.Fragment>
            ))}

            <View style={{ marginTop: 20 }}>
              <Text style={[f.sectionHead, { color: c.text }]}>Select Your CV</Text>
              <Text style={[f.stepSub, { color: c.textMuted, marginBottom: 12 }]}>Choose which CV(s) to submit with this application</Text>
              {errors.cv && <Text style={[al.err, { color: c.error, marginBottom: 8 }]}>{errors.cv}</Text>}

              {loadingCvs ? (
                <ActivityIndicator color={c.primary} style={{ padding: 20 }} />
              ) : cvs.length === 0 ? (
                <View style={[f.emptyBox, { backgroundColor: c.inputBg, borderColor: c.border }]}>
                  <Ionicons name="document-outline" size={32} color={c.textMuted} />
                  <Text style={[f.emptyText, { color: c.textMuted }]}>No CVs found. Upload a CV from your profile first.</Text>
                </View>
              ) : cvs.map(cv => {
                const sel = form.selectedCvIds.includes(cv._id);
                const name = cv.originalName ?? cv.fileName ?? cv.filename ?? 'CV Document';
                return (
                  <TouchableOpacity key={cv._id}
                    style={[f.cvItem, { backgroundColor: sel ? c.primaryLight : c.card, borderColor: sel ? c.primary : c.border, borderWidth: sel ? 2 : 1 }]}
                    onPress={() => set('selectedCvIds', sel ? form.selectedCvIds.filter(id => id !== cv._id) : [...form.selectedCvIds, cv._id])}>
                    <Ionicons name="document-text" size={22} color={sel ? c.primary : c.textMuted} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[f.cvName, { color: c.text }]} numberOfLines={1}>{name}</Text>
                      {cv.isPrimary && <Text style={[f.cvPrimary, { color: c.primary }]}>Primary CV</Text>}
                    </View>
                    {sel && <Ionicons name="checkmark-circle" size={22} color={c.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── STEP 2: Cover Letter & Skills ── */}
        {step === 2 && (
          <>
            <Text style={[f.stepTitle, { color: c.text }]}>Cover Letter & Skills</Text>
            <Text style={[f.stepSub, { color: c.textMuted }]}>Write a compelling letter and list your relevant skills</Text>

            <FieldLabel text="Cover Letter" required colors={c} />
            <StyledInput value={form.coverLetter} onChangeText={v => set('coverLetter', v)}
              placeholder="Tell the employer why you are the perfect fit…"
              multiline lines={10} colors={c} error={errors.cover} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
              <Text style={[f.charCount, { color: form.coverLetter.length < 50 ? c.error : c.textMuted }]}>
                {form.coverLetter.length} chars {form.coverLetter.length < 50 ? `(${50 - form.coverLetter.length} more needed)` : '✓'}
              </Text>
            </View>

            <View style={{ marginTop: 16 }}>
              <FieldLabel text="Skills" required colors={c} />
              {errors.skills && <Text style={[al.err, { color: c.error }]}>{errors.skills}</Text>}
              <View style={[f.skillRow, { backgroundColor: c.inputBg, borderColor: c.border }]}>
                <TextInput style={[f.skillInp, { color: c.text }]} value={skillInput} onChangeText={setSkillInput}
                  placeholder="Add a skill and press +" placeholderTextColor={c.placeholder}
                  onSubmitEditing={addSkill} returnKeyType="done" />
                <TouchableOpacity style={[f.skillAddBtn, { backgroundColor: c.primary }]} onPress={addSkill}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              {form.skills.length > 0 && (
                <View style={f.tagsWrap}>
                  {form.skills.map(sk => (
                    <View key={sk} style={[f.tag, { backgroundColor: c.primaryLight }]}>
                      <Text style={[f.tagText, { color: c.primary }]}>{sk}</Text>
                      <TouchableOpacity onPress={() => set('skills', form.skills.filter(s => s !== sk))}>
                        <Ionicons name="close" size={13} color={c.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* ── STEP 3: Experience & References ── */}
        {step === 3 && (
          <>
            <Text style={[f.stepTitle, { color: c.text }]}>Work Experience</Text>
            <Text style={[f.stepSub, { color: c.textMuted, marginBottom: 16 }]}>Add relevant work history (optional)</Text>

            {form.workExperience.map((exp, i) => (
              <View key={i} style={[f.subCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={f.subCardHeader}>
                  <Text style={[f.subCardTitle, { color: c.text }]}>Experience {i + 1}</Text>
                  <TouchableOpacity onPress={() => removeExp(i)}>
                    <Ionicons name="trash-outline" size={18} color={c.error} />
                  </TouchableOpacity>
                </View>
                {[
                  { lbl: 'Company',   key: 'company',   req: true },
                  { lbl: 'Position',  key: 'position',  req: true },
                  { lbl: 'Start Date', key: 'startDate', req: true, placeholder: 'YYYY-MM-DD' },
                  { lbl: 'End Date',   key: 'endDate',   req: false, placeholder: 'YYYY-MM-DD (leave empty if current)' },
                  { lbl: 'Description', key: 'description', multiline: true },
                ].map(row => (
                  <React.Fragment key={row.key}>
                    <FieldLabel text={row.lbl} required={(row as any).req} colors={c} />
                    <StyledInput value={(exp as any)[row.key] ?? ''} onChangeText={v => updateExp(i, row.key as keyof WorkExp, v)}
                      placeholder={(row as any).placeholder ?? row.lbl} colors={c}
                      multiline={(row as any).multiline} lines={3} />
                  </React.Fragment>
                ))}
              </View>
            ))}
            <TouchableOpacity style={[f.addSubBtn, { borderColor: c.primary }]} onPress={addExp}>
              <Ionicons name="add-circle-outline" size={18} color={c.primary} />
              <Text style={[f.addSubBtnText, { color: c.primary }]}>Add Work Experience</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 24 }}>
              <Text style={[f.stepTitle, { color: c.text }]}>References</Text>
              <Text style={[f.stepSub, { color: c.textMuted, marginBottom: 16 }]}>Add professional references (optional)</Text>
              {form.references.map((ref, i) => (
                <View key={i} style={[f.subCard, { backgroundColor: c.card, borderColor: c.border }]}>
                  <View style={f.subCardHeader}>
                    <Text style={[f.subCardTitle, { color: c.text }]}>Reference {i + 1}</Text>
                    <TouchableOpacity onPress={() => removeRef(i)}>
                      <Ionicons name="trash-outline" size={18} color={c.error} />
                    </TouchableOpacity>
                  </View>
                  {[
                    { lbl: 'Full Name',     key: 'name',         req: true },
                    { lbl: 'Position',      key: 'position' },
                    { lbl: 'Organization',  key: 'organization' },
                    { lbl: 'Email',         key: 'email',        keyboard: 'email-address' },
                    { lbl: 'Phone',         key: 'phone',        keyboard: 'phone-pad' },
                    { lbl: 'Relationship',  key: 'relationship', placeholder: 'e.g. Direct Manager' },
                  ].map(row => (
                    <React.Fragment key={row.key}>
                      <FieldLabel text={row.lbl} required={(row as any).req} colors={c} />
                      <StyledInput value={(ref as any)[row.key] ?? ''} onChangeText={v => updateRef(i, row.key as keyof Reference, v)}
                        placeholder={(row as any).placeholder ?? row.lbl} colors={c} keyboard={(row as any).keyboard} />
                    </React.Fragment>
                  ))}
                </View>
              ))}
              <TouchableOpacity style={[f.addSubBtn, { borderColor: c.primary }]} onPress={addReference}>
                <Ionicons name="add-circle-outline" size={18} color={c.primary} />
                <Text style={[f.addSubBtnText, { color: c.primary }]}>Add Reference</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── STEP 4: Review & Submit ── */}
        {step === 4 && (
          <>
            <Text style={[f.stepTitle, { color: c.text }]}>Review Your Application</Text>
            <Text style={[f.stepSub, { color: c.textMuted, marginBottom: 16 }]}>Make sure everything looks correct before submitting</Text>

            {[
              { title: 'Job', icon: 'briefcase-outline', iconColor: c.primary, content: (
                <><Text style={[f.reviewLine, { color: c.textSecondary }]}>Position: <Text style={{ fontWeight: '700', color: c.text }}>{jobTitle}</Text></Text>
                  <Text style={[f.reviewLine, { color: c.textSecondary }]}>Company: <Text style={{ fontWeight: '600', color: c.text }}>{companyName}</Text></Text></>
              )},
              { title: 'Contact', icon: 'person-outline', iconColor: '#8B5CF6', content: (
                <><Text style={[f.reviewLine, { color: c.textSecondary }]}>{form.contactEmail}</Text>
                  <Text style={[f.reviewLine, { color: c.textSecondary }]}>{form.contactPhone}</Text>
                  <Text style={[f.reviewLine, { color: c.textSecondary }]}>{form.contactLocation}</Text></>
              )},
              { title: `CV (${form.selectedCvIds.length} selected)`, icon: 'document-text-outline', iconColor: c.success, content: (
                <>{cvs.filter(cv => form.selectedCvIds.includes(cv._id)).map(cv => (
                  <Text key={cv._id} style={[f.reviewLine, { color: c.textSecondary }]}>• {cv.originalName ?? cv.fileName ?? cv.filename}</Text>
                ))}</>
              )},
              { title: 'Cover Letter', icon: 'chatbubble-outline', iconColor: '#F59E0B', content: (
                <Text style={[f.reviewLine, { color: c.textSecondary }]} numberOfLines={4}>{form.coverLetter}</Text>
              )},
              { title: `Skills (${form.skills.length})`, icon: 'construct-outline', iconColor: '#06B6D4', content: (
                <View style={f.tagsWrap}>
                  {form.skills.map(sk => <View key={sk} style={[f.tag, { backgroundColor: c.primaryLight }]}><Text style={[f.tagText, { color: c.primary }]}>{sk}</Text></View>)}
                </View>
              )},
            ].map(section => (
              <View key={section.title} style={[f.reviewCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={f.reviewCardHdr}>
                  <Ionicons name={section.icon as any} size={16} color={section.iconColor} />
                  <Text style={[f.reviewCardTitle, { color: c.text }]}>{section.title}</Text>
                </View>
                {section.content}
              </View>
            ))}

            <View style={[f.submitNote, { backgroundColor: c.primaryLight, borderColor: c.primary }]}>
              <Ionicons name="information-circle-outline" size={16} color={c.primary} />
              <Text style={[f.submitNoteText, { color: c.primary }]}>
                By submitting, you confirm that all information is accurate and complete.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Footer ── */}
      <View style={[f.footer, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        {step < 4 ? (
          <TouchableOpacity style={[f.nextBtn, { backgroundColor: c.primary }]} onPress={next}>
            <Text style={f.nextBtnText}>Continue to {STEPS[step].title}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[f.submitBtn, { backgroundColor: submitting ? c.border : c.primary }]}
            onPress={submit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="send" size={18} color="#fff" /><Text style={f.submitBtnText}>Submit Application</Text></>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const f = StyleSheet.create({
  sheet:          { flex: 1 },
  hdr:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 16 : 14, paddingBottom: 14, borderBottomWidth: 1 },
  hdrTitle:       { fontSize: 16, fontWeight: '700' },
  hdrSub:         { fontSize: 12, marginTop: 1 },
  progTrack:      { height: 3 },
  progFill:       { height: 3 },
  stepTitle:      { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  stepSub:        { fontSize: 14, lineHeight: 20 },
  sectionHead:    { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  charCount:      { fontSize: 12 },
  skillRow:       { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: 6 },
  skillInp:       { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  skillAddBtn:    { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  tagsWrap:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  tagText:        { fontSize: 13, fontWeight: '500' },
  cvItem:         { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10 },
  cvName:         { fontSize: 15, fontWeight: '600' },
  cvPrimary:      { fontSize: 11, fontWeight: '600', marginTop: 2 },
  emptyBox:       { alignItems: 'center', padding: 24, borderRadius: 14, borderWidth: 1, gap: 8 },
  emptyText:      { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  subCard:        { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  subCardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  subCardTitle:   { fontSize: 14, fontWeight: '700' },
  addSubBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', padding: 12, gap: 8, marginBottom: 4 },
  addSubBtnText:  { fontSize: 14, fontWeight: '600' },
  reviewCard:     { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  reviewCardHdr:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  reviewCardTitle:{ fontSize: 14, fontWeight: '700' },
  reviewLine:     { fontSize: 13, lineHeight: 20, marginBottom: 3 },
  submitNote:     { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, borderWidth: 1, padding: 12, gap: 8, marginTop: 8 },
  submitNoteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1 },
  nextBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, padding: 16, gap: 8 },
  nextBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  submitBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, padding: 16, gap: 10 },
  submitBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});
