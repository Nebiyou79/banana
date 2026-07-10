// src/components/bids/BidStatusTimeline.tsx
// Vertical timeline of bid statusHistory entries.
// UPDATED: Migrated to useTheme hook
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BidStatus, BidStatusHistoryEntry } from '../../types/bid';

// ── Status config ─────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}

const STATUS_CONFIG: Record<BidStatus, StatusConfig> = {
  [BidStatus.Submitted]:           { label: 'Submitted',            icon: 'paper-plane',        accent: '#F59E0B' },
  [BidStatus.UnderReview]:         { label: 'Under Review',         icon: 'search',             accent: '#3B82F6' },
  [BidStatus.Shortlisted]:         { label: 'Shortlisted',          icon: 'star',               accent: '#14B8A6' },
  [BidStatus.InterviewScheduled]:  { label: 'Interview Scheduled',  icon: 'calendar',           accent: '#A855F7' },
  [BidStatus.Awarded]:             { label: 'Awarded',              icon: 'trophy',             accent: '#F1BB03' },
  [BidStatus.Rejected]:            { label: 'Rejected',             icon: 'close-circle',       accent: '#EF4444' },
  [BidStatus.Withdrawn]:           { label: 'Withdrawn',            icon: 'arrow-undo-circle',  accent: '#9CA3AF' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  statusHistory: BidStatusHistoryEntry[];
  currentStatus: BidStatus;
}

export const BidStatusTimeline: React.FC<Props> = ({ statusHistory, currentStatus }) => {
  const { colors, radius } = useTheme();

  const entries = [...statusHistory].reverse();

  if (entries.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.bgCard, borderRadius: radius.lg }]}>
        <Ionicons name="time-outline" size={32} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No status history yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {entries.map((entry, idx) => {
        const config = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG[BidStatus.Submitted];
        const isCurrent = entry.status === currentStatus && idx === 0;
        const isLast = idx === entries.length - 1;

        return (
          <View key={`${entry.status}-${idx}`} style={styles.row}>
            {/* ── Left: dot + connector line ── */}
            <View style={styles.dotCol}>
              <View
                style={[
                  styles.dotOuter,
                  {
                    borderColor: isCurrent ? config.accent : colors.border,
                    backgroundColor: isCurrent ? config.accent : colors.bgCard,
                  },
                ]}
              >
                <Ionicons
                  name={config.icon}
                  size={14}
                  color={isCurrent ? '#FFFFFF' : colors.textMuted}
                />
              </View>
              {!isLast && (
                <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
              )}
            </View>

            {/* ── Right: content ── */}
            <View
              style={[
                styles.content,
                isCurrent && {
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  padding: 10,
                  marginHorizontal: -10,
                },
                { marginBottom: isLast ? 0 : 16 },
              ]}
            >
              <View style={styles.labelRow}>
                <Text
                  style={[
                    styles.statusLabel,
                    { color: isCurrent ? config.accent : colors.text },
                  ]}
                >
                  {config.label}
                </Text>
                {isCurrent && (
                  <View style={[styles.currentPill, { borderColor: config.accent, backgroundColor: config.accent + '22' }]}>
                    <Text style={[styles.currentPillText, { color: config.accent }]}>Current</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                {formatDate(entry.changedAt)}
              </Text>

              {!!entry.notes && (
                <View style={[styles.notesBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={12} color={colors.textMuted} />
                  <Text style={[styles.notesText, { color: colors.textMuted }]}>{entry.notes}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { gap: 0 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  dotCol: { width: 36, alignItems: 'center', gap: 0 },
  dotOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingLeft: 10,
    paddingTop: 4,
    gap: 3,
    minHeight: 50,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  currentPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  currentPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timestamp: {
    fontSize: 11,
    lineHeight: 14,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    borderWidth: 1,
  },
  emptyText: { fontSize: 13 },
});

export default BidStatusTimeline;