/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/dashboard/social/search.tsx
 *
 * KEY FIXES:
 * 1. Card clicks navigate to /social/profile/[id]   ← correct route
 * 2. Company/Org logos extracted from logoUrl / logoFullUrl fields
 * 3. Search actually calls the API and displays results
 * 4. Follow uses correct 'User' | 'Company' | 'Organization' mapping
 * 5. Fully animated, dark/light, responsive
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import {
  searchService,
  SearchParams,
  SearchProfile,
} from '@/services/socialSearchService';
import { followService } from '@/services/followService';
import { cn } from '@/lib/utils';

import {
  Search, X, TrendingUp, Clock, ChevronRight, Hash, Sparkles, Loader2,
  Users, Building2, Briefcase, MapPin, Check, ChevronDown, Shield,
  User, Grid, List, AlertCircle, ExternalLink, Calendar, CheckCircle,
  Globe, Star, RefreshCw, SlidersHorizontal, Zap, ArrowRight,
  Users2, Package, DollarSign, Eye,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Safely extract a URL from Cloudinary object, plain string, or null */
function extractUrl(src: any): string {
  if (!src) return '';
  if (typeof src === 'string') return src;
  if (typeof src === 'object') {
    if (src.secure_url) return src.secure_url;
    if (src.url) return src.url;
  }
  return '';
}

/**
 * Get the display avatar/logo for a search result.
 * SearchProfile has: avatar (string | obj), logoUrl, logoFullUrl
 */
function getResultAvatar(profile: SearchProfile): string {
  // Company/org: prefer logo fields
  if (profile.type === 'company' || profile.type === 'organization') {
    const logo =
      extractUrl((profile as any).logoFullUrl) ||
      extractUrl((profile as any).logoUrl) ||
      extractUrl(profile.avatar);
    if (logo) return logo;
  }
  // Regular user avatar
  const av = extractUrl(profile.avatar);
  if (av) return av;
  // Generated fallback
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name ?? 'U')}&background=6366f1&color=fff&size=200&bold=true`;
}

function optimizeCld(url: string, w: number, h: number): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`);
}

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW TARGET TYPE
// ─────────────────────────────────────────────────────────────────────────────

function toFollowTarget(type: string): 'User' | 'Company' | 'Organization' {
  if (type === 'company') return 'Company';
  if (type === 'organization') return 'Organization';
  return 'User';
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const TC: Record<string, { grad: string; lightBg: string; lightTxt: string; label: string; icon: React.ElementType }> = {
  candidate:    { grad: 'from-blue-600 to-cyan-500',     lightBg: 'bg-blue-50',   lightTxt: 'text-blue-700',   label: 'Candidate',    icon: Briefcase },
  freelancer:   { grad: 'from-amber-500 to-orange-500',  lightBg: 'bg-amber-50',  lightTxt: 'text-amber-700',  label: 'Freelancer',   icon: Sparkles },
  company:      { grad: 'from-teal-600 to-emerald-500',  lightBg: 'bg-teal-50',   lightTxt: 'text-teal-700',   label: 'Company',      icon: Building2 },
  organization: { grad: 'from-indigo-600 to-purple-500', lightBg: 'bg-indigo-50', lightTxt: 'text-indigo-700', label: 'Organization', icon: Shield },
  user:         { grad: 'from-gray-500 to-slate-500',    lightBg: 'bg-gray-50',   lightTxt: 'text-gray-700',   label: 'User',         icon: User },
};

const fmtNum = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n ?? 0);

const fmtDate = (d?: string) => {
  try { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''; }
  catch { return ''; }
};

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH BAR
// ─────────────────────────────────────────────────────────────────────────────

