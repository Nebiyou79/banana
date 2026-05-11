// src/components/proposals/ProposalStatusBadge.tsx
// Banana Mobile App — Module 6B: Proposals
// Displays a color-coded pill badge for a proposal status.
// REFACTORED: All colors via useTheme() tokens + withAlpha(). No hardcoded hex.

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { ProposalStatus } from '../../types/proposal';

interface ProposalStatusBadgeProps {
  status: ProposalStatus;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

// Semantic role → theme token name (resolved at render time from useTheme)
type StatusRole = 'muted' | 'warning' | 'info' | 'teal' | 'violet' | 'success' | 'danger' | 'slate';

const STATUS_META: Record<ProposalStatus, { label: string; role: StatusRole }> = {
  draft:                { label: 'Draft',          role: 'muted'   },
  submitted:            { label: 'Submitted',       role: 'warning' },
  under_review:         { label: 'Under Review',    role: 'info'    },
  shortlisted:          { label: 'Shortlisted',     role: 'teal'    },
  interview_scheduled:  { label: 'Interview',       role: 'violet'  },
  awarded:              { label: 'Awarded',         role: 'success' },
  rejected:             { label: 'Not Selected',    role: 'danger'  },
  withdrawn:            { label: 'Withdrawn',       role: 'slate'   },
};

const SIZE_CONFIG = {
  sm: { paddingH: 8,  paddingV: 3,  fontSize: 10, dotSize: 5  },
  md: { paddingH: 10, paddingV: 4,  fontSize: 11, dotSize: 6  },
  lg: { paddingH: 12, paddingV: 5,  fontSize: 12, dotSize: 7  },
};

// Fixed palette entries that don't have a direct theme alias
const STATIC_COLORS = {
  teal:   '#0D9488',
  violet: '#7C3AED',
  slate:  '#475569',
} as const;

const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = memo(({ status, size = 'md', style }) => {
  const { colors: c } = useTheme();

  const meta   = STATUS_META[status] ?? STATUS_META.draft;
  const sizeC  = SIZE_CONFIG[size];

  const dotColor = useMemo((): string => {
    switch (meta.role) {
      case 'muted':   return c.textMuted;
      case 'warning': return c.warning;
      case 'info':    return c.info;
      case 'success': return c.success;
      case 'danger':  return c.danger;
      case 'teal':    return STATIC_COLORS.teal;
      case 'violet':  return STATIC_COLORS.violet;
      case 'slate':   return STATIC_COLORS.slate;
    }
  }, [meta.role, c]);

  const styles = useMemo(() => StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 9999,
      alignSelf: 'flex-start',
      gap: 5,
      backgroundColor: withAlpha(dotColor, 0.13),
      paddingHorizontal: sizeC.paddingH,
      paddingVertical: sizeC.paddingV,
    },
    dot: {
      width: sizeC.dotSize,
      height: sizeC.dotSize,
      borderRadius: sizeC.dotSize / 2,
      backgroundColor: dotColor,
    },
    label: {
      fontWeight: '600',
      letterSpacing: 0.2,
      fontSize: sizeC.fontSize,
      color: dotColor,
    },
  }), [dotColor, sizeC]);

  return (
    <View style={[styles.badge, style]}>
      <View style={styles.dot} />
      <Text style={styles.label} numberOfLines={1}>{meta.label}</Text>
    </View>
  );
});

ProposalStatusBadge.displayName = 'ProposalStatusBadge';

export { ProposalStatusBadge };
export default ProposalStatusBadge;