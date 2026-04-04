import React, { useState } from 'react';
import { profileService } from '@/services/profileService';
import { cn } from '@/lib/utils';

interface CompanyAvatarDisplayProps {
  companyName: string;
  /** Raw URL — could be Cloudinary, a plain HTTPS logo, or undefined */
  avatarUrl?: string;
  /** Cloudinary public_id — preferred over avatarUrl when present */
  avatarPublicId?: string;
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Pixel dimensions used for Cloudinary transforms and <img> sizing
const PIXEL_SIZE = { sm: 50, md: 100, lg: 150 } as const;

// Tailwind size classes
const SIZE_CLASS = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
} as const;

// profileService size labels
const PROFILE_SIZE = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
} as const;

/**
 * Resolves the best URL to display for a company avatar.
 * Priority: Cloudinary public_id → Cloudinary URL → any HTTPS URL → ''
 */
function resolveAvatarUrl(
  avatarPublicId: string | undefined,
  avatarUrl: string | undefined,
  size: 'sm' | 'md' | 'lg'
): string {
  const px = PIXEL_SIZE[size];

  // 1. We have a raw Cloudinary public_id — build an optimized URL
  if (avatarPublicId) {
    return profileService.generateCloudinaryUrl(avatarPublicId, {
      width: px,
      height: px,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
    });
  }

  // 2. We have a URL string
  if (avatarUrl) {
    // Cloudinary URL — apply size transforms via profileService
    if (avatarUrl.includes('cloudinary.com')) {
      return profileService.getOptimizedAvatarUrl(avatarUrl, PROFILE_SIZE[size]);
    }
    // Plain HTTPS logo (S3, company CDN, etc.) — use as-is; never ui-avatars.com
    if (
      (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) &&
      !avatarUrl.includes('ui-avatars.com')
    ) {
      return avatarUrl;
    }
  }

  return '';
}

/**
 * Generates up-to-2-character uppercase initials from a company name.
 * "Test Company Inc." → "TC"
 * "Acme"             → "AC"
 */
function getInitials(name: string): string {
  if (!name?.trim()) return '??';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const CompanyAvatarDisplay: React.FC<CompanyAvatarDisplayProps> = ({
  companyName,
  avatarUrl,
  avatarPublicId,
  verified,
  size = 'sm',
  className,
}) => {
  const [imgError, setImgError] = useState(false);

  const resolvedUrl = resolveAvatarUrl(avatarPublicId, avatarUrl, size);
  const showFallback = imgError || !resolvedUrl;
  const initials = getInitials(companyName);
  const px = PIXEL_SIZE[size];

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
        /* Gold-branded initials fallback — never ui-avatars.com */
        <div
          aria-label={companyName}
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F1BB03] to-[#D99E00] text-[#0A2540] font-bold select-none"
          style={{
            fontSize:
              size === 'lg' ? '1.1rem' : size === 'md' ? '0.85rem' : '0.7rem',
          }}
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
    </div>
  );
};