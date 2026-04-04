// components/company/marketplace/FreelancerHeader.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  MapPin,
  Star,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Clock,
  Zap,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';
import { FreelancerPublicProfile } from '@/services/freelancerMarketplaceService';

interface FreelancerHeaderProps {
  profile: FreelancerPublicProfile;
  isSaving: boolean;
  onToggleSave: () => void;
}

const SOCIAL_DISPLAY: Record<string, string> = {
  linkedin:      'LinkedIn',
  github:        'GitHub',
  dribbble:      'Dribbble',
  behance:       'Behance',
  twitter:       'Twitter / X',
  stackoverflow: 'Stack Overflow',
};

const availabilityConfig = {
  available:       { label: 'Open to Work',   color: 'text-emerald-600 dark:text-emerald-400',  dot: 'bg-emerald-500' },
  'part-time':     { label: 'Part-time Only', color: 'text-amber-600 dark:text-amber-400',      dot: 'bg-amber-500' },
  'not-available': { label: 'Not Available',  color: 'text-gray-500 dark:text-gray-400',        dot: 'bg-gray-400' },
};

const levelLabel: Record<string, string> = {
  entry:        'Entry-level',
  intermediate: 'Mid-level',
  expert:       'Expert',
};

const FreelancerHeader: React.FC<FreelancerHeaderProps> = ({
  profile,
  isSaving,
  onToggleSave,
}) => {
  const [imgError, setImgError] = useState(false);
  const [showAllSocials, setShowAllSocials] = useState(false);

  const { user, availability, ratings, featured, membership, badges, profileViews } = profile;
  const avail = availabilityConfig[availability] ?? availabilityConfig['not-available'];

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  // Merge social links
  const allSocials = Object.entries(user.socialLinks ?? {}).filter(([, v]) => !!v);
  const visibleSocials = showAllSocials ? allSocials : allSocials.slice(0, 4);

  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden',
        colorClasses.bg.primary,
        colorClasses.border.gray100
      )}
    >
      {/* ── Top gradient band ── */}
      <div
        className="h-24 w-full"
        style={{
          background: 'linear-gradient(135deg, #1a2744 0%, #2d3f6e 50%, #c9a84c 100%)',
        }}
      />

      {/* ── Profile content ── */}
      <div className="px-5 pb-5 -mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

          {/* Avatar + name block */}
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 shadow-lg flex items-center justify-center">
                {user.avatar && !imgError ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                    onError={() => setImgError(true)}
                    priority
                  />
                ) : (
                  <span className={cn('text-xl font-bold', colorClasses.text.amber)}>
                    {initials}
                  </span>
                )}
              </div>
              {availability === 'available' && (
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
              )}
            </div>

            {/* Name + headline */}
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={cn('text-xl font-bold', colorClasses.text.primary)}>
                  {user.name}
                </h1>
                {membership !== 'basic' && (
                  <BadgeCheck
                    className={cn(
                      'w-5 h-5',
                      membership === 'premium' ? 'text-amber-500' : 'text-blue-500'
                    )}
                  />
                )}
                {featured && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Featured
                  </span>
                )}
              </div>

              {profile.headline && (
                <p className={cn('text-sm mt-0.5', colorClasses.text.secondary)}>
                  {profile.headline}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:pb-1">
            <button
              onClick={onToggleSave}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                profile.isSaved
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                  : cn(colorClasses.bg.secondary, colorClasses.text.secondary, colorClasses.border.gray100, 'border hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-400'),
                isSaving && 'opacity-60 cursor-not-allowed'
              )}
            >
              {profile.isSaved ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
              <span>{profile.isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* ── Availability + meta strip ── */}
        <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 border-t text-sm', colorClasses.border.gray100)}>
          {/* Availability */}
          <div className={cn('flex items-center gap-1.5 font-medium', avail.color)}>
            <span className={cn('w-2 h-2 rounded-full', avail.dot)} />
            {avail.label}
          </div>

          {/* Location */}
          {user.location && (
            <div className={cn('flex items-center gap-1', colorClasses.text.muted)}>
              <MapPin className="w-3.5 h-3.5" />
              {user.location}
            </div>
          )}

          {/* Rating */}
          {ratings.count > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className={cn('font-semibold', colorClasses.text.primary)}>
                {ratings.average.toFixed(1)}
              </span>
              <span className={colorClasses.text.muted}>({ratings.count})</span>
            </div>
          )}

          {/* Rate */}
          <span className={cn('font-bold', colorClasses.text.amber)}>
            ${profile.hourlyRate}/hr
          </span>

          {/* Experience level */}
          <span className={cn('capitalize', colorClasses.text.muted)}>
            {levelLabel[profile.experienceLevel] ?? profile.experienceLevel}
          </span>

          {/* Response time */}
          {profile.responseTime > 0 && (
            <div className={cn('flex items-center gap-1', colorClasses.text.muted)}>
              <Clock className="w-3.5 h-3.5" />
              Replies in ~{profile.responseTime}h
            </div>
          )}

          {/* Profile views */}
          {profileViews > 0 && (
            <span className={colorClasses.text.muted}>
              {profileViews.toLocaleString()} views
            </span>
          )}
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Success Rate', value: `${profile.successRate}%` },
            { label: 'On-Time',      value: `${profile.onTimeDelivery}%` },
            { label: 'Completion',   value: `${profile.profileCompletion}%` },
            { label: 'Earnings',     value: profile.totalEarnings > 0 ? `$${(profile.totalEarnings / 1000).toFixed(1)}k` : '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className={cn('rounded-xl p-3 text-center', colorClasses.bg.secondary)}
            >
              <p className={cn('text-base font-bold', colorClasses.text.primary)}>{value}</p>
              <p className={cn('text-[10px] mt-0.5', colorClasses.text.muted)}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Rating breakdown ── */}
        {ratings.count > 0 && (
          <div className={cn('mt-4 p-3 rounded-xl', colorClasses.bg.secondary)}>
            <p className={cn('text-xs font-semibold mb-2', colorClasses.text.muted)}>Rating Breakdown</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {Object.entries(ratings.breakdown).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={cn('text-xs w-24 capitalize', colorClasses.text.muted)}>{key}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-1.5 rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${(val / 5) * 100}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-medium w-6 text-right', colorClasses.text.primary)}>
                    {val > 0 ? val.toFixed(1) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Badges ── */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {badges.map((badge) => (
              <div
                key={badge.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                title={badge.description}
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Social links ── */}
        {allSocials.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {visibleSocials.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                    'border transition-colors duration-150',
                    colorClasses.bg.secondary,
                    colorClasses.border.gray100,
                    colorClasses.text.secondary,
                    'hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400'
                  )}
                >
                  <Globe className="w-3 h-3" />
                  {SOCIAL_DISPLAY[platform] ?? platform}
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              ))}
              {allSocials.length > 4 && (
                <button
                  onClick={() => setShowAllSocials((p) => !p)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                    colorClasses.bg.secondary,
                    colorClasses.border.gray100,
                    colorClasses.text.muted
                  )}
                >
                  {showAllSocials ? (
                    <>Less <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>+{allSocials.length - 4} more <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Website ── */}
        {user.website && (
          <a
            href={user.website}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1.5 mt-3 text-xs font-medium',
              colorClasses.text.amber,
              'hover:opacity-80 transition-opacity'
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            {user.website.replace(/^https?:\/\/(www\.)?/, '')}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};

export default FreelancerHeader;