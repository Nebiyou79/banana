// ReferralHistoryCard.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReferralActivityEntry } from '../../services/promoCodeService';
import { useTheme } from '../../hooks/useTheme';

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
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const ReferralHistoryCard: React.FC<Props> = ({ entry }) => {
  const { colors, radius, type, shadows } = useTheme();
  const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.pending;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.row,
        {
          backgroundColor: colors.bgCard,
          borderRadius: radius.md,
          borderColor: colors.borderPrimary,
          ...shadows.sm,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.accentBg, borderRadius: radius.full }]}>
        <Ionicons name="person-outline" size={18} color={colors.accent} />
      </View>

      <View style={styles.info}>
        <Text style={[type.bodySm, { fontWeight: '700', color: colors.textPrimary }]} numberOfLines={1}>
          {entry.user}
        </Text>
        {entry.email ? (
          <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>
            {entry.email}
          </Text>
        ) : null}
        <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
          {fmtDate(entry.date)}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={[styles.badge, { backgroundColor: cfg.bg, borderRadius: radius.full }]}>
          <Ionicons name={cfg.icon} size={11} color={cfg.color} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.color, marginLeft: 3 }}>
            {cfg.label}
          </Text>
        </View>

        {entry.status === 'completed' && entry.rewardEarned > 0 && (
          <Text style={[type.caption, { fontWeight: '800', color: colors.success, marginTop: 4, textAlign: 'right' }]}>
            +{entry.rewardEarned} pts
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 16, marginVertical: 4, borderWidth: 1, gap: 10 },
  avatar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1, gap: 1 },
  right: { alignItems: 'flex-end' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3 },
});