/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/social/profile/[id].tsx
 *
 * KEY FIXES:
 * 1. Route is /social/profile/[id] (not /dashboard/social/...)
 * 2. Correct TypeScript types from each service:
 *    - CandidateProfile from candidateService (has skills, experience, education, certifications, portfolio)
 *    - UserProfile from freelancerService (has freelancerProfile.hourlyRate, freelancerProfile.availability, portfolio)
 *    - CompanyProfile from companyService (has industry, website, phone, verified, logoUrl, description)
 *    - OrganizationProfile from organizationService (has mission, organizationType, phone, verified)
 *    - DetailedProfile.roleSpecific ONLY has { skills: string[], experience: any, education: any }
 * 3. All role-specific data accessed via typed roleData (any cast used where needed for runtime flexibility)
 * 4. Cover/Avatar from Cloudinary objects AND plain strings
 * 5. Follow: correct 'User' | 'Company' | 'Organization' mapping
 * 6. Layout: Header → Tabs → Content (no middle strip)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'sonner';

// ── Services ─────────────────────────────────────────────────────────────────
import {
  profileService,
  DetailedProfile,
  SocialLinks,
  Certification,
  Experience,
  Education,
  Language,
  CloudinaryImage,
} from '@/services/profileService';
import { followService } from '@/services/followService';
import { companyService, CompanyProfile } from '@/services/companyService';
import { organizationService, OrganizationProfile } from '@/services/organizationService';
import { candidateService, CandidateProfile } from '@/services/candidateService';
import { freelancerService, UserProfile as FreelancerUserProfile, PortfolioItem } from '@/services/freelancerService';
import { useAuth } from '@/contexts/AuthContext';

// ── Layout ───────────────────────────────────────────────────────────────────
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { ProfileTabs, ProfileTabContent, TabTransitionWrapper } from '@/components/profile/ProfileTabs';
import { Button } from '@/components/social/ui/Button';

// ── Colors ───────────────────────────────────────────────────────────────────
import type { ThemeMode } from '@/utils/color';
import { cn } from '@/lib/utils';

// ── Icons ────────────────────────────────────────────────────────────────────
import {
  Briefcase, Sparkles, Building2, Users, Shield, Camera, CheckCircle,
  MapPin, ExternalLink, Calendar, Share2, Loader2, UserCheck, MessageCircle,
  Edit3, FileText, Heart, Eye, Linkedin, Twitter, Github, Facebook,
  Instagram, Youtube, AlertCircle, ArrowLeft, Crown, DollarSign, Award,
  GraduationCap, Code, Globe, Phone, Tag, Zap, Target, Handshake,
  Trophy, Lightbulb, ChevronDown, ChevronUp, Info, Users2, Layers,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPED ROLE DATA UNION
// ─────────────────────────────────────────────────────────────────────────────

type RoleData =
  | CandidateProfile         // candidate
  | FreelancerUserProfile    // freelancer
  | CompanyProfile           // company
  | OrganizationProfile      // organization
  | null;

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function extractUrl(src: CloudinaryImage | string | null | undefined): string {
  if (!src) return '';
  if (typeof src === 'string') return src;
  if (typeof src === 'object') {
    if ('secure_url' in src && src.secure_url) return src.secure_url;
    if ('url' in (src as any)) return (src as any).url || '';
  }
  return '';
}

function getAvatarUrl(p: DetailedProfile): string {
  // 1. profile.avatar (CloudinaryImage object from profileService upload)
  const fromObj = extractUrl(p.avatar);
  if (fromObj) return fromObj;
  // 2. user.avatar (plain string stored on user document)
  if (p.user?.avatar) return p.user.avatar;
  // 3. generated
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.name ?? 'U')}&background=6366f1&color=fff&size=200&bold=true`;
}

function getCoverUrl(p: DetailedProfile): string | null {
  // 1. profile.cover (CloudinaryImage object)
  const fromCover = extractUrl((p as any).cover);
  if (fromCover) return fromCover;
  // 2. profile.coverPhoto (string)
  if (p.coverPhoto) return p.coverPhoto;
  // 3. user.coverPhoto
  if (p.user?.coverPhoto) return p.user.coverPhoto;
  return null;
}

// Get logo/avatar for a company or org (from their specific service data)
function getCompanyLogoUrl(rd: CompanyProfile | OrganizationProfile | null): string {
  if (!rd) return '';
  return rd.logoFullUrl || rd.logoUrl || '';
}

function optimizeCld(url: string, w: number, h: number): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`);
}

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW TARGET TYPE
// ─────────────────────────────────────────────────────────────────────────────

