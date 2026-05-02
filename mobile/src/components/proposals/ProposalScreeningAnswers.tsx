// src/components/proposals/ProposalScreeningAnswers.tsx
// Banana Mobile App — Module 6B: Proposals
// Renders Q&A pairs from proposal screeningAnswers (read-only view).

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { ProposalScreeningAnswer } from '../../types/proposal';

interface ProposalScreeningAnswersProps {
  answers: ProposalScreeningAnswer[];
  style?: ViewStyle;
  /** Show all answers or truncate to first N */
  maxVisible?: number;
}

export const ProposalScreeningAnswers: React.FC<ProposalScreeningAnswersProps> = ({
  answers,
  style,
  maxVisible,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const [showAll, setShowAll] = useState(false);

  if (!answers || answers.length === 0) {
    return null;
  }

  const visible =
    maxVisible && !showAll ? answers.slice(0, maxVisible) : answers;
  const hasMore = maxVisible && answers.length > maxVisible;

  return (
    <View style={[styles.container, style]}>
      {visible.map((answer, index) => (
        <View
          key={index}
          style={[
            styles.item,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Question */}
          <View style={styles.questionRow}>
            <View
              style={[
                styles.qBadge,
                { backgroundColor: 'rgba(241,187,3,0.15)' },
              ]}
            >
              <Text style={styles.qBadgeText}>Q{answer.questionIndex + 1}</Text>
            </View>
            <Text
              style={[styles.question, { color: colors.textSecondary }]}
              numberOfLines={3}
            >
              {answer.questionText ?? `Question ${answer.questionIndex + 1}`}
              {answer.isRequired && (
                <Text style={styles.required}> *</Text>
              )}
            </Text>
          </View>

          {/* Answer */}
          {answer.answer && answer.answer.trim().length > 0 ? (
            <Text style={[styles.answer, { color: colors.text }]}>
              {answer.answer}
            </Text>
          ) : (
            <Text style={[styles.noAnswer, { color: colors.textMuted }]}>
              No answer provided
            </Text>
          )}
        </View>
      ))}

      {hasMore && (
        <TouchableOpacity
          onPress={() => setShowAll(!showAll)}
          style={[
            styles.showMoreBtn,
            { borderColor: colors.border },
          ]}
        >
          <Text style={[styles.showMoreText, { color: '#F1BB03' }]}>
            {showAll
              ? 'Show less'
              : `Show ${answers.length - maxVisible!} more question${answers.length - maxVisible! !== 1 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  item: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  questionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  qBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
    marginTop: 1,
  },
  qBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  question: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  required: {
    color: '#EF4444',
  },
  answer: {
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: 30, // indent to align with question text
  },
  noAnswer: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingLeft: 30,
  },
  showMoreBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ProposalScreeningAnswers;
