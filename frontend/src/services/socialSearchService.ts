/* eslint-disable @typescript-eslint/no-explicit-any */
// services/socialSearchService.ts
import api from '@/lib/axios';

export interface SearchProfile {
  _id: string;
  type: 'candidate' | 'freelancer' | 'user' | 'company' | 'organization';
  name: string;
  avatar?: string;
  headline?: string;
  bio?: string;
  location?: string;
  verificationStatus?: string;
  followerCount: number;
  skills: string[];
  socialLinks?: any;
  joinedDate?: string;
  position?: string;
  industry?: string;
  description?: string;
  headquarters?: string;
  website?: string;
  employeeCount?: number;
  memberCount?: number;
  organizationType?: string;
  verified?: boolean;
  companySize?: string;
  companyType?: string;
  foundedYear?: number;
  tags?: string[];
  featured?: boolean;
  isActive?: boolean;
  socialStats?: {
    followerCount: number;
    followingCount: number;
    postCount: number;
    likeCount: number;
  };
}

export interface SearchPost {
  _id: string;
  type: string;
  content: string;
  title?: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
    headline?: string;
    role?: string;
    verificationStatus?: string;
  };
  originalAuthor?: {
    _id: string;
    name: string;
    avatar?: string;
    headline?: string;
  };
  hashtags?: string[];
  createdAt: string;
  stats?: {
    likes: number;
    comments: number;
    shares: number;
  };
  userReaction?: string;
  hasLiked?: boolean;
  relevance?: number;
}

export interface SearchResult {
  type: 'profile' | 'post' | 'company' | 'organization';
  subtype?: 'candidate' | 'freelancer' | 'user';
  id: string;
  name: string;
  avatar?: string;
  subtitle?: string;
  description?: string;
  role?: string;
  verificationStatus?: string;
  relevance?: number;
  data?: any;
}

