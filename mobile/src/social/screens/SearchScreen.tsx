// src/social/screens/SearchScreen.tsx
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdCard } from '../components/ads';
import { UserCard } from '../components/network';
import {
  SearchBar,
  SearchFilters,
  SearchHistoryList,
  TrendingHashtags,
  type TrendingHashtag,
} from '../components/search';
import { EmptyState, SectionHeader } from '../components/shared';
import {
  useAddSearchHistory,
  useBulkFollowStatus,
  useClearSearchHistory,
  usePopularProfiles,
  useRemoveSearchHistoryEntry,
  useSearchHashtags,
  useSearchHistory,
  useSocialSearch,
  useToggleFollow,
} from '../hooks';
import { getAdForPlacement } from '../theme/adsConfig';
import { useSocialTheme } from '../theme/socialTheme';
import type { SearchResult, SearchSortBy, SearchType } from '../types';

const SearchScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SearchType>('all');
  const [sortBy, setSortBy] = useState<SearchSortBy>('relevance');
  const [pendingFollowId, setPendingFollowId] = useState<string | null>(null);

  const trimmed = query.trim();
  const hasTypeFilter = typeFilter !== 'all';
  const isActive = trimmed.length >= 2 || hasTypeFilter;

  const searchQ = useSocialSearch({ q: trimmed, type: typeFilter, sortBy });
  const historyQ = useSearchHistory();
  const hashtagsQ = useSearchHashtags('trending', true);
  const popularQ = usePopularProfiles();

  const addHistoryM = useAddSearchHistory();
  const removeHistoryM = useRemoveSearchHistoryEntry();
  const clearHistoryM = useClearSearchHistory();
  const { mutate: toggleFollow } = useToggleFollow();

  const results: SearchResult[] = searchQ.data?.results ?? [];
  const popular: SearchResult[] = useMemo(() => {
    const raw = popularQ.data as any;
    const list = Array.isArray(raw) ? raw : raw?.data ?? raw?.results ?? [];
    return list.map((u: any): SearchResult => ({
      _id: u?._id ?? u?.user?._id ?? '',
      name: u?.name ?? u?.user?.name ?? 'Unknown',
      avatar: u?.avatar?.secure_url ?? u?.avatar ?? u?.user?.avatar,
      role: u?.role ?? u?.user?.role ?? 'candidate',
      headline: u?.headline,
      followerCount: u?.socialStats?.followerCount,
      verificationStatus: u?.verificationStatus ?? u?.user?.verificationStatus,
    }));
  }, [popularQ.data]);

  const resultIds = useMemo(() => results.map((r) => r._id), [results]);
  const popularIds = useMemo(() => popular.map((r) => r._id), [popular]);

  const bulkStatusQ = useBulkFollowStatus(
    resultIds,
    'User',
    resultIds.length > 0
  );
  const popularStatusQ = useBulkFollowStatus(
    popularIds,
    'User',
    !isActive && popularIds.length > 0
  );

  const ad = getAdForPlacement(theme.role, 'search');

  const handleSubmit = useCallback(() => {
    if (trimmed.length >= 2) {
      addHistoryM.mutate({ query: trimmed, type: typeFilter });
    }
    Keyboard.dismiss();
  }, [trimmed, typeFilter, addHistoryM]);

  const handleHistoryPress = useCallback(
    (entry: { query: string; type?: string }) => {
      setQuery(entry.query);
      if (
        entry.type &&
        ['all', 'candidate', 'freelancer', 'company', 'organization'].includes(
          entry.type
        )
      ) {
        setTypeFilter(entry.type as SearchType);
      }
    },
    []
  );

  const goToProfile = useCallback(
    (userId: string) => navigation.navigate('PublicProfile', { userId }),
    [navigation]
  );

  const handleToggle = useCallback(
    (userId: string) => {
      setPendingFollowId(userId);
      toggleFollow(
        { targetId: userId, targetType: 'User', source: 'search' },
        { onSettled: () => setPendingFollowId(null) }
      );
    },
    [toggleFollow]
  );

  const handleCancel = useCallback(() => {
    setQuery('');
    Keyboard.dismiss();
  }, []);

  const trending: TrendingHashtag[] = useMemo(() => {
    const raw = hashtagsQ.data;
    if (!raw) return [];
    const list = Array.isArray(raw) ? raw : raw?.data ?? [];
    return list.map((h: any) => ({
      name: h?.name ?? String(h),
      postsCount: h?.postsCount,
      trending: h?.trending,
    }));
  }, [hashtagsQ.data]);

  // ── Discover view (no query, no type filter) ────────────────────
  const DiscoverView = (
    <FlashList
      data={popular}
      keyExtractor={(u) => u._id}
      ListHeaderComponent={
        <View>
          {historyQ.data && historyQ.data.length > 0 ? (
            <SearchHistoryList
              history={historyQ.data}
              onPressEntry={handleHistoryPress}
              onRemoveEntry={(e) => removeHistoryM.mutate(e.query)}
              onClearAll={() => clearHistoryM.mutate()}
            />
          ) : null}

          {ad ? (
            <View style={{ paddingTop: 8 }}>
              <AdCard ad={ad} />
            </View>
          ) : null}

          {trending.length > 0 ? (
            <>
              <SectionHeader title="Trending hashtags" />
              <TrendingHashtags
                hashtags={trending}
                onPress={(name) => setQuery(`#${name}`)}
              />
            </>
          ) : null}

          {popular.length > 0 ? (
            <SectionHeader title="People you may know" />
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <UserCard
          user={item}
          isFollowing={!!popularStatusQ.data?.[item._id]?.following}
          followLoading={pendingFollowId === item._id}
          onPress={() => goToProfile(item._id)}
          onFollowPress={() => handleToggle(item._id)}
        />
      )}
      ListEmptyComponent={
        popularQ.isLoading ? (
          <ActivityIndicator
            color={theme.primary}
            style={{ padding: 24 }}
          />
        ) : !historyQ.data?.length && !trending.length ? (
          <EmptyState
            icon="search-outline"
            title="Discover people and topics"
            subtitle="Search for candidates, freelancers, companies, organizations, or hashtags."
          />
        ) : null
      }
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 32 }}
    />
  );

  // ── Results view ────────────────────────────────────────────────
  const ResultsView = searchQ.isLoading ? (
    <ActivityIndicator color={theme.primary} style={{ padding: 32 }} />
  ) : results.length === 0 ? (
    <EmptyState
      icon="sad-outline"
      title="No matches"
      subtitle={
        trimmed
          ? `We couldn't find anyone for "${trimmed}". Try different keywords.`
          : 'No results for that filter. Try a different role or add a keyword.'
      }
    />
  ) : (
    <FlashList
      data={results}
      keyExtractor={(u) => u._id}
      renderItem={({ item }) => (
        <UserCard
          user={item}
          isFollowing={!!bulkStatusQ.data?.[item._id]?.following}
          followLoading={pendingFollowId === item._id}
          onPress={() => goToProfile(item._id)}
          onFollowPress={() => handleToggle(item._id)}
        />
      )}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 32 }}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: theme.bg, borderBottomColor: theme.border },
        ]}
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={handleSubmit}
          showCancel={query.length > 0}
          onCancel={handleCancel}
        />
      </View>

      <SearchFilters
        type={typeFilter}
        sortBy={sortBy}
        onTypeChange={setTypeFilter}
        onSortChange={setSortBy}
      />

      {isActive ? ResultsView : DiscoverView}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
});

export default SearchScreen;