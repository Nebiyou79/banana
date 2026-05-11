// src/screens/shared/ReferralScreen.tsx
// MIGRATED: useTheme() only, AppHeader, spacing/radius tokens, Ionicons only, expo-clipboard

import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Share, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';  // SPEC: expo-clipboard, not deprecated Clipboard
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { AppHeader } from '../../components/ui/AppHeader';
import { ReferralCodeCard }    from '../../components/promo/ReferralCodeCard';
import { ReferralHistoryCard } from '../../components/promo/ReferralHistoryCard';
import { LeaderboardRow }      from '../../components/promo/LeaderboardRow';
import { PromoCodeInput }      from '../../components/promo/PromoCodeInput';
import {
  useMyReferralStats,
  useGenerateReferralCode,
  useLeaderboard,
} from '../../hooks/usePromoCode';
import toast from '../../lib/toast';
import type { ReferralActivityEntry } from '../../services/promoCodeService';

interface Props { navigation: any }

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ width?: number | string; height?: number; radius?: number }> = ({
  width = '100%', height = 16, radius: r = 8,
}) => {
  const { colors: c } = useTheme();
  const anim = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return <Animated.View style={{ width: width as any, height, borderRadius: r, backgroundColor: c.skeleton, opacity: anim }} />;
};

const SkeletonReferral = () => {
  const { spacing } = useTheme();
  return (
    <View style={{ padding: spacing.lg, gap: 14 }}>
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
};

// ─── Mini stat card ───────────────────────────────────────────────────────────
const MiniStat: React.FC<{ label: string; value: string | number; accent?: boolean }> = ({ label, value, accent }) => {
  const { colors: c, radius, spacing, type, shadows } = useTheme();
  return (
    <View style={[ms.card, { backgroundColor: c.surface, borderRadius: radius.lg, borderColor: c.border, ...shadows.sm }]}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: accent ? c.primary : c.text }}>{value}</Text>
      <Text style={[type.caption, { color: c.textMuted, marginTop: 3, textAlign: 'center' }]}>{label}</Text>
    </View>
  );
};
const ms = StyleSheet.create({ card: { flex: 1, alignItems: 'center', padding: 14, borderWidth: 1 } });

