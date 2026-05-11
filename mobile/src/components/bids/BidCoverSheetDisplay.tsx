// src/components/bids/BidCoverSheetDisplay.tsx
// Read-only key-value display of all BidCoverSheet fields.
// Grouped: Company Info | Contact | Identifiers | Bid Value | Declaration
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BidCoverSheet } from '../../types/bid';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FieldConfig {
  key: keyof BidCoverSheet;
  label: string;
  format?: (val: unknown) => string;
}

interface SectionConfig {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  fields: FieldConfig[];
}

// ── Section definitions ───────────────────────────────────────────────────────

const SECTIONS: SectionConfig[] = [
  {
    title: 'Company Info',
    icon: 'business-outline',
    fields: [
      { key: 'companyName',           label: 'Company Name' },
      { key: 'representative',        label: 'Representative' },
      { key: 'representativeTitle',   label: 'Title / Position' },
      { key: 'companyAddress',        label: 'Address' },
    ],
  },
  {
    title: 'Contact',
    icon: 'call-outline',
    fields: [
      { key: 'companyEmail', label: 'Email' },
      { key: 'companyPhone', label: 'Phone' },
    ],
  },
  {
    title: 'Identifiers',
    icon: 'card-outline',
    fields: [
      { key: 'tinNumber',      label: 'TIN Number' },
      { key: 'licenseNumber',  label: 'License Number' },
    ],
  },
  {
    title: 'Bid Value',
    icon: 'cash-outline',
    fields: [
      {
        key: 'totalBidValue',
        label: 'Total Bid Value',
        format: (v) =>
          typeof v === 'number'
            ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : String(v ?? '—'),
      },
      { key: 'currency',           label: 'Currency' },
      {
        key: 'bidValidityPeriod',
        label: 'Bid Validity',
        format: (v) => (v != null ? `${v} days` : '—'),
      },
    ],
  },
  {
    title: 'Declaration',
    icon: 'checkmark-shield-outline',
    fields: [
      {
        key: 'declarationAccepted',
        label: 'Terms Accepted',
        format: (v) => (v ? 'Yes ✓' : 'No'),
      },
      {
        key: 'declarationAcceptedAt',
        label: 'Accepted At',
        format: (v) => {
          if (!v) return '—';
          try {
            return new Date(v as string).toLocaleString(undefined, {
              year: 'numeric', month: 'short', day: '2-digit',
              hour: '2-digit', minute: '2-digit',
            });
          } catch {
            return String(v);
          }
        },
      },
    ],
  },
];

// ── Row component ─────────────────────────────────────────────────────────────

interface RowProps {
  label: string;
  value?: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  accentColor: string;
}

const FieldRow: React.FC<RowProps> = ({ label, value, textColor, mutedColor, borderColor, accentColor }) => {
  if (!value || value === '—') return null;

  return (
    <View style={[rowStyles.root, { borderBottomColor: borderColor }]}>
      <Text style={[rowStyles.label, { color: mutedColor }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: textColor }]}>{value}</Text>
    </View>
  );
};

// ── Section component ─────────────────────────────────────────────────────────

interface SectionProps {
  config: SectionConfig;
  data: BidCoverSheet;
  palette: ReturnType<typeof usePalette>;
}

const Section: React.FC<SectionProps> = ({ config, data, palette }) => {
  // Filter out empty/null fields before rendering section
  const visibleFields = config.fields.filter((f) => {
    const raw = data[f.key];
    const formatted = f.format ? f.format(raw) : String(raw ?? '');
    return raw != null && formatted !== '' && formatted !== '—';
  });

  if (visibleFields.length === 0) return null;

  return (
    <View style={[sectionStyles.root, { borderColor: palette.border, backgroundColor: palette.card }]}>
      {/* Header */}
      <View style={[sectionStyles.header, { borderBottomColor: palette.border, backgroundColor: palette.headerBg }]}>
        <Ionicons name={config.icon} size={15} color={palette.accent} />
        <Text style={[sectionStyles.title, { color: palette.text }]}>{config.title}</Text>
      </View>

      {/* Rows */}
      <View style={sectionStyles.body}>
        {visibleFields.map((f) => {
          const raw = data[f.key];
          const formatted = f.format ? f.format(raw) : String(raw ?? '—');
          return (
            <FieldRow
              key={f.key}
              label={f.label}
              value={formatted}
              textColor={palette.text}
              mutedColor={palette.muted}
              borderColor={palette.border}
              accentColor={palette.accent}
            />
          );
        })}
      </View>
    </View>
  );
};

// ── Palette helper ────────────────────────────────────────────────────────────

function usePalette(isDark: boolean) {
  return {
    bg:       isDark ? '#0F172A' : '#F8FAFC',
    card:     isDark ? '#1E293B' : '#FFFFFF',
    headerBg: isDark ? '#1A2540' : '#F1F5F9',
    border:   isDark ? '#334155' : '#E2E8F0',
    text:     isDark ? '#F1F5F9' : '#0F172A',
    muted:    isDark ? '#94A3B8' : '#64748B',
    accent:   '#0A2540',
  };
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  coverSheet: BidCoverSheet;
}

export const BidCoverSheetDisplay: React.FC<Props> = ({ coverSheet }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = usePalette(isDark);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      {SECTIONS.map((section) => (
        <Section
          key={section.title}
          config={section}
          data={coverSheet}
          palette={palette}
        />
      ))}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { gap: 12 },
});

const sectionStyles = StyleSheet.create({
  root: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
});

const rowStyles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    width: 130,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    lineHeight: 16,
  },
  value: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default BidCoverSheetDisplay;
