// src/components/proposals/ProposalForm/Step5_Attachments.tsx
// Banana Mobile App — Module 6B: Proposals
// Step 5: File attachment uploader — document picker + portfolio links.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ViewStyle,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeStore } from '../../../store/themeStore';
import { ProposalAttachmentList } from '../ProposalAttachmentList';
import type { ProposalAttachment } from '../../../types/proposal';

interface Step5Props {
  proposalId: string | null;
  attachments: ProposalAttachment[];
  portfolioLinks: string[];
  onUpload: (uri: string, name: string, mimeType: string) => Promise<void>;
  onDeleteAttachment: (attachmentId: string) => Promise<void>;
  onPortfolioLinksChange: (links: string[]) => void;
  isUploading?: boolean;
  style?: ViewStyle;
}

const MAX_ATTACHMENTS = 10;
const MAX_PORTFOLIO_LINKS = 5;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
];

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const Step5_Attachments: React.FC<Step5Props> = ({
  proposalId,
  attachments,
  portfolioLinks,
  onUpload,
  onDeleteAttachment,
  onPortfolioLinksChange,
  isUploading = false,
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const [newLink, setNewLink] = useState('');
  const [linkError, setLinkError] = useState('');

  const canAddMore = attachments.length < MAX_ATTACHMENTS;

  const handlePickDocument = async () => {
    if (!proposalId) {
      Alert.alert(
        'Save draft first',
        'Please wait for your draft to be created before uploading attachments.',
      );
      return;
    }
    if (!canAddMore) {
      Alert.alert('Limit reached', `Maximum ${MAX_ATTACHMENTS} attachments per proposal.`);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'application/octet-stream';

      if (!ALLOWED_TYPES.includes(mimeType)) {
        Alert.alert(
          'Unsupported file type',
          'Please upload PDF, DOC, DOCX, JPG, PNG, or ZIP files only.',
        );
        return;
      }

      await onUpload(asset.uri, asset.name, mimeType);
    } catch (err) {
      Alert.alert('Upload failed', 'Could not read the selected file. Please try again.');
    }
  };

  const handleAddLink = () => {
    const trimmed = newLink.trim();
    if (!trimmed) return;

    if (!isValidUrl(trimmed)) {
      setLinkError('Please enter a valid URL (must start with https://)');
      return;
    }
    if (portfolioLinks.includes(trimmed)) {
      setLinkError('This link has already been added');
      return;
    }
    if (portfolioLinks.length >= MAX_PORTFOLIO_LINKS) {
      setLinkError(`Maximum ${MAX_PORTFOLIO_LINKS} portfolio links allowed`);
      return;
    }

    onPortfolioLinksChange([...portfolioLinks, trimmed]);
    setNewLink('');
    setLinkError('');
  };

  const handleRemoveLink = (index: number) => {
    onPortfolioLinksChange(portfolioLinks.filter((_, i) => i !== index));
  };

  const inputStyle = [
    styles.input,
    { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border },
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>5</Text>
        </View>
        <View>
          <Text style={[styles.stepTitle, { color: colors.text }]}>
            Attachments & Portfolio
          </Text>
          <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
            Optional — add files or relevant project links
          </Text>
        </View>
      </View>

      {/* File Attachments section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📎 Attachments
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
            {attachments.length}/{MAX_ATTACHMENTS}
          </Text>
        </View>
        <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
          CV, portfolio samples, work examples — PDF, DOC, JPG, ZIP (max 10MB each)
        </Text>

        {/* Attachments list */}
        {attachments.length > 0 && (
          <ProposalAttachmentList
            attachments={attachments}
            canDelete={true}
            onDelete={onDeleteAttachment}
            style={styles.attachmentList}
          />
        )}

        {/* Upload button */}
        {canAddMore && (
          <TouchableOpacity
            onPress={handlePickDocument}
            disabled={isUploading || !proposalId}
            activeOpacity={0.75}
            style={[
              styles.uploadBtn,
              {
                borderColor: isUploading ? colors.border : '#F1BB03',
                backgroundColor: isUploading
                  ? colors.inputBg
                  : 'rgba(241,187,3,0.06)',
              },
            ]}
          >
            {isUploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color="#F1BB03" />
                <Text style={[styles.uploadBtnText, { color: '#D97706' }]}>
                  Uploading…
                </Text>
              </View>
            ) : !proposalId ? (
              <Text style={[styles.uploadBtnText, { color: colors.textMuted }]}>
                🔒 Save draft first to upload files
              </Text>
            ) : (
              <Text style={[styles.uploadBtnText, { color: '#D97706' }]}>
                + Add File
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Portfolio Links section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🔗 Portfolio Links
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
            {portfolioLinks.length}/{MAX_PORTFOLIO_LINKS}
          </Text>
        </View>
        <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
          GitHub, Behance, Dribbble, live sites, or any relevant work
        </Text>

        {/* Existing links */}
        {portfolioLinks.map((link, i) => (
          <View
            key={i}
            style={[
              styles.linkRow,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.linkIcon]}>🔗</Text>
            <Text
              style={[styles.linkText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {link}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveLink(i)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.removeLinkIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add new link */}
        {portfolioLinks.length < MAX_PORTFOLIO_LINKS && (
          <View style={styles.addLinkRow}>
            <TextInput
              value={newLink}
              onChangeText={(v) => { setNewLink(v); setLinkError(''); }}
              placeholder="https://github.com/your-project"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleAddLink}
              style={[inputStyle, styles.linkInput]}
            />
            <TouchableOpacity
              onPress={handleAddLink}
              style={[styles.addLinkBtn, { backgroundColor: '#F1BB03' }]}
            >
              <Text style={styles.addLinkBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}
        {linkError ? (
          <Text style={styles.linkErrorText}>{linkError}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  stepHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1BB03',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  stepNumberText: { color: '#0A2540', fontSize: 13, fontWeight: '800' },
  stepTitle: { fontSize: 16, fontWeight: '700' },
  stepSubtitle: { fontSize: 12, marginTop: 2 },
  section: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 10,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  sectionCount: { fontSize: 12 },
  sectionHint: { fontSize: 12, lineHeight: 18, marginTop: -4 },
  attachmentList: { marginTop: 4 },
  uploadBtn: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadBtnText: { fontSize: 14, fontWeight: '600' },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  linkIcon: { fontSize: 14 },
  linkText: { flex: 1, fontSize: 12 },
  removeLinkIcon: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  addLinkRow: { flexDirection: 'row', gap: 8 },
  input: {
    height: 44, borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, fontSize: 14,
  },
  linkInput: { flex: 1 },
  addLinkBtn: {
    paddingHorizontal: 16, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  addLinkBtnText: { color: '#0A2540', fontSize: 13, fontWeight: '700' },
  linkErrorText: { fontSize: 12, color: '#EF4444', marginTop: -4 },
});

export default Step5_Attachments;
