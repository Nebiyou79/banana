import React, { memo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { FollowTarget } from '../../types';
import Avatar from '../shared/Avatar';
import FollowButton from '../shared/FollowButton';
import RoleBadge from '../shared/RoleBadge';
import VerifiedBadge from '../shared/VerifiedBadge';

interface SuggestionItemProps {
  user: FollowTarget;
  isFollowing: boolean;
  followLoading?: boolean;
  onPress: () => void;
  onFollowPress: () => void;
}

const SuggestionItem: React.FC<SuggestionItemProps> = memo(
  ({ user, isFollowing, followLoading, onPress, onFollowPress }) => {
    const theme = useSocialTheme();
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={styles.cardInner}
        >
          <Avatar uri={user.avatar} name={user.name} size={64} />
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: theme.text }]}
              numberOfLines={1}
            >
              {user.name}
            </Text>
            <VerifiedBadge status={user.verificationStatus} size={12} />
          </View>
          {user.role ? <RoleBadge role={user.role} /> : null}
          {user.headline ? (
            <Text
              style={[styles.headline, { color: theme.subtext }]}
              numberOfLines={2}
            >
              {user.headline}
            </Text>
          ) : null}
        </TouchableOpacity>
        <FollowButton
          isFollowing={isFollowing}
          onPress={onFollowPress}
          loading={followLoading}
          size="sm"
        />
      </View>
    );
  }
);

SuggestionItem.displayName = 'SuggestionItem';

interface Props {
  suggestions: FollowTarget[];
  loading?: boolean;
  followStatus?: Record<string, { following: boolean }>;
  pendingFollowId?: string | null;
  onUserPress: (userId: string) => void;
  onFollowPress: (user: FollowTarget) => void;
}

/**
 * Horizontally scrollable carousel of follow suggestions. Surfaces on the
 * Network tab above the main stats.
 */
const SuggestionsRow: React.FC<Props> = memo(
  ({
    suggestions,
    loading,
    followStatus,
    pendingFollowId,
    onUserPress,
    onFollowPress,
  }) => {
    const theme = useSocialTheme();

    if (loading && suggestions.length === 0) {
      return (
        <ActivityIndicator
          color={theme.primary}
          style={{ paddingVertical: 20 }}
        />
      );
    }

    if (!suggestions?.length) return null;

    return (
      <FlatList
        horizontal
        data={suggestions}
        keyExtractor={(u) => u._id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SuggestionItem
            user={item}
            isFollowing={!!followStatus?.[item._id]?.following}
            followLoading={pendingFollowId === item._id}
            onPress={() => onUserPress(item._id)}
            onFollowPress={() => onFollowPress(item)}
          />
        )}
      />
    );
  }
);

SuggestionsRow.displayName = 'SuggestionsRow';

const styles = StyleSheet.create({
  list: { paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
  card: {
    width: 172,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  cardInner: { alignItems: 'center', gap: 6, width: '100%' },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  name: { fontSize: 13, fontWeight: '700', maxWidth: 130, textAlign: 'center' },
  headline: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    minHeight: 30,
  },
});

export default SuggestionsRow;