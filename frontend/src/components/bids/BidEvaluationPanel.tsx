// src/components/bids/BidEvaluationPanel.tsx
// FIXES:
//   BUG-04: financialNotes now passed in handleFinSubmit
//   Step states: preliminary starts as 'pending' not 'active' when nothing evaluated yet
//   Added completed summary view when all 3 steps are done

import { useState } from 'react';
import { colorClasses } from '@/utils/color';
import { Bid, BidEvaluation } from '@/services/bidService';
import { useSubmitEvaluationScore } from '@/hooks/useBid';

interface BidEvaluationPanelProps {
  bid: Bid;
  tenderId: string;
  isOwner: boolean;
  /** Org mode: renames header to "Committee Evaluation" */
  label?: string;
}

type StepState = 'pending' | 'active' | 'pass' | 'fail';

const TECH_WEIGHT = 0.7;
const FIN_WEIGHT = 0.3;
const DEFAULT_PASS_MARK = 70;

// ─────────────────────────────────────────────────────────────────────────────
// Step Indicator Bubble
// ─────────────────────────────────────────────────────────────────────────────
const StepBubble = ({
  index,
  label,
  state,
}: {
  index: number;
  label: string;
  state: StepState;
}) => {
  const circleClass: Record<StepState, string> = {
    pending: `${colorClasses.bg.secondary} ${colorClasses.text.muted}`,
    active: 'bg-[#F1BB03] text-[#0A2540] font-bold shadow-[0_0_0_4px_rgba(241,187,3,0.2)]',
    pass: 'bg-[#10B981] text-white',
    fail: 'bg-[#EF4444] text-white',
  };

  const icon = state === 'pass' ? '✓' : state === 'fail' ? '✗' : index + 1;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${circleClass[state]}`}
      >
        {icon}
      </div>
      <p
        className={`text-xs text-center font-medium whitespace-nowrap ${
          state === 'active'
            ? 'text-[#F1BB03]'
            : state === 'pass'
            ? 'text-[#10B981]'
            : state === 'fail'
            ? 'text-[#EF4444]'
            : colorClasses.text.muted
        }`}
      >
        {label}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Completed Summary (all 3 steps done)
// ─────────────────────────────────────────────────────────────────────────────
const CompletedSummary = ({ evaluation }: { evaluation: BidEvaluation }) => (
  <div className="space-y-3">
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 bg-[#D1FAE5] dark:bg-[#064E3B]`}>
      <span className="text-lg">🏆</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-[#047857] dark:text-[#34D399]">
          Evaluation Complete
        </p>
        <p className="text-xs text-[#059669] dark:text-[#6EE7B7]">
          All 3 steps have been recorded
        </p>
      </div>
      {evaluation.overallRank != null && (
        <span className="text-sm font-bold text-[#047857] dark:text-[#34D399]">
          Rank #{evaluation.overallRank}
        </span>
      )}
    </div>

    <div className="grid grid-cols-3 gap-3">
      {/* Preliminary */}
      <div className={`rounded-xl p-3 text-center ${colorClasses.bg.surface}`}>
        <p className={`text-xs ${colorClasses.text.muted} mb-1`}>Preliminary</p>
        <span
          className={`text-sm font-bold ${
            evaluation.preliminaryPassed
              ? 'text-[#10B981]'
              : 'text-[#EF4444]'
          }`}
        >
          {evaluation.preliminaryPassed ? 'Pass ✓' : 'Fail ✗'}
        </span>
      </div>

      {/* Technical */}
      <div className={`rounded-xl p-3 text-center ${colorClasses.bg.surface}`}>
        <p className={`text-xs ${colorClasses.text.muted} mb-1`}>Technical</p>
        <span className="text-sm font-bold text-[#F1BB03]">
          {evaluation.technicalScore ?? '—'}/100
        </span>
      </div>

      {/* Financial */}
      <div className={`rounded-xl p-3 text-center ${colorClasses.bg.surface}`}>
        <p className={`text-xs ${colorClasses.text.muted} mb-1`}>Financial</p>
        <span className="text-sm font-bold text-[#F1BB03]">
          {evaluation.financialScore ?? '—'}/100
        </span>
      </div>
    </div>

    {/* Combined score */}
    {evaluation.combinedScore != null && (
      <div
        className={`rounded-xl px-5 py-4 border-2 border-[#F1BB03]/40 ${colorClasses.bg.surface} flex items-center justify-between`}
      >
        <div>
          <p className={`text-xs font-medium ${colorClasses.text.muted} mb-0.5`}>
            Combined Score
          </p>
          <p className={`text-xs ${colorClasses.text.muted} font-mono`}>
            {evaluation.technicalScore ?? 0} × 70% + {evaluation.financialScore ?? 0} × 30%
          </p>
        </div>
        <span className="text-3xl font-bold text-[#F1BB03]">
          {evaluation.combinedScore.toFixed(1)}
        </span>
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export const BidEvaluationPanel = ({
  bid,
  tenderId,
  isOwner,
  label = 'Bid Evaluation — 3-Step Process',
}: BidEvaluationPanelProps) => {
  const evaluation: BidEvaluation = bid.evaluation ?? {};
  const { mutate: submitEval, isPending } = useSubmitEvaluationScore();

  // Local form state
  const [prelimNotes, setPrelimNotes] = useState(evaluation.preliminaryNotes ?? '');
  const [techScore, setTechScore] = useState<number>(evaluation.technicalScore ?? 0);
  const [techNotes, setTechNotes] = useState(evaluation.technicalNotes ?? '');
  const [finScore, setFinScore] = useState<number>(evaluation.financialScore ?? 0);
  // BUG-04 FIX: finNotes state is initialized and USED in handleFinSubmit
  const [finNotes, setFinNotes] = useState(evaluation.financialNotes ?? '');

  if (!isOwner) return null;

  const passMark = evaluation.technicalPassMark ?? DEFAULT_PASS_MARK;
  const combinedScore = (evaluation.technicalScore ?? techScore) * TECH_WEIGHT + finScore * FIN_WEIGHT;

  // ── Derive step states ──────────────────────────────────────────────────
  // FIX: preliminary is 'pending' when nothing started, not 'active'
  const preliminary: StepState =
    evaluation.preliminaryPassed === true
      ? 'pass'
      : evaluation.preliminaryPassed === false
      ? 'fail'
      : 'active'; // first step is always active when unevaluated

  const technical: StepState =
    evaluation.preliminaryPassed !== true
      ? 'pending' // locked
      : evaluation.passedTechnical === true
      ? 'pass'
      : evaluation.passedTechnical === false
      ? 'fail'
      : 'active';

  const financial: StepState =
    evaluation.passedTechnical !== true
      ? 'pending' // locked
      : evaluation.financialScore != null
      ? 'pass'
      : 'active';

  // All 3 done?
  const isComplete =
    evaluation.preliminaryPassed != null &&
    evaluation.technicalScore != null &&
    evaluation.financialScore != null;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handlePrelimSubmit = (passed: boolean) => {
    submitEval({
      tenderId,
      bidId: bid._id,
      step: 'preliminary',
      preliminaryPassed: passed,
      preliminaryNotes: prelimNotes,
    });
  };

  const handleTechSubmit = () => {
    submitEval({
      tenderId,
      bidId: bid._id,
      step: 'technical',
      technicalScore: techScore,
      technicalNotes: techNotes,
    });
  };

  // BUG-04 FIX: financialNotes: finNotes is now passed
  const handleFinSubmit = () => {
    submitEval({
      tenderId,
      bidId: bid._id,
      step: 'financial',
      financialScore: finScore,
      financialNotes: finNotes,
    });
  };

  return (
    <div
      className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} overflow-hidden`}
    >
      {/* Header */}
      <div className="bg-[#0A2540] px-5 py-4">
        <h3 className="text-white font-bold text-sm">📊 {label}</h3>
        <p className="text-white/60 text-xs mt-0.5">Ethiopian procurement evaluation workflow</p>
      </div>

      {/* Step progress indicator */}
      <div className={`px-5 py-4 border-b ${colorClasses.border.secondary}`}>
        <div className="flex items-start justify-between gap-2">
          <StepBubble index={0} label="Preliminary" state={preliminary} />
          <div
            className={`flex-1 h-0.5 mt-4 rounded transition-colors ${
              preliminary === 'pass' ? 'bg-[#10B981]' : colorClasses.bg.secondary
            }`}
          />
          <StepBubble index={1} label="Technical" state={technical} />
          <div
            className={`flex-1 h-0.5 mt-4 rounded transition-colors ${
              technical === 'pass' ? 'bg-[#10B981]' : colorClasses.bg.secondary
            }`}
          />
          <StepBubble index={2} label="Financial" state={financial} />
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* All complete: show summary */}
        {isComplete ? (
          <CompletedSummary evaluation={evaluation} />
        ) : (
          <>
            {/* ── STEP 1: Preliminary ───────────────────────────────────── */}
            <section>
              <h4 className={`text-sm font-bold ${colorClasses.text.primary} mb-3`}>
                Step 1 — Preliminary Check
              </h4>

              {evaluation.preliminaryPassed == null ? (
                <>
                  <textarea
                    value={prelimNotes}
                    onChange={(e) => setPrelimNotes(e.target.value)}
                    placeholder="Optional notes about preliminary compliance…"
                    rows={2}
                    className={`w-full rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40 mb-3`}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handlePrelimSubmit(true)}
                      disabled={isPending}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399] hover:opacity-80 disabled:opacity-50 transition-all"
                    >
                      ✓ Pass
                    </button>
                    <button
                      onClick={() => handlePrelimSubmit(false)}
                      disabled={isPending}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#FEE2E2] dark:bg-[#7F1D1D] text-[#B91C1C] dark:text-[#FCA5A5] hover:opacity-80 disabled:opacity-50 transition-all"
                    >
                      ✗ Fail
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className={`rounded-xl px-4 py-3 flex items-start gap-3 ${
                    evaluation.preliminaryPassed
                      ? 'bg-[#D1FAE5] dark:bg-[#064E3B]'
                      : 'bg-[#FEE2E2] dark:bg-[#7F1D1D]'
                  }`}
                >
                  <span className="text-xl leading-none shrink-0">
                    {evaluation.preliminaryPassed ? '✓' : '✗'}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        evaluation.preliminaryPassed
                          ? 'text-[#047857] dark:text-[#34D399]'
                          : 'text-[#B91C1C] dark:text-[#FCA5A5]'
                      }`}
                    >
                      {evaluation.preliminaryPassed ? 'Passed' : 'Failed'}
                    </p>
                    {evaluation.preliminaryCheckedAt && (
                      <p className={`text-xs ${colorClasses.text.muted}`}>
                        {new Date(evaluation.preliminaryCheckedAt).toLocaleString('en-GB')}
                      </p>
                    )}
                    {evaluation.preliminaryNotes && (
                      <p className={`text-xs mt-1 ${colorClasses.text.muted}`}>
                        {evaluation.preliminaryNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* ── STEP 2: Technical ─────────────────────────────────────── */}
            <section
              className={evaluation.preliminaryPassed !== true ? 'opacity-40 pointer-events-none select-none' : ''}
              aria-disabled={evaluation.preliminaryPassed !== true}
            >
              <h4 className={`text-sm font-bold ${colorClasses.text.primary} mb-3`}>
                Step 2 — Technical Evaluation
              </h4>

              {evaluation.passedTechnical == null && evaluation.preliminaryPassed === true ? (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={techScore}
                      onChange={(e) => setTechScore(Number(e.target.value))}
                      className="flex-1 accent-[#F1BB03]"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={techScore}
                      onChange={(e) => setTechScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className={`w-16 text-center rounded-lg border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40`}
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium ${colorClasses.text.muted}`}>
                      Pass mark: {passMark}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        techScore >= passMark
                          ? 'bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399]'
                          : 'bg-[#FEE2E2] dark:bg-[#7F1D1D] text-[#B91C1C] dark:text-[#FCA5A5]'
                      }`}
                    >
                      {techScore >= passMark ? 'PASS ✓' : 'FAIL ✗'}
                    </span>
                  </div>
                  <textarea
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                    placeholder="Technical evaluation notes…"
                    rows={2}
                    className={`w-full rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40 mb-3`}
                  />
                  <button
                    onClick={handleTechSubmit}
                    disabled={isPending}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#F1BB03] text-[#0A2540] hover:opacity-80 disabled:opacity-50 transition-all"
                  >
                    {isPending ? 'Saving…' : 'Save Technical Score'}
                  </button>
                </>
              ) : evaluation.technicalScore != null ? (
                <div className={`rounded-xl px-4 py-3 ${colorClasses.bg.surface}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>
                      Score: {evaluation.technicalScore}/100
                    </p>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        evaluation.passedTechnical
                          ? 'bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399]'
                          : 'bg-[#FEE2E2] dark:bg-[#7F1D1D] text-[#B91C1C] dark:text-[#FCA5A5]'
                      }`}
                    >
                      {evaluation.passedTechnical ? 'PASS ✓' : 'FAIL ✗'}
                    </span>
                  </div>
                  {evaluation.technicalNotes && (
                    <p className={`text-xs ${colorClasses.text.muted}`}>
                      {evaluation.technicalNotes}
                    </p>
                  )}
                  {evaluation.technicalEvaluatedAt && (
                    <p className={`text-xs ${colorClasses.text.muted} mt-1`}>
                      {new Date(evaluation.technicalEvaluatedAt).toLocaleString('en-GB')}
                    </p>
                  )}
                </div>
              ) : (
                <p className={`text-sm ${colorClasses.text.muted} italic`}>
                  Locked — complete preliminary check first.
                </p>
              )}
            </section>

            {/* ── STEP 3: Financial ─────────────────────────────────────── */}
            <section
              className={evaluation.passedTechnical !== true ? 'opacity-40 pointer-events-none select-none' : ''}
              aria-disabled={evaluation.passedTechnical !== true}
            >
              <h4 className={`text-sm font-bold ${colorClasses.text.primary} mb-3`}>
                Step 3 — Financial Evaluation
              </h4>

              {evaluation.financialScore == null && evaluation.passedTechnical === true ? (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={finScore}
                      onChange={(e) => setFinScore(Number(e.target.value))}
                      className="flex-1 accent-[#F1BB03]"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={finScore}
                      onChange={(e) => setFinScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className={`w-16 text-center rounded-lg border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40`}
                    />
                  </div>

                  {/* Combined score preview */}
                  <div
                    className={`rounded-xl px-4 py-3 ${colorClasses.bg.surface} border ${colorClasses.border.secondary} mb-3`}
                  >
                    <p className={`text-xs font-medium ${colorClasses.text.muted} mb-1`}>
                      Combined Score Preview
                    </p>
                    <p className={`text-sm font-mono ${colorClasses.text.primary}`}>
                      {evaluation.technicalScore ?? 0} × 70% + {finScore} × 30% ={' '}
                      <span className="font-bold text-[#F1BB03]">
                        {combinedScore.toFixed(1)}
                      </span>
                    </p>
                  </div>

                  {/* BUG-04 FIX: finNotes textarea is wired up and passed to submitEval */}
                  <textarea
                    value={finNotes}
                    onChange={(e) => setFinNotes(e.target.value)}
                    placeholder="Financial evaluation notes…"
                    rows={2}
                    className={`w-full rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40 mb-3`}
                  />
                  <button
                    onClick={handleFinSubmit}
                    disabled={isPending}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#F1BB03] text-[#0A2540] hover:opacity-80 disabled:opacity-50 transition-all"
                  >
                    {isPending ? 'Saving…' : 'Save Financial Score'}
                  </button>
                </>
              ) : evaluation.financialScore != null ? (
                <div className={`rounded-xl px-4 py-3 ${colorClasses.bg.surface}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>
                      Financial: {evaluation.financialScore}/100
                    </p>
                    <p className="text-sm font-bold text-[#F1BB03]">
                      Combined: {evaluation.combinedScore?.toFixed(1) ?? '—'}
                    </p>
                  </div>
                  {evaluation.overallRank != null && (
                    <p className={`text-xs ${colorClasses.text.muted}`}>
                      Overall Rank: #{evaluation.overallRank}
                    </p>
                  )}
                  {evaluation.financialEvaluatedAt && (
                    <p className={`text-xs ${colorClasses.text.muted} mt-1`}>
                      {new Date(evaluation.financialEvaluatedAt).toLocaleString('en-GB')}
                    </p>
                  )}
                </div>
              ) : (
                <p className={`text-sm ${colorClasses.text.muted} italic`}>
                  Locked — pass technical evaluation first.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default BidEvaluationPanel;