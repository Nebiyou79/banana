// src/components/freelancer-marketplace/AvailabilityBadge.tsx
'use client';

import React from 'react';

type AvailabilityStatus = 'available' | 'not-available' | 'part-time';

interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
  };

  const config = {
    available: {
      label: 'Available',
      dotColor: 'bg-emerald-500',
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',
    },
    'part-time': {
      label: 'Part-time',
      dotColor: 'bg-amber-500',
      bgClass: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800',
    },
    'not-available': {
      label: 'Not Available',
      dotColor: 'bg-slate-400',
      bgClass: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700',
    },
  };

  const { label, dotColor, bgClass } = config[status];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizes[size]} ${bgClass}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor} ${size === 'sm' ? 'mr-1' : 'mr-1.5'}`}
        />
      )}
      {label}
    </span>
  );
};

export default AvailabilityBadge;