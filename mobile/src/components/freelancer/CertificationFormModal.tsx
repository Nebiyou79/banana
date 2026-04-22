/**
 * components/freelancer/CertificationFormModal.tsx
 * Aligned to backend Freelancer.js certifications sub-schema.
 */
import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAddCertification, useUpdateCertification } from '../../hooks/useFreelancer';
import { AppButton, AppInput } from '../freelancer/FormComponents';
import { DatePickerField } from '../shared/DatePickerField';
import type { FreelancerCertification, CertificationFormData } from '../../types/freelancer';

interface Props {
  visible: boolean;
  certification: FreelancerCertification | null;
  onClose: () => void;
}

interface FormErrors { name?: string; issuer?: string; issueDate?: string }

const EMPTY: CertificationFormData = {
  name: '', issuer: '', issueDate: '',
  expiryDate: '', credentialId: '', credentialUrl: '',
  description: '', skills: [],
};

const CertificationFormModal: React.FC<Props> = ({ visible, certification, onClose }) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, spacing } = theme;

  const [form, setForm]           = useState<CertificationFormData>(EMPTY);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [skillInput, setSkillInput] = useState('');
  const isEditing = Boolean(certification);

  const addMutation    = useAddCertification();
  const updateMutation = useUpdateCertification();
  const isPending = addMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (certification) {
      setForm({
        name:          certification.name ?? '',
        issuer:        certification.issuer ?? '',
        issueDate:     certification.issueDate?.split('T')[0] ?? '',
        expiryDate:    certification.expiryDate?.split('T')[0] ?? '',
        credentialId:  certification.credentialId ?? '',
        credentialUrl: certification.credentialUrl ?? '',
        description:   certification.description ?? '',
        skills:        certification.skills ?? [],
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
    setSkillInput('');
  }, [certification, visible]);

  const set = (key: keyof CertificationFormData, value: unknown) =>
    setForm(p => ({ ...p, [key]: value }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim())   e.name      = 'Certification name is required';
    if (!form.issuer.trim()) e.issuer    = 'Issuing organization is required';
    if (!form.issueDate)     e.issueDate = 'Issue date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills?.includes(s)) set('skills', [...(form.skills ?? []), s]);
    setSkillInput('');
  };

  const removeSkill = (s: string) =>
    set('skills', (form.skills ?? []).filter(x => x !== s));

  const handleSubmit = () => {
    if (!validate()) return;
    // Strip empty optional fields
    const payload: CertificationFormData = { ...form };
    if (!payload.expiryDate)    delete payload.expiryDate;
    if (!payload.credentialId)  delete payload.credentialId;
    if (!payload.credentialUrl) delete payload.credentialUrl;
    if (!payload.description)   delete payload.description;

    if (isEditing && certification) {
      updateMutation.mutate({ id: certification._id, data: payload }, { onSuccess: onClose });
    } else {
      addMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text }}>
            {isEditing ? 'Edit Certification' : 'Add Certification'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing[4], paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppInput
            label="Certification Name *"
            value={form.name}
            onChangeText={v => set('name', v)}
            placeholder="E.g. AWS Certified Solutions Architect"
            error={errors.name}
            leftIcon="ribbon-outline"
          />
          <AppInput
            label="Issuing Organization *"
            value={form.issuer}
            onChangeText={v => set('issuer', v)}
            placeholder="E.g. Amazon Web Services"
            error={errors.issuer}
            leftIcon="business-outline"
          />

          {/* Date pickers */}
          <View style={s.dateRow}>
            <View style={{ flex: 1, marginRight: spacing[3] }}>
              <DatePickerField
                label="Issue Date *"
                value={form.issueDate}
                onChange={v => set('issueDate', v)}
                placeholder="Pick issue date"
                maxDate={new Date()}
                error={errors.issueDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <DatePickerField
                label="Expiry Date"
                value={form.expiryDate ?? ''}
                onChange={v => set('expiryDate', v)}
                placeholder="Pick expiry date"
                minDate={form.issueDate ? new Date(form.issueDate) : undefined}
                optional
              />
            </View>
          </View>

          <View style={s.dateRow}>
            <AppInput
              label="Credential ID"
              value={form.credentialId ?? ''}
              onChangeText={v => set('credentialId', v)}
              placeholder="ABC-123"
              leftIcon="id-card-outline"
              containerStyle={{ flex: 1, marginRight: spacing[3] }}
            />
            <AppInput
              label="Credential URL"
              value={form.credentialUrl ?? ''}
              onChangeText={v => set('credentialUrl', v)}
              placeholder="https://verify.cert.com/…"
              leftIcon="link-outline"
              containerStyle={{ flex: 1 }}
            />
          </View>

          <AppInput
            label="Description"
            value={form.description ?? ''}
            onChangeText={v => set('description', v)}
            placeholder="What you learned or achieved with this certification…"
            multiline
            numberOfLines={3}
            leftIcon="document-text-outline"
          />

          {/* Skills */}
          <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
            Skills Gained
          </Text>
          <View style={[s.skillInput, {
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
          }]}>
            <AppInput
              value={skillInput}
              onChangeText={setSkillInput}
              placeholder="Type a skill and press Add"
              containerStyle={{ flex: 1, marginBottom: 0 }}
              returnKeyType="done"
              onSubmitEditing={addSkill}
              leftIcon="flash-outline"
            />
            <TouchableOpacity
              onPress={addSkill}
              style={[s.addSkillBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.xs }}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={s.skillTags}>
            {(form.skills ?? []).map((sk, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => removeSkill(sk)}
                style={[s.skillTag, { backgroundColor: colors.primaryLight, borderRadius: 10 }]}
              >
                <Text style={{ fontSize: typography.xs, color: colors.primary, fontWeight: '600' }}>{sk}</Text>
                <Ionicons name="close" size={10} color={colors.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ))}
          </View>

          <AppButton
            label={isPending
              ? (isEditing ? 'Saving…' : 'Adding…')
              : (isEditing ? 'Save Changes' : 'Add Certification')}
            onPress={handleSubmit}
            loading={isPending}
            disabled={isPending}
            style={{ marginTop: spacing[5] }}
            icon="checkmark-circle-outline"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  dateRow:      { flexDirection: 'row', alignItems: 'flex-start' },
  sectionLabel: { fontWeight: '600', marginBottom: 8 },
  skillInput:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingLeft: 4, gap: 8, marginBottom: 10 },
  addSkillBtn:  { height: 44, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  skillTags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  skillTag:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6 },
});

export default CertificationFormModal;