// components/proposals/shared/ScreeningAnswersView.tsx
import React from 'react';
import type { ProposalScreeningAnswer } from '@/services/proposalService';

interface Props {
  answers: ProposalScreeningAnswer[];
}

export function ScreeningAnswersView({ answers }: Props) {
  if (!answers || answers.length === 0) return null;

  return (
    <div className="space-y-3">
      {answers.map((a, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4"
        >
          <p className="text-sm font-semibold text-slate-700">
            {a.questionText ?? `Question ${a.questionIndex + 1}`}
          </p>
          {a.answer?.trim() ? (
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{a.answer}</p>
          ) : (
            <p className="mt-1.5 text-sm italic text-slate-400">No answer provided.</p>
          )}
        </div>
      ))}
    </div>
  );
}
