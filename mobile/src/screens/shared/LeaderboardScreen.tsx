/**
 * src/screens/shared/LeaderboardScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Public referral leaderboard — ranks users by total referrals.
 * Top 3 get podium cards; the rest render in a FlashList.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  RefreshControl,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { FlashList }     from '@shopify/flash-list';
import { Ionicons }      from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { useLeaderboard } from '../../hooks/usePromoCode';
import type { LeaderboardEntry } from '../../services/promoCodeService';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ width?: number | string; height?: number; radius?: number }> = ({
  width = '100%', height = 16, radius = 8,
}) => {
  const { theme } = useThemeStore();
  const anim = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <Animated.View
      style={{
        width: width as any,
        height,
        borderRadius: radius,
        backgroundColor: theme.colors.border,
        opacity: anim,
      }}
    />
  );
};

// ─── Medal colours ────────────────────────────────────────────────────────────

const MEDAL: Record<number, { bg: string; border: string; label: string; icon: string }> = {
  1: { bg: '#FEF3C7', border: '#F59E0B', label: '#B45309', icon: '🥇' },
  2: { bg: '#F1F5F9', border: '#94A3B8', label: '#475569', icon: '🥈' },
  3: { bg: '#FEF3C7', border: '#D97706', label: '#92400E', icon: '🥉' },
};

const ACCENT = '#F59E0B';

// ─── Initials helper ──────────────────────────────────────────────────────────

const getInitials = (name?: string) =>
  (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// ─── Podium Card (ranks 1–3) ─────────────────────────────────────────────────

const PodiumCard: React.FC<{
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  colors: any;
}> = React.memo(({ entry, rank, colors: c }) => {
  const m = MEDAL[rank];
  const isFirst = rank === 1;

  return (
    <View
      style={[
        pod.card,
        {
          backgroundColor: m.bg,
          borderColor:     m.border,
          transform: [{ scale: isFirst ? 1.05 : 1 }],
          marginTop: isFirst ? 0 : 16,
        },
      ]}
    >
      {/* Rank emoji */}
      <Text style={pod.medal}>{m.icon}</Text>

      {/* Avatar */}
      {entry.avatar ? (
        <Image source={{ uri: entry.avatar }} style={[pod.avatar, { borderColor: m.border }]} />
      ) : (
        <View style={[pod.avatar, pod.avatarFallback, { backgroundColor: m.border + '60', borderColor: m.border }]}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: m.label }}>
            {getInitials(entry.name)}
          </Text>
        </View>
      )}

      {/* Name */}
      <Text style={[pod.name, { color: m.label }]} numberOfLines={1}>
        {entry.name}
      </Text>

      {/* Stats */}
      <View style={[pod.statPill, { backgroundColor: m.border + '20' }]}>
        <Ionicons name="people-outline" size={11} color={m.label} />
        <Text style={[pod.statText, { color: m.label }]}>
          {entry.totalReferrals} referrals
        </Text>
      </View>

      {entry.rewardPoints ? (
        <Text style={[pod.points, { color: m.label }]}>
          {entry.rewardPoints.toLocaleString()} pts
        </Text>
      ) : null}
    </View>
  );
});

const pod = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
  },
  medal:        { fontSize: 26 },
  avatar:       { width: 52, height: 52, borderRadius: 26, borderWidth: 2 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  name:         { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  statPill:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statText:     { fontSize: 10, fontWeight: '600' },
  points:       { fontSize: 11, fontWeight: '800' },
});

// ─── List Row (rank 4+) ───────────────────────────────────────────────────────

const LeaderRow: React.FC<{
  entry: LeaderboardEntry;
  rank: number;
  colors: any;
}> = React.memo(({ entry, rank, colors: c }) => (
  <View style={[row.card, { backgroundColor: c.card, borderColor: c.border }]}>
    {/* Rank */}
    <View style={[row.rankBox, { backgroundColor: c.border + '40' }]}>
      <Text style={{ fontSize: 13, fontWeight: '800', color: c.textMuted }}>#{rank}</Text>
    </View>

    {/* Avatar */}
    {entry.avatar ? (
      <Image source={{ uri: entry.avatar }} style={row.avatar} />
    ) : (
      <View style={[row.avatar, row.avatarFallback, { backgroundColor: ACCENT + '20' }]}>
        <Text style={{ fontWeight: '800', fontSize: 14, color: ACCENT }}>
          {getInitials(entry.name)}
        </Text>
      </View>
    )}

    {/* Info */}
    <View style={{ flex: 1 }}>
      <Text style={[row.name, { color: c.text }]} numberOfLines={1}>
        {entry.name}
      </Text>
      {entry.email ? (
        <Text style={[row.email, { color: c.textMuted }]} numberOfLines={1}>
          {entry.email}
        </Text>
      ) : null}
    </View>

    {/* Stats */}
    <View style={{ alignItems: 'flex-end', gap: 2 }}>
      <Text style={[row.referrals, { color: c.text }]}>
        {entry.totalReferrals}
      </Text>
      <Text style={{ fontSize: 10, color: c.textMuted }}>referrals</Text>
      {entry.rewardPoints ? (
        <Text style={{ fontSize: 10, color: ACCENT, fontWeight: '700' }}>
          {entry.rewardPoints.toLocaleString()} pts
        </Text>
      ) : null}
    </View>
  </View>
));

