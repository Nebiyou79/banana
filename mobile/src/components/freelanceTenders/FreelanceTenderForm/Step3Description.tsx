// mobile/src/components/freelanceTenders/FreelanceTenderForm/Step3Description.tsx
// UPDATED: useTheme() instead of useThemeStore(), all colors from theme

import React, { memo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { MIN_TOUCH_TARGET } from '../../../theme/tokens';
import type {
  FreelanceTenderFormData,
  ScreeningQuestion,
} from '../../../types/freelanceTender';

export interface Step3DescriptionProps {
  data: Pick<FreelanceTenderFormData, 'details'>;
  description: string;
  onChange: (patch: Partial<FreelanceTenderFormData>) => void;
  onDescriptionChange: (v: string) => void;
  errors: Record<string, string>;
}

const MAX_DESCRIPTION = 50_000;

const Step3Description: React.FC<Step3DescriptionProps> = memo(
  ({ data, description, onChange, onDescriptionChange, errors }) => {
    const { colors: c, radius, spacing, type } = useTheme();
    const questions: ScreeningQuestion[] = data.details.screeningQuestions ?? [];

    const inputStyle = [
      styles.input,
      {
        backgroundColor: c.inputBg,
        borderColor: c.border,
        color: c.text,
        borderRadius: radius.md,
      },
    ];
    const labelStyle = [styles.label, { color: c.text }];
    const errorStyle = [styles.error, { color: c.danger }];
    const hintStyle = [styles.hint, { color: c.textMuted }];

    const patchQuestions = useCallback(
      (newQs: ScreeningQuestion[]) => {
        onChange({ details: { ...data.details, screeningQuestions: newQs } });
      },
      [data.details, onChange]
    );

    const addQuestion = () => {
      if (questions.length >= 10) return;
      patchQuestions([...questions, { question: '', required: false }]);
    };

    const removeQuestion = (index: number) => {
      patchQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, patch: Partial<ScreeningQuestion>) => {
      patchQuestions(
        questions.map((q, i) => (i === index ? { ...q, ...patch } : q))
      );
    };

    return (
      <View style={styles.container}>
        {/* Full Description */}
        <View style={styles.field}>
          <Text style={labelStyle}>
            Full Description <Text style={errorStyle}>*</Text>
          </Text>
          <TextInput
            style={[inputStyle, styles.descriptionInput]}
            value={description}
            onChangeText={onDescriptionChange}
            placeholder="Describe the project, deliverables, tools, and what success looks like…"
            placeholderTextColor={c.textMuted}
            multiline
            numberOfLines={10}
            maxLength={MAX_DESCRIPTION}
            textAlignVertical="top"
          />
          <Text style={hintStyle}>
            {description.length.toLocaleString()} / {MAX_DESCRIPTION.toLocaleString()} chars (min 100)
          </Text>
          {errors.description ? <Text style={errorStyle}>{errors.description}</Text> : null}
        </View>

        {/* Skills Required - placeholder */}
        <View style={styles.field}>
          <Text style={labelStyle}>Required Skills</Text>
          <Text style={[hintStyle, { fontStyle: 'italic' }]}>
            Skills are set in the parent form's skillsRequired field.
          </Text>
        </View>

        {/* Screening Questions */}
        <View style={styles.field}>
          <View style={styles.sectionHeader}>
            <Text style={labelStyle}>Screening Questions</Text>
            <Text style={[styles.count, { color: c.textMuted }]}>
              {questions.length}/10
            </Text>
          </View>
          <Text style={hintStyle}>Optional questions applicants must answer before applying.</Text>

          {questions.map((q, i) => (
            <View
              key={i}
              style={[
                styles.questionCard,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <View style={styles.questionHeader}>
                <Text style={[styles.questionNum, { color: c.textMuted }]}>Q{i + 1}</Text>
                <TouchableOpacity
                  onPress={() => removeQuestion(i)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove question ${i + 1}`}
                  style={styles.removeBtn}
                >
                  <Text style={[styles.removeBtnText, { color: c.danger }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[inputStyle, { marginBottom: 8 }]}
                value={q.question}
                onChangeText={(v) => updateQuestion(i, { question: v })}
                placeholder="Enter your screening question…"
                placeholderTextColor={c.textMuted}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                onPress={() => updateQuestion(i, { required: !q.required })}
                style={[
                  styles.requiredToggle,
                  {
                    backgroundColor: q.required ? c.primaryBg : 'transparent',
                    borderColor: q.required ? c.primary : c.border,
                    borderRadius: radius.full,
                  },
                ]}
                activeOpacity={0.75}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: q.required }}
              >
                <Text style={[styles.requiredText, { color: q.required ? c.primary : c.textMuted }]}>
                  {q.required ? '✓ ' : ''}Required answer
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {questions.length < 10 && (
            <TouchableOpacity
              onPress={addQuestion}
              style={[
                styles.addQuestionBtn,
                {
                  borderColor: c.borderAccent,
                  backgroundColor: c.primaryBg,
                  borderRadius: radius.md,
                },
              ]}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Text style={[styles.addQuestionText, { color: c.primary }]}>
                + Add Screening Question
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

Step3Description.displayName = 'Step3Description';

const styles = StyleSheet.create({
  container: { gap: 4 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  count: { fontSize: 12 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: MIN_TOUCH_TARGET + 6,
  },
  descriptionInput: { minHeight: 200, paddingTop: 12 },
  error: { fontSize: 12, marginTop: 4 },
  hint: { fontSize: 11, marginTop: 4 },
  questionCard: {
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  questionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  questionNum: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  removeBtn: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 16, fontWeight: '700' },
  requiredToggle: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  requiredText: { fontSize: 13, fontWeight: '600' },
  addQuestionBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET + 6,
    justifyContent: 'center',
  },
  addQuestionText: { fontSize: 14, fontWeight: '600' },
});

export default Step3Description;