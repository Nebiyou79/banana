// src/components/proposals/ProposalForm/Step1_CoverLetter.tsx
// Banana Mobile App — Module 6B: Proposals
// Step 1: Cover letter textarea with live character counter and auto-save indicator.

import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import type { UpdateProposalData } from '../../../types/proposal';

const MIN_LENGTH = 50;
const MAX_LENGTH = 5000;

interface Step1Props {
  coverLetter: string;
  onChange: (value: string) => void;
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

export const Step1_CoverLetter: React.FC<Step1Props> = ({
  coverLetter,
  onChange,
  saveState = 'idle',
  tenderTitle,
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const inputRef = useRef<TextInput>(null);

  const charCount = coverLetter.length;
  const tooShort = charCount > 0 && charCount < MIN_LENGTH;
  const tooLong = charCount > MAX_LENGTH;
  const isValid = charCount >= MIN_LENGTH && !tooLong;

  const borderColor = tooLong
    ? '#EF4444'
    : tooShort
    ? '#F59E0B'
    : isValid
    ? '#10B981'
    : colors.border;

  const saveStateConfig = {
    idle: { text: '', color: colors.textMuted },
    saving: { text: '⟳ Auto-saving…', color: '#F59E0B' },
    saved: { text: '✓ Saved', color: '#10B981' },
    error: { text: '✕ Save failed', color: '#EF4444' },
  };

  const saveInfo = saveStateConfig[saveState];

  const progressPct = Math.min((charCount / MIN_LENGTH) * 100, 100);

  return (
    <View style={[styles.container, style]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>1</Text>
        </View>
        <View style={styles.stepTitleBlock}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>
            Cover Letter
          </Text>
          <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
            Required • Tell the client why you're perfect for this
          </Text>
        </View>
        {saveState !== 'idle' && (
          <Text style={[styles.saveIndicator, { color: saveInfo.color }]}>
            {saveInfo.text}
          </Text>
        )}
      </View>

      {/* Tender context hint */}
      {tenderTitle && (
        <View
          style={[
            styles.contextHint,
            {
              backgroundColor: 'rgba(241,187,3,0.08)',
              borderColor: 'rgba(241,187,3,0.25)',
            },
          ]}
        >
          <Text style={[styles.contextLabel, { color: '#D97706' }]}>
            💡 Applying to:
          </Text>
          <Text
            style={[styles.contextTitle, { color: '#D97706' }]}
            numberOfLines={2}
          >
            {tenderTitle}
          </Text>
        </View>
      )}

      {/* Textarea */}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor: colors.inputBg,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          value={coverLetter}
          onChangeText={onChange}
          multiline
          textAlignVertical="top"
          placeholder={PLACEHOLDER}
          placeholderTextColor={colors.placeholder}
          maxLength={MAX_LENGTH + 50}
          style={[
            styles.input,
            { color: colors.text },
          ]}
          scrollEnabled={false}
        />
      </View>

      {/* Progress bar (only shown before MIN_LENGTH is reached) */}
      {charCount > 0 && charCount < MIN_LENGTH && (
        <View
          style={[styles.progressBar, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPct}%` as `${number}%`,
                backgroundColor: '#F1BB03',
              },
            ]}
          />
        </View>
      )}

      {/* Character counter + status */}
      <View style={styles.counterRow}>
        <Text
          style={[
            styles.counterStatus,
            {
              color: tooLong
                ? '#EF4444'
                : tooShort
                ? '#F59E0B'
                : isValid
                ? '#10B981'
                : colors.textMuted,
            },
          ]}
        >
          {charCount === 0
            ? `Minimum ${MIN_LENGTH} characters required`
            : tooShort
            ? `${MIN_LENGTH - charCount} more characters needed`
            : tooLong
            ? `${charCount - MAX_LENGTH} characters over limit`
            : '✓ Length looks good'}
        </Text>
        <Text
          style={[
            styles.charCount,
            { color: tooLong ? '#EF4444' : colors.textMuted },
          ]}
        >
          {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
        </Text>
      </View>

      {/* Tips */}
      <View
        style={[
          styles.tipsBox,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.tipsHeader, { color: colors.textMuted }]}>
          💡 Writing tips
        </Text>
        {[
          'Personalize your letter — mention the client or project specifically',
          'Lead with your most relevant experience, not your credentials',
          'Describe your approach before listing your skills',
          'Keep it concise — 200–400 words is ideal',
        ].map((tip, i) => (
          <Text
            key={i}
            style={[styles.tipItem, { color: colors.textMuted }]}
          >
            • {tip}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1BB03',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: {
    color: '#0A2540',
    fontSize: 13,
    fontWeight: '800',
  },
  stepTitleBlock: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  saveIndicator: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 0,
    marginTop: 4,
  },
  contextHint: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
  },
  contextTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    minHeight: 240,
  },
  input: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 210,
  },
  progressBar: {
    height: 3,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  charCount: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  tipsBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  tipsHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipItem: {
    fontSize: 12,
    lineHeight: 18,
  },
});

export default Step1_CoverLetter;
