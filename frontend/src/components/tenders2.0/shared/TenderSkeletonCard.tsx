// src/components/tender/shared/TenderSkeletonCard.tsx
import { colorClasses } from '@/utils/color';

interface TenderSkeletonCardProps {
  count?: number;
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`rounded animate-pulse ${colorClasses.bg.secondary} ${className}`} />
  );
}

export function TenderSkeletonCard() {
  return (
    <div
      className={`
        rounded-xl border p-4 flex flex-col gap-3
        ${colorClasses.bg.primary}
        ${colorClasses.border.primary}
      `}
      style={{ minHeight: '200px' }}
      aria-hidden="true"
    >
      {/* Header row: avatar + title block */}
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <SkeletonBlock className="h-3.5 w-3/4" />
          <SkeletonBlock className="h-2.5 w-1/2" />
        </div>
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>

      {/* Title */}
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-5/6" />

      {/* Tags row */}
      <div className="flex gap-2">
        <SkeletonBlock className="h-5 w-20 rounded-md" />
        <SkeletonBlock className="h-5 w-16 rounded-md" />
        <SkeletonBlock className="h-5 w-24 rounded-md" />
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="h-3 w-20" />
      </div>
    </div>
  );
}

export function TenderSkeletonGrid({ count = 6 }: TenderSkeletonCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <TenderSkeletonCard key={i} />
      ))}
    </div>
  );
}

export default TenderSkeletonCard;
