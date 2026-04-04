// src/components/tender/shared/TenderEmptyState.tsx
import { ReactNode } from 'react';
import { colorClasses } from '@/utils/color';

interface TenderEmptyStateProps {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  icon?: ReactNode;
}

function DefaultIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      className="opacity-40"
    >
      {/* Folder shape */}
      <rect x="10" y="28" width="60" height="40" rx="6" fill="currentColor" opacity="0.15" />
      <path d="M10 34a6 6 0 016-6h16l6 6H10z" fill="currentColor" opacity="0.25" />
      {/* Magnifier */}
      <circle cx="52" cy="48" r="12" stroke="currentColor" strokeWidth="3.5" opacity="0.5" />
      <line x1="61" y1="57" x2="70" y2="66" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export default function TenderEmptyState({
  message,
  ctaLabel,
  onCta,
  icon,
}: TenderEmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        gap-4 py-16 px-6 text-center rounded-xl
        border border-dashed
        ${colorClasses.border.primary}
        ${colorClasses.bg.primary}
      `}
    >
      {/* Illustration zone */}
      <div className={colorClasses.text.secondary}>
        {icon ?? <DefaultIllustration />}
      </div>

      <p className={`text-sm max-w-xs leading-relaxed ${colorClasses.text.secondary}`}>
        {message}
      </p>

      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className={`
            mt-1 px-5 py-2 rounded-lg text-sm font-semibold
            transition-opacity hover:opacity-90 active:scale-95
            ${colorClasses.bg.darkNavy}
            text-white
          `}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
