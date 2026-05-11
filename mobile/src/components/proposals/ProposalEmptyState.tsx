// src/components/proposals/ProposalEmptyState.tsx
// Banana Mobile App — Module 6B: Proposals
// Empty state displays for different scenarios in the proposals module.
// REFACTORED: useTheme() + withAlpha(). Ionicons replace emoji. No hardcoded hex.

import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

type EmptyVariant =
  | 'no_proposals'
  | 'no_results'
  | 'no_tender_proposals'
  | 'already_submitted'
  | 'tender_closed'
  | 'withdrawn';

interface ProposalEmptyStateProps {
  variant?: EmptyVariant;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

type IoniconName = keyof typeof Ionicons.glyphMap;

const VARIANT_CONFIG: Record<
  EmptyVariant,
  { icon: IoniconName; title: string; message: string }
> = {
  no_proposals: {
    icon: 'document-text-outline',
    title: 'No proposals yet',
    message: 'Browse open tenders and submit proposals to start building your portfolio.',
  },
  no_results: {
    icon: 'search-outline',
    title: 'No matching proposals',
    message: 'Try adjusting your filters or search terms.',
  },
  no_tender_proposals: {
    icon: 'mail-open-outline',
    title: 'No proposals received',
    message: 'Share your tender with freelancers to start receiving proposals.',
  },
  already_submitted: {
    icon: 'checkmark-circle-outline',
    title: 'Already submitted',
    message: 'You have already submitted a proposal for this tender. You can track it in My Proposals.',
  },
  tender_closed: {
    icon: 'lock-closed-outline',
    title: 'Tender is closed',
    message: 'The submission deadline for this tender has passed and is no longer accepting proposals.',
  },
  withdrawn: {
    icon: 'arrow-undo-outline',
    title: 'Proposal withdrawn',
    message: 'You have withdrawn your proposal for this tender.',
  },
};

const ProposalEmptyState: React.FC<ProposalEmptyStateProps> = memo(({
  variant = 'no_proposals', title, message, actionLabel, onAction, style,
}) => {
  const { colors: c, radius, spacing, type } = useTheme();
  const styles = useMemo(() => makeStyles(c, radius, spacing), [c, radius, spacing]);

  const config = VARIANT_CONFIG[variant];
  const displayTitle   = title   ?? config.title;
  const displayMessage = message ?? config.message;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={config.icon} size={36} color={c.primary} />
      </View>
      <Text style={[type.h3, styles.title, { color: c.text }]}>{displayTitle}</Text>
      <Text style={[type.body, styles.message, { color: c.textMuted }]}>{displayMessage}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          style={[styles.actionBtn, { backgroundColor: c.primary }]}
          accessibilityRole="button"
        >
          <Text style={[type.body, { color: c.textInverse, fontWeight: '700' }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

ProposalEmptyState.displayName = 'ProposalEmptyState';

const makeStyles = (c: any, radius: any, spacing: any) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: spacing.xxl,
      gap: 12,
    },
    iconWrap: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: withAlpha(c.primary, 0.10),
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 4,
    },
    title: { fontWeight: '700', textAlign: 'center' },
    message: { lineHeight: 22, textAlign: 'center' },
    actionBtn: {
      marginTop: 8,
      paddingHorizontal: 24, paddingVertical: 12,
      borderRadius: radius.md,
      minHeight: 44,
      alignItems: 'center', justifyContent: 'center',
    },
  });

export { ProposalEmptyState };
export default ProposalEmptyState;