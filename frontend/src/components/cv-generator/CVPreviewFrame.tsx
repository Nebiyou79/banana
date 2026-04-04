// src/components/cv-generator/CVPreviewFrame.tsx
// Renders the server-generated HTML CV inside a sandboxed iframe.

import React, { useRef, useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { CVTemplate } from '@/services/cvGeneratorService';

interface Props {
  html: string;
  isLoading: boolean;
  error: string | null;
  selectedTemplate: CVTemplate | null;
  onReload?: () => void;
}

export const CVPreviewFrame: React.FC<Props> = ({
  html, isLoading, error, selectedTemplate, onReload
}) => {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameScale, setFrameScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scale iframe content so full A4 page fits the preview box
  useEffect(() => {
    const recalc = () => {
      if (!containerRef.current) return;
      const containerW = containerRef.current.clientWidth;
      const contentW   = 840; // base width of all templates
      const scale      = Math.min(1, (containerW - 2) / contentW);
      setFrameScale(scale);
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const frameH = isMobile ? 340 : 540;

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {/* Header bar */}
      {selectedTemplate && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px',
          background: selectedTemplate.thumbnailGradient,
          borderRadius: '10px 10px 0 0',
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
          }} />
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
          }} />
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
          }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginLeft: 8 }}>
            {selectedTemplate.name} — Live Preview
          </span>
          {onReload && (
            <button
              onClick={onReload}
              style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: 6, padding: '2px 10px',
                fontSize: 11, color: '#fff', cursor: 'pointer',
              }}
            >↺ Refresh</button>
          )}
        </div>
      )}

      {/* Preview container */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderTop: selectedTemplate ? 'none' : '1px solid #e5e7eb',
        borderRadius: selectedTemplate ? '0 0 10px 10px' : 10,
        overflow: 'hidden',
        height: frameH,
        background: '#f9fafb',
        position: 'relative',
      }}>
        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#f9fafb', zIndex: 10, gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: `3px solid ${selectedTemplate?.primaryColor || '#2AA198'}`,
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 13, color: '#6B7280' }}>Rendering preview…</span>
          </div>
        )}

        {error && !isLoading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10,
          }}>
            <div style={{ fontSize: 32 }}>⚠️</div>
            <p style={{ fontSize: 13, color: '#EF4444', maxWidth: 300, textAlign: 'center' }}>{error}</p>
            {onReload && (
              <button
                onClick={onReload}
                style={{
                  padding: '6px 16px', borderRadius: 6, border: '1px solid #EF4444',
                  background: 'transparent', color: '#EF4444', fontSize: 12, cursor: 'pointer',
                }}
              >Try again</button>
            )}
          </div>
        )}

        {html && !error && (
          <div style={{
            width: 840, height: Math.round(frameH / frameScale),
            transform: `scale(${frameScale})`,
            transformOrigin: 'top left',
            overflow: 'hidden',
          }}>
            <iframe
              ref={frameRef}
              srcDoc={html}
              sandbox="allow-same-origin"
              style={{ width: 840, height: Math.round(frameH / frameScale), border: 'none', display: 'block' }}
              title="CV Preview"
            />
          </div>
        )}

        {!html && !isLoading && !error && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <div style={{ fontSize: 48, opacity: 0.2 }}>📄</div>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Select a template to see your preview</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
