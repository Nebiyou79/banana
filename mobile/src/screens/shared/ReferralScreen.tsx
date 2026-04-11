/**
 * src/screens/shared/ReferralScreen.tsx
 * Referral hub — accessible from ALL role "More" screens.
 * Shows the user's referral code, stats, history, and leaderboard preview.
 */

import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ReferralCodeCard }    from '../../components/promo/ReferralCodeCard';
import { ReferralHistoryCard } from '../../components/promo/ReferralHistoryCard';
import { LeaderboardRow }      from '../../components/promo/LeaderboardRow';
import {
  useMyReferralStats,
  useGenerateReferralCode,
  useLeaderboard,
} from '../../hooks/usePromoCode';
import { useThemeStore } from '../../store/themeStore';
import toast from '../../lib/toast';

// ─── Props ────────────────────────────────────────────────────────────────────
// Typed loosely because screen is shared across multiple navigators.
interface Props {
  navigation: any;
}

// ─── Mini stat card ───────────────────────────────────────────────────────────
const MiniStat = ({
  label,
  value,
  accent,
  colors,
  borderRadius,
  shadows,
}: {
  label:        string;
  value:        string | number;
  accent?:      boolean;
  colors:       any;
  borderRadius: any;
  shadows:      any;
}) => (
  <View
    style={[
      s.miniStat,
      {
        backgroundColor: colors.card,
        borderRadius:    borderRadius.lg,
        borderColor:     colors.border,
        ...shadows.sm,
      },
    ]}
  >
    <Text
      style={{
        fontSize:   22,
        fontWeight: '800',
        color:      accent ? colors.primary : colors.text,
      }}
    >
      {value}
    </Text>
    <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 3, textAlign: 'center' }}>
      {label}
    </Text>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

export const ReferralScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius, shadows } = theme;

  const {
    data:    stats,
    isLoading: loadingStats,
    refetch,
  } = useMyReferralStats();

  const { data: leaderboard = [] } = useLeaderboard(5);
  const generateCode = useGenerateReferralCode();

  const code = stats?.referralCode?.code;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleShare = async () => {
    const message =
      stats?.shareable?.text ??
      `Join me on Banana! Use my referral code: ${code ?? ''}\nhttps://bananaapp.com/register?ref=${code ?? ''}`;
    try {
      await Share.share({ message });
    } catch { /* cancelled — ignore */ }
  };

  const handleCopy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    toast.success('Referral code copied to clipboard!');
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loadingStats) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: typography.sm }}>
          Loading referral data…
        </Text>
      </SafeAreaView>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text }}>
          Referrals & Rewards
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loadingStats} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* ── Referral code card or "generate" prompt ─────────── */}
        {code ? (
          <ReferralCodeCard
            code={code}
            stats={stats!.stats}
            onShare={handleShare}
            onCopy={handleCopy}
            isGenerating={generateCode.isPending}
          />
        ) : (
          <View
            style={[
              s.generateBox,
              { backgroundColor: colors.card, borderRadius: borderRadius.xl, borderColor: colors.border },
            ]}
          >
            <Text style={{ fontSize: 44 }}>🎁</Text>
            <Text
              style={{
                fontSize:  typography.md,
                fontWeight: '700',
                color:     colors.text,
                marginTop: 14,
              }}
            >
              Get Your Referral Code
            </Text>
            <Text
              style={{
                fontSize:  typography.sm,
                color:     colors.textMuted,
                textAlign: 'center',
                marginTop: 8,
                paddingHorizontal: 16,
                lineHeight: 20,
              }}
            >
              Earn reward points every time a friend signs up using your unique code.
            </Text>

            <TouchableOpacity
              onPress={() => generateCode.mutate()}
              disabled={generateCode.isPending}
              style={[
                s.genBtn,
                {
                  backgroundColor: generateCode.isPending ? colors.primaryLight : colors.primary,
                  borderRadius:    borderRadius.lg,
                },
              ]}
            >
              {generateCode.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="gift-outline" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sm, marginLeft: 8 }}>
                    Generate My Code
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Mini stats ──────────────────────────────────────────── */}
        {stats && (
          <View style={s.miniStatRow}>
            <MiniStat
              label="Total Referred"
              value={stats.stats.totalReferrals}
              colors={colors}
              borderRadius={borderRadius}
              shadows={shadows}
            />
            <MiniStat
              label="Completed"
              value={stats.stats.completedReferrals}
              colors={colors}
              borderRadius={borderRadius}
              shadows={shadows}
            />
            <MiniStat
              label="Points"
              value={stats.stats.rewardPoints.toLocaleString()}
              accent
              colors={colors}
              borderRadius={borderRadius}
              shadows={shadows}
            />
          </View>
        )}

        {/* ── Referral history ─────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>
            Referral History
          </Text>
          {(stats?.recentActivity ?? []).length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Ionicons name="people-outline" size={44} color={colors.border} />
              <Text style={{ color: colors.textMuted, marginTop: 10, fontSize: typography.sm }}>
                No referrals yet. Share your code to get started!
              </Text>
            </View>
          ) : (
            stats!.recentActivity.map(entry => (
              <ReferralHistoryCard key={entry.id} entry={entry} />
            ))
          )}
        </View>

        {/* ── Leaderboard preview ──────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>
              Top Referrers
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
              <Text style={{ fontSize: typography.sm, color: colors.primary, fontWeight: '600' }}>
                See All →
              </Text>
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
            leaderboard.slice(0, 5).map((entry, i) => (
              <LeaderboardRow
                key={entry._id ?? i}
                entry={entry}
                rank={i + 1}
                isCurrentUser={stats?.user?.name === entry.name}
              />
            ))
          )}
        </View>

        {/* ── How it works ─────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>
            How It Works
          </Text>
          {[
            { emoji: '🔗', title: 'Share your code', desc: 'Send your unique code to friends via any channel' },
            { emoji: '📝', title: 'Friend registers', desc: 'They sign up using your referral code' },
            { emoji: '🎉', title: 'You both earn',   desc: 'Get reward points when they verify their email' },
          ].map((step, i) => (
            <View
              key={i}
              style={[
                s.howStep,
                { backgroundColor: colors.card, borderRadius: borderRadius.md, borderColor: colors.border },
              ]}
            >
              <Text style={{ fontSize: 28 }}>{step.emoji}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: typography.sm, fontWeight: '700', color: colors.text }}>
                  {step.title}
                </Text>
                <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 2 }}>
                  {step.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
  },
  generateBox: {
    margin:   16,
    padding:  28,
    alignItems: 'center',
    borderWidth: 1,
  },
  genBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      20,
    paddingHorizontal: 28,
    paddingVertical:   14,
    minWidth: 200,
  },
  miniStatRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  miniStat: {
    flex:       1,
    alignItems: 'center',
    padding:    12,
    borderWidth: 1,
  },
  section: { marginTop: 24 },
  sectionTitle: {
    fontSize:   15,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: 16,
    marginBottom:   10,
  },
  howStep: {
    flexDirection:    'row',
    alignItems:       'center',
    padding:          14,
    marginHorizontal: 16,
    marginBottom:     8,
    borderWidth:      1,
  },
});