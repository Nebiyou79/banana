// pages/dashboard/freelancer/organizations/[id].tsx
// Organization detail page — seen by a freelancer browsing potential clients.
// Distinct navy/teal UI, tabs: Overview | Active Tenders | Work History | Reviews
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  ArrowLeft, AlertCircle, RefreshCw, Building2, MapPin, Star, BadgeCheck,
  Globe, ExternalLink, Bookmark, BookmarkCheck, Briefcase, Users, Clock,
   Calendar, Tag,  Send,Link2,
  Trophy, ScrollText, TrendingUp, Banknote, ChevronDown, ChevronUp,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
// Replace with real types from @/services/orgMarketplaceService when ready.

interface OrgReview {
  _id: string;
  freelancerId: { _id: string; name: string; avatar?: string };
  rating: number;
  comment?: string;
  subRatings?: { communication?: number; payment?: number; clarity?: number; fairness?: number };
  createdAt: string;
}

interface ActiveTender {
  _id: string;
  title: string;
  description?: string;
  deadline: string;
  budget?: { min: number; max: number; currency: string };
  skillsRequired?: string[];
  applicationCount?: number;
  engagementType?: string;
  status: string;
  createdAt: string;
}

interface OrgPublicProfile {
  _id: string;
  name: string;
  logo?: string;
  coverImage?: string;
  tagline?: string;
  description?: string;
  industry?: string;
  size?: 'startup' | 'sme' | 'enterprise';
  location?: string;
  website?: string;
  email?: string;
  phone?: string;
  verified: boolean;
  featured: boolean;
  memberSince?: string;
  totalSpend: number;
  activeTendersCount: number;
  totalTendersPosted: number;
  avgBudget?: number;
  avgRating: number;
  reviewCount: number;
  ratingBreakdown: { communication: number; payment: number; clarity: number; fairness: number };
  tags: string[];
  socialLinks?: Record<string, string>;
  isSaved: boolean;
  recentReviews: OrgReview[];
  activeTenders: ActiveTender[];
  teamSize?: number;
  foundedYear?: number;
  profileCompletion?: number;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const orgTheme = {
  accent:     'text-blue-600 dark:text-blue-400',
  accentBg:   'bg-blue-50 dark:bg-blue-900/20',
  accentBorder:'border-blue-200 dark:border-blue-800',
  accentBtn:  'bg-blue-600 hover:bg-blue-700 text-white',
  tabActive:  'border-blue-500 text-blue-600 dark:text-blue-400',
  tabIdle:    cn('border-transparent', colorClasses.text.muted, 'hover:text-blue-500'),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SectionHeading: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className={cn('p-1.5 rounded-lg', colorClasses.bg.secondary)}>{icon}</div>
    <h3 className={cn('text-sm font-semibold', colorClasses.text.primary)}>{title}</h3>
  </div>
);

const EmptyState: React.FC<{ icon?: React.ReactNode; message: string; sub?: string }> = ({ icon, message, sub }) => (
  <div className={cn('flex flex-col items-center justify-center py-12 rounded-xl gap-3', colorClasses.bg.secondary)}>
    {icon && <div className="opacity-40 text-gray-400">{icon}</div>}
    <p className={cn('text-sm font-medium', colorClasses.text.muted)}>{message}</p>
    {sub && <p className={cn('text-xs', colorClasses.text.muted)}>{sub}</p>}
  </div>
);

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ProfileSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className={cn('rounded-2xl overflow-hidden border', colorClasses.border.gray100)}>
      <div className="h-28 bg-gradient-to-r from-blue-200 to-teal-200 dark:from-blue-900 dark:to-teal-900" />
      <div className="p-5 space-y-3">
        <div className="flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 -mt-12 border-4 border-white dark:border-gray-900" />
          <div className="space-y-2 pb-1 flex-1">
            <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-72 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
    <div className={cn('rounded-2xl border h-64', colorClasses.border.gray100, colorClasses.bg.secondary)} />
  </div>
);

// ─── Error State ──────────────────────────────────────────────────────────────

