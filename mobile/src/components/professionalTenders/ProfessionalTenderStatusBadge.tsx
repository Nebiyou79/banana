// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderStatusBadge.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Color reference (from spec § Badge Color Reference):
//    draft            → gray
//    published        → green
//    locked           → amber
//    deadline_reached → orange
//    revealed         → blue
//    closed           → red
//    cancelled        → dark gray
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { ProfessionalTenderStatus } from '../../types/professionalTender';

type Tone =
  | 'gray'
  | 'green'
  | 'amber'
  | 'orange'
  | 'blue'
  | 'red'
  | 'darkGray';

interface BadgeStyle {
  bg: string;
  fg: string;
  border: string;
}

/**
 * Picks a tone for each status. Centralized so other components (cards,
 * filter chips) can reuse the same mapping.
 */
export const getStatusTone = (status: ProfessionalTenderStatus): Tone => {
  switch (status) {
    case 'draft':            return 'gray';
    case 'published':        return 'green';
    case 'locked':           return 'amber';
    case 'deadline_reached': return 'orange';
    case 'revealed':         return 'blue';
    case 'closed':           return 'red';
    case 'cancelled':        return 'darkGray';
    default:                 return 'gray';
  }
};

/**
 * Resolves tone → concrete colors against the active theme.
 * Light theme uses tinted backgrounds; dark theme uses subtle muted bgs
 * to keep contrast readable against the dark surface.
 */
const resolveBadgeStyle = (tone: Tone, isDark: boolean): BadgeStyle => {
  if (isDark) {
    switch (tone) {
      case 'gray':     return { bg: 'rgba(148,163,184,0.15)', fg: '#CBD5E1', border: 'rgba(148,163,184,0.30)' };
      case 'green':    return { bg: 'rgba(34,197,94,0.15)',   fg: '#34D399', border: 'rgba(34,197,94,0.35)' };
      case 'amber':    return { bg: 'rgba(245,158,11,0.18)',  fg: '#FCD34D', border: 'rgba(245,158,11,0.40)' };
      case 'orange':   return { bg: 'rgba(249,115,22,0.18)',  fg: '#FDBA74', border: 'rgba(249,115,22,0.40)' };
      case 'blue':     return { bg: 'rgba(59,130,246,0.18)',  fg: '#60A5FA', border: 'rgba(59,130,246,0.40)' };
      case 'red':      return { bg: 'rgba(239,68,68,0.18)',   fg: '#F87171', border: 'rgba(239,68,68,0.40)' };
      case 'darkGray': return { bg: 'rgba(71,85,105,0.30)',   fg: '#94A3B8', border: 'rgba(71,85,105,0.50)' };
    }
  }
  switch (tone) {
    case 'gray':     return { bg: '#F1F5F9', fg: '#475569', border: '#E2E8F0' };
    case 'green':    return { bg: '#D1FAE5', fg: '#047857', border: '#A7F3D0' };
    case 'amber':    return { bg: '#FEF3C7', fg: '#B45309', border: '#FDE68A' };
    case 'orange':   return { bg: '#FFEDD5', fg: '#C2410C', border: '#FED7AA' };
    case 'blue':     return { bg: '#DBEAFE', fg: '#1D4ED8', border: '#BFDBFE' };
    case 'red':      return { bg: '#FEE2E2', fg: '#B91C1C', border: '#FECACA' };
    case 'darkGray': return { bg: '#E2E8F0', fg: '#1E293B', border: '#CBD5E1' };
  }
};

const STATUS_LABELS: Record<ProfessionalTenderStatus, string> = {
  draft:            'Draft',
  published:        'Live',
  locked:           'Locked',
  deadline_reached: 'Deadline Reached',
  revealed:         'Revealed',
  closed:           'Closed',
  cancelled:        'Cancelled',
};

export interface ProfessionalTenderStatusBadgeProps {
  status: ProfessionalTenderStatus;
  /** 'sm' fits inside list cards; 'md' for headers. Default 'sm'. */
  size?: 'sm' | 'md';
  /** Override the auto-generated label. Useful for compact contexts. */
  label?: string;
}

const ProfessionalTenderStatusBadge: React.FC<ProfessionalTenderStatusBadgeProps> = ({
  status,
  size = 'sm',
  label,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const tone = getStatusTone(status);
  const palette = resolveBadgeStyle(tone, !!isDark);
  const text = label ?? STATUS_LABELS[status];

  const sizing = size === 'md' ? styles.md : styles.sm;
  const textSizing = size === 'md' ? styles.textMd : styles.textSm;

  return (
    <View
      style={[
        styles.base,
        sizing,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Tender status: ${text}`}
    >
      <Text style={[styles.text, textSizing, { color: palette.fg }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
  },
  sm: { paddingHorizontal: 8, paddingVertical: 2 },
  md: { paddingHorizontal: 12, paddingVertical: 4 },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSm: { fontSize: 10, lineHeight: 14, textTransform: 'uppercase' },
  textMd: { fontSize: 12, lineHeight: 16 },
});

export default ProfessionalTenderStatusBadge;
