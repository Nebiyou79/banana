// components/proposals/owner/OwnerNotesPanel.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  proposalId: string;
  initialNotes?: string;
  initialRating?: number;
  onSave: (notes: string, rating: number | null) => void;
  isSaving?: boolean;
}

const DEBOUNCE_MS = 2000;

export function OwnerNotesPanel({
  proposalId,
  initialNotes = '',
  initialRating,
  onSave,
  isSaving,
}: Props) {
  const [notes,  setNotes]  = useState(initialNotes);
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [hover,  setHover]  = useState<number | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Debounced auto-save triggered by notes/rating changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSave(notes, rating);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notes, rating]);

  const handleSaveNow = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onSave(notes, rating);
  };

  const displayStar = hover ?? rating ?? 0;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-amber-800">Private Notes</p>
          <p className="text-xs text-amber-600">Only visible to you — never shared with the freelancer.</p>
        </div>
        <span className="text-lg" aria-hidden="true">🔒</span>
      </div>

      {/* Notes textarea */}
      <div>
        <textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          placeholder="Add your private notes about this proposal…"
          className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
        />
        <p className="mt-1 text-right text-xs tabular-nums text-amber-500">
          {notes.length} / 1000
        </p>
      </div>

      {/* Star rating */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Your Rating</p>
        <div
          className="flex gap-1.5"
          onMouseLeave={() => setHover(null)}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(rating === s ? null : s)}
              onMouseEnter={() => setHover(s)}
              className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none"
              aria-label={`Rate ${s} out of 5`}
            >
              <svg
                className={`h-6 w-6 transition-colors ${s <= displayStar ? 'text-amber-400' : 'text-slate-200'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          {rating && (
            <button
              type="button"
              onClick={() => setRating(null)}
              className="ml-1 text-xs text-amber-500 underline-offset-2 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Save button + auto-save indicator */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-amber-600">
          {isSaving && 'Saving…'}
          {autoSaved && !isSaving && '✓ Saved'}
        </div>
        <button
          type="button"
          onClick={handleSaveNow}
          disabled={isSaving}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 transition-colors"
        >
          {isSaving ? 'Saving…' : 'Save Notes'}
        </button>
      </div>
    </div>
  );
}
