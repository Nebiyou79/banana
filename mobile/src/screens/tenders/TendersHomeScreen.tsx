// src/screens/tenders/TendersHomeScreen.tsx
//
// Wired to real data from:
//   1. useMyPostedProfessionalTenders → ProfessionalTenderListResponse
//        .tenders[]  (ProfessionalTenderListItem with .status, .bidCount)
//        .pagination.total
//   2. useMyPostedFreelanceTenders    → FreelanceTenderListResponse
//        .tenders[]  (FreelanceTenderListItem with .status)
//        .pagination.total
//   3. useGetMyAllBids                → { pagination.total } or { totalBids }
//   4. useMyProposals                 → { pagination.total }

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { AppHeader } from '../../components/ui/AppHeader';

// ── All 4 tender data sources ──────────────────────────────────────────────
import { useMyPostedProfessionalTenders } from '../../hooks/useProfessionalTender';
import { useMyPostedFreelanceTenders } from '../../hooks/useFreelanceTender';
import { useGetMyAllBids } from '../../hooks/useBid';
import { useMyProposals } from '../../hooks/useProposal';

import type {
  ProfessionalTenderListItem,
  ProfessionalTenderStatus,
} from '../../types/professionalTender';
import type { FreelanceTenderListItem } from '../../types/freelanceTender';

export type TendersHomeRole = 'company' | 'organization';
interface TendersHomeScreenProps { userRole: TendersHomeRole }

// ─── Stat tile ────────────────────────────────────────────────────────────────
const StatTile: React.FC<{
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'blue' | 'green' | 'amber' | 'purple' | 'rose' | 'teal';
  loading?: boolean;
  onPress?: () => void;
}> = ({ label, value, icon, tone, loading, onPress }) => {
  const { colors: c, radius, type } = useTheme();

  const toneColor = useMemo(() => {
    const map: Record<string, { fg: string; bg: string }> = {
      blue:   { fg: c.candidate ?? c.primary,        bg: withAlpha(c.candidate ?? c.primary, 0.12) },
      green:  { fg: c.success,                       bg: withAlpha(c.success, 0.12) },
      amber:  { fg: c.warning,                       bg: withAlpha(c.warning, 0.12) },
      purple: { fg: c.organization ?? c.primary,     bg: withAlpha(c.organization ?? c.primary, 0.12) },
      rose:   { fg: c.danger,                        bg: withAlpha(c.danger, 0.12) },
      teal:   { fg: c.primary,                       bg: withAlpha(c.primary, 0.08) },
    };
    return map[tone] ?? map.blue;
  }, [c, tone]);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        tile.root,
        {
          backgroundColor: c.bgCard,
          borderColor: c.border,
          borderRadius: radius.lg,
          opacity: onPress && pressed ? 0.88 : 1,
        },
      ]}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={tile.head}>
        <View style={[tile.iconWrap, { backgroundColor: toneColor.bg, borderRadius: radius.sm }]}>
          <Ionicons name={icon} size={16} color={toneColor.fg} />
        </View>
        <Text
          style={[type.caption, { color: c.textMuted, fontWeight: '700', letterSpacing: 0.4, flex: 1 }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {!!onPress && (
          <Ionicons name="chevron-forward" size={12} color={c.textMuted} style={{ marginLeft: 2 }} />
        )}
      </View>
      {loading ? (
        <View style={[tile.skel, { backgroundColor: c.border, borderRadius: radius.sm }]} />
      ) : (
        <Text style={{ fontSize: 22, fontWeight: '800', color: c.text }}>{value}</Text>
      )}
    </Pressable>
  );
};

const tile = StyleSheet.create({
  root:     { flexBasis: '48%', flexGrow: 1, padding: 12, borderWidth: 1, gap: 8, minHeight: 80 },
  head:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  skel:     { width: 50, height: 22 },
});

