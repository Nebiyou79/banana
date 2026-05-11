// src/screens/shared/LeaderboardScreen.tsx
// MIGRATED: useTheme() only, AppHeader, spacing/radius tokens, Ionicons only, FlashList

import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar, RefreshControl, ScrollView, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { AppHeader } from '../../components/ui/AppHeader';
import { useLeaderboard } from '../../hooks/usePromoCode';
import type { LeaderboardEntry } from '../../services/promoCodeService';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ width?: number | string; height?: number; radius?: number }> = ({
  width = '100%', height = 16, radius: r = 8,
}) => {
  const { colors: c } = useTheme();
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
    <Animated.View style={{ width: width as any, height, borderRadius: r, backgroundColor: c.skeleton, opacity: anim }} />
  );
};

// ─── Medal config ─────────────────────────────────────────────────────────────
const MEDAL: Record<number, { bg: string; border: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  1: { bg: '#FEF3C7', border: '#F59E0B', label: '#B45309', icon: 'trophy'  },
  2: { bg: '#F1F5F9', border: '#94A3B8', label: '#475569', icon: 'medal'   },
  3: { bg: '#FEF3C7', border: '#D97706', label: '#92400E', icon: 'ribbon'  },
};

const ACCENT = '#F59E0B';

const getInitials = (name?: string) =>
  (name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// ─── Podium Card ──────────────────────────────────────────────────────────────
const PodiumCard: React.FC<{ entry: LeaderboardEntry; rank: 1 | 2 | 3 }> = React.memo(({ entry, rank }) => {
  const { colors: c, radius, type } = useTheme();
  const m       = MEDAL[rank];
  const isFirst = rank === 1;

  return (
    <View style={[
      pod.card,
      {
        backgroundColor: m.bg,
        borderColor:     m.border,
        borderRadius:    radius.lg,
        transform:       [{ scale: isFirst ? 1.05 : 1 }],
        marginTop:       isFirst ? 0 : 16,
      },
    ]}>
      <Ionicons name={m.icon} size={26} color={m.label} />

      {entry.avatar ? (
        <Image source={{ uri: entry.avatar }} style={[pod.avatar, { borderColor: m.border }]} />
      ) : (
        <View style={[pod.avatar, pod.avatarFallback, { backgroundColor: withAlpha(m.border, 0.6), borderColor: m.border }]}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: m.label }}>{getInitials(entry.name)}</Text>
        </View>
      )}

      <Text style={[pod.name, { color: m.label }]} numberOfLines={1}>{entry.name}</Text>

      <View style={[pod.statPill, { backgroundColor: withAlpha(m.border, 0.20) }]}>
        <Ionicons name="people-outline" size={11} color={m.label} />
        <Text style={[pod.statText, { color: m.label }]}>{entry.totalReferrals} referrals</Text>
      </View>

      {entry.rewardPoints ? (
        <Text style={[pod.points, { color: m.label }]}>{entry.rewardPoints.toLocaleString()} pts</Text>
      ) : null}
    </View>
  );
});

const pod = StyleSheet.create({
  card:          { flex: 1, alignItems: 'center', borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 6 },
  avatar:        { width: 52, height: 52, borderRadius: 26, borderWidth: 2 },
  avatarFallback:{ alignItems: 'center', justifyContent: 'center' },
  name:          { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  statPill:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statText:      { fontSize: 10, fontWeight: '600' },
  points:        { fontSize: 11, fontWeight: '800' },
});

// ─── List Row ─────────────────────────────────────────────────────────────────
const LeaderRow: React.FC<{ entry: LeaderboardEntry; rank: number }> = React.memo(({ entry, rank }) => {
  const { colors: c, radius, type, spacing } = useTheme();
  return (
    <View style={[row.card, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.md, marginBottom: spacing.sm }]}>
      <View style={[row.rankBox, { backgroundColor: withAlpha(c.border, 0.4), borderRadius: radius.sm }]}>
        <Text style={[type.bodySm, { fontWeight: '800', color: c.textMuted }]}>#{rank}</Text>
      </View>

      {entry.avatar ? (
        <Image source={{ uri: entry.avatar }} style={row.avatar} />
      ) : (
        <View style={[row.avatar, row.avatarFallback, { backgroundColor: withAlpha(ACCENT, 0.20) }]}>
          <Text style={{ fontWeight: '800', fontSize: 14, color: ACCENT }}>{getInitials(entry.name)}</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]} numberOfLines={1}>{entry.name}</Text>
        {entry.email ? (
          <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>{entry.email}</Text>
        ) : null}
      </View>

      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: c.text }}>{entry.totalReferrals}</Text>
        <Text style={[type.caption, { color: c.textMuted }]}>referrals</Text>
        {entry.rewardPoints ? (
          <Text style={[type.caption, { color: ACCENT, fontWeight: '700' }]}>{entry.rewardPoints.toLocaleString()} pts</Text>
        ) : null}
      </View>
    </View>
  );
});

