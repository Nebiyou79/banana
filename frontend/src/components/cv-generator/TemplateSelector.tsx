// src/components/cv-generator/TemplateSelector.tsx
// Grid of template cards. Clicking one selects and triggers preview.

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
  classic:      '🏛️',
  modern:       '✦',
  creative:     '🎨',
  professional: '💼',
  elegant:      '✒️',
  tech:         '⌨️',
  infographic:  '📊',
  compact:      '📄',
  academic:     '🎓',
  freelancer:   '🚀',
};

export const TemplateSelector: React.FC<Props> = ({
  templates, selectedId, onSelect, isLoading
}) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            borderRadius: 12,
            background: '#f3f4f6',
            height: isMobile ? 120 : 160,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
        Choose a design — your profile data will fill it automatically.
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: isMobile ? 10 : 16,
      }}>
        {templates.map(tpl => {
          const isSelected = tpl.id === selectedId;
          return (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className={getTouchTargetSize('md')}
              style={{
                border: isSelected ? `3px solid ${tpl.primaryColor}` : '2px solid #e5e7eb',
                borderRadius: 12,
                padding: 0,
                background: '#fff',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.18s ease',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected
                  ? `0 4px 20px ${tpl.primaryColor}40`
                  : '0 1px 4px rgba(0,0,0,0.08)',
                textAlign: 'left',
              }}
            >
              {/* Thumbnail gradient swatch */}
              <div style={{
                background: tpl.thumbnailGradient,
                height: isMobile ? 70 : 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? 24 : 32,
                position: 'relative',
              }}>
                {STYLE_ICONS[tpl.style] || '📄'}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#fff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 13,
                  }}>✓</div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: isMobile ? '8px 10px' : '10px 14px' }}>
                <div style={{
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 700,
                  color: isSelected ? tpl.primaryColor : '#0A2540',
                  marginBottom: 2,
                }}>{tpl.name}</div>
                {!isMobile && (
                  <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>
                    {tpl.description.length > 60 ? `${tpl.description.slice(0, 60)}…` : tpl.description}
                  </div>
                )}
                <div style={{
                  marginTop: 6,
                  display: 'inline-block',
                  fontSize: 10,
                  fontWeight: 600,
                  color: tpl.primaryColor,
                  background: `${tpl.primaryColor}18`,
                  padding: '2px 7px',
                  borderRadius: 20,
                  textTransform: 'capitalize',
                }}>{tpl.style}</div>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%,100%{opacity:1} 50%{opacity:0.5}
        }
      `}</style>
    </div>
  );
};
