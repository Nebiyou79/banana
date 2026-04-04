// components/proposals/freelancer/CoverLetterEditor.tsx
'use client';
import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import type { AutoSaveState } from '@/hooks/useProposal';

const QuillEditor = dynamic(
  () => import('react-quill').then((m) => m.default),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-slate-100" /> }
);

// Only import CSS on client side
if (typeof window !== 'undefined') {
  import('react-quill/dist/quill.snow.css');
}

interface Props {
  value: string;
  htmlValue: string;
  onChange: (text: string, html: string) => void;
  saveState?: AutoSaveState;
  minLength?: number;
  maxLength?: number;
}

const TOOLBAR = [
  ['bold', 'italic', 'underline'],
  [{ list: 'bullet' }, { list: 'ordered' }],
  ['link'],
  ['clean'],
];

const SAVE_INDICATOR: Record<AutoSaveState, { label: string; classes: string }> = {
  idle:   { label: 'Unsaved',      classes: 'text-slate-400' },
  saving: { label: 'Saving…',      classes: 'text-amber-500 animate-pulse' },
  saved:  { label: '✓ Saved',      classes: 'text-emerald-600' },
  error:  { label: 'Save failed',  classes: 'text-red-500' },
};

export function CoverLetterEditor({
  value,
  htmlValue,
  onChange,
  saveState = 'idle',
  minLength = 50,
  maxLength = 5000,
}: Props) {
  const len    = value.length;
  const tooShort = len > 0 && len < minLength;
  const tooLong  = len > maxLength;
  const indicator = SAVE_INDICATOR[saveState];

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">
          Cover Letter <span className="text-red-500">*</span>
        </label>
        <span className={`text-xs font-medium ${indicator.classes}`}>
          {indicator.label}
        </span>
      </div>

      {/* Quill editor */}
      <div className={`overflow-hidden rounded-lg border transition-colors ${tooShort || tooLong ? 'border-red-300' : 'border-slate-200 focus-within:border-indigo-400'}`}>
        <QuillEditor
          value={htmlValue}
          onChange={(html, _delta, _src, editor) => {
            onChange(editor.getText().trim(), html);
          }}
          modules={{ toolbar: TOOLBAR }}
          formats={['bold', 'italic', 'underline', 'list', 'bullet', 'link']}
          theme="snow"
          placeholder="Introduce yourself and explain why you're the best fit for this project…"
        />
      </div>

      {/* Character counter */}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          {tooShort && (
            <p className="text-xs text-red-500">Minimum {minLength} characters required.</p>
          )}
          {tooLong && (
            <p className="text-xs text-red-500">Maximum {maxLength} characters exceeded.</p>
          )}
        </div>
        <span className={`text-xs tabular-nums ${tooLong ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
          {len.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
