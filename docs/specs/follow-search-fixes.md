# PROMPT 1 — Follow System & Search Fixes (Frontend + Mobile)

## CONTEXT

You are working on the BananaLink platform. The backend follow system has been completely overhauled from a 4-status pending/accepted/rejected model to a simple 2-status `active | blocked` model (Instagram/Twitter style — no approval flow). The follow system, search system, and all related components need to be updated on both the Next.js frontend and the React Native mobile app.

The files listed in this prompt are already attached to the conversation in the GitHub repo. Read every file carefully before making any changes.

---

## PART A — WHAT CHANGED IN THE BACKEND & SERVICES (source of truth)

### Follow Model (`server/src/models/Follow.js`)
- `status` is now only `['active', 'blocked']` — no `pending`, `accepted`, `rejected`
- `followedAt` replaces `requestedAt` and `acceptedAt`
- New statics: `getConnections(userId)`, `countConnections(userId)`
- `followSource` enum now includes `'network'`, `'profile'`, `'feed'`

### Follow Controller (`server/src/controllers/followController.js`)
- `toggleFollow` → immediate, returns `{ following, isConnected, follow }`
- `getFollowStats` → returns `{ followers, following, connections, totalConnections, pendingRequests: 0 }`
- NEW endpoints: `GET /follow/connections`, `GET /follow/:userId/is-connected`, `POST /follow/:targetId/block`
- Legacy `getPendingRequests`, `acceptFollowRequest`, `rejectFollowRequest` → always return empty/no-op (kept for compat)
- `getFollowSuggestions` → supports `popular | skills | connections | hybrid` algorithms

### Web Follow Service (`frontend/src/services/followService.ts`) — UPDATED
Key changes from old version:
- **REMOVED**: `formatFollowerCount()` — this method NO LONGER EXISTS on the service class
- **REMOVED**: `getNetworkQuality()` — this method NO LONGER EXISTS on the service class  
- **REMOVED**: All pending/request/rejected logic
- **ADDED**: `getConnections()`, `isConnected()`, `blockUser()`
- `getFollowStatusLabel()` now returns only `'Follow' | 'Following' | 'Blocked'`
- `toggleFollow()` returns `{ following, isConnected, follow }`

### Mobile Follow Service (`mobile/src/social/services/followService.ts`) — UPDATED
- `ValidFollowSource` now includes `'network'` and `'manual'`
- New methods: `getConnections()`, `isConnected()`, `blockUser()`

### Mobile `useFollow.ts` — UPDATED
- New hooks: `useConnections`, `useIsConnected`, `useBlockUser`
- `useToggleFollow` now invalidates `['social','connections']` and `['social','isConnected', targetId]`
- `usePendingRequests` still exists but always returns `[]`
- `useAcceptFollowRequest` / `useRejectFollowRequest` still exist as no-ops

---

## PART B — FRONTEND FIXES REQUIRED

### Critical Error to Fix First

```
TypeError: followService.formatFollowerCount is not a function
at NetworkContent (src\pages\dashboard\candidate\social\network.tsx:509:32)
```

The web `followService` no longer has `formatFollowerCount` or `getNetworkQuality`. You must create standalone utility functions or inline the logic wherever these were called.

**Create this utility file: `frontend/src/utils/followUtils.ts`**

```typescript
export function formatFollowerCount(count: number): string {
  if (!count || count === 0) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function getNetworkQuality(followers: number, following: number): {
  label: string;
  level: 'excellent' | 'good' | 'average' | 'building';
  description: string;
} {
  const ratio = following > 0 ? followers / following : 0;
  if (followers >= 1000 && ratio >= 0.5) {
    return { label: 'Excellent Network', level: 'excellent', description: 'Your network is thriving with strong engagement.' };
  }
  if (followers >= 200 && ratio >= 0.3) {
    return { label: 'Good Network', level: 'good', description: 'You have a solid network with good engagement.' };
  }
  if (followers >= 50) {
    return { label: 'Average Network', level: 'average', description: 'Your network is growing steadily.' };
  }
  return { label: 'Building Network', level: 'building', description: 'Keep connecting with others to grow your network.' };
}
```

---

### Files to Update on the Frontend

#### 1. `frontend/src/pages/dashboard/candidate/social/network.tsx`

**Remove all these calls:**
- `followService.formatFollowerCount(...)` → Replace with `formatFollowerCount(...)` from `followUtils`
- `followService.getNetworkQuality(...)` → Replace with `getNetworkQuality(...)` from `followUtils`