const row = StyleSheet.create({
  card:          { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8 },
  rankBox:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatar:        { width: 42, height: 42, borderRadius: 21 },
  avatarFallback:{ alignItems: 'center', justifyContent: 'center' },
  name:          { fontSize: 14, fontWeight: '700' },
  email:         { fontSize: 11, marginTop: 1 },
  referrals:     { fontSize: 18, fontWeight: '800' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export const LeaderboardScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, borderRadius, shadows } = theme;
  const navigation = useNavigation<any>();

  const { data: entries = [], isLoading, refetch } = useLeaderboard(50);

  const top3   = entries.slice(0, 3) as LeaderboardEntry[];
  const rest   = entries.slice(3)   as LeaderboardEntry[];

  const renderRow = useCallback(
    ({ item, index }: { item: LeaderboardEntry; index: number }) => (
      <LeaderRow entry={item} rank={index + 4} colors={colors} />
    ),
    [colors],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.banana ?? colors.background }}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primary ?? colors.background}
      />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="trophy-outline" size={20} color={ACCENT} />
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
            Leaderboard
          </Text>
        </View>
        <TouchableOpacity onPress={() => refetch()}>
          <Ionicons name="refresh-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        /* Skeleton state */
        <View style={{ padding: 16, gap: 14 }}>
          {/* Podium skeleton */}
          <View style={{ flexDirection: 'row', gap: 10, height: 160 }}>
            <Skeleton radius={16} />
            <Skeleton radius={16} />
            <Skeleton radius={16} />
          </View>
          {/* List skeleton */}
          {[...Array(6)].map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Skeleton width={36} height={36} radius={10} />
              <Skeleton width={42} height={42} radius={21} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton height={14} width="60%" />
                <Skeleton height={11} width="40%" />
              </View>
              <Skeleton width={48} height={36} radius={8} />
            </View>
          ))}
        </View>
      ) : entries.length === 0 ? (
        /* Empty state */
        <View style={s.empty}>
          <Ionicons name="trophy-outline" size={64} color={colors.border} />
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 16 }}>
            No entries yet
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 18 }}>
            Be the first to refer friends and{'\n'}claim the top spot!
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={ACCENT} />
          }
        >
          {/* ── Banner ─────────────────────────────────────── */}
          <View
            style={[
              s.banner,
              {
                backgroundColor: ACCENT + '12',
                borderColor: ACCENT + '30',
                borderRadius: borderRadius.xl,
              },
            ]}
          >
            <Text style={{ fontSize: 28 }}>🏆</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                Top Referrers
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 16 }}>
                Refer friends to climb the ranks and earn more reward points.
              </Text>
            </View>
          </View>

          {/* ── Podium (top 3) ──────────────────────────────── */}
          {top3.length > 0 && (
            <View style={{ marginTop: 20, marginBottom: 24 }}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Top 3</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                {/* Rank 2 */}
                {top3[1] && (
                  <PodiumCard entry={top3[1]} rank={2} colors={colors} />
                )}
                {/* Rank 1 — centre, elevated */}
                {top3[0] && (
                  <PodiumCard entry={top3[0]} rank={1} colors={colors} />
                )}
                {/* Rank 3 */}
                {top3[2] && (
                  <PodiumCard entry={top3[2]} rank={3} colors={colors} />
                )}
              </View>
            </View>
          )}

          {/* ── Rest of the list ────────────────────────────── */}
          {rest.length > 0 && (
            <View>
              <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
                Full Rankings
              </Text>
              <FlashList
                data={rest}
                scrollEnabled={false}
                renderItem={renderRow}
                keyExtractor={(item, i) => item._id ?? String(i)}
              />
            </View>
          )}

          {/* ── CTA ─────────────────────────────────────────── */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Referral')}
            style={[
              s.ctaBtn,
              {
                backgroundColor: ACCENT,
                borderRadius: borderRadius.xl,
                ...(shadows?.md ?? {}),
              },
            ]}
          >
            <Ionicons name="gift-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 8 }}>
              Go to My Referrals
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  banner:      { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1 },
  sectionTitle:{ fontSize: 15, fontWeight: '700' },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  ctaBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 24 },
});