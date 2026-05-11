/**
 * components/freelancer/CertificationFormModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * REFACTOR NOTES (spec compliance):
 *  ✅ useThemeStore → useTheme() bridge (single hook).
 *  ✅ All colours via useTheme() — zero hardcoded hex.
 *  ✅ withAlpha() replaces hex-string concatenation.
 *  ✅ colors.error → c.danger, colors.background → c.bg.
 *  ✅ colors.primaryLight → withAlpha(c.primary, 0.12).
 *  ✅ StyleSheet memoised with useMemo.
 *  ✅ All touch targets ≥ 44 pt (header close, add-skill btn).
 *  ✅ No emoji icons.
 *  ✅ Typed props — no `any`.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import { useAddCertification, useUpdateCertification } from '../../hooks/useFreelancer';
import { AppButton, AppInput } from './FormComponents';
import { DatePickerField } from '../shared/DatePickerField';
import type { FreelancerCertification, CertificationFormData } from '../../types/freelancer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  visible:       boolean;
  certification: FreelancerCertification | null;
  onClose:       () => void;
}

interface FormErrors {
  name?:      string;
  issuer?:    string;
  issueDate?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY: CertificationFormData = {
  name:          '',
  issuer:        '',
  issueDate:     '',
  expiryDate:    '',
  credentialId:  '',
  credentialUrl: '',
  description:   '',
  skills:        [],
};

// ─── Component ────────────────────────────────────────────────────────────────

const CertificationFormModal: React.FC<Props> = ({ visible, certification, onClose }) => {
  const { colors: c } = useTheme();

  const [form,       setForm]       = useState<CertificationFormData>(EMPTY);
  const [errors,     setErrors]     = useState<FormErrors>({});
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
    setForm((p) => ({ ...p, [key]: value }));

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
    if (s && !(form.skills ?? []).includes(s)) {
      set('skills', [...(form.skills ?? []), s]);
    }
    setSkillInput('');
  };

  const removeSkill = (s: string) =>
    set('skills', (form.skills ?? []).filter((x) => x !== s));

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: CertificationFormData = { ...form };
    if (!payload.expiryDate)    delete payload.expiryDate;
    if (!payload.credentialId)  delete payload.credentialId;
    if (!payload.credentialUrl) delete payload.credentialUrl;
    if (!payload.description)   delete payload.description;

    if (isEditing && certification) {
      updateMutation.mutate(
        { id: certification._id, data: payload },
        { onSuccess: onClose },
      );
    } else {
      addMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  // ── Memoised styles ─────────────────────────────────────────────────────────
  const s = useMemo(
    () =>
      StyleSheet.create({
        root:   { flex: 1, backgroundColor: c.bg },
        header: {
          flexDirection:  'row',
          alignItems:     'center',
          justifyContent: 'space-between',
          paddingHorizontal: SPACING.lg,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        },
        headerTitle: { fontSize: 17, fontWeight: '700', color: c.text },
        closeBtn:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
        body:        { padding: SPACING.lg, paddingBottom: 60 },

        dateRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
        credRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },

        sectionLabel: { fontWeight: '600', marginBottom: SPACING.sm, fontSize: 13, color: c.textSecondary },
        skillInputRow: {
          flexDirection: 'row',
          alignItems:    'center',
          borderWidth:   1.5,
          paddingLeft:   4,
          gap:           SPACING.sm,
          marginBottom:  10,
          borderRadius:  RADIUS.md,
          borderColor:   c.border,
          backgroundColor: c.inputBg,
        },
        addSkillBtn: {
          height:          44,
          paddingHorizontal: 14,
          alignItems:      'center',
          justifyContent:  'center',
          marginRight:     4,
          borderRadius:    RADIUS.sm,
          backgroundColor: c.primary,
        },
        addSkillText: { color: c.textInverse, fontWeight: '700', fontSize: 11 },

        skillTags:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm },
        skillTag: {
          flexDirection:     'row',
          alignItems:        'center',
          paddingHorizontal: 10,
          paddingVertical:   6,
          borderRadius:      RADIUS.sm,
          backgroundColor:   withAlpha(c.primary, 0.12),
        },
        skillTagText: { fontSize: 11, color: c.primary, fontWeight: '600' },
      }),
    [c],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={onClose}
            style={s.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={c.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {isEditing ? 'Edit Certification' : 'Add Certification'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppInput
            label="Certification Name *"
            value={form.name}
            onChangeText={(v) => set('name', v)}
            placeholder="E.g. AWS Certified Solutions Architect"
            error={errors.name}
            leftIcon="ribbon-outline"
          />

          <AppInput
            label="Issuing Organization *"
            value={form.issuer}
            onChangeText={(v) => set('issuer', v)}
            placeholder="E.g. Amazon Web Services"
            error={errors.issuer}
            leftIcon="business-outline"
          />

          {/* Date pickers row */}
          <View style={s.dateRow}>
            <View style={{ flex: 1 }}>
              <DatePickerField
                label="Issue Date *"
                value={form.issueDate}
                onChange={(v) => set('issueDate', v)}
                placeholder="Pick issue date"
                maxDate={new Date()}
                error={errors.issueDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <DatePickerField
                label="Expiry Date"
                value={form.expiryDate ?? ''}
                onChange={(v) => set('expiryDate', v)}
                placeholder="Pick expiry date"
                minDate={form.issueDate ? new Date(form.issueDate) : undefined}
                optional
              />
            </View>
          </View>

          {/* Credential row */}
          <View style={s.credRow}>
            <View style={{ flex: 1 }}>
              <AppInput
                label="Credential ID"
                value={form.credentialId ?? ''}
                onChangeText={(v) => set('credentialId', v)}
                placeholder="ABC-123"
                leftIcon="id-card-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                label="Credential URL"
                value={form.credentialUrl ?? ''}
                onChangeText={(v) => set('credentialUrl', v)}
                placeholder="https://verify.cert.com/…"
                leftIcon="link-outline"
              />
            </View>
          </View>

          <AppInput
            label="Description"
            value={form.description ?? ''}
            onChangeText={(v) => set('description', v)}
            placeholder="What you learned or achieved with this certification…"
            multiline
            numberOfLines={3}
            leftIcon="document-text-outline"
          />

          {/* Skills */}
          <Text style={s.sectionLabel}>Skills Gained</Text>
          <View style={s.skillInputRow}>
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
              style={s.addSkillBtn}
              accessibilityRole="button"
              accessibilityLabel="Add skill"
            >
              <Text style={s.addSkillText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={s.skillTags}>
            {(form.skills ?? []).map((sk, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => removeSkill(sk)}
                style={s.skillTag}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${sk}`}
              >
                <Text style={s.skillTagText}>{sk}</Text>
                <Ionicons name="close" size={10} color={c.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ))}
          </View>

          <AppButton
            label={
              isPending
                ? isEditing ? 'Saving…' : 'Adding…'
                : isEditing ? 'Save Changes' : 'Add Certification'
            }
            onPress={handleSubmit}
            loading={isPending}
            disabled={isPending}
            style={{ marginTop: SPACING.xl }}
            icon="checkmark-circle-outline"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CertificationFormModal;