// ─── Section divider with label + optional action ─────────────────────────────
const SectionHeader: React.FC<{
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ label, actionLabel, onAction }) => {
  const { colors: c, type } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text
        style={[type.caption, { color: c.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', paddingHorizontal: 4 }]}
      >
        {label}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[type.caption, { color: c.primary, fontWeight: '700' }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

// ─── Quick-action pill ────────────────────────────────────────────────────────
interface QuickActionItem {
  title:   string;
  icon:    keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?:  number;
}

const QuickActionPill: React.FC<QuickActionItem> = ({ title, icon, onPress, badge }) => {
  const { colors: c, spacing, radius, type } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        qa.pill,
        {
          backgroundColor: c.bgCard,
          borderColor:     c.border,
          borderRadius:    radius.lg,
          opacity:         pressed ? 0.85 : 1,
          paddingHorizontal: spacing.md,
          paddingVertical:   spacing.sm,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={qa.iconWrap}>
        <Ionicons name={icon} size={20} color={c.primary} />
        {badge !== undefined && badge > 0 && (
          <View style={[qa.badge, { backgroundColor: c.primary }]}>
            <Text style={[type.caption, { color: c.bg, fontSize: 9, fontWeight: '800' }]}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[type.caption, { color: c.text, fontWeight: '600', marginTop: 4 }]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const qa = StyleSheet.create({
  pill:    { width: 100, borderWidth: 1, alignItems: 'center', gap: 2, minHeight: 76 },
  iconWrap:{ position: 'relative' },
  badge:   { position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
});

// ─── Recent professional tender row ──────────────────────────────────────────
const RecentRow: React.FC<{ item: ProfessionalTenderListItem; onPress: () => void }> = ({ item, onPress }) => {
  const { colors: c, radius, type } = useTheme();

  const statusColor: Record<ProfessionalTenderStatus, string> = {
    draft:            c.textMuted,
    published:        c.success,
    locked:           c.warning,
    deadline_reached: c.warning,
    revealed:         c.primary,
    closed:           c.danger,
    cancelled:        c.textMuted,
    awarded:          c.primary,
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        recent.row,
        { backgroundColor: c.bgCard, borderColor: c.border, borderRadius: radius.md, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[recent.dot, { backgroundColor: statusColor[item.status] ?? c.textMuted }]} />
      <View style={recent.content}>
        <Text style={[type.bodySm, { color: c.text, fontWeight: '600' }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[type.caption, { color: c.textMuted, marginTop: 2, textTransform: 'capitalize' }]} numberOfLines={1}>
          {/* bidCount comes directly from ProfessionalTenderListItem */}
          {item.bidCount ?? 0} bid{(item.bidCount ?? 0) === 1 ? '' : 's'} · {item.status.replace(/_/g, ' ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
    </Pressable>
  );
};

const recent = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderWidth: 1 },
  dot:     { width: 8, height: 8, borderRadius: 999, flexShrink: 0 },
  content: { flex: 1, minWidth: 0 },
});

// ─── Summary card (freelance / bids / proposals) ──────────────────────────────
const SummaryCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  sub?: string;
  tone?: string;
  onPress?: () => void;
  loading?: boolean;
}> = ({ icon, label, value, sub, tone, onPress, loading }) => {
  const { colors: c, radius, type } = useTheme();
  const fg = tone === 'green' ? c.success
    : tone === 'amber' ? c.warning
    : tone === 'red' ? c.danger
    : c.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        sum.card,
        {
          backgroundColor: c.bgCard,
          borderColor: c.border,
          borderRadius: radius.md,
          opacity: onPress && pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={[sum.iconBox, { backgroundColor: withAlpha(fg, 0.12), borderRadius: radius.sm }]}>
        <Ionicons name={icon} size={18} color={fg} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[type.caption, { color: c.textMuted, fontWeight: '600' }]} numberOfLines={1}>{label}</Text>
        {loading ? (
          <View style={[sum.skel, { backgroundColor: c.border, borderRadius: 4 }]} />
        ) : (
          <Text style={{ fontSize: 18, fontWeight: '800', color: c.text }}>{value}</Text>
        )}
        {!!sub && !loading && (
          <Text style={[type.caption, { color: c.textMuted, marginTop: 1 }]} numberOfLines={1}>{sub}</Text>
        )}
      </View>
      {!!onPress && <Ionicons name="chevron-forward" size={14} color={c.textMuted} />}
    </Pressable>
  );
};

const sum = StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, minHeight: 64 },
  iconBox: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  skel:    { width: 40, height: 18, marginTop: 2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export const TendersHomeScreen: React.FC<TendersHomeScreenProps> = ({ userRole }) => {
  const navigation = useNavigation<any>();
  const { colors: c, spacing, radius, type } = useTheme();
  const insets = useSafeAreaInsets();

  const isCompany = userRole === 'company';

  // ── 1. Professional tenders posted by this owner ───────────────────────
  // useMyPostedProfessionalTenders returns ProfessionalTenderListResponse:
  //   { tenders: ProfessionalTenderListItem[], pagination: { total, ... } }
  const {
    data: profData,
    isLoading: profLoading,
    refetch: refetchProf,
    isFetching: profFetching,
  } = useMyPostedProfessionalTenders({ page: 1, limit: 10 });

  // ── 2. Freelance tenders posted by this owner ──────────────────────────
  // useMyPostedFreelanceTenders returns FreelanceTenderListResponse:
  //   { tenders: FreelanceTenderListItem[], pagination: { total, page, totalPages } }
  const {
    data: freelanceData,
    isLoading: freelanceLoading,
    refetch: refetchFreelance,
  } = useMyPostedFreelanceTenders({ page: 1, limit: 5 });

  // ── 3. Bids received across all my tenders ────────────────────────────
  // pagination.total is the authoritative total bid count from the server
  const {
    data: bidsData,
    isLoading: bidsLoading,
    refetch: refetchBids,
  } = useGetMyAllBids({ page: 1, limit: 1 });

  // ── 4. Proposals submitted by this user ───────────────────────────────
  const {
    data: proposalsData,
    isLoading: proposalsLoading,
    refetch: refetchProposals,
  } = useMyProposals({ page: 1, limit: 1 });

  const isRefreshing = profFetching && !profLoading;

  const onRefresh = async () => {
    await Promise.all([refetchProf(), refetchFreelance(), refetchBids(), refetchProposals()]);
  };

  // ── Professional tender stats ──────────────────────────────────────────
  // tenders[] comes from ProfessionalTenderListItem which has status + bidCount
  const profStats = useMemo(() => {
    const tenders = profData?.tenders ?? [];
    // Use server-side total from pagination when available, fall back to page length
    const total = profData?.pagination?.total ?? tenders.length;
    return {
      total,
      draft:     tenders.filter(t => t.status === 'draft').length,
      // 'published' and 'locked' are both "live" states
      published: tenders.filter(t => t.status === 'published' || t.status === 'locked').length,
      awarded:   tenders.filter(t => t.status === 'awarded').length,
      // Sum bidCount from each ProfessionalTenderListItem for the current page
      bids:      tenders.reduce((sum, t) => sum + (t.bidCount ?? 0), 0),
    };
  }, [profData]);

  // ── Freelance tender stats ─────────────────────────────────────────────
  // FreelanceTenderListResponse has .tenders[] and .pagination.total
  const freelanceStats = useMemo(() => {
    const tenders: FreelanceTenderListItem[] = freelanceData?.tenders ?? [];
    const total = freelanceData?.pagination?.total ?? tenders.length;
    return {
      total,
      // 'published' is the active/live status for freelance tenders
      active: tenders.filter(t => t.status === 'published').length,
    };
  }, [freelanceData]);

  // ── Bids total from pagination ─────────────────────────────────────────
  // Prefer pagination.total (server-side count) over totalBids fallback
  const totalBidsReceived: number =
    (bidsData as any)?.pagination?.total ??
    (bidsData as any)?.totalBids ??
    0;

  // ── Proposals total from pagination ───────────────────────────────────
  const totalProposals: number =
    (proposalsData as any)?.pagination?.total ?? 0;

  // ── Recent tenders (latest 3 from page 1) ─────────────────────────────
  const recentTenders = profData?.tenders.slice(0, 3) ?? [];

  // ── Quick actions ──────────────────────────────────────────────────────
  const quickActions: QuickActionItem[] = useMemo(() => [
    {
      title:   'New Prof. Tender',
      icon:    'add-circle-outline',
      onPress: () => navigation.navigate('ProfessionalTenders', { screen: 'CreateProfessionalTender' }),
    },
    {
      title:   'New Freelance Tender',
      icon:    'people-outline',
      onPress: () => navigation.navigate('FreelanceTenders', { screen: 'CreateFreelanceTender' }),
    },
    ...(isCompany ? [{
      title:   'Browse Tenders',
      icon:    'search-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => navigation.navigate('ProfessionalTenders', { screen: 'BrowseProfessionalTenders' }),
    }] : []),
    {
      title:   'My Invitations',
      icon:    'mail-outline',
      onPress: () => navigation.navigate('ProfessionalTenders', { screen: 'MyInvitations' }),
    },
    {
      title:   'Received Bids',
      icon:    'mail-open-outline',
      // Show total bids across all tenders on the badge
      badge:   totalBidsReceived > 0 ? totalBidsReceived : undefined,
      onPress: () => navigation.navigate('Bids'),
    },
    {
      title:   'Proposals',
      icon:    'documents-outline',
      badge:   totalProposals > 0 ? totalProposals : undefined,
      onPress: () => navigation.navigate('Proposals'),
    },
  ], [isCompany, totalBidsReceived, totalProposals, navigation]);

  return (
    <SafeAreaView style={[S.root, { backgroundColor: c.bg }]} edges={['top']}>
      <AppHeader
        title="Tender Center"
        subtitle="Your procurement dashboard"
        centerTitle={false}
        rightAction={
          <View style={[S.roleChip, { backgroundColor: withAlpha(c.primary, 0.15), borderRadius: radius.full }]}>
            <Ionicons
              name={isCompany ? 'business-outline' : 'people-outline'}
              size={12}
              color={c.primary}
            />
            <Text style={[type.caption, { color: c.primary, fontWeight: '700', letterSpacing: 0.4 }]} numberOfLines={1}>
              {isCompany ? 'Company' : 'Organization'}
            </Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[S.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
          />
        }
      >
        {/* ── Professional Tender Stats ──────────────────────────────── */}
        <View style={[S.section, { marginTop: spacing.md }]}>
          <SectionHeader
            label="Professional Tenders"
            actionLabel={profStats.total > 0 ? 'View all' : undefined}
            onAction={() => navigation.navigate('ProfessionalTenders', { screen: 'MyProfessionalTenders' })}
          />
          <View style={S.statsRow}>
            {/* profStats.total = pagination.total from server (all pages) */}
            <StatTile
              label="Total Posted"
              value={profStats.total}
              icon="document-text-outline"
              tone="blue"
              loading={profLoading}
              onPress={() => navigation.navigate('ProfessionalTenders', { screen: 'MyProfessionalTenders' })}
            />
            {/* published + locked = currently live */}
            <StatTile
              label="Live"
              value={profStats.published}
              icon="radio-outline"
              tone="green"
              loading={profLoading}
              onPress={() => navigation.navigate('ProfessionalTenders', { screen: 'MyProfessionalTenders' })}
            />
            {/* draft = not yet published */}
            <StatTile
              label="Drafts"
              value={profStats.draft}
              icon="create-outline"
              tone="amber"
              loading={profLoading}
              onPress={() => navigation.navigate('ProfessionalTenders', { screen: 'MyProfessionalTenders' })}
            />
            {/* bids = sum of bidCount across tenders on page 1 */}
            <StatTile
              label="Bids Received"
              value={profStats.bids}
              icon="people-outline"
              tone="purple"
              loading={profLoading || bidsLoading}
              onPress={() => navigation.navigate('Bids')}
            />
          </View>
        </View>

        {/* ── Activity Overview ─────────────────────────────────────── */}
        <View style={[S.section, { marginTop: spacing.lg }]}>
          <SectionHeader label="Activity Overview" />
          <View style={{ gap: 8 }}>
            {/* freelanceStats.total = pagination.total from server */}
            <SummaryCard
              icon="people-circle-outline"
              label="Freelance Tenders"
              value={freelanceStats.total}
              sub={`${freelanceStats.active} active`}
              tone="green"
              loading={freelanceLoading}
              onPress={() => navigation.navigate('FreelanceTenders', { screen: 'MyFreelanceTenders' })}
            />
            {/* totalBidsReceived = bidsData.pagination.total (server-side) */}
            <SummaryCard
              icon="mail-open-outline"
              label="Total Bids Received"
              value={totalBidsReceived}
              sub="Across all tenders"
              tone="amber"
              loading={bidsLoading}
              onPress={() => navigation.navigate('Bids')}
            />
            {/* totalProposals = proposalsData.pagination.total */}
            <SummaryCard
              icon="documents-outline"
              label="My Proposals"
              value={totalProposals}
              sub="Submitted proposals"
              loading={proposalsLoading}
              onPress={() => navigation.navigate('Proposals')}
            />
          </View>
        </View>

        {/* ── Quick Actions ─────────────────────────────────────────── */}
        <View style={[S.section, { marginTop: spacing.lg }]}>
          <SectionHeader label="Quick Actions" />
          <FlatList
            horizontal
            data={quickActions}
            keyExtractor={item => item.title}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
            renderItem={({ item }) => <QuickActionPill {...item} />}
          />
        </View>

        {/* ── Recent Professional Tenders ───────────────────────────── */}
        <View style={[S.section, { marginTop: spacing.lg }]}>
          <SectionHeader
            label="Recent Tenders"
            actionLabel={recentTenders.length > 0 ? 'View all' : undefined}
            onAction={() => navigation.navigate('ProfessionalTenders', { screen: 'MyProfessionalTenders' })}
          />

          {profLoading ? (
            <View style={S.recentLoading}>
              <ActivityIndicator size="small" color={c.primary} />
            </View>
          ) : recentTenders.length === 0 ? (
            <View style={[S.emptyRecent, { borderColor: c.border, backgroundColor: c.bgCard, borderRadius: radius.lg }]}>
              <Ionicons name="albums-outline" size={28} color={c.textMuted} />
              <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]}>No tenders yet</Text>
              <Text style={[type.caption, { color: c.textMuted, textAlign: 'center', maxWidth: 260 }]}>
                Create your first tender from the Professional or Freelance tabs.
              </Text>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {recentTenders.map(item => (
                <RecentRow
                  key={item._id}
                  item={item}
                  onPress={() =>
                    navigation.navigate('ProfessionalTenders', {
                      screen: 'ProfessionalTenderDetail',
                      params: { tenderId: item._id },
                    })
                  }
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Browse CTA (company only) ─────────────────────────────── */}
        {isCompany && (
          <View style={[S.section, { marginTop: spacing.lg }]}>
            <Pressable
              onPress={() => navigation.navigate('ProfessionalTenders', { screen: 'BrowseProfessionalTenders' })}
              style={({ pressed }) => [
                S.browseCta,
                {
                  backgroundColor: withAlpha(c.primary, 0.1),
                  borderColor: withAlpha(c.primary, 0.3),
                  borderRadius: radius.lg,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.bodySm, { color: c.primary, fontWeight: '800' }]}>Browse Open Tenders</Text>
                <Text style={[type.caption, { color: c.textMuted, marginTop: 3 }]}>
                  Discover and bid on tenders from other organizations
                </Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={24} color={c.primary} />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  root:          { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 110,
  },
  section:       { paddingHorizontal: 14, gap: 10 },
  statsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentLoading: { padding: 18, alignItems: 'center' },
  emptyRecent:   { alignItems: 'center', padding: 18, borderWidth: 1, borderStyle: 'dashed', gap: 6 },
  browseCta:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1 },
});

export default TendersHomeScreen;