export interface SearchProfilesResponse {
  success: boolean;
  data: SearchProfile[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters?: {
    q?: string;
    type?: string;
    industry?: string;
    location?: string;
    verificationStatus?: string;
  };
  metadata?: {
    resultType: string;
    totalCount: number;
  };
}

export interface SearchPostsResponse {
  success: boolean;
  data: SearchPost[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GlobalSearchResponse {
  success: boolean;
  data: SearchResult[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  metadata?: {
    typeCounts: Record<string, number>;
    query: string;
    totalResults: number;
  };
}

export interface TrendingHashtag {
  hashtag: string;
  count: number;
  recentPosts: number;
  trendingScore: number;
  lastUsed?: string;
}

export interface TrendingHashtagsResponse {
  success: boolean;
  data: TrendingHashtag[];
}

export interface SearchSuggestion {
  type: 'user' | 'company' | 'organization' | 'hashtag';
  id: string;
  name: string;
  avatar?: string;
  subtitle?: string;
  description?: string;
  role?: string;
  verificationStatus?: string;
  meta?: {
    type?: string;
    skills?: string[];
    location?: string;
    lastUsed?: string;
  };
}

export interface SearchSuggestionsResponse {
  success: boolean;
  data: SearchSuggestion[];
}

export interface SearchParams {
  q?: string;
  type?: 'all' | 'candidate' | 'freelancer' | 'user' | 'company' | 'organization';
  industry?: string;
  location?: string;
  skills?: string | string[];
  minFollowers?: number;
  maxFollowers?: number;
  verificationStatus?: string;
  hashtag?: string;
  author?: string;
  postType?: string;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'followers' | 'recent' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
  days?: number;
}

export interface SearchMetrics {
  totalUsers: number;
  totalCompanies: number;
  totalPosts: number;
  trendingHashtags: TrendingHashtag[];
}

class SearchServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'SearchServiceError';
  }
}

export const searchService = {
  // Search profiles with type filtering
  searchProfiles: async (filters: SearchParams = {}): Promise<SearchProfilesResponse> => {
    try {
      const cleanFilters: Record<string, any> = { ...filters };

      if (cleanFilters.skills) {
        if (Array.isArray(cleanFilters.skills)) {
          cleanFilters.skills = cleanFilters.skills.join(',');
        }
      }

      Object.keys(cleanFilters).forEach(key => {
        if (cleanFilters[key] === undefined || cleanFilters[key] === '') {
          delete cleanFilters[key];
        }
      });

      const response = await api.get<SearchProfilesResponse>('/social-search/profiles', {
        params: cleanFilters,
        timeout: 15000
      });

      return response.data;
    } catch (error: any) {
      console.error('Search profiles error:', error);

      if (error.response?.data?.message) {
        throw new SearchServiceError(
          error.response.data.message,
          error.response.data.code,
          error.response.status
        );
      }

      throw new SearchServiceError(
        'Failed to search profiles. Please try again.',
        'SEARCH_PROFILES_ERROR',
        error.response?.status || 500
      );
    }
  },

  // Advanced search endpoints
  searchUsers: async (filters: SearchParams = {}): Promise<SearchProfilesResponse> => {
    return searchService.searchProfiles({ ...filters, type: 'user' });
  },

  searchCandidates: async (filters: SearchParams = {}): Promise<SearchProfilesResponse> => {
    try {
      const response = await api.get<SearchProfilesResponse>('/social-search/advanced/candidates', {
        params: filters,
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      return searchService.searchProfiles({ ...filters, type: 'candidate' });
    }
  },

  searchFreelancers: async (filters: SearchParams = {}): Promise<SearchProfilesResponse> => {
    try {
      const response = await api.get<SearchProfilesResponse>('/social-search/advanced/freelancers', {
        params: filters,
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      return searchService.searchProfiles({ ...filters, type: 'freelancer' });
    }
  },

  searchCompanies: async (filters: SearchParams = {}): Promise<SearchProfilesResponse> => {
    try {
      const response = await api.get<SearchProfilesResponse>('/social-search/advanced/companies', {
        params: filters,
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      return searchService.searchProfiles({ ...filters, type: 'company' });
    }
  },

  searchOrganizations: async (filters: SearchParams = {}): Promise<SearchProfilesResponse> => {
    try {
      const response = await api.get<SearchProfilesResponse>('/social-search/advanced/organizations', {
        params: filters,
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      return searchService.searchProfiles({ ...filters, type: 'organization' });
    }
  },

  // Search posts
  searchPosts: async (filters: SearchParams = {}): Promise<SearchPostsResponse> => {
    try {
      const response = await api.get<SearchPostsResponse>('/social-search/posts', {
        params: filters,
        timeout: 10000
      });
      return response.data;
    } catch (error: any) {
      console.error('Search posts error:', error);

      if (error.response?.data?.message) {
        throw new SearchServiceError(
          error.response.data.message,
          error.response.data.code,
          error.response.status
        );
      }

      throw new SearchServiceError(
        'Failed to search posts. Please try again.',
        'SEARCH_POSTS_ERROR',
        error.response?.status || 500
      );
    }
  },

  // Global search
  globalSearch: async (query: string, params: {
    page?: number;
    limit?: number;
  } = {}): Promise<GlobalSearchResponse> => {
    try {
      if (!query || query.trim().length === 0) {
        return {
          success: true,
          data: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 },
          metadata: { typeCounts: {}, query: '', totalResults: 0 }
        };
      }

      const response = await api.get<GlobalSearchResponse>('/social-search/global', {
        params: { q: query.trim(), ...params },
        timeout: 15000
      });
      return response.data;
    } catch (error: any) {
      console.error('Global search error:', error);

      if (error.response?.data?.message) {
        throw new SearchServiceError(
          error.response.data.message,
          error.response.data.code,
          error.response.status
        );
      }

      throw new SearchServiceError(
        'Failed to perform global search. Please try again.',
        'GLOBAL_SEARCH_ERROR',
        error.response?.status || 500
      );
    }
  },

  // Get trending hashtags
  getTrendingHashtags: async (params?: {
    days?: number;
    limit?: number;
    refresh?: boolean;
  }): Promise<TrendingHashtag[]> => {
    try {
      const cacheKey = `trending_hashtags_${params?.days || 7}_${params?.limit || 10}`;

      if (!params?.refresh && typeof window !== 'undefined') {
        const cached = sessionStorage?.getItem(cacheKey);
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            // Invalid cache
          }
        }
      }

      const response = await api.get<TrendingHashtagsResponse>('/social-search/trending/hashtags', {
        params,
        timeout: 8000
      });

      const data = response.data.data;

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      }

      return data;
    } catch (error: any) {
      console.warn('Failed to fetch trending hashtags:', error);
      return [
        { hashtag: 'tech', count: 150, recentPosts: 25, trendingScore: 85.5 },
        { hashtag: 'jobs', count: 120, recentPosts: 18, trendingScore: 72.3 },
        { hashtag: 'ethiopia', count: 95, recentPosts: 15, trendingScore: 65.8 },
        { hashtag: 'remote', count: 88, recentPosts: 12, trendingScore: 60.2 },
        { hashtag: 'design', count: 75, recentPosts: 10, trendingScore: 55.4 }
      ];
    }
  },

  // Get search suggestions
  getSearchSuggestions: async (query: string, params?: {
    type?: 'all' | 'users' | 'companies' | 'organizations' | 'hashtags';
  }): Promise<SearchSuggestion[]> => {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const response = await api.get<SearchSuggestionsResponse>('/social-search/suggestions', {
        params: { q: query.trim(), ...params },
        timeout: 3000
      });

      return response.data.data;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return [];
      }

      console.error('Search suggestions error:', error);
      return [];
    }
  },

  // Debounced search suggestions
  createDebouncedSuggestions: (delay = 300) => {
    let timeoutId: NodeJS.Timeout;
    let abortController: AbortController | null = null;

    return async (query: string, params?: {
      type?: 'all' | 'users' | 'companies' | 'organizations' | 'hashtags';
    }): Promise<SearchSuggestion[]> => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId);

        if (abortController) {
          abortController.abort();
        }

        if (!query || query.trim().length < 2) {
          resolve([]);
          return;
        }

        timeoutId = setTimeout(async () => {
          try {
            abortController = new AbortController();
            const response = await api.get<SearchSuggestionsResponse>('/social-search/suggestions', {
              params: { q: query.trim(), ...params },
              signal: abortController.signal,
              timeout: 3000
            });
            resolve(response.data.data);
          } catch (error: any) {
            if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
              console.error('Search suggestions error:', error);
            }
            resolve([]);
          }
        }, delay);
      });
    };
  },

  // Get search metrics
  getSearchMetrics: async (): Promise<SearchMetrics> => {
    try {
      // This would typically be a separate API endpoint
      // For now, we'll use existing endpoints and cache
      const cacheKey = 'search_metrics';

      if (typeof window !== 'undefined') {
        const cached = localStorage?.getItem(cacheKey);
        if (cached) {
          try {
            const data = JSON.parse(cached);
            // Refresh if cache is older than 1 hour
            if (Date.now() - data.timestamp < 3600000) {
              return data;
            }
          } catch (e) {
            // Invalid cache
          }
        }
      }

      const [hashtags] = await Promise.all([
        searchService.getTrendingHashtags({ limit: 5 })
      ]);

      const metrics = {
        totalUsers: 12500,
        totalCompanies: 850,
        totalPosts: 45600,
        trendingHashtags: hashtags
      };

      if (typeof window !== 'undefined') {
        localStorage?.setItem(cacheKey, JSON.stringify({
          ...metrics,
          timestamp: Date.now()
        }));
      }

      return metrics;
    } catch (error) {
      console.error('Failed to fetch search metrics:', error);
      return {
        totalUsers: 12500,
        totalCompanies: 850,
        totalPosts: 45600,
        trendingHashtags: []
      };
    }
  },

  // Helper functions
  getSearchResultTypeLabel: (type: string, subtype?: string): string => {
    const labels: Record<string, string> = {
      'profile': 'Profile',
      'post': 'Post',
      'company': 'Company',
      'organization': 'Organization',
      'user': 'User',
      'candidate': 'Candidate',
      'freelancer': 'Freelancer',
      'hashtag': 'Hashtag'
    };

    return subtype && labels[subtype] ? labels[subtype] : labels[type] || type;
  },

  formatFollowerCount: (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  },

  formatHashtag: (hashtag: string): string => {
    return hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
  },

  extractHashtagFromSearch: (query: string): string | null => {
    if (query.startsWith('#')) {
      return query.slice(1).toLowerCase();
    }
    return null;
  },

  isHashtagSearch: (query: string): boolean => {
    return query.startsWith('#');
  },

  // Search history management
  getSearchHistory: (): Array<{ query: string, type?: string, count?: number, timestamp: number }> => {
    try {
      if (typeof window === 'undefined') return [];
      return JSON.parse(localStorage?.getItem('searchHistory') || '[]');
    } catch {
      return [];
    }
  },

  addToSearchHistory: (query: string, type?: string, count?: number): void => {
    try {
      if (typeof window === 'undefined') return;

      const history = searchService.getSearchHistory();
      const cleanQuery = query.trim();

      const filteredHistory = history.filter(item => item.query !== cleanQuery);
      const newHistory = [
        { query: cleanQuery, type, count, timestamp: Date.now() },
        ...filteredHistory
      ].slice(0, 20);

      localStorage?.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  },

  clearSearchHistory: (): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage?.removeItem('searchHistory');
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  },

  getRecentSearchesByType: (type?: string): string[] => {
    const history = searchService.getSearchHistory();
    const filtered = type
      ? history.filter(item => item.type === type)
      : history;

    return filtered.map(item => item.query).slice(0, 10);
  },

  // Popular search categories
  getPopularSearchCategories: (): Array<{
    value: string;
    label: string;
    icon: string;
    color: string;
    description: string;
  }> => {
    return [
      {
        value: 'candidate',
        label: 'Candidates',
        icon: '👔',
        color: '#3B82F6',
        description: 'Find job seekers by skills and experience'
      },
      {
        value: 'freelancer',
        label: 'Freelancers',
        icon: '💼',
        color: '#10B981',
        description: 'Discover independent professionals'
      },
      {
        value: 'company',
        label: 'Companies',
        icon: '🏢',
        color: '#8B5CF6',
        description: 'Search for registered businesses'
      },
      {
        value: 'organization',
        label: 'Organizations',
        icon: '🏛️',
        color: '#F59E0B',
        description: 'Find non-profits and institutions'
      },
      {
        value: 'all',
        label: 'Everything',
        icon: '🔍',
        color: '#6366F1',
        description: 'Search across all categories'
      }
    ];
  },

  // Quick search functions
  quickSearch: {
    findDevelopers: async (location?: string): Promise<SearchProfile[]> => {
      const response = await searchService.searchProfiles({
        type: 'candidate',
        skills: 'JavaScript,Python,React,Node.js,Java',
        location,
        sortBy: 'relevance',
        limit: 12
      });
      return response.data;
    },

    findMarketingExperts: async (location?: string): Promise<SearchProfile[]> => {
      const response = await searchService.searchProfiles({
        type: 'freelancer',
        skills: 'Marketing,SEO,Social Media,Content Strategy',
        location,
        sortBy: 'followers',
        limit: 12
      });
      return response.data;
    },

    findTechCompanies: async (industry?: string): Promise<SearchProfile[]> => {
      const response = await searchService.searchProfiles({
        type: 'company',
        industry: industry || 'Technology',
        sortBy: 'recent',
        limit: 12
      });
      return response.data;
    },

    searchByHashtag: async (hashtag: string): Promise<SearchPostsResponse> => {
      const cleanHashtag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
      return searchService.searchPosts({ hashtag: cleanHashtag });
    }
  }
};

export default searchService;