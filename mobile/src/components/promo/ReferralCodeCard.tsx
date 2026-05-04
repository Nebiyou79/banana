// ReferralCodeCard.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReferralStats } from '../../services/promoCodeService';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  code: string;
  stats: ReferralStats;
  onShare: () => void;
  onCopy: () => void;
  isGenerating?: boolean;
}

const StatPill = ({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) => {
  const { colors, type } = useTheme();

  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[type.h2, { fontWeight: '800', color: accent ? colors.warning : colors.textPrimary }]}>
        {value}
      </Text>
      <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>{label}</Text>
    </View>
  );
};

export const ReferralCodeCard: React.FC<Props> = ({ code, stats, onShare, onCopy, isGenerating = false }) => {
  const { colors, radius, type, shadows } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderRadius: radius.xl,
          borderColor: colors.borderPrimary,
          ...shadows.md,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={{ fontSize: 22 }}>🎁</Text>
        <Text style={[type.bodySm, { fontWeight: '700', color: colors.textPrimary, marginLeft: 8 }]}>
          Your Referral Code
        </Text>
      </View>

      <View style={[styles.codeBox, { backgroundColor: colors.accentBg, borderRadius: radius.lg }]}>
        {isGenerating ? (
          <ActivityIndicator color={colors.accent} size="small" style={{ flex: 1 }} />
        ) : (
          <Text style={[styles.codeText, type.h3, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
            {code}
          </Text>
        )}
        <TouchableOpacity onPress={onCopy} disabled={isGenerating} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="copy-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity onPress={onCopy} disabled={isGenerating} style={[styles.btnOutline, { borderColor: colors.accent, borderRadius: radius.lg }]}>
          <Ionicons name="copy-outline" size={16} color={colors.accent} />
          <Text style={[styles.btnOutlineText, type.bodySm, { color: colors.accent }]}>Copy Code</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} disabled={isGenerating} style={[styles.btnFilled, { backgroundColor: colors.accent, borderRadius: radius.lg }]}>
          <Ionicons name="share-social-outline" size={16} color="#fff" />
          <Text style={[styles.btnFilledText, type.bodySm]}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsStrip, { borderTopColor: colors.borderPrimary }]}>
        <StatPill label="Referred" value={stats.totalReferrals} />
        <View style={[styles.divider, { backgroundColor: colors.borderPrimary }]} />
        <StatPill label="Completed" value={stats.completedReferrals} />
        <View style={[styles.divider, { backgroundColor: colors.borderPrimary }]} />
        <StatPill label="Points" value={stats.rewardPoints} accent />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: { margin: 16, padding: 20, borderWidth: 1.5 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  codeBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14, gap: 10 },
  codeText: { flex: 1, fontWeight: '800', letterSpacing: 3, fontFamily: 'monospace', textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  btnOutline: { flex: 1, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, gap: 6 },
  btnOutlineText: { fontWeight: '700' },
  btnFilled: { flex: 1, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnFilledText: { fontWeight: '700', color: '#fff' },
  statsStrip: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, borderTopWidth: 1 },
  divider: { width: 1, height: 36 },
});