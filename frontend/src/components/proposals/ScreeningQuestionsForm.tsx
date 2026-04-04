// components/proposals/freelancer/ScreeningQuestionsForm.tsx
// ─── Sections fixed ─────────────────────────────────────────────────────────
// B:  All hardcoded slate/indigo → colorClasses
// C-03 (BUG-03): Live character count per textarea via charCounts state
// C-11: inputCls with #F1BB03 focus ring
// F:  No "any", cn() throughout, typed errors
'use client';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import type { UseFieldArrayReturn, UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CreateProposalData, ProposalScreeningAnswer } from '@/services/proposalService';

interface Question { question: string; required: boolean }

interface Props {
  questions: Question[];
  fields: UseFieldArrayReturn<CreateProposalData, 'screeningAnswers'>['fields'];
  register: UseFormRegister<CreateProposalData>;
  errors: FieldErrors<CreateProposalData>;
}

const MAX_CHARS = 2000;

const inputCls = (hasError: boolean) => cn(
  'w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-150',
  colorClasses.bg.primary,
  colorClasses.border.gray200,
  colorClasses.text.primary,
  'placeholder:text-[#A0A0A0] dark:placeholder:text-[#6B7280]',
  'focus:ring-2 focus:ring-[#F1BB03]/40 focus:border-[#F1BB03]',
  hasError && cn(colorClasses.bg.redLight, 'border-red-400'),
);

export function ScreeningQuestionsForm({ questions, fields, register, errors }: Props) {
  if (!questions || questions.length === 0) return null;

  // C-03: per-question character counts
  const [charCounts, setCharCounts] = useState<number[]>(() => questions.map(() => 0));

  const updateCount = (i: number, val: string) => {
    setCharCounts((prev) => {
      const next = [...prev];
      next[i] = val.length;
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <p className={cn('text-xs', colorClasses.text.muted)}>
        {questions.length} question{questions.length !== 1 ? 's' : ''} — answer thoroughly to stand out
      </p>

      {fields.map((field, i) => {
        const q = questions[i];
        if (!q) return null;

        // Typed error access
        const screeningErrs = errors.screeningAnswers as
          | (FieldErrors<ProposalScreeningAnswer> | undefined)[]
          | undefined;
        const fieldErr = screeningErrs?.[i]?.answer;

        const count = charCounts[i] ?? 0;
        const isOverLimit = count > MAX_CHARS;
        const isNearLimit = count > MAX_CHARS * 0.9;

        return (
          <div
            key={field.id}
            className={cn(
              'rounded-xl border p-4 space-y-2.5',
              colorClasses.bg.secondary,
              colorClasses.border.gray200,
            )}
          >
            {/* Question label */}
            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F1BB03]/20 text-[#F1BB03] text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <label className={cn('block text-sm font-medium', colorClasses.text.primary)}>
                {q.question}
                {q.required && <span className={cn('ml-1', colorClasses.text.red)}>*</span>}
              </label>
            </div>

            {/* Hidden metadata fields */}
            <input type="hidden" value={i} {...register(`screeningAnswers.${i}.questionIndex` as const, { valueAsNumber: true })} />
            <input type="hidden" value={q.question} {...register(`screeningAnswers.${i}.questionText` as const)} />

            {/* Textarea with live count */}
            <textarea
              rows={4}
              maxLength={MAX_CHARS + 50} /* allow slight overrun so user sees red */
              placeholder="Your answer…"
              {...register(`screeningAnswers.${i}.answer` as const, {
                required: q.required ? 'This question is required' : false,
                maxLength: { value: MAX_CHARS, message: `Max ${MAX_CHARS} characters` },
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateCount(i, e.target.value),
              })}
              className={inputCls(!!fieldErr || isOverLimit)}
            />

            {/* Footer: error + C-03 live counter */}
            <div className="flex items-center justify-between">
              {fieldErr ? (
                <p className={cn('text-xs', colorClasses.text.red)}>{fieldErr.message}</p>
              ) : <span />}
              <span className={cn(
                'text-xs tabular-nums',
                isOverLimit ? colorClasses.text.red :
                  isNearLimit ? colorClasses.text.amber700 :
                    colorClasses.text.muted,
              )}>
                {count} / {MAX_CHARS}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}