// LeaderboardRow.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LeaderboardEntry } from '../../services/promoCodeService';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser?: boolean;
}

const RANK_EMOJIS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_COLORS: Record<number, string> = { 1: '#F59E0B', 2: '#9CA3AF', 3: '#CD7F32' };

export const LeaderboardRow: React.FC<Props> = ({ entry, rank, isCurrentUser = false }) => {
  const { colors, radius, type, shadows } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const rankColor = RANK_COLORS[rank] ?? colors.textMuted;
  const rankLabel = RANK_EMOJIS[rank] ?? `#${rank}`;
  const initials = entry.name
    .split(' ')
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('');

  return (
    <Animated.View
      style={[
        styles.row,
        {
          backgroundColor: isCurrentUser ? colors.accentBg : colors.bgCard,
          borderRadius: radius.md,
          borderColor: isCurrentUser ? colors.accent : colors.borderPrimary,
          borderWidth: isCurrentUser ? 1.5 : 1,
          ...shadows.sm,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.rankBox, { backgroundColor: rankColor + '22', borderRadius: radius.full }]}>
        <Text style={{ fontSize: rank <= 3 ? 18 : 13, fontWeight: '800', color: rankColor }}>
          {rankLabel}
        </Text>
      </View>

      <View style={[styles.avatar, { backgroundColor: isCurrentUser ? colors.accent : colors.bgSecondary, borderRadius: radius.full }]}>
        <Text style={[type.caption, { fontWeight: '700', color: isCurrentUser ? colors.textInverse : colors.textPrimary }]}>
          {initials}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodySm, { fontWeight: '700', color: colors.textPrimary }]} numberOfLines={1}>
          {entry.name}
          {isCurrentUser ? ' (You)' : ''}
        </Text>
        {entry.rewardPoints ? (
          <Text style={[type.caption, { color: colors.textMuted }]}>
            {entry.rewardPoints.toLocaleString()} pts
          </Text>
        ) : null}
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[type.h3, { fontWeight: '900', color: rankColor }]}>
          {entry.totalReferrals}
        </Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>referrals</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 16, marginVertical: 4, gap: 10 },
  rankBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatar: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});