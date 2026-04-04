/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/social/profile/[id].tsx — COMPLETE FIXED PUBLIC PROFILE PAGE
// Fixes: 404 company/org public endpoints, "Invalid target type" follow error,
//        role-specific rich sections for all 4 user types

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'sonner';

// Services
import { profileService, DetailedProfile, SocialLinks } from '@/services/profileService';
import { followService } from '@/services/followService';
import { companyService } from '@/services/companyService';
import { organizationService } from '@/services/organizationService';
import { candidateService } from '@/services/candidateService';
import { freelancerService } from '@/services/freelancerService';
import { useAuth } from '@/contexts/AuthContext';

// Layout / Theme
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';

// Profile sub-components (existing)
import { ProfileTabs, ProfileTabContent, TabTransitionWrapper } from '@/components/profile/ProfileTabs';
import { PublicProfileActions, QuickActions, MobileFloatingActions } from '@/components/profile/PublicProfileActions';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/social/ui/Badge';

// Colors
import { colors, colorClasses, getTheme, type ThemeMode } from '@/utils/color';
import { cn } from '@/lib/utils';

// Icons
import {
  Briefcase, Sparkles, Building2, Users, Shield, Camera, CheckCircle,
  MapPin, LinkIcon, ExternalLink, Calendar, Share2, Loader2, UserCheck,
  Users as UsersIcon, MessageCircle, Edit3, FileText, Heart, Eye,
  Linkedin, Twitter, Github, Facebook, Instagram, Youtube, AlertCircle,
  ArrowLeft,  Crown,
  DollarSign, Award, Code, Globe, Phone, Tag,
   Layers, Zap, Target, Package, Handshake,
  GraduationCap, Trophy, Lightbulb, ChevronDown, ChevronUp,
   ExternalLink as ExtLink, Info
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

interface RoleConfig {
  icon: React.ElementType;
  label: string;
  gradient: string;
  accentColor: string;
  lightBg: string;
  darkBg: string;
  lightText: string;
  darkText: string;
  borderColor: string;
  shadowColor: string;
  badgeBg: string;
}

const ROLE_CONFIG: Record<string, RoleConfig> = {
  candidate: {
    icon: Briefcase,
    label: 'Job Seeker',
    gradient: 'from-[#2563EB] to-[#4DA6FF]',
    accentColor: colors.blue600,
    lightBg: 'bg-blue-50',
    darkBg: 'dark:bg-blue-900/20',
    lightText: 'text-blue-700',
    darkText: 'dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
    shadowColor: 'shadow-blue-500/20',
    badgeBg: colorClasses.bg.blueLight,
  },
  freelancer: {
    icon: Sparkles,
    label: 'Freelancer',
    gradient: 'from-[#F59E0B] to-[#FF8C42]',
    accentColor: colors.amber,
    lightBg: 'bg-amber-50',
    darkBg: 'dark:bg-amber-900/20',
    lightText: 'text-amber-700',
    darkText: 'dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800',
    shadowColor: 'shadow-amber-500/20',
    badgeBg: colorClasses.bg.amberLight,
  },
  company: {
    icon: Building2,
    label: 'Company',
    gradient: 'from-[#2AA198] to-[#10B981]',
    accentColor: colors.teal,
    lightBg: 'bg-teal-50',
    darkBg: 'dark:bg-teal-900/20',
    lightText: 'text-teal-700',
    darkText: 'dark:text-teal-300',
    borderColor: 'border-teal-200 dark:border-teal-800',
    shadowColor: 'shadow-teal-500/20',
    badgeBg: colorClasses.bg.tealLight,
  },
  organization: {
    icon: Users,
    label: 'Organization',
    gradient: 'from-[#6366F1] to-[#8B5CF6]',
    accentColor: colors.indigo,
    lightBg: 'bg-indigo-50',
    darkBg: 'dark:bg-indigo-900/20',
    lightText: 'text-indigo-700',
    darkText: 'dark:text-indigo-300',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    shadowColor: 'shadow-indigo-500/20',
    badgeBg: colorClasses.bg.indigoLight,
  },
  admin: {
    icon: Shield,
    label: 'Administrator',
    gradient: 'from-[#8B5CF6] to-[#F43F5E]',
    accentColor: colors.purple,
    lightBg: 'bg-purple-50',
    darkBg: 'dark:bg-purple-900/20',
    lightText: 'text-purple-700',
    darkText: 'dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800',
    shadowColor: 'shadow-purple-500/20',
    badgeBg: colorClasses.bg.purpleLight,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a user role string → valid Follow API targetType.
 * The follow endpoint accepts ONLY 'User' | 'Company' | 'Organization'.
 */
function toFollowTargetType(role: string): 'User' | 'Company' | 'Organization' {
  if (role === 'company') return 'Company';
  if (role === 'organization') return 'Organization';
  return 'User'; // candidate, freelancer, admin all map to 'User'
}

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const formatDate = (d: string, opts?: Intl.DateTimeFormatOptions): string => {
  try {
    return new Date(d).toLocaleDateString('en-US', opts || { year: 'numeric', month: 'long' });
  } catch { return d; }
};

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

const ProfileSkeleton = ({ themeMode = 'light' }: { themeMode?: ThemeMode }) => (
  <div className="space-y-6 animate-pulse">
    <div className={cn('rounded-3xl overflow-hidden border shadow-2xl', themeMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
      <div className="h-52 bg-gray-200 dark:bg-gray-800" />
      <div className="px-6 pb-6 -mt-14">
        <div className="w-28 h-28 rounded-full bg-gray-300 dark:bg-gray-700 border-4 border-white dark:border-gray-900" />
        <div className="mt-4 space-y-3">
          <div className="h-7 bg-gray-200 dark:bg-gray-800 rounded w-52" />
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-36" />
          <div className="flex gap-3 mt-4">
            {[1,2,3,4].map(i => <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />)}
          </div>
        </div>
      </div>
    </div>
    <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className={cn('rounded-2xl p-6 border', themeMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4" />
            <div className="space-y-2">
              {[1,2,3].map(j => <div key={j} className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />)}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[1,2].map(i => (
          <div key={i} className={cn('rounded-2xl p-6 border', themeMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
            <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// CARD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

const Card = ({
  children, className = '', themeMode, accent,
}: { children: React.ReactNode; className?: string; themeMode: ThemeMode; accent?: boolean }) => (
  <div className={cn(
    'rounded-2xl p-5 sm:p-6 border transition-all duration-200',
    themeMode === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md',
    accent && 'ring-1 ring-[#FFD700]/30',
    className,
  )}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, themeMode }: { icon: React.ElementType; title: string; themeMode: ThemeMode }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className={cn('p-1.5 rounded-lg', colorClasses.bg.blueLight)}>
      <Icon className={cn('w-4 h-4', colorClasses.text.blue600)} />
    </div>
    <h3 className={cn('text-base sm:text-lg font-semibold', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>
      {title}
    </h3>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE HEADER
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  profile: DetailedProfile;
  roleData: any;
  isOwnProfile: boolean;
  isFollowing: boolean;
  followLoading: boolean;
  roleConfig: RoleConfig;
  onFollowToggle: () => void;
  onShare: () => void;
  onMessage: () => void;
  onEdit: () => void;
  themeMode: ThemeMode;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile, roleData, isOwnProfile, isFollowing, followLoading,
  roleConfig, onFollowToggle, onShare, onMessage, onEdit, themeMode,
}) => {
  const router = useRouter();
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const coverUrl = profile.coverPhoto || profile.user?.coverPhoto || null;
  const avatarUrl = profile.user?.avatar || profile.avatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user.name)}&background=6366f1&color=fff&size=200&bold=true`;

  const isVerified = profile.verificationStatus === 'verified';
  const isPremium = profile.premium?.isPremium;

  // Extra info by role
  const getSubtitle = () => {
    const r = profile.user.role;
    if (r === 'candidate' && roleData?.experience?.[0]) {
      const e = roleData.experience[0];
      return `${e.position} at ${e.company}`;
    }
    if (r === 'freelancer' && roleData?.hourlyRate) {
      return `$${roleData.hourlyRate}/hr · Freelancer`;
    }
    if (r === 'company') {
      return roleData?.industry || 'Company';
    }
    if (r === 'organization') {
      return roleData?.organizationType || 'Organization';
    }
    return profile.headline;
  };

  return (
    <header className={cn(
      'relative rounded-3xl overflow-hidden border shadow-2xl',
      themeMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
    )}>
      {/* Cover */}
      <div className="relative h-44 sm:h-56 lg:h-64 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700">
        {coverUrl && !coverError ? (
          <>
            <img
              src={coverUrl}
              alt="cover"
              className={cn('w-full h-full object-cover transition-opacity duration-700 hover:scale-105', coverLoaded ? 'opacity-100' : 'opacity-0')}
              onLoad={() => setCoverLoaded(true)}
              onError={() => setCoverError(true)}
            />
            {!coverLoaded && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', roleConfig.gradient)} />
        )}
        {isOwnProfile && (
          <button
            onClick={() => router.push('/settings/cover')}
            className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-white text-xs flex items-center gap-1.5 hover:bg-black/60 transition-all border border-white/20 z-10"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Change Cover</span>
          </button>
        )}
      </div>

      {/* Avatar + info */}
      <div className="px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-14">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 shrink-0">
          <div className="w-full h-full rounded-full border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700">
            {!avatarError ? (
              <img
                src={avatarUrl}
                alt={profile.user.name}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className={cn('w-full h-full flex items-center justify-center bg-gradient-to-br', roleConfig.gradient)}>
                <span className="text-2xl font-bold text-white">{profile.user.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 shadow-lg border-2 border-white dark:border-gray-900">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
          {isPremium && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full p-1 shadow-lg border-2 border-white dark:border-gray-900">
              <Crown className="w-3 h-3 text-white" />
            </div>
          )}
          {isOwnProfile && (
            <button
              onClick={() => router.push('/settings/avatar')}
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Info row */}
      <div className="px-4 sm:px-6 lg:px-8 mt-3 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={cn('text-xl sm:text-2xl lg:text-3xl font-bold', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>
                {profile.user.name}
              </h1>
              {isVerified && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1', roleConfig.lightBg, roleConfig.lightText, roleConfig.darkBg, roleConfig.darkText)}>
                <roleConfig.icon className="w-3 h-3" />
                {roleConfig.label}
              </span>
            </div>

            {getSubtitle() && (
              <p className={cn('text-sm sm:text-base font-medium', themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                {getSubtitle()}
              </p>
            )}

            {profile.headline && profile.headline !== getSubtitle() && (
              <p className={cn('text-sm', themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                {profile.headline}
              </p>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
              {profile.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
              )}
              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />{profile.website.replace(/^https?:\/\//, '').split('/')[0]}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Joined {formatDate(profile.createdAt)}</span>
              {profile.lastActive && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />Active recently
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={onShare} variant="outline" size="sm" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Share2 className="w-4 h-4" /><span className="hidden sm:inline">Share</span>
            </Button>
            {!isOwnProfile ? (
              <>
                <Button
                  onClick={onFollowToggle}
                  size="sm"
                  disabled={followLoading}
                  className={cn(
                    'flex items-center gap-1.5 text-xs sm:text-sm transition-all',
                    isFollowing
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-200'
                      : `bg-gradient-to-r ${roleConfig.gradient} text-white hover:shadow-lg hover:scale-105 ${roleConfig.shadowColor}`,
                  )}
                >
                  {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFollowing ? <><UserCheck className="w-4 h-4" /><span className="hidden sm:inline">Following</span></> : <><UsersIcon className="w-4 h-4" /><span className="hidden sm:inline">Follow</span></>}
                </Button>
                <Button onClick={onMessage} variant="premium" size="sm" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <MessageCircle className="w-4 h-4" /><span className="hidden sm:inline">Message</span>
                </Button>
              </>
            ) : (
              <Button onClick={onEdit} variant="premium" size="sm" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Edit3 className="w-4 h-4" /><span className="hidden sm:inline">Edit Profile</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-gray-800">
          {[
            { label: 'Posts', value: profile.socialStats?.postCount || 0, icon: FileText, grad: 'from-blue-500 to-cyan-500' },
            { label: 'Followers', value: profile.socialStats?.followerCount || 0, icon: Heart, grad: 'from-rose-500 to-pink-500' },
            { label: 'Following', value: profile.socialStats?.followingCount || 0, icon: Users, grad: 'from-purple-500 to-violet-500' },
            { label: 'Views', value: profile.socialStats?.profileViews || 0, icon: Eye, grad: 'from-emerald-500 to-green-500' },
          ].map((s, i) => (
            <div key={i} className="text-center group cursor-default">
              <div className={cn('inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br mb-1.5 shadow-sm group-hover:shadow-md transition-all group-hover:scale-105', s.grad)}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <div className={cn('text-lg sm:text-xl font-bold', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>
                {formatNumber(s.value)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC SECTIONS
// ─────────────────────────────────────────────────────────────────────────────

const BioSection = ({ profile, themeMode }: { profile: DetailedProfile; themeMode: ThemeMode }) => {
  const [expanded, setExpanded] = useState(false);
  if (!profile.bio) return null;
  const isLong = profile.bio.length > 280;
  return (
    <Card themeMode={themeMode}>
      <SectionTitle icon={Info} title="About" themeMode={themeMode} />
      <p className={cn('text-sm sm:text-base leading-relaxed whitespace-pre-line', themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
        {isLong && !expanded ? `${profile.bio.slice(0, 280)}…` : profile.bio}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(e => !e)} className="mt-2 text-sm font-medium text-blue-600 flex items-center gap-1 hover:underline">
          {expanded ? <><ChevronUp className="w-4 h-4" />Show less</> : <><ChevronDown className="w-4 h-4" />Read more</>}
        </button>
      )}
    </Card>
  );
};

const SkillsSection = ({ skills, themeMode, roleConfig }: { skills: string[]; themeMode: ThemeMode; roleConfig: RoleConfig }) => {
  const [expanded, setExpanded] = useState(false);
  if (!skills?.length) return null;
  const shown = expanded ? skills : skills.slice(0, 12);
  return (
    <Card themeMode={themeMode}>
      <SectionTitle icon={Code} title="Skills" themeMode={themeMode} />
      <div className="flex flex-wrap gap-2">
        {shown.map((s, i) => (
          <span key={i} className={cn('px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border', themeMode === 'dark' ? 'bg-blue-900/20 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200')}>
            {s}
          </span>
        ))}
        {!expanded && skills.length > 12 && (
          <button onClick={() => setExpanded(true)} className={cn('px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border', themeMode === 'dark' ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200')}>
            +{skills.length - 12} more
          </button>
        )}
      </div>
    </Card>
  );
};

const ExperienceSection = ({ experiences, themeMode }: { experiences: any[]; themeMode: ThemeMode }) => {
  if (!experiences?.length) return null;
  return (
    <Card themeMode={themeMode}>
      <SectionTitle icon={Briefcase} title="Experience" themeMode={themeMode} />
      <div className="space-y-5">
        {experiences.map((e, i) => (
          <div key={i} className="relative pl-5 border-l-2 border-gray-200 dark:border-gray-700">
            <div className="absolute -left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
            <div className="space-y-0.5">
              <h4 className={cn('font-semibold text-sm sm:text-base', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>{e.position}</h4>
              <p className={cn('text-xs sm:text-sm font-medium', colorClasses.text.blue600)}>{e.company}</p>
              {e.location && <p className={cn('text-xs', themeMode === 'dark' ? 'text-gray-500' : 'text-gray-500')}><MapPin className="w-3 h-3 inline mr-1" />{e.location}</p>}
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(e.startDate, { month: 'short', year: 'numeric' })} – {e.current ? 'Present' : e.endDate ? formatDate(e.endDate, { month: 'short', year: 'numeric' }) : ''}
                {e.current && <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Current</span>}
              </p>
              {e.description && <p className={cn('text-xs sm:text-sm mt-1 line-clamp-3', themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600')}>{e.description}</p>}
              {e.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {e.skills.slice(0, 5).map((sk: string, j: number) => (
                    <span key={j} className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{sk}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const EducationSection = ({ educations, themeMode }: { educations: any[]; themeMode: ThemeMode }) => {
  if (!educations?.length) return null;
  return (
    <Card themeMode={themeMode}>
      <SectionTitle icon={GraduationCap} title="Education" themeMode={themeMode} />
      <div className="space-y-5">
        {educations.map((e, i) => (
          <div key={i} className="relative pl-5 border-l-2 border-gray-200 dark:border-gray-700">
            <div className="absolute -left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            <h4 className={cn('font-semibold text-sm sm:text-base', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>{e.degree}</h4>
            <p className={cn('text-xs sm:text-sm', themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700')}>{e.institution}</p>
            {e.field && <p className={cn('text-xs', themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500')}>{e.field}</p>}
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {formatDate(e.startDate, { month: 'short', year: 'numeric' })} – {e.current ? 'Present' : e.endDate ? formatDate(e.endDate, { month: 'short', year: 'numeric' }) : ''}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

const CertificationsSection = ({ certs, themeMode }: { certs: any[]; themeMode: ThemeMode }) => {
  if (!certs?.length) return null;
  return (
    <Card themeMode={themeMode}>
      <SectionTitle icon={Award} title="Certifications" themeMode={themeMode} />
      <div className="space-y-4">
        {certs.map((c, i) => (
          <div key={i} className="flex gap-3">
            <div className={cn('shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', colorClasses.bg.amberLight)}>
              <Trophy className={cn('w-5 h-5', colorClasses.text.amber600)} />
            </div>
            <div>
              <h4 className={cn('font-semibold text-sm', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>{c.name}</h4>
              <p className={cn('text-xs', themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600')}>{c.issuer}</p>
              <p className="text-xs text-gray-500">{formatDate(c.issueDate, { month: 'short', year: 'numeric' })}</p>
              {c.credentialUrl && (
                <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 mt-0.5 hover:underline">
                  <ExtLink className="w-3 h-3" /> Verify credential
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const SocialLinksSection = ({ socialLinks, themeMode }: { socialLinks: SocialLinks | Record<string, string>; themeMode: ThemeMode }) => {
  const platforms: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'bg-[#0A66C2]' },
    twitter: { icon: Twitter, label: 'Twitter', color: 'bg-[#1DA1F2]' },
    github: { icon: Github, label: 'GitHub', color: 'bg-gray-800 dark:bg-gray-700' },
    facebook: { icon: Facebook, label: 'Facebook', color: 'bg-[#1877F2]' },
    instagram: { icon: Instagram, label: 'Instagram', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    youtube: { icon: Youtube, label: 'YouTube', color: 'bg-[#FF0000]' },
  };
  const valid = Object.entries(socialLinks || {}).filter(([k, v]) => v && platforms[k]);
  if (!valid.length) return null;
  return (
    <Card themeMode={themeMode}>
      <SectionTitle icon={Globe} title="Connect" themeMode={themeMode} />
      <div className="flex flex-wrap gap-2">
        {valid.map(([k, url]) => {
          const p = platforms[k];
          return (
            <a key={k} href={(url as string).startsWith('http') ? url as string : `https://${url}`} target="_blank" rel="noopener noreferrer"
              className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all hover:scale-105 hover:shadow-md', p.color)}
            >
              <p.icon className="w-3.5 h-3.5" />{p.label}
            </a>
          );
        })}
      </div>
    </Card>
  );
};

const LanguagesSection = ({ languages, themeMode }: { languages: any[]; themeMode: ThemeMode }) => {
  if (!languages?.length) return null;
  return (
    <Card themeMode={themeMode}>
      <SectionTitle icon={Globe} title="Languages" themeMode={themeMode} />
      <div className="space-y-2">
        {languages.map((l, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className={cn('text-sm', themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700')}>{l.language}</span>
            <span className={cn('px-2 py-0.5 text-xs rounded-full capitalize', colorClasses.bg.blueLight, colorClasses.text.blue600)}>{l.proficiency}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLE-SPECIFIC SECTIONS
// ─────────────────────────────────────────────────────────────────────────────

/** CANDIDATE — CV, portfolio note, target roles, open to work */
const CandidateExtras = ({ profile, roleData, themeMode }: { profile: DetailedProfile; roleData: any; themeMode: ThemeMode }) => {
  const openToWork = roleData?.openToWork ?? profile.roleSpecific?.openToWork;
  const targetRoles = roleData?.jobPreferences?.desiredPositions || profile.roleSpecific?.jobPreferences?.desiredPositions || [];
  const salaryMin = roleData?.jobPreferences?.salaryExpectation?.min || profile.roleSpecific?.jobPreferences?.salaryExpectation?.min;
  const salaryMax = roleData?.jobPreferences?.salaryExpectation?.max || profile.roleSpecific?.jobPreferences?.salaryExpectation?.max;
  const employmentTypes = roleData?.jobPreferences?.employmentType || profile.roleSpecific?.jobPreferences?.employmentType || [];
  const workLocation = roleData?.jobPreferences?.workLocation || profile.roleSpecific?.jobPreferences?.workLocation;

  return (
    <div className="space-y-4">
      {/* Open to work banner */}
      {openToWork && (
        <div className={cn('rounded-2xl p-4 border flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20', themeMode === 'dark' ? 'border-green-800' : 'border-green-200')}>
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className={cn('font-semibold', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>Open to work</p>
            {targetRoles.length > 0 && <p className="text-xs text-gray-600 dark:text-gray-400">{targetRoles.slice(0, 2).join(' · ')}</p>}
          </div>
        </div>
      )}

      {/* Job preferences */}
      {(salaryMin || employmentTypes.length > 0 || workLocation) && (
        <Card themeMode={themeMode}>
          <SectionTitle icon={Target} title="Job Preferences" themeMode={themeMode} />
          <div className="space-y-2 text-sm">
            {salaryMin && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className={themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                  ${salaryMin.toLocaleString()}{salaryMax ? ` – $${salaryMax.toLocaleString()}` : '+'} / yr
                </span>
              </div>
            )}
            {workLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className={cn('capitalize', themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700')}>{workLocation}</span>
              </div>
            )}
            {employmentTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {employmentTypes.map((t: string, i: number) => (
                  <span key={i} className={cn('px-2 py-0.5 text-xs rounded-full capitalize', colorClasses.bg.blueLight, colorClasses.text.blue600)}>{t}</span>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

/** FREELANCER — hourly rate, availability, portfolio highlights */
const FreelancerExtras = ({ profile, roleData, themeMode }: { profile: DetailedProfile; roleData: any; themeMode: ThemeMode }) => {
  const hourlyRate = roleData?.hourlyRate || profile.roleSpecific?.hourlyRate;
  const availability = roleData?.availability || profile.roleSpecific?.availability;
  const portfolio = roleData?.portfolio || [];

  return (
    <div className="space-y-4">
      {/* Rate card */}
      {hourlyRate && (
        <div className={cn('rounded-2xl p-5 border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20', themeMode === 'dark' ? 'border-amber-800' : 'border-amber-200')}>
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <span className={cn('font-semibold', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>Hourly Rate</span>
          </div>
          <p className={cn('text-3xl font-bold', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>
            ${hourlyRate}<span className="text-sm font-normal text-gray-500 ml-1">/hr</span>
          </p>
        </div>
      )}
      {/* Availability */}
      {availability && (
        <Card themeMode={themeMode}>
          <div className="flex items-center gap-3">
            <div className={cn('w-3 h-3 rounded-full', availability === 'available' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500')} />
            <span className={cn('text-sm font-medium capitalize', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>
              {availability === 'available' ? 'Available for work' : availability}
            </span>
          </div>
        </Card>
      )}
      {/* Portfolio grid */}
      {portfolio.length > 0 && (
        <Card themeMode={themeMode}>
          <SectionTitle icon={Layers} title="Portfolio" themeMode={themeMode} />
          <div className="grid grid-cols-2 gap-3">
            {portfolio.slice(0, 4).map((item: any, i: number) => (
              <div key={i} className={cn('rounded-xl overflow-hidden border group cursor-pointer', themeMode === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50')}>
                {item.mediaUrl ? (
                  <img src={item.mediaUrl} alt={item.title} className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className={cn('h-24 flex items-center justify-center bg-gradient-to-br', ROLE_CONFIG.freelancer.gradient)}>
                    <Layers className="w-8 h-8 text-white/60" />
                  </div>
                )}
                <div className="p-2">
                  <p className={cn('text-xs font-semibold truncate', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>{item.title}</p>
                  {item.technologies?.length > 0 && (
                    <p className="text-xs text-gray-500 truncate">{item.technologies.slice(0, 2).join(' · ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {portfolio.length > 4 && (
            <p className="text-xs text-center text-gray-500 mt-2">+{portfolio.length - 4} more projects</p>
          )}
        </Card>
      )}
    </div>
  );
};

/** COMPANY — overview, industry, products */
const CompanyExtras = ({ profile, roleData, themeMode }: { profile: DetailedProfile; roleData: any; themeMode: ThemeMode }) => {
  const products = roleData?.products || profile.roleSpecific?.products || [];
  const industry = roleData?.industry || profile.roleSpecific?.industry;
  const website = roleData?.website || profile.website;
  const phone = roleData?.phone;
  const verified = roleData?.verified;

  return (
    <div className="space-y-4">
      {/* Company info */}
      <Card themeMode={themeMode}>
        <SectionTitle icon={Building2} title="Company Info" themeMode={themeMode} />
        <div className="space-y-2 text-sm">
          {industry && (
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-600" />
              <span className={themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{industry}</span>
            </div>
          )}
          {website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate">
                {website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-600" />
              <span className={themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{phone}</span>
            </div>
          )}
          {verified && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 dark:text-green-400 font-medium">Verified Company</span>
            </div>
          )}
        </div>
      </Card>

      {/* Products */}
      {products.length > 0 && (
        <Card themeMode={themeMode}>
          <SectionTitle icon={Package} title="Products & Services" themeMode={themeMode} />
          <div className="space-y-3">
            {products.slice(0, 4).map((p: any, i: number) => (
              <div key={i} className={cn('flex gap-3 p-3 rounded-xl', themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-50')}>
                {p.imageUrl && (
                  <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={cn('font-medium text-sm truncate', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>{p.name}</p>
                  {p.price && <p className="text-xs text-green-600 font-semibold">${p.price}</p>}
                  {p.description && <p className={cn('text-xs line-clamp-2', themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500')}>{p.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

/** ORGANIZATION — mission, type, contact */
const OrganizationExtras = ({ profile, roleData, themeMode }: { profile: DetailedProfile; roleData: any; themeMode: ThemeMode }) => {
  const mission = roleData?.mission || profile.roleSpecific?.mission;
  const orgType = roleData?.organizationType;
  const phone = roleData?.phone;
  const secondaryPhone = roleData?.secondaryPhone;
  const website = roleData?.website || profile.website;
  const verified = roleData?.verified;

  return (
    <div className="space-y-4">
      {/* Mission */}
      {mission && (
        <Card themeMode={themeMode}>
          <SectionTitle icon={Target} title="Our Mission" themeMode={themeMode} />
          <p className={cn('text-sm leading-relaxed italic', themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
            "{mission}"
          </p>
        </Card>
      )}

      {/* Org info */}
      <Card themeMode={themeMode}>
        <SectionTitle icon={Handshake} title="Organization Info" themeMode={themeMode} />
        <div className="space-y-2 text-sm">
          {orgType && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              <span className={cn('capitalize', themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700')}>{orgType}</span>
            </div>
          )}
          {website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate">
                {website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-600" />
              <span className={themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{phone}</span>
            </div>
          )}
          {secondaryPhone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-500" />
              <span className={themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500'}>{secondaryPhone}</span>
            </div>
          )}
          {verified && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 dark:text-green-400 font-medium">Verified Organization</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE CONTENT
// ─────────────────────────────────────────────────────────────────────────────

const ProfileContent: React.FC<{ userId: string; themeMode: ThemeMode }> = ({ userId, themeMode }) => {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<DetailedProfile | null>(null);
  const [roleData, setRoleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [previousTab, setPreviousTab] = useState('');

  const isOwnProfile = useMemo(() => currentUser?._id === userId, [currentUser, userId]);
  const roleConfig = useMemo(() => ROLE_CONFIG[profile?.user?.role || 'candidate'] || ROLE_CONFIG.candidate, [profile?.user?.role]);

  useEffect(() => { if (activeTab !== previousTab) setPreviousTab(activeTab); }, [activeTab]);
  useEffect(() => { if (userId) fetchProfile(); }, [userId]);
  useEffect(() => { if (profile && currentUser && !isOwnProfile) checkFollow(); }, [profile, currentUser, isOwnProfile]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const p = await profileService.getPublicProfile(userId) as DetailedProfile;
      setProfile(p);

      // Fetch role-specific data with graceful fallback (never crash on 404)
      try {
        let rd: any = null;
        const uid = p.user._id;
        switch (p.user.role) {
          case 'company':
            rd = await companyService.getPublicCompany(uid); // returns null on 404
            if (!rd) rd = { name: p.user.name, description: p.bio, products: [] };
            break;
          case 'organization':
            rd = await organizationService.getPublicOrganization(uid); // returns null on 404
            if (!rd) rd = { name: p.user.name, description: p.bio };
            break;
          case 'candidate':
            try { rd = await candidateService.getPublicCandidateProfile(uid); } catch { rd = null; }
            if (!rd) rd = { skills: p.roleSpecific?.skills || [], experience: p.roleSpecific?.experience || [], education: p.roleSpecific?.education || [] };
            break;
          case 'freelancer':
            try {
              rd = await freelancerService.getPublicProfile(uid);
              try {
                const port = await freelancerService.getPublicPortfolio(uid, { limit: 10 });
                rd = { ...rd, portfolio: port.items || [] };
              } catch { rd = { ...rd, portfolio: [] }; }
            } catch {
              rd = { skills: p.roleSpecific?.skills || [], portfolio: [] };
            }
            break;
        }
        setRoleData(rd);
      } catch (e) {
        console.warn('Role data fetch failed gracefully:', e);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load profile');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFollow = async () => {
    if (!profile?.user?._id) return;
    try {
      const status = await followService.getFollowStatus(profile.user._id, toFollowTargetType(profile.user.role));
      setIsFollowing(status.following);
    } catch (e) { /* silent */ }
  };

  const handleFollowToggle = async () => {
    if (!profile?.user?._id) return;
    if (!currentUser) { router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`); return; }
    if (isOwnProfile) return;

    const prev = isFollowing;
    // optimistic
    setIsFollowing(!isFollowing);
    setProfile(p => p ? { ...p, socialStats: { ...p.socialStats, followerCount: !isFollowing ? p.socialStats.followerCount + 1 : Math.max(0, p.socialStats.followerCount - 1) } } : null);

    try {
      setFollowLoading(true);
      const result = await followService.toggleFollow(profile.user._id, {
        targetType: toFollowTargetType(profile.user.role),
      });
      setIsFollowing(result.following);
      toast.success(result.following ? 'Following!' : 'Unfollowed');
    } catch (e: any) {
      setIsFollowing(prev);
      setProfile(p => p ? { ...p, socialStats: { ...p.socialStats, followerCount: prev ? p.socialStats.followerCount + 1 : Math.max(0, p.socialStats.followerCount - 1) } } : null);
      toast.error(e.message || 'Action failed');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: profile?.user.name, url }); return; } catch { /* fall through */ }
    }
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const handleMessage = () => {
    if (!currentUser) { router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`); return; }
    router.push(`/dashboard/messages?user=${profile?.user._id}`);
  };

  const handleEdit = () => router.push(`/social/${profile?.user.role}/profile/edit`);

  if (loading) return <ProfileSkeleton themeMode={themeMode} />;

  if (error || !profile) return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-white" />
      </div>
      <h3 className={cn('text-2xl font-bold mb-2', themeMode === 'dark' ? 'text-white' : 'text-gray-900')}>Profile Not Found</h3>
      <p className={cn('text-sm mb-6 max-w-md mx-auto', themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600')}>{error || 'This profile does not exist or is private.'}</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={() => router.back()} variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Go Back</Button>
        <Button onClick={() => router.push('/')} variant="premium" size="sm">Home</Button>
      </div>
    </div>
  );

  const role = profile.user.role;
  const skills = roleData?.skills || profile.roleSpecific?.skills || [];
  const experience = roleData?.experience || profile.roleSpecific?.experience || [];
  const education = roleData?.education || profile.roleSpecific?.education || [];
  const certifications = roleData?.certifications || profile.roleSpecific?.certifications || [];

  const componentProps = {
    profileData: profile, socialStats: profile.socialStats,
    userId: profile.user._id, isOwnProfile, currentUserId: currentUser?._id,
    companyId: profile.user._id, companyName: profile.user.name,
    candidateData: roleData, freelancerData: roleData, companyData: roleData,
    portfolioItems: roleData?.portfolio || [], freelancerName: profile.user.name, themeMode,
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <ProfileHeader
        profile={profile} roleData={roleData} isOwnProfile={isOwnProfile}
        isFollowing={isFollowing} followLoading={followLoading} roleConfig={roleConfig}
        onFollowToggle={handleFollowToggle} onShare={handleShare}
        onMessage={handleMessage} onEdit={handleEdit} themeMode={themeMode}
      />

      {/* Non-owner action strip */}
      {!isOwnProfile && (
        <PublicProfileActions
          targetId={profile.user._id}
          targetType={toFollowTargetType(role) as any}
          targetName={profile.user.name}
          targetData={profile}
          initialIsFollowing={isFollowing}
          onAction={(action) => { if (action === 'follow' || action === 'unfollow') handleFollowToggle(); }}
          themeMode={themeMode}
          variant="compact"
        />
      )}

      {/* Tabs */}
      <ProfileTabs
        activeTab={activeTab} onTabChange={setActiveTab}
        userRole={role} profileType={role as any}
        variant="underline" showIcons isOwnProfile={isOwnProfile}
        isPremium={profile.premium?.isPremium || false}
        stats={{ posts: profile.socialStats?.postCount || 0, followers: profile.socialStats?.followerCount || 0, following: profile.socialStats?.followingCount || 0, connections: profile.socialStats?.connectionCount || 0, profileViews: profile.socialStats?.profileViews || 0, products: roleData?.products?.length || 0, portfolio: roleData?.portfolio?.length || 0, applications: 0 }}
        componentProps={componentProps} themeMode={themeMode}
      />

      {/* Tab content */}
      <TabTransitionWrapper activeTab={activeTab} previousTab={previousTab} themeMode={themeMode}>
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left */}
            <div className="lg:col-span-2 space-y-5">
              <BioSection profile={profile} themeMode={themeMode} />
              {skills.length > 0 && <SkillsSection skills={skills} themeMode={themeMode} roleConfig={roleConfig} />}
              {(role === 'candidate' || role === 'freelancer') && experience.length > 0 && <ExperienceSection experiences={experience} themeMode={themeMode} />}
              {(role === 'candidate' || role === 'freelancer') && education.length > 0 && <EducationSection educations={education} themeMode={themeMode} />}
              {certifications.length > 0 && <CertificationsSection certs={certifications} themeMode={themeMode} />}
              {profile.languages?.length > 0 && <LanguagesSection languages={profile.languages} themeMode={themeMode} />}
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">
              <SocialLinksSection socialLinks={profile.socialLinks || {}} themeMode={themeMode} />

              {/* Role-specific sidebar extras */}
              {role === 'candidate' && <CandidateExtras profile={profile} roleData={roleData} themeMode={themeMode} />}
              {role === 'freelancer' && <FreelancerExtras profile={profile} roleData={roleData} themeMode={themeMode} />}
              {role === 'company' && <CompanyExtras profile={profile} roleData={roleData} themeMode={themeMode} />}
              {role === 'organization' && <OrganizationExtras profile={profile} roleData={roleData} themeMode={themeMode} />}

              {/* Interests */}
              {profile.interests?.length > 0 && (
                <Card themeMode={themeMode}>
                  <SectionTitle icon={Lightbulb} title="Interests" themeMode={themeMode} />
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((t, i) => (
                      <span key={i} className={cn('px-3 py-1 rounded-full text-xs font-medium', colorClasses.bg.roseLight, colorClasses.text.rose)}>{t}</span>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <ProfileTabContent
            activeTab={activeTab} userRole={role} profileType={role as any}
            isOwnProfile={isOwnProfile} isPremium={profile.premium?.isPremium || false}
            profileData={profile} socialStats={profile.socialStats}
            componentProps={componentProps} themeMode={themeMode}
          />
        )}
      </TabTransitionWrapper>

      {/* Mobile quick actions */}
      {!isOwnProfile && (
        <>
          <QuickActions
            targetId={profile.user._id} targetType={toFollowTargetType(role) as any}
            onAction={(a) => { if (a === 'follow' || a === 'unfollow') handleFollowToggle(); else if (a === 'message') handleMessage(); else if (a === 'share') handleShare(); }}
            className="lg:hidden fixed bottom-4 left-4 z-50" themeMode={themeMode}
          />
          <MobileFloatingActions
            targetId={profile.user._id} targetType={toFollowTargetType(role) as any}
            onAction={(a) => { if (a === 'follow' || a === 'unfollow') handleFollowToggle(); else if (a === 'message') handleMessage(); else if (a === 'share') handleShare(); }}
            themeMode={themeMode}
          />
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const PublicProfilePage: React.FC = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const { id } = router.query;
  const profileUserId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setThemeMode(mq.matches ? 'dark' : 'light');
    const h = (e: MediaQueryListEvent) => setThemeMode(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const content = <ProfileContent userId={profileUserId || ''} themeMode={themeMode} />;

  if (currentUser) {
    return (
      <SocialDashboardLayout>
        <RoleThemeProvider overrideRole={currentUser.role as any}>
          <div className={cn('min-h-screen', themeMode === 'dark' ? 'bg-gray-950' : 'bg-gray-50')}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{content}</div>
          </div>
        </RoleThemeProvider>
      </SocialDashboardLayout>
    );
  }

  return (
    <RoleThemeProvider overrideRole="candidate">
      <div className={cn('min-h-screen', themeMode === 'dark' ? 'bg-gray-950' : 'bg-gray-50')}>
        {/* Public nav */}
        <nav className={cn('sticky top-0 z-40 backdrop-blur-xl border-b', themeMode === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200')}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
            <Button variant="ghost" onClick={() => router.push('/')} className="flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Home</span>
            </Button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setThemeMode(m => m === 'light' ? 'dark' : 'light')}
                className={cn('p-2 rounded-lg transition-colors', themeMode === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-700')}
              >
                {themeMode === 'dark' ? '☀️' : '🌙'}
              </button>
              <Button variant="outline" size="sm" onClick={() => router.push('/login')} className="text-xs sm:text-sm px-3">Sign In</Button>
              <Button size="sm" onClick={() => router.push('/register')} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm px-3">Join Free</Button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{content}</main>

        <footer className={cn('border-t py-5', themeMode === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white/50')}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Banana Social &nbsp;·&nbsp;
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">Privacy</Link>&nbsp;·&nbsp;
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">Terms</Link>
          </div>
        </footer>
      </div>
    </RoleThemeProvider>
  );
};

export default PublicProfilePage;