// src/components/proposals/ProposalForm/Step3_MilestonesScreening.tsx
// Step 3: Payment milestones and screening questions combined

import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Switch, Alert, ScrollView,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import type { ProposalMilestone, ProposalDurationUnit, ProposalScreeningAnswer, TenderScreeningQuestion } from '../../../types/proposal';

interface Step3Props {
  milestones: ProposalMilestone[];
  proposedAmount: number;
  currency: string;
  screeningQuestions: TenderScreeningQuestion[];
  screeningAnswers: ProposalScreeningAnswer[];
  onMilestonesChange: (milestones: ProposalMilestone[]) => void;
  onScreeningAnswersChange: (answers: ProposalScreeningAnswer[]) => void;
  showValidation?: boolean;
  style?: ViewStyle;
}

const DURATION_UNITS: ProposalDurationUnit[] = ['days', 'weeks', 'months'];
const TOLERANCE = 0.05;
const MAX_ANSWER_LENGTH = 2000;

function newMilestone(order: number): ProposalMilestone {
  return { title: '', description: '', amount: 0, duration: 1, durationUnit: 'weeks', order };
}

export const Step3_MilestonesScreening: React.FC<Step3Props> = ({
  milestones,
  proposedAmount,
  currency,
  screeningQuestions,
  screeningAnswers,
  onMilestonesChange,
  onScreeningAnswersChange,
  showValidation = false,
  style,
}) => {
  const { colors: c, radius, spacing, type } = useTheme();
  const [milestonesEnabled, setMilestonesEnabled] = useState(milestones.length > 0);
  const [charCounts, setCharCounts] = useState<number[]>(() =>
    screeningQuestions.map((_, i) => screeningAnswers[i]?.answer?.length ?? 0),
  );

  const milestoneTotal = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const diff = Math.abs(milestoneTotal - proposedAmount);
  const isMatch = proposedAmount === 0 || diff / (proposedAmount || 1) <= TOLERANCE;
  const matchColor = isMatch ? c.success : c.danger;

  const inputBase = useMemo(() => ({
    color: c.text,
    backgroundColor: c.inputBg,
    borderColor: c.border,
  }), [c]);

  const styles = useMemo(() => makeStyles(c, radius, spacing), [c, radius, spacing]);

  // Milestone handlers
  const handleMilestonesToggle = (val: boolean) => {
    setMilestonesEnabled(val);
    if (!val) onMilestonesChange([]);
    else if (milestones.length === 0) onMilestonesChange([newMilestone(0)]);
  };

  const handleAddMilestone = () => {
    if (milestones.length >= 10) {
      Alert.alert('Maximum milestones', 'You can add up to 10 milestones per proposal.');
      return;
    }
    onMilestonesChange([...milestones, newMilestone(milestones.length)]);
  };

  const handleRemoveMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i }));
    onMilestonesChange(updated);
    if (updated.length === 0) setMilestonesEnabled(false);
  };

  const handleUpdateMilestone = (index: number, patch: Partial<ProposalMilestone>) =>
    onMilestonesChange(milestones.map((m, i) => i === index ? { ...m, ...patch } : m));

  const pctOf = (amount: number) => proposedAmount > 0 ? `${Math.round((amount / proposedAmount) * 100)}%` : '';

  // Screening answers handlers
  const handleAnswerChange = (index: number, text: string) => {
    const trimmed = text.slice(0, MAX_ANSWER_LENGTH);
    const updatedCounts = [...charCounts];
    updatedCounts[index] = trimmed.length;
    setCharCounts(updatedCounts);

    const updatedAnswers = [...screeningAnswers];
    updatedAnswers[index] = {
      questionIndex: index,
      questionText: screeningQuestions[index]?.question,
      answer: trimmed,
      isRequired: screeningQuestions[index]?.required ?? false,
    };
    onScreeningAnswersChange(updatedAnswers);
  };

  const getAnswer = (index: number): string => screeningAnswers[index]?.answer ?? '';
  const isMissingRequired = (index: number): boolean => {
    if (!showValidation) return false;
    return (screeningQuestions[index]?.required ?? false) && !getAnswer(index).trim();
  };

  const requiredCount = screeningQuestions.filter((q) => q.required).length;
  const answeredRequired = screeningQuestions.filter((q, i) => q.required && getAnswer(i).trim().length > 0).length;

  const hasScreeningQuestions = screeningQuestions && screeningQuestions.length > 0;

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={[styles.stepNumBadge, { backgroundColor: c.primary }]}>
          <Text style={[type.caption, { color: c.textInverse, fontWeight: '800', fontSize: 13 }]}>3</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.bodyMd, { color: c.text, fontWeight: '700' }]}>Milestones & Questions</Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 1 }]}>
            Optional milestones and required screening questions
          </Text>
        </View>
      </View>

      {/* Milestones Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>PAYMENT MILESTONES</Text>
          <Switch
            value={milestonesEnabled}
            onValueChange={handleMilestonesToggle}
            trackColor={{ false: c.border, true: withAlpha(c.primary, 0.40) }}
            thumbColor={milestonesEnabled ? c.primary : c.textMuted}
          />
        </View>
        <Text style={[styles.sectionHint, { color: c.textMuted }]}>
          Break your project into deliverable stages with payment amounts
        </Text>

        {milestonesEnabled && (
          <View style={styles.milestonesContainer}>
            {milestones.map((milestone, index) => (
              <View key={index} style={[styles.milestoneCard, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.circleNum, { backgroundColor: c.primary }]}>
                    <Text style={[type.caption, { color: c.textInverse, fontWeight: '800', fontSize: 11 }]}>{index + 1}</Text>
                  </View>
                  <Text style={[type.bodySm, { color: c.textSecondary, fontWeight: '600', flex: 1 }]}>
                    Milestone {index + 1}
                    {milestone.amount > 0 && proposedAmount > 0 && (
                      <Text style={[type.caption, { color: c.textMuted }]}> ({pctOf(milestone.amount)} of total)</Text>
                    )}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveMilestone(index)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle-outline" size={20} color={c.danger} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  value={milestone.title}
                  onChangeText={v => handleUpdateMilestone(index, { title: v })}
                  placeholder="Milestone title *"
                  placeholderTextColor={c.inputPlaceholder}
                  style={[styles.input, inputBase]}
                />

                <TextInput
                  value={milestone.description ?? ''}
                  onChangeText={v => handleUpdateMilestone(index, { description: v })}
                  placeholder="Description (optional)"
                  placeholderTextColor={c.inputPlaceholder}
                  multiline numberOfLines={2}
                  textAlignVertical="top"
                  style={[styles.input, styles.descInput, inputBase]}
                />

                <View style={styles.twoCol}>
                  <TextInput
                    value={milestone.amount > 0 ? String(milestone.amount) : ''}
                    onChangeText={v => handleUpdateMilestone(index, { amount: parseFloat(v) || 0 })}
                    placeholder={`Amount (${currency})`}
                    placeholderTextColor={c.inputPlaceholder}
                    keyboardType="numeric"
                    style={[styles.input, styles.flex1, inputBase]}
                  />
                  <View style={[styles.twoCol, styles.flex1]}>
                    <TextInput
                      value={milestone.duration > 0 ? String(milestone.duration) : ''}
                      onChangeText={v => handleUpdateMilestone(index, { duration: parseInt(v) || 1 })}
                      placeholder="Dur."
                      placeholderTextColor={c.inputPlaceholder}
                      keyboardType="numeric"
                      style={[styles.input, styles.durationInput, inputBase]}
                    />
                    <View style={styles.unitPills}>
                      {DURATION_UNITS.map(u => {
                        const active = milestone.durationUnit === u;
                        return (
                          <TouchableOpacity
                            key={u}
                            onPress={() => handleUpdateMilestone(index, { durationUnit: u })}
                            style={[styles.unitPill, {
                              backgroundColor: active ? c.primary : c.inputBg,
                              borderColor: active ? c.primary : c.border,
                            }]}
                          >
                            <Text style={[type.caption, { color: active ? c.textInverse : c.textMuted, fontWeight: '700' }]}>
                              {u[0].toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity onPress={handleAddMilestone} style={[styles.addBtn, { borderColor: c.primary }]}>
              <Ionicons name="add-circle-outline" size={18} color={c.primary} style={{ marginRight: 6 }} />
              <Text style={[type.bodySm, { color: c.primary, fontWeight: '700' }]}>Add Milestone</Text>
            </TouchableOpacity>

            {milestones.length > 0 && (
              <View style={[styles.totalBar, { backgroundColor: withAlpha(matchColor, 0.08), borderColor: withAlpha(matchColor, 0.40) }]}>
                <Ionicons name={isMatch ? 'checkmark-circle-outline' : 'warning-outline'} size={16} color={matchColor} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={[type.caption, { color: matchColor, fontWeight: '600' }]}>
                    Milestone total: {currency} {milestoneTotal.toLocaleString()}
                  </Text>
                  <Text style={[type.caption, { color: matchColor, fontWeight: '600', marginTop: 2 }]}>
                    Your bid: {currency} {proposedAmount.toLocaleString()} {!isMatch && '· Must match within 5%'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {!milestonesEnabled && (
          <View style={[styles.disabledHint, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
            <Ionicons name="information-circle-outline" size={16} color={c.textMuted} />
            <Text style={[type.bodySm, { color: c.textMuted, lineHeight: 20, flex: 1, marginLeft: 8 }]}>
              Adding milestones helps clients feel confident by showing a clear payment schedule linked to deliverables.
            </Text>
          </View>
        )}
      </View>

      {/* Screening Questions Section */}
      {hasScreeningQuestions && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>SCREENING QUESTIONS</Text>
            {requiredCount > 0 && (
              <View style={[styles.progressPill, { backgroundColor: answeredRequired === requiredCount ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)' }]}>
                <Text style={[styles.progressPillText, { color: answeredRequired === requiredCount ? '#059669' : '#D97706' }]}>
                  {answeredRequired}/{requiredCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.sectionHint, { color: c.textMuted }]}>
            Answer these questions to help the client evaluate your proposal
          </Text>

          <View style={styles.questionsContainer}>
            {screeningQuestions.map((question, index) => {
              const currentAnswer = getAnswer(index);
              const count = charCounts[index] ?? currentAnswer.length;
              const isOver = count > MAX_ANSWER_LENGTH;
              const isMissing = isMissingRequired(index);
              const isAnswered = currentAnswer.trim().length > 0;

              return (
                <View key={index} style={[styles.questionCard, { backgroundColor: c.surface ?? c.bgCard, borderColor: isMissing ? c.danger : c.border }]}>
                  <View style={styles.questionLabelRow}>
                    <View style={[styles.qNumBadge, { backgroundColor: withAlpha(c.primary, 0.13) }]}>
                      <Text style={[type.caption, { color: c.primary, fontWeight: '700' }]}>Q{index + 1}</Text>
                    </View>
                    <Text style={[type.bodySm, { color: c.textSecondary, fontWeight: '600', flex: 1, lineHeight: 18 }]} numberOfLines={4}>
                      {question.question}
                      {question.required && <Text style={{ color: c.danger }}> *</Text>}
                    </Text>
                  </View>

                  <TextInput
                    value={currentAnswer}
                    onChangeText={(v) => handleAnswerChange(index, v)}
                    placeholder={question.required ? 'Required — please provide a detailed answer…' : 'Your answer (optional)…'}
                    placeholderTextColor={c.inputPlaceholder}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={MAX_ANSWER_LENGTH + 10}
                    style={[styles.answerInput, { color: c.text, backgroundColor: c.inputBg, borderColor: isMissing ? c.danger : isAnswered ? c.success : c.border }]}
                  />

                  <View style={styles.answerFooter}>
                    {isMissing && <Text style={[styles.errorText, { color: c.danger }]}>Required question</Text>}
                    <Text style={[styles.charCount, { color: isOver ? c.danger : c.textMuted }]}>
                      {count}/{MAX_ANSWER_LENGTH}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {showValidation && answeredRequired < requiredCount && (
            <View style={[styles.validationError, { backgroundColor: withAlpha(c.danger, 0.08), borderColor: c.danger }]}>
              <Text style={[styles.validationErrorText, { color: c.danger }]}>⚠ Please answer all required questions before submitting.</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const makeStyles = (c: any, radius: any, spacing: any) =>
  StyleSheet.create({
    container: { gap: 20, flex: 1 },
    stepHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
    stepNumBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    section: { gap: 12, marginBottom: 16 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    sectionHint: { fontSize: 12, lineHeight: 18, marginTop: -4 },
    milestonesContainer: { gap: 12 },
    milestoneCard: { borderRadius: radius.lg, borderWidth: 1, padding: 14, gap: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    circleNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    input: { height: 44, borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: 12, fontSize: 14 },
    descInput: { height: 72, paddingTop: 10 },
    twoCol: { flexDirection: 'row', gap: 8 },
    flex1: { flex: 1 },
    durationInput: { width: 64, flex: undefined },
    unitPills: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    unitPill: { width: 30, height: 30, borderRadius: radius.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: 14, minHeight: 52 },
    totalBar: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: radius.md, padding: 12 },
    disabledHint: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: radius.md, padding: 14 },
    questionsContainer: { gap: 12 },
    questionCard: { borderRadius: radius.md, borderWidth: 1, padding: 14, gap: 8 },
    questionLabelRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    qNumBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, flexShrink: 0, marginTop: 1 },
    answerInput: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, fontSize: 14, lineHeight: 20, minHeight: 100 },
    answerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    errorText: { fontSize: 12, fontWeight: '500' },
    charCount: { fontSize: 11, fontVariant: ['tabular-nums'] },
    progressPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    progressPillText: { fontSize: 12, fontWeight: '700' },
    validationError: { borderWidth: 1, borderRadius: 10, padding: 12 },
    validationErrorText: { fontSize: 13, fontWeight: '500' },
  });

export default Step3_MilestonesScreening;