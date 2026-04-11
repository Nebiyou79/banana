import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeStore } from '../../store/themeStore';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useRequestVerification } from '../../hooks/useVerification';

type VerificationType = 'identity' | 'business' | 'professional';

const TYPES: { key: VerificationType; label: string; icon: string; desc: string }[] = [
  { key: 'identity',     label: 'Identity',     icon: 'card-outline',    desc: 'National ID, Passport, or Driver\'s License' },
  { key: 'business',     label: 'Business',     icon: 'business-outline', desc: 'Business registration or trade license' },
  { key: 'professional', label: 'Professional', icon: 'ribbon-outline',   desc: 'Professional certificates or credentials' },
];

interface SelectedDoc {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export const RequestVerificationScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius, spacing } = theme;
  const navigation = useNavigation<any>();

  const [selectedType, setSelectedType] = useState<VerificationType>('identity');
  const [documents, setDocuments]       = useState<SelectedDoc[]>([]);
  const [notes, setNotes]               = useState('');

  const requestVerification = useRequestVerification();

  const pickDocument = async () => {
    if (documents.length >= 3) {
      Alert.alert('Limit reached', 'Maximum 3 documents allowed');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setDocuments((prev) => [...prev, {
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
        }]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not pick document');
    }
  };

  const removeDoc = (idx: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (documents.length === 0) {
      Alert.alert('Documents required', 'Please attach at least one document');
      return;
    }
    const form = new FormData();
    form.append('type', selectedType);
    if (notes.trim()) form.append('notes', notes.trim());
    documents.forEach((doc, i) => {
      form.append('documents', {
        uri: doc.uri,
        name: doc.name,
        type: doc.mimeType ?? 'application/octet-stream',
      } as any);
    });
    requestVerification.mutate(form, {
      onSuccess: () => navigation.goBack(),
    });
  };

  const fmtSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <DashboardLayout scrollable={false}>
        <ScreenHeader title="Request Verification" showBack onBackPress={() => navigation.goBack()} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing[4], paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Type selection */}
          <Text style={[styles.label, { color: colors.text, fontSize: typography.md }]}>
            Verification Type
          </Text>
          <View style={styles.typeGrid}>
            {TYPES.map((t) => {
              const active = selectedType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeCard,
                    {
                      borderColor:       active ? colors.primary : colors.border,
                      backgroundColor:   active ? colors.primaryLight : colors.card,
                      borderRadius:      borderRadius.xl,
                      borderWidth:       active ? 2 : 1,
                      ...theme.shadows.sm,
                    },
                  ]}
                  onPress={() => setSelectedType(t.key)}
                >
                  <Ionicons name={t.icon as any} size={26} color={active ? colors.primary : colors.textMuted} />
                  <Text style={[styles.typeLabel, { color: active ? colors.primary : colors.text, fontSize: typography.md }]}>
                    {t.label}
                  </Text>
                  <Text style={[styles.typeDesc, { color: colors.textMuted, fontSize: typography.xs }]}>
                    {t.desc}
                  </Text>
                  {active && (
                    <View style={[styles.checkMark, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Document upload */}
          <Text style={[styles.label, { color: colors.text, fontSize: typography.md, marginTop: 20 }]}>
            Supporting Documents
          </Text>
          <Text style={[styles.sublabel, { color: colors.textMuted, fontSize: typography.sm }]}>
            PDF or image files (max 3 files)
          </Text>

          {documents.map((doc, idx) => (
            <View
              key={idx}
              style={[styles.docItem, { backgroundColor: colors.card, borderRadius: borderRadius.lg, ...theme.shadows.sm }]}
            >
              <Ionicons
                name={doc.mimeType?.includes('pdf') ? 'document-text' : 'image'}
                size={22}
                color={colors.primary}
              />
              <View style={styles.docInfo}>
                <Text style={[styles.docName, { color: colors.text, fontSize: typography.sm }]} numberOfLines={1}>
                  {doc.name}
                </Text>
                {doc.size && (
                  <Text style={[{ color: colors.textMuted, fontSize: typography.xs }]}>
                    {fmtSize(doc.size)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => removeDoc(idx)}>
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          {documents.length < 3 && (
            <TouchableOpacity
              style={[
                styles.uploadBtn,
                { borderColor: colors.border, borderRadius: borderRadius.xl, backgroundColor: colors.card },
              ]}
              onPress={pickDocument}
            >
              <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
              <Text style={[styles.uploadText, { color: colors.primary, fontSize: typography.base }]}>
                Tap to attach document
              </Text>
              <Text style={[{ color: colors.textMuted, fontSize: typography.xs }]}>
                PDF, JPG, PNG
              </Text>
            </TouchableOpacity>
          )}

          {/* Notes */}
          <Text style={[styles.label, { color: colors.text, fontSize: typography.md, marginTop: 20 }]}>
            Additional Notes (optional)
          </Text>
          <Input
            placeholder="Any additional information for the reviewer..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />

          {/* Submit */}
          <Button
            title="Submit Verification Request"
            onPress={handleSubmit}
            loading={requestVerification.isPending}
            fullWidth
            style={{ marginTop: 24 }}
            leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color="#fff" />}
          />
        </ScrollView>
      </DashboardLayout>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  label:    { fontWeight: '700', marginBottom: 10 },
  sublabel: { marginBottom: 12, marginTop: -6 },
  typeGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  typeCard: {
    flex: 1, minWidth: 100, padding: 14,
    alignItems: 'center', gap: 6, position: 'relative',
  },
  typeLabel: { fontWeight: '700', textAlign: 'center' },
  typeDesc:  { textAlign: 'center', lineHeight: 14 },
  checkMark: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  docItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, gap: 10 },
  docInfo:  { flex: 1 },
  docName:  { fontWeight: '500' },
  uploadBtn: {
    alignItems: 'center', borderWidth: 1.5,
    borderStyle: 'dashed', padding: 24, gap: 8,
    marginBottom: 8,
  },
  uploadText: { fontWeight: '600' },
});