const row = StyleSheet.create({
  card:          { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 12 },
  rankBox:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatar:        { width: 42, height: 42, borderRadius: 21 },
  avatarFallback:{ alignItems: 'center', justifyContent: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const LeaderboardScreen: React.FC = () => {
  const { colors: c, spacing, radius, type, shadows } = useTheme();
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const { data: entries = [], isLoading, refetch } = useLeaderboard(50);

  const top3 = entries.slice(0, 3) as LeaderboardEntry[];
  const rest = entries.slice(3)   as LeaderboardEntry[];

  const renderRow = useCallback(
    ({ item, index }: { item: LeaderboardEntry; index: number }) => (
      <LeaderRow entry={item} rank={index + 4} />
    ),
    [],
  );

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <AppHeader
        title="Leaderboard"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={() => refetch()} hitSlop={8}>
            <Ionicons name="refresh-outline" size={22} color={c.textMuted} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={{ padding: spacing.lg, gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 10, height: 160 }}>
            <Skeleton radius={16} />
            <Skeleton radius={16} />
            <Skeleton radius={16} />
          </View>
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
        <View style={S.empty}>
          <Ionicons name="trophy-outline" size={64} color={c.border} />
          <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginTop: spacing.lg }]}>No entries yet</Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: spacing.sm, textAlign: 'center', lineHeight: 18 }]}>
            Be the first to refer friends and{'\n'}claim the top spot!
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={ACCENT} />}
        >
          {/* Banner */}
          <View style={[S.banner, { backgroundColor: withAlpha(ACCENT, 0.12), borderColor: withAlpha(ACCENT, 0.30), borderRadius: radius.xl }]}>
            <Ionicons name="trophy-outline" size={28} color={ACCENT} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[type.bodySm, { color: c.text, fontWeight: '800' }]}>Top Referrers</Text>
              <Text style={[type.caption, { color: c.textMuted, marginTop: 2, lineHeight: 16 }]}>
                Refer friends to climb the ranks and earn more reward points.
              </Text>
            </View>
          </View>

          {/* Podium */}
          {top3.length > 0 && (
            <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
              <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginBottom: spacing.md }]}>Top 3</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {top3[1] && <PodiumCard entry={top3[1]} rank={2} />}
                {top3[0] && <PodiumCard entry={top3[0]} rank={1} />}
                {top3[2] && <PodiumCard entry={top3[2]} rank={3} />}
              </View>
            </View>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <View>
              <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginBottom: spacing.md }]}>Full Rankings</Text>
              <FlashList
                data={rest}
                scrollEnabled={false}
                renderItem={renderRow}
                keyExtractor={(item, i) => item._id ?? String(i)}
              />
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Referral')}
            style={[S.ctaBtn, { backgroundColor: ACCENT, borderRadius: radius.xl, ...shadows.md }]}
          >
            <Ionicons name="gift-outline" size={18} color={c.bg} />
            <Text style={[type.bodySm, { color: c.bg, fontWeight: '700', marginLeft: spacing.sm }]}>
              Go to My Referrals
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  safe:   { flex: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1 },
  empty:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 24 },
});

export default LeaderboardScreen;