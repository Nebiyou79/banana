// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/_shared.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Shared primitives used across the read-only info components.
//
//  Why a shared file: SectionCard, InfoRow, and Chip are tiny but appear in
//  half a dozen components. Keeping them here prevents drift.
// ─────────────────────────────────────────────────────────────────────────────

import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION CARD
// ═════════════════════════════════════════════════════════════════════════════

export interface SectionCardProps {
  /** Ionicon name. */
  icon: string;
  title: string;
  /** Slot for action — e.g. an edit button on owner-only sections. */
  trailing?: ReactNode;
  /** When true, draws a subtle accent stripe along the left edge. */
  accent?: boolean;
  children: ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  icon,
  title,
  trailing,
  accent,
  children,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { bg: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', iconBg: '#0F172A', primary: '#60A5FA' }
    : { bg: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', iconBg: '#F1F5F9', primary: '#2563EB' };

  return (
    <View style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      {accent && <View style={[styles.cardAccent, { backgroundColor: palette.primary }]} />}
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: palette.iconBg }]}>
          <Ionicons name={icon as any} size={14} color={palette.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: palette.text }]}>{title}</Text>
        {trailing ? <View style={styles.cardTrailing}>{trailing}</View> : null}
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  INFO ROW — label + value pair
// ═════════════════════════════════════════════════════════════════════════════

export interface InfoRowProps {
  label: string;
  value?: string | number | null;
  /** When set, renders a children node instead of the value. */
  children?: ReactNode;
  /** Mark the value as muted/unavailable. */
  muted?: boolean;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, children, muted }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { label: '#94A3B8', value: '#F1F5F9', empty: '#64748B' }
    : { label: '#64748B', value: '#0F172A', empty: '#94A3B8' };

  const isEmpty = !children && (value === undefined || value === null || value === '');

  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: palette.label }]}>{label}</Text>
      <View style={styles.rowValueWrap}>
        {children ? (
          children
        ) : isEmpty ? (
          <Text style={[styles.rowValue, { color: palette.empty, fontStyle: 'italic' }]}>
            Not provided
          </Text>
        ) : (
          <Text
            style={[styles.rowValue, { color: muted ? palette.empty : palette.value }]}
          >
            {value}
          </Text>
        )}
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  CHIP — used for certifications, tags
// ═════════════════════════════════════════════════════════════════════════════

export const Chip: React.FC<{ label: string; tone?: 'neutral' | 'primary' | 'accent' }> = ({
  label,
  tone = 'neutral',
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? {
        neutral: { bg: '#0F172A', fg: '#F1F5F9', border: '#334155' },
        primary: { bg: '#1E3A5F', fg: '#93C5FD', border: '#3B82F6' },
        accent:  { bg: '#3B0764', fg: '#D8B4FE', border: '#A855F7' },
      }
    : {
        neutral: { bg: '#F1F5F9', fg: '#0F172A', border: '#E2E8F0' },
        primary: { bg: '#DBEAFE', fg: '#1D4ED8', border: '#BFDBFE' },
        accent:  { bg: '#EDE9FE', fg: '#6D28D9', border: '#DDD6FE' },
      };
  const p = palette[tone];
  return (
    <View style={[styles.chip, { backgroundColor: p.bg, borderColor: p.border }]}>
      <Text style={[styles.chipText, { color: p.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0, width: 3,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardIcon: {
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  cardTitle:    { fontSize: 14, fontWeight: '700', flex: 1 },
  cardTrailing: { marginLeft: 'auto' },
  cardBody:     { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },

  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 22 },
  rowLabel: {
    width: 130,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingTop: 2,
  },
  rowValueWrap: { flex: 1 },
  rowValue:     { fontSize: 13, lineHeight: 18 },

  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 220,
  },
  chipText: { fontSize: 11, fontWeight: '600' },
});