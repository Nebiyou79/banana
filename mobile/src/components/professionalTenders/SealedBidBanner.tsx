// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/SealedBidBanner.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Critical component — gates sealed-bid UI.  ⚠ Read carefully.
//
//  P-01: workflowType is 'open' | 'closed'.  Never 'sealed'.
//        For open workflow: this component returns null (no banner).
//        For closed workflow: renders one of four states based on:
//          status × isRevealed × isOwner
//
//  State machine (from spec § SealedBidBanner States):
//
//    closed + (published|locked) + !isRevealed
//       → PURPLE  "Bids are confidential until revealed"
//
//    closed + deadline_reached + !isRevealed + isOwner
//       → ORANGE  "Reveal Bids Now" — actionable for owner
//
//    closed + deadline_reached + !isRevealed + !isOwner
//       → NEUTRAL "Bid evaluation in progress" — read-only for bidder
//
//    closed + (revealed|closed)
//       → GREEN   "Bids have been revealed"
//
//    open
//       → null (hidden)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Lock,
} from 'lucide-react-native';

import { useThemeStore } from '../../store/themeStore';
import type {
  ProfessionalTenderStatus,
  ProfessionalTenderWorkflowType,
} from '../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  TYPES
// ═════════════════════════════════════════════════════════════════════════════

type BannerVariant = 'sealed' | 'awaitingReveal' | 'underEvaluation' | 'revealed';

interface BannerSpec {
  variant: BannerVariant;
  title: string;
  description: string;
  /** Whether this variant exposes a primary action button. */
  showAction: boolean;
  /** Label for the action button (when showAction is true). */
  actionLabel?: string;
}

interface VariantStyle {
  bg: string;
  border: string;
  fg: string;       // primary text color
  fgMuted: string;  // secondary description color
  iconBg: string;
  actionBg: string;
  actionFg: string;
}

export interface SealedBidBannerProps {
  workflowType: ProfessionalTenderWorkflowType;
  status: ProfessionalTenderStatus;
  /** True when the tender's sealed bids have been revealed by the owner. */
  isRevealed: boolean;
  /** ISO date string — drives the "deadline relative time" line. */
  deadline: string;
  /** Whether the current user is the tender owner. */
  isOwner: boolean;
  /** Wired up only for the awaitingReveal (owner) variant. */
  onReveal?: () => void;
  /** Disable the action button (e.g., while a reveal mutation is in flight). */
  isRevealing?: boolean;
  /** Optional override — render compact inside a card vs full-width. */
  compact?: boolean;
}

// ═════════════════════════════════════════════════════════════════════════════
//  STATE → VARIANT MAPPING  (single source — used by tests too)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Computes the banner variant from raw inputs.  Returns null when the
 * banner should not render at all (open workflow).
 */
export const computeSealedBannerVariant = (
  workflowType: ProfessionalTenderWorkflowType,
  status: ProfessionalTenderStatus,
  isRevealed: boolean,
  isOwner: boolean,
): BannerVariant | null => {
  // P-01: Open workflow never shows the sealed banner
  if (workflowType !== 'closed') return null;

  // After reveal (or after close), bids are visible — celebrate it
  if (isRevealed || status === 'revealed' || status === 'closed') {
    return 'revealed';
  }

  // Deadline reached — split owner vs bidder UX
  if (status === 'deadline_reached') {
    return isOwner ? 'awaitingReveal' : 'underEvaluation';
  }

  // published/locked + sealed + not yet revealed → confidential
  if (status === 'published' || status === 'locked') {
    return 'sealed';
  }

  // draft, cancelled — banner not meaningful
  return null;
};

// ═════════════════════════════════════════════════════════════════════════════
//  COPY — kept terse and authoritative; sealed bidding is a legal process
// ═════════════════════════════════════════════════════════════════════════════

