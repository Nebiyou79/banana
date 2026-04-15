/**
 * src/hooks/useCvGenerator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * React Query hooks for the CV Generator module.
 * Parity: mirrors web useCVGenerator.ts logic — same loading flags, error
 * handling, and optimistic invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Sharing from 'expo-sharing';
import {
  cvGeneratorService,
  GenerateCVPayload,
} from '../services/cvGeneratorService';
import toast from '../lib/toast';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const CV_KEYS = {
  templates: ['cv', 'templates']  as const,
  generated: ['cv', 'generated']  as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** All available CV templates. Templates rarely change — 1-hour stale. */
export const useTemplates = () =>
  useQuery({
    queryKey: CV_KEYS.templates,
    queryFn:  cvGeneratorService.getTemplates,
    staleTime: 60 * 60 * 1000,
  });

/** User's list of previously generated CVs. */
export const useGeneratedCVs = () =>
  useQuery({
    queryKey: CV_KEYS.generated,
    queryFn:  cvGeneratorService.listGeneratedCVs,
    staleTime: 2 * 60 * 1000,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Generate a brand-new PDF CV.
 * ⚠️  SLOW — show a full-screen blocking overlay (isPending check).
 * Mirrors web generateCV() — same GenerateCVPayload shape.
 */
export const useGenerateCV = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateCVPayload) =>
      cvGeneratorService.generateCV(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CV_KEYS.generated });
      toast.success('CV generated and saved to your library!');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'CV generation failed. Please try again.');
    },
  });
};

/**
 * Regenerate an existing CV (same or new template).
 * Mirrors web regenerateCV().
 */
export const useRegenerateCV = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cvId, templateId }: { cvId: string; templateId: string }) =>
      cvGeneratorService.regenerateCV(cvId, templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CV_KEYS.generated });
      toast.success('CV regenerated successfully!');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Regeneration failed. Please try again.');
    },
  });
};

/**
 * Download CV to device then open system share sheet.
 * Flow: download binary → expo-sharing share sheet.
 */
export const useDownloadCV = () =>
  useMutation({
    mutationFn: ({ cvId, fileName }: { cvId: string; fileName?: string }) =>
      cvGeneratorService.downloadCVToDevice(cvId, fileName),
    onSuccess: async (localUri: string) => {
      try {
        const available = await Sharing.isAvailableAsync();
        if (available) {
          await Sharing.shareAsync(localUri, {
            mimeType:    'application/pdf',
            dialogTitle: 'Share or Save your CV',
            UTI:         'com.adobe.pdf',
          });
        } else {
          toast.info('CV saved to your device storage.');
        }
      } catch {
        // Share sheet was dismissed — not an error
      }
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to download CV. Check your connection.');
    },
  });
