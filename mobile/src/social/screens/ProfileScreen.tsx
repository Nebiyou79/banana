/**
 * mobile/src/social/screens/MyPublicProfileScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner's view of their own public profile.
 *
 * FIXES in this version
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Portfolio tab  — was reading p?.portfolio from the stale PublicProfile doc.
 *    Now calls useFreelancerPortfolio() directly so items appear immediately.
 *
 * 2. Services tab   — same issue, same fix via useFreelancerServices().
 *    Renders a rich ServiceCard layout (title, category, price, delivery, status).
 *
 * 3. Network tab    — was reading p.socialStats.followerCount (always 0 on new
 *    docs). Now uses useFollowStats() — the live /follow/stats endpoint.
 *    Follower and Following rows navigate to FollowListScreen.
 *
 * 4. Analytics tab  — surfaces live data:
 *      • Followers / Following / Connections  (useFollowStats)
 *      • Post count + total likes / comments / shares  (aggregated from posts)
 *      • Profile views  (from PublicProfile doc — incremented on each visit)
 *      • Verification status banner
 *      • Profile completion nudge  (useProfileCompletion)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Ionicons }     from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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

// ── Data hooks ────────────────────────────────────────────────────────────────
import { useMyPublicProfile, useSyncPublicProfile } from '../hooks/usePublicProfileNew';
import { useMyPosts }            from '../hooks/useMyPosts';
import { useProfileCompletion }  from '../hooks';
import { useFollowStats }        from '../hooks/useFollowStats';   // live /follow/stats
import {
  useFreelancerPortfolio,
  useFreelancerServices,
} from '../../hooks/useFreelancer';                                 // real freelancer data
import {
  useDislike, useReact, useRemoveInteraction,
  useSharePost, useToggleSavePost,
} from '../hooks';
import { useSocialTheme } from '../theme/socialTheme';
import { formatCount }    from '../utils/format';
import type { Post, UserRole, ReactionType } from '../types';

// ── Small helpers ─────────────────────────────────────────────────────────────

const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const StaggerCard: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  React.useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }, index * 55);
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

const MyPublicProfileScreen: React.FC = () => {
  const theme      = useSocialTheme();
  const navigation = useNavigation<any>();

  // ── Profile doc ───────────────────────────────────────────────────────────
  const profileQ = useMyPublicProfile();
  const syncM    = useSyncPublicProfile();
  const p        = profileQ.data;
  const role     = ((p?.role ?? p?.user?.role ?? 'candidate') as UserRole);

  // ── Live follow stats (FIX #3 / #4) ──────────────────────────────────────
  const followStatsQ = useFollowStats();
  const fs = followStatsQ.data as any;
  // The /follow/stats endpoint may return different shapes — handle both
  const liveFollowers   = fs?.followers   ?? fs?.followerCount   ?? fs?.data?.followers   ?? 0;
  const liveFollowing   = fs?.following   ?? fs?.followingCount  ?? fs?.data?.following   ?? 0;
  const liveConnections = fs?.connections ?? fs?.connectionCount ?? fs?.totalConnections  ?? fs?.data?.connections ?? 0;

  // ── Profile completion ────────────────────────────────────────────────────
  const completionQ   = useProfileCompletion();
  const completionPct = useMemo(() => {
    const d = completionQ.data as any;
    if (typeof d?.percentage === 'number')       return d.percentage;
    if (typeof d?.data?.percentage === 'number') return d.data.percentage;
    return null;
  }, [completionQ.data]);

  // ── Own posts ─────────────────────────────────────────────────────────────
  const myPostsQ = useMyPosts({});
  const posts    = myPostsQ.data?.posts ?? [];

  // Aggregate engagement for Analytics tab (FIX #4)
  const engagement = useMemo(() => posts.reduce(
    (acc, p) => ({
      likes:    acc.likes    + (p.stats?.likes    ?? 0),
      comments: acc.comments + (p.stats?.comments ?? 0),
      shares:   acc.shares   + (p.stats?.shares   ?? 0),
      views:    acc.views    + (p.stats?.views     ?? 0),
    }),
    { likes: 0, comments: 0, shares: 0, views: 0 },
  ), [posts]);

  // ── Live freelancer data (FIX #1 & #2) ───────────────────────────────────
  const portfolioQ = useFreelancerPortfolio({ limit: 50 });
  const servicesQ  = useFreelancerServices();

  const portfolioItems: any[] = useMemo(() => {
    if (role === 'freelancer') {
      const live = portfolioQ.data?.items;
      if (Array.isArray(live) && live.length > 0) return live;
    }
    return asArr(p?.portfolio);
  }, [role, portfolioQ.data, p?.portfolio]);

  const serviceItems: any[] = useMemo(() => {
    if (role === 'freelancer') {
      const live = servicesQ.data;
      if (Array.isArray(live) && live.length > 0) return live;
    }
    return asArr(p?.services);
  }, [role, servicesQ.data, p?.services]);

  // ── Role-specific data from PublicProfile doc ─────────────────────────────
  const skills         = asArr<any>(p?.skills);
  const education      = asArr<any>(p?.education);
  const experience     = asArr<any>(p?.experience);
  const certifications = asArr<any>(p?.certifications);
  const companyInfo    = (p as any)?.companyInfo ?? null;

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const { activeTab, handleTabPress } = usePublicTabs(role);

  // ── Post interactions ─────────────────────────────────────────────────────
  const { mutate: react }       = useReact();
  const { mutate: removeReact } = useRemoveInteraction();
  const { mutate: dislike }     = useDislike();
  const { mutate: toggleSave }  = useToggleSavePost();
  const { mutate: sharePost }   = useSharePost();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleEdit = useCallback(() => navigation.navigate('EditPublicProfile'), [navigation]);
  const handleSync = useCallback(() =>
    syncM.mutate(undefined, { onSuccess: () => profileQ.refetch() }),
  [syncM, profileQ]);
  const handleReact = useCallback((postId: string, reaction: ReactionType) => {
    const cur = posts.find((pp) => pp._id === postId);
    react({ postId, reaction, hasInteraction: !!cur?.userInteraction });
  }, [posts, react]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (profileQ.isLoading) return (
    <SafeAreaView style={[S.center, { backgroundColor: theme.bg }]}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </SafeAreaView>
  );

  if (profileQ.isError || !p) return (
    <SafeAreaView style={[S.center, { backgroundColor: theme.bg }]}>
      <ErrorState message="Couldn't load your public profile" onRetry={profileQ.refetch} />
    </SafeAreaView>
  );

  // ── Shared header ─────────────────────────────────────────────────────────
  const HeaderBlock = (
    <View>
      <PublicProfileHeader
        profile={p}
        isOwner
        onEditPress={handleEdit}
        scrollY={scrollY}
        onFollowersPress={() => navigation.navigate('Followers', { title: 'My followers' })}
        onFollowingPress={() => navigation.navigate('Following', { title: "I'm following" })}
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
        <EmptyState icon="information-circle-outline" title="No bio added" actionLabel="Add bio" onAction={handleEdit} />
      )}
      {skills.length > 0 && (
        <StaggerCard index={1}>
          <SectionBlock title="Skills" icon="flash-outline"><SkillChips skills={skills} /></SectionBlock>
        </StaggerCard>
      )}
      {companyInfo && (role === 'company' || role === 'organization') && (
        <StaggerCard index={2}>
          <SectionBlock title="About" icon="business-outline"><CompanyInfoCard info={companyInfo} /></SectionBlock>
        </StaggerCard>
      )}
      {p.socialLinks && (
        <StaggerCard index={3}>
          <SectionBlock title="Social links" icon="share-social-outline">
            <SocialLinksRow links={p.socialLinks as any} />
          </SectionBlock>
        </StaggerCard>
      )}
      <TouchableOpacity
        onPress={handleSync}
        disabled={syncM.isPending}
        activeOpacity={0.85}
        style={[S.syncBtn, {
          backgroundColor: theme.withAlpha(theme.colors.primary, 0.08),
          borderColor:     theme.withAlpha(theme.colors.primary, 0.25),
        }]}
      >
        {syncM.isPending
          ? <ActivityIndicator size="small" color={theme.colors.primary} />
          : <Ionicons name="sync-outline" size={16} color={theme.colors.primary} />
        }
        <Text style={[S.syncText, { color: theme.colors.primary }]}>Sync from main profile</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Education & Experience ────────────────────────────────────────────────
  const renderEduExp = () => {
    const hasAny = experience.length || education.length;
    if (!hasAny) return (
      <View style={S.tab}>
        <EmptyState icon="briefcase-outline" title="No experience added" actionLabel="Add experience" onAction={handleEdit} />
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
        ? <EmptyState icon="ribbon-outline" title="No certifications added" actionLabel="Add certification" onAction={handleEdit} />
        : certifications.map((c: any, i: number) => (
            <StaggerCard key={c._id ?? i} index={i}><CertificationItem cert={c} /></StaggerCard>
          ))
      }
    </View>
  );

  // ── Portfolio (FIX #1) ────────────────────────────────────────────────────
  const renderPortfolio = () => {
    if (portfolioQ.isLoading && role === 'freelancer') return (
      <View style={[S.tab, S.center]}><ActivityIndicator color={theme.colors.primary} /></View>
    );
    return (
      <View style={S.tab}>
        {portfolioItems.length === 0
          ? (
            <EmptyState
              icon="albums-outline"
              title="No portfolio items"
              subtitle="Add your first project to showcase your work."
              actionLabel="Add portfolio"
              onAction={() => navigation.navigate('AddPortfolio')}
            />
          )
          : portfolioItems.map((item: any, i: number) => (
              <StaggerCard key={item._id ?? i} index={i}>
                <PortfolioTile
                  item={{
                    ...item,
                    // PortfolioTile.images[] — map from mediaUrls / mediaUrl
                    images: item.images
                      ?? item.mediaUrls
                      ?? (item.mediaUrl ? [item.mediaUrl] : []),
                    technologies: item.technologies ?? [],
                  }}
                  onPress={() =>
                    navigation.navigate('PortfolioDetails', { itemId: item._id })
                  }
                />
              </StaggerCard>
            ))
        }
      </View>
    );
  };

  // ── Services (FIX #2) ─────────────────────────────────────────────────────
  const renderServices = () => {
    if (servicesQ.isLoading && role === 'freelancer') return (
      <View style={[S.tab, S.center]}><ActivityIndicator color={theme.colors.primary} /></View>
    );
    return (
      <View style={S.tab}>
        {serviceItems.length === 0
          ? (
            <EmptyState
              icon="construct-outline"
              title="No services listed"
              subtitle="Add services so clients can see what you offer."
              actionLabel="Add services"
              onAction={() => navigation.navigate('ServicesListScreen')}
            />
          )
          : serviceItems.map((s: any, i: number) => {
              const price       = s.priceRange?.min ?? s.price ?? null;
              const currency    = s.priceRange?.currency ?? '$';
              const priceMax    = s.priceRange?.max;
              const delivery    = s.deliveryTime ?? s.deliveryDays ?? null;
              const isActive    = s.isActive !== false;

              return (
                <StaggerCard key={s._id ?? i} index={i}>
                  <View style={[S.serviceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {/* Header row */}
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
                      {isActive && (
                        <View style={[S.activeChip, { backgroundColor: theme.withAlpha('#16a34a', 0.12) }]}>
                          <View style={[S.activeDot, { backgroundColor: '#16a34a' }]} />
                          <Text style={[S.activeText, { color: '#16a34a' }]}>Active</Text>
                        </View>
                      )}
                    </View>

                    {/* Description */}
                    {s.description ? (
                      <Text style={[S.serviceDesc, { color: theme.subtext }]} numberOfLines={3}>
                        {s.description}
                      </Text>
                    ) : null}

                    {/* Footer */}
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
  };

  // ── Network (FIX #3) — uses live useFollowStats ───────────────────────────
  const renderNetwork = () => {
    const rows = [
      { label: 'Followers',   count: liveFollowers,   icon: 'people',     nav: 'Followers', params: { title: 'My followers' } },
      { label: 'Following',   count: liveFollowing,   icon: 'person-add', nav: 'Following', params: { title: "I'm following" } },
      { label: 'Connections', count: liveConnections, icon: 'git-network', nav: null,        params: null },
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

  // ── Analytics (FIX #4) — live stats + post engagement ────────────────────
  const renderSocialData = () => {
    const verStatus = p.verificationStatus ?? 'none';
    const verConfig: Record<string, { icon: string; label: string; bg: string; clr: string }> = {
      verified: { icon: 'checkmark-circle',     label: 'Verified account',     bg: '#16a34a1A', clr: '#16a34a' },
      pending:  { icon: 'time-outline',          label: 'Verification pending',  bg: '#d977061A', clr: '#d97706' },
      rejected: { icon: 'close-circle-outline',  label: 'Verification rejected', bg: '#dc26261A', clr: '#dc2626' },
      none:     { icon: 'shield-outline',        label: 'Not verified',          bg: theme.withAlpha(theme.muted, 0.15), clr: theme.muted },
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
          <StatCard icon="people"      label="Followers"   value={liveFollowers}   color={theme.colors.primary} />
          <StatCard icon="person-add"  label="Following"   value={liveFollowing}   color={theme.colors.primary} />
          <StatCard icon="git-network" label="Connections" value={liveConnections} color="#0ea5e9" />
          {(p.socialStats?.profileViews ?? 0) > 0 && (
            <StatCard icon="eye" label="Profile views" value={p.socialStats?.profileViews ?? 0} color="#10b981" />
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

        {/* Profile completion nudge */}
        {typeof completionPct === 'number' && completionPct < 100 && (
          <View style={[S.completionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={S.completionRow}>
              <Text style={[S.completionLabel, { color: theme.text }]}>Profile completion</Text>
              <Text style={[S.completionPct, { color: theme.colors.primary }]}>{completionPct}%</Text>
            </View>
            <View style={[S.progressBg, { backgroundColor: theme.border }]}>
              <View style={[S.progressFill, {
                width: `${completionPct}%` as any,
                backgroundColor: theme.colors.primary,
              }]} />
            </View>
            <Text style={[S.completionSub, { color: theme.muted }]}>
              A complete profile gets 3× more views.
            </Text>
            <TouchableOpacity
              onPress={handleEdit}
              activeOpacity={0.85}
              style={[S.completionBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={S.completionBtnText}>Complete profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tip */}
        <View style={[S.tipCard, {
          backgroundColor: theme.withAlpha(theme.colors.primary, 0.07),
          borderColor:     theme.withAlpha(theme.colors.primary, 0.2),
        }]}>
          <Ionicons name="bulb-outline" size={18} color={theme.colors.primary} />
          <Text style={[S.tipText, { color: theme.subtext }]}>
            Post regularly and engage with your network to grow your followers and profile visibility.
          </Text>
        </View>
      </View>
    );
  };

  const renderProducts = () => (
    <View style={S.tab}>
      <EmptyState
        icon="cube-outline"
        title="Manage products"
        subtitle="Your public products are managed in the Products section."
        actionLabel="Go to products"
        onAction={() => navigation.navigate('Products')}
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

  // ── Posts tab (FeedList) ──────────────────────────────────────────────────
  if (activeTab === 'posts') {
    return (
      <View style={[{ flex: 1 }, { backgroundColor: theme.bg }]}>
        <FeedList
          posts={posts}
          loading={myPostsQ.isLoading}
          refreshing={myPostsQ.isRefetching}
          onRefresh={() => { profileQ.refetch(); myPostsQ.refetch(); followStatsQ.refetch(); }}
          onEndReached={() => myPostsQ.hasNextPage && myPostsQ.fetchNextPage()}
          hasNextPage={myPostsQ.hasNextPage}
          isFetchingNextPage={myPostsQ.isFetchingNextPage}
          onReact={handleReact}
          onRemoveReact={removeReact}
          onDislike={(id) => dislike({ postId: id })}
          onComment={(post) => { setSelectedPost(post); setSheetVisible(true); }}
          onShare={(post) => sharePost(post._id)}
          onSave={(id, isSaved) => toggleSave({ id, isSaved })}
          onAuthorPress={(uid) => navigation.navigate('PublicProfile', { userId: uid })}
          ListHeaderComponent={HeaderBlock}
          emptyTitle="No posts yet"
          emptySubtitle="Your public posts will appear here."
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
  serviceCard:       { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  serviceHeaderRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  serviceIconBox:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  serviceTitle:      { fontSize: 14, fontWeight: '700' },
  serviceCat:        { fontSize: 11, marginTop: 2 },
  serviceDesc:       { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  serviceFooter:     { flexDirection: 'row', gap: 14, marginTop: 6 },
  metaRow:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceText:         { fontSize: 13, fontWeight: '700' },
  deliveryText:      { fontSize: 12 },
  activeChip:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  activeDot:         { width: 6, height: 6, borderRadius: 3 },
  activeText:        { fontSize: 11, fontWeight: '700' },

  // Sync
  syncBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 16, minHeight: 48 },
  syncText: { fontSize: 14, fontWeight: '600' },

  // Analytics
  verBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 16 },
  verText:   { fontSize: 13, fontWeight: '600' },
  gridLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  statCard:  { width: '47%', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 6 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  completionCard:    { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 16, gap: 10 },
  completionRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completionLabel:   { fontSize: 14, fontWeight: '700' },
  completionPct:     { fontSize: 14, fontWeight: '800' },
  progressBg:        { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill:      { height: 8, borderRadius: 4 },
  completionSub:     { fontSize: 12, lineHeight: 17 },
  completionBtn:     { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, minHeight: 36, justifyContent: 'center' },
  completionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  tipCard: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start', marginTop: 12 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },
});

export default MyPublicProfileScreen;