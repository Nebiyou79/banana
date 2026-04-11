import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { CvSelector } from './CvSelector';
import { useMyCVs, useApplyForJob } from '../../hooks/useApplications';
import { ApplyFormData, ContactInfo } from '../../services/applicationService';

interface Props {
  jobId: string;
  colors: any;
  typography: any;
  spacing: any;
  prefillEmail?: string;
  prefillPhone?: string;
  prefillLocation?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const STEPS = ['CV', 'Cover Letter', 'Contact', 'Files', 'Review'];
const MAX_FILES = 3;
const MAX_COVER = 2000;

interface PickedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

const fmtSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const ApplyForm: React.FC<Props> = ({
  jobId,
  colors,
  typography,
  spacing,
  prefillEmail = '',
  prefillPhone = '',
  prefillLocation = '',
  onSuccess,
  onCancel,
}) => {
  const [step, setStep]             = useState(1);
  const [selectedCvId, setSelected] = useState<string | null>(null);
  const [coverLetter, setCover]     = useState('');
  const [email, setEmail]           = useState(prefillEmail);
  const [phone, setPhone]           = useState(prefillPhone);
  const [location, setLocation]     = useState(prefillLocation);
  const [files, setFiles]           = useState<PickedFile[]>([]);

  const { data: cvs = [], isLoading: cvsLoading } = useMyCVs();
  const apply = useApplyForJob();

  // ── Step validation ────────────────────────────────────────────────────────
  const canNext = () => {
    if (step === 1) return !!selectedCvId;
    if (step === 3) return !!email.trim();
    return true;
  };

  // ── File picker ────────────────────────────────────────────────────────────
  const pickFile = async () => {
    if (files.length >= MAX_FILES) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      if ((asset.size ?? 0) > 10 * 1024 * 1024) {
        Alert.alert('File too large', 'Max 10MB per file.');
        return;
      }
      setFiles((prev) => [
        ...prev,
        { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/pdf', size: asset.size },
      ]);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!selectedCvId) return;
    const formData: ApplyFormData = {
      cvId: selectedCvId,
      coverLetter: coverLetter.trim() || undefined,
      contactInfo: { email: email.trim(), phone: phone.trim() || undefined, location: location.trim() || undefined },
      additionalFiles: files.map((f) => ({ uri: f.uri, name: f.name, type: f.type })),
    };
    apply.mutate({ jobId, formData }, { onSuccess });
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const selectedCvName = cvs.find((c) => c._id === selectedCvId)?.fileName
    ?? cvs.find((c) => c._id === selectedCvId)?.originalName
    ?? 'None';

  // ── Render step content ────────────────────────────────────────────────────
  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text style={[s.stepTitle, { color: colors.text, fontSize: typography.lg }]}>Select your CV</Text>
            <Text style={[s.stepSub, { color: colors.textMuted, fontSize: typography.sm }]}>
              Choose which CV to submit with this application
            </Text>
            <View style={{ marginTop: 16 }}>
              <CvSelector
                cvs={cvs}
                selectedCvId={selectedCvId}
                onSelect={setSelected}
                isLoading={cvsLoading}
                colors={colors}
                typography={typography}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={[s.stepTitle, { color: colors.text, fontSize: typography.lg }]}>Cover Letter</Text>
            <Text style={[s.stepSub, { color: colors.textMuted, fontSize: typography.sm }]}>Optional — introduce yourself</Text>
            <View
              style={[s.textAreaWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            >
              <TextInput
                style={[s.textArea, { color: colors.text, fontSize: typography.base }]}
                multiline
                numberOfLines={8}
                value={coverLetter}
                onChangeText={(t) => setCover(t.slice(0, MAX_COVER))}
                placeholder="Introduce yourself and explain why you're a great fit…"
                placeholderTextColor={colors.placeholder}
                textAlignVertical="top"
              />
            </View>
            <Text style={[s.charCount, { color: colors.textMuted, fontSize: typography.xs }]}>
              {coverLetter.length} / {MAX_COVER}
            </Text>
          </View>
        );

      case 3:
        return (
          <View style={s.formGap}>
            <Text style={[s.stepTitle, { color: colors.text, fontSize: typography.lg }]}>Contact Info</Text>
            <Text style={[s.stepSub, { color: colors.textMuted, fontSize: typography.sm }]}>How should the employer reach you?</Text>
            {[
              { label: 'Email *', value: email, setter: setEmail, placeholder: 'you@email.com', keyboard: 'email-address' as const },
              { label: 'Phone', value: phone, setter: setPhone, placeholder: '+251 9…', keyboard: 'phone-pad' as const },
              { label: 'Location', value: location, setter: setLocation, placeholder: 'Addis Ababa, Ethiopia', keyboard: 'default' as const },
            ].map((field) => (
              <View key={field.label}>
                <Text style={[s.label, { color: colors.textSecondary, fontSize: typography.sm }]}>{field.label}</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, fontSize: typography.base }]}
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.placeholder}
                  keyboardType={field.keyboard}
                  autoCapitalize="none"
                />
              </View>
            ))}
          </View>
        );

      case 4:
        return (
          <View>
            <Text style={[s.stepTitle, { color: colors.text, fontSize: typography.lg }]}>Supporting Documents</Text>
            <Text style={[s.stepSub, { color: colors.textMuted, fontSize: typography.sm }]}>
              Optional — references, portfolio, etc. (max {MAX_FILES})
            </Text>
            <Text style={[{ color: colors.textMuted, fontSize: typography.xs, marginBottom: 12 }]}>
              Supported: PDF, DOC, DOCX — max 10MB each
            </Text>
            <View style={s.fileList}>
              {files.map((file, i) => (
                <View
                  key={i}
                  style={[s.fileRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Ionicons name="document-attach" size={18} color={colors.primary} />
                  <Text style={[{ flex: 1, color: colors.text, fontSize: typography.sm }]} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>{fmtSize(file.size)}</Text>
                  <TouchableOpacity onPress={() => setFiles((f) => f.filter((_, j) => j !== i))}>
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            {files.length < MAX_FILES && (
              <TouchableOpacity
                style={[s.addFile, { borderColor: colors.primary + '60', backgroundColor: colors.primary + '08' }]}
                onPress={pickFile}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: typography.sm, fontWeight: '600' }}>
                  Add Document
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 5:
        return (
          <View style={s.formGap}>
            <Text style={[s.stepTitle, { color: colors.text, fontSize: typography.lg }]}>Review & Submit</Text>
            <Text style={[s.stepSub, { color: colors.textMuted, fontSize: typography.sm }]}>
              Check your application before submitting
            </Text>
            {[
              { icon: 'document-text', label: 'CV', value: selectedCvName },
              { icon: 'mail',         label: 'Email', value: email },
              { icon: 'call',         label: 'Phone', value: phone || 'Not provided' },
              { icon: 'location',     label: 'Location', value: location || 'Not provided' },
              { icon: 'attach',       label: 'Files', value: `${files.length} attached` },
              {
                icon: 'chatbubble-ellipses',
                label: 'Cover Letter',
                value: coverLetter
                  ? coverLetter.slice(0, 100) + (coverLetter.length > 100 ? '…' : '')
                  : 'None',
              },
            ].map((item) => (
              <View
                key={item.label}
                style={[s.reviewRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name={item.icon as any} size={16} color={colors.primary} />
                <Text style={[s.reviewLabel, { color: colors.textMuted, fontSize: typography.sm }]}>{item.label}</Text>
                <Text
                  style={[s.reviewValue, { color: colors.text, fontSize: typography.sm }]}
                  numberOfLines={2}
                >
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Step indicator */}
      <View style={[s.stepBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {STEPS.map((label, i) => {
          const idx = i + 1;
          const done = step > idx;
          const curr = step === idx;
          return (
            <React.Fragment key={label}>
              <View style={s.stepItem}>
                <View
                  style={[
                    s.stepNum,
                    {
                      backgroundColor: done ? '#10B981' : curr ? colors.primary : colors.border,
                      borderColor: done ? '#10B981' : curr ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{idx}</Text>
                  )}
                </View>
                <Text
                  style={[s.stepLabel, { color: curr ? colors.primary : colors.textMuted, fontSize: 9 }]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[s.stepLine, { backgroundColor: step > idx ? '#10B981' : colors.border }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.content, { padding: spacing[5] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>

      {/* Footer buttons */}
      <View style={[s.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingHorizontal: spacing[5] }]}>
        <TouchableOpacity
          style={[s.backBtn, { borderColor: colors.border }]}
          onPress={() => (step === 1 ? onCancel() : setStep((s) => s - 1))}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: typography.base }}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        {step < 5 ? (
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: canNext() ? colors.primary : colors.border }]}
            onPress={() => canNext() && setStep((s) => s + 1)}
            disabled={!canNext()}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.base }}>
              {step === 2 && !coverLetter ? 'Skip' : 'Next'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: colors.success, opacity: apply.isPending ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={apply.isPending}
          >
            {apply.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.base }}>Submit</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  stepItem:  { alignItems: 'center', gap: 3, width: 40 },
  stepNum:   { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontWeight: '500', textAlign: 'center' },
  stepLine:  { flex: 1, height: 2, borderRadius: 1, marginBottom: 12 },
  content:   { paddingBottom: 24 },
  stepTitle: { fontWeight: '800', marginBottom: 4 },
  stepSub:   { marginBottom: 4 },
  textAreaWrap: { borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 160 },
  textArea:  {},
  charCount: { textAlign: 'right', marginTop: 4 },
  formGap:   { gap: 14 },
  label:     { fontWeight: '600', marginBottom: 6 },
  input:     { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  fileList:  { gap: 8, marginBottom: 10 },
  fileRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  addFile:   {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  reviewLabel: { width: 80, fontWeight: '600' },
  reviewValue: { flex: 1 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  backBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextBtn: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
