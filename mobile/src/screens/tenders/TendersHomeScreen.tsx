// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/tenders/TendersHomeScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Tab-1 Home / Dashboard for the new Tenders flow.
//
//  Role-aware: a 'company' or 'organization' header label.
//  Pulls stats from the My Tenders hook (free at this stage — already cached
//  by the My-Tenders screen, no extra round-trip for typical navigation).
//
//  Sections:
//    • Greeting + role badge
//    • Tender stats (4 tiles)
//    • Bid activity (small strip)
//    • Quick-action grid (jump to all 6 tabs)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../store/themeStore';
import { useMyPostedProfessionalTenders } from '../../hooks/useProfessionalTender';
import type {
  ProfessionalTenderListItem,
  ProfessionalTenderStatus,
} from '../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  PROPS — userRole drives copy + role badge
// ═════════════════════════════════════════════════════════════════════════════

export type TendersHomeRole = 'company' | 'organization';

interface TendersHomeScreenProps {
  userRole: TendersHomeRole;
}

// ═════════════════════════════════════════════════════════════════════════════
//  STAT TILE
// ═════════════════════════════════════════════════════════════════════════════

const StatTile: React.FC<{
  label: string;
  value: number | string;
  icon: string;
  tone: 'blue' | 'green' | 'amber' | 'purple';
  loading?: boolean;
}> = ({ label, value, icon, tone, loading }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);

  const toneColor = (() => {
    if (isDark) {
      switch (tone) {
        case 'blue':   return { fg: '#60A5FA', bg: 'rgba(59,130,246,0.12)' };
        case 'green':  return { fg: '#34D399', bg: 'rgba(34,197,94,0.12)' };
        case 'amber':  return { fg: '#FCD34D', bg: 'rgba(245,158,11,0.12)' };
        case 'purple': return { fg: '#D8B4FE', bg: 'rgba(168,85,247,0.12)' };
      }
    }
    switch (tone) {
      case 'blue':   return { fg: '#2563EB', bg: '#DBEAFE' };
      case 'green':  return { fg: '#16A34A', bg: '#D1FAE5' };
      case 'amber':  return { fg: '#B45309', bg: '#FEF3C7' };
      case 'purple': return { fg: '#7C3AED', bg: '#EDE9FE' };
    }
  })();

  const palette = isDark
    ? { surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8' }
    : { surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B' };

  return (
    <View style={[tileStyles.root, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={tileStyles.head}>
        <View style={[tileStyles.iconWrap, { backgroundColor: toneColor.bg }]}>
          <Ionicons name={icon as any} size={16} color={toneColor.fg} />
        </View>
        <Text style={[tileStyles.label, { color: palette.muted }]}>{label}</Text>
      </View>
      {loading ? (
        <View style={[tileStyles.skel, { backgroundColor: palette.border }]} />
      ) : (
        <Text style={[tileStyles.value, { color: palette.text }]}>{value}</Text>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  QUICK-ACTION CARD
// ═════════════════════════════════════════════════════════════════════════════

const ActionCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  badge?: number;
}> = ({ title, description, icon, onPress, badge }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', accent: '#60A5FA', badgeBg: '#60A5FA', badgeFg: '#0F172A' }
    : { surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', accent: '#2563EB', badgeBg: '#2563EB', badgeFg: '#FFFFFF' };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        actionStyles.root,
        { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.92 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={actionStyles.head}>
        <Ionicons name={icon as any} size={22} color={palette.accent} />
        {badge !== undefined && badge > 0 && (
          <View style={[actionStyles.badge, { backgroundColor: palette.badgeBg }]}>
            <Text style={[actionStyles.badgeText, { color: palette.badgeFg }]}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text style={[actionStyles.title, { color: palette.text }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[actionStyles.desc, { color: palette.muted }]} numberOfLines={2}>
        {description}
      </Text>
    </Pressable>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  RECENT ACTIVITY ROW
// ═════════════════════════════════════════════════════════════════════════════

const RecentRow: React.FC<{
  item: ProfessionalTenderListItem;
  onPress: () => void;
}> = ({ item, onPress }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8' }
    : { surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B' };

  const statusColor: Record<ProfessionalTenderStatus, string> = {
    draft:            isDark ? '#94A3B8' : '#64748B',
    published:        isDark ? '#34D399' : '#16A34A',
    locked:           isDark ? '#FCD34D' : '#B45309',
    deadline_reached: isDark ? '#FDBA74' : '#C2410C',
    revealed:         isDark ? '#60A5FA' : '#2563EB',
    closed:           isDark ? '#F87171' : '#DC2626',
    cancelled:        isDark ? '#94A3B8' : '#64748B',
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        recentStyles.row,
        { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={[recentStyles.dot, { backgroundColor: statusColor[item.status] }]} />
      <View style={recentStyles.content}>
        <Text style={[recentStyles.title, { color: palette.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[recentStyles.meta, { color: palette.muted }]} numberOfLines={1}>
          {item.bidCount ?? 0} bid{(item.bidCount ?? 0) === 1 ? '' : 's'} · {item.status.replace(/_/g, ' ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={palette.muted} />
    </Pressable>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════════

export const TendersHomeScreen: React.FC<TendersHomeScreenProps> = ({ userRole }) => {
  const navigation = useNavigation<any>();
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = useMemo(
    () => isDark
      ? { bg: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', primary: '#60A5FA', primaryFg: '#0F172A', sectionLabel: '#94A3B8', roleChipBg: '#1E3A5F', roleChipFg: '#93C5FD' }
      : { bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', primary: '#2563EB', primaryFg: '#FFFFFF', sectionLabel: '#475569', roleChipBg: '#DBEAFE', roleChipFg: '#1D4ED8' },
    [isDark],
  );

  // Pull a small page of tenders for the stats + recent activity
  const { data, isLoading, refetch, isFetching } = useMyPostedProfessionalTenders({
    page: 1, limit: 5,
  });

  // ─── Derive stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const tenders = data?.tenders ?? [];
    return {
      total:     data?.pagination?.total ?? tenders.length,
      draft:     tenders.filter((t) => t.status === 'draft').length,
      published: tenders.filter((t) => t.status === 'published' || t.status === 'locked').length,
      bids:      tenders.reduce((sum, t) => sum + (t.bidCount ?? 0), 0),
    };
  }, [data]);

  const recent = data?.tenders.slice(0, 3) ?? [];

  // ─── Tab navigation handler ─────────────────────────────────────────────
  // The bottom tab navigator is the parent; navigate to each tab by name.
  const goToTab = (tabName: string, params?: any) => {
    navigation.navigate(tabName, params);
  };

  const isCompany = userRole === 'company';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={palette.primary} />
        }
      >
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: palette.muted }]}>Welcome back</Text>
              <Text style={[styles.title, { color: palette.text }]}>Tender Center</Text>
            </View>
            <View style={[styles.roleChip, { backgroundColor: palette.roleChipBg }]}>
              <Ionicons
                name={isCompany ? 'business-outline' : 'people-outline'}
                size={12}
                color={palette.roleChipFg}
              />
              <Text style={[styles.roleChipText, { color: palette.roleChipFg }]}>
                {isCompany ? 'Company' : 'Organization'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Tender Stats ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: palette.sectionLabel }]}>
            TENDER PROPOSALS
          </Text>
          <View style={styles.statsRow}>
            <StatTile label="Total"     value={stats.total}     icon="document-text-outline" tone="blue"   loading={isLoading} />
            <StatTile label="Live"      value={stats.published} icon="radio-outline"          tone="green"  loading={isLoading} />
            <StatTile label="Drafts"    value={stats.draft}     icon="create-outline"         tone="amber"  loading={isLoading} />
            <StatTile label="Total Bids" value={stats.bids}     icon="people-outline"         tone="purple" loading={isLoading} />
          </View>
        </View>

        {/* ─── Recent Activity ────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionLabel, { color: palette.sectionLabel }]}>RECENT TENDERS</Text>
            {recent.length > 0 && (
              <Pressable onPress={() => goToTab('ProfessionalTenders')} hitSlop={8}>
                <Text style={[styles.viewAllLink, { color: palette.primary }]}>View all →</Text>
              </Pressable>
            )}
          </View>
          {isLoading ? (
            <View style={styles.recentLoading}>
              <ActivityIndicator size="small" color={palette.primary} />
            </View>
          ) : recent.length === 0 ? (
            <View style={[styles.emptyRecent, { borderColor: palette.border, backgroundColor: palette.surface }]}>
              <Ionicons name="albums-outline" size={28} color={palette.muted} />
              <Text style={[styles.emptyTitle, { color: palette.text }]}>No tenders yet</Text>
              <Text style={[styles.emptyDesc, { color: palette.muted }]}>
                Create your first tender from the Professional or Freelance tabs.
              </Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {recent.map((item) => (
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

        {/* ─── Quick Actions ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: palette.sectionLabel }]}>
            QUICK ACTIONS
          </Text>
          <View style={styles.actionGrid}>
            <ActionCard
              title="New Professional Tender"
              description="Open the 7-step form."
              icon="add-circle-outline"
              onPress={() =>
                navigation.navigate('ProfessionalTenders', {
                  screen: 'CreateProfessionalTender',
                })
              }
            />
            <ActionCard
              title="New Freelance Tender"
              description="Quick post for freelance gigs."
              icon="people-outline"
              onPress={() =>
                navigation.navigate('FreelanceTenders', {
                  screen: 'CreateFreelanceTender',
                })
              }
            />
            {isCompany && (
              <ActionCard
                title="Browse Tenders"
                description="See open tenders from others."
                icon="search-outline"
                onPress={() =>
                  navigation.navigate('ProfessionalTenders', {
                    screen: 'BrowseProfessionalTenders',
                  })
                }
              />
            )}
            <ActionCard
              title="Received Bids"
              description="Bids on your tenders."
              icon="inbox-outline"
              badge={stats.bids}
              onPress={() => goToTab('Bids')}
            />
            <ActionCard
              title="Proposals"
              description="Freelance applicants."
              icon="documents-outline"
              onPress={() => goToTab('Proposals')}
            />
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  greeting: { fontSize: 12 },
  title:    { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },

  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
  },
  roleChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },

  section: { paddingHorizontal: 14, marginTop: 14, gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, paddingHorizontal: 4 },
  viewAllLink:  { fontSize: 12, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  recentList: { gap: 8 },
  recentLoading: { padding: 18, alignItems: 'center' },
  emptyRecent: {
    alignItems: 'center',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyTitle: { fontSize: 13, fontWeight: '700' },
  emptyDesc:  { fontSize: 11, textAlign: 'center', lineHeight: 16, maxWidth: 260 },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

const tileStyles = StyleSheet.create({
  root: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minHeight: 80,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconWrap: {
    width: 24, height: 24,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  value: { fontSize: 22, fontWeight: '800' },
  skel:  { width: 50, height: 22, borderRadius: 6 },
});

const actionStyles = StyleSheet.create({
  root: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    minHeight: 96,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
  title: { fontSize: 13, fontWeight: '700' },
  desc:  { fontSize: 11, lineHeight: 15 },
});

const recentStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 999 },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 13, fontWeight: '600' },
  meta:  { fontSize: 11, marginTop: 1, textTransform: 'capitalize' },
});

export default TendersHomeScreen;
