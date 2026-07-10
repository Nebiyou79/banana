// src/components/bids/BidStatusBadge.tsx
// Color pill for every BidStatus value.
// UPDATED: Uses theme colors for better dark/light mode integration
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BidStatus } from '../../types/bid';

// ── Token map (uses theme-aware colors where possible) ────────────────────────

interface BadgeToken {
  label: string;
  bg: string;
  text: string;
  border: string;
}

// Theme-aware factory so colors adapt to dark/light mode
function buildTokens(isDark: boolean): Record<BidStatus, BadgeToken> {
  return {
    [BidStatus.Submitted]: {
      label: 'Submitted',
      bg: isDark ? '#422006' : '#FEF3C7',
      text: isDark ? '#FDE68A' : '#92400E',
      border: isDark ? '#78350F' : '#F59E0B',
    },
    [BidStatus.UnderReview]: {
      label: 'Under Review',
      bg: isDark ? '#1E3A5F' : '#DBEAFE',
      text: isDark ? '#93C5FD' : '#1E40AF',
      border: isDark ? '#1E40AF' : '#3B82F6',
    },
    [BidStatus.Shortlisted]: {
      label: 'Shortlisted',
      bg: isDark ? '#064E3B' : '#CCFBF1',
      text: isDark ? '#6EE7B7' : '#0F766E',
      border: isDark ? '#065F46' : '#14B8A6',
    },
    [BidStatus.InterviewScheduled]: {
      label: 'Interview Scheduled',
      bg: isDark ? '#3B0764' : '#F3E8FF',
      text: isDark ? '#C4B5FD' : '#6B21A8',
      border: isDark ? '#6B21A8' : '#A855F7',
    },
    [BidStatus.Awarded]: {
      label: 'Awarded',
      bg: isDark ? '#713F12' : '#FEF9C3',
      text: isDark ? '#FDE68A' : '#854D0E',
      border: isDark ? '#A16207' : '#F1BB03',
    },
    [BidStatus.Rejected]: {
      label: 'Rejected',
      bg: isDark ? '#450A0A' : '#FEE2E2',
      text: isDark ? '#FCA5A5' : '#991B1B',
      border: isDark ? '#991B1B' : '#EF4444',
    },
    [BidStatus.Withdrawn]: {
      label: 'Withdrawn',
      bg: isDark ? '#1F2937' : '#F3F4F6',
      text: isDark ? '#9CA3AF' : '#4B5563',
      border: isDark ? '#4B5563' : '#9CA3AF',
    },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  status: BidStatus;
  size?: 'sm' | 'md';
}

export const BidStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const { colors } = useTheme();
  const isDark = colors.bg === '#0C1A16' || colors.bg === '#0F172A'; // Detect dark mode
  const tokens = buildTokens(isDark);
  const token = tokens[status] ?? tokens[BidStatus.Submitted];
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
          {
            color: token.text,
            fontSize: isSm ? 10 : 12,
          },
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