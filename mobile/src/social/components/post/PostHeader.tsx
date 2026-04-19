import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { useSocialTheme } from '../../theme/socialTheme';
import type { PostAuthor } from '../../types';
import { formatRelativeTime, truncate } from '../../utils/format';
import Avatar from '../shared/Avatar';
import RoleBadge from '../shared/RoleBadge';
import VerifiedBadge from '../shared/VerifiedBadge';

interface Props {
  author: PostAuthor;
  createdAt: string;
  pinned?: boolean;
  onAuthorPress?: () => void;
  onMenuPress?: () => void;
  showMenu?: boolean;
}

const PostHeader: React.FC<Props> = memo(
  ({ author, createdAt, pinned, onAuthorPress, onMenuPress, showMenu }) => {
    const theme = useSocialTheme();
    const name = author?.name ?? 'Unknown';

    return (
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onAuthorPress}
          activeOpacity={0.7}
          style={styles.authorRow}
        >
          <Avatar
            uri={author?.avatar}
            name={name}
            size={SOCIAL_LAYOUT.avatarMd}
          />
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.name, { color: theme.text }]}
                numberOfLines={1}
              >
                {name}
              </Text>
              <VerifiedBadge status={author?.verificationStatus} />
              {author?.role ? <RoleBadge role={author.role} /> : null}
            </View>
            <Text
              style={[styles.meta, { color: theme.subtext }]}
              numberOfLines={1}
            >
              {author?.headline ? (
                <>
                  {truncate(author.headline, 42)}
                  <Text style={{ color: theme.muted }}>
                    {'  ·  ' + formatRelativeTime(createdAt)}
                  </Text>
                </>
              ) : (
                formatRelativeTime(createdAt)
              )}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.right}>
          {pinned ? (
            <Ionicons
              name="pin"
              size={16}
              color={theme.primary}
              style={{ marginRight: 4 }}
            />
          ) : null}
          {showMenu ? (
            <TouchableOpacity
              onPress={onMenuPress}
              style={styles.menuBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="More options"
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={20}
                color={theme.muted}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }
);

PostHeader.displayName = 'PostHeader';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  authorRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: 10 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  name: { fontSize: 14, fontWeight: '700', maxWidth: 180 },
  meta: { fontSize: 12, marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center' },
  menuBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PostHeader;