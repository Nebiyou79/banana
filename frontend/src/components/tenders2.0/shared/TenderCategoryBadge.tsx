// src/components/tender/shared/TenderCategoryBadge.tsx
import { colorClasses } from '@/utils/color';

interface TenderCategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
};

export default function TenderCategoryBadge({
  category,
  size = 'md',
}: TenderCategoryBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-md font-medium
        ${sizeClasses[size]}
        ${colorClasses.bg.indigoLight}
        ${colorClasses.text.indigo}
      `}
    >
      {category}
    </span>
  );
}