const ErrorState: React.FC<{ message: string; onRetry: () => void; onBack: () => void }> = ({ message, onRetry, onBack }) => (
  <div className={cn('flex flex-col items-center gap-4 py-20 rounded-2xl', colorClasses.bg.secondary)}>
    <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
      <AlertCircle className="w-6 h-6 text-red-500" />
    </div>
    <div className="text-center">
      <p className={cn('text-sm font-medium', colorClasses.text.primary)}>{message}</p>
      <p className={cn('text-xs mt-1', colorClasses.text.muted)}>The organization may not exist or their profile is private.</p>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={onBack} className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-colors', colorClasses.bg.primary, colorClasses.border.gray100, colorClasses.text.secondary)}>
        <ArrowLeft className="w-3.5 h-3.5" />Back
      </button>
      <button onClick={onRetry} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors">
        <RefreshCw className="w-3.5 h-3.5" />Retry
      </button>
    </div>
  </div>
);

// ─── Org Header ───────────────────────────────────────────────────────────────

const OrgHeader: React.FC<{ profile: OrgPublicProfile; isSaving: boolean; onToggleSave: () => void }> = ({ profile, isSaving, onToggleSave }) => {
  const [logoError, setLogoError] = useState(false);
  const [showAllSocials, setShowAllSocials] = useState(false);

  const sizeLabel: Record<string, string> = { startup: 'Startup', sme: 'SME', enterprise: 'Enterprise' };
  const allSocials = Object.entries(profile.socialLinks ?? {}).filter(([, v]) => !!v);
  const visibleSocials = showAllSocials ? allSocials : allSocials.slice(0, 4);

  const initials = profile.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={cn('rounded-2xl border overflow-hidden', colorClasses.bg.primary, colorClasses.border.gray100)}>
      {/* Cover — teal/blue gradient distinct from freelancer (amber/navy) */}
      <div
        className="h-28 w-full"
        style={{ background: 'linear-gradient(135deg, #0f2952 0%, #1a4480 50%, #0d9488 100%)' }}
      />

      <div className="px-5 pb-5 -mt-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          {/* Logo + name */}
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center">
                {profile.logo && !logoError ? (
                  <Image src={profile.logo} alt={profile.name} width={80} height={80} className="object-cover w-full h-full" onError={() => setLogoError(true)} priority />
                ) : (
                  <span className={cn('text-xl font-bold', orgTheme.accent)}>{initials}</span>
                )}
              </div>
              {profile.verified && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                  <BadgeCheck className="w-3 h-3 text-white" />
                </span>
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={cn('text-xl font-bold', colorClasses.text.primary)}>{profile.name}</h1>
                {profile.verified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Verified</span>}
                {profile.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">Featured</span>}
              </div>
              {profile.tagline && <p className={cn('text-sm mt-0.5', colorClasses.text.secondary)}>{profile.tagline}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:pb-1">
            {profile.activeTendersCount > 0 && (
              <Link
                href={`/dashboard/freelancer/organizations/${profile._id}#tenders`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                {profile.activeTendersCount} Open Role{profile.activeTendersCount !== 1 ? 's' : ''}
              </Link>
            )}
            <button
              onClick={onToggleSave}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200',
                profile.isSaved
                  ? `${orgTheme.accentBg} text-blue-700 ${orgTheme.accentBorder} dark:text-blue-400`
                  : cn(colorClasses.bg.secondary, colorClasses.text.secondary, colorClasses.border.gray100, 'border hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'),
                isSaving && 'opacity-60 cursor-not-allowed'
              )}
            >
              {profile.isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{profile.isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Meta strip */}
        <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 border-t text-sm', colorClasses.border.gray100)}>
          {profile.industry && (
            <span className={cn('flex items-center gap-1', colorClasses.text.muted)}>
              <Tag className="w-3.5 h-3.5" />{profile.industry}
            </span>
          )}
          {profile.location && (
            <span className={cn('flex items-center gap-1', colorClasses.text.muted)}>
              <MapPin className="w-3.5 h-3.5" />{profile.location}
            </span>
          )}
          {profile.size && (
            <span className={cn(orgTheme.accent, 'font-medium text-xs')}>{sizeLabel[profile.size]}</span>
          )}
          {profile.reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className={cn('font-semibold', colorClasses.text.primary)}>{profile.avgRating.toFixed(1)}</span>
              <span className={colorClasses.text.muted}>({profile.reviewCount})</span>
            </div>
          )}
          {profile.memberSince && (
            <span className={cn('flex items-center gap-1', colorClasses.text.muted)}>
              <Calendar className="w-3.5 h-3.5" />Since {formatDate(profile.memberSince)}
            </span>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Active Tenders', value: profile.activeTendersCount.toString() },
            { label: 'Total Posted',   value: profile.totalTendersPosted.toString() },
            { label: 'Total Spend',    value: profile.totalSpend > 0 ? `$${(profile.totalSpend / 1000).toFixed(1)}k` : '—' },
            { label: 'Avg Budget',     value: profile.avgBudget ? `$${(profile.avgBudget / 1000).toFixed(1)}k` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className={cn('rounded-xl p-3 text-center', colorClasses.bg.secondary)}>
              <p className={cn('text-base font-bold', colorClasses.text.primary)}>{value}</p>
              <p className={cn('text-[10px] mt-0.5', colorClasses.text.muted)}>{label}</p>
            </div>
          ))}
        </div>

        {/* Rating breakdown */}
        {profile.reviewCount > 0 && (
          <div className={cn('mt-4 p-3 rounded-xl', colorClasses.bg.secondary)}>
            <p className={cn('text-xs font-semibold mb-2', colorClasses.text.muted)}>Freelancer Rating Breakdown</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {Object.entries(profile.ratingBreakdown).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={cn('text-xs w-24 capitalize', colorClasses.text.muted)}>{key}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-1.5 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${(val / 5) * 100}%` }} />
                  </div>
                  <span className={cn('text-xs font-medium w-6 text-right', colorClasses.text.primary)}>
                    {val > 0 ? val.toFixed(1) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.tags.map((tag) => (
              <span key={tag} className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', orgTheme.accentBg, orgTheme.accent, 'border', orgTheme.accentBorder)}>
                <Tag className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Social links */}
        {allSocials.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {visibleSocials.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors', colorClasses.bg.secondary, colorClasses.border.gray100, colorClasses.text.secondary, 'hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400')}
                >
                  <Globe className="w-3 h-3" />
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              ))}
              {allSocials.length > 4 && (
                <button onClick={() => setShowAllSocials((p) => !p)} className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border', colorClasses.bg.secondary, colorClasses.border.gray100, colorClasses.text.muted)}>
                  {showAllSocials ? <>Less <ChevronUp className="w-3 h-3" /></> : <>+{allSocials.length - 4} more <ChevronDown className="w-3 h-3" /></>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Website */}
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1.5 mt-3 text-xs font-medium', orgTheme.accent, 'hover:opacity-80 transition-opacity')}>
            <Globe className="w-3.5 h-3.5" />
            {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OrgOverviewTab: React.FC<{ profile: OrgPublicProfile }> = ({ profile }) => (
  <div className="space-y-6">
    {profile.description && (
      <div>
        <SectionHeading icon={<Building2 className={cn('w-3.5 h-3.5', orgTheme.accent)} />} title="About" />
        <p className={cn('text-sm leading-relaxed whitespace-pre-line', colorClasses.text.secondary)}>{profile.description}</p>
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {profile.industry && (
        <div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}>
          <p className={cn('text-[10px] font-semibold uppercase tracking-wide mb-1', colorClasses.text.muted)}>Industry</p>
          <p className={cn('text-sm font-medium', colorClasses.text.primary)}>{profile.industry}</p>
        </div>
      )}
      {profile.size && (
        <div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}>
          <p className={cn('text-[10px] font-semibold uppercase tracking-wide mb-1', colorClasses.text.muted)}>Company Size</p>
          <p className={cn('text-sm font-medium', colorClasses.text.primary)}>
            {{ startup: 'Startup (1–10)', sme: 'SME (10–200)', enterprise: 'Enterprise (200+)' }[profile.size]}
          </p>
        </div>
      )}
      {profile.teamSize != null && (
        <div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}>
          <p className={cn('text-[10px] font-semibold uppercase tracking-wide mb-1', colorClasses.text.muted)}>Team Size</p>
          <p className={cn('text-sm font-medium', colorClasses.text.primary)}>{profile.teamSize} people</p>
        </div>
      )}
      {profile.foundedYear && (
        <div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}>
          <p className={cn('text-[10px] font-semibold uppercase tracking-wide mb-1', colorClasses.text.muted)}>Founded</p>
          <p className={cn('text-sm font-medium', colorClasses.text.primary)}>{profile.foundedYear}</p>
        </div>
      )}
    </div>

    {/* Contact */}
    {(profile.email || profile.phone) && (
      <div>
        <SectionHeading icon={<Link2 className={cn('w-3.5 h-3.5', orgTheme.accent)} />} title="Contact" />
        <div className={cn('p-3 rounded-xl border space-y-2', colorClasses.bg.secondary, colorClasses.border.gray100)}>
          {profile.email && (
            <a href={`mailto:${profile.email}`} className={cn('flex items-center gap-2 text-xs', colorClasses.text.secondary, 'hover:text-blue-600 transition-colors')}>
              <Send className="w-3.5 h-3.5 shrink-0" />{profile.email}
            </a>
          )}
          {profile.phone && (
            <a href={`tel:${profile.phone}`} className={cn('flex items-center gap-2 text-xs', colorClasses.text.secondary, 'hover:text-blue-600 transition-colors')}>
              <Send className="w-3.5 h-3.5 shrink-0" />{profile.phone}
            </a>
          )}
        </div>
      </div>
    )}
  </div>
);

// ─── Active Tenders Tab ───────────────────────────────────────────────────────

const ActiveTendersTab: React.FC<{ profile: OrgPublicProfile }> = ({ profile }) => {
  const tenders = profile.activeTenders;

  if (!tenders.length) {
    return <EmptyState icon={<Briefcase className="w-8 h-8" />} message="No active tenders at this time." sub="Check back later for new opportunities." />;
  }

  return (
    <div className="space-y-3">
      {tenders.map((tender) => {
        const daysLeft = Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isUrgent = daysLeft <= 3;

        return (
          <Link
            key={tender._id}
            href={`/dashboard/freelancer/tenders/${tender._id}`}
            className={cn(
              'block p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
              colorClasses.bg.primary, colorClasses.border.gray100,
              isUrgent && 'border-orange-200 dark:border-orange-800'
            )}
          >
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <h4 className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>{tender.title}</h4>
                {tender.description && (
                  <p className={cn('text-xs mt-1 line-clamp-2', colorClasses.text.secondary)}>{tender.description}</p>
                )}
              </div>
              {/* Budget */}
              {tender.budget && (
                <span className={cn('text-sm font-bold shrink-0', orgTheme.accent)}>
                  ${tender.budget.min.toLocaleString()}–${tender.budget.max.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              {/* Deadline */}
              <span className={cn('flex items-center gap-1 text-xs', isUrgent ? 'text-orange-600 dark:text-orange-400 font-semibold' : colorClasses.text.muted)}>
                <Clock className="w-3 h-3" />
                {isUrgent ? `${daysLeft}d left!` : `Closes ${formatDate(tender.deadline)}`}
              </span>

              {tender.engagementType && (
                <span className={cn('text-xs px-2 py-0.5 rounded-full', orgTheme.accentBg, orgTheme.accent)}>
                  {tender.engagementType}
                </span>
              )}

              {(tender.applicationCount ?? 0) > 0 && (
                <span className={cn('flex items-center gap-1 text-xs', colorClasses.text.muted)}>
                  <Users className="w-3 h-3" />{tender.applicationCount} applied
                </span>
              )}
            </div>

            {/* Skills */}
            {tender.skillsRequired && tender.skillsRequired.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tender.skillsRequired.slice(0, 4).map((s) => (
                  <span key={s} className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', colorClasses.bg.secondary, colorClasses.text.muted)}>
                    {s}
                  </span>
                ))}
                {tender.skillsRequired.length > 4 && (
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded', colorClasses.bg.secondary, colorClasses.text.muted)}>
                    +{tender.skillsRequired.length - 4}
                  </span>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
};

// ─── Work History Tab ─────────────────────────────────────────────────────────
// Shows the org's past projects, total spend, and engagement history.

const OrgWorkHistoryTab: React.FC<{ profile: OrgPublicProfile }> = ({ profile }) => {
  const stats = [
    { label: 'Total Tenders Posted', value: profile.totalTendersPosted.toString(), icon: <ScrollText className="w-4 h-4 text-blue-500" /> },
    { label: 'Total Spend',          value: profile.totalSpend > 0 ? `$${(profile.totalSpend / 1000).toFixed(1)}k` : '—', icon: <Banknote className="w-4 h-4 text-teal-500" /> },
    { label: 'Avg Budget',           value: profile.avgBudget ? `$${(profile.avgBudget / 1000).toFixed(1)}k` : '—', icon: <TrendingUp className="w-4 h-4 text-amber-500" /> },
    { label: 'Freelancer Rating',    value: profile.reviewCount > 0 ? profile.avgRating.toFixed(1) : '—', icon: <Star className="w-4 h-4 text-amber-400" /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <SectionHeading icon={<TrendingUp className={cn('w-3.5 h-3.5', orgTheme.accent)} />} title="Engagement Overview" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={cn('rounded-xl p-3 border', colorClasses.bg.secondary, colorClasses.border.gray100)}>
              <div className="mb-1">{s.icon}</div>
              <p className={cn('text-lg font-bold', colorClasses.text.primary)}>{s.value}</p>
              <p className={cn('text-[10px] mt-0.5', colorClasses.text.muted)}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionHeading icon={<Trophy className={cn('w-3.5 h-3.5', orgTheme.accent)} />} title="Project History" />
        <div className={cn('rounded-xl border p-6 text-center space-y-2', colorClasses.bg.secondary, colorClasses.border.gray100)}>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6 text-blue-500" />
          </div>
          <p className={cn('text-sm font-medium', colorClasses.text.primary)}>
            {profile.totalTendersPosted > 0
              ? `${profile.totalTendersPosted} tenders posted`
              : 'Project history'}
          </p>
          <p className={cn('text-xs leading-relaxed max-w-xs mx-auto', colorClasses.text.muted)}>
            Detailed awarded-project history will appear here once the
            <code className="mx-1 text-[10px] px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">GET /organizations/:id/work-history</code>
            endpoint is wired up.
          </p>
        </div>
      </div>

      {profile.recentReviews && profile.recentReviews.length > 0 && (
        <div>
          <SectionHeading icon={<Star className={cn('w-3.5 h-3.5', orgTheme.accent)} />} title="Recent Freelancer Feedback" />
          <div className="space-y-3">
            {profile.recentReviews.slice(0, 3).map((rev) => (
              <OrgReviewCard key={rev._id} review={rev} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Review Card (from freelancers about this org) ────────────────────────────

const OrgReviewCard: React.FC<{ review: OrgReview }> = ({ review }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div className={cn('p-4 rounded-xl border', colorClasses.bg.primary, colorClasses.border.gray100)}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
          {review.freelancerId.avatar && !imgError ? (
            <Image src={review.freelancerId.avatar} alt={review.freelancerId.name} width={32} height={32} className="object-cover" onError={() => setImgError(true)} />
          ) : (
            <Users className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className={cn('text-xs font-semibold', colorClasses.text.primary)}>{review.freelancerId.name}</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={cn('w-3 h-3', n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700')} />
              ))}
              <span className={cn('text-xs ml-1', colorClasses.text.muted)}>{formatDate(review.createdAt)}</span>
            </div>
          </div>
          {review.comment && <p className={cn('text-xs mt-1.5 leading-relaxed', colorClasses.text.secondary)}>{review.comment}</p>}
          {review.subRatings && (
            <div className="grid grid-cols-2 gap-1 mt-2">
              {Object.entries(review.subRatings).map(([key, val]) =>
                val != null ? (
                  <div key={key} className="flex items-center gap-1">
                    <span className={cn('text-[10px] capitalize w-20', colorClasses.text.muted)}>{key}</span>
                    <div className="flex gap-px">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className={cn('w-1.5 h-1.5 rounded-full', n <= val ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-700')} />
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Reviews Tab ──────────────────────────────────────────────────────────────

const OrgReviewsTab: React.FC<{ profile: OrgPublicProfile }> = ({ profile }) => {
  const [page, setPage] = useState(1);
  // Replace with real hook: useOrgReviews(profile._id, page)
  const reviews = profile.recentReviews ?? [];
  const summary = { average: profile.avgRating, count: profile.reviewCount, breakdown: profile.ratingBreakdown };

  return (
    <div className="space-y-4">
      <div className={cn('p-4 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className={cn('text-4xl font-bold', colorClasses.text.primary)}>
              {summary.average > 0 ? summary.average.toFixed(1) : '—'}
            </p>
            <div className="flex justify-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={cn('w-3.5 h-3.5', n <= Math.round(summary.average) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700')} />
              ))}
            </div>
            <p className={cn('text-xs mt-1', colorClasses.text.muted)}>{summary.count} review{summary.count !== 1 ? 's' : ''}</p>
          </div>
          {summary.count > 0 && (
            <div className="flex-1 space-y-1">
              {Object.entries(summary.breakdown).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={cn('text-[10px] w-20 capitalize', colorClasses.text.muted)}>{key}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${val > 0 ? (val / 5) * 100 : 0}%` }} />
                  </div>
                  <span className={cn('text-[10px] w-5 text-right', colorClasses.text.muted)}>{val > 0 ? val.toFixed(1) : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState icon={<Star className="w-8 h-8" />} message="No reviews yet." sub="Reviews from freelancers will appear here." />
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => <OrgReviewCard key={rev._id} review={rev} />)}
        </div>
      )}
    </div>
  );
};

