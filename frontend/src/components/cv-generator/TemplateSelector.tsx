// src/components/cv-generator/TemplateSelector.tsx
// Uses Tailwind colorClasses for dark/light mode, useResponsive for grid layout.

'use client';

import React from 'react';
import { CVTemplate } from '@/services/cvGeneratorService';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';

interface Props {
  templates: CVTemplate[];
  selectedId: string | null;
  onSelect: (template: CVTemplate) => void;
  isLoading: boolean;
}

const STYLE_ICONS: Record<string, string> = {
  classic: '🏛️', modern: '✦', creative: '🎨', professional: '💼',
  elegant: '✒️', tech: '⌨️', infographic: '📊', compact: '📄',
  academic: '🎓', freelancer: '🚀', startup: '🌟', minimal: '◻',
  geometric: '⬡', timeline: '📅', nordic: '❄️', impact: '💥',
  retro: '📻', healthcare: '⚕️', magazine: '📰', glass: '💎',
};

// Skeleton placeholder
function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden animate-pulse">
      <div className="h-16 sm:h-20 bg-[#E5E5E5] dark:bg-[#4B5563]" />
      <div className="p-2 sm:p-3 bg-[#F5F5F5] dark:bg-[#333333]">
        <div className="h-2.5 bg-[#D1D5DB] dark:bg-[#6B7280] rounded mb-2 w-3/4" />
        <div className="h-2 bg-[#E5E5E5] dark:bg-[#4B5563] rounded w-1/2" />
      </div>
    </div>
  );
}

export const TemplateSelector: React.FC<Props> = ({
  templates, selectedId, onSelect, isLoading,
}) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  // Responsive grid columns
  const gridCols = isMobile
    ? 'grid-cols-2'
    : isTablet
    ? 'grid-cols-3'
    : 'grid-cols-4';

  if (isLoading) {
    return (
      <>
        <p className={`text-xs mb-3 ${colorClasses.text.muted}`}>Loading templates…</p>
        <div className={`grid ${gridCols} gap-2.5 sm:gap-3`}>
          {Array.from({ length: isMobile ? 6 : 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </>
    );
  }

  return (
    <div>
      <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${colorClasses.text.muted}`}>
        {templates.length} designs available · your profile data fills each one automatically
      </p>

      <div className={`grid ${gridCols} gap-2.5 sm:gap-3`}>
        {templates.map(tpl => {
          const isSelected = tpl.id === selectedId;
          return (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              aria-pressed={isSelected}
              aria-label={`Select ${tpl.name} template`}
              className={`
                ${getTouchTargetSize('sm')}
                flex flex-col rounded-xl overflow-hidden cursor-pointer
                border-2 transition-all duration-150 text-left
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                ${isSelected
                  ? 'scale-[1.03] shadow-lg'
                  : 'border-[#E5E5E5] dark:border-[#4B5563] hover:border-[#A0A0A0] dark:hover:border-[#6B7280] hover:shadow-md'
                }
              `}
              style={isSelected ? {
                borderColor: tpl.primaryColor,
                boxShadow: `0 4px 18px ${tpl.primaryColor}30`,
              } : {}}
            >
              {/* Gradient thumbnail */}
              <div
                className="relative flex items-center justify-center flex-shrink-0"
                style={{
                  background: tpl.thumbnailGradient,
                  height: isMobile ? 60 : 80,
                  fontSize: isMobile ? 20 : 26,
                }}
              >
                <span role="img" aria-hidden="true">{STYLE_ICONS[tpl.style] ?? '📄'}</span>

                {/* Selected badge */}
                {isSelected && (
                  <div
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold shadow"
                    style={{ color: tpl.primaryColor }}
                  >✓</div>
                )}
              </div>

              {/* Info */}
              <div className={`flex-1 p-2 sm:p-2.5 ${colorClasses.bg.primary}`}>
                <p
                  className="text-[11px] sm:text-xs font-bold leading-snug mb-1"
                  style={{ color: isSelected ? tpl.primaryColor : undefined }}
                >
                  {!isSelected && <span className={colorClasses.text.primary}>{tpl.name}</span>}
                  {isSelected && tpl.name}
                </p>

                {/* Description — only on tablet/desktop */}
                {!isMobile && (
                  <p className={`text-[10px] leading-snug line-clamp-2 mb-1.5 ${colorClasses.text.muted}`}>
                    {tpl.description}
                  </p>
                )}

                {/* Style badge */}
                <span
                  className="inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                  style={{
                    color: tpl.primaryColor,
                    background: `${tpl.primaryColor}18`,
                  }}
                >{tpl.style}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};