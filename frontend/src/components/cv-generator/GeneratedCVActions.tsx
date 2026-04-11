// src/components/cv-generator/GeneratedCVActions.tsx
// Uses Tailwind colorClasses for proper dark/light mode + useResponsive for layout.

'use client';

import React, { useState } from 'react';
import { GeneratedCV, CVTemplate } from '@/services/cvGeneratorService';
import { colorClasses, colors } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';

interface Props {
  selectedTemplate: CVTemplate | null;
  generatedCV: GeneratedCV | null;
  isGenerating: boolean;
  isRegenerating: boolean;
  isDownloading: boolean;
  generateError: string | null;
  onGenerate: (opts: { description?: string; setAsPrimary?: boolean }) => void;
  onRegenerate: (cvId: string, templateId: string) => void;
  onDownload: (cvId: string, filename?: string) => void;
  onBack: () => void;
}

function fmtSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export const GeneratedCVActions: React.FC<Props> = ({
  selectedTemplate, generatedCV, isGenerating, isRegenerating,
  isDownloading, generateError, onGenerate, onRegenerate, onDownload, onBack,
}) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile  = breakpoint === 'mobile';
  const [desc, setDesc]       = useState('');
  const [primary, setPrimary] = useState(false);

  const accent = selectedTemplate?.primaryColor || colors.teal;

  // ── Button component ───────────────────────────────────────────────────────
  const Btn = ({
    onClick, label, loading = false, secondary = false, disabled = false,
  }: {
    onClick: () => void; label: string;
    loading?: boolean; secondary?: boolean; disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${getTouchTargetSize('md')}
        inline-flex items-center justify-center gap-2
        px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold
        transition-all duration-150 whitespace-nowrap
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.98] cursor-pointer'}
        ${secondary
          ? 'border-[1.5px] bg-transparent'
          : 'border-0 text-white'
        }
      `}
      style={secondary
        ? { borderColor: accent, color: accent }
        : { background: loading ? `${accent}cc` : accent }
      }
    >
      {loading && (
        <span
          className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
          style={{ borderColor: secondary ? `${accent} transparent ${accent} ${accent}` : 'rgba(255,255,255,0.4) transparent rgba(255,255,255,0.4) rgba(255,255,255,0.4)' }}
        />
      )}
      {label}
    </button>
  );

  // ── Metadata pill ──────────────────────────────────────────────────────────
  const Pill = ({ label, value }: { label: string; value: string }) => (
    <span className={`
      inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full
      bg-[#F5F5F5] dark:bg-[#333333] ${colorClasses.text.muted}
    `}>
      <span className={`font-bold ${colorClasses.text.secondary}`}>{label}:</span>
      {value}
    </span>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* ── PRE-GENERATE ─────────────────────────────────────────────────── */}
      {!generatedCV && (
        <div>
          <h3 className={`text-sm sm:text-base font-bold mb-1 ${colorClasses.text.primary}`}>
            Ready to generate
          </h3>
          <p className={`text-xs sm:text-sm mb-4 leading-relaxed ${colorClasses.text.muted}`}>
            Your profile data will be compiled into a{' '}
            <strong className={colorClasses.text.secondary}>
              {selectedTemplate?.name ?? 'selected'}
            </strong>{' '}
            PDF and automatically saved to your CV library.
          </p>

          {/* Label */}
          <div className="mb-3">
            <label className={`block text-xs font-semibold mb-1.5 ${colorClasses.text.secondary}`}>
              Label
              <span className={`font-normal ml-1 ${colorClasses.text.muted}`}>(optional)</span>
            </label>
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder='e.g. "Updated for PM roles"'
              maxLength={100}
              className={`
                w-full px-3 py-2 rounded-lg text-xs sm:text-sm outline-none transition-colors
                border ${colorClasses.border.secondary}
                bg-[#F9FAFB] dark:bg-[#1E2D3D]
                ${colorClasses.text.primary}
                placeholder:text-[#A0A0A0]
                focus:border-[${accent}]
              `}
              style={{ '--tw-ring-color': accent } as React.CSSProperties}
              onFocus={e => (e.currentTarget.style.borderColor = accent)}
              onBlur={e  => (e.currentTarget.style.borderColor = '')}
            />
          </div>

          {/* Primary toggle */}
          <label className={`flex items-center gap-2.5 cursor-pointer mb-4 select-none`}>
            <input
              type="checkbox"
              checked={primary}
              onChange={e => setPrimary(e.target.checked)}
              className="w-4 h-4 rounded flex-shrink-0"
              style={{ accentColor: accent }}
            />
            <span className={`text-xs sm:text-sm ${colorClasses.text.secondary}`}>
              Set as my primary CV
            </span>
          </label>

          {/* Error */}
          {generateError && (
            <div className="flex items-start gap-2 text-[#EF4444] bg-[#FEE2E2] dark:bg-[#7F1D1D] border border-[#EF4444]/30 rounded-lg px-3 py-2.5 mb-4">
              <span className="flex-shrink-0 text-sm">⚠</span>
              <span className="text-xs leading-relaxed">{generateError}</span>
            </div>
          )}

          {/* Buttons */}
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-row flex-wrap'}`}>
            <Btn label="← Back" onClick={onBack} secondary />
            <Btn
              label={isGenerating ? 'Generating…' : '⬇ Generate PDF'}
              onClick={() => onGenerate({ description: desc.trim() || undefined, setAsPrimary: primary })}
              loading={isGenerating}
            />
          </div>
        </div>
      )}

      {/* ── POST-GENERATE ─────────────────────────────────────────────────── */}
      {generatedCV && (
        <div>
          {/* Success banner */}
          <div
            className="flex items-start gap-3 rounded-xl p-4 mb-4 border"
            style={{
              background: `${accent}0e`,
              borderColor: `${accent}30`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: accent }}
            >✓</div>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${colorClasses.text.primary}`}>
                CV Generated!
              </p>
              <p className={`text-xs mt-0.5 truncate ${colorClasses.text.muted}`}>
                {generatedCV.originalName}
                {generatedCV.size ? ` · ${fmtSize(generatedCV.size)}` : ''}
              </p>
              <p className={`text-[10px] mt-0.5 ${colorClasses.text.muted}`}>
                {generatedCV.isPrimary ? '⭐ Primary CV' : 'Saved to your CV library'}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className={`flex gap-2 mb-4 ${isMobile ? 'flex-col' : 'flex-row flex-wrap'}`}>
            <Btn
              label={isDownloading ? 'Downloading…' : '⬇ Download PDF'}
              onClick={() => onDownload(generatedCV._id, generatedCV.originalName)}
              loading={isDownloading}
            />
            <Btn
              label={isRegenerating ? 'Regenerating…' : '↺ Regenerate'}
              onClick={() => selectedTemplate && onRegenerate(generatedCV._id, selectedTemplate.id)}
              loading={isRegenerating}
              secondary
            />
            <Btn label="← Templates" onClick={onBack} secondary />
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-1.5">
            <Pill label="Template" value={selectedTemplate?.name ?? generatedCV.templateId} />
            <Pill label="Format"   value="PDF" />
            {generatedCV.size && <Pill label="Size" value={fmtSize(generatedCV.size)} />}
            <Pill label="Created"  value={new Date(generatedCV.generatedAt).toLocaleDateString()} />
          </div>
        </div>
      )}
    </div>
  );
};