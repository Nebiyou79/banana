// src/components/proposals/ProposalScreeningAnswers.tsx
// Banana Mobile App — Module 6B: Proposals
// Renders Q&A pairs from proposal screeningAnswers (read-only view).
// REFACTORED: useTheme() + withAlpha(). No hardcoded hex. Ionicons replace emoji.

import React, { memo, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { ProposalScreeningAnswer } from '../../types/proposal';

interface ProposalScreeningAnswersProps {
  answers: ProposalScreeningAnswer[];
  style?: ViewStyle;
  maxVisible?: number;
}

const ProposalScreeningAnswers: React.FC<ProposalScreeningAnswersProps> = memo(({
  answers, style, maxVisible,
}) => {
  const { colors: c, radius, spacing, type } = useTheme();
  const [showAll, setShowAll] = useState(false);
  const styles = useMemo(() => makeStyles(c, radius, spacing), [c, radius, spacing]);

  if (!answers?.length) return null;

  const visible  = maxVisible && !showAll ? answers.slice(0, maxVisible) : answers;
  const hasMore  = !!(maxVisible && answers.length > maxVisible);
  const extraCnt = maxVisible ? answers.length - maxVisible : 0;

  return (
    <View style={[styles.container, style]}>
      {visible.map((answer, index) => (
        <View key={index} style={styles.item}>
          {/* Question */}
          <View style={styles.questionRow}>
            <View style={[styles.qBadge, { backgroundColor: withAlpha(c.primary, 0.13) }]}>
              <Text style={[type.caption, { color: c.primary, fontWeight: '700' }]}>
                Q{answer.questionIndex + 1}
              </Text>
            </View>
            <Text
              style={[type.bodySm, { color: c.textSecondary, fontWeight: '600', flex: 1, lineHeight: 18 }]}
              numberOfLines={3}
            >
              {answer.questionText ?? `Question ${answer.questionIndex + 1}`}
              {answer.isRequired && (
                <Text style={{ color: c.danger }}> *</Text>
              )}
            </Text>
          </View>

          {/* Answer */}
          {answer.answer?.trim() ? (
            <Text style={[type.bodySm, styles.answer, { color: c.text }]}>
              {answer.answer}
            </Text>
          ) : (
            <Text style={[type.caption, styles.answer, { color: c.textMuted, fontStyle: 'italic' }]}>
              No answer provided
            </Text>
          )}
        </View>
      ))}

      {hasMore && (
        <TouchableOpacity
          onPress={() => setShowAll(s => !s)}
          style={[styles.showMoreBtn, { borderColor: c.border }]}
          accessibilityRole="button"
        >
          <Ionicons
            name={showAll ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={14}
            color={c.primary}
            style={{ marginRight: 4 }}
          />
          <Text style={[type.bodySm, { color: c.primary, fontWeight: '600' }]}>
            {showAll
              ? 'Show less'
              : `Show ${extraCnt} more question${extraCnt !== 1 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

ProposalScreeningAnswers.displayName = 'ProposalScreeningAnswers';

const makeStyles = (c: any, radius: any, spacing: any) =>
  StyleSheet.create({
    container: { gap: 10 },
    item: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface ?? c.bgCard,
      padding: 14,
      gap: 8,
    },
    questionRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    qBadge: {
      paddingHorizontal: 7, paddingVertical: 2,
      borderRadius: 6, flexShrink: 0, marginTop: 1,
    },
    answer: { lineHeight: 20, paddingLeft: 30 },
    showMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderRadius: radius.md,
      paddingVertical: 10,
      minHeight: 44,
    },
  });

export { ProposalScreeningAnswers };
export default ProposalScreeningAnswers;