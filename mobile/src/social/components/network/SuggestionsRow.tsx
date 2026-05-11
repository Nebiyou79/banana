// src/social/components/shared/SuggestionsRow.tsx
/**
 * SuggestionsRow — horizontal scrolling "People you may know" cards
 *
 * Theme migration:
 * - `elevation.xs`   → Platform.select() shadow inline
 * - `type.labelSm`   → `type.bodySm`
 * - `type.btnSm`     → `type.bodySm`
 * - `colors.textMuted` → valid on colors object ✅ (no change)
 * - `'#fff'` on follow button text → `colors.white`
 * All other tokens (colors.card, colors.border, colors.primary, etc.) ✅
 */
import React, { memo } from 'react';
import {
  ActivityIndicator,
  Platform,
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

const CARD_WIDTH = 156;

const SuggestionsRow: React.FC<Props> = memo(({
  suggestions, loading, followStatus, pendingFollowId, onUserPress, onFollowPress,
}) => {
  const { colors, spacing, radius, type } = useSocialTheme();

  if (loading && suggestions.length === 0) {
    return (
      <View style={[styles.loadingRow, { paddingVertical: spacing.xl - 4 }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.row,
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
        },
      ]}
    >
      {suggestions.map((u) => {
        const following = !!followStatus?.[u._id]?.following;
        const pending   = pendingFollowId === u._id;

        return (
          <View
            key={u._id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.sm + 4,
                width: CARD_WIDTH,
                // elevation.xs → Platform.select()
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 3,
                  },
                  android: { elevation: 2 },
                }),
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => onUserPress(u._id)}
              activeOpacity={0.8}
              style={styles.cardInner}
            >
              <Avatar uri={u.avatar} name={u.name} size={60} />
              <View
                style={[
                  styles.nameRow,
                  { marginTop: spacing.sm, gap: spacing.xs },
                ]}
              >
                {/* type.labelSm → type.bodySm */}
                <Text
                  style={[type.bodySm, { color: colors.text }]}
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
                  style={[
                    type.caption,
                    {
                      color: colors.textMuted,
                      textAlign: 'center',
                      marginTop: spacing.xs,
                      minHeight: 28,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {u.headline}
                </Text>
              ) : null}
              {(u as any).followerCount !== undefined ? (
                <Text
                  style={[
                    type.caption,
                    { color: colors.textMuted, marginTop: spacing.xs },
                  ]}
                >
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
                {
                  backgroundColor: following ? 'transparent' : colors.primary,
                  borderColor: following ? colors.border : 'transparent',
                  borderWidth: following ? 1 : 0,
                  borderRadius: radius.pill,
                  marginTop: spacing.sm,
                  minHeight: 34,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs + 2,
                },
              ]}
              accessibilityLabel={following ? 'Unfollow' : 'Follow'}
            >
              {pending ? (
                <ActivityIndicator
                  size="small"
                  // '#fff' for following=false → colors.white
                  color={following ? colors.text : colors.white}
                />
              ) : (
                /* type.btnSm → type.bodySm; '#fff' → colors.white */
                <Text
                  style={[
                    type.bodySm,
                    { color: following ? colors.text : colors.white },
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
});

SuggestionsRow.displayName = 'SuggestionsRow';

const styles = StyleSheet.create({
  row: {},
  loadingRow:  { alignItems: 'center' },
  card:        { borderWidth: 1, alignItems: 'center' },
  cardInner:   { alignItems: 'center', width: '100%' },
  nameRow:     { flexDirection: 'row', alignItems: 'center' },
  followBtn:   { alignItems: 'center', justifyContent: 'center', minWidth: 96 },
});

export default SuggestionsRow;
// ✅ theme-migrated
