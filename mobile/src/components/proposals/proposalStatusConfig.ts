// src/components/proposals/proposalStatusConfig.ts
// Shared status icon/color config for SubmitProposalScreen & ProposalDetailScreen.
// No emoji — Ionicons only.

import { Ionicons } from '@expo/vector-icons';
import type { ProposalStatus } from '../../types/proposal';

export interface ProposalStatusConfig {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

export const PROPOSAL_STATUS_CONFIGS: Partial<Record<ProposalStatus, ProposalStatusConfig>> = {
  submitted: {
    icon: 'paper-plane-outline',
    text: 'Your proposal has been submitted and is awaiting review by the client.',
  },
  under_review: {
    icon: 'eye-outline',
    text: 'The client is actively reviewing your proposal — a great sign!',
  },
  shortlisted: {
    icon: 'star-outline',
    text: "You've been shortlisted! The client may reach out for an interview.",
  },
  interview_scheduled: {
    icon: 'calendar-outline',
    text: 'An interview has been scheduled. Check the details carefully.',
  },
  awarded: {
    icon: 'trophy-outline',
    text: "Congratulations! You've been awarded this project.",
  },
  rejected: {
    icon: 'close-circle-outline',
    text: 'This proposal was not selected. Keep applying — persistence pays off!',
  },
  withdrawn: {
    icon: 'arrow-undo-outline',
    text: 'You have withdrawn this proposal.',
  },
};

// Color resolver — accepts colors object from useTheme()
export function getProposalStatusColors(
  status: ProposalStatus,
  colors: {
    candidate: string; organization: string; success: string; danger: string;
    textMuted: string; infoBg: string; successBg: string; dangerBg: string;
  },
): { iconColor: string; bg: string } {
  switch (status) {
    case 'submitted':      return { iconColor: colors.candidate,    bg: colors.infoBg };
    case 'under_review':   return { iconColor: colors.organization, bg: colors.infoBg };
    case 'shortlisted':    return { iconColor: colors.success,      bg: colors.successBg };
    case 'interview_scheduled': return { iconColor: colors.organization, bg: colors.infoBg };
    case 'awarded':        return { iconColor: colors.success,      bg: colors.successBg };
    case 'rejected':       return { iconColor: colors.danger,       bg: colors.dangerBg };
    case 'withdrawn':      return { iconColor: colors.textMuted,    bg: colors.dangerBg };
    default:               return { iconColor: colors.textMuted,    bg: colors.infoBg };
  }
}