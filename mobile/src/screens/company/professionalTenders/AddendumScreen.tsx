// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/company/professionalTenders/AddendumScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';

import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import {
  useAddAddendum,
  useProfessionalTender,
} from '../../../hooks/useProfessionalTender';
import {
  LabeledField,
  TextField,
} from '../../../components/professionalTenders/ProfessionalTenderForm/FormFields';
import type { Addendum } from '../../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  ROUTE PARAMS
// ═════════════════════════════════════════════════════════════════════════════

interface RouteParams {
  tenderId: string;
}

// ═════════════════════════════════════════════════════════════════════════════
//  TYPES
// ═════════════════════════════════════════════════════════════════════════════

interface StagedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

// ═════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const formatBytes = (n?: number): string => {
  if (n === undefined) return '';
  if (n < 1024)        return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const inferMime = (asset: DocumentPicker.DocumentPickerAsset): string => {
  if (asset.mimeType) return asset.mimeType;
  const ext = asset.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':  return 'application/pdf';
    case 'doc':  return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:     return 'application/octet-stream';
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  ADDENDUM LIST ITEM
// ═════════════════════════════════════════════════════════════════════════════

const AddendumItem: React.FC<{ item: Addendum; index: number }> = ({ item, index }) => {
  const { colors, isDark } = useTheme();

  const issued  = new Date(item.issuedAt);
  const newDl   = item.newDeadline ? new Date(item.newDeadline) : null;
  const numBg   = isDark ? withAlpha(colors.warning, 0.15) : withAlpha(colors.warning, 0.12);
  const dlBg    = isDark ? withAlpha(colors.warning, 0.10) : withAlpha(colors.warning, 0.08);

  return (
    <View style={[itemStyles.root, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={itemStyles.head}>
        <View style={[itemStyles.numBadge, { backgroundColor: numBg }]}>
          <Text style={[itemStyles.numText, { color: colors.warning }]}>#{index + 1}</Text>
        </View>
        <View style={itemStyles.headText}>
          <Text style={[itemStyles.title, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[itemStyles.date, { color: colors.textMuted }]}>
            Issued{' '}
            {issued.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
            {' · '}
            {issued.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <Text style={[itemStyles.desc, { color: colors.text }]}>{item.description}</Text>

      {newDl && (
        <View style={[itemStyles.deadlineRow, { backgroundColor: dlBg, borderColor: colors.border }]}>
          <Ionicons name="calendar" size={13} color={colors.warning} />
          <Text style={[itemStyles.deadlineLabel, { color: colors.textMuted }]}>New deadline:</Text>
          <Text style={[itemStyles.deadlineValue, { color: colors.text }]}>
            {newDl.toLocaleString(undefined, {
              year: 'numeric', month: 'short', day: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
      )}

      {(item.attachments?.length ?? 0) > 0 && (
        <View style={itemStyles.attachRow}>
          <Ionicons name="document-attach-outline" size={12} color={colors.textMuted} />
          <Text style={[itemStyles.attachText, { color: colors.textMuted }]}>
            {item.attachments!.length} attachment{item.attachments!.length === 1 ? '' : 's'}
          </Text>
        </View>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════════

export const AddendumScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<{ key: string; name: string; params: RouteParams }>();
  const { colors } = useTheme();
  const tenderId   = route.params?.tenderId;

  // ─── Fetch tender (uses cached data) ────────────────────────────────────
  const { data, isLoading } = useProfessionalTender(tenderId);
  const tender = data?.data;

  // ─── Form state ─────────────────────────────────────────────────────────
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [files,       setFiles]       = useState<StagedFile[]>([]);
  const [submitting,  setSubmitting]  = useState(false);

  const addMut     = useAddAddendum();
  const titleValid = title.trim().length >= 3;
  const descValid  = description.trim().length >= 10;
  const canSubmit  = titleValid && descValid && !submitting;

  const pickFiles = useCallback(async () => {
    if (files.length >= 5) {
      Alert.alert('Limit reached', 'Up to 5 attachments per addendum.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const remaining = 5 - files.length;
      const accepted  = result.assets.slice(0, remaining).map((a) => ({
        uri: a.uri, name: a.name, type: inferMime(a), size: a.size,
      }));
      setFiles((prev) => {
        const seen  = new Set(prev.map((f) => f.uri));
        const fresh = accepted.filter((f) => !seen.has(f.uri));
        return [...prev, ...fresh];
      });
    } catch (err: any) {
      Alert.alert("Couldn't pick files", err?.message ?? 'Unknown error');
    }
  }, [files.length]);

  const removeFile = (uri: string) =>
    setFiles((prev) => prev.filter((f) => f.uri !== uri));

  const handleSubmit = useCallback(async () => {
    if (!tenderId || !canSubmit) return;
    setSubmitting(true);
    try {
      await addMut.mutateAsync({
        id: tenderId,
        data: { title: title.trim(), description: description.trim() },
        files,
      });
      Alert.alert(
        'Addendum issued',
        'Bidders will be notified of the amendment.',
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      Alert.alert("Couldn't issue addendum", err?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [tenderId, canSubmit, addMut, title, description, files, navigation]);

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (isLoading || !tender) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const addenda     = tender.addenda ?? [];
  const isCancelled = tender.status === 'cancelled';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tender context */}
        <View style={[styles.contextBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.contextLabel, { color: colors.textMuted }]}>TENDER</Text>
          <Text style={[styles.contextTitle, { color: colors.text }]} numberOfLines={2}>
            {tender.title}
          </Text>
          {!!tender.referenceNumber && (
            <Text
              style={[styles.contextRef, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {tender.referenceNumber}
            </Text>
          )}
        </View>

        {/* Existing addenda */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Issued Addenda ({addenda.length})
          </Text>
          {addenda.length === 0 ? (
            <View style={[styles.emptyAddenda, { borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No addenda have been issued for this tender yet.
              </Text>
            </View>
          ) : (
            <View style={styles.addendumList}>
              {addenda.map((a, i) => (
                <AddendumItem key={a._id} item={a} index={i} />
              ))}
            </View>
          )}
        </View>

        {/* New addendum form */}
        {!isCancelled && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Issue New Addendum
            </Text>

            <View
              style={[
                styles.warningBanner,
                { backgroundColor: colors.warningBg, borderColor: withAlpha(colors.warning, 0.40) },
              ]}
            >
              <Ionicons name="warning-outline" size={16} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                Addenda are visible to all bidders and timestamped. They cannot be
                deleted once issued.
              </Text>
            </View>

            <LabeledField
              label="Addendum Title"
              required
              error={
                title.length > 0 && !titleValid
                  ? 'Title must be at least 3 characters'
                  : undefined
              }
            >
              <TextField
                value={title}
                onChange={setTitle}
                placeholder="e.g., Clarification on technical requirements"
                maxLength={200}
                error={title.length > 0 && !titleValid}
              />
            </LabeledField>

            <LabeledField
              label="Description"
              required
              error={
                description.length > 0 && !descValid
                  ? 'Description must be at least 10 characters'
                  : undefined
              }
              helper="Describe the change, clarification, or amendment in detail."
            >
              <TextField
                value={description}
                onChange={setDescription}
                placeholder="Detailed description of the addendum…"
                multiline
                numberOfLines={6}
                error={description.length > 0 && !descValid}
              />
            </LabeledField>

            {/* Attachments */}
            <LabeledField label="Attachments" helper="Optional supporting documents (up to 5).">
              <View style={[styles.fileBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                {files.map((f) => (
                  <View
                    key={f.uri}
                    style={[styles.fileRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                  >
                    <Ionicons name="document-text-outline" size={14} color={colors.textMuted} />
                    <View style={styles.fileTextWrap}>
                      <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                        {f.name}
                      </Text>
                      <Text style={[styles.fileMeta, { color: colors.textMuted }]}>
                        {formatBytes(f.size)}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeFile(f.uri)} hitSlop={8}>
                      <Ionicons name="close" size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
                {files.length < 5 && (
                  <Pressable
                    onPress={pickFiles}
                    style={[styles.pickerBtn, { borderColor: colors.inputBorder }]}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
                    <Text style={[styles.pickerLabel, { color: colors.primary }]}>
                      {files.length === 0 ? 'Add attachments' : 'Add another'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </LabeledField>
          </View>
        )}
      </ScrollView>

      {/* Submit bar */}
      {!isCancelled && (
        <View style={[styles.footer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[
              styles.footerBtn,
              { backgroundColor: withAlpha(colors.textMuted, 0.12), flex: 1 },
            ]}
            disabled={submitting}
          >
            <Text style={[styles.footerLabel, { color: colors.text }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[
              styles.footerBtn,
              { backgroundColor: colors.primary, flex: 2, opacity: canSubmit ? 1 : 0.55 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Ionicons name="send" size={15} color={colors.textInverse} />
            )}
            <Text style={[styles.footerLabel, { color: colors.textInverse }]}>
              {submitting ? 'Issuing…' : 'Issue Addendum'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root:      { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 14, gap: 16, paddingBottom: 32 },

  contextBar: {
    padding: 12, borderRadius: 10, borderWidth: 1, gap: 4,
  },
  contextLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  contextTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  contextRef:   { fontSize: 11 },

  section:      { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },

  emptyAddenda: {
    padding: 16, borderWidth: 1, borderStyle: 'dashed',
    borderRadius: 12, alignItems: 'center',
  },
  emptyText: { fontSize: 13, fontStyle: 'italic' },

  addendumList: { gap: 10 },

  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 8, padding: 10, borderRadius: 10, borderWidth: 1,
  },
  warningText: { flex: 1, fontSize: 12, lineHeight: 17 },

  fileBox: { padding: 10, borderWidth: 1, borderRadius: 10, gap: 8 },
  fileRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, padding: 8, borderRadius: 8, borderWidth: 1,
  },
  fileTextWrap: { flex: 1, minWidth: 0 },
  fileName:     { fontSize: 12, fontWeight: '600' },
  fileMeta:     { fontSize: 10 },

  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 8,
    borderWidth: 1, borderStyle: 'dashed',
  },
  pickerLabel: { fontSize: 13, fontWeight: '600' },

  footer: {
    flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1,
  },
  footerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, minHeight: 44,
  },
  footerLabel: { fontSize: 14, fontWeight: '700' },
});

const itemStyles = StyleSheet.create({
  root:     { padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  head:     { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  numBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  numText:  { fontSize: 12, fontWeight: '800' },
  headText: { flex: 1, gap: 2 },
  title:    { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  date:     { fontSize: 11 },
  desc:     { fontSize: 12, lineHeight: 17 },

  deadlineRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },
  deadlineLabel: { fontSize: 11, fontWeight: '600' },
  deadlineValue: { fontSize: 11, fontWeight: '700' },

  attachRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attachText: { fontSize: 11 },
});

export default AddendumScreen;