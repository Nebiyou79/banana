/**
 * src/components/application/ApplicationSharedComponents.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared sub-components used by both Candidate and Company application details.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { withAlpha } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/color';

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  c: ThemeColors;
  children: React.ReactNode;
}

const SectionCard = memo<SectionCardProps>(({ title, icon, iconColor, c, children }) => (
  <View style={[sc.card, { backgroundColor: c.surface, borderColor: c.border }]}>
    <View style={sc.header}>
      <View style={[sc.iconBox, { backgroundColor: withAlpha(iconColor, 0.13) }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={[sc.title, { color: c.text }]}>{title}</Text>
    </View>
    {children}
  </View>
));
SectionCard.displayName = 'SectionCard';

const sc = StyleSheet.create({
  card:    { padding: 14, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 12 },
  header:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 10 },
  iconBox: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 14, fontWeight: '700' },
});

// ─── InfoRow ──────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  c: ThemeColors;
}

const InfoRow = memo<InfoRowProps>(({ icon, label, value, c }) => (
  <View style={ir.row}>
    <Ionicons name={icon} size={15} color={c.textMuted} />
    <Text style={[ir.label, { color: c.textMuted }]}>{label}:</Text>
    <Text style={[ir.value, { color: c.text }]} numberOfLines={1}>{value}</Text>
  </View>
));
InfoRow.displayName = 'InfoRow';

const ir = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 },
  label: { fontSize: 12, width: 60 },
  value: { fontSize: 13, fontWeight: '600', flex: 1 },
});

// ─── TabBar ───────────────────────────────────────────────────────────────────

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

interface TabBarProps {
  tabs: TabConfig[];
  activeId: string;
  onSelect: (id: string) => void;
  badgeCounts?: Record<string, number>;
  c: ThemeColors;
}

const TabBar = memo<TabBarProps>(({ tabs, activeId, onSelect, badgeCounts = {}, c }) => (
  <View style={[tb.bar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
    {tabs.map((tab) => {
      const active = activeId === tab.id;
      const count  = badgeCounts[tab.id] ?? 0;
      return (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onSelect(tab.id)}
          style={[tb.tab, active && [tb.tabActive, { borderBottomColor: c.primary }]]}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
        >
          <Ionicons name={tab.icon} size={16} color={active ? c.primary : c.textMuted} />
          <Text style={[tb.label, { color: active ? c.primary : c.textMuted }]}>{tab.label}</Text>
          {count > 0 && (
            <View style={[tb.badge, { backgroundColor: c.primary }]}>
              <Text style={tb.badgeText}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
));
TabBar.displayName = 'TabBar';

const tb = StyleSheet.create({
  bar:      { flexDirection: 'row', borderBottomWidth: 1 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 2, borderBottomColor: 'transparent', minHeight: 44,
  },
  tabActive: {},
  label:    { fontSize: 11, fontWeight: '700' },
  badge:    { minWidth: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
});

// ─── ExpCard ──────────────────────────────────────────────────────────────────

interface ExpCardProps {
  exp: any;
  c: ThemeColors;
}

const ExpCard: React.FC<ExpCardProps> = ({ exp, c }) => (
  <View style={[ec.card, { backgroundColor: c.bg, borderColor: c.border }]}>
    {exp.providedAsDocument ? (
      <View style={ec.docRow}>
        <Ionicons name="document-text" size={16} color={c.info} />
        <Text style={[ec.title, { color: c.text }]}>
          {exp.document?.originalName ?? 'Experience Document'}
        </Text>
      </View>
    ) : (
      <>
        <Text style={[ec.title, { color: c.text }]}>
          {exp.position}{exp.company ? ` @ ${exp.company}` : ''}
        </Text>
        {(exp.startDate || exp.endDate) && (
          <Text style={[ec.dates, { color: c.textMuted }]}>
            {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
          </Text>
        )}
        {exp.description && (
          <Text style={[ec.desc, { color: c.textMuted }]} numberOfLines={2}>
            {exp.description}
          </Text>
        )}
        {(exp.skills ?? []).length > 0 && (
          <View style={[ec.chipRow, { marginTop: 6 }]}>
            {exp.skills.slice(0, 5).map((sk: string, j: number) => (
              <View key={j} style={[ec.chip, { backgroundColor: withAlpha(c.info, 0.10), borderColor: withAlpha(c.info, 0.30) }]}>
                <Text style={[ec.chipText, { color: c.info }]}>{sk}</Text>
              </View>
            ))}
          </View>
        )}
      </>
    )}
  </View>
);

// ─── RefCard ──────────────────────────────────────────────────────────────────

interface RefCardProps {
  ref: any;
  c: ThemeColors;
}

const RefCard: React.FC<RefCardProps> = ({ ref, c }) => (
  <View style={[ec.card, { backgroundColor: c.bg, borderColor: c.border }]}>
    {ref.providedAsDocument ? (
      <View style={ec.docRow}>
        <Ionicons name="document-text" size={16} color={c.primary} />
        <Text style={[ec.title, { color: c.text }]}>
          {ref.document?.originalName ?? 'Reference Document'}
        </Text>
      </View>
    ) : (
      <>
        <Text style={[ec.title, { color: c.text }]}>
          {ref.name}{ref.position ? `, ${ref.position}` : ''}
        </Text>
        {ref.company && <Text style={[ec.dates, { color: c.textMuted }]}>{ref.company}</Text>}
        {ref.email   && <Text style={[ec.desc,  { color: c.textMuted }]}>{ref.email}</Text>}
        {ref.phone   && <Text style={[ec.desc,  { color: c.textMuted }]}>{ref.phone}</Text>}
        {ref.allowsContact && (
          <View style={[ec.contactBadge, { backgroundColor: withAlpha(c.success, 0.13) }]}>
            <Ionicons name="checkmark-circle" size={12} color={c.success} />
            <Text style={{ color: c.success, fontSize: 11, fontWeight: '600' }}>Allows contact</Text>
          </View>
        )}
      </>
    )}
  </View>
);

const ec = StyleSheet.create({
  card:        { padding: 10, borderRadius: RADIUS.sm, borderWidth: 1, marginBottom: 6 },
  title:       { fontSize: 13, fontWeight: '600' },
  dates:       { fontSize: 11, marginTop: 2 },
  desc:        { fontSize: 12, marginTop: 4, lineHeight: 16 },
  docRow:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1 },
  chipText:    { fontSize: 11, fontWeight: '600' },
  contactBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  SectionCard,
  InfoRow,
  TabBar,
  ExpCard,
  RefCard,
  type TabConfig,
};