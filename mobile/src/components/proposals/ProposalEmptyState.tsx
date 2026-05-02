// src/components/proposals/ProposalEmptyState.tsx
// Banana Mobile App — Module 6B: Proposals
// Empty state displays for different scenarios in the proposals module.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';

type EmptyVariant =
  | 'no_proposals'       // Freelancer: no proposals submitted yet
  | 'no_results'         // Filtered list has no results
  | 'no_tender_proposals' // Company: tender has received no proposals
  | 'already_submitted'  // Freelancer already submitted (cannot re-submit)
  | 'tender_closed'      // Tender deadline passed
  | 'withdrawn';         // Proposal was withdrawn

interface ProposalEmptyStateProps {
  variant?: EmptyVariant;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

const VARIANT_CONFIG: Record<
  EmptyVariant,
  { icon: string; title: string; message: string }
> = {
  no_proposals: {
    icon: '📋',
    title: 'No proposals yet',
    message:
      'Browse open tenders and submit proposals to start building your portfolio.',
  },
  no_results: {
    icon: '🔍',
    title: 'No matching proposals',
    message: 'Try adjusting your filters or search terms.',
  },
  no_tender_proposals: {
    icon: '📭',
    title: 'No proposals received',
    message:
      'Share your tender with freelancers to start receiving proposals.',
  },
  already_submitted: {
    icon: '✅',
    title: 'Already submitted',
    message:
      'You have already submitted a proposal for this tender. You can track it in My Proposals.',
  },
  tender_closed: {
    icon: '🔒',
    title: 'Tender is closed',
    message:
      'The submission deadline for this tender has passed and is no longer accepting proposals.',
  },
  withdrawn: {
    icon: '↩️',
    title: 'Proposal withdrawn',
    message:
      'You have withdrawn your proposal for this tender.',
  },
};

export const ProposalEmptyState: React.FC<ProposalEmptyStateProps> = ({
  variant = 'no_proposals',
  title,
  message,
  actionLabel,
  onAction,
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;

  const config = VARIANT_CONFIG[variant];
  const displayTitle = title ?? config.title;
  const displayMessage = message ?? config.message;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: 'rgba(241,187,3,0.08)' },
        ]}
      >
        <Text style={styles.icon}>{config.icon}</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {displayTitle}
      </Text>

      <Text style={[styles.message, { color: colors.textMuted }]}>
        {displayMessage}
      </Text>

      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          style={styles.actionButton}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 8,
    backgroundColor: '#F1BB03',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionLabel: {
    color: '#0A2540',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ProposalEmptyState;
