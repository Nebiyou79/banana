/**
 * src/components/promo/LeaderboardRow.tsx
 * Single row in the referral leaderboard list.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LeaderboardEntry } from '../../services/promoCodeService';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser?: boolean;
}

const RANK_EMOJIS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_COLORS: Record<number, string>  = {
  1: '#F59E0B',
  2: '#9CA3AF',
  3: '#CD7F32',
};

export const LeaderboardRow: React.FC<Props> = ({
  entry,
  rank,
  isCurrentUser = false,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography } = theme;

  const rankColor  = RANK_COLORS[rank] ?? colors.textMuted;
  const rankLabel  = RANK_EMOJIS[rank] ?? `#${rank}`;
  const initials   = entry.name
    .split(' ')
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('');

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: isCurrentUser ? colors.primaryLight : colors.card,
          borderRadius:    borderRadius.md,
          borderColor:     isCurrentUser ? colors.primary : colors.border,
          borderWidth:     isCurrentUser ? 1.5 : 1,
        },
      ]}
    >
      {/* Rank badge */}
      <View
        style={[
          styles.rankBox,
          { backgroundColor: rankColor + '22', borderRadius: 20 },
        ]}
      >
        <Text style={{ fontSize: rank <= 3 ? 18 : 13, fontWeight: '800', color: rankColor }}>
          {rankLabel}
        </Text>
      </View>

      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: isCurrentUser ? colors.primary : colors.border,
            borderRadius:    20,
          },
        ]}
      >
        <Text
          style={{
            fontSize:   13,
            fontWeight: '700',
            color:      isCurrentUser ? '#fff' : colors.text,
          }}
        >
          {initials}
        </Text>
      </View>

      {/* Name */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{ fontSize: typography.sm, fontWeight: '700', color: colors.text }}
          numberOfLines={1}
        >
          {entry.name}
          {isCurrentUser ? ' (You)' : ''}
        </Text>
        {entry.rewardPoints ? (
          <Text style={{ fontSize: typography.xs, color: colors.textMuted }}>
            {entry.rewardPoints.toLocaleString()} pts
          </Text>
        ) : null}
      </View>

      {/* Count */}
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{
            fontSize:   typography.lg,
            fontWeight: '900',
            color:      rankColor,
          }}
        >
          {entry.totalReferrals}
        </Text>
        <Text style={{ fontSize: 10, color: colors.textMuted }}>referrals</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:    'row',
    alignItems:       'center',
    padding:          12,
    marginHorizontal: 16,
    marginVertical:   4,
    gap:              10,
  },
  rankBox: {
    width:          40,
    height:         40,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  avatar: {
    width:          38,
    height:         38,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
});