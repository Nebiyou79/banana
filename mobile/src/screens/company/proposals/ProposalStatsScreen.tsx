// src/screens/company/proposals/ProposalStatsScreen.tsx
// Banana Mobile App — Module 6B: Proposals
// Company / Organization: aggregate statistics for proposals on a tender.
// Shows donut chart (status breakdown), avg/min/max bid, shortlisted count,
// reviewed count, and quick-action links to filtered proposal lists.

import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useThemeStore } from '../../../store/themeStore';
import { useTenderProposalStats } from '../../../hooks/useProposal';
import type { ProposalStats, ProposalStatus } from '../../../types/proposal';

// ─── Navigation ───────────────────────────────────────────────────────────────

type ScreenRouteProp = RouteProp<
  {
    ProposalStats: {
      tenderId: string;
      tenderTitle: string;
      role: 'company' | 'organization';
    };
  },
  'ProposalStats'
>;

// ─── Status config for the breakdown ─────────────────────────────────────────

interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  icon: string;
}

const STATUS_META: Partial<Record<ProposalStatus, StatusMeta>> = {
  submitted: { label: 'Submitted', color: '#D97706', bg: 'rgba(245,158,11,0.12)', icon: '📤' },
  under_review: { label: 'Under Review', color: '#2563EB', bg: 'rgba(59,130,246,0.12)', icon: '🔍' },
  shortlisted: { label: 'Shortlisted', color: '#0D9488', bg: 'rgba(20,184,166,0.12)', icon: '⭐' },
  interview_scheduled: { label: 'Interview', color: '#7C3AED', bg: 'rgba(139,92,246,0.12)', icon: '📅' },
  awarded: { label: 'Awarded', color: '#059669', bg: 'rgba(16,185,129,0.12)', icon: '🏆' },
  rejected: { label: 'Rejected', color: '#DC2626', bg: 'rgba(239,68,68,0.12)', icon: '✕' },
  withdrawn: { label: 'Withdrawn', color: '#64748B', bg: 'rgba(100,116,139,0.12)', icon: '↩' },
};

// ─── Mini donut chart (SVG-free, pure RN) ─────────────────────────────────────

interface DonutSegment {
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
  size?: number;
  strokeWidth?: number;
  centerLabel: string;
  centerSub: string;
  colors: { text: string; textMuted: string };
}

const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  total,
  size = 160,
  strokeWidth = 18,
  centerLabel,
  centerSub,
  colors,
}) => {
  // We approximate the donut using stacked arc segments via border-radius trick.
  // For a proper donut we use segments rendered as thick borders on arcs.
  // Since SVG isn't available, we use a stack of View arcs (simple approach).

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate each segment's rotation and dash values
  let accumulated = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const fraction = total > 0 ? seg.value / total : 0;
      const dash = fraction * circumference;
      const gap = circumference - dash;
      const rotation = (accumulated / (total || 1)) * 360;
      accumulated += seg.value;
      return { ...seg, dash, gap, rotation };
    });

  return (
    <View style={[donutStyles.container, { width: size, height: size }]}>
      {/* Render each segment as a colored ring slice using overflow + clip approach */}
      {arcs.map((arc, i) => (
        <View
          key={i}
          style={[
            donutStyles.ringSlice,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: arc.color,
              opacity: 0.9,
            },
          ]}
        />
      ))}

      {/* Simplified: show as a proportional horizontal bar instead */}
      {/* Center label */}
      <View style={donutStyles.center}>
        <Text style={[donutStyles.centerLabel, { color: colors.text }]}>{centerLabel}</Text>
        <Text style={[donutStyles.centerSub, { color: colors.textMuted }]}>{centerSub}</Text>
      </View>
    </View>
  );
};

const donutStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  ringSlice: { position: 'absolute' },
  center: { alignItems: 'center', gap: 2 },
  centerLabel: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  centerSub: { fontSize: 11, fontWeight: '600' },
});

