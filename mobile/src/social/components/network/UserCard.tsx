import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { useSocialTheme } from '../../theme/socialTheme';
import type { SearchResult } from '../../types';
import { formatCount } from '../../utils/format';
import Avatar from '../shared/Avatar';
import FollowButton from '../shared/FollowButton';
import RoleBadge from '../shared/RoleBadge';
import VerifiedBadge from '../shared/VerifiedBadge';

interface Props {
  user: SearchResult;
  isFollowing: boolean;
  followLoading?: boolean;
  onPress: () => void;
  onFollowPress: () => void;
  showFollowButton?: boolean;
}

/**
 * Horizontal user card used on Network, Search, and Follow-suggestion lists.
 * Tapping the card opens PublicProfileScreen; tapping the button toggles follow.
 */
const UserCard: React.FC<Props> = memo(
  ({
    user,
    isFollowing,
    followLoading,
    onPress,
    onFollowPress,
    showFollowButton = true,
  }) => {
    const theme = useSocialTheme();

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Avatar
          uri={user.avatar}
          name={user.name}
          size={SOCIAL_LAYOUT.avatarMd + 4}
        />

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: theme.text }]}
              numberOfLines={1}
            >
              {user.name}
            </Text>
            <VerifiedBadge status={user.verificationStatus} />
            {user.role ? <RoleBadge role={user.role} /> : null}
          </View>
          {user.headline ? (
            <Text
              style={[styles.headline, { color: theme.subtext }]}
              numberOfLines={1}
            >
              {user.headline}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            {user.followerCount !== undefined ? (
              <Text style={[styles.meta, { color: theme.muted }]}>
                {formatCount(user.followerCount)} followers
              </Text>
            ) : null}
            {user.location ? (
              <Text style={[styles.meta, { color: theme.muted }]}>
                {user.location}
              </Text>
            ) : null}
          </View>
        </View>

        {showFollowButton ? (
          <FollowButton
            isFollowing={isFollowing}
            onPress={onFollowPress}
            loading={followLoading}
            size="sm"
          />
        ) : null}
      </TouchableOpacity>
    );
  }
);

UserCard.displayName = 'UserCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  name: { fontSize: 14, fontWeight: '700', maxWidth: 180 },
  headline: { fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 3 },
  meta: { fontSize: 11 },
});

export default UserCard;