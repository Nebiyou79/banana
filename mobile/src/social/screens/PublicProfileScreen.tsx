// src/social/screens/PublicProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedList } from '../components/feed';
import { CommentsSheet } from '../components/post';
import {
  CertificationItem,
  CompanyInfoCard,
  EducationItem,
  ExperienceItem,
  PortfolioTile,
  ProfileHeader,
  SkillChips,
  SocialLinksRow,
} from '../components/profile';
import { ErrorState, SectionHeader } from '../components/shared';
import {
  useDislike,
  usePublicProfile,
  useReact,
  useRemoveInteraction,
  useSharePost,
  useToggleFollow,
  useToggleSavePost,
} from '../hooks';
import { SOCIAL_KEYS } from '../hooks/queryKeys';
import { postService } from '../services/postService';
import { sanitizeSocialData } from '../services/sanitize';
import { useSocialTheme } from '../theme/socialTheme';
import type {
  Post,
  PublicProfile as PublicProfileT,
  ReactionType,
} from '../types';
import type { SocialStackParamList } from '../navigation/types';

const useUserPosts = (userId: string) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.profilePosts(userId),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await postService.getProfilePosts(userId, {
        page: pageParam as number,
        limit: 10,
      });
      const raw = res.data;
      const data: Post[] = sanitizeSocialData
        .posts(raw?.data ?? [])
        .map(postService.fixPostMediaUrls);
      return { data, pagination: raw?.pagination };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60,
    select: (d) => ({ ...d, posts: d.pages.flatMap((p) => p.data ?? []) }),
  });

type PublicProfileRoute = RouteProp<SocialStackParamList, 'PublicProfile'>;

const PublicProfileScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<PublicProfileRoute>();
  const userId = route.params?.userId ?? '';

  const { profile, isLoading, isError, refetch, isFollowing } =
    usePublicProfile(userId);
  const postsQ = useUserPosts(userId);
  const { mutate: toggleFollow, isPending: followPending } = useToggleFollow();
  const { mutate: react } = useReact();
  const { mutate: removeReact } = useRemoveInteraction();
  const { mutate: dislike } = useDislike();
  const { mutate: toggleSave } = useToggleSavePost();
  const { mutate: sharePost } = useSharePost();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const posts = postsQ.data?.posts ?? [];

  const handleReact = useCallback(
    (postId: string, reaction: ReactionType) => {
      const current = posts.find((p) => p._id === postId);
      react({
        postId,
        reaction,
        hasInteraction: !!current?.userInteraction,
      });
    },
    [posts, react]
  );

  const handleDislike = useCallback(
    (postId: string) => dislike({ postId }),
    [dislike]
  );

  const handleFollow = useCallback(() => {
    if (!userId) return;
    toggleFollow({ targetId: userId, targetType: 'User', source: 'profile' });
  }, [userId, toggleFollow]);

  const handleShareProfile = useCallback(async () => {
    try {
      await Share.share({
        message: `${profile?.user?.name ?? 'Check out this profile'} on Banana`,
      });
    } catch {
      /* noop */
    }
  }, [profile?.user?.name]);

  const handleSharePost = useCallback(
    async (post: Post) => {
      sharePost(post._id);
      try {
        await Share.share({
          message: post.content?.slice(0, 180) ?? 'Check this post on Banana',
        });
      } catch {
        /* noop */
      }
    },
    [sharePost]
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.bg }]}
      >
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.bg }]}>
        <ErrorState message="Couldn't load profile" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const p = profile as PublicProfileT;
  const role = p.user?.role;
  const showPortfolio =
    role === 'freelancer' || role === 'company' || role === 'organization';
  const showCompanyInfo = role === 'company' || role === 'organization';
  const roleSpecific = p.roleSpecific ?? ({} as any);

  const Header = (
    <View>
      <ProfileHeader
        profile={p}
        isOwn={false}
        isFollowing={isFollowing}
        followLoading={followPending}
        onFollowPress={handleFollow}
        onFollowersPress={() =>
          navigation.navigate('Followers', {
            userId,
            title: `${p.user?.name ?? ''} · Followers`,
          })
        }
        onFollowingPress={() =>
          navigation.navigate('Following', {
            userId,
            title: `${p.user?.name ?? ''} · Following`,
          })
        }
      />

      <View style={{ paddingHorizontal: 16 }}>
        <SocialLinksRow links={p.socialLinks} />
      </View>

      {roleSpecific.skills && roleSpecific.skills.length > 0 ? (
        <>
          <SectionHeader title="Skills" />
          <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
            <SkillChips skills={roleSpecific.skills} />
          </View>
        </>
      ) : null}

      {roleSpecific.experience && roleSpecific.experience.length > 0 ? (
        <>
          <SectionHeader title="Experience" />
          <View style={styles.section}>
            {roleSpecific.experience.map((e: any, i: number) => (
              <ExperienceItem key={e._id ?? i} experience={e} />
            ))}
          </View>
        </>
      ) : null}

      {roleSpecific.education && roleSpecific.education.length > 0 ? (
        <>
          <SectionHeader title="Education" />
          <View style={styles.section}>
            {roleSpecific.education.map((e: any, i: number) => (
              <EducationItem key={e._id ?? i} education={e} />
            ))}
          </View>
        </>
      ) : null}

      {roleSpecific.certifications &&
      roleSpecific.certifications.length > 0 ? (
        <>
          <SectionHeader title="Certifications" />
          <View style={styles.section}>
            {roleSpecific.certifications.map((c: any, i: number) => (
              <CertificationItem key={c._id ?? i} cert={c} />
            ))}
          </View>
        </>
      ) : null}

      {showCompanyInfo && roleSpecific.companyInfo ? (
        <>
          <SectionHeader title="About" />
          <View style={styles.section}>
            <CompanyInfoCard info={roleSpecific.companyInfo} />
          </View>
        </>
      ) : null}

      {showPortfolio &&
      roleSpecific.portfolio &&
      roleSpecific.portfolio.length > 0 ? (
        <>
          <SectionHeader title="Portfolio" />
          <View style={styles.section}>
            {roleSpecific.portfolio.map((item: any, i: number) => (
              <PortfolioTile key={item._id ?? i} item={item} />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="Posts" />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView edges={['top']} pointerEvents="box-none">
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.iconBtn, { backgroundColor: 'rgba(0,0,0,0.35)' }]}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShareProfile}
            style={[styles.iconBtn, { backgroundColor: 'rgba(0,0,0,0.35)' }]}
            accessibilityLabel="Share profile"
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FeedList
        posts={posts}
        loading={postsQ.isLoading}
        refreshing={postsQ.isRefetching}
        onRefresh={() => {
          refetch();
          postsQ.refetch();
        }}
        onEndReached={() => postsQ.hasNextPage && postsQ.fetchNextPage()}
        hasNextPage={postsQ.hasNextPage}
        isFetchingNextPage={postsQ.isFetchingNextPage}
        onReact={handleReact}
        onRemoveReact={removeReact}
        onDislike={handleDislike}
        onComment={(post) => {
          setSelectedPost(post);
          setSheetVisible(true);
        }}
        onShare={handleSharePost}
        onSave={(id, isSaved) => toggleSave({ id, isSaved })}
        onAuthorPress={(uid) =>
          navigation.navigate('PublicProfile', { userId: uid })
        }
        adPlacement="profile"
        ListHeaderComponent={Header}
        emptyTitle="No posts yet"
        emptySubtitle={`${p.user?.name ?? 'This user'} hasn't posted anything.`}
        emptyIcon="newspaper-outline"
      />

      <CommentsSheet
        visible={sheetVisible}
        post={selectedPost}
        onClose={() => setSheetVisible(false)}
        onAuthorPress={(uid) =>
          navigation.navigate('PublicProfile', { userId: uid })
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: 16, paddingBottom: 8 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    zIndex: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PublicProfileScreen;