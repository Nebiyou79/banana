// src/social/screens/PublicProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
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
  SkillChips,
  SocialLinksRow,
} from '../components/profile';
import { EmptyState, ErrorState } from '../components/shared';
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
  UserRole,
} from '../types';
import type { SocialStackParamList } from '../navigation/types';
import { getAvatarUrl, getCoverUrl } from '../utils/profileUtils';
import Avatar from '../components/shared/Avatar';
import RoleBadge from '../components/shared/RoleBadge';
import VerifiedBadge from '../components/shared/VerifiedBadge';
import { formatCount } from '../utils/format';

type TabKey =
  | 'info'
  | 'posts'
  | 'network'
  | 'experience'
  | 'portfolio'
  | 'products'
  | 'cv'
  | 'services';

const TABS_BY_ROLE: Record<UserRole, { key: TabKey; label: string }[]> = {
  candidate: [
    { key: 'info', label: 'Info' },
    { key: 'posts', label: 'Posts' },
    { key: 'network', label: 'Network' },
    { key: 'experience', label: 'Experience' },
    { key: 'cv', label: 'CV' },
  ],
  freelancer: [
    { key: 'info', label: 'Info' },
    { key: 'posts', label: 'Posts' },
    { key: 'network', label: 'Network' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'services', label: 'Services' },
  ],
  company: [
    { key: 'info', label: 'Info' },
    { key: 'posts', label: 'Posts' },
    { key: 'network', label: 'Network' },
    { key: 'products', label: 'Products' },
  ],
  organization: [
    { key: 'info', label: 'Info' },
    { key: 'posts', label: 'Posts' },
    { key: 'network', label: 'Network' },
  ],
};