// ─── Tabs config ──────────────────────────────────────────────────────────────

type OrgTab = 'overview' | 'tenders' | 'work-history' | 'reviews';

const ORG_TABS: { id: OrgTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',      label: 'Overview',      icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: 'tenders',       label: 'Active Tenders', icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: 'work-history',  label: 'Work History',  icon: <Trophy className="w-3.5 h-3.5" /> },
  { id: 'reviews',       label: 'Reviews',       icon: <Star className="w-3.5 h-3.5" /> },
];

// ─── OrgDetails component ─────────────────────────────────────────────────────

const OrgDetails: React.FC<{ profile: OrgPublicProfile }> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<OrgTab>('overview');

  return (
    <div className={cn('rounded-2xl border overflow-hidden', colorClasses.bg.primary, colorClasses.border.gray100)}>
      <div className={cn('flex border-b overflow-x-auto', colorClasses.border.gray100)}>
        {ORG_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors duration-150',
              activeTab === tab.id ? orgTheme.tabActive : orgTheme.tabIdle
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'tenders' && profile.activeTendersCount > 0 && (
              <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {profile.activeTendersCount}
              </span>
            )}
            {tab.id === 'reviews' && profile.reviewCount > 0 && (
              <span className={cn('ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full', colorClasses.bg.secondary, colorClasses.text.muted)}>
                {profile.reviewCount}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="p-5">
        {activeTab === 'overview'     && <OrgOverviewTab      profile={profile} />}
        {activeTab === 'tenders'      && <ActiveTendersTab    profile={profile} />}
        {activeTab === 'work-history' && <OrgWorkHistoryTab   profile={profile} />}
        {activeTab === 'reviews'      && <OrgReviewsTab       profile={profile} />}
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrganizationDetailPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  // Replace with: const { data: profile, isLoading, isError, refetch } = useOrgProfile(id);
  const profile: OrgPublicProfile | undefined = undefined;
  const isLoading = false;
  const isError = false;
  const refetch = () => {};

  // Replace with: const toggleSave = useToggleFollowOrg(); const isSaving = toggleSave.isPending;
  const isSaving = false;
  const handleToggleSave = () => {};

  const handleBack = () => router.push('/dashboard/freelancer/organizations');

  return (
    <DashboardLayout requiredRole="freelancer">
      <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
        {/* Back */}
        <button
          onClick={handleBack}
          className={cn('flex items-center gap-1.5 text-xs font-medium transition-colors', colorClasses.text.muted, 'hover:text-blue-600 dark:hover:text-blue-400')}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Directory
        </button>

        {isLoading && <ProfileSkeleton />}

        {isError && !isLoading && (
          <ErrorState message="Failed to load organization profile" onRetry={refetch} onBack={handleBack} />
        )}

        {!isLoading && !isError && profile && (
          <div className="space-y-4">
            <OrgHeader profile={profile} isSaving={isSaving} onToggleSave={handleToggleSave} />
            <OrgDetails profile={profile} />
          </div>
        )}

        {!isLoading && !isError && !profile && (
          <ErrorState message="Organization not found" onRetry={refetch} onBack={handleBack} />
        )}
      </div>
    </DashboardLayout>
  );
}