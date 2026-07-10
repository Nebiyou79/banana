// src/components/bids/BidEvaluationPanel.tsx
// 3-step evaluation workflow: Preliminary → Technical → Financial
// Owner-only. Uses useSubmitEvaluationScore hook.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useSubmitEvaluationScore } from '../../hooks/useBid';
import { BidEvaluation } from '../../types/bid';

// ─── Types ──────────────────────────────────────────────────────────────────

type StepState = 'pending' | 'active' | 'pass' | 'fail';

interface Props {
  bid: any;
  tenderId: string;
  isOwner: boolean;
  label?: string;
}

const TECH_WEIGHT = 0.7;
const FIN_WEIGHT = 0.3;
const DEFAULT_PASS_MARK = 70;

// ─── Step Bubble Component ──────────────────────────────────────────────────

const StepBubble: React.FC<{ index: number; label: string; state: StepState; colors: any }> = ({
  index,
  label,
  state,
  colors,
}) => {
  const config = {
    pending: { bg: colors.surface, text: colors.textMuted, icon: index + 1 },
    active: { bg: colors.primary, text: colors.textInverse, icon: index + 1 },
    pass: { bg: colors.success, text: '#FFFFFF', icon: '✓' },
    fail: { bg: colors.danger, text: '#FFFFFF', icon: '✗' },
  }[state];

  return (
    <View style={bubbleStyles.wrap}>
      <View
        style={[
          bubbleStyles.circle,
          {
            backgroundColor: config.bg,
            borderWidth: state === 'active' ? 3 : 0,
            borderColor: colors.primaryBg,
          },
        ]}
      >
        <Text style={[bubbleStyles.text, { color: config.text }]}>{config.icon}</Text>
      </View>
      <Text
        style={[
          bubbleStyles.label,
          {
            color:
              state === 'active'
                ? colors.primary
                : state === 'pass'
                ? colors.success
                : state === 'fail'
                ? colors.danger
                : colors.textMuted,
            fontWeight: state === 'active' ? '700' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

export const BidEvaluationPanel: React.FC<Props> = ({
  bid,
  tenderId,
  isOwner,
  label = 'Bid Evaluation',
}) => {
  const { colors, spacing } = useTheme();
  const evaluation: BidEvaluation = bid.evaluation ?? {};
  const { mutate: submitEval, isPending } = useSubmitEvaluationScore();

  // Local state
  const [prelimNotes, setPrelimNotes] = useState(evaluation.preliminaryNotes ?? '');
  const [techScore, setTechScore] = useState(evaluation.technicalScore ?? 0);
  const [techNotes, setTechNotes] = useState(evaluation.technicalNotes ?? '');
  const [finScore, setFinScore] = useState(evaluation.financialScore ?? 0);
  const [finNotes, setFinNotes] = useState(evaluation.financialNotes ?? '');

  if (!isOwner) return null;

  const passMark = evaluation.technicalPassMark ?? DEFAULT_PASS_MARK;

  // Derive step states
  const preliminary: StepState =
    evaluation.preliminaryPassed === true
      ? 'pass'
      : evaluation.preliminaryPassed === false
      ? 'fail'
      : 'active';

  const technical: StepState =
    evaluation.preliminaryPassed !== true
      ? 'pending'
      : evaluation.passedTechnical === true
      ? 'pass'
      : evaluation.passedTechnical === false
      ? 'fail'
      : 'active';

  const financial: StepState =
    evaluation.passedTechnical !== true
      ? 'pending'
      : evaluation.financialScore != null
      ? 'pass'
      : 'active';

  const isComplete =
    evaluation.preliminaryPassed != null &&
    evaluation.technicalScore != null &&
    evaluation.financialScore != null;

  const combinedScore =
    (evaluation.technicalScore ?? techScore) * TECH_WEIGHT + finScore * FIN_WEIGHT;

  // Handlers
  const handlePrelimSubmit = (passed: boolean) => {
    submitEval({
      tenderId,
      bidId: bid._id,
      step: 'preliminary',
      preliminaryPassed: passed,
      preliminaryNotes: prelimNotes,
    });
  };

  const handleTechSubmit = () => {
    submitEval({
      tenderId,
      bidId: bid._id,
      step: 'technical',
      technicalScore: techScore,
      technicalNotes: techNotes,
    });
  };

  const handleFinSubmit = () => {
    submitEval({
      tenderId,
      bidId: bid._id,
      step: 'financial',
      financialScore: finScore,
      financialNotes: finNotes,
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[styles.panelHeader, { backgroundColor: colors.surface }]}>
        <Ionicons name="analytics-outline" size={18} color={colors.primary} />
        <Text style={[styles.panelTitle, { color: colors.text }]}>📊 {label}</Text>
      </View>

      {/* Step indicators */}
      <View style={[styles.stepBar, { borderBottomColor: colors.border }]}>
        <StepBubble index={0} label="Preliminary" state={preliminary} colors={colors} />
        <View style={[styles.connector, { backgroundColor: preliminary === 'pass' ? colors.success : colors.border }]} />
        <StepBubble index={1} label="Technical" state={technical} colors={colors} />
        <View style={[styles.connector, { backgroundColor: technical === 'pass' ? colors.success : colors.border }]} />
        <StepBubble index={2} label="Financial" state={financial} colors={colors} />
      </View>

      <View style={styles.body}>
        {/* Completed summary */}
        {isComplete ? (
          <View style={{ gap: spacing.md }}>
            <View style={[styles.completeBanner, { backgroundColor: colors.successBg }]}>
              <Ionicons name="trophy" size={24} color={colors.success} />
              <Text style={[styles.completeText, { color: colors.success }]}>
                Evaluation Complete
              </Text>
              {evaluation.overallRank != null && (
                <Text style={[styles.rankText, { color: colors.success }]}>
                  Rank #{evaluation.overallRank}
                </Text>
              )}
            </View>
            <View style={styles.scoreGrid}>
              <View style={[styles.scoreBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>Preliminary</Text>
                <Text style={[styles.scoreValue, { color: evaluation.preliminaryPassed ? colors.success : colors.danger }]}>
                  {evaluation.preliminaryPassed ? 'Pass ✓' : 'Fail ✗'}
                </Text>
              </View>
              <View style={[styles.scoreBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>Technical</Text>
                <Text style={[styles.scoreValue, { color: colors.primary }]}>
                  {evaluation.technicalScore ?? '—'}/100
                </Text>
              </View>
              <View style={[styles.scoreBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>Financial</Text>
                <Text style={[styles.scoreValue, { color: colors.primary }]}>
                  {evaluation.financialScore ?? '—'}/100
                </Text>
              </View>
            </View>
            {evaluation.combinedScore != null && (
              <View style={[styles.combinedRow, { backgroundColor: colors.primaryBg }]}>
                <Text style={[styles.combinedLabel, { color: colors.textMuted }]}>
                  Combined Score ({evaluation.technicalScore}×70% + {evaluation.financialScore}×30%)
                </Text>
                <Text style={[styles.combinedValue, { color: colors.primary }]}>
                  {evaluation.combinedScore.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Step 1: Preliminary */}
            <View style={[styles.stepSection, { opacity: preliminary === 'active' ? 1 : 0.5 }]}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Step 1 — Preliminary Check</Text>
              {evaluation.preliminaryPassed == null ? (
                <>
                  <TextInput
                    value={prelimNotes}
                    onChangeText={setPrelimNotes}
                    placeholder="Optional notes about preliminary compliance…"
                    placeholderTextColor={colors.inputPlaceholder}
                    multiline
                    style={[styles.notesInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  />
                  <View style={styles.passFailRow}>
                    <Pressable
                      onPress={() => handlePrelimSubmit(true)}
                      disabled={isPending}
                      style={[styles.passBtn, { backgroundColor: colors.successBg }]}
                    >
                      <Text style={[styles.passText, { color: colors.success }]}>✓ Pass</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handlePrelimSubmit(false)}
                      disabled={isPending}
                      style={[styles.failBtn, { backgroundColor: colors.dangerBg }]}
                    >
                      <Text style={[styles.failText, { color: colors.danger }]}>✗ Fail</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={[styles.resultBox, { backgroundColor: evaluation.preliminaryPassed ? colors.successBg : colors.dangerBg }]}>
                  <Text style={{ color: evaluation.preliminaryPassed ? colors.success : colors.danger, fontWeight: '700' }}>
                    {evaluation.preliminaryPassed ? '✓ Passed' : '✗ Failed'}
                  </Text>
                  {evaluation.preliminaryNotes && (
                    <Text style={[styles.resultNotes, { color: colors.textMuted }]}>{evaluation.preliminaryNotes}</Text>
                  )}
                </View>
              )}
            </View>

            {/* Step 2: Technical */}
            <View style={[styles.stepSection, { opacity: technical === 'active' ? 1 : technical === 'pass' ? 0.8 : 0.4 }]}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Step 2 — Technical Evaluation</Text>
              {evaluation.passedTechnical == null && evaluation.preliminaryPassed === true ? (
                <>
                  <View style={styles.sliderRow}>
                    <TextInput
                      value={String(techScore)}
                      onChangeText={(t) => setTechScore(Math.min(100, Math.max(0, parseInt(t) || 0)))}
                      keyboardType="number-pad"
                      style={[styles.scoreInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                      placeholder="0-100"
                    />
                    <View style={[styles.passMarkBadge, { backgroundColor: techScore >= passMark ? colors.successBg : colors.dangerBg }]}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: techScore >= passMark ? colors.success : colors.danger }}>
                        {techScore >= passMark ? `≥${passMark} PASS` : `<${passMark} FAIL`}
                      </Text>
                    </View>
                  </View>
                  <TextInput
                    value={techNotes}
                    onChangeText={setTechNotes}
                    placeholder="Technical evaluation notes…"
                    placeholderTextColor={colors.inputPlaceholder}
                    multiline
                    style={[styles.notesInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  />
                  <Pressable
                    onPress={handleTechSubmit}
                    disabled={isPending}
                    style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.6 : 1 }]}
                  >
                    {isPending ? (
                      <ActivityIndicator size="small" color={colors.textInverse} />
                    ) : (
                      <Text style={[styles.saveBtnText, { color: colors.textInverse }]}>Save Technical Score</Text>
                    )}
                  </Pressable>
                </>
              ) : evaluation.technicalScore != null ? (
                <View style={[styles.resultBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.resultLabel, { color: colors.text }]}>
                    Score: {evaluation.technicalScore}/100
                  </Text>
                  <Text style={{ fontSize: 11, color: evaluation.passedTechnical ? colors.success : colors.danger }}>
                    {evaluation.passedTechnical ? 'Pass ✓' : 'Fail ✗'}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.lockedText, { color: colors.textMuted }]}>Locked — complete preliminary check first.</Text>
              )}
            </View>

            {/* Step 3: Financial */}
            <View style={[styles.stepSection, { opacity: financial === 'active' ? 1 : financial === 'pass' ? 0.8 : 0.4 }]}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Step 3 — Financial Evaluation</Text>
              {evaluation.financialScore == null && evaluation.passedTechnical === true ? (
                <>
                  <View style={styles.sliderRow}>
                    <TextInput
                      value={String(finScore)}
                      onChangeText={(t) => setFinScore(Math.min(100, Math.max(0, parseInt(t) || 0)))}
                      keyboardType="number-pad"
                      style={[styles.scoreInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                      placeholder="0-100"
                    />
                  </View>
                  <View style={[styles.combinedPreview, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.combinedPreviewLabel, { color: colors.textMuted }]}>
                      Combined Score Preview
                    </Text>
                    <Text style={[styles.combinedPreviewValue, { color: colors.primary }]}>
                      {evaluation.technicalScore ?? 0} × 70% + {finScore} × 30% = {combinedScore.toFixed(1)}
                    </Text>
                  </View>
                  <TextInput
                    value={finNotes}
                    onChangeText={setFinNotes}
                    placeholder="Financial evaluation notes…"
                    placeholderTextColor={colors.inputPlaceholder}
                    multiline
                    style={[styles.notesInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  />
                  <Pressable
                    onPress={handleFinSubmit}
                    disabled={isPending}
                    style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.6 : 1 }]}
                  >
                    {isPending ? (
                      <ActivityIndicator size="small" color={colors.textInverse} />
                    ) : (
                      <Text style={[styles.saveBtnText, { color: colors.textInverse }]}>Save Financial Score</Text>
                    )}
                  </Pressable>
                </>
              ) : evaluation.financialScore != null ? (
                <View style={[styles.resultBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.resultLabel, { color: colors.text }]}>
                    Financial: {evaluation.financialScore}/100
                  </Text>
                  <Text style={[styles.resultValue, { color: colors.primary }]}>
                    Combined: {evaluation.combinedScore?.toFixed(1) ?? '—'}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.lockedText, { color: colors.textMuted }]}>Locked — pass technical evaluation first.</Text>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0A2540',
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  connector: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  body: {
    padding: 16,
    gap: 16,
  },
  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  completeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scoreGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreBox: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  combinedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  combinedLabel: {
    flex: 1,
    fontSize: 11,
    marginRight: 8,
  },
  combinedValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  stepSection: {
    gap: 10,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.2)',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  passFailRow: {
    flexDirection: 'row',
    gap: 10,
  },
  passBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  passText: {
    fontSize: 14,
    fontWeight: '700',
  },
  failBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  failText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  passMarkBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultBox: {
    padding: 12,
    borderRadius: 10,
    gap: 4,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  resultNotes: {
    fontSize: 11,
  },
  lockedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  combinedPreview: {
    padding: 12,
    borderRadius: 10,
  },
  combinedPreviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  combinedPreviewValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});

const bubbleStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 9,
    textAlign: 'center',
  },
});

export default BidEvaluationPanel;