/**
 * src/screens/shared/ReferralScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Referral hub — accessible from ALL role "More" screens.
 * Upgrades: FlashList for history, Skeleton loading, PromoCodeInput component.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ReferralCodeCard }    from '../../components/promo/ReferralCodeCard';
import { ReferralHistoryCard } from '../../components/promo/ReferralHistoryCard';
import { LeaderboardRow }      from '../../components/promo/LeaderboardRow';
import { PromoCodeInput }      from '../../components/promo/PromoCodeInput';
import {
  useMyReferralStats,
  useGenerateReferralCode,
  useLeaderboard,
} from '../../hooks/usePromoCode';
import { useThemeStore } from '../../store/themeStore';
import toast from '../../lib/toast';
import type { ReferralActivityEntry } from '../../services/promoCodeService';

interface Props { navigation: any }

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ width?: number | string; height?: number; radius?: number }> = ({
  width = '100%', height = 16, radius = 8,
}) => {
  const { theme } = useThemeStore();
  const anim = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return <Animated.View style={{ width, height, borderRadius: radius, backgroundColor: theme.colors.border, opacity: anim }} />;
};

const SkeletonReferral = () => (
  <View style={{ padding: 16, gap: 14 }}>
    <Skeleton height={120} radius={16} />
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Skeleton height={72} radius={12} />
      <Skeleton height={72} radius={12} />
      <Skeleton height={72} radius={12} />
    </View>
    {[...Array(3)].map((_, i) => (
      <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Skeleton width={44} height={44} radius={10} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={13} width="60%" />
          <Skeleton height={11} width="40%" />
        </View>
      </View>
    ))}
  </View>
);

// ─── Mini stat card ───────────────────────────────────────────────────────────

const MiniStat: React.FC<{
  label: string; value: string | number; accent?: boolean;
}> = ({ label, value, accent }) => {
  const { theme: { colors, borderRadius, shadows } } = useThemeStore();
  return (
    <View style={[ms.card, { backgroundColor: colors.card, borderRadius: borderRadius.lg, borderColor: colors.border, ...shadows.sm }]}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: accent ? colors.primary : colors.text }}>
        {value}
      </Text>
      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 3, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
};

const ms = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', padding: 14, borderWidth: 1 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export const ReferralScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius, shadows } = theme;

  const { data: stats, isLoading, refetch } = useMyReferralStats();
  const { data: leaderboard = [] }          = useLeaderboard(5);
  const generateCode = useGenerateReferralCode();

  const code = stats?.referralCode?.code;

  const handleShare = useCallback(async () => {
    const msg = stats?.shareable?.text ?? `Join me! Use code: ${code ?? ''} — https://yourapp.com/register?ref=${code ?? ''}`;
    try { await Share.share({ message: msg }); } catch { /* dismissed */ }
  }, [stats, code]);

  const handleCopy = useCallback(async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    toast.success('Code copied!');
  }, [code]);

  const renderHistoryItem = useCallback(({ item }: { item: ReferralActivityEntry }) => (
    <ReferralHistoryCard entry={item} />
  ), []);

  const renderLeaderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <LeaderboardRow entry={item} rank={index + 1} isCurrentUser={stats?.user?.name === item.name} />
  ), [stats]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text }}>
            Referrals & Rewards
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <SkeletonReferral />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text }}>
          Referrals & Rewards
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* ── Referral code card or generate prompt ─── */}
        {code ? (
          <ReferralCodeCard
            code={code}
            stats={stats!.stats}
            onShare={handleShare}
            onCopy={handleCopy}
            isGenerating={generateCode.isPending}
          />
        ) : (
          <View style={[s.generateBox, { backgroundColor: colors.card, borderRadius: borderRadius.xl, borderColor: colors.border, margin: 16, ...shadows.md }]}>
            <Text style={{ fontSize: 44 }}>🎁</Text>
            <Text style={{ fontSize: typography.md, fontWeight: '700', color: colors.text, marginTop: 14 }}>
              Get Your Referral Code
            </Text>
            <Text style={{ fontSize: typography.sm, color: colors.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 16, lineHeight: 20 }}>
              Earn reward points every time a friend signs up using your unique code.
            </Text>
            <TouchableOpacity
              onPress={() => generateCode.mutate()}
              disabled={generateCode.isPending}
              style={[s.genBtn, { backgroundColor: generateCode.isPending ? colors.primaryLight : colors.primary, borderRadius: borderRadius.lg }]}
            >
              <Ionicons name="gift-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sm, marginLeft: 8 }}>
                {generateCode.isPending ? 'Generating…' : 'Generate My Code'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Mini stats ─────── */}
        {stats && (
          <View style={s.miniStatRow}>
            <MiniStat label="Total Referred"  value={stats.stats.totalReferrals} />
            <MiniStat label="Completed"        value={stats.stats.completedReferrals} />
            <MiniStat label="Points"           value={stats.stats.rewardPoints.toLocaleString()} accent />
          </View>
        )}

        {/* ── Promo code input ─── */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <PromoCodeInput />
        </View>

        {/* ── Referral history ─── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Referral History</Text>
          {(stats?.recentActivity ?? []).length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Ionicons name="people-outline" size={44} color={colors.border} />
              <Text style={{ color: colors.textMuted, marginTop: 10, fontSize: typography.sm, textAlign: 'center' }}>
                No referrals yet. Share your code to get started!
              </Text>
            </View>
          ) : (
            <FlashList
              data={stats!.recentActivity}
              estimatedItemSize={72}
              scrollEnabled={false}
              renderItem={renderHistoryItem}
              keyExtractor={item => item.id}
            />
          )}
        </View>

        {/* ── Leaderboard preview ─── */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Top Referrers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
              <Text style={{ fontSize: typography.sm, color: colors.primary, fontWeight: '600' }}>See All →</Text>
            </TouchableOpacity>
          </View>

          {leaderboard.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="trophy-outline" size={36} color={colors.border} />
              <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: typography.sm }}>
                Leaderboard is empty
              </Text>
            </View>
          ) : (
            <FlashList
              data={leaderboard.slice(0, 5)}
              estimatedItemSize={60}
              scrollEnabled={false}
              renderItem={renderLeaderItem}
              keyExtractor={(item, i) => item._id ?? String(i)}
            />
          )}
        </View>

        {/* ── How it works ─── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>How It Works</Text>
          {[
            { emoji: '🔗', title: 'Share your code',  desc: 'Send your unique code to friends via any channel' },
            { emoji: '📝', title: 'Friend registers', desc: 'They sign up using your referral code' },
            { emoji: '🎉', title: 'You both earn',    desc: 'Get reward points when they verify their email' },
          ].map((step, i) => (
            <View key={i} style={[s.howStep, { backgroundColor: colors.card, borderRadius: borderRadius.md, borderColor: colors.border, ...shadows.sm }]}>
              <Text style={{ fontSize: 28 }}>{step.emoji}</Text>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: typography.sm, fontWeight: '700', color: colors.text }}>{step.title}</Text>
                <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 2, lineHeight: 15 }}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  generateBox:    { padding: 28, alignItems: 'center', borderWidth: 1 },
  genBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingHorizontal: 28, paddingVertical: 14, minWidth: 200 },
  miniStatRow:    { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 4, marginBottom: 12 },
  section:        { marginTop: 24 },
  sectionTitle:   { fontSize: 15, fontWeight: '700', paddingHorizontal: 16, marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  howStep:        { flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 16, marginBottom: 8, borderWidth: 1 },
});