const SearchBar = ({
  value, onChange, onSearch, dark,
  placeholder = 'Search people, companies, freelancers…',
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: (q: string) => void;
  dark: boolean;
  placeholder?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const [sug, setSug] = useState<any[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [trending, setTrending] = useState<{ hashtag: string; count: number }[]>([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecent(searchService.getRecentSearchesByType());
    searchService.getTrendingHashtags({ limit: 6 }).then(t => setTrending(t)).catch(() => {});
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length >= 2) {
      setSugLoading(true);
      timer.current = setTimeout(async () => {
        try { setSug(await searchService.getSearchSuggestions(value)); }
        catch { setSug([]); }
        finally { setSugLoading(false); }
      }, 280);
    } else {
      setSug([]);
      setSugLoading(false);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const go = (q: string) => {
    if (!q.trim()) return;
    searchService.addToSearchHistory(q.trim());
    setRecent(searchService.getRecentSearchesByType());
    onSearch(q.trim());
    setShowDrop(false);
    inputRef.current?.blur();
  };

  const sugColors: Record<string, string> = {
    user: 'bg-blue-100 text-blue-700', candidate: 'bg-blue-100 text-blue-700',
    company: 'bg-teal-100 text-teal-700', organization: 'bg-indigo-100 text-indigo-700',
    freelancer: 'bg-amber-100 text-amber-700', hashtag: 'bg-pink-100 text-pink-700',
  };

  const dropBg = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const hoverBg = dark ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
  const hasAny = sug.length > 0 || recent.length > 0 || trending.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={cn(
        'flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200',
        dark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900',
        focused
          ? 'border-blue-500 shadow-lg shadow-blue-500/10'
          : dark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300',
      )}>
        <Search className={cn('w-5 h-5 shrink-0 transition-colors', focused ? 'text-blue-500' : 'text-gray-400')} />
        <input
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => { setFocused(true); setShowDrop(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); go(value); }
            if (e.key === 'Escape') { setShowDrop(false); inputRef.current?.blur(); }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none placeholder:text-gray-400 text-base font-medium min-w-0"
        />
        {sugLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />}
        {value && !sugLoading && (
          <button onClick={() => { onChange(''); setSug([]); inputRef.current?.focus(); }}
            className={cn('p-1 rounded-full transition-colors shrink-0', dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        {!value && (
          <kbd className={cn('hidden sm:block px-2 py-0.5 text-xs rounded border font-medium shrink-0', dark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500')}>
            Enter
          </kbd>
        )}
      </div>

      {showDrop && hasAny && (
        <div className={cn('absolute top-full mt-2 w-full rounded-2xl border shadow-2xl overflow-hidden z-50', dropBg)}>
          {/* Suggestions */}
          {sug.length > 0 && (
            <div className={cn('p-3', (recent.length > 0 || trending.length > 0) && 'border-b', dark ? 'border-gray-800' : 'border-gray-100')}>
              <p className="px-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Suggestions</p>
              {sug.slice(0, 6).map((s: any) => {
                const rawAv = extractUrl(s.avatar) || extractUrl((s as any).logoFullUrl) || extractUrl((s as any).logoUrl);
                const avSrc = rawAv.includes('cloudinary') ? optimizeCld(rawAv, 80, 80) : rawAv;
                return (
                  <button key={`${s.type}-${s.id}`}
                    onMouseDown={() => {
                      const q = s.type === 'hashtag' ? `#${s.name.replace('#', '')}` : s.name;
                      onChange(q);
                      go(q);
                    }}
                    className={cn('w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors text-left', hoverBg)}>
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 overflow-hidden', sugColors[s.type] ?? 'bg-gray-100 text-gray-700')}>
                      {avSrc
                        ? <img src={avSrc} alt={s.name} className="w-full h-full object-cover" />
                        : s.type === 'hashtag' ? '#' : (s.name ?? 'U').charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate', dark ? 'text-white' : 'text-gray-900')}>{s.name}</p>
                      {s.subtitle && <p className="text-xs text-gray-500 truncate">{s.subtitle}</p>}
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold capitalize shrink-0', sugColors[s.type] ?? 'bg-gray-100 text-gray-700')}>{s.type}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent */}
          {recent.length > 0 && sug.length === 0 && (
            <div className={cn('p-3', trending.length > 0 && 'border-b', dark ? 'border-gray-800' : 'border-gray-100')}>
              <div className="px-2 mb-2 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3" />Recent</p>
                <button onMouseDown={() => { searchService.clearSearchHistory(); setRecent([]); }} className="text-xs text-red-500 hover:text-red-600">Clear</button>
              </div>
              {recent.slice(0, 4).map((r, i) => (
                <button key={i} onMouseDown={() => { onChange(r); go(r); }}
                  className={cn('w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors text-left', hoverBg)}>
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className={cn('text-sm flex-1 truncate', dark ? 'text-gray-300' : 'text-gray-700')}>{r}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {/* Trending */}
          {trending.length > 0 && (
            <div className="p-3">
              <p className="px-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-3 h-3" />Trending</p>
              <div className="flex flex-wrap gap-2">
                {trending.slice(0, 6).map(t => (
                  <button key={t.hashtag}
                    onMouseDown={() => { onChange(`#${t.hashtag}`); go(`#${t.hashtag}`); }}
                    className={cn('inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105', dark ? 'bg-blue-900/30 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-100 hover:shadow-md')}>
                    <Hash className="w-3 h-3" />{t.hashtag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={cn('px-4 py-2 text-center text-xs text-gray-400 border-t', dark ? 'border-gray-800 bg-gray-900/60' : 'border-gray-100 bg-gray-50/60')}>
            Press <kbd className={cn('px-1.5 py-0.5 text-xs rounded border mx-1', dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>Enter</kbd> to search
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTERS
// ─────────────────────────────────────────────────────────────────────────────

const Filters = ({ filters, onChange, dark }: {
  filters: SearchParams;
  onChange: (f: SearchParams) => void;
  dark: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  const types = [
    { v: 'all',          l: 'All',           icon: Users },
    { v: 'candidate',    l: 'Candidates',     icon: Briefcase },
    { v: 'freelancer',   l: 'Freelancers',    icon: Sparkles },
    { v: 'company',      l: 'Companies',      icon: Building2 },
    { v: 'organization', l: 'Organizations',  icon: Shield },
  ];

  const sorts = [
    { v: 'relevance', l: 'Relevance' },
    { v: 'followers', l: 'Most Followed' },
    { v: 'recent', l: 'Recent' },
    { v: 'alphabetical', l: 'A–Z' },
  ];

  const locations = ['Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 'Adama', 'Mekele'];

  const typeGrads: Record<string, string> = {
    all: 'from-blue-600 to-indigo-600', candidate: 'from-blue-600 to-cyan-500',
    freelancer: 'from-amber-500 to-orange-500', company: 'from-teal-600 to-emerald-500',
    organization: 'from-indigo-600 to-purple-500',
  };

  const hasActive = (filters.type && filters.type !== 'all') || filters.location || filters.verificationStatus || filters.minFollowers;
  const clear = () => onChange({ q: filters.q, page: 1, limit: 18, type: 'all', sortBy: 'relevance' });
  const panel = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm';
  const pill = dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200';

  return (
    <div className={cn('rounded-2xl border p-4 sm:p-5', panel)}>
      {/* Type tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {types.map(t => {
          const active = (filters.type ?? 'all') === t.v;
          return (
            <button key={t.v}
              onClick={() => onChange({ ...filters, type: t.v as any, page: 1 })}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                active ? `bg-gradient-to-r ${typeGrads[t.v]} text-white shadow-md scale-105` : pill)}>
              <t.icon className="w-3.5 h-3.5" /><span className="hidden xs:inline">{t.l}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.sortBy ?? 'relevance'}
          onChange={e => onChange({ ...filters, sortBy: e.target.value as any, page: 1 })}
          className={cn('px-3 py-2 rounded-xl text-sm font-medium border outline-none cursor-pointer', dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700')}>
          {sorts.map(s => <option key={s.v} value={s.v}>Sort: {s.l}</option>)}
        </select>

        <button onClick={() => setExpanded(e => !e)}
          className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all', pill)}>
          <SlidersHorizontal className="w-4 h-4" />Advanced
          {hasActive && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', expanded && 'rotate-180')} />
        </button>

        {hasActive && (
          <button onClick={clear} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
            <X className="w-3.5 h-3.5" />Clear
          </button>
        )}
      </div>

      {/* Advanced panel */}
      {expanded && (
        <div className={cn('mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-5', dark ? 'border-gray-800' : 'border-gray-100')}>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3 h-3" />Location</p>
            <div className="flex flex-wrap gap-1.5">
              {locations.map(l => (
                <button key={l}
                  onClick={() => onChange({ ...filters, location: filters.location === l ? undefined : l, page: 1 })}
                  className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold transition-all', filters.location === l ? 'bg-blue-600 text-white shadow-sm' : pill)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield className="w-3 h-3" />Verification</p>
            {[{ v: 'verified', l: '✓ Verified only' }, { v: undefined as any, l: 'All users' }].map(o => (
              <button key={String(o.v)}
                onClick={() => onChange({ ...filters, verificationStatus: filters.verificationStatus === o.v ? undefined : o.v, page: 1 })}
                className={cn('w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm mb-1.5 transition-all', filters.verificationStatus === o.v ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : pill)}>
                <span>{o.l}</span>{filters.verificationStatus === o.v && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" />Min Followers</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[{ l: 'Any', v: undefined }, { l: '100+', v: 100 }, { l: '1K+', v: 1000 }, { l: '5K+', v: 5000 }, { l: '10K+', v: 10000 }].map(o => (
                <button key={String(o.v)}
                  onClick={() => onChange({ ...filters, minFollowers: filters.minFollowers === o.v ? undefined : o.v, page: 1 })}
                  className={cn('py-1.5 rounded-lg text-xs font-semibold transition-all', filters.minFollowers === o.v ? 'bg-purple-600 text-white shadow-sm' : pill)}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active chips */}
      {hasActive && (
        <div className={cn('flex flex-wrap gap-2 mt-3 pt-3 border-t', dark ? 'border-gray-800' : 'border-gray-100')}>
          {filters.type && filters.type !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              {filters.type}<button onClick={() => onChange({ ...filters, type: 'all', page: 1 })} className="ml-1"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold">
              📍{filters.location}<button onClick={() => onChange({ ...filters, location: undefined, page: 1 })} className="ml-1"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.verificationStatus && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              ✓ Verified<button onClick={() => onChange({ ...filters, verificationStatus: undefined, page: 1 })} className="ml-1"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.minFollowers && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
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
// USER CARD  ← navigates to /social/profile/[id]
// ─────────────────────────────────────────────────────────────────────────────

const UserCard = ({
  profile, layout, dark, currentUserId,
}: {
  profile: SearchProfile;
  layout: 'grid' | 'list';
  dark: boolean;
  currentUserId?: string;
}) => {
  const router = useRouter();
  const [avatarErr, setAvatarErr] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoad, setFollowLoad] = useState(false);

  const tc = TC[profile.type] ?? TC.user;
  const isOwn = currentUserId === profile._id;
  const verified = profile.verified || profile.verificationStatus === 'verified';

  const rawAv = getResultAvatar(profile);
  const avatarSrc = rawAv.includes('cloudinary') ? optimizeCld(rawAv, 200, 200) : rawAv;

  // Profile page route — ALWAYS /social/profile/[id]
  const profileRoute = `/social/profile/${profile._id}`;

  useEffect(() => {
    if (currentUserId && !isOwn) {
      followService.getFollowStatus(profile._id, toFollowTarget(profile.type))
        .then(s => setFollowing(s.following))
        .catch(() => {});
    }
  }, [profile._id, currentUserId]);

  const goToProfile = useCallback(() => {
    router.push(profileRoute);
  }, [profileRoute, router]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) { router.push('/login'); return; }
    try {
      setFollowLoad(true);
      const r = await followService.toggleFollow(profile._id, { targetType: toFollowTarget(profile.type) });
      setFollowing(r.following);
    } catch { /* silent */ }
    finally { setFollowLoad(false); }
  };

  const cardBase = cn(
    'group relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-300',
    dark ? 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-xl hover:shadow-black/20' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/60',
  );

  if (layout === 'list') {
    return (
      <div onClick={goToProfile} className={cn(cardBase, 'flex items-center gap-4 p-4')}>
        {/* Accent strip */}
        <div className={cn('absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity', tc.grad)} />

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={cn('w-14 h-14 rounded-2xl overflow-hidden border-2', verified ? 'border-green-400' : dark ? 'border-gray-700' : 'border-gray-200')}>
            {!avatarErr ? (
              <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" onError={() => setAvatarErr(true)} />
            ) : (
              <div className={cn('w-full h-full flex items-center justify-center text-xl font-black text-white bg-gradient-to-br', tc.grad)}>
                {(profile.name ?? 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {verified && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900"><Check className="w-2.5 h-2.5 text-white" /></div>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className={cn('font-bold text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors', dark ? 'text-white' : 'text-gray-900')}>{profile.name}</h3>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold shrink-0', tc.lightBg, tc.lightTxt)}>{tc.label}</span>
          </div>
          {profile.headline && <p className={cn('text-xs sm:text-sm truncate', dark ? 'text-gray-400' : 'text-gray-600')}>{profile.headline}</p>}
          {/* Description for company/org */}
          {!profile.headline && profile.description && (
            <p className={cn('text-xs truncate', dark ? 'text-gray-400' : 'text-gray-600')}>{profile.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
            {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>}
            {profile.industry && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{profile.industry}</span>}
            {profile.followerCount > 0 && <span>{fmtNum(profile.followerCount)} followers</span>}
          </div>
        </div>

        {/* Actions */}
        <div onClick={e => e.stopPropagation()} className="shrink-0 flex gap-2 items-center">
          {!isOwn && (
            <button onClick={handleFollow} disabled={followLoad}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-bold transition-all', following ? dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700' : `bg-gradient-to-r ${tc.grad} text-white hover:shadow-md hover:scale-105`)}>
              {followLoad ? <Loader2 className="w-3 h-3 animate-spin" /> : following ? '✓ Following' : 'Follow'}
            </button>
          )}
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100', dark ? 'bg-gray-800' : 'bg-gray-100')}>
            <ArrowRight className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>
    );
  }

  // GRID
  return (
    <div onClick={goToProfile} className={cn(cardBase, 'flex flex-col p-5')}>
      {/* Top strip */}
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300', tc.grad)} />
      {/* Hover tint */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.04] transition-opacity pointer-events-none', tc.grad)} />

      {/* Avatar + badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          <div className={cn('w-16 h-16 rounded-2xl overflow-hidden border-2 transition-transform duration-300 group-hover:scale-105', verified ? 'border-green-400' : dark ? 'border-gray-700' : 'border-gray-200')}>
            {!avatarErr ? (
              <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" onError={() => setAvatarErr(true)} />
            ) : (
              <div className={cn('w-full h-full flex items-center justify-center text-2xl font-black text-white bg-gradient-to-br', tc.grad)}>
                {(profile.name ?? 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {verified && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900"><Check className="w-2.5 h-2.5 text-white" /></div>}
        </div>
        <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0', tc.lightBg, tc.lightTxt)}>
          <tc.icon className="w-3 h-3" />{tc.label}
        </span>
      </div>

      {/* Name */}
      <h3 className={cn('font-bold text-base line-clamp-1 group-hover:text-blue-600 transition-colors mb-1', dark ? 'text-white' : 'text-gray-900')}>{profile.name}</h3>

      {/* Subtitle */}
      {profile.headline
        ? <p className={cn('text-xs line-clamp-2 mb-3', dark ? 'text-gray-400' : 'text-gray-600')}>{profile.headline}</p>
        : profile.description
          ? <p className={cn('text-xs line-clamp-2 mb-3', dark ? 'text-gray-400' : 'text-gray-600')}>{profile.description}</p>
          : <div className="mb-3" />
      }

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
        {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>}
        {profile.industry && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{profile.industry}</span>}
        {(profile as any).website && (
          <span className="flex items-center gap-1 truncate max-w-[130px]">
            <Globe className="w-3 h-3 shrink-0" />{(profile as any).website.replace(/^https?:\/\//, '').split('/')[0]}
          </span>
        )}
      </div>

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {profile.skills.slice(0, 3).map((s, i) => (
            <span key={i} className={cn('px-2 py-0.5 rounded-lg text-xs font-medium', dark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600')}>{s}</span>
          ))}
          {profile.skills.length > 3 && <span className={cn('px-2 py-0.5 rounded-lg text-xs', dark ? 'text-gray-600' : 'text-gray-400')}>+{profile.skills.length - 3}</span>}
        </div>
      )}

      {/* Footer */}
      <div className={cn('flex items-center justify-between mt-auto pt-3 border-t', dark ? 'border-gray-800' : 'border-gray-100')}>
        <span className="text-xs text-gray-500">
          {profile.followerCount > 0 ? `${fmtNum(profile.followerCount)} followers` : fmtDate(profile.joinedDate) || 'New member'}
        </span>
        <div onClick={e => e.stopPropagation()}>
          {!isOwn ? (
            <button onClick={handleFollow} disabled={followLoad}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200', following ? dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700' : `bg-gradient-to-r ${tc.grad} text-white hover:shadow-md hover:scale-105`)}>
              {followLoad ? <Loader2 className="w-3 h-3 animate-spin" /> : following ? '✓ Following' : '+ Follow'}
            </button>
          ) : (
            <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">View <ArrowRight className="w-3 h-3" /></span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS HEADER + BREAKDOWN
// ─────────────────────────────────────────────────────────────────────────────

const ResultsHeader = ({ results, total, page, pages, query, layout, onLayout, dark }: any) => {
  const counts: Record<string, number> = {};
  results.forEach((r: SearchProfile) => { counts[r.type] = (counts[r.type] || 0) + 1; });
  const chipColors: Record<string, string> = {
    candidate:    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    freelancer:   'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    company:      'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300',
    organization: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
    user:         'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  };
  const panel = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm';
  return (
    <div className={cn('rounded-2xl border p-4 sm:p-5', panel)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className={cn('text-xl font-black', dark ? 'text-white' : 'text-gray-900')}>
            {query ? <><span className="font-normal text-gray-500">Results for </span>`{query}`</> : `${total.toLocaleString()} results`}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Showing {results.length} of {total.toLocaleString()} · Page {page}/{pages}</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
          {(['grid', 'list'] as const).map(l => (
            <button key={l} onClick={() => onLayout(l)}
              className={cn('p-2.5 rounded-lg transition-all duration-200', layout === l ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700')}>
              {l === 'grid' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>
      {Object.entries(counts).length > 0 && (
        <div className={cn('flex flex-wrap gap-2 pt-3 border-t', dark ? 'border-gray-800' : 'border-gray-100')}>
          {Object.entries(counts).map(([type, count]) => {
            const tc = TC[type]; if (!tc) return null;
            return (
              <span key={type} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold', chipColors[type])}>
                <tc.icon className="w-3.5 h-3.5" />{count} {tc.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

const Pagination = ({ page, pages, onChange, dark }: {
  page: number; pages: number; onChange: (p: number) => void; dark: boolean;
}) => {
  if (pages <= 1) return null;
  const visible = Array.from({ length: Math.min(5, pages) }, (_, i) => {
    if (pages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= pages - 2) return pages - 4 + i;
    return page - 2 + i;
  });
  const btn = cn('transition-all duration-200', dark ? 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50');
  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}
        className={cn('px-4 py-2 rounded-xl text-sm font-semibold border', btn, page === 1 && 'opacity-40 cursor-not-allowed')}>← Prev</button>
      {visible.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={cn('w-10 h-10 rounded-xl text-sm font-bold border', p === page ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg scale-110' : btn)}>{p}</button>
      ))}
      {pages > 5 && page < pages - 2 && (
        <><span className="text-gray-400">…</span>
          <button onClick={() => onChange(pages)} className={cn('w-10 h-10 rounded-xl text-sm font-bold border', btn)}>{pages}</button></>
      )}
      <button disabled={page === pages} onClick={() => onChange(page + 1)}
        className={cn('px-4 py-2 rounded-xl text-sm font-semibold border', btn, page === pages && 'opacity-40 cursor-not-allowed')}>Next →</button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HERO BANNER (shown before first search)
// ─────────────────────────────────────────────────────────────────────────────

const Hero = ({ dark }: { dark: boolean }) => (
  <div className={cn('rounded-3xl p-6 sm:p-8 relative overflow-hidden', dark ? 'bg-gray-900 border border-gray-800' : 'bg-[#0A2540]')}>
    <div className="absolute top-0 right-0 w-72 h-72 bg-[#FFD700] rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4DA6FF] rounded-full blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    <div className="relative z-10">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">
        Find <span className="text-[#FFD700]">Talent &amp; Opportunities</span>
      </h1>
      <p className="text-blue-200 text-sm sm:text-base max-w-xl mb-6">
        Discover candidates, freelancers, companies and organizations in one professional network.
      </p>
      <div className="flex flex-wrap gap-5">
        {[{ n: '12,500+', d: 'Professionals', icon: Users }, { n: '850+', d: 'Companies', icon: Building2 }, { n: '45K+', d: 'Connections', icon: Zap }].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><s.icon className="w-4 h-4 text-[#FFD700]" /></div>
            <div><p className="text-[#FFD700] font-black text-sm leading-none">{s.n}</p><p className="text-blue-300 text-xs">{s.d}</p></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// LOADING / EMPTY / ERROR STATES
// ─────────────────────────────────────────────────────────────────────────────

const LoadingGrid = ({ layout, dark }: { layout: 'grid' | 'list'; dark: boolean }) => {
  const pulse = dark ? 'bg-gray-800' : 'bg-gray-200';
  const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  return (
    <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
      {Array.from({ length: layout === 'grid' ? 9 : 6 }).map((_, i) => (
        <div key={i} className={cn('animate-pulse rounded-2xl border p-5', card)}>
          <div className="flex items-start gap-3 mb-4">
            <div className={cn('w-14 h-14 rounded-2xl shrink-0', pulse)} />
            <div className="flex-1 space-y-2 pt-1">
              <div className={cn('h-4 rounded w-3/4', pulse)} />
              <div className={cn('h-3 rounded w-1/2', pulse)} />
            </div>
          </div>
          <div className="space-y-2">{[1, 2].map(j => <div key={j} className={cn('h-3 rounded', pulse)} />)}</div>
        </div>
      ))}
    </div>
  );
};

const EmptyState = ({ query, dark }: { query: string; dark: boolean }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mb-5', dark ? 'bg-gray-800' : 'bg-gray-100')}>
      <Search className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className={cn('text-2xl font-black mb-2', dark ? 'text-white' : 'text-gray-900')}>
      {query ? `No results for "${query}"` : 'Start Searching'}
    </h3>
    <p className="text-gray-500 max-w-md text-sm">
      {query ? 'Try different keywords or adjust your filters.' : 'Search for people, companies, freelancers, or organizations.'}
    </p>
    {!query && (
      <div className="flex flex-wrap gap-2 mt-6 justify-center">
        {['Developers', 'Designers', 'Tech Companies', 'NGOs', 'Marketers', 'Startups'].map(t => (
          <span key={t} className={cn('px-3 py-1.5 text-sm rounded-full font-medium border', dark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-blue-50 border-blue-100 text-blue-700')}>{t}</span>
        ))}
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const SearchPage: React.FC = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [dark, setDark] = useState(false);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchParams>({ type: 'all', page: 1, limit: 18, sortBy: 'relevance' });
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const h = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Sync URL params on mount
  useEffect(() => {
    const q = router.query.q as string;
    const type = router.query.type as string;
    if (q) {
      setQuery(q);
      const f: SearchParams = { ...filters, q, type: (type as any) || 'all' };
      setFilters(f);
      doSearch(f);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = useCallback(async (f: SearchParams) => {
    if (!f.q?.trim() && !f.type) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await searchService.searchProfiles({ ...f });
      setResults(res.data ?? []);
      setTotal(res.pagination?.total ?? res.data?.length ?? 0);
      setPages(res.pagination?.pages ?? 1);
    } catch (e: any) {
      setError(e?.message || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const f: SearchParams = { ...filters, q: trimmed, page: 1 };
    setFilters(f);
    router.push({ query: { q: trimmed, type: f.type } }, undefined, { shallow: true });
    doSearch(f);
  };

  const handleFilterChange = (f: SearchParams) => {
    setFilters(f);
    // Re-run search if we've already searched or there's a query
    if (searched || f.q || query) {
      doSearch({ ...f, q: f.q ?? query });
    }
  };

  const handlePage = (p: number) => {
    const f = { ...filters, page: p };
    setFilters(f);
    doSearch({ ...f, q: query });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';

  const inner = (
    <div className={cn('min-h-screen', bg)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        {!searched && <Hero dark={dark} />}

        <SearchBar value={query} onChange={setQuery} onSearch={handleSearch} dark={dark} />
        <Filters filters={filters} onChange={handleFilterChange} dark={dark} />

        {loading ? (
          <LoadingGrid layout={layout} dark={dark} />
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className={cn('text-xl font-black mb-2', dark ? 'text-white' : 'text-gray-900')}>Search error</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button onClick={() => doSearch({ ...filters, q: query })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              <RefreshCw className="w-4 h-4" />Retry
            </button>
          </div>
        ) : searched && results.length === 0 ? (
          <EmptyState query={query} dark={dark} />
        ) : results.length > 0 ? (
          <>
            <ResultsHeader results={results} total={total} page={filters.page ?? 1} pages={pages} query={query} layout={layout} onLayout={setLayout} dark={dark} />
            <div className={cn('transition-all duration-300', layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4')}>
              {results.map(p => (
                <UserCard key={p._id} profile={p} layout={layout} dark={dark} currentUserId={currentUser?._id} />
              ))}
            </div>
            <Pagination page={filters.page ?? 1} pages={pages} onChange={handlePage} dark={dark} />
          </>
        ) : null}
      </div>
    </div>
  );

  if (currentUser) {
    return (
      <SocialDashboardLayout>
        <RoleThemeProvider overrideRole={currentUser.role as any}>{inner}</RoleThemeProvider>
      </SocialDashboardLayout>
    );
  }

  return <RoleThemeProvider overrideRole="candidate">{inner}</RoleThemeProvider>;
};

export default SearchPage;