**Update imports** at the top:
```typescript
import { formatFollowerCount, getNetworkQuality } from '@/utils/followUtils';
```

**Remove from followService calls:**
- Any reference to `followService.formatFollowerCount` → use standalone `formatFollowerCount`
- Any reference to `followService.getNetworkQuality` → use standalone `getNetworkQuality`

**Update stats section** (around line 509): Replace `followService.formatFollowerCount(stats.followers)` with `formatFollowerCount(stats.followers)`.

**Update all 4 stat cards** in the stats grid that call `followService.formatFollowerCount`.

**Update network quality card** that calls `followService.getNetworkQuality`.

**Update follow stats fetch**: The `getFollowStats()` response now has `{ followers, following, connections, totalConnections, pendingRequests: 0 }`. Update any destructuring to match. The `pendingRequests` field will always be 0 — update the UI to reflect this (hide or show 0).

**Update pending requests tab**: Since `pendingRequests` is always 0, either hide this tab or keep it showing 0. Do NOT remove the tab entirely — keep it for UI consistency but it will show empty.

**SuggestionList usage**: The `SuggestionList` component's `algorithm` prop still works — keep as-is.

---

#### 2. `frontend/src/components/social/network/ConnectionItem.tsx`

**Check and update:**
- Remove any calls to `followService.formatFollowerCount` → use `formatFollowerCount` from `followUtils`
- `profileService.getDisplayRole` and `profileService.getInitials` — these are from `profileService`, keep them
- `followService.toggleFollow(user._id)` → still works, returns `{ following, isConnected, follow }`
- The `FollowUser` type from `followService` — check if it still exists; if the service no longer exports it, define it locally:

```typescript
interface FollowUser {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  role?: string;
  verificationStatus?: string;
  followerCount?: number;
  mutualConnections?: number;
}
```

---

#### 3. `frontend/src/components/social/network/NetworkList.tsx`

**Update:**
- Remove `type: 'requests'` from the `type` prop union — it's now `'followers' | 'following' | 'suggestions'` only
- The `status: 'accepted'` param in `getFollowers`/`getFollowing` API calls — keep this but understand the backend ignores it now (all active follows are "accepted")
- Remove any UI that shows "pending requests" count or approval buttons
- `followService.getFollowers(params)` and `followService.getFollowing(params)` still work
- `followService.getFollowSuggestions(params)` still works
- `followService.getBulkFollowStatus(userIds)` still works

---

#### 4. `frontend/src/components/social/network/SuggestionList.tsx`

**Update:**
- `followService.getFollowSuggestions({ limit, algorithm })` still works
- `followService.toggleFollow(userId)` still works
- `followService.getBulkFollowStatus(userIds)` still works
- Remove any `status: 'pending'` checks — suggestions are just unfollowed users
- Keep the `initialSuggestions` prop as-is

---

#### 5. `frontend/src/components/social/network/FollowButton.tsx`

**Update:**
- Remove the `showConfirmation` logic for unfollow if it checks `status === 'pending'`
- Remove `followStatus.status === 'pending'` rendering — this state no longer exists
- Keep `followStatus.status === 'blocked'` — this still exists
- `followService.getFollowStatus(targetUserId, targetType)` still works, returns `{ following, status: 'active'|'blocked'|'none', isConnected }`
- `followService.toggleFollow(targetUserId, { targetType })` still works

---

#### 6. `frontend/src/components/social/post/PostCard.tsx`

**Update:**
- `followService.toggleFollow(safeAuthor._id)` → still works, returns `{ following, isConnected, follow }`
- Remove any pending/accepted state logic

---

#### 7. `frontend/src/pages/dashboard/candidate/social/network.tsx` — `fetchData` function

**Update the data fetching:**
```typescript
const [profile, statsData, suggestions] = await Promise.allSettled([
  profileService.getProfile().catch(e => null),
  followService.getFollowStats().catch(e => ({
    followers: 0,
    following: 0,
    connections: 0,
    totalConnections: 0,
    pendingRequests: 0
  })),
  followService.getFollowSuggestions({ limit: 12, algorithm }).catch(e => [])
]);
```

Update the `stats` state type to include `connections` and `totalConnections`. The `pendingRequests` will always be 0.

---

#### 8. `frontend/src/components/profile/ProfileConnectionsSection.tsx`

