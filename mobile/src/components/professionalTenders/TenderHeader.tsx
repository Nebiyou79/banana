// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/TenderHeader.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Distinct, branded header used on both owner and browser detail screens.
//
//  variant='owner'   — solid primary tone (blue), conveys "your tender,
//                      you're in control"
//  variant='browser' — accent tone derived from workflowType (teal for open,
//                      purple for sealed), conveys "this is someone else's
//                      tender, here's what it offers"
//
//  Always renders:
//   • back button (optional)
//   • action slot in the top-right (save bookmark, share, etc.)
//   • status + workflow badges as a row
//   • title (with optional reference number underneath)
//   • brief description (max 2 lines)
//   • deadline countdown chip
//
//  Sealed-bid integrity: nothing in the header reveals bid amounts or
//  bidder identities. The header is metadata-only.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../../store/themeStore';
import ProfessionalTenderStatusBadge from './ProfessionalTenderStatusBadge';
import ProfessionalTenderWorkflowBadge from './ProfessionalTenderWorkflowBadge';
import type { ProfessionalTender } from '../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  PROPS
// ═════════════════════════════════════════════════════════════════════════════

export type TenderHeaderVariant = 'owner' | 'browser';

export interface TenderHeaderProps {
  tender: ProfessionalTender;
  variant: TenderHeaderVariant;
  /** Show a back arrow at the top-left. */
  onBack?: () => void;
  /** Slot for top-right action — bookmark, share, etc. */
  rightAction?: React.ReactNode;
  /** When set, hide the brief description (saves vertical space). */
  compact?: boolean;
}

// ═════════════════════════════════════════════════════════════════════════════
//  COLOR RESOLUTION
//  The variant + workflowType combo determines the band's accent strip on
//  the right side of the header.
// ═════════════════════════════════════════════════════════════════════════════

interface HeaderPalette {
  bandBg: string;       // header background
  bandText: string;     // primary text on band
  bandMuted: string;    // secondary text on band
  bandBorder: string;
  accentStripe: string; // 4px strip on the right edge — variant-defining color
  buttonBg: string;
  buttonFg: string;
  countdownBg: string;
  countdownFg: string;
  countdownUrgent: string;
}

const resolvePalette = (
  variant: TenderHeaderVariant,
  workflowType: 'open' | 'closed',
  isDark: boolean,
): HeaderPalette => {
  // OWNER: blue band, accent strip matches workflow type so owner still
  // sees at-a-glance whether this is a sealed tender
  if (variant === 'owner') {
    if (isDark) {
      return {
        bandBg:          '#1E3A5F',
        bandText:        '#F8FAFC',
        bandMuted:       'rgba(248,250,252,0.75)',
        bandBorder:      'rgba(96,165,250,0.30)',
        accentStripe:    workflowType === 'closed' ? '#A855F7' : '#14B8A6',
        buttonBg:        'rgba(248,250,252,0.12)',
        buttonFg:        '#F8FAFC',
        countdownBg:     'rgba(248,250,252,0.15)',
        countdownFg:     '#F8FAFC',
        countdownUrgent: '#FCA5A5',
      };
    }
    return {
      bandBg:          '#1E40AF',
      bandText:        '#FFFFFF',
      bandMuted:       'rgba(255,255,255,0.85)',
      bandBorder:      'rgba(255,255,255,0.20)',
      accentStripe:    workflowType === 'closed' ? '#A855F7' : '#14B8A6',
      buttonBg:        'rgba(255,255,255,0.18)',
      buttonFg:        '#FFFFFF',
      countdownBg:     'rgba(255,255,255,0.20)',
      countdownFg:     '#FFFFFF',
      countdownUrgent: '#FECACA',
    };
  }

  // BROWSER: workflow-typed band itself is the variant signal
  // open  → teal (welcoming, transparent)
  // sealed → purple (legal weight, confidentiality)
  if (workflowType === 'closed') {
    if (isDark) {
      return {
        bandBg:          '#3B0764',
        bandText:        '#F5F3FF',
        bandMuted:       'rgba(245,243,255,0.75)',
        bandBorder:      'rgba(168,85,247,0.30)',
        accentStripe:    '#A855F7',
        buttonBg:        'rgba(245,243,255,0.14)',
        buttonFg:        '#F5F3FF',
        countdownBg:     'rgba(245,243,255,0.17)',
        countdownFg:     '#F5F3FF',
        countdownUrgent: '#FCA5A5',
      };
    }
    return {
      bandBg:          '#6B21A8',
      bandText:        '#FFFFFF',
      bandMuted:       'rgba(255,255,255,0.85)',
      bandBorder:      'rgba(255,255,255,0.20)',
      accentStripe:    '#A855F7',
      buttonBg:        'rgba(255,255,255,0.18)',
      buttonFg:        '#FFFFFF',
      countdownBg:     'rgba(255,255,255,0.20)',
      countdownFg:     '#FFFFFF',
      countdownUrgent: '#FEE2E2',
    };
  }

  // open workflow, browser variant — teal
  if (isDark) {
    return {
      bandBg:          '#0F3F3A',
      bandText:        '#F0FDFA',
      bandMuted:       'rgba(240,253,250,0.75)',
      bandBorder:      'rgba(20,184,166,0.30)',
      accentStripe:    '#14B8A6',
      buttonBg:        'rgba(240,253,250,0.14)',
      buttonFg:        '#F0FDFA',
      countdownBg:     'rgba(240,253,250,0.17)',
      countdownFg:     '#F0FDFA',
      countdownUrgent: '#FCA5A5',
    };
  }
  return {
    bandBg:          '#0F766E',
    bandText:        '#FFFFFF',
    bandMuted:       'rgba(255,255,255,0.85)',
    bandBorder:      'rgba(255,255,255,0.20)',
    accentStripe:    '#14B8A6',
    buttonBg:        'rgba(255,255,255,0.18)',
    buttonFg:        '#FFFFFF',
    countdownBg:     'rgba(255,255,255,0.20)',
    countdownFg:     '#FFFFFF',
    countdownUrgent: '#FEE2E2',
  };
};

