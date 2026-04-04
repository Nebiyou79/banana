// src/components/tender-dashboard/TenderPageHeader.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Sparkles, TrendingUp } from 'lucide-react';

interface ActionButton {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
}

interface TenderPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: ActionButton[];
  badge?: { label: string; color?: 'gold' | 'blue' | 'green' | 'red' };
  stats?: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral'; icon?: string }[];
}

const badgeStyles: Record<NonNullable<NonNullable<TenderPageHeaderProps['badge']>['color']>, { bg: string; text: string }> = {
  gold:  { bg: 'rgba(241,187,3,0.12)',  text: '#B8860B' },
  blue:  { bg: 'rgba(59,130,246,0.10)', text: '#2563EB' },
  green: { bg: 'rgba(16,185,129,0.10)', text: '#059669' },
  red:   { bg: 'rgba(239,68,68,0.10)',  text: '#DC2626' },
};

const TenderPageHeader: React.FC<TenderPageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions = [],
  badge,
  stats = [],
}) => {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const [mounted, setMounted] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getActionStyles = (variant: ActionButton['variant'] = 'ghost', isHovered: boolean) => {
    switch (variant) {
      case 'primary':
        return {
          background: isHovered ? '#D9A800' : '#F1BB03',
          color: '#0A2540',
          border: '1px solid transparent',
          boxShadow: isHovered ? '0 8px 20px rgba(241,187,3,0.35)' : '0 4px 12px rgba(241,187,3,0.20)',
          transform: isHovered ? 'translateY(-1px) scale(1.02)' : 'none',
        };
      case 'secondary':
        return {
          background: isHovered ? 'rgba(241,187,3,0.08)' : 'transparent',
          color: '#F1BB03',
          border: isHovered ? '1px solid rgba(241,187,3,0.60)' : '1px solid rgba(241,187,3,0.30)',
          transform: isHovered ? 'translateY(-1px)' : 'none',
        };
      default: // ghost
        return {
          background: isHovered ? 'rgba(241,187,3,0.06)' : 'transparent',
          color: isHovered ? '#F1BB03' : undefined,
          border: isHovered ? '1px solid rgba(241,187,3,0.25)' : '1px solid rgba(0,0,0,0.08)',
          transform: isHovered ? 'translateY(-1px)' : 'none',
        };
    }
  };

  const renderAction = (action: ActionButton, i: number) => {
    const isHovered = hoveredAction === i;
    const style: React.CSSProperties = {
      ...getActionStyles(action.variant, isHovered),
      transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
    };

    const cls = [
      'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold',
      isMobile ? `px-4 py-2.5 ${actions.length === 1 ? 'w-full' : ''}` : 'px-4 py-2',
    ].join(' ');

    const content = (
      <>
        {action.icon && <span className="w-4 h-4 flex items-center justify-center">{action.icon}</span>}
        {action.label}
      </>
    );

    return action.href ? (
      <Link
        key={i}
        href={action.href}
        className={cls}
        style={style}
        onMouseEnter={() => setHoveredAction(i)}
        onMouseLeave={() => setHoveredAction(null)}
      >
        {content}
      </Link>
    ) : (
      <button
        key={i}
        type="button"
        onClick={action.onClick}
        className={cls}
        style={style}
        onMouseEnter={() => setHoveredAction(i)}
        onMouseLeave={() => setHoveredAction(null)}
      >
        {content}
      </button>
    );
  };

  const badgeColor = badge?.color ?? 'gold';
  const badgeStyle = badgeStyles[badgeColor];

  return (
    <div
      className={`mb-5 sm:mb-6 ${colorClasses.bg.primary} rounded-2xl overflow-hidden`}
      style={{
        border: '1px solid rgba(241,187,3,0.10)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        animation: mounted ? 'headerIn 0.35s ease-out both' : 'none',
      }}
    >
      {/* Gold gradient accent bar */}
      <div
        className="h-[3px] w-full"
        style={{ background: 'linear-gradient(90deg, #F1BB03 0%, rgba(241,187,3,0.3) 70%, transparent 100%)' }}
      />

      <div className="px-4 sm:px-5 lg:px-6 py-4 sm:py-5">
        <div className={`flex gap-3 sm:gap-4 ${isMobile ? 'flex-col' : 'flex-row items-start justify-between'}`}>

          {/* Left: icon + title + subtitle + badge */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {icon && (
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                style={{
                  background: 'rgba(241,187,3,0.10)',
                  border: '1px solid rgba(241,187,3,0.20)',
                }}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={`font-black leading-tight ${colorClasses.text.primary} ${isMobile ? 'text-lg' : 'text-xl'}`}
                >
                  {title}
                </h1>
                {badge && (
                  <span
                    className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
                    style={{ background: badgeStyle.bg, color: badgeStyle.text }}
                  >
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    {badge.label}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className={`text-xs sm:text-sm ${colorClasses.text.muted} mt-1 leading-snug`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          {actions.length > 0 && (
            <div
              className={`flex items-center gap-2 flex-wrap shrink-0 ${isMobile && actions.length === 1 ? 'w-full' : ''}`}
            >
              {actions.map((action, i) => renderAction(action, i))}
            </div>
          )}
        </div>

        {/* Stats strip */}
        {stats.length > 0 && (
          <div
            className="flex flex-wrap gap-x-6 gap-y-3 mt-4 pt-4"
            style={{ borderTop: '1px solid rgba(241,187,3,0.08)' }}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                className="flex items-baseline gap-2 group"
                style={{ animation: mounted ? `statIn 0.4s ease-out ${i * 0.06}s both` : 'none' }}
              >
                {s.icon && <span className="text-base">{s.icon}</span>}
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-xl sm:text-2xl font-black ${colorClasses.text.primary} leading-none tabular-nums`}>
                      {s.value}
                    </span>
                    {s.trend && (
                      <TrendingUp
                        className="w-3.5 h-3.5"
                        style={{
                          color: s.trend === 'up' ? '#10B981' : s.trend === 'down' ? '#EF4444' : '#A0A0A0',
                          transform: s.trend === 'down' ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    )}
                  </div>
                  <span className={`text-[11px] ${colorClasses.text.muted}`}>{s.label}</span>
                </div>
                {i < stats.length - 1 && (
                  <div
                    className="self-stretch w-px ml-2"
                    style={{ background: 'rgba(241,187,3,0.10)', display: isMobile ? 'none' : 'block' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes headerIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes statIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TenderPageHeader;