**Update:**
- `followService.getPublicFollowers(userId, { limit: 5 })` → still works
- `followService.getPublicFollowing(userId, { limit: 5 })` → still works
- `followService.toggleFollow(targetUserId, { targetType })` → still works
- `followService.getBulkFollowStatus(uniqueIds)` → still works, returns `Record<string, { following: boolean; status?: string }>`

---

#### 9. `frontend/src/components/profile/ProfileInfoCard.tsx`

**Update:**
- `followService.getFollowStatus(user._id, targetType)` → still works
- `followService.toggleFollow(user._id, { targetType })` → still works
- Remove any pending state handling

---

#### 10. `frontend/src/components/profile/ProfileHeader.tsx`

**Update:**
- `followService.getFollowStatus(profile.user._id, targetType)` → still works
- `followService.toggleFollow(targetUserId, { targetType })` → still works

---

#### 11. `frontend/src/components/social/search/UserCardSmall.tsx`

**Update:**
- `followService.getFollowStatus(profile._id, getTargetType())` → still works
- Remove `formatFollowerCount` from followService → use standalone `formatFollowerCount` from `followUtils`
- The `followService.formatFollowerCount` call on line where `formatFollowerCount` is used — move to util

---

#### 12. `frontend/src/components/profile/ProfileSocialAnalytics.tsx`

**Update:**
- Check if `followService.getFollowStats()` is called — update destructuring to match new response shape

---

### FRONTEND SEARCH FIX

The search functionality is broken. Here is the complete fix:

#### Root cause analysis

1. The `socialSearchController.js` has a `baseQuery` for Company that uses `'settings.profileVisibility': 'public'` — but Company documents may not have this field, returning 0 results.
2. The frontend search page may not be passing the correct params.
3. The `searchService.searchProfiles` call may have silent failures.

#### Fix `frontend/src/pages/dashboard/[role]/social/search.tsx` (or wherever the search page is)

If a search page doesn't exist, create `frontend/src/pages/dashboard/candidate/social/search.tsx`:

```typescript
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import SearchBar from '@/components/social/search/SearchBar';
import SearchFilters from '@/components/social/search/SearchFilters';
import SearchResultList from '@/components/social/search/SearchResultList';
import { searchService, SearchProfile, SearchParams } from '@/services/socialSearchService';
import { useDebounce } from '@/hooks/useDebounce'; // create if missing

const SearchPage = () => {
  const router = useRouter();
  const [query, setQuery] = useState((router.query.q as string) || '');
  const [filters, setFilters] = useState<SearchParams>({
    type: (router.query.type as SearchParams['type']) || 'all',
    page: 1,
    limit: 20,
    sortBy: 'relevance',
  });
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const debouncedQuery = useDebounce(query, 400);

  const doSearch = useCallback(async (q: string, f: SearchParams) => {
    if (!q.trim() && f.type === 'all') {
      setResults([]);
      setTotalResults(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await searchService.searchProfiles({ ...f, q: q.trim() });
      setResults(res.data || []);
      setTotalResults(res.pagination?.total || 0);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(debouncedQuery, filters);
  }, [debouncedQuery, filters, doSearch]);

  const handleSearch = (q: string) => {
    setQuery(q);
    router.replace({ query: { ...router.query, q } }, undefined, { shallow: true });
  };

  const handleFiltersChange = (newFilters: SearchParams) => {
    setFilters({ ...newFilters, page: 1 });
  };

  return (
    <SocialDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        <SearchBar
          defaultValue={query}
          onSearch={handleSearch}
          autoFocus
          size="lg"
        />
        <SearchFilters
          filters={{ ...filters, q: query }}
          onFiltersChange={handleFiltersChange}
        />
        <SearchResultList
          results={results}
          loading={loading}
          error={error || undefined}
          layout={layout}
          onLayoutChange={setLayout}
          totalResults={totalResults}
          currentPage={filters.page || 1}
          totalPages={totalPages}
          searchQuery={query}
        />
      </div>
    </SocialDashboardLayout>
  );
};

export default SearchPage;
```

