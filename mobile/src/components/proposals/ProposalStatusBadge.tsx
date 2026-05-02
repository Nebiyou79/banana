// src/components/proposals/ProposalStatusBadge.tsx
// Banana Mobile App — Module 6B: Proposals
// Displays a color-coded pill badge for a proposal status.

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { ProposalStatus } from '../../types/proposal';

interface ProposalStatusBadgeProps {
  status: ProposalStatus;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

const STATUS_CONFIG: Record<ProposalStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    bg: 'rgba(100,116,139,0.12)',
    text: '#64748B',
    dot: '#64748B',
  },
  submitted: {
    label: 'Submitted',
    bg: 'rgba(245,158,11,0.12)',
    text: '#D97706',
    dot: '#F59E0B',
  },
  under_review: {
    label: 'Under Review',
    bg: 'rgba(59,130,246,0.12)',
    text: '#2563EB',
    dot: '#3B82F6',
  },
  shortlisted: {
    label: 'Shortlisted',
    bg: 'rgba(20,184,166,0.12)',
    text: '#0D9488',
    dot: '#14B8A6',
  },
  interview_scheduled: {
    label: 'Interview',
    bg: 'rgba(139,92,246,0.12)',
    text: '#7C3AED',
    dot: '#8B5CF6',
  },
  awarded: {
    label: 'Awarded',
    bg: 'rgba(16,185,129,0.12)',
    text: '#059669',
    dot: '#10B981',
  },
  rejected: {
    label: 'Not Selected',
    bg: 'rgba(239,68,68,0.12)',
    text: '#DC2626',
    dot: '#EF4444',
  },
  withdrawn: {
    label: 'Withdrawn',
    bg: 'rgba(71,85,105,0.12)',
    text: '#475569',
    dot: '#64748B',
  },
};

const SIZE_CONFIG = {
  sm: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, dotSize: 5 },
  md: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, dotSize: 6 },
  lg: { paddingHorizontal: 12, paddingVertical: 5, fontSize: 12, dotSize: 7 },
};

export const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({
  status,
  size = 'md',
  style,
}) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const sizeConf = SIZE_CONFIG[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          paddingHorizontal: sizeConf.paddingHorizontal,
          paddingVertical: sizeConf.paddingVertical,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: config.dot,
            width: sizeConf.dotSize,
            height: sizeConf.dotSize,
            borderRadius: sizeConf.dotSize / 2,
          },
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: config.text, fontSize: sizeConf.fontSize },
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: {},
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default ProposalStatusBadge;
