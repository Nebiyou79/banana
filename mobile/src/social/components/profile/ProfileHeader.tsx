import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFadeIn, useSlideUp } from '../../theme/animations';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { useSocialTheme } from '../../theme/socialTheme';
import type { Profile, PublicProfile } from '../../types';
import { formatCount } from '../../utils/format';
import Avatar from '../shared/Avatar';
import FollowButton from '../shared/FollowButton';
import RoleBadge from '../shared/RoleBadge';
import VerifiedBadge from '../shared/VerifiedBadge';

interface Props {
  profile: Profile | PublicProfile;
  isOwn: boolean;
  isFollowing?: boolean;
  followLoading?: boolean;
  onFollowPress?: () => void;
  onEditPress?: () => void;
  onAvatarPress?: () => void;
  onCoverPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  onMessagePress?: () => void;
}

/**
 * Profile hero: cover photo → overlapping avatar → name + role + verified →
 * headline + location → follower/following/posts stats → primary action.
 *
 * If no cover photo is set, we render a role-gradient placeholder so the
 * four roles feel distinct even for brand-new profiles.
 */
const ProfileHeader: React.FC<Props> = memo(
  ({
    profile,
    isOwn,
    isFollowing,
    followLoading,
    onFollowPress,
    onEditPress,
    onAvatarPress,
    onCoverPress,
    onFollowersPress,
    onFollowingPress,
    onMessagePress,
  }) => {
    const theme = useSocialTheme();
    const opacity = useFadeIn(0, 300);
    const { translateY } = useSlideUp(20, 120);

    const user = profile.user;
    const name = user?.name ?? 'Unknown';
    const avatarUri = profile.avatar?.secure_url ?? user?.avatar;
    const coverUri = profile.coverPhoto?.secure_url;
    const stats = profile.socialStats ?? {
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
    };

    return (
      <Animated.View
        style={[styles.wrap, { backgroundColor: theme.card, opacity }]}
      >
        {/* Cover */}
        <TouchableOpacity
          onPress={onCoverPress}
          activeOpacity={isOwn ? 0.85 : 1}
          disabled={!isOwn}
        >
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={styles.cover}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={theme.splashGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cover}
            />
          )}
          {isOwn ? (
            <View style={styles.coverEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          ) : null}
        </TouchableOpacity>

        <Animated.View
          style={[styles.body, { transform: [{ translateY }] }]}
        >
          {/* Avatar + action button row */}
          <View style={styles.avatarRow}>
            <TouchableOpacity
              onPress={onAvatarPress}
              activeOpacity={isOwn ? 0.85 : 1}
              disabled={!isOwn && !onAvatarPress}
              style={styles.avatarWrap}
            >
              <Avatar
                uri={avatarUri}
                name={name}
                size={SOCIAL_LAYOUT.avatarLg}
                borderWidth={4}
                borderColor={theme.card}
              />
              {isOwn ? (
                <View
                  style={[
                    styles.avatarEditBadge,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Ionicons name="camera" size={12} color="#fff" />
                </View>
              ) : null}
            </TouchableOpacity>

            <View style={styles.actionRow}>
              {isOwn ? (
                <TouchableOpacity
                  onPress={onEditPress}
                  activeOpacity={0.85}
                  style={[
                    styles.editBtn,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.cardAlt,
                    },
                  ]}
                >
                  <Ionicons
                    name="create-outline"
                    size={14}
                    color={theme.text}
                  />
                  <Text style={[styles.editText, { color: theme.text }]}>
                    Edit Profile
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  {onMessagePress ? (
                    <TouchableOpacity
                      onPress={onMessagePress}
                      activeOpacity={0.85}
                      style={[
                        styles.iconBtn,
                        {
                          backgroundColor: theme.cardAlt,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={18}
                        color={theme.text}
                      />
                    </TouchableOpacity>
                  ) : null}
                  <FollowButton
                    isFollowing={isFollowing ?? false}
                    onPress={onFollowPress ?? (() => undefined)}
                    loading={followLoading}
                  />
                </>
              )}
            </View>
          </View>

          {/* Name */}
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: theme.text }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <VerifiedBadge
              status={user?.verificationStatus ?? profile.verificationStatus}
              size={18}
            />
            {user?.role ? <RoleBadge role={user.role} size="sm" /> : null}
          </View>

          {/* Headline */}
          {profile.headline ? (
            <Text
              style={[styles.headline, { color: theme.subtext }]}
              numberOfLines={2}
            >
              {profile.headline}
            </Text>
          ) : null}

          {/* Location / website */}
          {(profile.location || profile.website) ? (
            <View style={styles.metaRow}>
              {profile.location ? (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color={theme.muted}
                  />
                  <Text style={[styles.meta, { color: theme.muted }]}>
                    {profile.location}
                  </Text>
                </View>
              ) : null}
              {profile.website ? (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="globe-outline"
                    size={13}
                    color={theme.muted}
                  />
                  <Text
                    style={[styles.meta, { color: theme.primary }]}
                    numberOfLines={1}
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Bio */}
          {profile.bio ? (
            <Text
              style={[styles.bio, { color: theme.text }]}
              numberOfLines={4}
            >
              {profile.bio}
            </Text>
          ) : null}

          {/* Stats */}
          <View style={styles.stats}>
            <Stat
              label="Followers"
              value={stats.followerCount}
              onPress={onFollowersPress}
            />
            <Stat
              label="Following"
              value={stats.followingCount}
              onPress={onFollowingPress}
            />
            <Stat label="Posts" value={stats.postCount} />
          </View>
        </Animated.View>
      </Animated.View>
    );
  }
);

ProfileHeader.displayName = 'ProfileHeader';

// ── Stat ──────────────────────────────────────────────────────────────
const Stat: React.FC<{
  label: string;
  value: number;
  onPress?: () => void;
}> = ({ label, value, onPress }) => {
  const theme = useSocialTheme();
  const content = (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: theme.text }]}>
        {formatCount(value)}
      </Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

const COVER_HEIGHT = SOCIAL_LAYOUT.coverHeight;
const AVATAR_OVERLAP = SOCIAL_LAYOUT.avatarLg / 2;

const styles = StyleSheet.create({
  wrap: {},
  cover: { height: COVER_HEIGHT, width: '100%' },
  coverEditBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -AVATAR_OVERLAP,
    marginBottom: 12,
  },
  avatarWrap: { position: 'relative' },
  avatarEditBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
  },
  editText: { fontSize: 13, fontWeight: '700' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  name: { fontSize: 22, fontWeight: '800', maxWidth: '80%' },
  headline: { fontSize: 14, marginTop: 4, lineHeight: 19 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
  },
  meta: { fontSize: 12 },
  bio: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  stat: { minHeight: 44 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
});

export default ProfileHeader;
