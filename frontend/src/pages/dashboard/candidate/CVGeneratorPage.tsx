// src/pages/CVGeneratorPage.tsx
// Full CV Generator page — template selection, preview, generate, download.
// Uses color.ts, useResponsive hook, and follows existing codebase conventions.

import React, { useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { useCVGenerator } from '@/hooks/useCVGenerator';
import { TemplateSelector } from '@/components/cv-generator/TemplateSelector';
import { CVPreviewFrame } from '@/components/cv-generator/CVPreviewFrame';
import { GeneratedCVActions } from '@/components/cv-generator/GeneratedCVActions';
import { GeneratedCV } from '@/services/cvGeneratorService';

// ── Step indicator ────────────────────────────────────────────
const STEPS = [
  { key: 'select',   label: '1. Choose Template' },
  { key: 'preview',  label: '2. Preview'          },
  { key: 'generate', label: '3. Generate'         },
  { key: 'done',     label: '4. Download'         },
];

function StepBar({ current }: { current: string }) {
  const idx = STEPS.findIndex(s => s.key === current);
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
      {STEPS.map((s, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const pending = i > idx;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? '#10B981' : active ? '#0A2540' : '#e5e7eb',
                color: (done || active) ? '#fff' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 400,
                color: active ? '#0A2540' : done ? '#10B981' : '#9ca3af',
                whiteSpace: 'nowrap',
              }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                height: 2, flex: 1, maxWidth: 40,
                background: done ? '#10B981' : '#e5e7eb',
                marginBottom: 20,
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Previous generated CVs card ───────────────────────────────
function PrevCVCard({ cv, onDownload, onRegenerate, templates }: {
  cv: GeneratedCV;
  onDownload: (id: string, name?: string) => void;
  onRegenerate: (id: string, tplId: string) => void;
  templates: { id: string; name: string; primaryColor: string }[];
}) {
  const tpl = templates.find(t => t.id === cv.templateId);
  const accent = tpl?.primaryColor || '#6B7280';

  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 10,
      padding: '12px 14px', background: '#fff',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 6,
        background: accent, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>📄</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0A2540', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {cv.originalName}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
          {tpl?.name || cv.templateId} · {new Date(cv.generatedAt).toLocaleDateString()}
          {cv.isPrimary ? ' · ⭐ Primary' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onDownload(cv._id, cv.originalName)}
          style={{
            padding: '4px 10px', borderRadius: 6, border: `1px solid ${accent}`,
            background: 'transparent', color: accent, fontSize: 11,
            fontWeight: 600, cursor: 'pointer',
          }}
        >↓ PDF</button>
        <button
          onClick={() => onRegenerate(cv._id, cv.templateId)}
          style={{
            padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb',
            background: 'transparent', color: '#6B7280', fontSize: 11,
            fontWeight: 600, cursor: 'pointer',
          }}
        >↺</button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
const CVGeneratorPage: React.FC = () => {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

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
  }, []);

  // On step change to 'generate', show the action panel
  const handleGoGenerate = () => goToStep('generate');

  const showSplit = !isMobile && (step === 'preview' || step === 'generate' || step === 'done');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: isMobile ? '16px 12px' : '28px 24px',
    }}>
      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: isMobile ? 22 : 28, fontWeight: 800,
            color: '#0A2540', lineHeight: 1.2,
          }}>CV Generator</h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            Build a polished PDF CV from your profile in seconds.
          </p>
        </div>

        <StepBar current={step} />

        {/* ── Main content area ───────────────────────────────── */}
        <div style={{
          display: showSplit ? 'grid' : 'block',
          gridTemplateColumns: showSplit ? (isTablet ? '1fr 1fr' : '420px 1fr') : undefined,
          gap: 24,
          alignItems: 'start',
        }}>

          {/* LEFT: Template selector (always shown on select; collapsed to sidebar on preview+) */}
          <div>
            {/* Always show template selector on 'select' step */}
            {step === 'select' && (
              <div style={{
                background: '#fff', borderRadius: 14,
                border: '1px solid #e5e7eb', padding: isMobile ? 16 : 24,
                marginBottom: 16,
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A2540', marginBottom: 14 }}>
                  Choose a Template
                </h2>
                <TemplateSelector
                  templates={templates}
                  selectedId={selectedTemplate?.id || null}
                  onSelect={(tpl) => { selectTemplate(tpl); }}
                  isLoading={isLoadingTemplates}
                />
              </div>
            )}

            {/* On preview/generate/done steps — show compact template re-selector */}
            {(step === 'preview' || step === 'generate' || step === 'done') && (
              <div style={{
                background: '#fff', borderRadius: 14,
                border: '1px solid #e5e7eb', padding: isMobile ? 12 : 18,
                marginBottom: isMobile ? 12 : 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0A2540' }}>Template</h2>
                  <button
                    onClick={reset}
                    style={{
                      fontSize: 11, color: '#2AA198', background: 'none',
                      border: 'none', cursor: 'pointer', fontWeight: 600,
                    }}
                  >Change →</button>
                </div>

                {/* Mini template grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)',
                  gap: 6,
                }}>
                  {templates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => selectTemplate(tpl)}
                      title={tpl.name}
                      style={{
                        border: selectedTemplate?.id === tpl.id
                          ? `2px solid ${tpl.primaryColor}`
                          : '2px solid transparent',
                        borderRadius: 6, padding: 0, cursor: 'pointer',
                        overflow: 'hidden', background: 'transparent',
                      }}
                    >
                      <div style={{
                        background: tpl.thumbnailGradient, height: 30,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13,
                      }}>
                        {selectedTemplate?.id === tpl.id ? '✓' : ''}
                      </div>
                      <div style={{
                        fontSize: 8, fontWeight: 600, color: '#6B7280',
                        padding: '2px 2px', textAlign: 'center',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{tpl.name}</div>
                    </button>
                  ))}
                </div>

                {/* Generate button shortcut */}
                {step === 'preview' && selectedTemplate && (
                  <button
                    onClick={handleGoGenerate}
                    style={{
                      width: '100%', marginTop: 14,
                      padding: '10px 0', borderRadius: 8,
                      background: selectedTemplate.primaryColor,
                      color: '#fff', border: 'none',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    ↓ Generate PDF →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Preview + Actions */}
          {(step === 'preview' || step === 'generate' || step === 'done') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Preview frame */}
              <div style={{
                background: '#fff', borderRadius: 14,
                border: '1px solid #e5e7eb', padding: isMobile ? 10 : 16,
              }}>
                <CVPreviewFrame
                  html={previewHtml}
                  isLoading={isLoadingPreview}
                  error={previewError}
                  selectedTemplate={selectedTemplate}
                  onReload={() => selectedTemplate && loadPreview(selectedTemplate.id)}
                />
              </div>

              {/* Actions panel (generate/download) */}
              {(step === 'generate' || step === 'done') && (
                <div style={{
                  background: '#fff', borderRadius: 14,
                  border: '1px solid #e5e7eb', padding: isMobile ? 14 : 20,
                }}>
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
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Previously generated CVs ──────────────────────── */}
        {generatedCVs.length > 0 && step === 'select' && (
          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid #e5e7eb', padding: isMobile ? 14 : 22,
            marginTop: 24,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0A2540', marginBottom: 14 }}>
              Previously Generated CVs
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {generatedCVs.map(cv => (
                <PrevCVCard
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
          </div>
        )}
      </div>
    </div>
  );
};

export default CVGeneratorPage;
