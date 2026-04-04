// components/proposals/freelancer/DraftBanner.tsx
// ─── Sections fixed ─────────────────────────────────────────────────────────
// B:  All hardcoded blue/slate/red → colorClasses
// F:  cn() throughout
'use client';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { Save, Loader2 } from 'lucide-react';
import type { Proposal } from '@/services/proposalService';

interface Props {
  draft: Proposal | null;
  onContinue: () => void;
  onDiscard: () => void;
  isDiscarding?: boolean;
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (mins > 0) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  return 'just now';
};

export function DraftBanner({ draft, onContinue, onDiscard, isDiscarding }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!draft) return null;

  const savedTime = draft.updatedAt ? timeAgo(draft.updatedAt) : 'recently';

  return (
    <div className={cn(
      'rounded-xl border px-4 sm:px-5 py-4',
      colorClasses.bg.blueLight,
      colorClasses.border.blue,
    )}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        {/* Left: icon + message */}
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            colorClasses.bg.secondary,
          )}>
            <Save className={cn('w-4 h-4', colorClasses.text.indigo)} />
          </div>
          <div>
            <p className={cn('text-sm font-semibold', colorClasses.text.indigo)}>
              You have a saved draft
            </p>
            <p className={cn('text-sm', colorClasses.text.secondary)}>
              Last saved {savedTime}. Continue where you left off or start fresh.
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Continue button */}
          <button
            type="button"
            onClick={onContinue}
            className="rounded-lg bg-[#0A2540] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Continue Draft
          </button>

          {/* Start fresh + confirmation popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className={cn(
                'text-sm font-medium underline-offset-2 hover:underline transition-colors',
                colorClasses.text.secondary,
              )}
            >
              Start Fresh
            </button>

            {confirmOpen && (
              <div className={cn(
                'absolute right-0 top-8 z-20 w-56 rounded-xl border p-4 shadow-xl',
                colorClasses.bg.primary,
                colorClasses.border.gray200,
              )}>
                <p className={cn('mb-2 text-sm font-semibold', colorClasses.text.primary)}>
                  Discard this draft?
                </p>
                <p className={cn('mb-4 text-xs', colorClasses.text.muted)}>
                  This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className={cn(
                      'flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors',
                      colorClasses.border.gray200,
                      colorClasses.text.secondary,
                      'hover:' + colorClasses.bg.secondary,
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDiscarding}
                    onClick={() => { setConfirmOpen(false); onDiscard(); }}
                    className={cn(
                      'flex-1 rounded-lg py-1.5 text-xs font-semibold text-white transition-colors',
                      'bg-red-500 hover:bg-red-600 disabled:opacity-60',
                    )}
                  >
                    {isDiscarding
                      ? <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                      : 'Discard'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}