const buildSpec = (variant: BannerVariant, isOwner: boolean): BannerSpec => {
  switch (variant) {
    case 'sealed':
      return {
        variant,
        title: 'Sealed Tender',
        description: isOwner
          ? 'Bids are confidential until you reveal them after the deadline.'
          : 'Bids are confidential until revealed by the tender owner after the deadline.',
        showAction: false,
      };
    case 'awaitingReveal':
      return {
        variant,
        title: 'Deadline reached — bids ready to reveal',
        description: 'You can now reveal sealed bids and begin evaluation.',
        showAction: true,
        actionLabel: 'Reveal Bids Now',
      };
    case 'underEvaluation':
      return {
        variant,
        title: 'Bid evaluation in progress',
        description: 'The deadline has passed. Sealed bids are awaiting reveal by the tender owner.',
        showAction: false,
      };
    case 'revealed':
      return {
        variant,
        title: 'Bids have been revealed',
        description: 'Sealed bids are now visible. Evaluation is in progress.',
        showAction: false,
      };
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLE RESOLUTION
// ═════════════════════════════════════════════════════════════════════════════

const resolveStyle = (variant: BannerVariant, isDark: boolean): VariantStyle => {
  if (isDark) {
    switch (variant) {
      case 'sealed': return {
        bg:       'rgba(168,85,247,0.12)',
        border:   'rgba(168,85,247,0.40)',
        fg:       '#E9D5FF',
        fgMuted:  '#C4B5FD',
        iconBg:   'rgba(168,85,247,0.25)',
        actionBg: '#7C3AED',
        actionFg: '#FFFFFF',
      };
      case 'awaitingReveal': return {
        bg:       'rgba(249,115,22,0.14)',
        border:   'rgba(249,115,22,0.45)',
        fg:       '#FED7AA',
        fgMuted:  '#FDBA74',
        iconBg:   'rgba(249,115,22,0.30)',
        actionBg: '#EA580C',
        actionFg: '#FFFFFF',
      };
      case 'underEvaluation': return {
        bg:       'rgba(148,163,184,0.14)',
        border:   'rgba(148,163,184,0.35)',
        fg:       '#E2E8F0',
        fgMuted:  '#CBD5E1',
        iconBg:   'rgba(148,163,184,0.25)',
        actionBg: '#475569',
        actionFg: '#FFFFFF',
      };
      case 'revealed': return {
        bg:       'rgba(34,197,94,0.14)',
        border:   'rgba(34,197,94,0.40)',
        fg:       '#BBF7D0',
        fgMuted:  '#86EFAC',
        iconBg:   'rgba(34,197,94,0.25)',
        actionBg: '#15803D',
        actionFg: '#FFFFFF',
      };
    }
  }
  switch (variant) {
    case 'sealed': return {
      bg:       '#F5F3FF',
      border:   '#DDD6FE',
      fg:       '#5B21B6',
      fgMuted:  '#7C3AED',
      iconBg:   '#EDE9FE',
      actionBg: '#7C3AED',
      actionFg: '#FFFFFF',
    };
    case 'awaitingReveal': return {
      bg:       '#FFF7ED',
      border:   '#FED7AA',
      fg:       '#9A3412',
      fgMuted:  '#C2410C',
      iconBg:   '#FFEDD5',
      actionBg: '#EA580C',
      actionFg: '#FFFFFF',
    };
    case 'underEvaluation': return {
      bg:       '#F8FAFC',
      border:   '#E2E8F0',
      fg:       '#1E293B',
      fgMuted:  '#475569',
      iconBg:   '#E2E8F0',
      actionBg: '#475569',
      actionFg: '#FFFFFF',
    };
    case 'revealed': return {
      bg:       '#F0FDF4',
      border:   '#BBF7D0',
      fg:       '#14532D',
      fgMuted:  '#15803D',
      iconBg:   '#DCFCE7',
      actionBg: '#15803D',
      actionFg: '#FFFFFF',
    };
  }
};

const VARIANT_ICON: Record<BannerVariant, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  sealed:           Lock,
  awaitingReveal:   AlertTriangle,
  underEvaluation:  Clock,
  revealed:         CheckCircle2,
};

// ═════════════════════════════════════════════════════════════════════════════
//  RELATIVE DEADLINE TEXT
// ═════════════════════════════════════════════════════════════════════════════

const formatDeadlineHint = (deadlineISO: string, variant: BannerVariant): string => {
  const deadline = new Date(deadlineISO);
  if (isNaN(deadline.getTime())) return '';
  const now = Date.now();
  const diffMs = deadline.getTime() - now;
  const absMs = Math.abs(diffMs);
  const days = Math.floor(absMs / 86_400_000);
  const hours = Math.floor((absMs % 86_400_000) / 3_600_000);

  // Pre-deadline: only meaningful for the 'sealed' variant
  if (diffMs > 0 && variant === 'sealed') {
    if (days > 0) return `Closes in ${days}d ${hours}h`;
    if (hours > 0) return `Closes in ${hours}h`;
    return 'Closing within the hour';
  }
  // Post-deadline: meaningful for awaitingReveal / underEvaluation
  if (diffMs <= 0 && (variant === 'awaitingReveal' || variant === 'underEvaluation')) {
    if (days > 0) return `Deadline passed ${days}d ago`;
    if (hours > 0) return `Deadline passed ${hours}h ago`;
    return 'Deadline just passed';
  }
  return '';
};

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const SealedBidBanner: React.FC<SealedBidBannerProps> = ({
  workflowType,
  status,
  isRevealed,
  deadline,
  isOwner,
  onReveal,
  isRevealing = false,
  compact = false,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);

  const variant = useMemo(
    () => computeSealedBannerVariant(workflowType, status, isRevealed, isOwner),
    [workflowType, status, isRevealed, isOwner],
  );

  // P-01: Open workflow returns null
  if (variant === null) return null;

  const spec = buildSpec(variant, isOwner);
  const palette = resolveStyle(variant, !!isDark);
  const Icon = VARIANT_ICON[variant];
  const deadlineHint = formatDeadlineHint(deadline, variant);

  return (
    <View
      style={[
        styles.banner,
        compact && styles.bannerCompact,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${spec.title}. ${spec.description}`}
    >
      {/* Icon column */}
      <View style={[styles.iconWrap, { backgroundColor: palette.iconBg }]}>
        <Icon size={compact ? 16 : 20} color={palette.fg} strokeWidth={2.4} />
      </View>

      {/* Text column */}
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: palette.fg }]} numberOfLines={2}>
          {spec.title}
        </Text>
        <Text style={[styles.description, { color: palette.fgMuted }]}>
          {spec.description}
        </Text>
        {!!deadlineHint && (
          <Text style={[styles.hint, { color: palette.fgMuted }]} numberOfLines={1}>
            {deadlineHint}
          </Text>
        )}

        {/* Action — only for awaitingReveal (owner) variant */}
        {spec.showAction && (
          <Pressable
            onPress={onReveal}
            disabled={!onReveal || isRevealing}
            accessibilityRole="button"
            accessibilityLabel={spec.actionLabel}
            style={({ pressed }: { pressed: boolean }) => [
              styles.actionBtn,
              {
                backgroundColor: palette.actionBg,
                opacity: !onReveal || isRevealing ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {isRevealing ? (
              <ActivityIndicator size="small" color={palette.actionFg} />
            ) : (
              <Eye size={15} color={palette.actionFg} strokeWidth={2.5} />
            )}
            <Text style={[styles.actionLabel, { color: palette.actionFg }]}>
              {isRevealing ? 'Revealing…' : spec.actionLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  bannerCompact: {
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  hint: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  actionBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    minHeight: 40,                   // mobile-first 40px+ touch target
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default SealedBidBanner;