// ═════════════════════════════════════════════════════════════════════════════
//  COUNTDOWN HELPER
// ═════════════════════════════════════════════════════════════════════════════

const formatCountdown = (deadlineISO: string): { text: string; urgent: boolean } => {
  const d = new Date(deadlineISO);
  if (isNaN(d.getTime())) return { text: '—', urgent: false };
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return { text: 'Deadline passed', urgent: true };
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days >= 1) return { text: `${days}d ${hours}h left`, urgent: days < 2 };
  if (hours >= 1) return { text: `${hours}h left`, urgent: true };
  return { text: 'Closing within the hour', urgent: true };
};

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const TenderHeader: React.FC<TenderHeaderProps> = ({
  tender,
  variant,
  onBack,
  rightAction,
  compact = false,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = useMemo(
    () => resolvePalette(variant, tender.workflowType, !!isDark),
    [variant, tender.workflowType, isDark],
  );

  const countdown = formatCountdown(tender.deadline);

  return (
    <View style={[styles.root, { backgroundColor: palette.bandBg }]}>
      {/* Right-edge variant accent stripe */}
      <View style={[styles.stripe, { backgroundColor: palette.accentStripe }]} />

      {/* Top row — back button + variant tag + right action */}
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={[styles.iconBtn, { backgroundColor: palette.buttonBg }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={palette.buttonFg} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}

        <View style={[styles.variantTag, { backgroundColor: palette.buttonBg }]}>
          <Ionicons
            name={variant === 'owner' ? 'person' : 'eye-outline'}
            size={11}
            color={palette.bandText}
          />
          <Text style={[styles.variantTagText, { color: palette.bandText }]}>
            {variant === 'owner' ? 'YOUR TENDER' : 'BROWSING'}
          </Text>
        </View>

        <View style={styles.rightActionWrap}>
          {rightAction ?? <View style={{ width: 36 }} />}
        </View>
      </View>

      {/* Badges row */}
      <View style={styles.badgesRow}>
        <ProfessionalTenderStatusBadge status={tender.status} size="sm" />
        <ProfessionalTenderWorkflowBadge workflowType={tender.workflowType} size="sm" />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: palette.bandText }]} numberOfLines={3}>
        {tender.title}
      </Text>

      {/* Reference number */}
      {!!tender.referenceNumber && (
        <Text
          style={[styles.refNum, { color: palette.bandMuted, fontFamily: 'monospace' }]}
          numberOfLines={1}
        >
          {tender.referenceNumber}
        </Text>
      )}

      {/* Brief — hidden in compact mode */}
      {!compact && !!tender.briefDescription && (
        <Text
          style={[styles.brief, { color: palette.bandMuted }]}
          numberOfLines={2}
        >
          {tender.briefDescription}
        </Text>
      )}

      {/* Footer row — countdown + category */}
      <View style={styles.footerRow}>
        <View
          style={[
            styles.countdownPill,
            {
              backgroundColor: palette.countdownBg,
              borderColor: palette.bandBorder,
            },
          ]}
        >
          <Ionicons
            name={countdown.urgent ? 'alert-circle' : 'time-outline'}
            size={12}
            color={countdown.urgent ? palette.countdownUrgent : palette.countdownFg}
          />
          <Text
            style={[
              styles.countdownText,
              { color: countdown.urgent ? palette.countdownUrgent : palette.countdownFg },
            ]}
            numberOfLines={1}
          >
            {countdown.text}
          </Text>
        </View>

        {!!tender.procurementCategory && (
          <View style={[styles.categoryPill, { borderColor: palette.bandBorder }]}>
            <Ionicons name="pricetag-outline" size={10} color={palette.bandMuted} />
            <Text
              style={[styles.categoryText, { color: palette.bandMuted }]}
              numberOfLines={1}
            >
              {tender.procurementCategory}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0,
    width: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 36,
  },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  variantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  variantTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  rightActionWrap: { minWidth: 36, alignItems: 'flex-end' },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },

  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  refNum: { fontSize: 11, marginTop: -4 },
  brief:  { fontSize: 13, lineHeight: 18 },

  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  countdownPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  countdownText: { fontSize: 11, fontWeight: '700' },

  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 200,
  },
  categoryText: { fontSize: 11, fontWeight: '600' },
});

export default TenderHeader;