// ─── Screen ───────────────────────────────────────────────────────────────────
export const ReferralScreen: React.FC<Props> = ({ navigation }) => {
  const { colors: c, spacing, radius, type, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: stats, isLoading, refetch } = useMyReferralStats();
  const { data: leaderboard = [] }           = useLeaderboard(5);
  const generateCode = useGenerateReferralCode();

  const code = stats?.referralCode?.code;

  const handleShare = useCallback(async () => {
    const msg = stats?.shareable?.text ?? `Join me! Use code: ${code ?? ''} — https://yourapp.com/register?ref=${code ?? ''}`;
    try { await Share.share({ message: msg }); } catch { /* dismissed */ }
  }, [stats, code]);

  const handleCopy = useCallback(async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);  // expo-clipboard
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
      <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <AppHeader title="Referrals & Rewards" showBack onBack={() => navigation.goBack()} />
        <SkeletonReferral />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Referrals & Rewards" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={c.primary} />}
      >
        {/* Referral code card */}
        {code ? (
          <ReferralCodeCard
            code={code}
            stats={stats!.stats}
            onShare={handleShare}
            onCopy={handleCopy}
            isGenerating={generateCode.isPending}
          />
        ) : (
          <View style={[S.generateBox, {
            backgroundColor: c.surface,
            borderRadius:    radius.xl,
            borderColor:     c.border,
            margin:          spacing.lg,
            ...shadows.md,
          }]}>
            <Ionicons name="gift-outline" size={52} color={c.primary} />
            <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginTop: spacing.md }]}>
              Get Your Referral Code
            </Text>
            <Text style={[type.caption, { color: c.textMuted, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.lg, lineHeight: 20 }]}>
              Earn reward points every time a friend signs up using your unique code.
            </Text>
            <TouchableOpacity
              onPress={() => generateCode.mutate()}
              disabled={generateCode.isPending}
              style={[S.genBtn, {
                backgroundColor: generateCode.isPending ? withAlpha(c.primary, 0.6) : c.primary,
                borderRadius:    radius.lg,
              }]}
            >
              <Ionicons name="gift-outline" size={18} color={c.textInverse} />
              <Text style={[type.bodySm, { color: c.textInverse, fontWeight: '700', marginLeft: spacing.sm }]}>
                {generateCode.isPending ? 'Generating…' : 'Generate My Code'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mini stats */}
        {stats && (
          <View style={[S.miniStatRow, { paddingHorizontal: spacing.lg }]}>
            <MiniStat label="Total Referred"   value={stats.stats.totalReferrals} />
            <MiniStat label="Completed"         value={stats.stats.completedReferrals} />
            <MiniStat label="Points"            value={stats.stats.rewardPoints.toLocaleString()} accent />
          </View>
        )}

        {/* Promo code input */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
          <PromoCodeInput />
        </View>

        {/* Referral history */}
        <View style={[S.section, { marginTop: spacing.xl }]}>
          <Text style={[type.bodySm, { color: c.text, fontWeight: '700', paddingHorizontal: spacing.lg, marginBottom: spacing.md }]}>
            Referral History
          </Text>
          {(stats?.recentActivity ?? []).length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Ionicons name="people-outline" size={44} color={c.border} />
              <Text style={[type.bodySm, { color: c.textMuted, marginTop: spacing.md, textAlign: 'center' }]}>
                No referrals yet. Share your code to get started!
              </Text>
            </View>
          ) : (
            <FlashList
              data={stats!.recentActivity}
              scrollEnabled={false}
              renderItem={renderHistoryItem}
              keyExtractor={item => item.id}
            />
          )}
        </View>

        {/* Leaderboard preview */}
        <View style={[S.section, { marginTop: spacing.xl }]}>
          <View style={S.sectionHeaderRow}>
            <Text style={[type.bodySm, { color: c.text, fontWeight: '700', paddingHorizontal: spacing.lg }]}>Top Referrers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')} style={{ paddingHorizontal: spacing.lg }} hitSlop={8}>
              <Text style={[type.bodySm, { color: c.primary, fontWeight: '600' }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {leaderboard.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="trophy-outline" size={36} color={c.border} />
              <Text style={[type.bodySm, { color: c.textMuted, marginTop: spacing.sm }]}>Leaderboard is empty</Text>
            </View>
          ) : (
            <FlashList
              data={leaderboard.slice(0, 5)}
              scrollEnabled={false}
              renderItem={renderLeaderItem}
              keyExtractor={(item, i) => item._id ?? String(i)}
            />
          )}
        </View>

        {/* How it works */}
        <View style={[S.section, { marginTop: spacing.xl }]}>
          <Text style={[type.bodySm, { color: c.text, fontWeight: '700', paddingHorizontal: spacing.lg, marginBottom: spacing.md }]}>
            How It Works
          </Text>
          {[
            { icon: 'link-outline' as const,   title: 'Share your code',  desc: 'Send your unique code to friends via any channel' },
            { icon: 'create-outline' as const,  title: 'Friend registers', desc: 'They sign up using your referral code' },
            { icon: 'gift-outline' as const,    title: 'You both earn',    desc: 'Get reward points when they verify their email' },
          ].map((step, i) => (
            <View
              key={i}
              style={[S.howStep, {
                backgroundColor: c.surface,
                borderRadius:    radius.md,
                borderColor:     c.border,
                marginHorizontal: spacing.lg,
                marginBottom:    spacing.sm,
                ...shadows.sm,
              }]}
            >
              <Ionicons name={step.icon} size={28} color={c.primary} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]}>{step.title}</Text>
                <Text style={[type.caption, { color: c.textMuted, marginTop: 2, lineHeight: 15 }]}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  safe:           { flex: 1 },
  generateBox:    { padding: 28, alignItems: 'center', borderWidth: 1 },
  genBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingHorizontal: 28, paddingVertical: 14, minWidth: 200 },
  miniStatRow:    { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 12 },
  section:        {},
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  howStep:        { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1 },
});

export default ReferralScreen;