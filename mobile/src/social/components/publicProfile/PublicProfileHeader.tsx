/**
 * mobile/src/social/components/publicProfile/PublicProfileHeader.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable header block shared by PublicProfileScreen and
 * MyPublicProfileScreen.
 *
 * Renders:
 *   • Cover photo (parallax-ready via scrollY prop)
 *   • Avatar ring
 *   • Name + verified badge + role badge
 *   • Headline
 *   • Stats row  (location · followers · posts · connections)
 *   • Action buttons  (Follow / Message / Share / Edit)
 *   • Social links row
 *
 * Props control whether we're in "owner" mode (shows Edit button instead of
 * Follow / Message) or "public" mode.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import {
  Animated,
  Image as RNImage,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Avatar from '../shared/Avatar';
import RoleBadge from '../shared/RoleBadge';
import VerifiedBadge from '../shared/VerifiedBadge';
import FollowButton from '../shared/FollowButton';
import ChatActionButton from '../shared/ChatActionButton';
import { SocialLinksRow } from '../profile';
import { useSocialTheme } from '../../theme/socialTheme';
import { formatCount } from '../../utils/format';
import type { UserRole } from '../../types';
import type { ConnectionStatus } from '../../types/follow';
import type { ChatUser } from '../../types/chat';

// ── Constants ─────────────────────────────────────────────────────────────────

export const COVER_H      = 200;
export const AVATAR_SIZE  = 104;
const AVATAR_OFFSET       = AVATAR_SIZE / 2;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PublicProfileHeaderProps {
  /** Resolved profile data (can be either old PublicProfile or new PublicProfile shape) */
  profile: {
    displayName?:       string;
    username?:          string;
    headline?:          string;
    location?:          string;
    website?:           string;
    avatar?:            { secure_url?: string } | null;
    cover?:             { secure_url?: string } | null;
    socialLinks?:       Record<string, string | undefined>;
    verificationStatus?: string;
    isPubliclyVisible?: boolean;
    socialStats?: {
      followerCount?:   number;
      followingCount?:  number;
      postCount?:       number;
      connectionCount?: number;
    };
    user?: {
      _id?:   string;
      name?:  string;
      role?:  string;
      avatar?: string;
    };
    // new PublicProfile fields
    role?: string;
  };
  /** Whether the viewer is the owner of this profile */
  isOwner: boolean;
  /** For the public view: connection status from useConnectionStatus */
  connectionStatus?: ConnectionStatus;
  followPending?: boolean;
  onFollowPress?: () => void;
  onEditPress?: () => void;
  onSharePress?: () => void;
  /** Chat target for the ChatActionButton */
  otherUser?: ChatUser;
  /** Animated value for cover parallax (from parent Animated.ScrollView) */
  scrollY?: Animated.Value;
  /** Called when follower count is tapped */
  onFollowersPress?: (userId?: string) => void;
  onFollowingPress?: (userId?: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const PublicProfileHeader: React.FC<PublicProfileHeaderProps> = memo(({
  profile,
  isOwner,
  connectionStatus,
  followPending,
  onFollowPress,
  onEditPress,
  onSharePress,
  otherUser,
  scrollY,
  onFollowersPress,
  onFollowingPress,
}) => {
  const theme = useSocialTheme();

  // Resolve display values — support both old and new profile shapes
  const name      = profile.displayName || profile.user?.name || 'Unknown';
  const role      = (profile.role || profile.user?.role || 'candidate') as UserRole;
  const verified  = profile.verificationStatus === 'verified';
  const stats     = profile.socialStats ?? {};
  const coverUri  = profile.cover?.secure_url ?? null;
  const avatarUri = profile.avatar?.secure_url ?? profile.user?.avatar ?? null;

  // Parallax cover translation
  const coverTranslateY = scrollY
    ? scrollY.interpolate({
        inputRange:  [-80, 0, COVER_H],
        outputRange: [-30, 0, COVER_H * 0.4],
        extrapolate: 'clamp',
      })
    : undefined;

  const handleShare = async () => {
    if (onSharePress) { onSharePress(); return; }
    try {
      await Share.share({ message: `${name} on BananaLink` });
    } catch { /* noop */ }
  };

  return (
    <View>
      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      <View style={styles.coverWrap}>
        {coverUri ? (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              coverTranslateY ? { transform: [{ translateY: coverTranslateY }] } : undefined,
            ]}
          >
            <RNImage
              source={{ uri: coverUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', (theme.bg + 'CC') as any]}
              style={[StyleSheet.absoluteFill, { top: '50%' }]}
            />
          </Animated.View>
        ) : (
          <LinearGradient
            colors={[
              theme.withAlpha(theme.colors.primary, 0.28),
              theme.withAlpha(theme.colors.secondary ?? theme.colors.primary, 0.14),
            ]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.orb, {
              width: 220, height: 220, top: -80, right: -50,
              backgroundColor: theme.withAlpha(theme.colors.primary, 0.12),
            }]} />
            <View style={[styles.orb, {
              width: 140, height: 140, top: 40, left: -30,
              backgroundColor: theme.withAlpha(theme.colors.primary, 0.08),
            }]} />
          </LinearGradient>
        )}
      </View>

      {/* ── Avatar ring ───────────────────────────────────────────────────── */}
      <View style={styles.avatarRow}>
        <View style={[styles.avatarRing, { borderColor: theme.bg, backgroundColor: theme.bg }]}>
          <Avatar uri={avatarUri ?? undefined} name={name} size={AVATAR_SIZE} />
        </View>
        {/* Visibility badge for owner */}
        {isOwner && profile.isPubliclyVisible === false && (
          <View style={[styles.privateBadge, { backgroundColor: theme.colors.warning ?? '#f59e0b' }]}>
            <Ionicons name="eye-off" size={10} color="#fff" />
            <Text style={styles.privateBadgeText}>Private</Text>
          </View>
        )}
      </View>

      {/* ── Identity ──────────────────────────────────────────────────────── */}
      <View style={styles.identity}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {name}
          </Text>
          {verified ? <VerifiedBadge size={18} /> : null}
        </View>

        {profile.username ? (
          <Text style={[styles.username, { color: theme.muted }]}>
            @{profile.username}
          </Text>
        ) : null}

        {role ? (
          <View style={{ marginTop: 6 }}>
            <RoleBadge role={role} size="sm" />
          </View>
        ) : null}

        {profile.headline ? (
          <Text style={[styles.headline, { color: theme.subtext }]} numberOfLines={3}>
            {profile.headline}
          </Text>
        ) : null}

        {/* Stats row */}
        <View style={styles.statsRow}>
          {profile.location ? (
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={13} color={theme.muted} />
              <Text style={[styles.statText, { color: theme.muted }]}>
                {profile.location}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => onFollowersPress?.(profile.user?._id)}
            disabled={!onFollowersPress}
            activeOpacity={0.75}
            hitSlop={6}
          >
            <Ionicons name="people-outline" size={13} color={theme.muted} />
            <Text style={[styles.statText, { color: theme.muted }]}>
              {formatCount(stats.followerCount ?? 0)} followers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => onFollowingPress?.(profile.user?._id)}
            disabled={!onFollowingPress}
            activeOpacity={0.75}
            hitSlop={6}
          >
            <Ionicons name="person-add-outline" size={13} color={theme.muted} />
            <Text style={[styles.statText, { color: theme.muted }]}>
              {formatCount(stats.followingCount ?? 0)} following
            </Text>
          </TouchableOpacity>

          <View style={styles.statItem}>
            <Ionicons name="newspaper-outline" size={13} color={theme.muted} />
            <Text style={[styles.statText, { color: theme.muted }]}>
              {formatCount(stats.postCount ?? 0)} posts
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {isOwner ? (
            /* Owner — show Edit button */
            <TouchableOpacity
              onPress={onEditPress}
              activeOpacity={0.85}
              style={[styles.editBtn, { borderColor: theme.border }]}
              accessibilityRole="button"
              accessibilityLabel="Edit public profile"
            >
              <Ionicons name="pencil-outline" size={15} color={theme.text} />
              <Text style={[styles.editBtnText, { color: theme.text }]}>
                Edit public profile
              </Text>
            </TouchableOpacity>
          ) : (
            /* Visitor — show Follow + Message */
            connectionStatus && connectionStatus !== 'self' ? (
              <>
                <FollowButton
                  status={connectionStatus}
                  onPress={onFollowPress!}
                  loading={followPending}
                />
                {otherUser ? (
                  <ChatActionButton
                    status={connectionStatus}
                    otherUser={otherUser}
                    variant="secondary"
                  />
                ) : null}
              </>
            ) : null
          )}

          {/* Share — always visible */}
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.85}
            style={[styles.iconCircleBtn, { borderColor: theme.border }]}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Share profile"
          >
            <Ionicons name="share-outline" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Social links */}
        {profile.socialLinks ? (
          <View style={[styles.linksWrap, { borderTopColor: theme.border }]}>
            <SocialLinksRow links={profile.socialLinks as any} />
          </View>
        ) : null}
      </View>
    </View>
  );
});

