import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { getAdForPlacement } from '../../theme/adsConfig';
import { useSocialTheme } from '../../theme/socialTheme';
import type { AdConfig, AdPlacement, Post, ReactionType } from '../../types';
import AdCard from '../ads/AdCard';
import EmptyState from '../shared/EmptyState';
import PostCard from '../post/PostCard';
import PostSkeleton from '../post/PostSkeleton';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type ListItem =
  | (Post & { __kind?: 'post' })
  | { __kind: 'ad'; id: string; ad: AdConfig };

interface Props {
  posts: Post[];
  loading: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onReact: (postId: string, reaction: ReactionType) => void;
  onRemoveReact: (postId: string) => void;
  onComment: (post: Post) => void;
  onShare: (post: Post) => void;
  onSave: (postId: string, isSaved: boolean) => void;
  onAuthorPress: (userId: string) => void;
  onHashtagPress?: (tag: string) => void;
  onMediaPress?: (post: Post, index: number) => void;
  onMenuPress?: (post: Post) => void;
  onAdPress?: (ad: AdConfig) => void;
  adPlacement?: AdPlacement;
  adFrequency?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: ComponentProps<typeof Ionicons>['name'];
  emptyAction?: { label: string; onPress: () => void };
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement;
}

/**
 * Shared feed list. Uses FlashList for performance, injects a role-specific
 * ad every `adFrequency` posts, and renders skeletons while loading.
 * Used by FeedScreen, MyPostsScreen, SavedPostsScreen, and profile posts.
 */
const FeedList: React.FC<Props> = memo(
  ({
    posts,
    loading,
    refreshing = false,
    onRefresh,
    onEndReached,
    hasNextPage,
    isFetchingNextPage,
    onReact,
    onRemoveReact,
    onComment,
    onShare,
    onSave,
    onAuthorPress,
    onHashtagPress,
    onMediaPress,
    onMenuPress,
    onAdPress,
    adPlacement = 'feed',
    adFrequency = 5,
    emptyTitle = 'Nothing here yet',
    emptySubtitle,
    emptyIcon,
    emptyAction,
    ListHeaderComponent,
  }) => {
    const theme = useSocialTheme();
    const ad = getAdForPlacement(theme.role, adPlacement);

    const items: ListItem[] = useMemo(() => {
      const result: ListItem[] = [];
      posts.forEach((post, i) => {
        result.push({ ...post, __kind: 'post' });
        if (
          ad &&
          (i + 1) % adFrequency === 0 &&
          i < posts.length - 1
        ) {
          result.push({
            __kind: 'ad',
            id: `ad_${post._id}_${i}`,
            ad,
          });
        }
      });
      return result;
    }, [posts, ad, adFrequency]);

    const renderItem = useCallback(
      ({ item }: { item: ListItem }) => {
        if (item.__kind === 'ad') {
          return <AdCard ad={item.ad} onPress={onAdPress} />;
        }
        const post = item as Post;
        return (
          <PostCard
            post={post}
            onReact={onReact}
            onRemoveReact={onRemoveReact}
            onComment={onComment}
            onShare={onShare}
            onSave={onSave}
            onAuthorPress={onAuthorPress}
            onHashtagPress={onHashtagPress}
            onMediaPress={onMediaPress}
            onMenuPress={onMenuPress}
          />
        );
      },
      [
        onReact,
        onRemoveReact,
        onComment,
        onShare,
        onSave,
        onAuthorPress,
        onHashtagPress,
        onMediaPress,
        onMenuPress,
        onAdPress,
      ]
    );

    const keyExtractor = useCallback(
      (item: ListItem) =>
        item.__kind === 'ad'
          ? (item as any).id
          : (item as Post)._id ?? String(Math.random()),
      []
    );

    const handleEnd = useCallback(() => {
      if (hasNextPage && !isFetchingNextPage) onEndReached?.();
    }, [hasNextPage, isFetchingNextPage, onEndReached]);

    // First-load skeleton
    if (loading && posts.length === 0) {
      return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
          {[0, 1, 2].map((i) => (
            <PostSkeleton key={i} />
          ))}
        </View>
      );
    }

    return (
      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={handleEnd}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.card}
            />
          ) : undefined
        }
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              subtitle={emptySubtitle}
              actionLabel={emptyAction?.label}
              onAction={emptyAction?.onPress}
            />
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              color={theme.primary}
              style={styles.footer}
            />
          ) : null
        }
        contentContainerStyle={styles.content}
      />
    );
  }
);

FeedList.displayName = 'FeedList';

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  footer: { paddingVertical: 22 },
});

export default FeedList;
