// components/company/marketplace/FreelancerCard.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  MapPin,
  Clock,
  Bookmark,
  BookmarkCheck,
  BadgeCheck,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';
import { FreelancerListItem } from '@/services/freelancerMarketplaceService';

interface FreelancerCardProps {
  freelancer: FreelancerListItem;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  isSaving?: boolean;
}

// ── Availability pill ─────────────────────────────────────────────────────────
const AvailabilityBadge: React.FC<{ status: FreelancerListItem['availability'] }> = ({ status }) => {
  const config = {
    available:     { label: 'Available',   className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'part-time':   { label: 'Part-time',   className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    'not-available': { label: 'Unavailable', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  };
  const { label, className } = config[status] ?? config['not-available'];
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', className)}>
      {label}
    </span>
  );
};

// ── Experience level label ─────────────────────────────────────────────────────
const levelLabel: Record<string, string> = {
  entry:        'Entry',
  intermediate: 'Mid-level',
  expert:       'Expert',
};

// ── Star rating display ───────────────────────────────────────────────────────
const StarRating: React.FC<{ average: number; count: number }> = ({ average, count }) => (
  <div className="flex items-center gap-1">
    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
    <span className={cn('text-xs font-semibold', colorClasses.text.primary)}>
      {average > 0 ? average.toFixed(1) : '—'}
    </span>
    {count > 0 && (
      <span className={cn('text-xs', colorClasses.text.muted)}>({count})</span>
    )}
  </div>
);

// ── Main card ─────────────────────────────────────────────────────────────────
const FreelancerCard: React.FC<FreelancerCardProps> = ({
  freelancer,
  isSaved = false,
  onToggleSave,
  isSaving = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const { user, ratings, featured, membership } = freelancer;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const topSkills = (user.skills ?? []).slice(0, 3);
  const extraSkills = (user.skills ?? []).length - topSkills.length;

  return (
    <div
      className={cn(
        'group relative rounded-2xl border transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5',
        colorClasses.bg.primary,
        colorClasses.border.gray100,
        featured && 'ring-1 ring-amber-400/60'
      )}
    >
      {/* Featured ribbon */}
      {featured && (
        <div className="absolute -top-px left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-300" />
      )}

      <div className="p-4">
        {/* ── Header row ── */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {user.avatar && !imgError ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className={cn('text-sm font-bold', colorClasses.text.amber)}>
                  {initials}
                </span>
              )}
            </div>
            {/* Online dot for available */}
            {freelancer.availability === 'available' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>
                {user.name}
              </h3>
              {membership !== 'basic' && (
                <BadgeCheck
                  className={cn(
                    'w-3.5 h-3.5 shrink-0',
                    membership === 'premium' ? 'text-amber-500' : 'text-blue-500'
                  )}
                />
              )}
            </div>

            {freelancer.headline && (
              <p className={cn('text-xs mt-0.5 line-clamp-1', colorClasses.text.secondary)}>
                {freelancer.headline}
              </p>
            )}

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <AvailabilityBadge status={freelancer.availability} />
              {user.location && (
                <span className={cn('flex items-center gap-0.5 text-[10px]', colorClasses.text.muted)}>
                  <MapPin className="w-3 h-3" />
                  {user.location}
                </span>
              )}
            </div>
          </div>

          {/* Save button */}
          {onToggleSave && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleSave(freelancer._id);
              }}
              disabled={isSaving}
              className={cn(
                'shrink-0 p-1.5 rounded-lg transition-all duration-200',
                isSaved
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : cn('text-gray-400 hover:text-amber-500', colorClasses.bg.secondary, 'hover:bg-amber-50 dark:hover:bg-amber-900/20'),
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
              title={isSaved ? 'Remove from shortlist' : 'Save to shortlist'}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* ── Stats row ── */}
        <div className={cn('flex items-center gap-3 mt-3 pt-3 border-t', colorClasses.border.gray100)}>
          <StarRating average={ratings.average} count={ratings.count} />

          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />

          <span className={cn('text-xs font-semibold', colorClasses.text.amber)}>
            ${freelancer.hourlyRate}/hr
          </span>

          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />

          <span className={cn('text-xs capitalize', colorClasses.text.muted)}>
            {levelLabel[freelancer.experienceLevel] ?? freelancer.experienceLevel}
          </span>

          {freelancer.responseTime > 0 && (
            <>
              <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
              <span className={cn('flex items-center gap-0.5 text-xs', colorClasses.text.muted)}>
                <Clock className="w-3 h-3" />
                {freelancer.responseTime}h
              </span>
            </>
          )}
        </div>

        {/* ── Skills ── */}
        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {topSkills.map((skill) => (
              <span
                key={skill}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium',
                  colorClasses.bg.amber,
                  'bg-opacity-10 text-amber-700 dark:text-amber-400'
                )}
              >
                {skill}
              </span>
            ))}
            {extraSkills > 0 && (
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full', colorClasses.bg.secondary, colorClasses.text.muted)}>
                +{extraSkills}
              </span>
            )}
          </div>
        )}

        {/* ── Specializations (if no skills shown) ── */}
        {topSkills.length === 0 && freelancer.specialization.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {freelancer.specialization.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium',
                  colorClasses.bg.secondary,
                  colorClasses.text.secondary
                )}
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* ── Badges row ── */}
        {freelancer.badges.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className={cn('text-[10px]', colorClasses.text.muted)}>
              {freelancer.badges.slice(0, 2).map((b) => b.name).join(' · ')}
              {freelancer.badges.length > 2 && ` +${freelancer.badges.length - 2}`}
            </span>
          </div>
        )}

        {/* ── CTA ── */}
        <Link
          href={`/dashboard/company/freelancer/${freelancer._id}`}
          className={cn(
            'flex items-center justify-between mt-3 pt-3 border-t',
            'text-xs font-semibold transition-colors duration-150',
            colorClasses.border.gray100,
            colorClasses.text.amber,
            'hover:opacity-80'
          )}
        >
          <span>View Profile</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default FreelancerCard;