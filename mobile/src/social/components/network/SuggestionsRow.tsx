// src/social/components/network/SuggestionsRow.tsx
import React, { memo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { BulkFollowStatus, FollowTarget } from '../../types';
import { formatCount, truncate } from '../../utils/format';
import Avatar from '../shared/Avatar';
import RoleBadge from '../shared/RoleBadge';
import VerifiedBadge from '../shared/VerifiedBadge';

interface Props {
  suggestions: FollowTarget[];
  loading?: boolean;
  followStatus?: BulkFollowStatus;
  pendingFollowId?: string | null;
  onUserPress: (userId: string) => void;
  onFollowPress: (user: FollowTarget) => void;
}

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
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.primary} />
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {suggestions.map((u) => {
          const following = !!followStatus?.[u._id]?.following;
          const pending = pendingFollowId === u._id;
          return (
            <View
              key={u._id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => onUserPress(u._id)}
                activeOpacity={0.8}
                style={styles.cardInner}
              >
                <Avatar uri={u.avatar} name={u.name} size={64} />
                <View style={styles.nameRow}>
                  <Text
                    style={[styles.name, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {truncate(u.name, 14)}
                  </Text>
                  {u.verificationStatus === 'verified' ? (
                    <VerifiedBadge size={12} />
                  ) : null}
                </View>
                {u.role ? (
                  <View style={{ marginTop: 4 }}>
                    <RoleBadge role={u.role} size="sm" />
                  </View>
                ) : null}
                {u.headline ? (
                  <Text
                    style={[styles.headline, { color: theme.muted }]}
                    numberOfLines={2}
                  >
                    {u.headline}
                  </Text>
                ) : null}
                {(u as any).followerCount !== undefined ? (
                  <Text style={[styles.followers, { color: theme.muted }]}>
                    {formatCount((u as any).followerCount)} followers
                  </Text>
                ) : null}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onFollowPress(u)}
                disabled={pending}
                activeOpacity={0.85}
                style={[
                  styles.followBtn,
                  following
                    ? {
                        backgroundColor: 'transparent',
                        borderColor: theme.border,
                        borderWidth: 1,
                      }
                    : { backgroundColor: theme.primary },
                ]}
                accessibilityLabel={following ? 'Unfollow' : 'Follow'}
              >
                {pending ? (
                  <ActivityIndicator
                    size="small"
                    color={following ? theme.text : '#fff'}
                  />
                ) : (
                  <Text
                    style={[
                      styles.followText,
                      { color: following ? theme.text : '#fff' },
                    ]}
                  >
                    {following ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    );
  }
);

SuggestionsRow.displayName = 'SuggestionsRow';

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  loadingRow: { paddingVertical: 28, alignItems: 'center' },
  card: {
    width: 160,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  cardInner: { alignItems: 'center', width: '100%' },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  name: { fontSize: 13, fontWeight: '700' },
  headline: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    minHeight: 28,
  },
  followers: { fontSize: 10, marginTop: 4 },
  followBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minHeight: 34,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followText: { fontSize: 12, fontWeight: '700' },
});

export default SuggestionsRow;