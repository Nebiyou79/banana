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
import type { Comment } from '../../types';
import { formatCount, formatRelativeTime } from '../../utils/format';
import Avatar from '../shared/Avatar';
import RoleBadge from '../shared/RoleBadge';

interface Props {
  comment: Comment;
  onAuthorPress?: (userId: string) => void;
  onLikePress?: (commentId: string) => void;
  onReplyPress?: (comment: Comment) => void;
}

const CommentItem: React.FC<Props> = memo(
  ({ comment, onAuthorPress, onLikePress, onReplyPress }) => {
    const theme = useSocialTheme();
    const name = comment.author?.name ?? 'Unknown';
    const hasReplies = (comment.metadata?.replyCount ?? 0) > 0;

    return (
      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => onAuthorPress?.(comment.author?._id ?? '')}
          activeOpacity={0.7}
        >
          <Avatar
            uri={comment.author?.avatar}
            name={name}
            size={SOCIAL_LAYOUT.avatarSm}
          />
        </TouchableOpacity>

        <View style={styles.body}>
          <View style={[styles.bubble, { backgroundColor: theme.cardAlt }]}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.name, { color: theme.text }]}
                numberOfLines={1}
              >
                {name}
              </Text>
              {comment.author?.role ? (
                <RoleBadge role={comment.author.role} />
              ) : null}
            </View>
            <Text style={[styles.content, { color: theme.text }]}>
              {comment.content}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: theme.muted }]}>
              {formatRelativeTime(comment.createdAt)}
            </Text>

            <TouchableOpacity
              onPress={() => onLikePress?.(comment._id)}
              activeOpacity={0.6}
              style={styles.metaBtn}
              accessibilityLabel={comment.isLiked ? 'Unlike comment' : 'Like comment'}
            >
              <Ionicons
                name={comment.isLiked ? 'heart' : 'heart-outline'}
                size={14}
                color={comment.isLiked ? theme.primary : theme.muted}
              />
              {comment.likes > 0 ? (
                <Text
                  style={[
                    styles.metaText,
                    {
                      color: comment.isLiked ? theme.primary : theme.muted,
                      fontWeight: comment.isLiked ? '700' : '500',
                    },
                  ]}
                >
                  {formatCount(comment.likes)}
                </Text>
              ) : (
                <Text style={[styles.metaText, { color: theme.muted }]}>
                  Like
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onReplyPress?.(comment)}
              activeOpacity={0.6}
              style={styles.metaBtn}
            >
              <Text
                style={[
                  styles.metaText,
                  { color: theme.muted, fontWeight: '600' },
                ]}
              >
                Reply
              </Text>
            </TouchableOpacity>
          </View>

          {hasReplies ? (
            <TouchableOpacity
              onPress={() => onReplyPress?.(comment)}
              activeOpacity={0.6}
              style={styles.viewReplies}
            >
              <View
                style={[styles.replyLine, { backgroundColor: theme.border }]}
              />
              <Text style={[styles.replyText, { color: theme.subtext }]}>
                View {formatCount(comment.metadata.replyCount)} replies
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }
);

CommentItem.displayName = 'CommentItem';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  body: { flex: 1 },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: { fontSize: 13, fontWeight: '700', maxWidth: 160 },
  content: { fontSize: 14, lineHeight: 19 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  metaText: { fontSize: 11 },
  metaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingVertical: 6,
  },
  viewReplies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 4,
    minHeight: 36,
  },
  replyLine: { width: 18, height: 1 },
  replyText: { fontSize: 12, fontWeight: '600' },
});

export default CommentItem;