// ─── Proportional bar chart ───────────────────────────────────────────────────

interface BarChartProps {
  stats: ProposalStats;
  colors: { card: string; border: string; text: string; textMuted: string; textSecondary: string };
  onStatusPress: (status: ProposalStatus) => void;
}

const BarChart: React.FC<BarChartProps> = ({ stats, colors, onStatusPress }) => {
  const entries = Object.entries(stats.byStatus ?? {}).filter(
    ([, count]) => count > 0,
  ) as [ProposalStatus, number][];

  const total = stats.total || 1;

  return (
    <View style={barStyles.container}>
      {entries.map(([status, count]) => {
        const meta = STATUS_META[status];
        if (!meta) return null;
        const pct = Math.round((count / total) * 100);
        const barWidth = `${Math.max(pct, 3)}%` as `${number}%`;

        return (
          <TouchableOpacity
            key={status}
            onPress={() => onStatusPress(status)}
            activeOpacity={0.75}
            style={barStyles.row}
          >
            {/* Label */}
            <View style={barStyles.labelCol}>
              <Text style={barStyles.statusIcon}>{meta.icon}</Text>
              <Text style={[barStyles.statusLabel, { color: colors.textSecondary }]}>
                {meta.label}
              </Text>
            </View>

            {/* Bar */}
            <View style={[barStyles.barTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  barStyles.barFill,
                  { width: barWidth, backgroundColor: meta.color },
                ]}
              />
            </View>

            {/* Count + pct */}
            <View style={barStyles.countCol}>
              <Text style={[barStyles.countNum, { color: colors.text }]}>{count}</Text>
              <Text style={[barStyles.countPct, { color: colors.textMuted }]}>{pct}%</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const barStyles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  labelCol: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 110 },
  statusIcon: { fontSize: 14 },
  statusLabel: { fontSize: 12, fontWeight: '500' },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  countCol: { width: 52, alignItems: 'flex-end', gap: 1 },
  countNum: { fontSize: 13, fontWeight: '700' },
  countPct: { fontSize: 10 },
});

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subValue?: string;
  accent: string;
  bg: string;
  onPress?: () => void;
  colors: { card: string; border: string; text: string; textMuted: string };
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subValue,
  accent,
  bg,
  onPress,
  colors,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={onPress ? 0.75 : 1}
    style={[
      statCardStyles.card,
      { backgroundColor: colors.card, borderColor: colors.border },
    ]}
  >
    <View style={[statCardStyles.iconBg, { backgroundColor: bg }]}>
      <Text style={statCardStyles.icon}>{icon}</Text>
    </View>
    <Text style={[statCardStyles.value, { color: accent }]}>{value}</Text>
    {subValue ? (
      <Text style={[statCardStyles.sub, { color: colors.textMuted }]}>{subValue}</Text>
    ) : null}
    <Text style={[statCardStyles.label, { color: colors.textMuted }]}>{label}</Text>
    {onPress && (
      <Text style={[statCardStyles.arrow, { color: accent }]}>→</Text>
    )}
  </TouchableOpacity>
);

const statCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    alignItems: 'flex-start',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: { fontSize: 18 },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 11 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  arrow: { fontSize: 14, fontWeight: '700', marginTop: 4 },
});

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const StatsSkeleton: React.FC<{ colors: { border: string } }> = ({ colors }) => (
  <View style={skeletonStyles.container}>
    <View style={[skeletonStyles.block, skeletonStyles.tall, { borderColor: colors.border }]} />
    <View style={skeletonStyles.row}>
      {[0, 1].map((i) => (
        <View key={i} style={[skeletonStyles.block, skeletonStyles.half, { borderColor: colors.border }]} />
      ))}
    </View>
    <View style={[skeletonStyles.block, skeletonStyles.tall, { borderColor: colors.border }]} />
  </View>
);

