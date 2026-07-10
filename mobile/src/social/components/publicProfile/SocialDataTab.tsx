/**
 * mobile/src/social/components/publicProfile/SocialDataTab.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * "Social Data" / Analytics tab — shown to visitors and owners alike.
 * Displays follower / following / post / connection / view counts with
 * visual stat cards, a verification status banner, and (for owners) a
 * profile-completion nudge.
 *
 * No external data fetching — all numbers come from the `socialStats` prop
 * already present on the public profile document.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import { formatCount } from '../../utils/format';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SocialStats {
  followerCount?:   number;
  followingCount?:  number;
  postCount?:       number;
  connectionCount?: number;
  profileViews?:    number;
}

interface SocialDataTabProps {
  socialStats:        SocialStats;
  verificationStatus?: string;
  isOwner:            boolean;
  /** Owner-only: 0–100 */
  profileCompletion?: number;
  onEditPress?:       () => void;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon:    string;
  label:   string;
  value:   number;
  color?:  string;
  onPress?: () => void;
}> = memo(({ icon, label, value, color, onPress }) => {
  const theme = useSocialTheme();
  const tint  = color ?? theme.colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      accessibilityRole={onPress ? 'button' : 'none'}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${tint}1E` }]}>
        <Ionicons name={icon as any} size={18} color={tint} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>
        {formatCount(value)}
      </Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

StatCard.displayName = 'StatCard';

// ── Verification banner ───────────────────────────────────────────────────────

const VerificationBanner: React.FC<{ status: string }> = memo(({ status }) => {
  const theme = useSocialTheme();
  const config: Record<string, { icon: string; label: string; bg: string; text: string }> = {
    verified: {
      icon:  'checkmark-circle',
      label: 'Verified account',
      bg:    '#16a34a1A',
      text:  '#16a34a',
    },
    pending: {
      icon:  'time-outline',
      label: 'Verification pending',
      bg:    '#d97706' + '1A',
      text:  '#d97706',
    },
    rejected: {
      icon:  'close-circle-outline',
      label: 'Verification rejected',
      bg:    '#dc2626' + '1A',
      text:  '#dc2626',
    },
    none: {
      icon:  'shield-outline',
      label: 'Not verified',
      bg:    theme.border + '80',
      text:  theme.muted,
    },
  };
  const c = config[status] ?? config.none;
  return (
    <View style={[styles.verBanner, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon as any} size={18} color={c.text} />
      <Text style={[styles.verText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
});

VerificationBanner.displayName = 'VerificationBanner';

// ── Main component ────────────────────────────────────────────────────────────

const SocialDataTab: React.FC<SocialDataTabProps> = memo(({
  socialStats,
  verificationStatus = 'none',
  isOwner,
  profileCompletion,
  onEditPress,
}) => {
  const theme = useSocialTheme();
  const s     = socialStats;

  return (
    <View style={styles.container}>
      {/* Verification status */}
      <VerificationBanner status={verificationStatus} />

      {/* Stats grid — 2 columns */}
      <View style={styles.grid}>
        <StatCard
          icon="people"
          label="Followers"
          value={s.followerCount ?? 0}
          color={theme.colors.primary}
        />
        <StatCard
          icon="person-add"
          label="Following"
          value={s.followingCount ?? 0}
          color={theme.colors.primary}
        />
        <StatCard
          icon="newspaper"
          label="Posts"
          value={s.postCount ?? 0}
          color="#8b5cf6"
        />
        <StatCard
          icon="git-network"
          label="Connections"
          value={s.connectionCount ?? 0}
          color="#0ea5e9"
        />
        {(s.profileViews ?? 0) > 0 ? (
          <StatCard
            icon="eye"
            label="Profile views"
            value={s.profileViews ?? 0}
            color="#10b981"
          />
        ) : null}
      </View>

      {/* Owner-only: profile completion nudge */}
      {isOwner && typeof profileCompletion === 'number' && profileCompletion < 100 ? (
        <View style={[styles.completionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Progress bar */}
          <View style={styles.progressRow}>
            <Text style={[styles.completionLabel, { color: theme.text }]}>
              Profile completion
            </Text>
            <Text style={[styles.completionPct, { color: theme.colors.primary }]}>
              {profileCompletion}%
            </Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width:           `${profileCompletion}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.completionSub, { color: theme.muted }]}>
            A complete profile gets 3× more views. Fill in missing sections to stand out.
          </Text>
          {onEditPress ? (
            <TouchableOpacity
              onPress={onEditPress}
              activeOpacity={0.85}
              style={[styles.completionBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.completionBtnText}>Complete profile</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Owner-only: engagement tip */}
      {isOwner ? (
        <View style={[styles.tipCard, { backgroundColor: theme.withAlpha(theme.colors.primary, 0.07), borderColor: theme.withAlpha(theme.colors.primary, 0.2) }]}>
          <Ionicons name="bulb-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.tipText, { color: theme.subtext }]}>
            Post regularly and engage with your network to grow your follower count and profile visibility.
          </Text>
        </View>
      ) : null}
    </View>
  );
});

SocialDataTab.displayName = 'SocialDataTab';

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { paddingTop: 16, paddingHorizontal: 16 },

  verBanner: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderRadius:   12,
    marginBottom:   16,
  },
  verText: { fontSize: 13, fontWeight: '600' },

  grid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            10,
    marginBottom:   16,
  },
  statCard: {
    width:          '47%',
    borderRadius:   14,
    borderWidth:    1,
    padding:        14,
    alignItems:     'center',
    gap:            6,
  },
  statIconWrap: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   4,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  completionCard: {
    borderRadius: 14,
    borderWidth:  1,
    padding:      16,
    marginBottom: 12,
    gap:          10,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completionLabel: { fontSize: 14, fontWeight: '700' },
  completionPct:   { fontSize: 14, fontWeight: '800' },
  progressBg:  { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill:{ height: 8, borderRadius: 4 },
  completionSub: { fontSize: 12, lineHeight: 17 },
  completionBtn: {
    alignSelf:       'flex-start',
    paddingHorizontal: 14,
    paddingVertical:   9,
    borderRadius:    18,
    minHeight:       36,
    justifyContent:  'center',
  },
  completionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  tipCard: {
    flexDirection: 'row',
    gap:           10,
    padding:       14,
    borderRadius:  12,
    borderWidth:   1,
    alignItems:    'flex-start',
    marginBottom:  16,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },
});

export default SocialDataTab;