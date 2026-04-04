// src/components/tender/shared/TenderOwnerAvatar.tsx
import { useState } from 'react';
import profileService, { CloudinaryImage } from '@/services/profileService';
import { getFreelanceEntityAvatar } from '@/services/freelanceTenderService';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';

interface TenderOwnerAvatarProps {
  ownerEntity?: {
    name: string;
    logo?: CloudinaryImage | string;
    headline?: string;
    _id?: string;
  };
  owner?: { name: string; avatar?: string; _id?: string };
  tenderType?: 'freelance' | 'professional';
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showHeadline?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { img: 'w-8 h-8', text: 'text-xs', headline: 'text-[10px]' },
  md: { img: 'w-12 h-12', text: 'text-sm', headline: 'text-xs' },
  lg: { img: 'w-16 h-16', text: 'text-base', headline: 'text-sm' },
};

export default function TenderOwnerAvatar({
  ownerEntity,
  owner,
  tenderType = 'freelance',
  size = 'md',
  showName = false,
  showHeadline = false,
  className = '',
}: TenderOwnerAvatarProps) {
  const { getTouchTargetSize } = useResponsive();
  const displayName = ownerEntity?.name || owner?.name || 'Unknown';
  const avatarUrl = getFreelanceEntityAvatar(
    ownerEntity as { logo?: CloudinaryImage; name?: string },
    owner
  );

  const [imgSrc, setImgSrc] = useState(avatarUrl);
  const sizes = sizeMap[size];

  const handleError = () => {
    setImgSrc(profileService.getPlaceholderAvatar(displayName));
  };

  const imgEl = (
    <img
      src={imgSrc}
      alt={displayName}
      onError={handleError}
      className={`
        ${sizes.img}
        rounded-full object-cover
        ring-2 ring-white shadow-sm
        shrink-0
      `}
    />
  );

  if (!showName && !showHeadline) {
    return (
      <div className={`inline-flex ${getTouchTargetSize('sm')} items-center ${className}`}>
        {imgEl}
      </div>
    );
  }

  return (
    <div
      className={`
        inline-flex flex-row items-center gap-3
        ${getTouchTargetSize('sm')}
        ${className}
      `}
      suppressHydrationWarning
    >
      {imgEl}

      {(showName || showHeadline) && (
        <div className="flex flex-col min-w-0">
          {showName && (
            <span
              className={`
                font-semibold truncate
                ${sizes.text}
                ${colorClasses.text.primary}
              `}
            >
              {displayName}
            </span>
          )}
          {showHeadline && (
            <span
              className={`
                truncate
                ${sizes.headline}
                ${colorClasses.text.secondary}
              `}
            >
              {ownerEntity?.headline ?? 'Company'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}