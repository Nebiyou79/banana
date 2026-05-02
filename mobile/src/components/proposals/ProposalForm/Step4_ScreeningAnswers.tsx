// src/components/proposals/ProposalForm/Step4_ScreeningAnswers.tsx
// Banana Mobile App — Module 6B: Proposals
// Step 4: Render tender screening questions and collect answers.
// CRITICAL: Required questions must be answered before submission is allowed.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import type { ProposalScreeningAnswer, TenderScreeningQuestion } from '../../../types/proposal';

interface Step4Props {
  questions: TenderScreeningQuestion[];
  answers: ProposalScreeningAnswer[];
  onAnswersChange: (answers: ProposalScreeningAnswer[]) => void;
  showValidation?: boolean;
  style?: ViewStyle;
}

const MAX_ANSWER_LENGTH = 2000;

export const Step4_ScreeningAnswers: React.FC<Step4Props> = ({
  questions,
  answers,
  onAnswersChange,
  showValidation = false,
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const [charCounts, setCharCounts] = useState<number[]>(() =>
    questions.map((_, i) => answers[i]?.answer?.length ?? 0),
  );

  if (!questions || questions.length === 0) {
    return (
      <View style={[styles.noQuestions, style]}>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Screening Questions</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
              No screening questions for this tender
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.noneBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.noneText, { color: colors.textMuted }]}>
            ✓ This tender has no screening questions. Continue to the next step.
          </Text>
        </View>
      </View>
    );
  }

  const handleAnswerChange = (index: number, text: string) => {
    const trimmed = text.slice(0, MAX_ANSWER_LENGTH);
    const updatedCounts = [...charCounts];
    updatedCounts[index] = trimmed.length;
    setCharCounts(updatedCounts);

    const updatedAnswers = [...answers];
    updatedAnswers[index] = {
      questionIndex: index,
      questionText: questions[index]?.question,
      answer: trimmed,
      isRequired: questions[index]?.required ?? false,
    };
    onAnswersChange(updatedAnswers);
  };

  const getAnswer = (index: number): string =>
    answers[index]?.answer ?? '';

  const isMissingRequired = (index: number): boolean => {
    if (!showValidation) return false;
    return (questions[index]?.required ?? false) && !getAnswer(index).trim();
  };

  const requiredCount = questions.filter((q) => q.required).length;
  const answeredRequired = questions.filter(
    (q, i) => q.required && getAnswer(i).trim().length > 0,
  ).length;

  return (
    <View style={[styles.container, style]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>4</Text>
        </View>
        <View style={styles.stepTitleBlock}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>Screening Questions</Text>
          <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
            {requiredCount > 0
              ? `${requiredCount} required question${requiredCount !== 1 ? 's' : ''} — answer thoroughly`
              : `${questions.length} question${questions.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        {/* Progress pill */}
        {requiredCount > 0 && (
          <View
            style={[
              styles.progressPill,
              {
                backgroundColor:
                  answeredRequired === requiredCount
                    ? 'rgba(16,185,129,0.12)'
                    : 'rgba(245,158,11,0.12)',
              },
            ]}
          >
            <Text
              style={[
                styles.progressPillText,
                {
                  color:
                    answeredRequired === requiredCount ? '#059669' : '#D97706',
                },
              ]}
            >
              {answeredRequired}/{requiredCount}
            </Text>
          </View>
        )}
      </View>

      {/* Tip box */}
      <View
        style={[
          styles.tipBox,
          { backgroundColor: 'rgba(241,187,3,0.06)', borderColor: 'rgba(241,187,3,0.2)' },
        ]}
      >
        <Text style={[styles.tipText, { color: '#D97706' }]}>
          💡 Answering screening questions thoroughly increases your chances of being shortlisted.
        </Text>
      </View>

      {/* Questions */}
      {questions.map((question, index) => {
        const currentAnswer = getAnswer(index);
        const count = charCounts[index] ?? currentAnswer.length;
        const isOver = count > MAX_ANSWER_LENGTH;
        const isMissing = isMissingRequired(index);
        const isAnswered = currentAnswer.trim().length > 0;

        const borderColor = isMissing
          ? '#EF4444'
          : isOver
          ? '#EF4444'
          : isAnswered
          ? '#10B981'
          : colors.border;

        return (
          <View
            key={index}
            style={[
              styles.questionCard,
              {
                backgroundColor: colors.surface,
                borderColor: isMissing ? '#EF4444' : colors.border,
              },
            ]}
          >
            {/* Question label */}
            <View style={styles.questionLabelRow}>
              <View
                style={[
                  styles.qNumBadge,
                  { backgroundColor: 'rgba(241,187,3,0.15)' },
                ]}
              >
                <Text style={styles.qNumText}>Q{index + 1}</Text>
              </View>
              <Text
                style={[styles.questionText, { color: colors.text }]}
                numberOfLines={4}
              >
                {question.question}
                {question.required && (
                  <Text style={{ color: '#EF4444' }}> *</Text>
                )}
              </Text>
            </View>

            {/* Answer textarea */}
            <TextInput
              value={currentAnswer}
              onChangeText={(v) => handleAnswerChange(index, v)}
              placeholder={
                question.required
                  ? 'Required — please provide a detailed answer…'
                  : 'Your answer (optional)…'
              }
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={MAX_ANSWER_LENGTH + 10}
              style={[
                styles.answerInput,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor,
                },
              ]}
            />

            {/* Footer: error or counter */}
            <View style={styles.answerFooter}>
              {isMissing ? (
                <Text style={styles.errorText}>This question is required</Text>
              ) : (
                <View />
              )}
              <Text
                style={[
                  styles.charCount,
                  { color: isOver ? '#EF4444' : colors.textMuted },
                ]}
              >
                {count}/{MAX_ANSWER_LENGTH}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Validation error summary */}
      {showValidation && answeredRequired < requiredCount && (
        <View style={styles.validationError}>
          <Text style={styles.validationErrorText}>
            ⚠ Please answer all required questions before submitting.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  noQuestions: { gap: 16 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1BB03',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumberText: { color: '#0A2540', fontSize: 13, fontWeight: '800' },
  stepTitleBlock: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700' },
  stepSubtitle: { fontSize: 12, marginTop: 1 },
  progressPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  progressPillText: { fontSize: 12, fontWeight: '700' },
  tipBox: {
    borderWidth: 1, borderRadius: 10, padding: 12,
  },
  tipText: { fontSize: 12, lineHeight: 18 },
  questionCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 10,
  },
  questionLabelRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
  },
  qNumBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, flexShrink: 0, marginTop: 1,
  },
  qNumText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  questionText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  answerInput: {
    borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12,
    paddingTop: 10, paddingBottom: 10, fontSize: 14, lineHeight: 20, minHeight: 100,
  },
  answerFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  errorText: { fontSize: 12, color: '#EF4444', fontWeight: '500' },
  charCount: { fontSize: 11, fontVariant: ['tabular-nums'] },
  noneBox: {
    borderWidth: 1, borderRadius: 12, padding: 16,
  },
  noneText: { fontSize: 13, lineHeight: 20 },
  validationError: {
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1,
    borderColor: '#EF4444', borderRadius: 10, padding: 12,
  },
  validationErrorText: { fontSize: 13, color: '#DC2626', fontWeight: '500' },
});

export default Step4_ScreeningAnswers;