PublicProfileHeader.displayName = 'PublicProfileHeader';

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  coverWrap:   { width: '100%', height: COVER_H, overflow: 'hidden' },
  orb:         { position: 'absolute', borderRadius: 999 },

  avatarRow: {
    alignItems:    'center',
    marginTop:     -(AVATAR_OFFSET + 6),
    position:      'relative',
  },
  avatarRing: { borderRadius: 999, borderWidth: 4, padding: 2 },

  privateBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            3,
    position:       'absolute',
    right:          '50%',
    marginRight:    -(AVATAR_SIZE / 2 + 36),
    bottom:         4,
    paddingHorizontal: 6,
    paddingVertical:   3,
    borderRadius:   8,
  },
  privateBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },

  identity: { paddingHorizontal: 16, marginTop: 12, alignItems: 'center' },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  name:     { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  username: { fontSize: 13, marginTop: 2 },
  headline: {
    fontSize:        14,
    marginTop:       6,
    lineHeight:      20,
    textAlign:       'center',
    paddingHorizontal: 8,
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
    marginTop:     10,
    justifyContent:'center',
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12 },

  actions: {
    flexDirection:  'row',
    gap:            8,
    marginTop:      16,
    alignItems:     'center',
    justifyContent: 'center',
    flexWrap:       'wrap',
  },
  editBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderRadius:   22,
    borderWidth:    1.5,
    minHeight:      44,
  },
  editBtnText:    { fontSize: 13, fontWeight: '600' },
  iconCircleBtn:  { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  linksWrap: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 14, paddingTop: 4, width: '100%' },
});

export default PublicProfileHeader;