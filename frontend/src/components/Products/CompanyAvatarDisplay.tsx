/**
 * frontend/src/components/Products/CompanyAvatarDisplay.tsx  (UPDATED)
 *
 * Priority:
 *   1. avatarPublicId → Cloudinary optimized URL via profileService.generateCloudinaryUrl
 *   2. avatarUrl contains cloudinary.com → profileService.getOptimizedAvatarUrl
 *   3. avatarUrl is plain HTTPS → use as-is
 *   4. Fallback: gold-branded initials (no ui-avatars.com)
 *
 * Props expanded to accept ownerSnapshot fields directly.
 */
import React, { useState } from 'react';
import { profileService } from '@/services/profileService';
import { cn } from '@/lib/utils';

interface CompanyAvatarDisplayProps {
  companyName: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  verified?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showVerifiedBadge?: boolean;
}

const PIXEL = { xs: 28, sm: 40, md: 56, lg: 80, xl: 112 } as const;
const SIZE_CLASS = {
  xs: 'w-7 h-7',
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
} as const;
const PROFILE_SIZE = { xs: 'small', sm: 'small', md: 'medium', lg: 'large', xl: 'large' } as const;

function resolveAvatarUrl(
  avatarPublicId: string | null | undefined,
  avatarUrl: string | null | undefined,
  size: keyof typeof PIXEL
): string {
  const px = PIXEL[size];

  if (avatarPublicId) {
    return profileService.generateCloudinaryUrl(avatarPublicId, {
      width: px, height: px, crop: 'fill', quality: 'auto', format: 'auto',
    });
  }

  if (avatarUrl) {
    if (avatarUrl.includes('cloudinary.com')) {
      return profileService.getOptimizedAvatarUrl(avatarUrl, PROFILE_SIZE[size]);
    }
    if (
      (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) &&
      !avatarUrl.includes('ui-avatars.com')
    ) {
      return avatarUrl;
    }
  }

  return '';
}

function getInitials(name: string): string {
  if (!name?.trim()) return '??';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const CompanyAvatarDisplay: React.FC<CompanyAvatarDisplayProps> = ({
  companyName,
  avatarUrl,
  avatarPublicId,
  verified,
  size = 'sm',
  className,
  showVerifiedBadge = true,
}) => {
  const [imgError, setImgError] = useState(false);

  const resolvedUrl   = resolveAvatarUrl(avatarPublicId, avatarUrl, size);
  const showFallback  = imgError || !resolvedUrl;
  const initials      = getInitials(companyName);
  const px            = PIXEL[size];
  const fontSize      = size === 'xl' ? '1.4rem' : size === 'lg' ? '1.1rem' : size === 'md' ? '0.85rem' : '0.7rem';

  return (
    <div
      className={cn(
        SIZE_CLASS[size],
        'relative rounded-full overflow-hidden shrink-0 ring-2 ring-offset-1',
        'transition-transform hover:scale-105 duration-300',
        verified
          ? 'ring-[#F1BB03]/70 dark:ring-[#F1BB03]/50'
          : 'ring-gray-200 dark:ring-gray-700',
        className
      )}
    >
      {showFallback ? (
        <div
          aria-label={companyName}
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F1BB03] to-[#D99E00] text-[#0A2540] font-bold select-none"
          style={{ fontSize }}
        >
          {initials}
        </div>
      ) : (
        <img
          src={resolvedUrl}
          alt={`${companyName} logo`}
          width={px}
          height={px}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
          decoding="async"
        />
      )}

      {verified && showVerifiedBadge && size !== 'xs' && (
        <span
          className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center"
          aria-label="Verified"
        >
          <svg viewBox="0 0 20 20" fill="#22C55E" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </div>
  );
};
