// src/pages/dashboard/candidate/CVGenerator/index.tsx
// Complete rewrite using Tailwind colorClasses for proper dark/light mode support
// and useResponsive for device-adaptive layouts.

'use client';

import React, { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useResponsive } from '@/hooks/useResponsive';
import { colorClasses, colors } from '@/utils/color';
import { useCVGenerator } from '@/hooks/useCVGenerator';
import { CVTemplate, GeneratedCV } from '@/services/cvGeneratorService';
import { TemplateSelector } from '@/components/cv-generator/TemplateSelector';
import { CVPreviewFrame } from '@/components/cv-generator/CVPreviewFrame';
import { GeneratedCVActions } from '@/components/cv-generator/GeneratedCVActions';
import { Button } from '@/components/ui/Button';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

// ─── Step bar ─────────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'select',   label: 'Template' },
  { key: 'preview',  label: 'Preview'  },
  { key: 'generate', label: 'Generate' },
  { key: 'done',     label: 'Download' },
];

function StepBar({ current }: { current: string }) {
  const idx = STEPS.findIndex(s => s.key === current);
  return (
    <div className="flex items-start mb-6 sm:mb-8">
      {STEPS.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={s.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              {/* Circle */}
              <div className={`
                w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center
                text-xs sm:text-sm font-bold transition-all duration-200
                ${done
                  ? 'bg-[#10B981] text-white border-2 border-[#10B981]'
                  : active
                  ? 'bg-[#0A2540] dark:bg-white text-white dark:text-[#0A2540] border-2 border-[#0A2540] dark:border-white'
                  : 'bg-transparent text-[#A0A0A0] border-2 border-[#E5E5E5] dark:border-[#4B5563]'
                }
              `}>
                {done ? '✓' : i + 1}
              </div>
              {/* Label — hidden on xs */}
              <span className={`
                hidden sm:block text-[10px] font-medium whitespace-nowrap transition-colors
                ${active
                  ? 'text-[#0A2540] dark:text-white font-bold'
                  : done
                  ? 'text-[#10B981]'
                  : 'text-[#A0A0A0]'
                }
              `}>{s.label}</span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className={`
                h-0.5 flex-1 max-w-[32px] sm:max-w-[48px] mb-4 sm:mb-5 transition-colors duration-300
                ${done ? 'bg-[#10B981]' : 'bg-[#E5E5E5] dark:bg-[#4B5563]'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Mini template grid (compact view after template selected) ──────────────
function MiniTemplatePicker({
  templates, selectedId, onSelect, onReset,
}: {
  templates: CVTemplate[];
  selectedId: string | null;
  onSelect: (t: CVTemplate) => void;
  onReset: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-bold ${colorClasses.text.primary}`}>Template</span>
        <button
          onClick={onReset}
          className={`text-xs font-bold ${colorClasses.text.teal} hover:underline bg-transparent border-none cursor-pointer`}
        >
          Change →
        </button>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {templates.map(tpl => {
          const sel = selectedId === tpl.id;
          return (
            <Button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              title={tpl.name}
              className={`
                rounded-md overflow-hidden cursor-pointer p-0 transition-all
                ${sel ? 'ring-2' : 'ring-1 ring-transparent hover:ring-1'}
              `}
            >
              <div
                className="h-6 flex items-center justify-center text-[11px] text-white font-bold"
                style={{ background: tpl.thumbnailGradient }}
              >
                {sel ? '✓' : ''}
              </div>
              <div className={`text-[7px] font-semibold truncate px-0.5 py-0.5 text-center ${colorClasses.text.muted}`}>
                {tpl.name.split(' ')[0]}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Previous generated CV row ────────────────────────────────────────────────
function PrevCVRow({
  cv, templates, onDownload, onRegenerate,
}: {
  cv: GeneratedCV;
  templates: CVTemplate[];
  onDownload: (id: string, name?: string) => void;
  onRegenerate: (id: string, tplId: string) => void;
}) {
  const tpl    = templates.find(t => t.id === cv.templateId);
  const accent = tpl?.primaryColor || colors.gray500;

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl border transition-colors
      ${colorClasses.bg.primary} ${colorClasses.border.secondary}
    `}>
      {/* Icon */}
      <div
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-base sm:text-lg flex-shrink-0"
        style={{ background: tpl?.thumbnailGradient || accent }}
      >📄</div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs sm:text-sm font-bold truncate ${colorClasses.text.primary}`}>
          {cv.originalName}
        </p>
        <p className={`text-[10px] sm:text-xs mt-0.5 ${colorClasses.text.muted}`}>
          {tpl?.name ?? cv.templateId}
          {' · '}
          {new Date(cv.generatedAt).toLocaleDateString()}
          {cv.isPrimary ? ' · ⭐' : ''}
          {cv.size ? ` · ${fmtSize(cv.size)}` : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onDownload(cv._id, cv.originalName)}
          className="px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border transition-colors"
          style={{ borderColor: accent, color: accent, background: 'transparent' }}
        >
          ⬇ PDF
        </button>
        <button
          onClick={() => onRegenerate(cv._id, cv.templateId)}
          className={`
            px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border transition-colors
            ${colorClasses.border.secondary} ${colorClasses.text.muted}
          `}
        >↺</button>
      </div>
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`
      rounded-2xl border p-4 sm:p-5 lg:p-6 transition-colors
      ${colorClasses.bg.primary} ${colorClasses.border.secondary}
      ${className}
    `}>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const CVGeneratorPage: React.FC = () => {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';

  const {
    step, templates, selectedTemplate,
    previewHtml, generatedCV, generatedCVs,
    isLoadingTemplates, isLoadingPreview, isGenerating,
    isRegenerating, isDownloading,
    previewError, generateError,
    loadTemplates, selectTemplate, loadPreview,
    generateCV, regenerateCV, downloadCV,
    loadGeneratedCVs, goToStep, reset,
  } = useCVGenerator();

  useEffect(() => {
    loadTemplates();
    loadGeneratedCVs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On desktop/tablet: show sidebar + preview side by side
  const showSplit = !isMobile && (step === 'preview' || step === 'generate' || step === 'done');

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="p-3 sm:p-4 lg:p-6 max-w-[1160px] mx-auto">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-5 sm:mb-7">
          <div>
            <h1 className={`text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight ${colorClasses.text.primary}`}>
              CV Generator
            </h1>
            <p className={`text-xs sm:text-sm mt-1 ${colorClasses.text.muted}`}>
              Build a polished PDF from your profile in seconds — 20 templates available
            </p>
          </div>
          {generatedCVs.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FEF3C7] dark:bg-[#78350F] text-[#92400E] dark:text-[#FCD34D] border border-[#F59E0B] dark:border-[#D97706] self-start sm:self-auto flex-shrink-0">
              ✦ {generatedCVs.length} generated
            </span>
          )}
        </div>

        {/* ── Step bar ────────────────────────────────────────────────────── */}
        <StepBar current={step} />

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div className={`
          ${showSplit
            ? isDesktop
              ? 'grid grid-cols-[360px_1fr] gap-5 items-start'
              : 'grid grid-cols-2 gap-4 items-start'
            : 'flex flex-col gap-4'
          }
        `}>

          {/* ── LEFT ────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Full template grid on select step */}
            {step === 'select' && (
              <Card>
                <h2 className={`text-base sm:text-lg font-bold mb-4 ${colorClasses.text.primary}`}>
                  Choose a Template
                </h2>
                <TemplateSelector
                  templates={templates}
                  selectedId={selectedTemplate?.id ?? null}
                  onSelect={selectTemplate}
                  isLoading={isLoadingTemplates}
                />
              </Card>
            )}

            {/* Compact switcher on preview/generate/done */}
            {(step === 'preview' || step === 'generate' || step === 'done') && (
              <Card>
                <MiniTemplatePicker
                  templates={templates}
                  selectedId={selectedTemplate?.id ?? null}
                  onSelect={selectTemplate}
                  onReset={reset}
                />
                {step === 'preview' && selectedTemplate && (
                  <button
                    onClick={() => goToStep('generate')}
                    className="w-full mt-4 py-2.5 sm:py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
                    style={{ background: selectedTemplate.primaryColor }}
                  >
                    Generate PDF →
                  </button>
                )}
              </Card>
            )}

            {/* Info tip on select step */}
            {step === 'select' && (
              <Card className="bg-[#FFFBEB] dark:bg-[#422006] border-[#F59E0B] dark:border-[#D97706]">
                <p className="text-xs font-bold text-[#92400E] dark:text-[#FCD34D] mb-2">💡 How it works</p>
                <ol className="text-xs text-[#B45309] dark:text-[#FDE68A] space-y-1 leading-relaxed list-none pl-0">
                  <li>1 · Pick any of the 20 templates</li>
                  <li>2 · Preview with your real data & avatar</li>
                  <li>3 · Generate & download as PDF</li>
                  <li>4 · Auto-saves to your CV library</li>
                </ol>
              </Card>
            )}
          </div>

          {/* ── RIGHT: preview + actions ─────────────────────────────────── */}
          {(step === 'preview' || step === 'generate' || step === 'done') && (
            <div className="flex flex-col gap-4">
              <Card className="p-2 sm:p-3">
                <CVPreviewFrame
                  html={previewHtml}
                  isLoading={isLoadingPreview}
                  error={previewError}
                  selectedTemplate={selectedTemplate}
                  onReload={() => selectedTemplate && loadPreview(selectedTemplate.id)}
                />
              </Card>

              {(step === 'generate' || step === 'done') && (
                <Card>
                  <GeneratedCVActions
                    selectedTemplate={selectedTemplate}
                    generatedCV={generatedCV}
                    isGenerating={isGenerating}
                    isRegenerating={isRegenerating}
                    isDownloading={isDownloading}
                    generateError={generateError}
                    onGenerate={generateCV}
                    onRegenerate={regenerateCV}
                    onDownload={downloadCV}
                    onBack={reset}
                  />
                </Card>
              )}
            </div>
          )}
        </div>

        {/* ── Previously generated CVs ─────────────────────────────────── */}
        {generatedCVs.length > 0 && step === 'select' && (
          <Card className="mt-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm sm:text-base font-bold ${colorClasses.text.primary}`}>
                Previously Generated
              </h2>
              <span className={`text-xs ${colorClasses.text.muted}`}>
                {generatedCVs.length}/10 slots
              </span>
            </div>

            {/* Slot usage bar */}
            <div className="h-1.5 rounded-full bg-[#E5E5E5] dark:bg-[#4B5563] mb-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(generatedCVs.length / 10) * 100}%`,
                  background: generatedCVs.length >= 9 ? colors.red : colors.goldenMustard,
                }}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              {generatedCVs.map(cv => (
                <PrevCVRow
                  key={cv._id}
                  cv={cv}
                  templates={templates}
                  onDownload={downloadCV}
                  onRegenerate={(id, tplId) => {
                    const tpl = templates.find(t => t.id === tplId);
                    if (tpl) selectTemplate(tpl);
                    regenerateCV(id, tplId);
                  }}
                />
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CVGeneratorPage;