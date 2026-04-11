/**
 * src/hooks/useCvGenerator.ts
 * React Query hooks for the CV Generator feature.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Sharing from 'expo-sharing';
import { cvGeneratorService, GenerateCVPayload } from '../services/cvGeneratorService';
import toast from '../lib/toast';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const CV_KEYS = {
  templates:  ['cv', 'templates'] as const,
  generated:  ['cv', 'generated'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all available CV templates. Templates rarely change — long stale time. */
export const useTemplates = () =>
  useQuery({
    queryKey: CV_KEYS.templates,
    queryFn:  cvGeneratorService.getTemplates,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

/** Fetch user's list of previously generated CVs. */
export const useGeneratedCVs = () =>
  useQuery({
    queryKey: CV_KEYS.generated,
    queryFn:  cvGeneratorService.listGeneratedCVs,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Generate a brand-new PDF CV.
 * ⚠️  SLOW mutation — show a full-screen blocking overlay.
 *     The caller should check `generateCV.isPending` and render a Modal.
 */
export const useGenerateCV = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateCVPayload) => cvGeneratorService.generateCV(payload),
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
 * Also slow — show the same blocking overlay.
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
 * Download a generated CV to device and immediately open the system share sheet.
 *
 * Flow:
 *   1. Download binary PDF via expo-file-system → local URI
 *   2. Open expo-sharing share sheet for that URI
 *   3. User can save to Files, send via WhatsApp, email, etc.
 */
export const useDownloadCV = () =>
  useMutation({
    mutationFn: ({ cvId, fileName }: { cvId: string; fileName?: string }) =>
      cvGeneratorService.downloadCVToDevice(cvId, fileName),
    onSuccess: async (localUri: string) => {
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(localUri, {
            mimeType:    'application/pdf',
            dialogTitle: 'Share or Save your CV',
            UTI:         'com.adobe.pdf',
          });
        } else {
          toast.info('CV saved to your device storage.');
        }
      } catch {
        // Sharing was cancelled — not an error
      }
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to download CV. Check your connection.');
    },
  });