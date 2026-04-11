// src/components/cv-generator/CVPreviewFrame.tsx
// Blob URL approach avoids sandbox script-blocking.
// Uses Tailwind colorClasses for dark/light mode.

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { CVTemplate } from '@/services/cvGeneratorService';
import { colorClasses } from '@/utils/color';

interface Props {
  html: string;
  isLoading: boolean;
  error: string | null;
  selectedTemplate: CVTemplate | null;
  onReload?: () => void;
}

/** Remove external font imports before putting HTML in iframe */
function makeSafe(html: string): string {
  return html
    .replace(/@import\s+url\([^)]*\)[^;]*;?\s*/gi, '')
    .replace(/<link[^>]+fonts\.googleapis[^>]*>/gi, '')
    .replace(/<link[^>]+fonts\.gstatic[^>]*>/gi, '');
}

export const CVPreviewFrame: React.FC<Props> = ({
  html, isLoading, error, selectedTemplate, onReload,
}) => {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef    = useRef<HTMLIFrameElement>(null);
  const blobUrlRef   = useRef<string | null>(null);
  const [scale, setScale] = useState(1);

  // Responsive scale: A4 is 840px wide
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const calc = () => setScale(Math.min(1, (el.clientWidth - 2) / 840));
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Create blob URL when HTML changes
  useEffect(() => {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    if (!html) return;
    const blob    = new Blob([makeSafe(html)], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    blobUrlRef.current = blobUrl;
    if (iframeRef.current) iframeRef.current.src = blobUrl;
    return () => { URL.revokeObjectURL(blobUrl); blobUrlRef.current = null; };
  }, [html]);

  const frameH = isMobile ? 280 : isTablet ? 400 : 520;
  const accent = selectedTemplate?.primaryColor ?? '#2AA198';

  return (
    <div ref={containerRef} className="w-full">

      {/* Browser chrome bar */}
      {selectedTemplate && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-t-xl"
          style={{ background: selectedTemplate.thumbnailGradient }}
        >
          {/* Traffic dots */}
          {[0.55, 0.35, 0.22].map((op, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: `rgba(255,255,255,${op})` }}
            />
          ))}
          <span className="text-[10px] text-white/90 font-medium ml-1 flex-1 truncate">
            {selectedTemplate.name} — Preview
          </span>
          {onReload && (
            <button
              onClick={onReload}
              className="text-[10px] text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
            >
              ↺ Reload
            </button>
          )}
        </div>
      )}

      {/* Viewport */}
      <div
        className={`
          relative overflow-hidden border
          ${selectedTemplate ? 'rounded-b-xl border-t-0' : 'rounded-xl'}
          ${colorClasses.bg.gray50} ${colorClasses.border.secondary}
        `}
        style={{ height: frameH }}
      >
        {/* Loading */}
        {isLoading && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 ${colorClasses.bg.gray50}`}>
            <div
              className="w-9 h-9 rounded-full border-[3px] border-t-transparent animate-spin"
              style={{ borderColor: `${accent} transparent ${accent} ${accent}` }}
            />
            <span className={`text-xs ${colorClasses.text.muted}`}>Rendering preview…</span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            <span className="text-2xl">⚠️</span>
            <p className="text-xs text-[#EF4444] text-center max-w-[240px] leading-relaxed">{error}</p>
            {onReload && (
              <button
                onClick={onReload}
                className="text-xs font-semibold px-4 py-1.5 rounded-lg border border-[#EF4444] text-[#EF4444] hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D] transition-colors"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* iframe — blob URL avoids sandbox script-blocking */}
        {html && !error && (
          <div
            style={{
              width: 840,
              height: Math.ceil(frameH / scale),
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              overflow: 'hidden',
            }}
          >
            <iframe
              ref={iframeRef}
              sandbox="allow-same-origin allow-scripts"
              className="block border-none"
              style={{ width: 840, height: Math.ceil(frameH / scale) }}
              title="CV Preview"
            />
          </div>
        )}

        {/* Empty state */}
        {!html && !isLoading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-4xl opacity-10">📄</span>
            <p className={`text-xs ${colorClasses.text.muted}`}>Select a template to preview</p>
          </div>
        )}
      </div>
    </div>
  );
};