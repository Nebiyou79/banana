/**
 * src/components/promo/ReferralHistoryCard.tsx
 * Single row in the referral activity list.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReferralActivityEntry } from '../../services/promoCodeService';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  entry: ReferralActivityEntry;
}

const STATUS_CONFIG: Record<
  ReferralActivityEntry['status'],
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending:        { label: 'Pending',        color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
  email_verified: { label: 'Email Verified', color: '#2563EB', bg: '#DBEAFE', icon: 'mail-outline' },
  completed:      { label: 'Completed',      color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
  cancelled:      { label: 'Cancelled',      color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
  expired:        { label: 'Expired',        color: '#6B7280', bg: '#F3F4F6', icon: 'ban-outline' },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });

export const ReferralHistoryCard: React.FC<Props> = ({ entry }) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography } = theme;
  const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.pending;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderRadius:    borderRadius.md,
          borderColor:     colors.border,
        },
      ]}
    >
      {/* Avatar placeholder */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.primaryLight, borderRadius: 20 },
        ]}
      >
        <Ionicons name="person-outline" size={18} color={colors.primary} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={{ fontSize: typography.sm, fontWeight: '700', color: colors.text }}
          numberOfLines={1}
        >
          {entry.user}
        </Text>
        {entry.email ? (
          <Text
            style={{ fontSize: typography.xs, color: colors.textMuted }}
            numberOfLines={1}
          >
            {entry.email}
          </Text>
        ) : null}
        <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 2 }}>
          {fmtDate(entry.date)}
        </Text>
      </View>

      {/* Status + reward */}
      <View style={styles.right}>
        <View
          style={[
            styles.badge,
            { backgroundColor: cfg.bg, borderRadius: 20 },
          ]}
        >
          <Ionicons name={cfg.icon} size={11} color={cfg.color} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.color, marginLeft: 3 }}>
            {cfg.label}
          </Text>
        </View>

        {entry.status === 'completed' && entry.rewardEarned > 0 && (
          <Text
            style={{
              fontSize:   typography.xs,
              fontWeight: '800',
              color:      colors.success,
              marginTop:  4,
              textAlign:  'right',
            }}
          >
            +{entry.rewardEarned} pts
          </Text>
        )}
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
    borderWidth:      1,
    gap:              10,
  },
  avatar: {
    width:          40,
    height:         40,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  info: { flex: 1, gap: 1 },
  right: { alignItems: 'flex-end' },
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
});