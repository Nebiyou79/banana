// src/components/bids/BidStatusBadge.tsx
// Color pill for every BidStatus value.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BidStatus } from '../../types/bid';

// ── Token map ─────────────────────────────────────────────────────────────────

interface BadgeToken {
  label: string;
  bg: string;
  text: string;
  border: string;
}

const TOKENS: Record<BidStatus, BadgeToken> = {
  [BidStatus.Submitted]: {
    label: 'Submitted',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#F59E0B',
  },
  [BidStatus.UnderReview]: {
    label: 'Under Review',
    bg: '#DBEAFE',
    text: '#1E40AF',
    border: '#3B82F6',
  },
  [BidStatus.Shortlisted]: {
    label: 'Shortlisted',
    bg: '#CCFBF1',
    text: '#0F766E',
    border: '#14B8A6',
  },
  [BidStatus.InterviewScheduled]: {
    label: 'Interview Scheduled',
    bg: '#F3E8FF',
    text: '#6B21A8',
    border: '#A855F7',
  },
  [BidStatus.Awarded]: {
    label: 'Awarded',
    bg: '#FEF9C3',
    text: '#854D0E',
    border: '#F1BB03',
  },
  [BidStatus.Rejected]: {
    label: 'Rejected',
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#EF4444',
  },
  [BidStatus.Withdrawn]: {
    label: 'Withdrawn',
    bg: '#F3F4F6',
    text: '#4B5563',
    border: '#9CA3AF',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  status: BidStatus;
  size?: 'sm' | 'md';
}

export const BidStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const token = TOKENS[status] ?? TOKENS[BidStatus.Submitted];
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: token.bg,
          borderColor: token.border,
          paddingHorizontal: isSm ? 7 : 10,
          paddingVertical: isSm ? 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: token.text, fontSize: isSm ? 10 : 12 },
        ]}
        numberOfLines={1}
      >
        {token.label}
      </Text>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default BidStatusBadge;
