import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

  const searchQ = useSocialSearch({
    q: query,
    type: typeFilter,
    sortBy,
  });
  const historyQ = useSearchHistory();
  const hashtagsQ = useSearchHashtags('trending', true);

  const addHistoryM = useAddSearchHistory();
  const removeHistoryM = useRemoveSearchHistoryEntry();
  const clearHistoryM = useClearSearchHistory();
  const { mutate: toggleFollow } = useToggleFollow();

  const isActive = query.trim().length >= 2;
  const results: SearchResult[] = searchQ.data?.results ?? [];

  // Bulk follow status for result rows
  const resultIds = useMemo(() => results.map((r) => r._id), [results]);
  const bulkStatusQ = useBulkFollowStatus(
    resultIds,
    'User',
    resultIds.length > 0
  );

  const ad = getAdForPlacement(theme.role, 'search');

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const q = query.trim();
    if (q.length >= 2) {
      addHistoryM.mutate({ query: q, type: typeFilter });
    }
  }, [query, typeFilter, addHistoryM]);

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
  }, []);

  // ── Trending hashtags normalisation ──────────────────────────────
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

  // ── Discover (default) view ──────────────────────────────────────
  const DiscoverView = (
    <View style={{ flex: 1 }}>
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

      {(!historyQ.data?.length && !trending.length) ? (
        <EmptyState
          icon="search-outline"
          title="Discover people and topics"
          subtitle="Search for candidates, freelancers, companies, organizations, or hashtags."
        />
      ) : null}
    </View>
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

      {isActive ? (
        <>
          <SearchFilters
            type={typeFilter}
            sortBy={sortBy}
            onTypeChange={setTypeFilter}
            onSortChange={setSortBy}
          />

          {searchQ.isLoading ? (
            <ActivityIndicator
              color={theme.primary}
              style={{ padding: 24 }}
            />
          ) : results.length === 0 ? (
            <EmptyState
              icon="sad-outline"
              title="No matches"
              subtitle={`We couldn't find anyone for "${query}". Try different keywords.`}
            />
          ) : (
            <FlashList
              data={results}
              keyExtractor={(u) => u._id}
              renderItem={({ item }) => (
                <UserCard
                  user={item}
                  isFollowing={
                    !!bulkStatusQ.data?.[item._id]?.following
                  }
                  followLoading={pendingFollowId === item._id}
                  onPress={() => goToProfile(item._id)}
                  onFollowPress={() => handleToggle(item._id)}
                />
              )}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 32 }}
            />
          )}
        </>
      ) : (
        DiscoverView
      )}
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