// Local user-posts infinite query
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

  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const role = (profile?.user?.role ?? 'candidate') as UserRole;
  const tabs = TABS_BY_ROLE[role] ?? TABS_BY_ROLE.candidate;

  const posts = postsQ.data?.posts ?? [];
  const roleSpecific = useMemo(
    () => (profile?.roleSpecific ?? {}) as any,
    [profile?.roleSpecific]
  );

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
      <SafeAreaView style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.bg }]}
        edges={['top']}
      >
        <ErrorState message="Couldn't load profile" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const p = profile as PublicProfileT;
  const coverUri = getCoverUrl(p);
  const avatarUri = getAvatarUrl(p);
  const stats = p.socialStats ?? ({} as any);
  const verified = p.verificationStatus === 'verified';

  // ── Shared header (cover + avatar + info + actions) ──────────────
  const HeaderBlock = (
    <View>
      <View
        style={[styles.coverWrap, { backgroundColor: theme.primaryLighter }]}
      >
        {coverUri ? (
          <View style={StyleSheet.absoluteFill}>
            <ScrollView scrollEnabled={false}>
              <View
                style={{
                  width: '100%',
                  height: 200,
                  backgroundColor: theme.primaryLighter,
                }}
              >
                <View style={StyleSheet.absoluteFill}>
                  <Image uri={coverUri} />
                </View>
              </View>
            </ScrollView>
          </View>
        ) : null}
      </View>

      <View style={styles.avatarRow}>
        <View
          style={[
            styles.avatarWrap,
            { borderColor: theme.card, backgroundColor: theme.card },
          ]}
        >
          <Avatar uri={avatarUri ?? undefined} name={p.user?.name} size={80} />
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, { color: theme.text }]}
            numberOfLines={1}
          >
            {p.user?.name ?? 'Unknown'}
          </Text>
          {verified ? <VerifiedBadge size={16} /> : null}
          {p.user?.role ? <RoleBadge role={p.user.role} size="sm" /> : null}
        </View>
        {p.headline ? (
          <Text
            style={[styles.headline, { color: theme.subtext }]}
            numberOfLines={2}
          >
            {p.headline}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          {p.location ? (
            <View style={styles.metaItem}>
              <Ionicons
                name="location-outline"
                size={13}
                color={theme.muted}
              />
              <Text style={[styles.metaText, { color: theme.muted }]}>
                {p.location}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Text style={[styles.metaText, { color: theme.muted }]}>
              {formatCount(stats.followerCount ?? 0)} followers ·{' '}
              {formatCount(stats.postCount ?? 0)} posts
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleFollow}
            disabled={followPending}
            activeOpacity={0.85}
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
            {followPending ? (
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

          <TouchableOpacity
            onPress={handleShareProfile}
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
              name="share-outline"
              size={15}
              color={theme.text}
            />
            <Text style={[styles.actionText, { color: theme.text }]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={[styles.tabsWrap, { borderBottomColor: theme.border }]}
      >
        {tabs.map((t) => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.8}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? theme.primary : 'transparent',
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? '#fff' : theme.muted },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ── Tab content (everything except Posts) ───────────────────────
  const renderTabContent = () => {
    if (activeTab === 'info') {
      return (
        <View style={styles.tabContent}>
          {p.bio ? (
            <Text style={[styles.bio, { color: theme.text }]}>{p.bio}</Text>
          ) : (
            <EmptyState
              icon="information-circle-outline"
              title="No bio provided"
            />
          )}
          <SocialLinksRow links={p.socialLinks} />
          {roleSpecific.skills && roleSpecific.skills.length > 0 ? (
            <View style={{ paddingTop: 10 }}>
              <Text
                style={[styles.sectionTitle, { color: theme.text }]}
              >
                Skills
              </Text>
              <SkillChips skills={roleSpecific.skills} />
            </View>
          ) : null}
          {p.website ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(p.website!).catch(() => {})}
              style={styles.websiteRow}
              activeOpacity={0.7}
            >
              <Ionicons name="link-outline" size={16} color={theme.primary} />
              <Text
                style={[styles.websiteText, { color: theme.primary }]}
                numberOfLines={1}
              >
                {p.website.replace(/^https?:\/\//, '')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

    if (activeTab === 'network') {
      return (
        <View style={styles.tabContent}>
          <NetworkCell
            label="Followers"
            count={stats.followerCount ?? 0}
            onPress={() =>
              navigation.navigate('Followers', {
                userId,
                title: `${p.user?.name ?? ''} · Followers`,
              })
            }
          />
          <NetworkCell
            label="Following"
            count={stats.followingCount ?? 0}
            onPress={() =>
              navigation.navigate('Following', {
                userId,
                title: `${p.user?.name ?? ''} · Following`,
              })
            }
          />
          <NetworkCell label="Posts" count={stats.postCount ?? 0} />
        </View>
      );
    }

    if (activeTab === 'experience') {
      return (
        <View style={styles.tabContent}>
          <Section title="Experience">
            {(roleSpecific.experience ?? []).length > 0 ? (
              (roleSpecific.experience as any[]).map((e, i) => (
                <ExperienceItem key={e._id ?? i} experience={e} />
              ))
            ) : (
              <EmptyState
                icon="briefcase-outline"
                title="No experience listed"
              />
            )}
          </Section>
          <Section title="Education">
            {(roleSpecific.education ?? []).length > 0 ? (
              (roleSpecific.education as any[]).map((e, i) => (
                <EducationItem key={e._id ?? i} education={e} />
              ))
            ) : (
              <EmptyState
                icon="school-outline"
                title="No education listed"
              />
            )}
          </Section>
          <Section title="Certifications">
            {(roleSpecific.certifications ?? []).length > 0 ? (
              (roleSpecific.certifications as any[]).map((c, i) => (
                <CertificationItem key={c._id ?? i} cert={c} />
              ))
            ) : (
              <EmptyState
                icon="ribbon-outline"
                title="No certifications listed"
              />
            )}
          </Section>
        </View>
      );
    }

    if (activeTab === 'portfolio') {
      return (
        <View style={styles.tabContent}>
          {(roleSpecific.portfolio ?? []).length > 0 ? (
            (roleSpecific.portfolio as any[]).map((item, i) => (
              <PortfolioTile key={item._id ?? i} item={item} />
            ))
          ) : (
            <EmptyState
              icon="albums-outline"
              title="No portfolio items yet"
              subtitle="This freelancer hasn't added any work samples."
            />
          )}
        </View>
      );
    }

    if (activeTab === 'products') {
      return (
        <View style={styles.tabContent}>
          <CompanyInfoCard info={roleSpecific.companyInfo ?? {}} />
          <View style={{ height: 12 }} />
          <EmptyState
            icon="cube-outline"
            title="Products coming soon"
            subtitle="This company's product catalog will appear here."
          />
        </View>
      );
    }

    if (activeTab === 'cv') {
      const cvUrl: string | undefined =
        roleSpecific.cvUrl ?? roleSpecific.resumeUrl;
      return (
        <View style={styles.tabContent}>
          <EmptyState
            icon="document-text-outline"
            title={cvUrl ? 'CV available' : 'No CV uploaded'}
            subtitle={
              cvUrl
                ? 'Tap below to view this candidate\u2019s CV.'
                : 'This candidate hasn\u2019t uploaded a CV yet.'
            }
            actionLabel={cvUrl ? 'View CV' : undefined}
            onAction={
              cvUrl ? () => Linking.openURL(cvUrl).catch(() => {}) : undefined
            }
          />
        </View>
      );
    }

    if (activeTab === 'services') {
      return (
        <View style={styles.tabContent}>
          <EmptyState
            icon="briefcase-outline"
            title="Services & reviews coming soon"
            subtitle="Freelancer services and client reviews will appear here."
          />
        </View>
      );
    }

    return null;
  };

  // ── Render ──────────────────────────────────────────────────────
  if (activeTab === 'posts') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar onBack={() => navigation.goBack()} />
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
          ListHeaderComponent={HeaderBlock}
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
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {HeaderBlock}
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

// ── Fragments ────────────────────────────────────────────────────────
const TopBar: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <SafeAreaView edges={['top']} pointerEvents="box-none">
    <View style={styles.topBar} pointerEvents="box-none">
      <TouchableOpacity
        onPress={onBack}
        style={[styles.iconBtn, { backgroundColor: 'rgba(0,0,0,0.35)' }]}
        accessibilityLabel="Back"
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const theme = useSocialTheme();
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
};

const NetworkCell: React.FC<{
  label: string;
  count: number;
  onPress?: () => void;
}> = ({ label, count, onPress }) => {
  const theme = useSocialTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={[
        styles.networkCell,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View>
        <Text style={[styles.networkCount, { color: theme.text }]}>
          {formatCount(count)}
        </Text>
        <Text style={[styles.networkLabel, { color: theme.muted }]}>
          {label}
        </Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={theme.muted} />
      ) : null}
    </TouchableOpacity>
  );
};

// Tiny internal Image wrapper so the cover doesn't import react-native Image twice
import { Image as RNImage } from 'react-native';
const Image: React.FC<{ uri: string }> = ({ uri }) => (
  <RNImage source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
);

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
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
  coverWrap: { width: '100%', height: 200, overflow: 'hidden' },
  avatarRow: {
    paddingHorizontal: 16,
    marginTop: -40,
    flexDirection: 'row',
  },
  avatarWrap: {
    borderRadius: 9999,
    borderWidth: 4,
  },
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
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    minHeight: 44,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
  tabsWrap: {
    marginTop: 18,
    borderBottomWidth: 0.5,
  },
  tabsRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  tabText: { fontSize: 13, fontWeight: '700' },
  tabContent: { paddingHorizontal: 16, paddingTop: 16 },
  bio: { fontSize: 14, lineHeight: 21, marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    minHeight: 44,
  },
  websiteText: { fontSize: 13, fontWeight: '600' },
  networkCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    minHeight: 64,
  },
  networkCount: { fontSize: 18, fontWeight: '800' },
  networkLabel: { fontSize: 12, marginTop: 2 },
});

export default PublicProfileScreen;