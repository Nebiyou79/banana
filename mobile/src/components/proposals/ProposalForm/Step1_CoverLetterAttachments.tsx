// src/components/proposals/ProposalForm/Step1_CoverLetterAttachments.tsx
// Step 1: Cover letter, attachments, and portfolio links combined

import React, { useRef, useMemo, memo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ViewStyle,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import { ProposalAttachmentList } from '../ProposalAttachmentList';
import type { ProposalAttachment } from '../../../types/proposal';

const MIN_LENGTH = 50;
const MAX_LENGTH = 5000;
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

interface Step1Props {
  coverLetter: string;
  attachments: ProposalAttachment[];
  portfolioLinks: string[];
  onCoverLetterChange: (value: string) => void;
  onPortfolioLinksChange: (links: string[]) => void;
  onUpload: (uri: string, name: string, mimeType: string) => Promise<void>;
  onDeleteAttachment: (attachmentId: string) => Promise<void>;
  isUploading?: boolean;
  proposalId: string | null;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  tenderTitle?: string;
  style?: ViewStyle;
}

const PLACEHOLDER = `Start with a strong opening that directly addresses the client's needs...

Example:
• Reference a specific detail from the project brief
• Introduce your most relevant experience
• Explain your approach to solving their problem
• Share a concrete example of similar past work`;

const TIPS = [
  'Personalize your letter — mention the client or project specifically',
  'Lead with your most relevant experience, not your credentials',
  'Describe your approach before listing your skills',
  'Keep it concise — 200–400 words is ideal',
];

const Step1_CoverLetterAttachments: React.FC<Step1Props> = memo(({
  coverLetter,
  attachments,
  portfolioLinks,
  onCoverLetterChange,
  onPortfolioLinksChange,
  onUpload,
  onDeleteAttachment,
  isUploading = false,
  proposalId,
  saveState = 'idle',
  tenderTitle,
  style,
}) => {
  const { colors: c, radius, spacing, type } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [newLink, setNewLink] = useState('');
  const [linkError, setLinkError] = useState('');

  const charCount = coverLetter.length;
  const tooShort = charCount > 0 && charCount < MIN_LENGTH;
  const tooLong = charCount > MAX_LENGTH;
  const isValid = charCount >= MIN_LENGTH && !tooLong;
  const progressPct = Math.min((charCount / MIN_LENGTH) * 100, 100);

  const inputBorderColor = tooLong ? c.danger : tooShort ? c.warning : isValid ? c.success : c.border;
  const statusColor = tooLong ? c.danger : tooShort ? c.warning : isValid ? c.success : c.textMuted;
  const statusText = charCount === 0 ? `Minimum ${MIN_LENGTH} characters required`
    : tooShort ? `${MIN_LENGTH - charCount} more characters needed`
    : tooLong ? `${charCount - MAX_LENGTH} characters over limit`
    : '✓ Length looks good';

  const SAVE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    saving: 'sync-outline',
    saved: 'checkmark-circle-outline',
    error: 'alert-circle-outline',
  };
  const saveColor = saveState === 'saving' ? c.warning : saveState === 'saved' ? c.success : c.danger;

  const canAddMore = attachments.length < MAX_ATTACHMENTS;

  const handlePickDocument = async () => {
    if (!proposalId) {
      Alert.alert('Save draft first', 'Please wait for your draft to be created before uploading attachments.');
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
        Alert.alert('Unsupported file type', 'Please upload PDF, DOC, DOCX, JPG, PNG, or ZIP files only.');
        return;
      }

      await onUpload(asset.uri, asset.name, mimeType);
    } catch (err) {
      Alert.alert('Upload failed', 'Could not read the selected file. Please try again.');
    }
  };

  const isValidUrl = (str: string): boolean => {
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
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

  const styles = useMemo(() => makeStyles(c, radius, spacing), [c, radius, spacing]);

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepNumBadge}>
          <Text style={[type.caption, { color: c.textInverse, fontWeight: '800', fontSize: 13 }]}>1</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.bodyMd, { color: c.text, fontWeight: '700' }]}>Cover Letter & Files</Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>
            Tell the client why you're perfect for this
          </Text>
        </View>
        {saveState !== 'idle' && SAVE_ICON[saveState] && (
          <View style={styles.saveRow}>
            <Ionicons name={SAVE_ICON[saveState]} size={13} color={saveColor} />
            <Text style={[type.caption, { color: saveColor, fontWeight: '600', marginLeft: 4 }]}>
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save failed'}
            </Text>
          </View>
        )}
      </View>

      {/* Tender context hint */}
      {tenderTitle && (
        <View style={[styles.contextHint, {
          backgroundColor: withAlpha(c.primary, 0.07),
          borderColor: withAlpha(c.primary, 0.25),
        }]}>
          <Ionicons name="briefcase-outline" size={14} color={c.primary} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[type.caption, { color: c.primary, fontWeight: '600' }]}>Applying to:</Text>
            <Text style={[type.caption, { color: c.primary, fontWeight: '600', lineHeight: 18 }]} numberOfLines={2}>
              {tenderTitle}
            </Text>
          </View>
        </View>
      )}

      {/* Cover Letter Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>COVER LETTER</Text>
        <View style={[styles.inputWrapper, {
          borderColor: inputBorderColor,
          backgroundColor: c.inputBg,
        }]}>
          <TextInput
            ref={inputRef}
            value={coverLetter}
            onChangeText={onCoverLetterChange}
            multiline
            textAlignVertical="top"
            placeholder={PLACEHOLDER}
            placeholderTextColor={c.inputPlaceholder}
            maxLength={MAX_LENGTH + 50}
            style={[type.body, { color: c.text, minHeight: 210 }]}
            scrollEnabled={false}
          />
        </View>

        {charCount > 0 && charCount < MIN_LENGTH && (
          <View style={[styles.progressBarBg, { backgroundColor: c.border }]}>
            <View style={[styles.progressBarFill, {
              width: `${progressPct}%` as `${number}%`,
              backgroundColor: c.primary,
            }]} />
          </View>
        )}

        <View style={styles.counterRow}>
          <Text style={[type.caption, { color: statusColor, fontWeight: '500' }]}>{statusText}</Text>
          <Text style={[type.caption, { color: tooLong ? c.danger : c.textMuted }]}>
            {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
          </Text>
        </View>

        <View style={[styles.tipsBox, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={14} color={c.textMuted} />
            <Text style={[type.caption, { color: c.textMuted, fontWeight: '700', marginLeft: 6 }]}>Writing tips</Text>
          </View>
          {TIPS.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={[type.caption, { color: c.textMuted }]}>·</Text>
              <Text style={[type.caption, { color: c.textMuted, lineHeight: 18, flex: 1, marginLeft: 6 }]}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* File Attachments Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>ATTACHMENTS</Text>
          <Text style={[styles.sectionCount, { color: c.textMuted }]}>{attachments.length}/{MAX_ATTACHMENTS}</Text>
        </View>
        <Text style={[styles.sectionHint, { color: c.textMuted }]}>
          CV, portfolio samples, work examples — PDF, DOC, JPG, ZIP (max 10MB each)
        </Text>

        {attachments.length > 0 && (
          <ProposalAttachmentList attachments={attachments} canDelete={true} onDelete={onDeleteAttachment} style={styles.attachmentList} />
        )}

        {canAddMore && (
          <TouchableOpacity
            onPress={handlePickDocument}
            disabled={isUploading || !proposalId}
            activeOpacity={0.75}
            style={[styles.uploadBtn, {
              borderColor: isUploading ? c.border : c.primary,
              backgroundColor: isUploading ? c.inputBg : withAlpha(c.primary, 0.06),
            }]}
          >
            {isUploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color={c.primary} />
                <Text style={[styles.uploadBtnText, { color: c.primary }]}>Uploading…</Text>
              </View>
            ) : !proposalId ? (
              <Text style={[styles.uploadBtnText, { color: c.textMuted }]}>🔒 Save draft first to upload files</Text>
            ) : (
              <Text style={[styles.uploadBtnText, { color: c.primary }]}>+ Add File</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Portfolio Links Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>PORTFOLIO LINKS</Text>
          <Text style={[styles.sectionCount, { color: c.textMuted }]}>{portfolioLinks.length}/{MAX_PORTFOLIO_LINKS}</Text>
        </View>
        <Text style={[styles.sectionHint, { color: c.textMuted }]}>
          GitHub, Behance, Dribbble, live sites, or any relevant work
        </Text>

        {portfolioLinks.map((link, i) => (
          <View key={i} style={[styles.linkRow, { backgroundColor: c.inputBg, borderColor: c.border }]}>
            <Ionicons name="link-outline" size={14} color={c.textMuted} />
            <Text style={[styles.linkText, { color: c.textSecondary }]} numberOfLines={1}>{link}</Text>
            <TouchableOpacity onPress={() => handleRemoveLink(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle-outline" size={16} color={c.danger} />
            </TouchableOpacity>
          </View>
        ))}

        {portfolioLinks.length < MAX_PORTFOLIO_LINKS && (
          <View style={styles.addLinkRow}>
            <TextInput
              value={newLink}
              onChangeText={(v) => { setNewLink(v); setLinkError(''); }}
              placeholder="https://github.com/your-project"
              placeholderTextColor={c.placeholder}
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleAddLink}
              style={[styles.linkInput, { color: c.text, backgroundColor: c.inputBg, borderColor: c.border }]}
            />
            <TouchableOpacity onPress={handleAddLink} style={[styles.addLinkBtn, { backgroundColor: c.primary }]}>
              <Text style={[styles.addLinkBtnText, { color: c.textInverse }]}>Add</Text>
            </TouchableOpacity>
          </View>
        )}
        {linkError && <Text style={[styles.linkErrorText, { color: c.danger }]}>{linkError}</Text>}
      </View>
    </ScrollView>
  );
});

Step1_CoverLetterAttachments.displayName = 'Step1_CoverLetterAttachments';

const makeStyles = (c: any, radius: any, spacing: any) =>
  StyleSheet.create({
    container: { gap: 20, flex: 1 },
    stepHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
    stepNumBadge: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: c.primary,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
    },
    saveRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, marginTop: 4 },
    contextHint: { borderWidth: 1, borderRadius: radius.md, padding: 12, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    section: { gap: 12, marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    sectionCount: { fontSize: 11, fontWeight: '600' },
    sectionHint: { fontSize: 12, lineHeight: 18, marginTop: -4 },
    inputWrapper: { borderWidth: 1.5, borderRadius: radius.lg, padding: 14, minHeight: 240 },
    progressBarBg: { height: 3, borderRadius: 99, overflow: 'hidden', marginTop: 4 },
    progressBarFill: { height: '100%', borderRadius: 99 },
    counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tipsBox: { borderWidth: 1, borderRadius: radius.md, padding: 14, gap: 6 },
    tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start' },
    attachmentList: { marginTop: 4 },
    uploadBtn: { borderWidth: 2, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
    uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    uploadBtnText: { fontSize: 14, fontWeight: '600' },
    linkRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    linkText: { flex: 1, fontSize: 12 },
    addLinkRow: { flexDirection: 'row', gap: 8 },
    linkInput: { flex: 1, height: 44, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
    addLinkBtn: { paddingHorizontal: 16, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    addLinkBtnText: { fontSize: 13, fontWeight: '700' },
    linkErrorText: { fontSize: 12, marginTop: -4 },
  });

export { Step1_CoverLetterAttachments };
export default Step1_CoverLetterAttachments;