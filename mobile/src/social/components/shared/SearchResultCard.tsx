/**
 * SearchResultCard — one row in search results.
 * -----------------------------------------------------------------------------
 * Hierarchy (per spec PART C/D):
 *   1. Avatar + Name + Headline + Role  (identity)
 *   2. Follow / Following / Follow Back  (primary action)
 *   3. Chat icon (Start Chat / Message)  (secondary action)
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSocialTheme } from '../../theme/socialTheme';
import FollowButton from './FollowButton';
import ChatActionButton from './ChatActionButton';
import Avatar from './Avatar';
import type { ConnectionStatus } from '../../types/follow';
import type { ChatUser } from '../../types/chat';
import type { SearchResult } from '../../types';

export interface SearchResultCardProps {
  result: SearchResult;
  status: ConnectionStatus;
  onPress: () => void;
  onFollowPress: () => void;
  followLoading?: boolean;
}

const formatCount = (n?: number) => {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  status,
  onPress,
  onFollowPress,
  followLoading,
}) => {
  const theme = useSocialTheme();

  const otherUser: ChatUser = {
    _id: result._id,
    name: result.name,
    avatar: result.avatar,
    role: result.role,
    headline: result.headline,
    verificationStatus: result.verificationStatus,
  };

  return (
    <View style={[styles.card, { borderBottomColor: theme.border }]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.identity}
        accessibilityRole="button"
        accessibilityLabel={`View ${result.name}'s profile`}
      >
        <Avatar uri={result.avatar} name={result.name} size={48} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {result.name}
            </Text>
            {result.verificationStatus === 'verified' && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={theme.primary}
              />
            )}
          </View>
          {result.headline ? (
            <Text
              style={[styles.headline, { color: theme.subtext }]}
              numberOfLines={1}
            >
              {result.headline}
            </Text>
          ) : null}
          {typeof result.followerCount === 'number' && (
            <Text style={[styles.meta, { color: theme.muted }]}>
              {formatCount(result.followerCount)} followers
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <FollowButton
          status={status}
          onPress={onFollowPress}
          loading={followLoading}
          size="sm"
        />
        <ChatActionButton
          status={status}
          otherUser={otherUser}
          variant="icon"
          size="sm"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  headline: { fontSize: 12, marginTop: 1 },
  meta: { fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

export default SearchResultCard;