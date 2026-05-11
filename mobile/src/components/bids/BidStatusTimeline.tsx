// src/components/bids/BidStatusTimeline.tsx
// Vertical timeline of bid statusHistory entries.
// Current status node is highlighted. ownerNotes shown when present.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
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
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = {
    bg:       isDark ? '#1E293B' : '#F8FAFC',
    card:     isDark ? '#0F172A' : '#FFFFFF',
    border:   isDark ? '#334155' : '#E2E8F0',
    text:     isDark ? '#F1F5F9' : '#0F172A',
    muted:    isDark ? '#94A3B8' : '#64748B',
    noteLine: isDark ? '#1E293B' : '#F1F5F9',
    lineTrack:isDark ? '#334155' : '#E2E8F0',
  };

  // Entries are oldest→newest — reverse to show newest first
  const entries = [...statusHistory].reverse();

  if (entries.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <Ionicons name="time-outline" size={32} color={palette.muted} />
        <Text style={[styles.emptyText, { color: palette.muted }]}>No status history yet</Text>
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
                    borderColor: isCurrent ? config.accent : palette.border,
                    backgroundColor: isCurrent ? config.accent : palette.card,
                  },
                ]}
              >
                <Ionicons
                  name={config.icon}
                  size={14}
                  color={isCurrent ? '#FFFFFF' : palette.muted}
                />
              </View>
              {!isLast && (
                <View style={[styles.connectorLine, { backgroundColor: palette.lineTrack }]} />
              )}
            </View>

            {/* ── Right: content ── */}
            <View
              style={[
                styles.content,
                isCurrent && {
                  backgroundColor: palette.noteLine,
                  borderRadius: 12,
                  padding: 10,
                },
                { marginBottom: isLast ? 0 : 16 },
              ]}
            >
              {/* Status label + current badge */}
              <View style={styles.labelRow}>
                <Text
                  style={[
                    styles.statusLabel,
                    { color: isCurrent ? config.accent : palette.text },
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

              {/* Timestamp */}
              <Text style={[styles.timestamp, { color: palette.muted }]}>
                {formatDate(entry.changedAt)}
              </Text>

              {/* Owner notes */}
              {!!entry.notes && (
                <View style={[styles.notesBox, { backgroundColor: palette.bg, borderColor: palette.border }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={12} color={palette.muted} />
                  <Text style={[styles.notesText, { color: palette.muted }]}>{entry.notes}</Text>
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
    borderRadius: 999,
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
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyText: { fontSize: 13 },
});

export default BidStatusTimeline;
