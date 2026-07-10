/**
 * mobile/src/social/screens/PublicProfileScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Visitor view of another user's public profile.
 *
 * FIXES in this version
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Network tab  — reads live follower/following/connection counts from the
 *    PublicProfile doc's socialStats (server increments these on follow events).
 *    Tapping Followers/Following navigates to FollowListScreen.
 *
 * 2. Analytics tab — shows the profile owner's public social stats + post
 *    engagement totals fetched from their public posts feed.
 *
 * 3. Portfolio tab — maps item.mediaUrls / item.mediaUrl → item.images[]
 *    that PortfolioTile expects, so images appear instead of the fallback icon.
 *
 * 4. Services tab  — renders a rich ServiceCard layout matching the owner view.
 *
 * 5. Accepts { userId? } OR { username? } route params (username slug support).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Ionicons }     from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import React, {
  useCallback, useMemo, useRef, useState,
} from 'react';
import {
  ActivityIndicator, Animated, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeedList }      from '../components/feed';
import { CommentsSheet } from '../components/post';
import {
  CertificationItem, CompanyInfoCard,
  EducationItem, ExperienceItem,
  PortfolioTile, SkillChips, SocialLinksRow,
} from '../components/profile';
import PublicProfileHeader                   from '../components/publicProfile/PublicProfileHeader';
import { PublicProfileTabBar, usePublicTabs } from '../components/publicProfile/PublicProfileTabs';
import { EmptyState, ErrorState }            from '../components/shared';

import { useAuthStore }        from '../../store/authStore';
import {
  useDislike, useReact, useRemoveInteraction,
  useSharePost, useToggleSavePost,
} from '../hooks';
import { useConnectionStatus, useToggleFollow } from '../hooks/useFollow';
import {
  usePublicProfileById,
  usePublicProfileByUsername,
} from '../hooks/usePublicProfileNew';
import { useProfilePostsFeed }  from '../hooks/useProfilePostsFeed';
import { useSocialTheme }       from '../theme/socialTheme';
import { formatCount }          from '../utils/format';
import type { Post, UserRole, ReactionType } from '../types';
import type { ChatUser }        from '../types/chat';

// ── Route params ──────────────────────────────────────────────────────────────

type RouteParams = {
  PublicProfile: { userId?: string; username?: string; userName?: string };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const StaggerCard: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  React.useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    }, index * 50);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

const SectionBlock: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({
  title, icon, children,
}) => {
  const theme = useSocialTheme();
  return (
    <View style={S.sectionBlock}>
      <View style={S.sectionHeader}>
        <View style={[S.sectionIcon, { backgroundColor: theme.withAlpha(theme.colors.primary, 0.12) }]}>
          <Ionicons name={icon as any} size={14} color={theme.colors.primary} />
        </View>
        <Text style={[S.sectionTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: number; color?: string }> = ({
  icon, label, value, color,
}) => {
  const theme = useSocialTheme();
  const tint  = color ?? theme.colors.primary;
  return (
    <View style={[S.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[S.statIconWrap, { backgroundColor: theme.withAlpha(tint, 0.14) }]}>
        <Ionicons name={icon as any} size={18} color={tint} />
      </View>
      <Text style={[S.statValue, { color: theme.text }]}>{formatCount(value)}</Text>
      <Text style={[S.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const PublicProfileScreen: React.FC = () => {
  const theme      = useSocialTheme();
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<RouteParams, 'PublicProfile'>>();

  const { userId: paramUserId, username: paramUsername, userName } = route.params ?? {};
  // Support both spellings used across the codebase
  const resolvedUsername = paramUsername ?? userName;

  const myId = useAuthStore((s) => s.user?._id);

  // ── Fetch profile ─────────────────────────────────────────────────────────
  const byIdQ   = usePublicProfileById(paramUserId);
  const bySlugQ = usePublicProfileByUsername(resolvedUsername);
  const profileQ = resolvedUsername ? bySlugQ : byIdQ;
  const p        = profileQ.data;

  const targetUserId = useMemo(
    () => (typeof p?.user === 'string' ? p.user : p?.user?._id) ?? paramUserId,
    [p, paramUserId],
  );
  const isSelf = Boolean(myId && targetUserId && myId === String(targetUserId));

  // ── Follow ────────────────────────────────────────────────────────────────
  const { status: connStatus, isLoading: connLoading } =
    useConnectionStatus(isSelf ? undefined : targetUserId as string);
  const toggleFollowM = useToggleFollow();
  const handleFollowPress = useCallback(() => {
    if (!targetUserId) return;
    toggleFollowM.mutate({ targetId: String(targetUserId), source: 'profile' });
  }, [targetUserId, toggleFollowM]);

  // ── Post interactions ─────────────────────────────────────────────────────
  const { mutate: react }       = useReact();
  const { mutate: removeReact } = useRemoveInteraction();
  const { mutate: dislike }     = useDislike();
  const { mutate: toggleSave }  = useToggleSavePost();
  const { mutate: share }       = useSharePost();

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const role = ((p?.role ?? p?.user?.role ?? 'candidate') as UserRole);
  const { activeTab, handleTabPress } = usePublicTabs(role);

  // ── Profile's public posts ────────────────────────────────────────────────
  const postsQ = useProfilePostsFeed(targetUserId as string);
  const posts  = postsQ.data?.posts ?? [];

  // Aggregate engagement for analytics
  const engagement = useMemo(() => posts.reduce(
    (acc, pp) => ({
      likes:    acc.likes    + (pp.stats?.likes    ?? 0),
      comments: acc.comments + (pp.stats?.comments ?? 0),
      shares:   acc.shares   + (pp.stats?.shares   ?? 0),
    }),
    { likes: 0, comments: 0, shares: 0 },
  ), [posts]);

  // ── Comments sheet ────────────────────────────────────────────────────────
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Role-specific data from PublicProfile doc ─────────────────────────────
  const skills         = asArr<any>(p?.skills);
  const education      = asArr<any>(p?.education);
  const experience     = asArr<any>(p?.experience);
  const certifications = asArr<any>(p?.certifications);
  const portfolio      = asArr<any>(p?.portfolio);
  const services       = asArr<any>(p?.services);
  const companyInfo    = (p as any)?.companyInfo ?? null;

  // ── Social stats from the profile doc (incremented server-side) ───────────
  const ss = p?.socialStats ?? {};
  const statFollowers   = ss.followerCount   ?? ss.followers   ?? 0;
  const statFollowing   = ss.followingCount  ?? ss.following   ?? 0;
  const statConnections = ss.connectionCount ?? ss.connections ?? 0;

  // ── Chat target ───────────────────────────────────────────────────────────
  const otherUser: ChatUser | undefined = targetUserId
    ? {
        _id:    String(targetUserId),
        name:   p?.displayName ?? (p?.user as any)?.name ?? 'User',
        avatar: p?.avatar?.secure_url ?? (p?.user as any)?.avatar,
        role,
      }
    : undefined;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleReact = useCallback((postId: string, reaction: ReactionType) => {
    const cur = posts.find((pp) => pp._id === postId);
    react({ postId, reaction, hasInteraction: !!cur?.userInteraction });
  }, [posts, react]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (profileQ.isLoading || connLoading) return (
    <SafeAreaView style={[S.center, { backgroundColor: theme.bg }]}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </SafeAreaView>
  );

  if (profileQ.isError || !p) return (
    <SafeAreaView style={[S.center, { backgroundColor: theme.bg }]}>
      <ErrorState message="Profile not found" onRetry={profileQ.refetch} />
    </SafeAreaView>
  );

  // ── Shared header ─────────────────────────────────────────────────────────
  const HeaderBlock = (
    <View>
      <PublicProfileHeader
        profile={p}
        isOwner={isSelf}
        connectionStatus={isSelf ? undefined : connStatus}
        followPending={toggleFollowM.isPending}
        onFollowPress={handleFollowPress}
        otherUser={otherUser}
        scrollY={scrollY}
        onFollowersPress={(uid) =>
          navigation.navigate('Followers', { userId: uid ?? targetUserId, title: 'Followers' })
        }
        onFollowingPress={(uid) =>
          navigation.navigate('Following', { userId: uid ?? targetUserId, title: 'Following' })
        }
      />
      <PublicProfileTabBar role={role} activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // Tab renderers
  // ══════════════════════════════════════════════════════════════════════════

  // ── Info ──────────────────────────────────────────────────────────────────
  const renderInfo = () => (
    <View style={S.tab}>
      {p.bio ? (
        <StaggerCard index={0}>
          <View style={[S.bioCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[S.bioText, { color: theme.text }]}>{p.bio}</Text>
          </View>
        </StaggerCard>
      ) : (
        <EmptyState icon="information-circle-outline" title="No bio yet" />
      )}

      {skills.length > 0 && (
        <StaggerCard index={1}>
          <SectionBlock title="Skills" icon="flash-outline"><SkillChips skills={skills} /></SectionBlock>
        </StaggerCard>
      )}

      {companyInfo && (role === 'company' || role === 'organization') && (
        <StaggerCard index={2}>
          <SectionBlock title="About" icon="business-outline">
            <CompanyInfoCard info={companyInfo} />
          </SectionBlock>
        </StaggerCard>
      )}

      {p.socialLinks && (
        <StaggerCard index={3}>
          <SectionBlock title="Social links" icon="share-social-outline">
            <SocialLinksRow links={p.socialLinks as any} />
          </SectionBlock>
        </StaggerCard>
      )}
    </View>
  );

  // ── Education & Experience ────────────────────────────────────────────────
  const renderEduExp = () => {
    const hasAny = experience.length || education.length;
    if (!hasAny) return (
      <View style={S.tab}>
        <EmptyState icon="briefcase-outline" title="No experience added yet" />
      </View>
    );
    return (
      <View style={S.tab}>
        {experience.length > 0 && (
          <SectionBlock title="Experience" icon="briefcase-outline">
            {experience.map((e: any, i: number) => (
              <StaggerCard key={e._id ?? i} index={i}><ExperienceItem experience={e} /></StaggerCard>
            ))}
          </SectionBlock>
        )}
        {education.length > 0 && (
          <SectionBlock title="Education" icon="school-outline">
            {education.map((e: any, i: number) => (
              <StaggerCard key={e._id ?? i} index={i}><EducationItem education={e} /></StaggerCard>
            ))}
          </SectionBlock>
        )}
      </View>
    );
  };

  // ── Certifications ────────────────────────────────────────────────────────
  const renderCerts = () => (
    <View style={S.tab}>
      {certifications.length === 0
        ? <EmptyState icon="ribbon-outline" title="No certifications yet" />
        : certifications.map((c: any, i: number) => (
            <StaggerCard key={c._id ?? i} index={i}><CertificationItem cert={c} /></StaggerCard>
          ))
      }
    </View>
  );

  // ── Portfolio (FIX #3 — image mapping) ───────────────────────────────────
  const renderPortfolio = () => (
    <View style={S.tab}>
      {portfolio.length === 0
        ? <EmptyState icon="albums-outline" title="No portfolio items yet" />
        : portfolio.map((item: any, i: number) => {
            // Map from the backend's mediaUrls / mediaUrl to the images[]
            // array that PortfolioTile renders
            const images: string[] =
              Array.isArray(item.images) && item.images.length > 0
                ? item.images
                : Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0
                ? item.mediaUrls
                : item.mediaUrl
                ? [item.mediaUrl]
                : [];

            return (
              <StaggerCard key={item._id ?? i} index={i}>
                <PortfolioTile
                  item={{ ...item, images, technologies: item.technologies ?? [] }}
                  onPress={() =>
                    navigation.navigate('PublicProfile', { userId: String(targetUserId) })
                  }
                />
              </StaggerCard>
            );
          })
      }
    </View>
  );

  // ── Services (FIX #4 — rich ServiceCard layout) ───────────────────────────
  const renderServices = () => (
    <View style={S.tab}>
      {services.length === 0
        ? <EmptyState icon="construct-outline" title="No services listed yet" />
        : services.map((s: any, i: number) => {
            const price    = s.priceRange?.min ?? s.price ?? null;
            const currency = s.priceRange?.currency ?? '$';
            const priceMax = s.priceRange?.max;
            const delivery = s.deliveryTime ?? s.deliveryDays ?? null;

            return (
              <StaggerCard key={s._id ?? i} index={i}>
                <View style={[S.serviceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={S.serviceHeaderRow}>
                    <View style={[S.serviceIconBox, { backgroundColor: theme.withAlpha(theme.colors.primary, 0.12) }]}>
                      <Ionicons name="construct-outline" size={16} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[S.serviceTitle, { color: theme.text }]}>{s.title}</Text>
                      {s.category
                        ? <Text style={[S.serviceCat, { color: theme.muted }]}>{s.category}</Text>
                        : null
                      }
                    </View>
                  </View>

                  {s.description ? (
                    <Text style={[S.serviceDesc, { color: theme.subtext }]} numberOfLines={3}>
                      {s.description}
                    </Text>
                  ) : null}

                  <View style={S.serviceFooter}>
                    {price != null && (
                      <View style={S.metaRow}>
                        <Ionicons name="pricetag-outline" size={13} color={theme.colors.primary} />
                        <Text style={[S.priceText, { color: theme.colors.primary }]}>
                          {currency}{Number(price).toLocaleString()}
                          {priceMax ? `–${Number(priceMax).toLocaleString()}` : '+'}
                        </Text>
                      </View>
                    )}
                    {delivery != null && (
                      <View style={S.metaRow}>
                        <Ionicons name="time-outline" size={13} color={theme.muted} />
                        <Text style={[S.deliveryText, { color: theme.muted }]}>
                          {delivery} day{Number(delivery) !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </StaggerCard>
            );
          })
      }
    </View>
  );

  // ── Network (FIX #1 — uses profile doc socialStats, tappable rows) ────────
  const renderNetwork = () => {
    const rows = [
      { label: 'Followers',   count: statFollowers,   icon: 'people',     nav: 'Followers', params: { userId: targetUserId, title: 'Followers' } },
      { label: 'Following',   count: statFollowing,   icon: 'person-add', nav: 'Following', params: { userId: targetUserId, title: 'Following' } },
      { label: 'Connections', count: statConnections, icon: 'git-network', nav: null,        params: null },
    ] as const;

    return (
      <View style={S.tab}>
        {rows.map((item, i) => (
          <StaggerCard key={item.label} index={i}>
            <TouchableOpacity
              onPress={() => item.nav ? navigation.navigate(item.nav, item.params) : undefined}
              disabled={!item.nav}
              activeOpacity={item.nav ? 0.75 : 1}
              style={[S.networkCell, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={[S.networkIcon, { backgroundColor: theme.withAlpha(theme.colors.primary, 0.10) }]}>
                <Ionicons name={item.icon as any} size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[S.networkCount, { color: theme.text }]}>{formatCount(item.count)}</Text>
                <Text style={[S.networkLabel, { color: theme.muted }]}>{item.label}</Text>
              </View>
              {item.nav ? <Ionicons name="chevron-forward" size={18} color={theme.muted} /> : null}
            </TouchableOpacity>
          </StaggerCard>
        ))}
      </View>
    );
  };

  // ── Analytics (FIX #2 — public social stats + post engagement) ───────────
  const renderSocialData = () => {
    const verStatus = p.verificationStatus ?? 'none';
    const verConfig: Record<string, { icon: string; label: string; bg: string; clr: string }> = {
      verified: { icon: 'checkmark-circle',    label: 'Verified account',     bg: '#16a34a1A', clr: '#16a34a' },
      pending:  { icon: 'time-outline',         label: 'Verification pending',  bg: '#d977061A', clr: '#d97706' },
      rejected: { icon: 'close-circle-outline', label: 'Verification rejected', bg: '#dc26261A', clr: '#dc2626' },
      none:     { icon: 'shield-outline',       label: 'Not verified',          bg: theme.withAlpha(theme.muted, 0.15), clr: theme.muted },
    };
    const vc = verConfig[verStatus] ?? verConfig.none;

    return (
      <View style={[S.tab, { paddingBottom: 32 }]}>
        {/* Verification banner */}
        <View style={[S.verBanner, { backgroundColor: vc.bg }]}>
          <Ionicons name={vc.icon as any} size={18} color={vc.clr} />
          <Text style={[S.verText, { color: vc.clr }]}>{vc.label}</Text>
        </View>

        {/* Social stats */}
        <Text style={[S.gridLabel, { color: theme.muted }]}>SOCIAL</Text>
        <View style={S.grid}>
          <StatCard icon="people"      label="Followers"   value={statFollowers}   color={theme.colors.primary} />
          <StatCard icon="person-add"  label="Following"   value={statFollowing}   color={theme.colors.primary} />
          <StatCard icon="git-network" label="Connections" value={statConnections} color="#0ea5e9" />
          {(ss.profileViews ?? 0) > 0 && (
            <StatCard icon="eye" label="Profile views" value={ss.profileViews ?? 0} color="#10b981" />
          )}
        </View>

        {/* Post engagement */}
        <Text style={[S.gridLabel, { color: theme.muted, marginTop: 8 }]}>POSTS & ENGAGEMENT</Text>
        <View style={S.grid}>
          <StatCard icon="newspaper"    label="Posts"     value={posts.length}       color="#8b5cf6" />
          <StatCard icon="heart"        label="Likes"     value={engagement.likes}   color="#ef4444" />
          <StatCard icon="chatbubble"   label="Comments"  value={engagement.comments} color="#f59e0b" />
          <StatCard icon="share-social" label="Shares"    value={engagement.shares}  color="#06b6d4" />
        </View>
      </View>
    );
  };

  const renderProducts = () => (
    <View style={S.tab}>
      <EmptyState
        icon="cube-outline"
        title="Products"
        subtitle="This company's products will appear here."
      />
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':        return renderInfo();
      case 'edu':         return renderEduExp();
      case 'certs':       return renderCerts();
      case 'portfolio':   return renderPortfolio();
      case 'services':    return renderServices();
      case 'network':     return renderNetwork();
      case 'social-data': return renderSocialData();
      case 'products':    return renderProducts();
      default:            return null;
    }
  };

  // ── Posts tab ─────────────────────────────────────────────────────────────
  if (activeTab === 'posts') {
    return (
      <View style={[{ flex: 1 }, { backgroundColor: theme.bg }]}>
        <FeedList
          posts={posts}
          loading={postsQ.isLoading}
          refreshing={postsQ.isRefetching}
          onRefresh={() => postsQ.refetch()}
          onEndReached={() => postsQ.hasNextPage && postsQ.fetchNextPage()}
          hasNextPage={postsQ.hasNextPage}
          isFetchingNextPage={postsQ.isFetchingNextPage}
          onReact={handleReact}
          onRemoveReact={removeReact}
          onDislike={(id) => dislike({ postId: id })}
          onComment={(post) => { setSelectedPost(post); setSheetVisible(true); }}
          onShare={(post) => share(post._id)}
          onSave={(id, isSaved) => toggleSave({ id, isSaved })}
          onAuthorPress={(uid) => navigation.navigate('PublicProfile', { userId: uid })}
          ListHeaderComponent={HeaderBlock}
          emptyTitle="No posts yet"
          emptySubtitle="Posts from this user will appear here."
          emptyIcon="newspaper-outline"
        />
        <CommentsSheet
          visible={sheetVisible}
          post={selectedPost}
          onClose={() => setSheetVisible(false)}
          onAuthorPress={(uid) => navigation.navigate('PublicProfile', { userId: uid })}
        />
      </View>
    );
  }

  // ── Non-posts tabs ────────────────────────────────────────────────────────
  return (
    <View style={[{ flex: 1 }, { backgroundColor: theme.bg }]}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {HeaderBlock}
        {renderTabContent()}
      </Animated.ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tab:    { paddingHorizontal: 16, paddingTop: 16 },

  bioCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 8 },
  bioText: { fontSize: 14, lineHeight: 22 },

  sectionBlock:  { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIcon:   { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Network
  networkCell:  { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, minHeight: 68 },
  networkIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  networkCount: { fontSize: 22, fontWeight: '800' },
  networkLabel: { fontSize: 12, marginTop: 2 },

  // Services
  serviceCard:      { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  serviceHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  serviceIconBox:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  serviceTitle:     { fontSize: 14, fontWeight: '700' },
  serviceCat:       { fontSize: 11, marginTop: 2 },
  serviceDesc:      { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  serviceFooter:    { flexDirection: 'row', gap: 14, marginTop: 6 },
  metaRow:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceText:        { fontSize: 13, fontWeight: '700' },
  deliveryText:     { fontSize: 12 },

  // Analytics
  verBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 16 },
  verText:   { fontSize: 13, fontWeight: '600' },
  gridLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  statCard:  { width: '47%', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 6 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});

export default PublicProfileScreen;