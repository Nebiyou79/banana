// src/components/bids/SealedBidBanner.tsx
// Mobile version of the sealed bid banner with countdown timer
// Shows: locked state, countdown, or revealed state
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

// ── Types ──────────────────────────────────────────────────────────────────

interface SealedBidBannerProps {
  workflowType: 'open' | 'closed';
  isRevealed: boolean;
  deadline: string;
  revealDate?: string;
  isOwner?: boolean;
  isRevealing?: boolean;
  onReveal?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast: false,
  };
}

// ── Component ───────────────────────────────────────────────────────────────

export const SealedBidBanner: React.FC<SealedBidBannerProps> = ({
  workflowType,
  isRevealed,
  deadline,
  revealDate,
  isOwner = false,
  isRevealing = false,
  onReveal,
}) => {
  const { colors, radius } = useTheme();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calcTimeLeft(revealDate ?? deadline)
  );

  useEffect(() => {
    if (workflowType !== 'closed' || isRevealed) return;
    const target = revealDate ?? deadline;
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(target));
    }, 1000);
    return () => clearInterval(timer);
  }, [workflowType, isRevealed, deadline, revealDate]);

  // Open tenders: no banner
  if (workflowType !== 'closed') return null;

  // REVEALED state
  if (isRevealed) {
    return (
      <View style={[styles.banner, { backgroundColor: colors.successBg, borderColor: colors.success, borderRadius: radius.lg }]}>
        <Ionicons name="lock-open" size={20} color={colors.success} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.success }]}>Bids have been revealed</Text>
          <Text style={[styles.subtitle, { color: colors.success }]}>
            All submitted bids are now visible. Evaluation may begin.
          </Text>
        </View>
      </View>
    );
  }

  // SEALED state
  const { days, hours, minutes, seconds, isPast } = timeLeft;

  return (
    <View style={[styles.banner, { backgroundColor: colors.warningBg, borderColor: colors.warning, borderRadius: radius.lg }]}>
      <Ionicons name="lock-closed" size={20} color={colors.warning} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.warning }]}>This is a sealed tender</Text>
        <Text style={[styles.subtitle, { color: colors.warning }]}>
          Bids are encrypted until the owner reveals them after the deadline.
        </Text>
        {!isPast ? (
          <View style={styles.countdownRow}>
            {[
              { v: days, l: 'd' },
              { v: hours, l: 'h' },
              { v: minutes, l: 'm' },
              { v: seconds, l: 's' },
            ].map(({ v, l }) => (
              <View key={l} style={[styles.countBlock, { backgroundColor: colors.warning + '22' }]}>
                <Text style={[styles.countNum, { color: colors.warning }]}>{v}</Text>
                <Text style={[styles.countLabel, { color: colors.warning }]}>{l}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.pastText, { color: colors.warning }]}>
            Deadline passed — awaiting owner to reveal bids.
          </Text>
        )}

        {isOwner && onReveal && (
          <Pressable
            onPress={onReveal}
            disabled={isRevealing}
            style={({ pressed }) => [
              styles.revealBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || isRevealing ? 0.7 : 1,
                borderRadius: radius.md,
              },
            ]}
          >
            {isRevealing ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Ionicons name="lock-open" size={14} color={colors.textInverse} />
                <Text style={[styles.revealBtnText, { color: colors.textInverse }]}>
                  Reveal Bids
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  countdownRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  countBlock: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 44,
  },
  countNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  pastText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  revealBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default SealedBidBanner;