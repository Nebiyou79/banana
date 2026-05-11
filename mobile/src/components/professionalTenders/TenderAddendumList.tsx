// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/TenderAddendumList.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Display list of issued addenda for a tender.
//
//  Mode:
//    'owner'   — adds an "Issue Addendum" CTA (parent wires the navigation)
//    'browser' — read-only display; bidders need to see all amendments
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../../store/themeStore';
import { SectionCard } from './_shared';
import type { Addendum } from '../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  PROPS
// ═════════════════════════════════════════════════════════════════════════════

export interface TenderAddendumListProps {
  addenda: Addendum[];
  mode: 'owner' | 'browser';
  /** When true, hide the issue button (e.g. tender is in a status that disallows). */
  disableIssue?: boolean;
  /** Owner-only: open the AddendumScreen. */
  onIssueAddendum?: () => void;
}

// ═════════════════════════════════════════════════════════════════════════════
//  ITEM
// ═════════════════════════════════════════════════════════════════════════════

const AddendumItem: React.FC<{ item: Addendum; index: number }> = ({ item, index }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { bg: '#0F172A', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', accent: '#FCD34D', accentBg: '#451A03', amberBg: 'rgba(245,158,11,0.10)', amberBd: 'rgba(245,158,11,0.30)' }
    : { bg: '#F8FAFC', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', accent: '#B45309', accentBg: '#FEF3C7', amberBg: '#FFFBEB',                  amberBd: '#FDE68A' };

  const issued = new Date(item.issuedAt);
  const newDl = item.newDeadline ? new Date(item.newDeadline) : null;
  const attachCount = item.attachments?.length ?? 0;

  return (
    <View style={[itemStyles.root, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={itemStyles.head}>
        <View style={[itemStyles.numBadge, { backgroundColor: palette.accentBg }]}>
          <Text style={[itemStyles.numText, { color: palette.accent }]}>#{index + 1}</Text>
        </View>
        <View style={itemStyles.headText}>
          <Text style={[itemStyles.title, { color: palette.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[itemStyles.date, { color: palette.muted }]}>
            Issued {issued.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
            {' · '}
            {issued.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <Text style={[itemStyles.desc, { color: palette.text }]}>{item.description}</Text>

      {newDl && (
        <View
          style={[
            itemStyles.deadlineRow,
            { backgroundColor: palette.amberBg, borderColor: palette.amberBd },
          ]}
        >
          <Ionicons name="calendar" size={13} color={palette.accent} />
          <Text style={[itemStyles.deadlineLabel, { color: palette.muted }]}>
            New deadline:
          </Text>
          <Text style={[itemStyles.deadlineValue, { color: palette.text }]}>
            {newDl.toLocaleString(undefined, {
              year: 'numeric', month: 'short', day: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
      )}

      {attachCount > 0 && (
        <View style={itemStyles.attachRow}>
          <Ionicons name="document-attach-outline" size={12} color={palette.muted} />
          <Text style={[itemStyles.attachText, { color: palette.muted }]}>
            {attachCount} attachment{attachCount === 1 ? '' : 's'}
          </Text>
        </View>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const TenderAddendumList: React.FC<TenderAddendumListProps> = ({
  addenda,
  mode,
  disableIssue,
  onIssueAddendum,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { muted: '#94A3B8', primary: '#60A5FA', primaryFg: '#0F172A', warningBg: 'rgba(245,158,11,0.12)', warningBd: 'rgba(245,158,11,0.40)', warningFg: '#FCD34D' }
    : { muted: '#64748B', primary: '#2563EB', primaryFg: '#FFFFFF', warningBg: '#FFFBEB',               warningBd: '#FDE68A',               warningFg: '#B45309' };

  return (
    <View style={styles.stack}>
      <SectionCard
        icon="albums-outline"
        title={`Addenda (${addenda.length})`}
      >
        {addenda.length === 0 ? (
          <Text style={[styles.empty, { color: palette.muted }]}>
            No addenda have been issued for this tender.
          </Text>
        ) : (
          <View style={styles.list}>
            {addenda.map((a, i) => <AddendumItem key={a._id} item={a} index={i} />)}
          </View>
        )}
      </SectionCard>

      {/* Owner action — Issue Addendum CTA + warning */}
      {mode === 'owner' && (
        <>
          <View
            style={[
              styles.warningBanner,
              { backgroundColor: palette.warningBg, borderColor: palette.warningBd },
            ]}
          >
            <Ionicons name="warning-outline" size={14} color={palette.warningFg} />
            <Text style={[styles.warningText, { color: palette.warningFg }]}>
              Addenda are visible to all bidders and timestamped. They can't be
              edited or deleted once issued.
            </Text>
          </View>

          <Pressable
            onPress={onIssueAddendum}
            disabled={disableIssue || !onIssueAddendum}
            style={({ pressed }: { pressed: boolean }) => [
              styles.issueBtn,
              {
                backgroundColor: palette.primary,
                opacity: (disableIssue || !onIssueAddendum) ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Issue a new addendum"
          >
            <Ionicons name="add-circle-outline" size={18} color={palette.primaryFg} />
            <Text style={[styles.issueBtnText, { color: palette.primaryFg }]}>
              Issue New Addendum
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  stack: { gap: 12 },
  list:  { gap: 8 },
  empty: { fontSize: 12, fontStyle: 'italic' },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  warningText: { flex: 1, fontSize: 11, lineHeight: 15 },

  issueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 44,
  },
  issueBtnText: { fontSize: 14, fontWeight: '700' },
});

const itemStyles = StyleSheet.create({
  root: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  head: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  numBadge: {
    width: 32, height: 32,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontSize: 12, fontWeight: '800' },
  headText: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  date:  { fontSize: 11 },
  desc:  { fontSize: 12, lineHeight: 17 },

  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  deadlineLabel: { fontSize: 11, fontWeight: '600' },
  deadlineValue: { fontSize: 11, fontWeight: '700' },

  attachRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attachText: { fontSize: 11 },
});

export default TenderAddendumList;