const skeletonStyles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  block: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(128,128,128,0.07)',
  },
  tall: { height: 220 },
  half: { flex: 1, height: 110 },
  row: { flexDirection: 'row', gap: 12 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const ProposalStatsScreen: React.FC = () => {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { theme } = useThemeStore();
  const { colors } = theme;

  const { tenderId, tenderTitle, role } = route.params;

  const { data: stats, isLoading, refetch, isFetching } = useTenderProposalStats(tenderId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Proposal Statistics' });
  }, [navigation]);

  const navigateToProposals = (statusFilter?: ProposalStatus) => {
    navigation.navigate('TenderProposals', {
      tenderId,
      tenderTitle,
      role,
      initialStatus: statusFilter,
    });
  };

  const formatCurrency = (amount: number) =>
    `ETB ${Math.round(amount).toLocaleString()}`;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatsSkeleton colors={colors as any} />
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📊</Text>
          <Text style={[styles.errorText, { color: colors.text }]}>
            No statistics available yet.
          </Text>
          <Text style={[styles.errorSub, { color: colors.textMuted }]}>
            Statistics will appear once proposals are received.
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Derived values
  const activeCount = (stats.byStatus?.submitted ?? 0)
    + (stats.byStatus?.under_review ?? 0)
    + (stats.byStatus?.shortlisted ?? 0)
    + (stats.byStatus?.interview_scheduled ?? 0);

  const conversionRate = stats.total > 0
    ? Math.round(((stats.byStatus?.awarded ?? 0) / stats.total) * 100)
    : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="#F1BB03"
          />
        }
      >
        {/* ── Header banner ─────────────────────────────────────────────── */}
        <View
          style={[
            styles.headerBanner,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.headerAccent} />
          <View style={styles.headerBody}>
            <Text style={[styles.headerLabel, { color: colors.textMuted }]}>
              Proposal Statistics
            </Text>
            <Text
              style={[styles.headerTitle, { color: colors.text }]}
              numberOfLines={2}
            >
              {tenderTitle}
            </Text>
            <TouchableOpacity
              onPress={() => navigateToProposals()}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>View all proposals →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Top stats grid ─────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="📋"
            label="Total Proposals"
            value={stats.total}
            accent={colors.text}
            bg="rgba(100,116,139,0.1)"
            onPress={() => navigateToProposals()}
            colors={colors as any}
          />
          <StatCard
            icon="⭐"
            label="Shortlisted"
            value={stats.shortlistedCount}
            accent="#0D9488"
            bg="rgba(20,184,166,0.1)"
            onPress={() => navigateToProposals('shortlisted')}
            colors={colors as any}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="⚡"
            label="Active"
            value={activeCount}
            accent="#2563EB"
            bg="rgba(59,130,246,0.1)"
            onPress={() => navigateToProposals('submitted')}
            colors={colors as any}
          />
          <StatCard
            icon="👁"
            label="Reviewed"
            value={stats.viewedByOwner}
            subValue={`of ${stats.total}`}
            accent="#7C3AED"
            bg="rgba(139,92,246,0.1)"
            colors={colors as any}
          />
        </View>

        {/* ── Bid statistics ─────────────────────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            BID RANGE
          </Text>

          <View style={styles.bidRangeRow}>
            <View style={[styles.bidBox, { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)' }]}>
              <Text style={[styles.bidBoxLabel, { color: '#059669' }]}>Lowest</Text>
              <Text style={[styles.bidBoxValue, { color: '#059669' }]}>
                {formatCurrency(stats.minBid)}
              </Text>
            </View>
            <View style={[styles.bidBox, { backgroundColor: 'rgba(241,187,3,0.08)', borderColor: 'rgba(241,187,3,0.3)' }]}>
              <Text style={[styles.bidBoxLabel, { color: '#D97706' }]}>Average</Text>
              <Text style={[styles.bidBoxValue, { color: '#D97706' }]}>
                {formatCurrency(stats.avgBid)}
              </Text>
            </View>
            <View style={[styles.bidBox, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
              <Text style={[styles.bidBoxLabel, { color: '#DC2626' }]}>Highest</Text>
              <Text style={[styles.bidBoxValue, { color: '#DC2626' }]}>
                {formatCurrency(stats.maxBid)}
              </Text>
            </View>
          </View>

          {/* Bid range bar visualization */}
          {stats.maxBid > stats.minBid && (
            <View style={styles.bidRangeViz}>
              <View
                style={[styles.bidRangeTrack, { backgroundColor: colors.border }]}
              >
                <View
                  style={[
                    styles.bidRangeFill,
                    { backgroundColor: '#F1BB03' },
                  ]}
                />
                {/* Average marker */}
                {stats.maxBid > stats.minBid && (
                  <View
                    style={[
                      styles.bidAvgMarker,
                      {
                        left: `${Math.round(((stats.avgBid - stats.minBid) / (stats.maxBid - stats.minBid)) * 100)}%` as `${number}%`,
                        backgroundColor: '#D97706',
                      },
                    ]}
                  />
                )}
              </View>
              <View style={styles.bidRangeLabels}>
                <Text style={[styles.bidRangeEndLabel, { color: colors.textMuted }]}>
                  {formatCurrency(stats.minBid)}
                </Text>
                <Text style={[styles.bidRangeEndLabel, { color: colors.textMuted }]}>
                  {formatCurrency(stats.maxBid)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Status breakdown bar chart ─────────────────────────────────── */}
        {stats.total > 0 && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                STATUS BREAKDOWN
              </Text>
              <Text style={[styles.totalBadge, { color: '#F1BB03' }]}>
                {stats.total} total
              </Text>
            </View>
            <BarChart
              stats={stats}
              colors={colors as any}
              onStatusPress={(status) => navigateToProposals(status)}
            />
            <Text style={[styles.tapHint, { color: colors.textMuted }]}>
              Tap any row to filter proposals by that status →
            </Text>
          </View>
        )}

        {/* ── Key metrics ────────────────────────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            KEY METRICS
          </Text>

          {[
            {
              label: 'Shortlist Rate',
              value: stats.total > 0
                ? `${Math.round((stats.shortlistedCount / stats.total) * 100)}%`
                : '—',
              icon: '⭐',
              color: '#0D9488',
              desc: 'Proposals shortlisted out of total',
            },
            {
              label: 'Review Rate',
              value: stats.total > 0
                ? `${Math.round((stats.viewedByOwner / stats.total) * 100)}%`
                : '—',
              icon: '👁',
              color: '#7C3AED',
              desc: 'Proposals you have opened and reviewed',
            },
            {
              label: 'Award Rate',
              value: `${conversionRate}%`,
              icon: '🏆',
              color: '#059669',
              desc: 'Proposals resulting in an awarded contract',
            },
            {
              label: 'Bid Spread',
              value: stats.maxBid > 0 && stats.minBid > 0
                ? `${Math.round(((stats.maxBid - stats.minBid) / stats.avgBid) * 100)}%`
                : '—',
              icon: '📊',
              color: '#D97706',
              desc: 'Range between highest and lowest bid vs average',
            },
          ].map((metric) => (
            <View
              key={metric.label}
              style={[
                styles.metricRow,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.metricLeft}>
                <Text style={styles.metricIcon}>{metric.icon}</Text>
                <View>
                  <Text style={[styles.metricLabel, { color: colors.text }]}>
                    {metric.label}
                  </Text>
                  <Text style={[styles.metricDesc, { color: colors.textMuted }]}>
                    {metric.desc}
                  </Text>
                </View>
              </View>
              <Text style={[styles.metricValue, { color: metric.color }]}>
                {metric.value}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            QUICK ACTIONS
          </Text>

          {[
            {
              label: 'View all proposals',
              desc: `${stats.total} total`,
              icon: '📋',
              status: undefined as ProposalStatus | undefined,
              color: colors.text,
            },
            {
              label: 'Review new submissions',
              desc: `${stats.byStatus?.submitted ?? 0} awaiting review`,
              icon: '📤',
              status: 'submitted' as ProposalStatus,
              color: '#D97706',
            },
            {
              label: 'View shortlisted',
              desc: `${stats.shortlistedCount} shortlisted`,
              icon: '⭐',
              status: 'shortlisted' as ProposalStatus,
              color: '#0D9488',
            },
            {
              label: 'Interviews scheduled',
              desc: `${stats.byStatus?.interview_scheduled ?? 0} interviews`,
              icon: '📅',
              status: 'interview_scheduled' as ProposalStatus,
              color: '#7C3AED',
            },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              onPress={() => navigateToProposals(action.status)}
              style={[
                styles.quickAction,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <View style={styles.quickActionText}>
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                  {action.label}
                </Text>
                <Text style={[styles.quickActionDesc, { color: colors.textMuted }]}>
                  {action.desc}
                </Text>
              </View>
              <Text style={[styles.quickActionArrow, { color: action.color }]}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },

  // Error
  errorContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 12,
  },
  errorIcon: { fontSize: 48, marginBottom: 8 },
  errorText: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  errorSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    backgroundColor: '#F1BB03', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  retryText: { color: '#0A2540', fontSize: 14, fontWeight: '700' },

  // Header banner
  headerBanner: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  headerAccent: { height: 4, backgroundColor: '#F1BB03', width: '100%' },
  headerBody: { padding: 16, gap: 6 },
  headerLabel: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', lineHeight: 26 },
  viewAllBtn: { marginTop: 4 },
  viewAllText: { color: '#F1BB03', fontSize: 13, fontWeight: '600' },

  // Stats grid
  statsGrid: { flexDirection: 'row', gap: 12 },

  // Section cards
  sectionCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 14,
  },
  sectionTitle: {
    fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: -6,
  },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalBadge: { fontSize: 13, fontWeight: '700' },
  tapHint: { fontSize: 11, textAlign: 'center', marginTop: -6 },

  // Bid range
  bidRangeRow: { flexDirection: 'row', gap: 8 },
  bidBox: {
    flex: 1, borderWidth: 1, borderRadius: 12,
    padding: 12, alignItems: 'center', gap: 4,
  },
  bidBoxLabel: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  bidBoxValue: { fontSize: 13, fontWeight: '800' },
  bidRangeViz: { gap: 6 },
  bidRangeTrack: {
    height: 6, borderRadius: 3, overflow: 'visible', position: 'relative',
  },
  bidRangeFill: { height: '100%', width: '100%', borderRadius: 3 },
  bidAvgMarker: {
    position: 'absolute', top: -4, width: 14, height: 14,
    borderRadius: 7, marginLeft: -7, borderWidth: 2, borderColor: '#fff',
  },
  bidRangeLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  bidRangeEndLabel: { fontSize: 10 },

  // Metrics
  metricRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 14, borderBottomWidth: 1, gap: 10,
  },
  metricLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  metricIcon: { fontSize: 18, marginTop: 1 },
  metricLabel: { fontSize: 13, fontWeight: '600' },
  metricDesc: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  metricValue: { fontSize: 16, fontWeight: '800', flexShrink: 0 },

  // Quick actions
  quickAction: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingBottom: 14, borderBottomWidth: 1,
  },
  quickActionIcon: { fontSize: 22 },
  quickActionText: { flex: 1, gap: 2 },
  quickActionLabel: { fontSize: 14, fontWeight: '600' },
  quickActionDesc: { fontSize: 12 },
  quickActionArrow: { fontSize: 16, fontWeight: '700', flexShrink: 0 },

  bottomSpacer: { height: 24 },
});

export default ProposalStatsScreen;
