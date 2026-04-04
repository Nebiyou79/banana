// src/components/cv-generator/GeneratedCVActions.tsx
// Action panel shown after preview: generate PDF, download, set as primary, regenerate.

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

function fmtSize(bytes: number) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

export const GeneratedCVActions: React.FC<Props> = ({
  selectedTemplate, generatedCV, isGenerating, isRegenerating,
  isDownloading, generateError, onGenerate, onRegenerate, onDownload, onBack,
}) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const [description, setDescription] = useState('');
  const [setAsPrimary, setAsPrimaryFlag] = useState(false);

  const accent = selectedTemplate?.primaryColor || '#2AA198';

  const ActionBtn = ({
    onClick, disabled, loading, label, secondary = false
  }: {
    onClick: () => void; disabled?: boolean; loading?: boolean;
    label: string; secondary?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={getTouchTargetSize('md')}
      style={{
        flex: isMobile ? '1 1 100%' : '1 1 auto',
        padding: '10px 20px',
        borderRadius: 8,
        border: secondary ? `1.5px solid ${accent}` : 'none',
        background: secondary ? 'transparent' : accent,
        color: secondary ? accent : '#fff',
        fontSize: 13, fontWeight: 700,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        transition: 'all 0.15s ease',
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: 14, height: 14, border: `2px solid ${secondary ? accent : 'rgba(255,255,255,0.5)'}`,
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite', display: 'inline-block',
          }} />
          {label}
        </>
      ) : label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Not yet generated ─────────────────────────────── */}
      {!generatedCV && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: isMobile ? 16 : 24,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A2540', marginBottom: 4 }}>
            Generate Your CV
          </h3>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>
            Your profile data will be baked into a{' '}
            <strong>{selectedTemplate?.name || 'selected'}</strong> PDF and saved to your CV library.
          </p>

          {/* Optional description */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              Label (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`e.g. "Updated for Product Manager roles"`}
              maxLength={120}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6,
                border: '1px solid #d1d5db', fontSize: 13,
                outline: 'none', background: '#fafafa',
              }}
            />
          </div>

          {/* Set as primary toggle */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontSize: 13, color: '#374151', marginBottom: 16,
          }}>
            <input
              type="checkbox"
              checked={setAsPrimary}
              onChange={e => setAsPrimaryFlag(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: accent }}
            />
            Set as my primary CV
          </label>

          {generateError && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5',
              borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#B91C1C', marginBottom: 12,
            }}>
              ⚠ {generateError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ActionBtn
              label="← Back to Templates"
              onClick={onBack}
              secondary
            />
            <ActionBtn
              label={isGenerating ? 'Generating PDF…' : '⬇ Generate & Save PDF'}
              onClick={() => onGenerate({ description: description.trim() || undefined, setAsPrimary })}
              loading={isGenerating}
            />
          </div>
        </div>
      )}

      {/* ── Generated successfully ─────────────────────────── */}
      {generatedCV && (
        <div>
          {/* Success banner */}
          <div style={{
            background: `${accent}12`,
            border: `1px solid ${accent}40`,
            borderRadius: 12,
            padding: isMobile ? 14 : 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            marginBottom: 16,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: accent, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>✓</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0A2540' }}>
                CV Generated Successfully!
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                {generatedCV.originalName} · {fmtSize(generatedCV.size)}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                {generatedCV.isPrimary ? '⭐ Set as primary CV' : 'Saved to your CV library'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ActionBtn
              label={isDownloading ? 'Downloading…' : '⬇ Download PDF'}
              onClick={() => onDownload(generatedCV._id, generatedCV.originalName)}
              loading={isDownloading}
            />
            <ActionBtn
              label={isRegenerating ? 'Regenerating…' : '↺ Regenerate'}
              onClick={() => selectedTemplate && onRegenerate(generatedCV._id, selectedTemplate.id)}
              loading={isRegenerating}
              secondary
            />
            <ActionBtn
              label="← Choose Different Template"
              onClick={onBack}
              secondary
            />
          </div>

          {/* CV metadata pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            {[
              { label: 'Template', value: selectedTemplate?.name || generatedCV.templateId },
              { label: 'Format', value: 'PDF' },
              { label: 'Size', value: fmtSize(generatedCV.size) },
              { label: 'Generated', value: new Date(generatedCV.generatedAt).toLocaleDateString() },
            ].map(p => (
              <span key={p.label} style={{
                fontSize: 11, background: '#f3f4f6',
                borderRadius: 20, padding: '3px 10px', color: '#6B7280',
              }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>{p.label}:</span> {p.value}
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};
