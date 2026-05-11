// src/components/proposals/ProposalForm/Step1_CoverLetter.tsx
// Banana Mobile App — Module 6B: Proposals
// Step 1: Cover letter textarea with live character counter and auto-save indicator.
// REFACTORED: useTheme() + withAlpha(). Ionicons replace emoji. Memoized styles. No hardcoded hex.

import React, { useRef, useMemo, memo } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';

const MIN_LENGTH = 50;
const MAX_LENGTH = 5000;

interface Step1Props {
  coverLetter: string;
  onChange: (value: string) => void;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  tenderTitle?: string;
  style?: ViewStyle;
}

const PLACEHOLDER =
  `Start with a strong opening that directly addresses the client's needs...

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

const Step1_CoverLetter: React.FC<Step1Props> = memo(({
  coverLetter, onChange, saveState = 'idle', tenderTitle, style,
}) => {
  const { colors: c, radius, spacing, type } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const styles = useMemo(() => makeStyles(c, radius, spacing), [c, radius, spacing]);

  const charCount   = coverLetter.length;
  const tooShort    = charCount > 0 && charCount < MIN_LENGTH;
  const tooLong     = charCount > MAX_LENGTH;
  const isValid     = charCount >= MIN_LENGTH && !tooLong;
  const progressPct = Math.min((charCount / MIN_LENGTH) * 100, 100);

  const inputBorderColor = tooLong   ? c.danger
                         : tooShort  ? c.warning
                         : isValid   ? c.success
                         : c.border;

  const statusColor = tooLong   ? c.danger
                    : tooShort  ? c.warning
                    : isValid   ? c.success
                    : c.textMuted;

  const statusText  = charCount === 0         ? `Minimum ${MIN_LENGTH} characters required`
                    : tooShort                ? `${MIN_LENGTH - charCount} more characters needed`
                    : tooLong                 ? `${charCount - MAX_LENGTH} characters over limit`
                    : '✓ Length looks good';

  const SAVE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    saving: 'sync-outline',
    saved:  'checkmark-circle-outline',
    error:  'alert-circle-outline',
  };
  const saveColor = saveState === 'saving' ? c.warning
                  : saveState === 'saved'  ? c.success
                  : c.danger;

  return (
    <View style={[styles.container, style]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepNumBadge}>
          <Text style={[type.caption, { color: c.textInverse, fontWeight: '800', fontSize: 13 }]}>1</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.bodyMd, { color: c.text, fontWeight: '700' }]}>Cover Letter</Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>
            Required · Tell the client why you're perfect for this
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

      {/* Textarea */}
      <View style={[styles.inputWrapper, {
        borderColor: inputBorderColor,
        backgroundColor: c.inputBg,
      }]}>
        <TextInput
          ref={inputRef}
          value={coverLetter}
          onChangeText={onChange}
          multiline
          textAlignVertical="top"
          placeholder={PLACEHOLDER}
          placeholderTextColor={c.inputPlaceholder}
          maxLength={MAX_LENGTH + 50}
          style={[type.body, { color: c.text, minHeight: 210 }]}
          scrollEnabled={false}
        />
      </View>

      {/* Progress bar — only before MIN_LENGTH */}
      {charCount > 0 && charCount < MIN_LENGTH && (
        <View style={[styles.progressBarBg, { backgroundColor: c.border }]}>
          <View style={[styles.progressBarFill, {
            width: `${progressPct}%` as `${number}%`,
            backgroundColor: c.primary,
          }]} />
        </View>
      )}

      {/* Counter row */}
      <View style={styles.counterRow}>
        <Text style={[type.caption, { color: statusColor, fontWeight: '500' }]}>{statusText}</Text>
        <Text style={[type.caption, { color: tooLong ? c.danger : c.textMuted }]}>
          {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
        </Text>
      </View>

      {/* Tips */}
      <View style={[styles.tipsBox, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb-outline" size={14} color={c.textMuted} />
          <Text style={[type.caption, { color: c.textMuted, fontWeight: '700', marginLeft: 6 }]}>
            Writing tips
          </Text>
        </View>
        {TIPS.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={[type.caption, { color: c.textMuted }]}>·</Text>
            <Text style={[type.caption, { color: c.textMuted, lineHeight: 18, flex: 1, marginLeft: 6 }]}>
              {tip}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});

Step1_CoverLetter.displayName = 'Step1_CoverLetter';

const makeStyles = (c: any, radius: any, spacing: any) =>
  StyleSheet.create({
    container: { gap: 14 },
    stepHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    stepNumBadge: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: c.primary,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, marginTop: 1,
    },
    saveRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, marginTop: 4 },
    contextHint: {
      borderWidth: 1, borderRadius: radius.md, padding: 12,
      flexDirection: 'row', alignItems: 'flex-start',
    },
    inputWrapper: {
      borderWidth: 1.5, borderRadius: radius.lg,
      padding: 14, minHeight: 240,
    },
    progressBarBg: { height: 3, borderRadius: 99, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 99 },
    counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tipsBox: { borderWidth: 1, borderRadius: radius.md, padding: 14, gap: 6 },
    tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start' },
  });

export { Step1_CoverLetter };
export default Step1_CoverLetter;