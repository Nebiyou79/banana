// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/TenderHeader.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  FIXED (per TENDER_BID_SCREENS_UI_FIX.md §0.1, §0.2):
//   • useThemeStore → useTheme(); no local palette with hardcoded hex
//   • Accent stripe color derived from workflowType + variant via theme tokens
//   • Owner entity avatar shown below the badges row (profile architecture)
//   • Band background uses role-appropriate theme surface colors

import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import ProfessionalTenderStatusBadge from './ProfessionalTenderStatusBadge';
import ProfessionalTenderWorkflowBadge from './ProfessionalTenderWorkflowBadge';
import TenderOwnerAvatar, { resolveTenderOwnerAvatarUrl } from '../shared/TenderOwnerAvatar';
import type { ProfessionalTender } from '../../types/professionalTender';

// ─── Props ────────────────────────────────────────────────────────────────────

export type TenderHeaderVariant = 'owner' | 'browser';

export interface TenderHeaderProps {
  tender:       ProfessionalTender;
  variant:      TenderHeaderVariant;
  onBack?:      () => void;
  rightAction?: React.ReactNode;
  compact?:     boolean;
}

// ─── Band colors — derived from useTheme tokens ───────────────────────────────
//
// variant='owner'   → primary band (bgCard-elevated look with primary border)
// variant='browser' → workflow-typed band
//   open   → teal/success tint
//   sealed → organization/purple tint

interface BandPalette {
  bandBg:         string;
  bandText:       string;
  bandMuted:      string;
  accentStripe:   string;
  buttonBg:       string;
  buttonFg:       string;
  countdownBg:    string;
  countdownFg:    string;
  countdownUrgent:string;
}

const useBandPalette = (
  variant: TenderHeaderVariant,
  workflowType: 'open' | 'closed',
): BandPalette => {
  const { colors, isDark } = useTheme();

  return useMemo(() => {
    if (variant === 'owner') {
      // Owner: primary (gold-tinted) band
      const bandBg = isDark ? withAlpha(colors.primary, 0.18) + 'FF' : colors.bgCard;
      // For dark mode we want a rich navy; light is the card surface.
      // We can't use withAlpha for background on View directly as a string—
      // instead pick the closest opaque token:
      const bg = isDark ? '#1A1A2E' : colors.bgCard;
      return {
        bandBg:          bg,
        bandText:        colors.text,
        bandMuted:       colors.textMuted,
        accentStripe:    workflowType === 'closed' ? colors.organization ?? colors.secondary : colors.primary,
        buttonBg:        withAlpha(colors.primary, 0.12),
        buttonFg:        colors.primary,
        countdownBg:     withAlpha(colors.primary, 0.10),
        countdownFg:     colors.text,
        countdownUrgent: colors.danger,
      };
    }

    // Browser — teal for open, purple/organization for sealed
    if (workflowType === 'closed') {
      const bg = isDark ? '#1C0A2E' : withAlpha(colors.organization ?? colors.secondary, 0.92);
      return {
        bandBg:          isDark ? '#1C0A2E' : '#6B21A8',
        bandText:        '#FFFFFF',
        bandMuted:       'rgba(255,255,255,0.82)',
        accentStripe:    colors.organization ?? colors.secondary,
        buttonBg:        'rgba(255,255,255,0.18)',
        buttonFg:        '#FFFFFF',
        countdownBg:     'rgba(255,255,255,0.18)',
        countdownFg:     '#FFFFFF',
        countdownUrgent: '#FCA5A5',
      };
    }

    // Open workflow, browser
    return {
      bandBg:          isDark ? '#0F3F3A' : '#0F766E',
      bandText:        '#FFFFFF',
      bandMuted:       'rgba(255,255,255,0.82)',
      accentStripe:    colors.success,
      buttonBg:        'rgba(255,255,255,0.18)',
      buttonFg:        '#FFFFFF',
      countdownBg:     'rgba(255,255,255,0.18)',
      countdownFg:     '#FFFFFF',
      countdownUrgent: '#FCA5A5',
    };
  }, [variant, workflowType, colors, isDark]);
};

// ─── Countdown helper ─────────────────────────────────────────────────────────

