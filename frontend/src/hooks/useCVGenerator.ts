// src/hooks/useCVGenerator.ts
// Encapsulates all state, loading flags, and actions for the CV Generator page.

import { useState, useCallback, useRef } from 'react';
import { cvGeneratorService, CVTemplate, GeneratedCV } from '@/services/cvGeneratorService';
import { toast } from '@/hooks/use-toast';

export type GeneratorStep = 'select' | 'preview' | 'generate' | 'done';

export interface UseCVGeneratorReturn {
  // State
  step: GeneratorStep;
  templates: CVTemplate[];
  selectedTemplate: CVTemplate | null;
  previewHtml: string;
  generatedCV: GeneratedCV | null;
  generatedCVs: GeneratedCV[];
  isLoadingTemplates: boolean;
  isLoadingPreview: boolean;
  isGenerating: boolean;
  isRegenerating: boolean;
  isDownloading: boolean;
  previewError: string | null;
  generateError: string | null;

  // Actions
  loadTemplates: () => Promise<void>;
  selectTemplate: (template: CVTemplate) => void;
  loadPreview: (templateId: string) => Promise<void>;
  generateCV: (opts?: { description?: string; setAsPrimary?: boolean }) => Promise<void>;
  regenerateCV: (cvId: string, templateId: string) => Promise<void>;
  downloadCV: (cvId: string, filename?: string) => Promise<void>;
  loadGeneratedCVs: () => Promise<void>;
  goToStep: (step: GeneratorStep) => void;
  reset: () => void;
}

export function useCVGenerator(): UseCVGeneratorReturn {
  const [step, setStep]                   = useState<GeneratorStep>('select');
  const [templates, setTemplates]         = useState<CVTemplate[]>([]);
  const [selectedTemplate, setSelected]   = useState<CVTemplate | null>(null);
  const [previewHtml, setPreviewHtml]     = useState('');
  const [generatedCV, setGeneratedCV]     = useState<GeneratedCV | null>(null);
  const [generatedCVs, setGeneratedCVs]   = useState<GeneratedCV[]>([]);

  const [isLoadingTemplates, setLoadingTemplates] = useState(false);
  const [isLoadingPreview,   setLoadingPreview]   = useState(false);
  const [isGenerating,       setGenerating]       = useState(false);
  const [isRegenerating,     setRegenerating]     = useState(false);
  const [isDownloading,      setDownloading]      = useState(false);
  const [previewError,       setPreviewError]     = useState<string | null>(null);
  const [generateError,      setGenerateError]    = useState<string | null>(null);

  // Debounce preview requests
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load templates ──────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    if (isLoadingTemplates) return;
    setLoadingTemplates(true);
    try {
      const tpls = await cvGeneratorService.getTemplates();
      setTemplates(tpls);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Could not load CV templates.', variant: 'destructive' });
    } finally {
      setLoadingTemplates(false);
    }
  }, [isLoadingTemplates]);

  // ── Select template + trigger preview ──────────────────────
  const selectTemplate = useCallback((template: CVTemplate) => {
    setSelected(template);
    setPreviewError(null);
    // Debounce so rapid clicks don't hammer the server
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      loadPreview(template.id);
    }, 200);
  }, []);

  // ── Load HTML preview ──────────────────────────────────────
  const loadPreview = useCallback(async (templateId: string) => {
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const html = await cvGeneratorService.previewCV(templateId);
      setPreviewHtml(html);
      setStep('preview');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load preview';
      setPreviewError(msg);
      toast({ title: 'Preview Error', description: msg, variant: 'destructive' });
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  // ── Generate PDF ───────────────────────────────────────────
  const generateCV = useCallback(async (opts: { description?: string; setAsPrimary?: boolean } = {}) => {
    if (!selectedTemplate) {
      toast({ title: 'No Template', description: 'Please select a template first.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      const cv = await cvGeneratorService.generateCV({
        templateId: selectedTemplate.id,
        description: opts.description,
        setAsPrimary: opts.setAsPrimary ?? false,
      });
      setGeneratedCV(cv);
      setStep('done');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'CV generation failed';
      setGenerateError(msg);
      toast({ title: 'Generation Failed', description: msg, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }, [selectedTemplate]);

  // ── Regenerate ─────────────────────────────────────────────
  const regenerateCV = useCallback(async (cvId: string, templateId: string) => {
    setRegenerating(true);
    try {
      const cv = await cvGeneratorService.regenerateCV(cvId, { templateId });
      setGeneratedCV(cv);
      // Refresh list
      const list = await cvGeneratorService.listGeneratedCVs();
      setGeneratedCVs(list);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Regeneration failed', variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  }, []);

  // ── Download ───────────────────────────────────────────────
  const downloadCV = useCallback(async (cvId: string, filename?: string) => {
    setDownloading(true);
    try {
      await cvGeneratorService.downloadGeneratedCV(cvId, filename);
    } catch (err: any) {
      toast({ title: 'Download Error', description: 'Could not download the CV.', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  }, []);

  // ── Load generated CVs list ────────────────────────────────
  const loadGeneratedCVs = useCallback(async () => {
    try {
      const list = await cvGeneratorService.listGeneratedCVs();
      setGeneratedCVs(list);
    } catch (_) { /* silent */ }
  }, []);

  // ── Navigation ─────────────────────────────────────────────
  const goToStep = useCallback((s: GeneratorStep) => setStep(s), []);

  const reset = useCallback(() => {
    setStep('select');
    setSelected(null);
    setPreviewHtml('');
    setGeneratedCV(null);
    setPreviewError(null);
    setGenerateError(null);
  }, []);

  return {
    step, templates, selectedTemplate, previewHtml,
    generatedCV, generatedCVs,
    isLoadingTemplates, isLoadingPreview, isGenerating,
    isRegenerating, isDownloading,
    previewError, generateError,
    loadTemplates, selectTemplate, loadPreview,
    generateCV, regenerateCV, downloadCV,
    loadGeneratedCVs, goToStep, reset,
  };
}
