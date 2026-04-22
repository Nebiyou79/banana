// src/social/components/profile/ProfileHeader.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { useSocialTheme } from '../../theme/socialTheme';
import type { Profile, PublicProfile } from '../../types';
import { formatCount } from '../../utils/format';
import { getAvatarUrl, getCoverUrl } from '../../utils/profileUtils';
import Avatar from '../shared/Avatar';
import RoleBadge from '../shared/RoleBadge';
import VerifiedBadge from '../shared/VerifiedBadge';

interface Props {
  profile: Profile | PublicProfile;
  isOwn?: boolean;
  isFollowing?: boolean;
  followLoading?: boolean;
  onEditPress?: () => void;
  onAvatarPress?: () => void;
  onCoverPress?: () => void;
  onFollowPress?: () => void;
  onMessagePress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

const COVER_HEIGHT = 160;

const ProfileHeader: React.FC<Props> = memo(
  ({
    profile,
    isOwn,
    isFollowing,
    followLoading,
    onEditPress,
    onAvatarPress,
    onCoverPress,
    onFollowPress,
    onMessagePress,
    onFollowersPress,
    onFollowingPress,
  }) => {
    const theme = useSocialTheme();
    const coverUri = getCoverUrl(profile);
    const avatarUri = getAvatarUrl(profile);
    const verified = profile.verificationStatus === 'verified';
    const stats = profile.socialStats ?? ({} as any);

    return (
      <View>
        {/* Cover */}
        <TouchableOpacity
          activeOpacity={isOwn ? 0.85 : 1}
          onPress={isOwn ? onCoverPress : undefined}
          disabled={!isOwn}
          style={[
            styles.coverWrap,
            { backgroundColor: theme.primaryLighter },
          ]}
        >
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.cover} />
          ) : (
            <View
              style={[
                styles.coverFallback,
                { backgroundColor: theme.primaryLighter },
              ]}
            />
          )}
          {isOwn ? (
            <View
              style={[
                styles.coverEdit,
                { backgroundColor: 'rgba(0,0,0,0.45)' },
              ]}
            >
              <Ionicons name="camera-outline" size={16} color="#fff" />
              <Text style={styles.coverEditText}>Edit cover</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Avatar + actions row */}
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={onAvatarPress}
            activeOpacity={isOwn ? 0.85 : 1}
            disabled={!isOwn}
          >
            <View
              style={[
                styles.avatarWrap,
                { borderColor: theme.card, backgroundColor: theme.card },
              ]}
            >
              <Avatar
                uri={avatarUri ?? undefined}
                name={profile.user?.name}
                size={SOCIAL_LAYOUT.avatarLg}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.actions}>
            {isOwn ? (
              <TouchableOpacity
                onPress={onEditPress}
                activeOpacity={0.85}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: 'transparent',
                    borderColor: theme.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={15}
                  color={theme.text}
                />
                <Text
                  style={[
                    styles.actionText,
                    { color: theme.text },
                  ]}
                >
                  Edit profile
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={onFollowPress}
                  activeOpacity={0.85}
                  disabled={followLoading}
                  style={[
                    styles.actionBtn,
                    isFollowing
                      ? {
                          backgroundColor: 'transparent',
                          borderColor: theme.border,
                          borderWidth: 1,
                        }
                      : { backgroundColor: theme.primary },
                  ]}
                >
                  {followLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={isFollowing ? theme.text : '#fff'}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.actionText,
                        { color: isFollowing ? theme.text : '#fff' },
                      ]}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  )}
                </TouchableOpacity>
                {onMessagePress ? (
                  <TouchableOpacity
                    onPress={onMessagePress}
                    activeOpacity={0.85}
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: 'transparent',
                        borderColor: theme.border,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={15}
                      color={theme.text}
                    />
                    <Text
                      style={[styles.actionText, { color: theme.text }]}
                    >
                      Message
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        </View>

        {/* Name + headline */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: theme.text }]}
              numberOfLines={1}
            >
              {profile.user?.name ?? 'Unknown'}
            </Text>
            {verified ? <VerifiedBadge size={16} /> : null}
            {profile.user?.role ? (
              <RoleBadge role={profile.user.role} size="sm" />
            ) : null}
          </View>

          {profile.headline ? (
            <Text
              style={[styles.headline, { color: theme.subtext }]}
              numberOfLines={2}
            >
              {profile.headline}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            {profile.location ? (
              <View style={styles.metaItem}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={theme.muted}
                />
                <Text style={[styles.metaText, { color: theme.muted }]}>
                  {profile.location}
                </Text>
              </View>
            ) : null}
            {profile.website ? (
              <View style={styles.metaItem}>
                <Ionicons name="link-outline" size={13} color={theme.muted} />
                <Text
                  style={[styles.metaText, { color: theme.primary }]}
                  numberOfLines={1}
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </Text>
              </View>
            ) : null}
          </View>

          {profile.bio ? (
            <Text
              style={[styles.bio, { color: theme.text }]}
              numberOfLines={4}
            >
              {profile.bio}
            </Text>
          ) : null}
        </View>

        {/* Stats */}
        <View style={[styles.stats, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={styles.statCell}
            onPress={onFollowersPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNum, { color: theme.text }]}>
              {formatCount(stats.followerCount ?? 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>
              Followers
            </Text>
          </TouchableOpacity>
          <View
            style={[styles.statDivider, { backgroundColor: theme.border }]}
          />
          <TouchableOpacity
            style={styles.statCell}
            onPress={onFollowingPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNum, { color: theme.text }]}>
              {formatCount(stats.followingCount ?? 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>
              Following
            </Text>
          </TouchableOpacity>
          <View
            style={[styles.statDivider, { backgroundColor: theme.border }]}
          />
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: theme.text }]}>
              {formatCount(stats.postCount ?? 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>
              Posts
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

ProfileHeader.displayName = 'ProfileHeader';

const styles = StyleSheet.create({
  coverWrap: {
    width: '100%',
    height: COVER_HEIGHT,
    overflow: 'hidden',
  },
  cover: { width: '100%', height: '100%' },
  coverFallback: { width: '100%', height: '100%' },
  coverEdit: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  coverEditText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -40,
  },
  avatarWrap: {
    borderRadius: 9999,
    borderWidth: 4,
    padding: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    minHeight: 36,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
  info: { paddingHorizontal: 16, marginTop: 10 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: { fontSize: 20, fontWeight: '800' },
  headline: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  bio: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  stats: {
    flexDirection: 'row',
    marginTop: 14,
    borderTopWidth: 0.5,
    paddingVertical: 12,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  statDivider: { width: 0.5 },
  statNum: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
});

export default ProfileHeader;