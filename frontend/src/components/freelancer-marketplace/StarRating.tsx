// src/components/freelancer-marketplace/StarRating.tsx
'use client';

import React from 'react';

interface StarRatingProps {
  value: number; // 0–5, supports decimals
  count?: number; // show "(42)" if provided
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean; // show grey empty stars
  interactive?: boolean;
  onChange?: (value: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  count,
  size = 'md',
  showEmpty = true,
  interactive = false,
  onChange,
}) => {
  const [hoverValue, setHoverValue] = React.useState(0);

  const sizes = {
    sm: 'text-sm gap-0.5',
    md: 'text-base gap-1',
    lg: 'text-2xl gap-1',
  };

  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;

  const renderStar = (position: number, isFull: boolean, isHalf: boolean = false) => {
    const filled = interactive ? position <= hoverValue : isFull;
    const half = interactive ? false : isHalf;

    if (filled) {
      return (
        <svg
          key={position}
          className={`${starSizes[size]} text-[#F59E0B] fill-current`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    if (half && !interactive) {
      return (
        <svg
          key={position}
          className={`${starSizes[size]} text-[#F59E0B] fill-current`}
          viewBox="0 0 20 20"
        >
          <defs>
            <linearGradient id={`half-${position}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#half-${position})`}
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      );
    }

    if (showEmpty) {
      return (
        <svg
          key={position}
          className={`${starSizes[size]} text-[#E2E8F0] dark:text-[#374151] fill-current`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return null;
  };

  const handleStarClick = (starValue: number) => {
    if (interactive && onChange) {
      onChange(starValue);
    }
  };

  const handleStarHover = (starValue: number) => {
    if (interactive) {
      setHoverValue(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverValue(0);
    }
  };

  const displayValue = interactive ? hoverValue || value : value;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center ${sizes[size]}`}
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = star <= Math.floor(displayValue);
          const isHalf = !isFull && star === Math.ceil(displayValue) && hasHalfStar && displayValue - star + 1 > 0.5;

          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                className="transition-transform hover:scale-110"
              >
                {renderStar(star, isFull, isHalf)}
              </button>
            );
          }

          return (
            <div key={star} className="inline-block">
              {renderStar(star, isFull, isHalf)}
            </div>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          ({count})
        </span>
      )}
    </div>
  );
};

export default StarRating;