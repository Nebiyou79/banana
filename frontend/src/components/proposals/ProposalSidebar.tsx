// components/proposals/freelancer/ProposalSidebar.tsx
// ─── Sections fixed ─────────────────────────────────────────────────────────
// B:  All hardcoded slate/indigo → colorClasses
// C:  useResponsive, getTouchTargetSize on all interactive elements
// C-12: Submit = bg-[#F1BB03] text-[#0A2540], Save Draft = secondary border
// E-3: Completion ring SVG, Proposal Strength indicator,
//      StatPill for success rate + rating, gold brand buttons
// F:  No "any", cn() throughout
'use client';
import React from 'react';
import { Loader2, Save, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import type { ProposalFreelancerProfile, ProposalTender } from '@/services/proposalService';

interface Props {
  freelancerProfile?: ProposalFreelancerProfile | null;
  tender: ProposalTender;
  proposalId?: string | null;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isSaving: boolean;
  canSubmit: boolean;
  completionScore?: number;
  totalSections?: number;
  completions?: boolean[];
}

const SECTION_LABELS = [
  'Cover Letter', 'Bid & Timeline', 'Milestones',
  'Screening', 'Portfolio', 'Attachments',
];

const TIPS = [
  'Personalise your cover letter — mention the client by name.',
  'Milestones build trust. Break down your work into clear stages.',
  'Attach a portfolio piece directly relevant to this project.',
  'Answer all screening questions thoroughly.',
];

// E-3: stat pill
function StatPill({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn(
      'flex items-center justify-between rounded-lg px-3 py-2',
      accent ? cn(colorClasses.bg.emeraldLight) : colorClasses.bg.secondary,
    )}>
      <span className={cn('text-xs font-medium', accent ? colorClasses.text.emerald700 : colorClasses.text.secondary)}>
        {label}
      </span>
      <span className={cn('text-sm font-bold', accent ? colorClasses.text.emerald700 : colorClasses.text.primary)}>
        {value}
      </span>
    </div>
  );
}

// E-3: star rating
function StarRating({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={cn('h-3.5 w-3.5', s <= Math.round(avg) ? 'text-amber-400' : colorClasses.text.muted)}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className={cn('text-xs', colorClasses.text.muted)}>({count})</span>
    </div>
  );
}