#### Create `frontend/src/hooks/useDebounce.ts` if it doesn't exist:

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
```

#### Fix `frontend/src/components/social/search/SearchBar.tsx`

The `onSearch` prop is called when the user presses Enter or clicks a suggestion. Make sure the search bar properly passes the query string to the parent. Check that `handleSearch` is called with the actual query string, not an event object.

#### Fix `frontend/src/components/social/search/SearchFilters.tsx`

The `handleTypeChange`, `handleSortChange` etc. should call `onFiltersChange` with a properly typed `SearchParams` object. Ensure `type` is passed correctly.

The `unified` search endpoint at `/social-search/unified` might not exist on the backend. Use `/social-search/profiles` instead. Update `searchService.searchProfiles` to be the primary search method.

#### Fix `frontend/src/services/socialSearchService.ts`

Ensure the `searchProfiles` function properly handles empty results and doesn't silently swallow errors:

```typescript
searchProfiles: async (filters: SearchParams = {}): Promise<SearchProfilesResponse> => {
  try {
    const cleanFilters: Record<string, any> = {};
    // Only include defined, non-empty values
    if (filters.q?.trim()) cleanFilters.q = filters.q.trim();
    if (filters.type && filters.type !== 'all') cleanFilters.type = filters.type;
    if (filters.location) cleanFilters.location = filters.location;
    if (filters.industry) cleanFilters.industry = filters.industry;
    if (filters.sortBy) cleanFilters.sortBy = filters.sortBy;
    if (filters.page) cleanFilters.page = filters.page;
    if (filters.limit) cleanFilters.limit = filters.limit;
    if (filters.minFollowers) cleanFilters.minFollowers = filters.minFollowers;
    if (filters.maxFollowers) cleanFilters.maxFollowers = filters.maxFollowers;
    if (filters.verificationStatus) cleanFilters.verificationStatus = filters.verificationStatus;
    if (filters.skills) {
      cleanFilters.skills = Array.isArray(filters.skills) ? filters.skills.join(',') : filters.skills;
    }

    const response = await api.get<SearchProfilesResponse>('/social-search/profiles', {
      params: cleanFilters,
      timeout: 15000
    });
    return response.data;
  } catch (error: any) {
    console.error('searchProfiles error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Search failed');
  }
},
```

---

## PART C — MOBILE FIXES REQUIRED

### Mobile Follow Fixes

#### 1. `mobile/src/social/components/network/NetworkStats.tsx`

**Update:**
- `formatCount` from `'../../utils/format'` — keep as-is, this is not from followService
- The `FollowStats` type now has `{ followers, following, totalConnections }` — keep as-is

#### 2. `mobile/src/social/components/network/SuggestionsRow.tsx`

**Update:**
- `followService.getFollowSuggestions(limit, algorithm)` → still works
- Remove any `status: 'pending'` checks on `BulkFollowStatus`
- `BulkFollowStatus` type: `Record<string, { following: boolean; status?: string }>`

#### 3. `mobile/src/social/components/network/UserCard.tsx`

**No changes needed** — uses `isFollowing: boolean` passed as prop.

#### 4. `mobile/src/social/components/network/PendingRequestCard.tsx`

**Keep this component** but note: it will rarely be shown since `usePendingRequests` always returns `[]`. Keep it in the codebase for future use.

#### 5. `mobile/src/social/screens/NetworkScreen.tsx`

**Update:**
- `useFollowStats()` returns `{ followers, following, totalConnections, pendingRequests: 0 }` — keep as-is
- `usePendingRequests()` always returns `[]` — the Requests tab will show empty. Keep it but add an empty state that says "No pending requests"
- `useAcceptFollowRequest` and `useRejectFollowRequest` still exist as no-ops — keep for UI
- Remove any logic that uses `status: 'pending'` from the follow system

#### 6. `mobile/src/social/hooks/useFollowList.ts`

**Update:**
- `followService.getFollowers({ page })` → still works (returns followers with `follower` field populated)
- `followService.getFollowing({ page })` → still works (returns following with `targetId` field populated)
- The response shape from `getPublicFollowers` and `getPublicFollowing` — same

#### 7. `mobile/src/social/hooks/useFollowSuggestions.ts`

**Update:**
```typescript
queryFn: async () => {
  const res = await followService.getFollowSuggestions(limit);
  // Backend now returns res.data?.data OR just res.data (array directly)
  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data as FollowTarget[] : [];
},
```

#### 8. `mobile/src/social/hooks/useFollowStats.ts`

**Update:**
```typescript
queryFn: async () => {
  const res = await followService.getFollowStats();
  const d = res.data?.data ?? res.data;
  return {
    followers: d?.followers ?? 0,
    following: d?.following ?? 0,
    totalConnections: d?.totalConnections ?? d?.connections ?? 0,
    pendingRequests: 0, // always 0 in v2
  } as FollowStats;
},
```

---

### Mobile Search Fixes

#### Root Cause

The `useSocialSearch` hook searches are not triggering because:
1. The query length threshold (`>= 2`) may not be met by short queries
2. The `SearchScreen.tsx` may not be calling `addHistoryM.mutate` correctly
3. The API endpoint `/social-search/profiles` may be returning 0 results for certain filter combinations

#### Fix `mobile/src/social/hooks/useSocialSearch.ts`

```typescript
export const useSocialSearch = (params: SearchParams) => {
  const debouncedQuery = useDebounced(params.q ?? '');
  const hasTypeFilter = Boolean(params.type && params.type !== 'all');
  const queryLen = debouncedQuery.trim().length;

  return useQuery({
    queryKey: SOCIAL_KEYS.searchProfiles({ ...params, q: debouncedQuery }),
    queryFn: async () => {
      const res = await socialSearchService.searchProfiles({
        ...params,
        q: debouncedQuery,
      });
      const raw = res.data?.data ?? res.data;
      return {
        results: raw?.data ?? raw?.results ?? (Array.isArray(raw) ? raw : []),
        pagination: raw?.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 },
        total: raw?.pagination?.total ?? 0,
      } as SearchResponse;
    },
    enabled: queryLen >= 2 || hasTypeFilter,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
};
```

#### Fix `mobile/src/social/services/socialSearchService.ts`

```typescript
searchProfiles: (params: SearchParams) => {
  const cleanParams: Record<string, any> = {};
  if (params.q?.trim()) cleanParams.q = params.q.trim();
  if (params.type && params.type !== 'all') cleanParams.type = params.type;
  if (params.sortBy) cleanParams.sortBy = params.sortBy;
  if (params.page) cleanParams.page = params.page;
  if (params.limit) cleanParams.limit = params.limit;
  if (params.location) cleanParams.location = params.location;
  if (params.minFollowers) cleanParams.minFollowers = params.minFollowers;
  if (params.maxFollowers) cleanParams.maxFollowers = params.maxFollowers;

  return api.get('/social-search/profiles', { params: cleanParams });
},
```

#### Fix `mobile/src/social/screens/SearchScreen.tsx`

**Current issues to fix:**
1. The popular profiles query response may not be mapping correctly
2. The results `data?.results ?? data?.data` pattern needs to handle the backend's actual response shape

**Update the popular profiles mapping:**
```typescript
const popular: SearchResult[] = useMemo(() => {
  const raw = popularQ.data as any;
  // Handle both array and paginated response
  let list: any[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (Array.isArray(raw?.data)) list = raw.data;
  else if (Array.isArray(raw?.results)) list = raw.results;
  
  return list.map((u: any): SearchResult => ({
    _id: u?._id ?? u?.user?._id ?? '',
    name: u?.name ?? u?.user?.name ?? 'Unknown',
    avatar: u?.avatar?.secure_url ?? u?.avatar ?? u?.user?.avatar,
    role: u?.role ?? u?.user?.role ?? 'candidate',
    headline: u?.headline,
    followerCount: u?.socialStats?.followerCount ?? u?.followerCount,
    verificationStatus: u?.verificationStatus ?? u?.user?.verificationStatus,
    location: u?.location,
  }));
}, [popularQ.data]);
```

**Update the search results mapping:**
```typescript
const results: SearchResult[] = useMemo(() => {
  const raw = searchQ.data;
  if (!raw) return [];
  const list = raw.results ?? [];
  return list.map((u: any): SearchResult => ({
    _id: u._id ?? '',
    name: u.name ?? 'Unknown',
    avatar: u.avatar,
    role: u.type ?? u.role ?? 'candidate',
    headline: u.headline,
    followerCount: u.followerCount ?? u.socialStats?.followerCount ?? 0,
    verificationStatus: u.verificationStatus,
    location: u.location,
  }));
}, [searchQ.data]);
```

#### Fix `mobile/src/social/hooks/queryKeys.ts` — ensure search keys exist

```typescript
export const SOCIAL_KEYS = {
  // ... existing keys ...
  searchProfiles: (params: any) => ['social', 'search', 'profiles', params] as const,
  searchPosts: (params: any) => ['social', 'search', 'posts', params] as const,
  searchHashtags: (query: string) => ['social', 'search', 'hashtags', query] as const,
  unifiedSearch: (query: string) => ['social', 'search', 'unified', query] as const,
  searchHistory: ['social', 'search', 'history'] as const,
  popularProfiles: ['social', 'popular', 'profiles'] as const,
  // ... rest of keys
};
```

#### Fix `mobile/src/social/components/search/SearchHistoryList.tsx`

The `SearchHistoryEntry` type from `socialSearchService.ts` has `createdAt` but the component uses `entry.timestamp`. Fix the key:

```typescript
key={`${entry.query}_${entry.createdAt}`}  // was: entry.timestamp
```

Also update the `SearchHistoryEntry` type to match what's stored:
```typescript
export interface SearchHistoryEntry {
  query: string;
  type?: string;
  createdAt: string;  // was: timestamp in some versions
}
```

#### Fix `mobile/src/social/screens/SearchScreen.tsx` — `handleHistoryPress`

```typescript
const handleHistoryPress = useCallback(
  (entry: SearchHistoryEntry) => {
    setQuery(entry.query);
    if (entry.type && VALID_SEARCH_TYPES.includes(entry.type as SearchType)) {
      setTypeFilter(entry.type as SearchType);
    }
    // Trigger immediate search
    Keyboard.dismiss();
  },
  []
);
```

---

## PART D — BACKEND SEARCH FIX

The backend `socialSearchController.js` has a bug in the Company search query. Fix it:

In `server/src/controllers/socialSearchController.js`, in the `searchProfiles` function, change the Company `baseQuery`:

```javascript
case 'company':
  Model = Company;
  // Remove the settings.profileVisibility check - it may not exist on all docs
  baseQuery = {}; // Empty query - get all companies
  selectFields = 'name logoUrl industry description address phone website verified user socialStats companySize foundedYear companyType socialLinks settings tags featured';
  break;
```

Also fix the `default` case (for `type === 'all'`):
```javascript
default:
  Model = User;
  baseQuery = { 
    isActive: true,
    // Don't filter by role - include all user types
  };
  selectFields = 'name avatar headline role verificationStatus socialStats skills location bio socialLinks createdAt isActive';
  break;
```

---

## SUMMARY OF ALL FILES TO CREATE/MODIFY

### New Files
1. `frontend/src/utils/followUtils.ts` — CREATE
2. `frontend/src/hooks/useDebounce.ts` — CREATE (if missing)
3. `frontend/src/pages/dashboard/candidate/social/search.tsx` — CREATE or UPDATE

### Frontend Files to Update
4. `frontend/src/pages/dashboard/candidate/social/network.tsx`
5. `frontend/src/components/social/network/ConnectionItem.tsx`
6. `frontend/src/components/social/network/NetworkList.tsx`
7. `frontend/src/components/social/network/SuggestionList.tsx`
8. `frontend/src/components/social/network/FollowButton.tsx`
9. `frontend/src/components/social/post/PostCard.tsx`
10. `frontend/src/components/social/search/SearchBar.tsx`
11. `frontend/src/components/social/search/SearchFilters.tsx`
12. `frontend/src/components/social/search/SearchResultList.tsx`
13. `frontend/src/components/social/search/UserCardSmall.tsx`
14. `frontend/src/components/profile/ProfileConnectionsSection.tsx`
15. `frontend/src/components/profile/ProfileInfoCard.tsx`
16. `frontend/src/components/profile/ProfileHeader.tsx`
17. `frontend/src/components/profile/ProfileSocialAnalytics.tsx`
18. `frontend/src/services/socialSearchService.ts`

### Backend File to Update
19. `server/src/controllers/socialSearchController.js`

### Mobile Files to Update
20. `mobile/src/social/hooks/useSocialSearch.ts`
21. `mobile/src/social/hooks/useFollowSuggestions.ts`
22. `mobile/src/social/hooks/useFollowStats.ts`
23. `mobile/src/social/hooks/useFollowList.ts`
24. `mobile/src/social/services/socialSearchService.ts`
25. `mobile/src/social/services/followService.ts`
26. `mobile/src/social/screens/NetworkScreen.tsx`
27. `mobile/src/social/screens/SearchScreen.tsx`
28. `mobile/src/social/components/network/SuggestionsRow.tsx`
29. `mobile/src/social/components/search/SearchHistoryList.tsx`

---

## IMPORTANT RULES FOR CLAUDE

1. **Read every attached file** before making changes. Do not guess at the current state of any file.
2. **Do not remove any components or screens** — only update them.
3. **Preserve all existing props and interfaces** — only add, never remove without checking all usages.
4. **The backend follow service is the source of truth** — if the frontend service says something different, the backend wins.
5. **For TypeScript errors**: If a type from `followService` no longer exists, define it locally or in `followUtils.ts`.
6. **Test each fix mentally** by tracing the data flow: API response → service → hook/query → component → render.
7. Output all fixed files completely — do not output partial diffs.