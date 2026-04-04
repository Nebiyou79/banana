/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/social/search.tsx — FULL PROFESSIONAL SEARCH PAGE
// Uses: SocialDashboardLayout, RoleThemeProvider, color.ts, all search components

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { searchService, SearchParams, SearchProfile } from '@/services/socialSearchService';
import { followService } from '@/services/followService';
import { cn } from '@/lib/utils';
import {
  Search, X, TrendingUp, Clock, ChevronRight, Hash, Sparkles, Loader2,
  Users, Building2, Briefcase, MapPin, Check, ChevronDown,
  Shield, User, Grid, List, AlertCircle,
   TrendingUp as Trend,
  SlidersHorizontal, Zap, ArrowRight, RefreshCw
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ThemeMode = 'light' | 'dark';

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH BAR
// ─────────────────────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSearch: (q: string) => void;
  placeholder?: string;
  themeMode: ThemeMode;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch, placeholder = 'Search people, companies, hashtags…', themeMode }) => {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trending, setTrending] = useState<{ hashtag: string; count: number }[]>([]);
  const [showDrop, setShowDrop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecentSearches(searchService.getRecentSearchesByType());
    searchService.getTrendingHashtags({ limit: 5 }).then(t => setTrending(t.slice(0, 5))).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      setLoadingSug(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const s = await searchService.getSearchSuggestions(value);
          setSuggestions(s);
        } catch { setSuggestions([]); }
        finally { setLoadingSug(false); }
      }, 300);
    } else {
      setSuggestions([]);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { onSearch(value); setShowDrop(false); }
    if (e.key === 'Escape') { setShowDrop(false); inputRef.current?.blur(); }
  };

  const handleSugClick = (sug: any) => {
    const q = sug.type === 'hashtag' ? `#${sug.name.replace('#', '')}` : sug.name;
    onChange(q);
    onSearch(q);
    setShowDrop(false);
  };

  const bgClass = themeMode === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900';
  const dropBg = themeMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-200',
        bgClass,
        focused ? 'border-[#2563EB] shadow-lg shadow-blue-500/10' : 'hover:border-gray-300 dark:hover:border-gray-600',
      )}>
        <Search className={cn('w-5 h-5 shrink-0', focused ? 'text-[#2563EB]' : 'text-gray-400')} />
        <input
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => { setFocused(true); setShowDrop(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none placeholder:text-gray-400 text-base font-medium"
        />
        {loadingSug && <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />}
        {value && !loadingSug && (
          <button onClick={() => { onChange(''); setSuggestions([]); inputRef.current?.focus(); }}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        {!value && (
          <kbd className="hidden sm:block px-2 py-0.5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shrink-0">
            Enter
          </kbd>
        )}
      </div>

      {/* Dropdown */}
      {showDrop && (suggestions.length > 0 || recentSearches.length > 0 || trending.length > 0) && (
        <div className={cn('absolute top-full mt-2 w-full rounded-2xl border shadow-2xl overflow-hidden z-50', dropBg)}>
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suggestions</span>
              </div>
              {suggestions.slice(0, 5).map((s) => (
                <button key={`${s.type}-${s.id}`} onClick={() => handleSugClick(s)}
                  className={cn('w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left', themeMode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50')}>
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0', {
                    'bg-blue-100 text-blue-700': s.type === 'user' || s.type === 'candidate',
                    'bg-teal-100 text-teal-700': s.type === 'company',
                    'bg-indigo-100 text-indigo-700': s.type === 'organization',
                    'bg-amber-100 text-amber-700': s.type === 'freelancer',
                    'bg-pink-100 text-pink-700': s.type === 'hashtag',
                  })}>
                    {s.avatar ? <img src={s.avatar} alt={s.name} className="w-9 h-9 rounded-xl object-cover" /> : s.type === 'hashtag' ? '#' : s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold truncate', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>{s.name}</p>
                    {s.subtitle && <p className="text-xs text-gray-500 truncate">{s.subtitle}</p>}
                  </div>
                  <span className={cn('shrink-0 text-xs px-2 py-0.5 rounded-full capitalize font-medium', {
                    'bg-blue-100 text-blue-700': s.type === 'user',
                    'bg-teal-100 text-teal-700': s.type === 'company',
                    'bg-indigo-100 text-indigo-700': s.type === 'organization',
                    'bg-amber-100 text-amber-700': s.type === 'freelancer',
                    'bg-pink-100 text-pink-700': s.type === 'hashtag',
                  })}>{s.type}</span>
                </button>
              ))}
            </div>
          )}

          {/* Recent */}
          {recentSearches.length > 0 && suggestions.length === 0 && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent</span>
                </div>
                <button onClick={() => { searchService.clearSearchHistory(); setRecentSearches([]); }}
                  className="text-xs text-red-500 hover:text-red-700">Clear</button>
              </div>
              {recentSearches.slice(0, 4).map((r, i) => (
                <button key={i} onClick={() => { onChange(r); onSearch(r); setShowDrop(false); }}
                  className={cn('w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left', themeMode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50')}>
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className={cn('text-sm', themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700')}>{r}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                </button>
              ))}
            </div>
          )}

          {/* Trending */}
          {trending.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2 px-1">
                <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trending</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trending.map((t) => (
                  <button key={t.hashtag} onClick={() => { onChange(`#${t.hashtag}`); onSearch(`#${t.hashtag}`); setShowDrop(false); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 hover:shadow-md transition-all">
                    <Hash className="w-3 h-3" />#{t.hashtag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={cn('px-4 py-2 text-center text-xs text-gray-400 border-t', themeMode === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50')}>
            Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs mx-1">Enter</kbd> to search
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH FILTERS
// ─────────────────────────────────────────────────────────────────────────────

interface FiltersProps {
  filters: SearchParams;
  onChange: (f: SearchParams) => void;
  themeMode: ThemeMode;
}

const SearchFilters: React.FC<FiltersProps> = ({ filters, onChange, themeMode }) => {
  const [expanded, setExpanded] = useState(false);

  const types = [
    { value: 'all', label: 'All', icon: Users },
    { value: 'candidate', label: 'Candidates', icon: Briefcase },
    { value: 'freelancer', label: 'Freelancers', icon: Sparkles },
    { value: 'company', label: 'Companies', icon: Building2 },
    { value: 'organization', label: 'Organizations', icon: Shield },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'followers', label: 'Most Followers' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'alphabetical', label: 'A–Z' },
  ];

  const locations = ['Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 'Adama', 'Mekele'];

  const typeColor: Record<string, string> = {
    all: 'from-[#2563EB] to-[#4DA6FF]',
    candidate: 'from-[#2563EB] to-[#60A5FA]',
    freelancer: 'from-[#F59E0B] to-[#FF8C42]',
    company: 'from-[#2AA198] to-[#10B981]',
    organization: 'from-[#6366F1] to-[#8B5CF6]',
  };

  const hasActive = filters.type !== 'all' || filters.location || filters.verificationStatus || filters.minFollowers;

  const clear = () => onChange({ q: filters.q, page: 1, limit: 20, type: 'all', sortBy: 'relevance' });

  const panelBg = themeMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';

  return (
    <div className={cn('rounded-2xl border shadow-sm p-4 sm:p-5 transition-all', panelBg)}>
      {/* Type tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {types.map(t => {
          const active = filters.type === t.value || (!filters.type && t.value === 'all');
          return (
            <button
              key={t.value}
              onClick={() => onChange({ ...filters, type: t.value as any, page: 1 })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? `bg-gradient-to-r ${typeColor[t.value]} text-white shadow-md scale-105`
                  : themeMode === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sort + Advanced toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.sortBy || 'relevance'}
          onChange={e => onChange({ ...filters, sortBy: e.target.value as any, page: 1 })}
          className={cn('px-3 py-2 rounded-xl text-sm font-medium border outline-none cursor-pointer', themeMode === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700')}
        >
          {sortOptions.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
        </select>

        <button
          onClick={() => setExpanded(e => !e)}
          className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all', themeMode === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Advanced
          {hasActive && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} />
        </button>

        {hasActive && (
          <button onClick={clear} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <X className="w-3.5 h-3.5" />Clear
          </button>
        )}
      </div>

      {/* Advanced panel */}
      {expanded && (
        <div className={cn('mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4', themeMode === 'dark' ? 'border-gray-800' : 'border-gray-100')}>
          {/* Location */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" />Location</p>
            <div className="flex flex-wrap gap-1.5">
              {locations.map(l => (
                <button key={l} onClick={() => onChange({ ...filters, location: filters.location === l ? undefined : l, page: 1 })}
                  className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-all', filters.location === l ? 'bg-blue-600 text-white' : themeMode === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Verification */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Shield className="w-3 h-3" />Verification</p>
            <div className="space-y-2">
              {[{ v: 'verified', l: '✓ Verified only' }, { v: undefined as any, l: 'All users' }].map(o => (
                <button key={String(o.v)} onClick={() => onChange({ ...filters, verificationStatus: filters.verificationStatus === o.v ? undefined : o.v, page: 1 })}
                  className={cn('w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all', filters.verificationStatus === o.v ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : themeMode === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100')}>
                  {o.l}
                  {filters.verificationStatus === o.v && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Followers */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Trend className="w-3 h-3" />Min Followers</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[{ l: 'Any', v: undefined }, { l: '100+', v: 100 }, { l: '1K+', v: 1000 }, { l: '5K+', v: 5000 }, { l: '10K+', v: 10000 }].map(o => (
                <button key={String(o.v)} onClick={() => onChange({ ...filters, minFollowers: filters.minFollowers === o.v ? undefined : o.v, page: 1 })}
                  className={cn('py-1.5 rounded-lg text-xs font-medium transition-all', filters.minFollowers === o.v ? 'bg-purple-600 text-white' : themeMode === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasActive && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          {filters.type !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
              {filters.type}<button onClick={() => onChange({ ...filters, type: 'all', page: 1 })} className="ml-1"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
              📍{filters.location}<button onClick={() => onChange({ ...filters, location: undefined, page: 1 })} className="ml-1"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.verificationStatus && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
              ✓ Verified<button onClick={() => onChange({ ...filters, verificationStatus: undefined, page: 1 })} className="ml-1"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.minFollowers && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
              {filters.minFollowers.toLocaleString()}+ followers
              <button onClick={() => onChange({ ...filters, minFollowers: undefined, page: 1 })} className="ml-1"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// USER CARD
// ─────────────────────────────────────────────────────────────────────────────

const typeConfig: Record<string, { grad: string; lightBg: string; lightText: string; label: string; icon: React.ElementType }> = {
  candidate: { grad: 'from-blue-500 to-cyan-500', lightBg: 'bg-blue-50', lightText: 'text-blue-700', label: 'Candidate', icon: Briefcase },
  freelancer: { grad: 'from-amber-500 to-orange-500', lightBg: 'bg-amber-50', lightText: 'text-amber-700', label: 'Freelancer', icon: Sparkles },
  company: { grad: 'from-teal-500 to-emerald-500', lightBg: 'bg-teal-50', lightText: 'text-teal-700', label: 'Company', icon: Building2 },
  organization: { grad: 'from-indigo-500 to-purple-500', lightBg: 'bg-indigo-50', lightText: 'text-indigo-700', label: 'Organization', icon: Shield },
  user: { grad: 'from-gray-500 to-slate-500', lightBg: 'bg-gray-50', lightText: 'text-gray-700', label: 'User', icon: User },
};

const toFollowTarget = (type: string): 'User' | 'Company' | 'Organization' => {
  if (type === 'company') return 'Company';
  if (type === 'organization') return 'Organization';
  return 'User';
};

interface UserCardProps {
  profile: SearchProfile;
  layout: 'grid' | 'list';
  themeMode: ThemeMode;
  currentUserId?: string;
}

const UserCard: React.FC<UserCardProps> = ({ profile, layout, themeMode, currentUserId }) => {
  const router = useRouter();
  const [avatarError, setAvatarError] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const tc = typeConfig[profile.type] || typeConfig.user;
  const isOwn = currentUserId === profile._id;
  const isVerified = profile.verified || profile.verificationStatus === 'verified';

  useEffect(() => {
    if (currentUserId && !isOwn) {
      followService.getFollowStatus(profile._id, toFollowTarget(profile.type))
        .then(s => setFollowing(s.following))
        .catch(() => {});
    }
  }, [profile._id]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) { router.push('/login'); return; }
    try {
      setFollowLoading(true);
      const r = await followService.toggleFollow(profile._id, { targetType: toFollowTarget(profile.type) });
      setFollowing(r.following);
    } catch { /* silent */ } finally { setFollowLoading(false); }
  };

  const goToProfile = () => {
    const path = profile.type === 'company' || profile.type === 'organization'
      ? `/dashboard/social/profile/${profile._id}`
      : `/dashboard/social/profile/${profile._id}`;
    router.push(path);
  };

  const cardBg = themeMode === 'dark'
    ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg';

  if (layout === 'list') {
    return (
      <div onClick={goToProfile} className={cn('flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 group', cardBg)}>
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={cn('w-14 h-14 rounded-xl overflow-hidden border-2', isVerified ? 'border-green-400' : 'border-gray-200 dark:border-gray-700')}>
            {profile.avatar && !avatarError ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
            ) : (
              <div className={cn('w-full h-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br', tc.grad)}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {isVerified && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900"><Check className="w-2.5 h-2.5 text-white" /></div>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn('font-bold text-sm sm:text-base group-hover:text-blue-600 transition-colors truncate', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>{profile.name}</h3>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold shrink-0', tc.lightBg, tc.lightText)}>{tc.label}</span>
          </div>
          {profile.headline && <p className={cn('text-xs sm:text-sm truncate mt-0.5', themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600')}>{profile.headline}</p>}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>}
            {profile.followerCount > 0 && <span>{followService.formatFollowerCount(profile.followerCount)} followers</span>}
          </div>
        </div>

        {/* Actions */}
        {!isOwn && (
          <div onClick={e => e.stopPropagation()} className="shrink-0 flex gap-2">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all', following
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                : `bg-gradient-to-r ${tc.grad} text-white hover:shadow-md hover:scale-105`
              )}
            >
              {followLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : following ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Grid card
  return (
    <div onClick={goToProfile} className={cn('flex flex-col p-5 rounded-2xl border cursor-pointer transition-all duration-200 group relative overflow-hidden', cardBg)}>
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none', tc.grad)} />

      {/* Top */}
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          <div className={cn('w-14 h-14 rounded-2xl overflow-hidden border-2', isVerified ? 'border-green-400' : 'border-gray-200 dark:border-gray-700')}>
            {profile.avatar && !avatarError ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" onError={() => setAvatarError(true)} />
            ) : (
              <div className={cn('w-full h-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br', tc.grad)}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {isVerified && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900"><Check className="w-2.5 h-2.5 text-white" /></div>}
        </div>

        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', tc.lightBg, tc.lightText)}>{tc.label}</span>
      </div>

      {/* Name */}
      <h3 className={cn('font-bold text-base line-clamp-1 group-hover:text-blue-600 transition-colors', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>{profile.name}</h3>
      {profile.headline && <p className={cn('text-xs mt-1 line-clamp-2', themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600')}>{profile.headline}</p>}

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
        {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>}
        {profile.industry && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{profile.industry}</span>}
      </div>

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {profile.skills.slice(0, 3).map((s, i) => (
            <span key={i} className={cn('px-2 py-0.5 rounded text-xs font-medium', themeMode === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600')}>{s}</span>
          ))}
          {profile.skills.length > 3 && <span className={cn('px-2 py-0.5 rounded text-xs', themeMode === 'dark' ? 'text-gray-500' : 'text-gray-400')}>+{profile.skills.length - 3}</span>}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-4">
        <span className="text-xs text-gray-500">{profile.followerCount > 0 ? `${followService.formatFollowerCount(profile.followerCount)} followers` : 'New member'}</span>
        {!isOwn ? (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all', following
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              : `bg-gradient-to-r ${tc.grad} text-white hover:shadow-md hover:scale-105`
            )}
          >
            {followLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : following ? '✓ Following' : 'Follow'}
          </button>
        ) : (
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">View <ArrowRight className="w-3 h-3" /></span>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS HEADER + STATS
// ─────────────────────────────────────────────────────────────────────────────

const ResultsHeader = ({
  results, total, page, pages, query, layout, onLayoutChange, themeMode,
}: {
  results: SearchProfile[];
  total: number;
  page: number;
  pages: number;
  query: string;
  layout: 'grid' | 'list';
  onLayoutChange: (l: 'grid' | 'list') => void;
  themeMode: ThemeMode;
}) => {
  const counts: Record<string, number> = {};
  results.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });

  const tcColors: Record<string, string> = {
    candidate: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    freelancer: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    company: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300',
    organization: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
    user: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  };

  const panelBg = themeMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';

  return (
    <div className={cn('rounded-2xl border p-4 sm:p-5 shadow-sm', panelBg)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className={cn('text-xl font-bold', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>
            {query ? <><span className="font-normal text-gray-500">Results for </span>`{query}`</> : `${total.toLocaleString()} Results`}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Showing {results.length} of {total.toLocaleString()} · Page {page} of {pages}
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
          {(['grid', 'list'] as const).map(l => (
            <button key={l} onClick={() => onLayoutChange(l)} className={cn('p-2 rounded-lg transition-all', layout === l ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}>
              {l === 'grid' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex flex-wrap gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
        {Object.entries(counts).map(([type, count]) => {
          const tc = typeConfig[type];
          if (!tc) return null;
          return (
            <span key={type} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold', tcColors[type])}>
              <tc.icon className="w-3.5 h-3.5" />{count} {tc.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

const Pagination = ({ page, pages, onPageChange, themeMode }: { page: number; pages: number; onPageChange: (p: number) => void; themeMode: ThemeMode }) => {
  if (pages <= 1) return null;
  const visiblePages = Array.from({ length: Math.min(5, pages) }, (_, i) => {
    if (pages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= pages - 2) return pages - 4 + i;
    return page - 2 + i;
  });

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}
        className={cn('px-3 py-2 rounded-xl text-sm font-medium transition-all', page === 1 ? 'opacity-40 cursor-not-allowed' : themeMode === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}>
        ← Prev
      </button>
      {visiblePages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          className={cn('w-10 h-10 rounded-xl text-sm font-semibold transition-all', p === page ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110' : themeMode === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}>
          {p}
        </button>
      ))}
      {pages > 5 && page < pages - 2 && (
        <>
          <span className="text-gray-400">…</span>
          <button onClick={() => onPageChange(pages)} className={cn('w-10 h-10 rounded-xl text-sm font-semibold', themeMode === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white border border-gray-200 text-gray-700')}>{pages}</button>
        </>
      )}
      <button disabled={page === pages} onClick={() => onPageChange(page + 1)}
        className={cn('px-3 py-2 rounded-xl text-sm font-medium transition-all', page === pages ? 'opacity-40 cursor-not-allowed' : themeMode === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}>
        Next →
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY / ERROR / LOADING STATES
// ─────────────────────────────────────────────────────────────────────────────

const EmptyState = ({ query, themeMode }: { query: string; themeMode: ThemeMode }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
      <Search className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className={cn('text-2xl font-bold mb-2', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>
      {query ? `No results for "${query}"` : 'Start Searching'}
    </h3>
    <p className="text-gray-500 max-w-md">
      {query ? 'Try different keywords or remove some filters.' : 'Search for people, companies, freelancers, or organizations.'}
    </p>
    {!query && (
      <div className="flex flex-wrap gap-2 mt-6 justify-center">
        {['Developers', 'Designers', 'Tech Companies', 'NGOs'].map(t => (
          <span key={t} className="px-3 py-1.5 text-sm rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
            {t}
          </span>
        ))}
      </div>
    )}
  </div>
);

const LoadingGrid = ({ layout }: { layout: 'grid' | 'list' }) => (
  <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
        </div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// HERO / METRICS
// ─────────────────────────────────────────────────────────────────────────────

const SearchHero = ({ themeMode }: { themeMode: ThemeMode }) => (
  <div className={cn('rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden', themeMode === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gradient-to-br from-[#0A2540] to-[#1a3a5c]')}>
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4DA6FF] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
    </div>
    <div className="relative z-10">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
        Find <span className="text-[#FFD700]">Talent &amp; Opportunities</span>
      </h1>
      <p className="text-blue-200 text-sm sm:text-base max-w-xl">
        Search across candidates, freelancers, companies and organizations all in one place.
      </p>
      <div className="flex flex-wrap gap-4 mt-5">
        {[
          { label: '12,500+', desc: 'Professionals', icon: Users },
          { label: '850+', desc: 'Companies', icon: Building2 },
          { label: '45K+', desc: 'Connections', icon: Zap },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-white/90">
            <s.icon className="w-4 h-4 text-[#FFD700]" />
            <span className="font-bold text-[#FFD700]">{s.label}</span>
            <span className="text-sm text-blue-200">{s.desc}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEARCH PAGE
// ─────────────────────────────────────────────────────────────────────────────

const SearchPage: React.FC = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  // State
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchParams>({ type: 'all', page: 1, limit: 18, sortBy: 'relevance' });
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [hasSearched, setHasSearched] = useState(false);

  // Sync URL query on mount
  useEffect(() => {
    const q = router.query.q as string;
    const type = router.query.type as string;
    if (q) {
      setQuery(q);
      const f: SearchParams = { ...filters, q, type: (type as any) || 'all' };
      setFilters(f);
      doSearch(f);
    }
    // theme
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setThemeMode(mq.matches ? 'dark' : 'light');
  }, []);

  const doSearch = useCallback(async (f: SearchParams) => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      const res = await searchService.searchProfiles({ ...f });
      setResults(res.data || []);
      setTotal(res.pagination?.total || res.data?.length || 0);
      setPages(res.pagination?.pages || 1);
    } catch (e: any) {
      setError(e.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    searchService.addToSearchHistory(trimmed);
    const newFilters = { ...filters, q: trimmed, page: 1 };
    setFilters(newFilters);
    router.push({ query: { q: trimmed, type: newFilters.type } }, undefined, { shallow: true });
    doSearch(newFilters);
  };

  const handleFilterChange = (f: SearchParams) => {
    setFilters(f);
    if (hasSearched || f.q) doSearch({ ...f, q: f.q || query });
  };

  const handlePage = (p: number) => {
    const f = { ...filters, page: p };
    setFilters(f);
    doSearch({ ...f, q: query });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const panelBg = themeMode === 'dark' ? 'bg-gray-950' : 'bg-gray-50';

  const content = (
    <div className={cn('min-h-screen', panelBg)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        {/* Hero (only when no results yet) */}
        {!hasSearched && <SearchHero themeMode={themeMode} />}

        {/* Search Bar */}
        <div className="relative">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            themeMode={themeMode}
          />
        </div>

        {/* Filters */}
        <SearchFilters filters={filters} onChange={handleFilterChange} themeMode={themeMode} />

        {/* Results */}
        {loading ? (
          <LoadingGrid layout={layout} />
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className={cn('text-xl font-bold mb-2', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>Search Error</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button onClick={() => doSearch({ ...filters, q: query })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
              <RefreshCw className="w-4 h-4" />Retry
            </button>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <EmptyState query={query} themeMode={themeMode} />
        ) : results.length > 0 ? (
          <>
            <ResultsHeader
              results={results} total={total} page={filters.page || 1} pages={pages}
              query={query} layout={layout} onLayoutChange={setLayout} themeMode={themeMode}
            />
            <div className={cn('transition-all duration-300', layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4')}>
              {results.map(p => (
                <UserCard key={p._id} profile={p} layout={layout} themeMode={themeMode} currentUserId={currentUser?._id} />
              ))}
            </div>
            <Pagination page={filters.page || 1} pages={pages} onPageChange={handlePage} themeMode={themeMode} />
          </>
        ) : null}
      </div>
    </div>
  );

  if (currentUser) {
    return (
      <SocialDashboardLayout>
        <RoleThemeProvider overrideRole={currentUser.role as any}>
          {content}
        </RoleThemeProvider>
      </SocialDashboardLayout>
    );
  }

  return (
    <RoleThemeProvider overrideRole="candidate">
      {content}
    </RoleThemeProvider>
  );
};

export default SearchPage;