function toFollowTarget(role: string): 'User' | 'Company' | 'Organization' {
  if (role === 'company') return 'Company';
  if (role === 'organization') return 'Organization';
  return 'User'; // candidate, freelancer, admin
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

interface RoleCfg {
  icon: React.ElementType;
  label: string;
  grad: string;
  lightBg: string;
  lightTxt: string;
  darkBg: string;
  darkTxt: string;
  ring: string;
}

const ROLE_CFG: Record<string, RoleCfg> = {
  candidate:    { icon: Briefcase,  label: 'Job Seeker',    grad: 'from-blue-600 to-cyan-500',     lightBg: 'bg-blue-50',   lightTxt: 'text-blue-700',   darkBg: 'dark:bg-blue-900/30',   darkTxt: 'dark:text-blue-300',   ring: 'ring-blue-400' },
  freelancer:   { icon: Sparkles,   label: 'Freelancer',    grad: 'from-amber-500 to-rose-500',    lightBg: 'bg-amber-50',  lightTxt: 'text-amber-700',  darkBg: 'dark:bg-amber-900/30',  darkTxt: 'dark:text-amber-300',  ring: 'ring-amber-400' },
  company:      { icon: Building2,  label: 'Company',       grad: 'from-teal-600 to-emerald-500',  lightBg: 'bg-teal-50',   lightTxt: 'text-teal-700',   darkBg: 'dark:bg-teal-900/30',   darkTxt: 'dark:text-teal-300',   ring: 'ring-teal-400' },
  organization: { icon: Users,      label: 'Organization',  grad: 'from-indigo-600 to-purple-500', lightBg: 'bg-indigo-50', lightTxt: 'text-indigo-700', darkBg: 'dark:bg-indigo-900/30', darkTxt: 'dark:text-indigo-300', ring: 'ring-indigo-400' },
  admin:        { icon: Shield,     label: 'Administrator', grad: 'from-purple-600 to-pink-500',   lightBg: 'bg-purple-50', lightTxt: 'text-purple-700', darkBg: 'dark:bg-purple-900/30', darkTxt: 'dark:text-purple-300', ring: 'ring-purple-400' },
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

const fmtNum = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n ?? 0);

const fmtDate = (d?: string, opts?: Intl.DateTimeFormatOptions) => {
  try { return d ? new Date(d).toLocaleDateString('en-US', opts ?? { year: 'numeric', month: 'long' }) : ''; }
  catch { return d ?? ''; }
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CARD / SECTION HEAD
// ─────────────────────────────────────────────────────────────────────────────

const Card = ({ children, className = '', dark }: { children: React.ReactNode; className?: string; dark: boolean }) => (
  <div className={cn(
    'rounded-2xl border p-5 sm:p-6 transition-all duration-300',
    dark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200',
    className,
  )}>{children}</div>
);

const SH = ({ icon: Icon, title, dark }: { icon: React.ElementType; title: string; dark: boolean }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className={cn('p-1.5 rounded-lg', dark ? 'bg-gray-800' : 'bg-gray-100')}>
      <Icon className={cn('w-4 h-4', dark ? 'text-gray-300' : 'text-gray-600')} />
    </div>
    <h3 className={cn('font-bold text-base', dark ? 'text-white' : 'text-gray-900')}>{title}</h3>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

const Skeleton = ({ dark }: { dark: boolean }) => {
  const p = dark ? 'bg-gray-800' : 'bg-gray-200';
  const c = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  return (
    <div className="animate-pulse space-y-5">
      <div className={cn('rounded-3xl overflow-hidden border', c)}>
        <div className={cn('h-52 sm:h-64', p)} />
        <div className="px-5 sm:px-8 pb-6">
          <div className="flex items-end justify-between -mt-12 sm:-mt-16 mb-4">
            <div className={cn('w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4', p, dark ? 'border-gray-900' : 'border-white')} />
            <div className="flex gap-2 pb-1">{[1,2,3].map(i => <div key={i} className={cn('h-9 w-20 rounded-xl', p)} />)}</div>
          </div>
          <div className="space-y-3">
            <div className={cn('h-7 w-52 rounded-lg', p)} />
            <div className={cn('h-5 w-72 rounded-lg', p)} />
            <div className="flex gap-4">{[1,2,3].map(i => <div key={i} className={cn('h-4 w-28 rounded', p)} />)}</div>
          </div>
          <div className={cn('grid grid-cols-4 gap-4 mt-6 pt-5 border-t', dark ? 'border-gray-800' : 'border-gray-100')}>
            {[1,2,3,4].map(i => <div key={i} className="text-center space-y-2">
              <div className={cn('h-10 w-10 mx-auto rounded-xl', p)} />
              <div className={cn('h-5 w-12 mx-auto rounded', p)} />
              <div className={cn('h-3 w-14 mx-auto rounded', p)} />
            </div>)}
          </div>
        </div>
      </div>
      <div className={cn('h-14 rounded-2xl', p)} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">{[1,2,3].map(i => <div key={i} className={cn('p-6 rounded-2xl border', c)}><div className={cn('h-5 w-28 mb-4 rounded', p)} />{[1,2,3].map(j => <div key={j} className={cn('h-4 mb-2 rounded', p)} />)}</div>)}</div>
        <div className="space-y-4">{[1,2].map(i => <div key={i} className={cn('p-6 rounded-2xl border', c)}><div className={cn('h-5 w-20 mb-4 rounded', p)} /><div className={cn('h-24 rounded-xl', p)} /></div>)}</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE HEADER
// ─────────────────────────────────────────────────────────────────────────────

const ProfileHeader = ({
  profile, companyLogo, isOwn, isFollowing, followPending,
  rc, onFollow, onShare, onMessage, onEdit, dark,
}: {
  profile: DetailedProfile;
  companyLogo: string;
  isOwn: boolean;
  isFollowing: boolean;
  followPending: boolean;
  rc: RoleCfg;
  onFollow: () => void;
  onShare: () => void;
  onMessage: () => void;
  onEdit: () => void;
  dark: boolean;
}) => {
  const router = useRouter();
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [coverErr, setCoverErr] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);

  const rawAvatar = getAvatarUrl(profile);
  const rawCover = getCoverUrl(profile);

  // For company/org, prefer their logo as avatar
  const role = profile.user?.role;
  const isCompanyOrOrg = role === 'company' || role === 'organization';
  const effectiveAvatar = isCompanyOrOrg && companyLogo ? companyLogo : rawAvatar;

  const avatarSrc = effectiveAvatar.includes('cloudinary') ? optimizeCld(effectiveAvatar, 300, 300) : effectiveAvatar;
  const coverSrc = rawCover ? (rawCover.includes('cloudinary') ? optimizeCld(rawCover, 1400, 420) : rawCover) : null;

  // Also use company banner/logo as cover if no profile cover
  const isVerified = profile.verificationStatus === 'verified' || (profile as any).isVerified;
  const isPremium = profile.premium?.isPremium;

  const stats = [
    { l: 'Posts',     v: profile.socialStats?.postCount ?? 0,     icon: FileText, g: 'from-blue-500 to-cyan-500' },
    { l: 'Followers', v: profile.socialStats?.followerCount ?? 0,  icon: Heart,    g: 'from-rose-500 to-pink-500' },
    { l: 'Following', v: profile.socialStats?.followingCount ?? 0, icon: Users,    g: 'from-violet-500 to-purple-500' },
    { l: 'Views',     v: profile.socialStats?.profileViews ?? 0,   icon: Eye,      g: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className={cn('rounded-3xl overflow-hidden border shadow-xl', dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
      {/* Cover */}
      <div className="relative h-48 sm:h-60 lg:h-72 overflow-hidden">
        {coverSrc && !coverErr ? (
          <>
            <img
              src={coverSrc} alt="cover"
              className={cn('absolute inset-0 w-full h-full object-cover transition-all duration-700 hover:scale-105', coverLoaded ? 'opacity-100' : 'opacity-0')}
              onLoad={() => setCoverLoaded(true)}
              onError={() => { setCoverErr(true); setCoverLoaded(false); }}
            />
            {!coverLoaded && <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800"><Loader2 className="w-8 h-8 text-gray-400 animate-spin" /></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </>
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', rc.grad)}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          </div>
        )}
        {isOwn && (
          <button onClick={() => router.push('/settings/cover')}
            className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md text-white text-xs font-medium hover:bg-black/60 transition-all border border-white/20">
            <Camera className="w-3.5 h-3.5" /><span className="hidden sm:inline">Change Cover</span>
          </button>
        )}
      </div>

      {/* Avatar + actions */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between -mt-12 sm:-mt-16 mb-4">
          <div className="relative">
            <div className={cn(
              'w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 shadow-xl',
              dark ? 'border-gray-900' : 'border-white',
              isVerified ? `ring-2 ring-offset-2 ${rc.ring} ${dark ? 'ring-offset-gray-900' : 'ring-offset-white'}` : '',
            )}>
              {!avatarErr ? (
                <img src={avatarSrc} alt={profile.user?.name} className="w-full h-full object-cover" onError={() => setAvatarErr(true)} />
              ) : (
                <div className={cn('w-full h-full flex items-center justify-center text-3xl sm:text-4xl font-black text-white bg-gradient-to-br', rc.grad)}>
                  {(profile.user?.name ?? 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {isVerified && <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white dark:border-gray-900 shadow-md"><CheckCircle className="w-3 h-3 text-white" /></div>}
            {isPremium && <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-1.5 border-2 border-white dark:border-gray-900 shadow-md"><Crown className="w-3 h-3 text-white" /></div>}
            {isOwn && (
              <button onClick={() => router.push('/settings/avatar')} className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pb-1">
            <Button onClick={onShare} variant="outline" size="sm" className={cn('h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm', dark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50')}>
              <Share2 className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Share</span>
            </Button>
            {!isOwn ? (
              <>
                <Button onClick={onFollow} size="sm" disabled={followPending}
                  className={cn('h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm transition-all duration-300',
                    isFollowing
                      ? cn('border', dark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-800')
                      : `bg-gradient-to-r ${rc.grad} text-white border-0 hover:opacity-90 hover:shadow-lg hover:scale-105`,
                  )}>
                  {followPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isFollowing
                    ? <><UserCheck className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Following</span></>
                    : <><Users2 className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Follow</span></>}
                </Button>
                <Button onClick={onMessage} variant="premium" size="sm" className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm">
                  <MessageCircle className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Message</span>
                </Button>
              </>
            ) : (
              <Button onClick={onEdit} variant="premium" size="sm" className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm">
                <Edit3 className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Edit Profile</span>
              </Button>
            )}
          </div>
        </div>

        {/* Name / headline / meta */}
        <div className="space-y-2 mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={cn('text-xl sm:text-2xl lg:text-3xl font-black tracking-tight', dark ? 'text-white' : 'text-gray-900')}>{profile.user?.name}</h1>
            {isVerified && (
              <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />Verified
              </span>
            )}
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5', rc.lightBg, rc.lightTxt, rc.darkBg, rc.darkTxt)}>
              <rc.icon className="w-3 h-3" />{rc.label}
            </span>
          </div>

          {profile.headline && (
            <p className={cn('text-sm sm:text-base font-medium', dark ? 'text-gray-300' : 'text-gray-700')}>{profile.headline}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {profile.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" />{profile.location}</span>}
            {profile.website && (
              <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                {profile.website.replace(/^https?:\/\//, '').split('/')[0]}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0" />Joined {fmtDate(profile.createdAt)}</span>
            {profile.lastActive && <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Recently active</span>}
          </div>
        </div>

        {/* Stats */}
        <div className={cn('grid grid-cols-4 gap-3 py-5 border-t', dark ? 'border-gray-800' : 'border-gray-100')}>
          {stats.map((s, i) => (
            <div key={i} className="group text-center cursor-default">
              <div className={cn('w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-200', s.g)}>
                <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <p className={cn('text-lg sm:text-xl font-black', dark ? 'text-white' : 'text-gray-900')}>{fmtNum(s.v)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL SECTIONS
// ─────────────────────────────────────────────────────────────────────────────

const BioSection = ({ bio, dark }: { bio: string; dark: boolean }) => {
  const [exp, setExp] = useState(false);
  const long = bio.length > 300;
  return (
    <Card dark={dark}>
      <SH icon={Info} title="About" dark={dark} />
      <p className={cn('text-sm sm:text-base leading-relaxed whitespace-pre-line', dark ? 'text-gray-300' : 'text-gray-700')}>
        {long && !exp ? `${bio.slice(0, 300)}…` : bio}
      </p>
      {long && (
        <button onClick={() => setExp(e => !e)} className="mt-3 text-sm font-semibold text-blue-600 flex items-center gap-1 hover:underline">
          {exp ? <><ChevronUp className="w-4 h-4" />Less</> : <><ChevronDown className="w-4 h-4" />More</>}
        </button>
      )}
    </Card>
  );
};

const SkillChips = ({ skills, dark }: { skills: string[]; dark: boolean }) => {
  const [exp, setExp] = useState(false);
  const limit = 14;
  if (!skills?.length) return null;
  return (
    <Card dark={dark}>
      <SH icon={Code} title="Skills" dark={dark} />
      <div className="flex flex-wrap gap-2">
        {(exp ? skills : skills.slice(0, limit)).map((s, i) => (
          <span key={i} className={cn('px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border hover:scale-105 transition-transform cursor-default', dark ? 'bg-blue-900/20 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200')}>{s}</span>
        ))}
        {!exp && skills.length > limit && (
          <button onClick={() => setExp(true)} className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold border', dark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200')}>
            +{skills.length - limit}
          </button>
        )}
      </div>
    </Card>
  );
};

// Experience uses profileService.Experience type
const ExperienceSection = ({ experiences, dark }: { experiences: Experience[]; dark: boolean }) => {
  if (!experiences?.length) return null;
  return (
    <Card dark={dark}>
      <SH icon={Briefcase} title="Experience" dark={dark} />
      <div className="space-y-5">
        {experiences.map((e, i) => (
          <div key={i} className="relative pl-5 border-l-2 border-gray-200 dark:border-gray-700">
            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
            <p className={cn('font-bold text-sm sm:text-base', dark ? 'text-white' : 'text-gray-900')}>{e.position}</p>
            <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">{e.company}</p>
            {e.location && <p className="text-xs text-gray-500"><MapPin className="w-3 h-3 inline mr-1" />{e.location}</p>}
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {fmtDate(e.startDate, { month: 'short', year: 'numeric' })} –{' '}
              {e.current ? <span className="text-green-600 font-semibold">Present</span> : fmtDate(e.endDate, { month: 'short', year: 'numeric' })}
            </p>
            {e.description && <p className={cn('text-xs sm:text-sm mt-1 line-clamp-3', dark ? 'text-gray-400' : 'text-gray-600')}>{e.description}</p>}
            {e.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {e.skills.slice(0, 5).map((sk, j) => (
                  <span key={j} className={cn('px-2 py-0.5 text-xs rounded-lg', dark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600')}>{sk}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

const EducationSection = ({ educations, dark }: { educations: Education[]; dark: boolean }) => {
  if (!educations?.length) return null;
  return (
    <Card dark={dark}>
      <SH icon={GraduationCap} title="Education" dark={dark} />
      <div className="space-y-5">
        {educations.map((e, i) => (
          <div key={i} className="relative pl-5 border-l-2 border-gray-200 dark:border-gray-700">
            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            <p className={cn('font-bold text-sm sm:text-base', dark ? 'text-white' : 'text-gray-900')}>{e.degree}</p>
            <p className={cn('text-xs sm:text-sm', dark ? 'text-gray-300' : 'text-gray-700')}>{e.institution}</p>
            {e.field && <p className={cn('text-xs', dark ? 'text-gray-400' : 'text-gray-500')}>{e.field}</p>}
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {fmtDate(e.startDate, { month: 'short', year: 'numeric' })} –{' '}
              {e.current ? 'Present' : fmtDate(e.endDate, { month: 'short', year: 'numeric' })}
            </p>
            {e.description && <p className={cn('text-xs sm:text-sm mt-1', dark ? 'text-gray-400' : 'text-gray-600')}>{e.description}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
};

const CertsSection = ({ certs, dark }: { certs: Certification[]; dark: boolean }) => {
  if (!certs?.length) return null;
  return (
    <Card dark={dark}>
      <SH icon={Award} title="Certifications" dark={dark} />
      <div className="space-y-4">
        {certs.map((c, i) => (
          <div key={i} className="flex gap-3">
            <div className={cn('shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', dark ? 'bg-amber-900/30' : 'bg-amber-50')}>
              <Trophy className={cn('w-5 h-5', dark ? 'text-amber-400' : 'text-amber-600')} />
            </div>
            <div className="min-w-0">
              <p className={cn('font-semibold text-sm', dark ? 'text-white' : 'text-gray-900')}>{c.name}</p>
              <p className={cn('text-xs', dark ? 'text-gray-400' : 'text-gray-600')}>{c.issuer}</p>
              <p className="text-xs text-gray-500">{fmtDate(c.issueDate, { month: 'short', year: 'numeric' })}</p>
              {c.credentialUrl && (
                <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 mt-0.5 hover:underline">
                  <ExternalLink className="w-3 h-3" />Verify credential
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const SocialLinksSection = ({ links, dark }: { links: SocialLinks | Record<string, string>; dark: boolean }) => {
  const P: Record<string, { icon: React.ElementType; label: string; bg: string }> = {
    linkedin: { icon: Linkedin,  label: 'LinkedIn',  bg: 'bg-[#0A66C2]' },
    twitter:  { icon: Twitter,   label: 'Twitter',   bg: 'bg-[#1DA1F2]' },
    github:   { icon: Github,    label: 'GitHub',    bg: dark ? 'bg-gray-700' : 'bg-gray-800' },
    facebook: { icon: Facebook,  label: 'Facebook',  bg: 'bg-[#1877F2]' },
    instagram:{ icon: Instagram, label: 'Instagram', bg: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    youtube:  { icon: Youtube,   label: 'YouTube',   bg: 'bg-[#FF0000]' },
  };
  const valid = Object.entries(links ?? {}).filter(([k, v]) => v && P[k]);
  if (!valid.length) return null;
  return (
    <Card dark={dark}>
      <SH icon={Globe} title="Connect" dark={dark} />
      <div className="flex flex-wrap gap-2">
        {valid.map(([k, url]) => {
          const p = P[k];
          return (
            <a key={k} href={(url as string).startsWith('http') ? url as string : `https://${url}`}
              target="_blank" rel="noopener noreferrer"
              className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-xs font-semibold hover:scale-105 hover:shadow-md transition-all duration-200', p.bg)}>
              <p.icon className="w-3.5 h-3.5" />{p.label}
            </a>
          );
        })}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLE-SPECIFIC SIDEBAR SECTIONS
// Using typed roleData from each service
// ─────────────────────────────────────────────────────────────────────────────

/** CANDIDATE sidebar – uses CandidateProfile from candidateService */
const CandidateSidebar = ({ roleData, dark }: { roleData: CandidateProfile | null; dark: boolean }) => {
  // CandidateProfile doesn't have openToWork/jobPreferences in its interface,
  // but the API may return extra fields — we access via (rd as any) to be safe
  const rd = roleData as any;
  const openToWork: boolean = rd?.openToWork ?? false;
  const desiredPositions: string[] = rd?.jobPreferences?.desiredPositions ?? [];
  const salaryMin: number | undefined = rd?.jobPreferences?.salaryExpectation?.min;
  const salaryMax: number | undefined = rd?.jobPreferences?.salaryExpectation?.max;
  const employmentTypes: string[] = rd?.jobPreferences?.employmentType ?? [];
  const workLocation: string | undefined = rd?.jobPreferences?.workLocation;

  const hasPrefs = salaryMin || employmentTypes.length > 0 || workLocation;

  return (
    <div className="space-y-4">
      {openToWork && (
        <div className={cn('rounded-2xl p-4 border flex items-center gap-3', dark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200')}>
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className={cn('font-bold text-sm', dark ? 'text-white' : 'text-gray-900')}>Open to work</p>
            {desiredPositions.length > 0 && <p className="text-xs text-gray-500">{desiredPositions.slice(0, 2).join(' · ')}</p>}
          </div>
        </div>
      )}
      {hasPrefs && (
        <Card dark={dark}>
          <SH icon={Target} title="Job Preferences" dark={dark} />
          <div className="space-y-2 text-sm">
            {salaryMin && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600 shrink-0" />
                <span className={dark ? 'text-gray-300' : 'text-gray-700'}>${salaryMin.toLocaleString()}{salaryMax ? ` – $${salaryMax.toLocaleString()}` : '+'}/yr</span>
              </div>
            )}
            {workLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span className={cn('capitalize', dark ? 'text-gray-300' : 'text-gray-700')}>{workLocation}</span>
              </div>
            )}
            {employmentTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {employmentTypes.map((t, i) => (
                  <span key={i} className={cn('px-2 py-0.5 text-xs rounded-full capitalize font-medium', dark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')}>{t}</span>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

/** FREELANCER sidebar – uses UserProfile (freelancerService) */
const FreelancerSidebar = ({ roleData, dark }: { roleData: FreelancerUserProfile | null; dark: boolean }) => {
  // hourlyRate and availability live inside freelancerProfile sub-object
  const fp = roleData?.freelancerProfile;
  const hourlyRate = fp?.hourlyRate;
  const availability = fp?.availability;
  // portfolio comes from top-level portfolio array in UserProfile
  const portfolio: PortfolioItem[] = roleData?.portfolio ?? [];

  return (
    <div className="space-y-4">
      {hourlyRate && (
        <div className={cn('rounded-2xl p-5 border', dark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200')}>
          <p className={cn('text-xs font-bold uppercase tracking-wide mb-1', dark ? 'text-amber-400' : 'text-amber-600')}>Hourly Rate</p>
          <p className={cn('text-3xl font-black', dark ? 'text-white' : 'text-gray-900')}>
            ${hourlyRate}<span className="text-sm font-normal text-gray-500 ml-1">/hr</span>
          </p>
        </div>
      )}
      {availability && (
        <Card dark={dark}>
          <div className="flex items-center gap-2.5">
            <span className={cn('w-3 h-3 rounded-full shrink-0', availability === 'available' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500')} />
            <span className={cn('text-sm font-semibold capitalize', dark ? 'text-gray-200' : 'text-gray-800')}>
              {availability === 'available' ? 'Available for work' : availability.replace('-', ' ')}
            </span>
          </div>
        </Card>
      )}
      {portfolio.length > 0 && (
        <Card dark={dark}>
          <SH icon={Layers} title="Portfolio" dark={dark} />
          <div className="grid grid-cols-2 gap-2.5">
            {portfolio.slice(0, 4).map((item, i) => {
              const thumb = item.mediaUrls?.[0] ?? '';
              return (
                <div key={i} className={cn('rounded-xl overflow-hidden border group cursor-pointer', dark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50')}>
                  {thumb ? (
                    <img src={thumb} alt={item.title} className="w-full h-20 object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="h-20 flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500">
                      <Layers className="w-7 h-7 text-white/60" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className={cn('text-xs font-semibold truncate', dark ? 'text-white' : 'text-gray-900')}>{item.title}</p>
                    {item.technologies?.length && (
                      <p className="text-xs text-gray-500 truncate">{item.technologies.slice(0, 2).join(' · ')}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {portfolio.length > 4 && <p className="text-xs text-center text-gray-500 mt-2">+{portfolio.length - 4} more projects</p>}
        </Card>
      )}
    </div>
  );
};

/** COMPANY sidebar – uses CompanyProfile (companyService) */
const CompanySidebar = ({ roleData, profileWebsite, dark }: { roleData: CompanyProfile | null; profileWebsite?: string; dark: boolean }) => {
  const industry = roleData?.industry;
  const website = roleData?.website ?? profileWebsite;
  const phone = roleData?.phone;
  const verified = roleData?.verified;
  const description = roleData?.description;

  return (
    <div className="space-y-4">
      <Card dark={dark}>
        <SH icon={Building2} title="Company Info" dark={dark} />
        <div className="space-y-2.5 text-sm">
          {description && (
            <p className={cn('text-xs sm:text-sm line-clamp-3', dark ? 'text-gray-400' : 'text-gray-600')}>{description}</p>
          )}
          {industry && (
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-600 shrink-0" />
              <span className={dark ? 'text-gray-300' : 'text-gray-700'}>{industry}</span>
            </div>
          )}
          {website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600 shrink-0" />
              <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate">{website.replace(/^https?:\/\//, '')}</a>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-600 shrink-0" />
              <span className={dark ? 'text-gray-300' : 'text-gray-700'}>{phone}</span>
            </div>
          )}
          {verified && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded-xl bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 dark:text-green-400 font-semibold">Verified Company</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

/** ORGANIZATION sidebar – uses OrganizationProfile (organizationService) */
const OrgSidebar = ({ roleData, profileWebsite, dark }: { roleData: OrganizationProfile | null; profileWebsite?: string; dark: boolean }) => {
  const mission = roleData?.mission;
  const orgType = roleData?.organizationType;
  const website = roleData?.website ?? profileWebsite;
  const phone = roleData?.phone;
  const secondaryPhone = roleData?.secondaryPhone;
  const verified = roleData?.verified;
  const description = roleData?.description;

  return (
    <div className="space-y-4">
      {mission && (
        <Card dark={dark}>
          <SH icon={Target} title="Our Mission" dark={dark} />
          <p className={cn('text-sm leading-relaxed italic', dark ? 'text-gray-300' : 'text-gray-700')}>`{mission}`</p>
        </Card>
      )}
      <Card dark={dark}>
        <SH icon={Handshake} title="Organization Info" dark={dark} />
        <div className="space-y-2.5 text-sm">
          {description && <p className={cn('text-xs line-clamp-3 mb-2', dark ? 'text-gray-400' : 'text-gray-600')}>{description}</p>}
          {orgType && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className={cn('capitalize', dark ? 'text-gray-300' : 'text-gray-700')}>{orgType}</span>
            </div>
          )}
          {website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600 shrink-0" />
              <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate">{website.replace(/^https?:\/\//, '')}</a>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-600 shrink-0" />
              <span className={dark ? 'text-gray-300' : 'text-gray-700'}>{phone}</span>
            </div>
          )}
          {secondaryPhone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-500 shrink-0" />
              <span className={dark ? 'text-gray-400' : 'text-gray-500'}>{secondaryPhone}</span>
            </div>
          )}
          {verified && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded-xl bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 dark:text-green-400 font-semibold">Verified Organization</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW GRID
// ─────────────────────────────────────────────────────────────────────────────

const Overview = ({
  profile, candidateData, freelancerData, companyData, orgData, dark,
}: {
  profile: DetailedProfile;
  candidateData: CandidateProfile | null;
  freelancerData: FreelancerUserProfile | null;
  companyData: CompanyProfile | null;
  orgData: OrganizationProfile | null;
  dark: boolean;
}) => {
  const role = profile.user?.role;

  // Skills: DetailedProfile has top-level skills[] OR roleSpecific.skills[]
  const skills: string[] =
    (profile as any).skills?.length > 0
      ? (profile as any).skills
      : profile.roleSpecific?.skills ?? [];

  // Experience & Education: from roleSpecific (typed as any in PublicProfile)
  // OR from candidate/freelancer roleData (which has proper typed arrays)
  const experience: Experience[] =
    (candidateData?.experience ?? freelancerData?.experience ?? profile.roleSpecific?.experience ?? []) as Experience[];

  const education: Education[] =
    (candidateData?.education ?? freelancerData?.education ?? profile.roleSpecific?.education ?? []) as Education[];

  // Certifications: DetailedProfile has top-level certifications[]
  const certifications: Certification[] =
    (profile as any).certifications?.length > 0
      ? (profile as any).certifications
      : (candidateData?.certifications ?? (freelancerData as any)?.certifications ?? []);

  const langs: Language[] = profile.languages ?? [];
  const interests: string[] = profile.interests ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
      {/* Main column */}
      <div className="lg:col-span-2 space-y-5">
        {profile.bio && <BioSection bio={profile.bio} dark={dark} />}
        {skills.length > 0 && <SkillChips skills={skills} dark={dark} />}
        {(role === 'candidate' || role === 'freelancer') && experience.length > 0 && <ExperienceSection experiences={experience} dark={dark} />}
        {(role === 'candidate' || role === 'freelancer') && education.length > 0 && <EducationSection educations={education} dark={dark} />}
        {certifications.length > 0 && <CertsSection certs={certifications} dark={dark} />}
        {langs.length > 0 && (
          <Card dark={dark}>
            <SH icon={Globe} title="Languages" dark={dark} />
            <div className="space-y-2">
              {langs.map((l, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className={cn('text-sm', dark ? 'text-gray-300' : 'text-gray-700')}>{l.language}</span>
                  <span className={cn('px-2.5 py-0.5 text-xs rounded-full font-semibold capitalize', dark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')}>{l.proficiency}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        <SocialLinksSection links={profile.socialLinks ?? {}} dark={dark} />
        {role === 'candidate' && <CandidateSidebar roleData={candidateData} dark={dark} />}
        {role === 'freelancer' && <FreelancerSidebar roleData={freelancerData} dark={dark} />}
        {role === 'company' && <CompanySidebar roleData={companyData} profileWebsite={profile.website} dark={dark} />}
        {role === 'organization' && <OrgSidebar roleData={orgData} profileWebsite={profile.website} dark={dark} />}
        {interests.length > 0 && (
          <Card dark={dark}>
            <SH icon={Lightbulb} title="Interests" dark={dark} />
            <div className="flex flex-wrap gap-2">
              {interests.map((t, i) => (
                <span key={i} className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold', dark ? 'bg-rose-900/30 text-rose-300' : 'bg-rose-50 text-rose-600')}>{t}</span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE CONTENT (orchestration + data loading)
// ─────────────────────────────────────────────────────────────────────────────

const ProfileContent: React.FC<{ userId: string; dark: boolean }> = ({ userId, dark }) => {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<DetailedProfile | null>(null);
  // Typed role data states
  const [candidateData, setCandidateData] = useState<CandidateProfile | null>(null);
  const [freelancerData, setFreelancerData] = useState<FreelancerUserProfile | null>(null);
  const [companyData, setCompanyData] = useState<CompanyProfile | null>(null);
  const [orgData, setOrgData] = useState<OrganizationProfile | null>(null);
  // Company/Org logo for avatar
  const [companyLogo, setCompanyLogo] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [previousTab, setPreviousTab] = useState('');

  const isOwn = useMemo(() => currentUser?._id === userId, [currentUser, userId]);
  const rc = useMemo(() => ROLE_CFG[profile?.user?.role ?? 'candidate'] ?? ROLE_CFG.candidate, [profile?.user?.role]);

  useEffect(() => { if (activeTab !== previousTab) setPreviousTab(activeTab); }, [activeTab]);

  // Load profile
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    profileService.getPublicProfile(userId)
      .then((p) => {
        const dp = p as DetailedProfile;
        setProfile(dp);
        loadRoleData(dp);
      })
      .catch((err) => {
        console.error('Profile load error:', err);
        setError(err?.message || 'Profile not found');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const loadRoleData = useCallback(async (p: DetailedProfile) => {
    const uid = p.user?._id;
    if (!uid) return;

    try {
      switch (p.user?.role) {
        case 'company': {
          const cd = await companyService.getPublicCompany(uid);
          setCompanyData(cd);
          if (cd?.logoFullUrl || cd?.logoUrl) setCompanyLogo(cd.logoFullUrl ?? cd.logoUrl ?? '');
          break;
        }
        case 'organization': {
          const od = await organizationService.getPublicOrganization(uid);
          setOrgData(od);
          if (od?.logoFullUrl || od?.logoUrl) setCompanyLogo(od.logoFullUrl ?? od.logoUrl ?? '');
          break;
        }
        case 'candidate': {
          const cand = await candidateService.getPublicCandidateProfile(uid);
          setCandidateData(cand);
          break;
        }
        case 'freelancer': {
          try {
            const fp = await freelancerService.getPublicProfile(uid);
            // Merge portfolio items from getPublicPortfolio as well
            try {
              const port = await freelancerService.getPublicPortfolio(uid, { limit: 12 });
              setFreelancerData({ ...fp, portfolio: port.items ?? fp.portfolio });
            } catch {
              setFreelancerData(fp);
            }
          } catch (e) {
            console.warn('Freelancer public profile failed:', e);
          }
          break;
        }
      }
    } catch (e) {
      console.warn('Role data load failed (non-critical):', e);
    }
  }, []);

  // Follow status
  useEffect(() => {
    if (!profile || !currentUser || isOwn) return;
    followService
      .getFollowStatus(profile.user._id, toFollowTarget(profile.user.role))
      .then(s => setIsFollowing(s.following))
      .catch(() => {});
  }, [profile, currentUser, isOwn]);

  const handleFollow = async () => {
    if (!profile) return;
    if (!currentUser) { router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`); return; }
    const prev = isFollowing;
    setIsFollowing(!isFollowing);
    setProfile(p => p ? {
      ...p,
      socialStats: {
        ...p.socialStats,
        followerCount: !isFollowing
          ? (p.socialStats?.followerCount ?? 0) + 1
          : Math.max(0, (p.socialStats?.followerCount ?? 0) - 1),
      },
    } : null);
    try {
      setFollowPending(true);
      const r = await followService.toggleFollow(profile.user._id, { targetType: toFollowTarget(profile.user.role) });
      setIsFollowing(r.following);
      toast.success(r.following ? '✓ Following!' : 'Unfollowed');
    } catch (e: any) {
      setIsFollowing(prev);
      setProfile(p => p ? {
        ...p,
        socialStats: {
          ...p.socialStats,
          followerCount: prev
            ? (p.socialStats?.followerCount ?? 0) + 1
            : Math.max(0, (p.socialStats?.followerCount ?? 0) - 1),
        },
      } : null);
      toast.error(e?.message || 'Action failed');
    } finally {
      setFollowPending(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: profile?.user?.name, url }); return; } catch { /* fallthrough */ } }
    await navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const handleMessage = () => {
    if (!currentUser) { router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`); return; }
    router.push(`/dashboard/messages?user=${profile?.user?._id}`);
  };

  const handleEdit = () => router.push(`/social/${profile?.user?.role}/profile/edit`);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <Skeleton dark={dark} />;

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mb-5 shadow-xl">
          <AlertCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className={cn('text-2xl font-black mb-2', dark ? 'text-white' : 'text-gray-900')}>Profile not found</h2>
        <p className={cn('text-sm mb-8 max-w-sm', dark ? 'text-gray-400' : 'text-gray-500')}>
          {error ?? 'This profile does not exist or is not publicly accessible.'}
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" />Go back</Button>
          <Button variant="premium" size="sm" onClick={() => router.push('/')}>Home</Button>
        </div>
      </div>
    );
  }

  const componentProps = {
    profileData: profile,
    socialStats: profile.socialStats,
    userId: profile.user?._id,
    isOwnProfile: isOwn,
    currentUserId: currentUser?._id,
    companyId: profile.user?._id,
    companyName: profile.user?.name,
    candidateData: candidateData as any,
    freelancerData: freelancerData as any,
    companyData: companyData as any,
    portfolioItems: freelancerData?.portfolio ?? [],
    freelancerName: profile.user?.name,
    themeMode: (dark ? 'dark' : 'light') as ThemeMode,
  };

  return (
    <div className="space-y-5 pb-24">
      {/* ── HEADER ───────────────────────────────────────────── */}
      <ProfileHeader
        profile={profile}
        companyLogo={companyLogo}
        isOwn={isOwn}
        isFollowing={isFollowing}
        followPending={followPending}
        rc={rc}
        onFollow={handleFollow}
        onShare={handleShare}
        onMessage={handleMessage}
        onEdit={handleEdit}
        dark={dark}
      />

      {/* ── TABS ─────────────────────────────────────────────── */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={profile.user?.role}
        profileType={profile.user?.role as any}
        variant="underline"
        showIcons
        isOwnProfile={isOwn}
        isPremium={profile.premium?.isPremium ?? false}
        stats={{
          posts: profile.socialStats?.postCount ?? 0,
          followers: profile.socialStats?.followerCount ?? 0,
          following: profile.socialStats?.followingCount ?? 0,
          connections: profile.socialStats?.connectionCount ?? 0,
          profileViews: profile.socialStats?.profileViews ?? 0,
          products: 0,
          portfolio: freelancerData?.portfolio?.length ?? 0,
          applications: 0,
        }}
        componentProps={componentProps}
        themeMode={dark ? 'dark' : 'light'}
      />

      {/* ── TAB CONTENT ──────────────────────────────────────── */}
      <TabTransitionWrapper activeTab={activeTab} previousTab={previousTab} themeMode={dark ? 'dark' : 'light'}>
        {activeTab === 'overview' ? (
          <Overview
            profile={profile}
            candidateData={candidateData}
            freelancerData={freelancerData}
            companyData={companyData}
            orgData={orgData}
            dark={dark}
          />
        ) : (
          <ProfileTabContent
            activeTab={activeTab}
            userRole={profile.user?.role}
            profileType={profile.user?.role as any}
            isOwnProfile={isOwn}
            isPremium={profile.premium?.isPremium ?? false}
            profileData={profile}
            socialStats={profile.socialStats}
            componentProps={componentProps}
            themeMode={dark ? 'dark' : 'light'}
          />
        )}
      </TabTransitionWrapper>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SHELL
// ─────────────────────────────────────────────────────────────────────────────

const PublicProfilePage: React.FC = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [dark, setDark] = useState(false);

  const { id } = router.query;
  const userId = Array.isArray(id) ? id[0] : (id ?? '');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const h = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const inner = <ProfileContent userId={userId} dark={dark} />;

  if (currentUser) {
    return (
      <SocialDashboardLayout>
        <RoleThemeProvider overrideRole={currentUser.role as any}>
          <div className={cn('min-h-screen', dark ? 'bg-gray-950' : 'bg-gray-50')}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{inner}</div>
          </div>
        </RoleThemeProvider>
      </SocialDashboardLayout>
    );
  }

  return (
    <RoleThemeProvider overrideRole="candidate">
      <div className={cn('min-h-screen', dark ? 'bg-gray-950' : 'bg-gray-50')}>
        <nav className={cn('sticky top-0 z-40 border-b backdrop-blur-xl', dark ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200')}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <button onClick={() => setDark(d => !d)}
                className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors', dark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')}>
                {dark ? '☀️' : '🌙'}
              </button>
              <Button variant="outline" size="sm" onClick={() => router.push('/login')} className="text-xs">Sign in</Button>
              <Button size="sm" onClick={() => router.push('/register')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs border-0">Join free</Button>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{inner}</main>
        <footer className={cn('border-t py-5 text-center text-xs text-gray-500', dark ? 'border-gray-800' : 'border-gray-100')}>
          © {new Date().getFullYear()} Banana Social &nbsp;·&nbsp;
          <Link href="/privacy" className="hover:underline">Privacy</Link>&nbsp;·&nbsp;
          <Link href="/terms" className="hover:underline">Terms</Link>
        </footer>
      </div>
    </RoleThemeProvider>
  );
};

export default PublicProfilePage;