const formatCountdown = (deadlineISO: string): { text: string; urgent: boolean } => {
  const d = new Date(deadlineISO);
  if (isNaN(d.getTime())) return { text: '—', urgent: false };
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return { text: 'Deadline passed', urgent: true };
  const days  = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days >= 1)  return { text: `${days}d ${hours}h left`, urgent: days < 2 };
  if (hours >= 1) return { text: `${hours}h left`, urgent: true };
  return { text: 'Closing within the hour', urgent: true };
};

// ─── Component ────────────────────────────────────────────────────────────────

const TenderHeader: React.FC<TenderHeaderProps> = ({
  tender,
  variant,
  onBack,
  rightAction,
  compact = false,
}) => {
  const palette  = useBandPalette(variant, tender.workflowType);
  const countdown = formatCountdown(tender.deadline);

  // Owner entity for avatar display
  const ownerEntity = typeof tender.ownerEntity === 'object' ? tender.ownerEntity as any : null;
  const ownerAvatarUrl = resolveTenderOwnerAvatarUrl(ownerEntity);
  const ownerName      = ownerEntity?.name as string | undefined;
  const ownerRole      = tender.ownerRole ?? 'company';

  return (
    <View style={[styles.root, { backgroundColor: palette.bandBg }]}>
      {/* Accent stripe on right edge */}
      <View style={[styles.stripe, { backgroundColor: palette.accentStripe }]} />

      {/* Top row — back + variant tag + right action */}
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

      {/* Badges + optional owner avatar row */}
      <View style={styles.badgesRow}>
        <ProfessionalTenderStatusBadge   status={tender.status}           size="sm" />
        <ProfessionalTenderWorkflowBadge workflowType={tender.workflowType} size="sm" />

        {/* Owner avatar — only in browser variant (so bidders can see who posted) */}
        {variant === 'browser' && (ownerAvatarUrl || ownerName) && (
          <View style={styles.ownerRow}>
            <TenderOwnerAvatar
              name={ownerName}
              avatarUrl={ownerAvatarUrl}
              role={ownerRole}
              size={22}
              showBadge={false}
            />
            {!!ownerName && (
              <Text style={[styles.ownerName, { color: palette.bandMuted }]} numberOfLines={1}>
                {ownerName}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: palette.bandText }]} numberOfLines={3}>
        {tender.title}
      </Text>

      {/* Reference */}
      {!!tender.referenceNumber && (
        <Text style={[styles.refNum, { color: palette.bandMuted }]} numberOfLines={1}>
          {tender.referenceNumber}
        </Text>
      )}

      {/* Brief — hidden in compact mode */}
      {!compact && !!tender.briefDescription && (
        <Text style={[styles.brief, { color: palette.bandMuted }]} numberOfLines={2}>
          {tender.briefDescription}
        </Text>
      )}

      {/* Footer — countdown + category */}
      <View style={styles.footerRow}>
        <View
          style={[
            styles.countdownPill,
            { backgroundColor: palette.countdownBg },
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
          <View style={styles.categoryPill}>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 14,
    paddingTop:        10,
    paddingBottom:     14,
    gap:               10,
    overflow:          'hidden',
  },
  stripe: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0,
    width: 4,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            8,
    minHeight:      36,
  },
  iconBtn: {
    width:          36,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  variantTag: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:   999,
  },
  variantTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  rightActionWrap:{ minWidth: 36, alignItems: 'flex-end' },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 },

  ownerRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 4 },
  ownerName: { fontSize: 11, fontWeight: '600', maxWidth: 160 },

  title:  { fontSize: 22, fontWeight: '800', lineHeight: 28, letterSpacing: -0.3 },
  refNum: { fontSize: 11, marginTop: -4, fontVariant: ['tabular-nums'] },
  brief:  { fontSize: 13, lineHeight: 18 },

  footerRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    alignItems:    'center',
    gap:           8,
    marginTop:     4,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:   999,
  },
  countdownText: { fontSize: 11, fontWeight: '700' },
  categoryPill:  {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    paddingHorizontal: 8,
    paddingVertical:    3,
    borderRadius:   999,
    maxWidth:       200,
  },
  categoryText: { fontSize: 11, fontWeight: '600' },
});

export default TenderHeader;