// E-3: completion ring SVG
function CompletionRing({ pct }: { pct: number }) {
  const R = 28;
  const C = 2 * Math.PI * R;
  const stroke = (pct / 100) * C;
  const color = pct >= 65 ? colorClasses.text.emerald700 : pct >= 40 ? colorClasses.text.amber700 : colorClasses.text.red;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90 shrink-0">
      <circle cx="36" cy="36" r={R} fill="none"
        stroke="currentColor" className={colorClasses.text.muted} strokeWidth="6" opacity="0.15" />
      <circle cx="36" cy="36" r={R} fill="none"
        stroke="currentColor" className={color}
        strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${stroke} ${C}`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text
        x="36" y="40"
        textAnchor="middle"
        className="fill-current"
        style={{
          transform: 'rotate(90deg)',
          transformOrigin: '36px 36px',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {pct}%
      </text>
    </svg>
  );
}

export function ProposalSidebar({
  freelancerProfile,
  tender,
  proposalId,
  onSaveDraft,
  onSubmit,
  isSubmitting,
  isSaving,
  canSubmit,
  completionScore = 0,
  totalSections = 6,
  completions = [],
}: Props) {
  const { getTouchTargetSize } = useResponsive();
  const budget = tender.details?.budget;
  const ratings = freelancerProfile?.ratings;

  const pct = Math.round((completionScore / totalSections) * 100);
  const strength =
    pct >= 85 ? { label: 'Excellent', cls: colorClasses.text.emerald700 } :
      pct >= 65 ? { label: 'Strong', cls: colorClasses.text.emerald600 } :
        pct >= 40 ? { label: 'Fair', cls: colorClasses.text.amber700 } :
          { label: 'Weak', cls: colorClasses.text.red };

  return (
    <div className="sticky top-6 space-y-4">

      {/* ── E-3: Proposal Strength + Completion Ring ─────────────────── */}
      <div className={cn('rounded-2xl border p-4 shadow-sm', colorClasses.bg.primary, colorClasses.border.gray200)}>
        <p className={cn('text-xs font-bold uppercase tracking-wide mb-3', colorClasses.text.muted)}>
          Proposal Strength
        </p>
        <div className="flex items-center gap-4">
          <CompletionRing pct={pct} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-lg font-bold', strength.cls)}>{strength.label}</p>
            <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>
              {completionScore}/{totalSections} sections filled
            </p>
            <div className="mt-2 space-y-1">
              {SECTION_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-1.5">
                  {completions[i]
                    ? <CheckCircle2 className={cn('w-3 h-3 shrink-0', colorClasses.text.emerald700)} />
                    : <div className={cn('w-3 h-3 rounded-full border shrink-0', colorClasses.border.gray200)} />}
                  <span className={cn('text-xs', completions[i] ? colorClasses.text.secondary : colorClasses.text.muted)}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── E-3: Profile Preview with StatPills ──────────────────────── */}
      {freelancerProfile && (
        <div className={cn('rounded-2xl border p-5 shadow-sm', colorClasses.bg.primary, colorClasses.border.gray200)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#F1BB03] to-[#0A2540] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {String(freelancerProfile._id).slice(-2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className={cn('truncate text-sm font-semibold', colorClasses.text.primary)}>Your Profile</p>
              {freelancerProfile.headline && (
                <p className={cn('truncate text-xs', colorClasses.text.muted)}>{freelancerProfile.headline}</p>
              )}
            </div>
          </div>

          {ratings && ratings.count > 0 && (
            <div className="mb-3">
              <StarRating avg={ratings.average} count={ratings.count} />
            </div>
          )}

          <div className="space-y-2">
            {freelancerProfile.successRate != null && (
              <StatPill label="Success Rate" value={`${freelancerProfile.successRate}%`} accent />
            )}
            {freelancerProfile.onTimeDelivery != null && (
              <StatPill label="On-time Delivery" value={`${freelancerProfile.onTimeDelivery}%`} />
            )}
            {freelancerProfile.responseRate != null && (
              <StatPill label="Response Rate" value={`${freelancerProfile.responseRate}%`} />
            )}
          </div>

          {freelancerProfile.specialization && freelancerProfile.specialization.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {freelancerProfile.specialization.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className={cn('rounded-full px-2.5 py-0.5 text-xs', colorClasses.bg.secondary, colorClasses.text.secondary)}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Budget Context ────────────────────────────────────────────── */}
      {budget && (budget.min != null || budget.max != null) && (
        <div className={cn('rounded-2xl border p-5 shadow-sm', colorClasses.bg.primary, colorClasses.border.gray200)}>
          <p className={cn('mb-2 text-xs font-bold uppercase tracking-wide', colorClasses.text.muted)}>
            Client Budget
          </p>
          <p className={cn('text-sm', colorClasses.text.secondary)}>
            <strong className={colorClasses.text.primary}>
              {budget.min != null ? budget.min.toLocaleString() : '—'}
              {'–'}
              {budget.max != null ? budget.max.toLocaleString() : '—'}
              {' '}{budget.currency ?? ''}
            </strong>
          </p>
        </div>
      )}

      {/* ── Quick Tips ────────────────────────────────────────────────── */}
      <div className={cn('rounded-2xl border p-5', colorClasses.bg.amberLight, colorClasses.border.amber)}>
        <p className={cn('mb-3 text-xs font-bold uppercase tracking-wide', colorClasses.text.amber700)}>
          💡 Quick Tips
        </p>
        <ul className="space-y-2">
          {TIPS.map((t, i) => (
            <li key={i} className={cn('text-xs leading-relaxed', colorClasses.text.amber700)}>
              • {t}
            </li>
          ))}
        </ul>
      </div>

      {/* ── C-12: Actions — gold submit, secondary save draft ────────── */}
      <div className={cn('rounded-2xl border p-4 shadow-sm space-y-3', colorClasses.bg.primary, colorClasses.border.gray200)}>

        {/* Save Draft — secondary style */}
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5',
            'text-sm font-semibold transition-all',
            colorClasses.border.gray200,
            colorClasses.text.primary,
            colorClasses.bg.secondary,
            'hover:border-[#F1BB03] hover:text-[#F1BB03]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            getTouchTargetSize('md'),
          )}
        >
          {isSaving
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            : <><Save className="h-4 w-4" /> Save Draft</>}
        </button>

        {/* Submit Proposal — Banana gold */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5',
            'text-sm font-bold shadow-md shadow-[#F1BB03]/20 transition-all',
            'bg-[#F1BB03] text-[#0A2540]',
            'hover:brightness-105 active:scale-[0.98]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            getTouchTargetSize('md'),
          )}
        >
          {isSubmitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
            : <><Send className="h-4 w-4" /> Submit Proposal</>}
        </button>

        {!canSubmit && (
          <p className={cn('text-center text-xs', colorClasses.text.muted)}>
            Complete all required fields to submit.
          </p>
        )}
      </div>
    </div>
  );
}