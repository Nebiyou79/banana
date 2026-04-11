// components/proposals/ProposalForm.tsx
// ─── 3-STEP WIZARD — Upwork/Fiverr inspired ──────────────────────────────────
// Step 1 — Cover Letter + Bid & Timeline
// Step 2 — Details: Milestones, Screening, Portfolio, Attachments
// Step 3 — Review & Submit (includes Proposal Strength + Summary)
//
// FIX-1: 400 auto-save error — portfolioLinks filtered before send (no empty strings)
// FIX-2: Sidebar strength widget removed from layout; moved into Step 3 Review
// FIX-3: ProposalSidebar stripped from layout — clean single-column on mobile
// FIX-4: All sections responsive and professional on mobile/tablet/desktop
'use client';
import React, {
  useCallback, useRef, useState, useEffect,
} from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import Link from 'next/link';
import {
  AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Clock,
  FileText, Link2, Loader2, Paperclip, Plus, Save, Send, ExternalLink,
  Zap, X, Trash2, Info, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';

import { BidDetailsForm }     from './BidDetailsForm';
import { AttachmentUploader } from './AttachmentUploader';
import { DraftBanner }        from './DraftBanner';

import {
  useCreateDraft,
  useSubmitProposal,
  useProposalAutoSave,
  useProposalDetail,
  useUploadProposalAttachments,
  useDeleteProposalAttachment,
} from '@/hooks/useProposal';
import type {
  Proposal, ProposalTender, ProposalFreelancerProfile,
  CreateProposalData, ProposalMilestone, UpdateProposalData,
} from '@/services/proposalService';

// ─── Types ──────────────────────────────────────────────────────────────────
type MilestoneField = ProposalMilestone & { id: string };

// ─── Constants ──────────────────────────────────────────────────────────────
const STEP_LABELS    = ['Cover Letter & Bid', 'Details', 'Review & Submit'];
const MIN_COVER      = 50;
const MAX_COVER      = 5000;
const MAX_SCREEN     = 2000;
const DURATION_UNITS = ['days', 'weeks', 'months'] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) => cn(
  'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-150',
  colorClasses.bg.primary, colorClasses.text.primary,
  'placeholder:text-[#9CA3AF]',
  'focus:ring-2 focus:ring-[#F1BB03]/40 focus:border-[#F1BB03]',
  hasError
    ? cn(colorClasses.bg.redLight, 'border-red-400 focus:ring-red-300/40 focus:border-red-400')
    : colorClasses.border.gray200,
);

// FIX-1: Strip empty portfolio links before saving to prevent Mongoose URL validation errors
const cleanPortfolioLinks = (links: string[]): string[] =>
  (links ?? []).filter((l) => l && l.trim().length > 0);

// ─── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="mb-8">
      {/* Desktop */}
      <div className="hidden sm:flex items-center">
        {steps.map((label, i) => {
          const active = i === current;
          const passed = i < current;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all',
                  active  ? 'bg-[#F1BB03] text-[#0A2540] shadow-lg shadow-[#F1BB03]/30 ring-4 ring-[#F1BB03]/20' :
                  passed  ? 'bg-emerald-500 text-white' :
                  cn('border-2', colorClasses.border.gray200, colorClasses.text.muted),
                )}>
                  {passed ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={cn(
                  'text-sm font-semibold whitespace-nowrap',
                  active ? colorClasses.text.primary :
                  passed ? colorClasses.text.emerald700 :
                  colorClasses.text.muted,
                )}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-4 rounded-full min-w-[24px] transition-colors duration-300',
                  passed ? 'bg-emerald-500' : colorClasses.bg.gray200,
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile progress bar */}
      <div className="sm:hidden space-y-2">
        <div className="flex justify-between items-center">
          <span className={cn('text-sm font-bold', colorClasses.text.primary)}>
            {steps[current]}
          </span>
          <span className={cn('text-xs font-medium', colorClasses.text.muted)}>
            {current + 1} of {steps.length}
          </span>
        </div>
        <div className={cn('h-1.5 rounded-full overflow-hidden', colorClasses.bg.secondary)}>
          <div
            className="h-full rounded-full bg-[#F1BB03] transition-all duration-500"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Section Card ────────────────────────────────────────────────────────────
function SectionCard({ title, icon, required, complete, badge, hint, children }: {
  title: string; icon: React.ReactNode; required?: boolean;
  complete?: boolean; badge?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-2xl border overflow-hidden', colorClasses.bg.primary, colorClasses.border.gray200)}>
      <div className={cn('flex items-center gap-3 px-5 py-4 border-b', colorClasses.border.gray200)}>
        <span className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg',
          complete ? cn(colorClasses.bg.emeraldLight) : colorClasses.bg.secondary,
          complete ? colorClasses.text.emerald700 : colorClasses.text.muted,
        )}>{icon}</span>
        <div className="flex-1 min-w-0">
          <h2 className={cn('text-sm font-bold', colorClasses.text.primary)}>{title}</h2>
          {hint && <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>{hint}</p>}
        </div>
        {badge && (
          <span className={cn(
            'text-[10px] font-semibold px-2.5 py-1 rounded-full',
            colorClasses.bg.secondary, colorClasses.text.muted,
          )}>{badge}</span>
        )}
        {required && !complete && (
          <span className={cn(
            'text-[10px] font-semibold px-2.5 py-1 rounded-full',
            colorClasses.bg.amberLight, colorClasses.text.amber700,
          )}>Required</span>
        )}
        {complete && (
          <span className={cn(
            'inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full',
            colorClasses.bg.emeraldLight, colorClasses.text.emerald700,
          )}>
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Cover Letter ────────────────────────────────────────────────────────────
function CoverLetterEditor({ value, onChange, saveState }: {
  value: string; onChange: (t: string) => void; saveState?: string;
}) {
  const count    = value.length;
  const tooShort = count > 0 && count < MIN_COVER;
  const tooLong  = count > MAX_COVER;
  const pct      = Math.min((count / MIN_COVER) * 100, 100);

  return (
    <div className="space-y-2.5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        placeholder={`Start with a strong opening that addresses the client's needs directly…\n\nFor example:\n• Mention a specific detail from the project brief\n• Introduce your most relevant experience first\n• Explain your approach to solving their problem\n• Include a concrete example of similar past work`}
        className={cn(
          'w-full rounded-xl border px-4 py-3.5 text-sm leading-relaxed resize-y outline-none transition-all',
          'placeholder:text-[#9CA3AF] placeholder:text-xs placeholder:leading-relaxed',
          colorClasses.bg.primary, colorClasses.text.primary,
          tooLong  ? 'border-red-400 focus:ring-2 focus:ring-red-300/40' :
          tooShort ? 'border-amber-400 focus:ring-2 focus:ring-amber-300/40' :
          count >= MIN_COVER ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-300/40' :
          cn(colorClasses.border.gray200, 'focus:ring-2 focus:ring-[#F1BB03]/40 focus:border-[#F1BB03]'),
        )}
        style={{ minHeight: 260 }}
      />

      {/* Progress bar */}
      {count > 0 && count < MIN_COVER && (
        <div className={cn('h-1 rounded-full overflow-hidden', colorClasses.bg.secondary)}>
          <div className="h-full rounded-full bg-[#F1BB03] transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="flex items-center justify-between text-xs px-0.5">
        <span className={
          tooLong ? colorClasses.text.red :
          tooShort ? colorClasses.text.amber700 :
          count >= MIN_COVER ? colorClasses.text.emerald700 :
          colorClasses.text.muted
        }>
          {count === 0       ? `Minimum ${MIN_COVER} characters required` :
           tooShort          ? `${MIN_COVER - count} more characters needed` :
           tooLong           ? `${count - MAX_COVER} characters over limit` :
           '✓ Length looks good'}
        </span>
        <span className={cn('flex items-center gap-3', colorClasses.text.muted)}>
          {saveState === 'saving' && (
            <span className={cn('inline-flex items-center gap-1', colorClasses.text.amber700)}>
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          )}
          {saveState === 'saved' && (
            <span className={cn('inline-flex items-center gap-1', colorClasses.text.emerald700)}>
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
          <span className={tooLong ? colorClasses.text.red : ''}>
            {count.toLocaleString()} / {MAX_COVER.toLocaleString()}
          </span>
        </span>
      </div>
    </div>
  );
}

// ─── Budget Range Bar ────────────────────────────────────────────────────────
function BudgetRangeBar({ min, max, bid, currency }: {
  min: number; max: number; bid: number; currency: string;
}) {
  if (!min && !max) return null;
  const safeMin = min ?? 0;
  const safeMax = max > safeMin ? max : safeMin * 2 || 100;
  const range   = safeMax - safeMin;
  const clamped = Math.max(safeMin, Math.min(bid ?? 0, safeMax));
  const pct     = range > 0 ? ((clamped - safeMin) / range) * 100 : 50;
  const mid     = (safeMin + safeMax) / 2;
  const pctMid  = mid > 0 ? (((bid ?? 0) - mid) / mid) * 100 : 0;
  const inside  = (bid ?? 0) >= safeMin && (bid ?? 0) <= safeMax;

  return (
    <div className={cn('mt-5 rounded-xl border p-4', colorClasses.bg.secondary, colorClasses.border.gray200)}>
      <p className={cn('text-xs font-semibold mb-3', colorClasses.text.muted)}>Your bid vs. client budget</p>
      <div className="relative h-6 flex items-center mb-2">
        <div className={cn('w-full h-2 rounded-full', colorClasses.bg.gray200)} />
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-2 rounded-full bg-[#F1BB03]/15" />
        </div>
        {(bid ?? 0) > 0 && (
          <div
            className={cn(
              'absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 transition-all',
              inside ? 'bg-emerald-500' : 'bg-amber-500',
            )}
            style={{ left: `${Math.min(95, Math.max(5, pct))}%` }}
          />
        )}
      </div>
      <div className={cn('flex justify-between text-[10px] font-medium mb-2', colorClasses.text.muted)}>
        <span>{currency} {safeMin.toLocaleString()}</span>
        <span>Budget Range</span>
        <span>{currency} {safeMax.toLocaleString()}</span>
      </div>
      {(bid ?? 0) > 0 && (
        <p className={cn('text-xs font-medium', inside ? colorClasses.text.emerald700 : colorClasses.text.amber700)}>
          {inside
            ? `✓ Within budget — ${Math.abs(pctMid).toFixed(0)}% ${pctMid >= 0 ? 'above' : 'below'} midpoint`
            : `⚠ Bid is ${(bid ?? 0) > safeMax ? 'above' : 'below'} client's stated budget`}
        </p>
      )}
    </div>
  );
}

// ─── Milestone Builder ───────────────────────────────────────────────────────
function MilestoneBuilder({ fields, append, remove, proposedAmount, currency }: {
  fields: MilestoneField[]; append: (m: Omit<ProposalMilestone, '_id'>) => void;
  remove: (i: number) => void; proposedAmount: number; currency: string;
}) {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const [enabled, setEnabled] = useState(fields.length > 0);
  const [local, setLocal] = useState<Omit<ProposalMilestone, '_id'>[]>(() =>
    fields.map((f) => ({
      title: f.title ?? '', description: f.description ?? '',
      amount: f.amount ?? 0, duration: f.duration ?? 1,
      durationUnit: f.durationUnit ?? 'weeks', order: f.order ?? 0,
    }))
  );

  useEffect(() => {
    if (fields.length > 0 && local.length === 0) {
      setLocal(fields.map((f) => ({
        title: f.title ?? '', description: f.description ?? '',
        amount: f.amount ?? 0, duration: f.duration ?? 1,
        durationUnit: f.durationUnit ?? 'weeks', order: f.order ?? 0,
      })));
      setEnabled(true);
    }
  }, [fields.length]);

  const update = (i: number, patch: Partial<Omit<ProposalMilestone, '_id'>>) =>
    setLocal((p) => { const n = [...p]; n[i] = { ...n[i], ...patch }; return n; });

  const add = () => {
    const m = { title: '', description: '', amount: 0, duration: 1, durationUnit: 'weeks' as const, order: local.length };
    setLocal((p) => [...p, m]);
    append(m);
  };

  const del = (i: number) => {
    setLocal((p) => p.filter((_, idx) => idx !== i));
    remove(i);
  };

  const toggle = () => {
    if (enabled) {
      for (let i = local.length - 1; i >= 0; i--) remove(i);
      setLocal([]);
    }
    setEnabled((p) => !p);
  };

  const total   = local.reduce((s, f) => s + (f.amount ?? 0), 0);
  const isMatch = proposedAmount === 0 || Math.abs(total - proposedAmount) / (proposedAmount || 1) <= 0.05;
  const fmt     = (n: number) => new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(n);
  const pctOf   = (amt: number) => proposedAmount > 0 ? Math.round((amt / proposedAmount) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>Payment Milestones</p>
          <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>Break your payment into deliverable stages</p>
        </div>
        <button
          type="button" role="switch" aria-checked={enabled} onClick={toggle}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40 focus:ring-offset-2',
            enabled ? 'bg-[#F1BB03]' : colorClasses.bg.gray200,
          )}
        >
          <span className={cn(
            'inline-block h-4 w-4 rounded-full shadow-sm transition-transform duration-200',
            enabled ? 'translate-x-6 bg-[#0A2540]' : 'translate-x-1 bg-white',
          )} />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3">
          {local.map((field, i) => (
            <div key={i} className={cn('rounded-xl border p-4', colorClasses.bg.secondary, colorClasses.border.gray200)}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#F1BB03] text-[#0A2540] text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className={cn('text-xs font-semibold flex-1', colorClasses.text.secondary)}>
                  Milestone {i + 1}
                  {field.amount > 0 && proposedAmount > 0 && (
                    <span className={cn('ml-2 font-normal', colorClasses.text.muted)}>
                      ({pctOf(field.amount)}% of total)
                    </span>
                  )}
                </p>
                <button
                  type="button" onClick={() => del(i)}
                  className={cn('text-xs flex items-center gap-1 transition-opacity hover:opacity-70', colorClasses.text.red)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>

              <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                <div className="col-span-full">
                  <input
                    type="text" value={field.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="Milestone title *"
                    className={inputCls()}
                  />
                </div>
                <div className="col-span-full">
                  <textarea
                    rows={2} value={field.description ?? ''}
                    onChange={(e) => update(i, { description: e.target.value })}
                    placeholder="What will be delivered? (optional)"
                    className={cn(inputCls(), 'resize-none')}
                  />
                </div>
                <div>
                  <input
                    type="number" min={0} value={field.amount || ''}
                    onChange={(e) => update(i, { amount: parseFloat(e.target.value) || 0 })}
                    placeholder={`Amount (${currency})`}
                    className={inputCls()}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number" min={1} value={field.duration || ''}
                    onChange={(e) => update(i, { duration: parseInt(e.target.value) || 1 })}
                    placeholder="Duration"
                    className={cn(inputCls(), 'w-24 shrink-0')}
                  />
                  <select
                    value={field.durationUnit ?? 'weeks'}
                    onChange={(e) => update(i, { durationUnit: e.target.value as ProposalMilestone['durationUnit'] })}
                    className={cn(inputCls(), 'flex-1')}
                  >
                    {DURATION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button" onClick={add}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-medium transition-colors',
              colorClasses.border.gray200, colorClasses.text.muted,
              'hover:border-[#F1BB03] hover:text-[#F1BB03]',
            )}
          >
            <Plus className="w-4 h-4" /> Add Milestone
          </button>

          {local.length > 0 && (
            <div className={cn(
              'flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold',
              isMatch
                ? cn(colorClasses.bg.emeraldLight, colorClasses.text.emerald700)
                : cn(colorClasses.bg.redLight, colorClasses.text.red),
            )}>
              <span>Total: {currency} {fmt(total)}</span>
              <span>Bid: {currency} {fmt(proposedAmount)} {isMatch ? '✓ Match' : '⚠ Must match within 5%'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Portfolio Link Row ──────────────────────────────────────────────────────
function PortfolioLinkRow({ index, value, onChange, onRemove }: {
  index: number; value: string; onChange: (v: string) => void; onRemove: () => void;
}) {
  const ICONS: Record<string, string> = {
    github: '🐙', linkedin: '💼', figma: '🎨', behance: '🖼', dribbble: '🏀',
  };
  const icon  = Object.entries(ICONS).find(([k]) => value.toLowerCase().includes(k))?.[1] ?? '🔗';
  const valid = (() => { try { new URL(value); return value.startsWith('http'); } catch { return false; } })();

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
          {value ? icon : <Link2 className={cn('w-3.5 h-3.5', colorClasses.text.muted)} />}
        </span>
        <input
          type="url" value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`https://your-portfolio.com/project-${index + 1}`}
          className={cn(inputCls(), 'pl-10 pr-3')}
        />
      </div>
      {valid && (
        <a
          href={value} target="_blank" rel="noopener noreferrer"
          className={cn('shrink-0 p-2 rounded-lg transition-colors', colorClasses.text.muted, 'hover:text-[#F1BB03]')}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
      <button
        type="button" onClick={onRemove}
        className={cn('shrink-0 p-2 rounded-lg transition-colors', colorClasses.text.muted, 'hover:' + colorClasses.text.red)}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Validation Summary ──────────────────────────────────────────────────────
function ValidationSummary({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div className={cn('rounded-xl border p-4', colorClasses.bg.redLight, 'border-red-200')}>
      <div className="flex items-start gap-2.5">
        <AlertCircle className={cn('w-4 h-4 shrink-0 mt-0.5', colorClasses.text.red)} />
        <div>
          <p className={cn('text-sm font-semibold mb-2', colorClasses.text.red)}>Please fix the following before submitting:</p>
          <ul className="space-y-1">
            {errors.map((e, i) => (
              <li key={i} className={cn('text-xs flex items-center gap-2', colorClasses.text.red)}>
                <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Proposal Strength (inline on Step 3) ───────────────────────────────────
function ProposalStrengthInline({ completionScore, totalSections, completions, sectionLabels }: {
  completionScore: number; totalSections: number; completions: boolean[]; sectionLabels: string[];
}) {
  const pct = Math.round((completionScore / totalSections) * 100);
  const str =
    pct >= 85 ? { label: 'Excellent', cls: 'text-emerald-600 dark:text-emerald-400', barCls: 'bg-emerald-500' } :
    pct >= 65 ? { label: 'Strong',    cls: 'text-emerald-600 dark:text-emerald-400', barCls: 'bg-emerald-500' } :
    pct >= 40 ? { label: 'Fair',      cls: colorClasses.text.amber700,               barCls: 'bg-amber-500'   } :
                { label: 'Weak',      cls: colorClasses.text.red,                    barCls: 'bg-red-500'     };

  return (
    <div className={cn('rounded-2xl border p-5', colorClasses.bg.primary, colorClasses.border.gray200)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={cn('text-sm font-bold', colorClasses.text.primary)}>Proposal Strength</p>
          <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>{completionScore} of {totalSections} sections complete</p>
        </div>
        <div className="text-right">
          <p className={cn('text-2xl font-bold', str.cls)}>{pct}%</p>
          <p className={cn('text-xs font-semibold', str.cls)}>{str.label}</p>
        </div>
      </div>

      {/* Bar */}
      <div className={cn('h-2 rounded-full overflow-hidden mb-4', colorClasses.bg.secondary)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', str.barCls)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {sectionLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {completions[i]
              ? <CheckCircle2 className={cn('w-3.5 h-3.5 shrink-0 text-emerald-500')} />
              : <div className={cn('w-3.5 h-3.5 rounded-full border-2 shrink-0', colorClasses.border.gray200)} />}
            <span className={cn('text-xs', completions[i] ? colorClasses.text.secondary : colorClasses.text.muted)}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile Preview Card ────────────────────────────────────────────────────
function ProfilePreviewCard({ profile }: { profile: NonNullable<Props['freelancerProfile']> }) {
  return (
    <div className={cn('rounded-2xl border p-5', colorClasses.bg.primary, colorClasses.border.gray200)}>
      <p className={cn('text-xs font-bold uppercase tracking-wide mb-4', colorClasses.text.muted)}>Your Profile</p>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#F1BB03] to-[#0A2540] flex items-center justify-center text-white text-sm font-bold shrink-0">
          {String(profile._id).slice(-2).toUpperCase()}
        </div>
        <div className="min-w-0">
          {profile.headline && (
            <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>{profile.headline}</p>
          )}
          {profile.ratings && profile.ratings.count > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={cn('w-3 h-3', s <= Math.round(profile.ratings!.average) ? 'text-amber-400 fill-amber-400' : colorClasses.text.muted)} />
              ))}
              <span className={cn('text-xs ml-1', colorClasses.text.muted)}>({profile.ratings.count})</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {profile.successRate != null && (
          <div className={cn('flex justify-between rounded-lg px-3 py-2', colorClasses.bg.emeraldLight)}>
            <span className={cn('text-xs', colorClasses.text.emerald700)}>Success Rate</span>
            <span className={cn('text-xs font-bold', colorClasses.text.emerald700)}>{profile.successRate}%</span>
          </div>
        )}
        {profile.onTimeDelivery != null && (
          <div className={cn('flex justify-between rounded-lg px-3 py-2', colorClasses.bg.secondary)}>
            <span className={cn('text-xs', colorClasses.text.muted)}>On-time Delivery</span>
            <span className={cn('text-xs font-bold', colorClasses.text.primary)}>{profile.onTimeDelivery}%</span>
          </div>
        )}
      </div>

      {profile.specialization && profile.specialization.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {profile.specialization.slice(0, 4).map((s) => (
            <span key={s} className={cn('text-[10px] px-2 py-0.5 rounded-full', colorClasses.bg.secondary, colorClasses.text.secondary)}>
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Success State ───────────────────────────────────────────────────────────
function SuccessState({ proposalId }: { proposalId: string }) {
  return (
    <div className={cn('rounded-2xl border-2 border-[#F1BB03] p-8 text-center max-w-lg mx-auto', colorClasses.bg.primary)}>
      <div
        className="w-16 h-16 rounded-full bg-[#F1BB03]/20 flex items-center justify-center mx-auto mb-4"
        style={{ animation: 'scaleIn 0.4s ease-out' }}
      >
        <CheckCircle2 className="w-8 h-8 text-[#F1BB03]" />
      </div>
      <h2 className={cn('text-xl font-bold mb-2', colorClasses.text.primary)}>Proposal Submitted! 🎉</h2>
      <p className={cn('text-sm mb-6', colorClasses.text.muted)}>
        Your proposal has been sent. The client will be notified.
      </p>

      <div className={cn('rounded-xl border p-4 text-left mb-6', colorClasses.bg.secondary, colorClasses.border.gray200)}>
        <p className={cn('text-xs font-bold uppercase tracking-wide mb-3', colorClasses.text.muted)}>What happens next</p>
        <ol className="space-y-3">
          {[
            'Client receives a notification',
            'They review your cover letter, bid, and portfolio',
            "You'll be notified if shortlisted or contacted",
            'Client may schedule an interview or award directly',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#F1BB03]/20 text-[#F1BB03] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className={cn('text-sm', colorClasses.text.secondary)}>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/dashboard/freelancer/proposals/${proposalId}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#F1BB03] text-[#0A2540] font-bold text-sm hover:brightness-105 transition-all"
        >
          View My Proposal
        </Link>
        <Link
          href="/dashboard/freelancer/tenders"
          className={cn(
            'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border text-sm font-semibold transition-colors',
            colorClasses.border.gray200, colorClasses.text.secondary,
            'hover:border-[#F1BB03] hover:text-[#F1BB03]',
          )}
        >
          Browse More Tenders
        </Link>
      </div>
      <style>{`@keyframes scaleIn { from { transform: scale(0); opacity:0; } to { transform: scale(1); opacity:1; } }`}</style>
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  tender:             ProposalTender;
  freelancerProfile?: ProposalFreelancerProfile | null;
  initialDraft?:      Proposal | null;
  onSuccess:          (proposalId: string) => void;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function ProposalForm({ tender, freelancerProfile, initialDraft, onSuccess }: Props) {
  const { breakpoint } = useResponsive();

  const [proposalId, setProposalId]           = useState<string | null>(initialDraft?._id ?? null);
  const [step, setStep]                       = useState(0);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitted, setSubmitted]             = useState(false);
  const [submittedId, setSubmittedId]         = useState('');
  const [pendingFiles, setPendingFiles]       = useState<File[]>([]);
  const [screenCharCounts, setScreenCharCounts] = useState<number[]>([]);
  const [discarding, setDiscarding]           = useState(false);
  const [useDraft]                            = useState(true);

  const creatingRef         = useRef(false);
  const createDraftMutation = useCreateDraft();
  const submitMutation      = useSubmitProposal();
  const uploadMutation      = useUploadProposalAttachments();
  const deleteMutation      = useDeleteProposalAttachment();

  const screeningQuestions = tender.details?.screeningQuestions ?? [];

  useEffect(() => {
    setScreenCharCounts(screeningQuestions.map(() => 0));
  }, [screeningQuestions.length]);

  const {
    register, control, watch, setValue, handleSubmit,
    formState: { errors, isDirty, isSubmitting }, reset,
  } = useForm<CreateProposalData>({
    defaultValues: initialDraft ? {
      bidType: initialDraft.bidType,
      proposedAmount: initialDraft.proposedAmount,
      currency: initialDraft.currency,
      hourlyRate: initialDraft.hourlyRate,
      estimatedWeeklyHours: initialDraft.estimatedWeeklyHours,
      deliveryTime: initialDraft.deliveryTime,
      availability: initialDraft.availability,
      proposedStartDate: initialDraft.proposedStartDate,
      coverLetter: initialDraft.coverLetter ?? '',
      coverLetterHtml: initialDraft.coverLetterHtml ?? '',
      // FIX-1: Only keep non-empty links
      portfolioLinks: cleanPortfolioLinks(initialDraft.portfolioLinks ?? []).length
        ? cleanPortfolioLinks(initialDraft.portfolioLinks ?? [])
        : [''],
      milestones: initialDraft.milestones ?? [],
      screeningAnswers: screeningQuestions.map((q, i) => ({
        questionIndex: i, questionText: q.question,
        answer: initialDraft.screeningAnswers?.find((a) => a.questionIndex === i)?.answer ?? '',
        isRequired: q.required,
      })),
    } : {
      bidType: 'fixed', currency: 'ETB', coverLetter: '', coverLetterHtml: '',
      portfolioLinks: [''], milestones: [],
      screeningAnswers: screeningQuestions.map((q, i) => ({
        questionIndex: i, questionText: q.question, answer: '', isRequired: q.required,
      })),
    },
    mode: 'onChange',
  });

  const { fields: milestoneFields, append: appendMilestone, remove: removeMilestone } =
    useFieldArray({ control, name: 'milestones' });
  const { fields: screeningFields } = useFieldArray({ control, name: 'screeningAnswers' });

  const formData       = watch();
  const proposedAmount = watch('proposedAmount') ?? 0;
  const coverLetter    = watch('coverLetter') ?? '';
  const portfolioLinks = watch('portfolioLinks') ?? [''];
  const currency       = watch('currency') ?? 'ETB';

  // FIX-1: Pass clean (no-empty) portfolio links to auto-save
  const autoSaveData: UpdateProposalData = {
    ...formData,
    portfolioLinks: cleanPortfolioLinks(portfolioLinks),
  };

  // Only auto-save when proposal is a draft — never auto-save submitted/awarded/etc.
  const isDraftStatus = !initialDraft || initialDraft.status === 'draft';

  const { saveState, forceSave } = useProposalAutoSave({
    proposalId: isDraftStatus ? proposalId : null,
    formData: autoSaveData,
    isDirty,
    isSubmitting,
  });

  const { data: proposalDetail } = useProposalDetail(proposalId ?? '', { enabled: !!proposalId });
  const attachments = proposalId
    ? (proposalDetail?.attachments ?? initialDraft?.attachments ?? [])
    : (initialDraft?.attachments ?? []);

  // FIX-1: Ensure draft is created with valid payload
  const ensureProposalId = useCallback(async (): Promise<string | null> => {
    if (proposalId) return proposalId;
    if (creatingRef.current) return null;
    creatingRef.current = true;
    try {
      const draft = await createDraftMutation.mutateAsync({
        tenderId:       tender._id,
        coverLetter:    (formData.coverLetter ?? '').trim() || 'Draft in progress',
        bidType:        formData.bidType       || 'fixed',
        proposedAmount: formData.proposedAmount || 0,
        deliveryTime:   formData.deliveryTime  || { value: 1, unit: 'weeks' },
        availability:   formData.availability  || 'flexible',
        currency:       formData.currency      || 'ETB',
      });
      setProposalId(draft._id);
      creatingRef.current = false;
      return draft._id;
    } catch {
      creatingRef.current = false;
      return null;
    }
  }, [proposalId, createDraftMutation, tender._id, formData]);

  // Section labels + completions
  const sectionLabels = [
    'Cover Letter', 'Bid & Timeline', 'Milestones',
    ...(screeningQuestions.length > 0 ? ['Screening Answers'] : []),
    'Portfolio Links', 'Attachments',
  ];
  const completions = [
    coverLetter.length >= MIN_COVER,
    (formData.proposedAmount ?? 0) > 0 && !!formData.deliveryTime?.value && !!formData.availability,
    milestoneFields.length > 0,
    ...(screeningQuestions.length > 0 ? [
      screeningFields.every((_, i) =>
        !screeningQuestions[i]?.required ||
        (formData.screeningAnswers?.[i]?.answer ?? '').length > 0
      ),
    ] : []),
    cleanPortfolioLinks(portfolioLinks).length > 0,
    attachments.length > 0,
  ];
  const completionScore = completions.filter(Boolean).length;

  // Validation
  const validationErrors: string[] = [];
  if (!coverLetter || coverLetter.length < MIN_COVER)
    validationErrors.push(`Cover letter must be at least ${MIN_COVER} characters`);
  if (!formData.proposedAmount || formData.proposedAmount <= 0)
    validationErrors.push('Proposed amount must be greater than 0');
  if (!formData.deliveryTime?.value)
    validationErrors.push('Delivery time is required');
  if (!formData.availability)
    validationErrors.push('Availability is required');

  const canSubmit = validationErrors.length === 0 && !isSubmitting;

  // Portfolio link helpers
  const addPortfolioLink    = () =>
    portfolioLinks.length < 5 &&
    setValue('portfolioLinks', [...portfolioLinks, ''], { shouldDirty: true });
  const updatePortfolioLink = (i: number, v: string) =>
    setValue('portfolioLinks', portfolioLinks.map((x, idx) => idx === i ? v : x), { shouldDirty: true });
  const removePortfolioLink = (i: number) =>
    setValue('portfolioLinks', portfolioLinks.filter((_, idx) => idx !== i), { shouldDirty: true });

  // Attachment upload
  const handleUpload = async (files: File[]) => {
    let id = proposalId;
    if (!id) id = await ensureProposalId();
    if (id) { uploadMutation.mutate({ proposalId: id, files }); }
    else { setPendingFiles((p) => [...p, ...files]); }
  };

  useEffect(() => {
    if (proposalId && pendingFiles.length > 0) {
      uploadMutation.mutate({ proposalId, files: pendingFiles });
      setPendingFiles([]);
    }
  }, [proposalId]);

  const handleDeleteAttachment = (id: string) => {
    if (!proposalId) return;
    deleteMutation.mutate({ proposalId, attachmentId: id });
  };

  const handleSaveDraft = async () => {
    const id = await ensureProposalId();
    if (id) forceSave();
  };

  const onSubmit = useCallback(async () => {
    setSubmitAttempted(true);
    if (validationErrors.length > 0) return;
    const id = await ensureProposalId();
    if (!id) return;
    await forceSave();
    submitMutation.mutate(id, {
      onSuccess: (data) => {
        setSubmitted(true);
        setSubmittedId(data._id);
        onSuccess(data._id);
      },
    });
  }, [validationErrors.length, ensureProposalId, forceSave, submitMutation, onSuccess]);

  const handleDiscard = async () => {
    if (!proposalId) return;
    setDiscarding(true);
    try {
      await fetch(`/api/v1/proposals/${proposalId}/withdraw`, { method: 'POST' });
      setProposalId(null);
      reset();
    } finally {
      setDiscarding(false);
    }
  };

  if (submitted && submittedId) return <SuccessState proposalId={submittedId} />;

  const isCreating = createDraftMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Draft banner — shown only when we have a pre-existing draft (not yet adopted into form state) */}
      {initialDraft && useDraft && !proposalId && (
        <DraftBanner
          draft={initialDraft}
          onContinue={() => {}}
          onDiscard={handleDiscard}
          isDiscarding={discarding}
        />
      )}

      {/* Auto-save status — only when draft is active and no banner is showing */}
      {proposalId && !(initialDraft && useDraft && !proposalId) && (
        <div className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs',
          colorClasses.bg.secondary, colorClasses.border.gray200,
        )}>
          <Clock className={cn('w-3.5 h-3.5 shrink-0', colorClasses.text.muted)} />
          <span className={cn('flex-1', colorClasses.text.muted)}>Draft saved automatically</span>
          {saveState === 'saving' && (
            <span className={cn('inline-flex items-center gap-1', colorClasses.text.amber700)}>
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          )}
          {saveState === 'saved' && (
            <span className={cn('inline-flex items-center gap-1', colorClasses.text.emerald700)}>
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
          {saveState === 'idle' && (
            <span className={colorClasses.text.muted}>Up to date</span>
          )}
          {saveState === 'error' && (
            <span className={colorClasses.text.red}>Save failed — will retry</span>
          )}
        </div>
      )}

      {/* Step indicator */}
      <StepIndicator current={step} steps={STEP_LABELS} />

      {submitAttempted && step === 2 && <ValidationSummary errors={validationErrors} />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* ═══ STEP 1: Cover Letter + Bid ══════════════════════════════ */}
        {step === 0 && (
          <div className="space-y-5">
            <SectionCard
              title="Cover Letter"
              icon={<FileText className="w-4 h-4" />}
              required
              complete={completions[0]}
              hint="Tell the client why you're the perfect fit"
            >
              <CoverLetterEditor
                value={coverLetter}
                onChange={(text) => {
                  setValue('coverLetter', text, { shouldDirty: true });
                  setValue('coverLetterHtml', text, { shouldDirty: true });
                }}
                saveState={saveState}
              />
            </SectionCard>

            <SectionCard
              title="Bid & Timeline"
              icon={<Zap className="w-4 h-4" />}
              required
              complete={completions[1]}
              hint="Set your rate, delivery time, and availability"
            >
              <BidDetailsForm
                control={control}
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                tenderEngagementType={tender.details?.engagementType}
                tenderBudget={tender.details?.budget ?? null}
              />
              {tender.details?.budget &&
                (tender.details.budget.min != null || tender.details.budget.max != null) && (
                  <BudgetRangeBar
                    min={tender.details.budget.min ?? 0}
                    max={tender.details.budget.max ?? 0}
                    bid={proposedAmount}
                    currency={currency}
                  />
                )}
            </SectionCard>
          </div>
        )}

        {/* ═══ STEP 2: Details ════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-5">
            <SectionCard
              title="Payment Milestones"
              icon={<CheckCircle2 className="w-4 h-4" />}
              complete={completions[2]}
              hint="Optional — but builds client trust significantly"
            >
              <MilestoneBuilder
                fields={milestoneFields as MilestoneField[]}
                append={appendMilestone}
                remove={removeMilestone}
                proposedAmount={proposedAmount}
                currency={currency}
              />
            </SectionCard>

            {screeningQuestions.length > 0 && (
              <SectionCard
                title="Screening Questions"
                icon={<AlertCircle className="w-4 h-4" />}
                badge={`${screeningQuestions.length} question${screeningQuestions.length !== 1 ? 's' : ''}`}
                required={screeningQuestions.some((q) => q.required)}
                complete={completions[3]}
                hint="Answer thoroughly — this greatly increases your chances"
              >
                <div className="space-y-5">
                  {screeningFields.map((field, i) => {
                    const q   = screeningQuestions[i];
                    if (!q) return null;
                    const cnt  = screenCharCounts[i] ?? 0;
                    const over = cnt > MAX_SCREEN;
                    return (
                      <div key={field.id} className={cn('rounded-xl border p-4 space-y-3', colorClasses.bg.secondary, colorClasses.border.gray200)}>
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#F1BB03]/20 text-[#F1BB03] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <label className={cn('text-sm font-medium flex-1', colorClasses.text.primary)}>
                            {q.question}
                            {q.required && <span className={cn('ml-1', colorClasses.text.red)}>*</span>}
                          </label>
                        </div>
                        <input type="hidden" {...register(`screeningAnswers.${i}.questionIndex` as const)} value={i} />
                        <input type="hidden" {...register(`screeningAnswers.${i}.questionText` as const)} value={q.question} />
                        <textarea
                          rows={4}
                          placeholder="Your detailed answer…"
                          maxLength={MAX_SCREEN + 50}
                          {...register(`screeningAnswers.${i}.answer` as const, {
                            required: q.required ? 'This question is required' : false,
                            maxLength: { value: MAX_SCREEN, message: `Max ${MAX_SCREEN} characters` },
                            onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              setScreenCharCounts((prev) => {
                                const n = [...prev]; n[i] = e.target.value.length; return n;
                              });
                            },
                          })}
                          className={cn(inputCls(over), 'resize-none')}
                        />
                        <div className="flex justify-end">
                          <span className={cn('text-xs tabular-nums', over ? colorClasses.text.red : colorClasses.text.muted)}>
                            {cnt} / {MAX_SCREEN}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            <SectionCard
              title="Portfolio Links"
              icon={<Link2 className="w-4 h-4" />}
              complete={completions[screeningQuestions.length > 0 ? 4 : 3]}
              hint="Share relevant work — GitHub, Behance, Dribbble, live sites"
            >
              <div className="space-y-2.5">
                {portfolioLinks.map((link, i) => (
                  <PortfolioLinkRow
                    key={i} index={i} value={link}
                    onChange={(v) => updatePortfolioLink(i, v)}
                    onRemove={() => removePortfolioLink(i)}
                  />
                ))}
                {portfolioLinks.length < 5 && (
                  <button
                    type="button" onClick={addPortfolioLink}
                    className="flex items-center gap-2 text-xs font-medium text-[#F1BB03] hover:text-[#d4a000] transition-colors py-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add another link
                  </button>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Attachments"
              icon={<Paperclip className="w-4 h-4" />}
              complete={completions[screeningQuestions.length > 0 ? 5 : 4]}
              hint="CV, portfolio samples, or any relevant documents"
            >
              {!proposalId && pendingFiles.length === 0 && (
                <div className={cn(
                  'flex items-center gap-2 text-xs mb-4 rounded-lg px-3 py-2.5 border',
                  colorClasses.bg.secondary, colorClasses.border.gray200,
                )}>
                  <Info className={cn('w-3.5 h-3.5 shrink-0', colorClasses.text.muted)} />
                  <span className={colorClasses.text.muted}>
                    Files will be attached automatically when your draft is first saved.
                  </span>
                </div>
              )}
              {pendingFiles.length > 0 && !proposalId && (
                <div className={cn(
                  'flex items-center gap-2 text-xs mb-4 rounded-lg px-3 py-2.5 border',
                  colorClasses.bg.amberLight, colorClasses.border.amber,
                )}>
                  <Loader2 className={cn('w-3.5 h-3.5 shrink-0 animate-spin', colorClasses.text.amber700)} />
                  <span className={colorClasses.text.amber700}>
                    {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} queued — will upload after draft is created
                  </span>
                </div>
              )}
              <AttachmentUploader
                proposalId={proposalId ?? 'pending'}
                attachments={attachments}
                onUpload={handleUpload}
                onDelete={handleDeleteAttachment}
                isUploading={uploadMutation.isPending}
              />
            </SectionCard>
          </div>
        )}

        {/* ═══ STEP 3: Review & Submit ═══════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Profile preview */}
            {freelancerProfile && <ProfilePreviewCard profile={freelancerProfile} />}

            {/* Proposal strength */}
            <ProposalStrengthInline
              completionScore={completionScore}
              totalSections={sectionLabels.length}
              completions={completions}
              sectionLabels={sectionLabels}
            />

            {/* Summary table */}
            <div className={cn('rounded-2xl border p-5', colorClasses.bg.primary, colorClasses.border.gray200)}>
              <h3 className={cn('text-sm font-bold mb-4', colorClasses.text.primary)}>Proposal Summary</h3>
              <div className="space-y-3">
                {[
                  {
                    label: 'Cover Letter',
                    val: coverLetter.length >= MIN_COVER
                      ? `${coverLetter.length} chars ✓`
                      : `${coverLetter.length}/${MIN_COVER} chars`,
                    ok: coverLetter.length >= MIN_COVER,
                  },
                  {
                    label: 'Bid Amount',
                    val: (formData.proposedAmount ?? 0) > 0
                      ? `${currency} ${(formData.proposedAmount ?? 0).toLocaleString()}`
                      : 'Not set',
                    ok: (formData.proposedAmount ?? 0) > 0,
                  },
                  {
                    label: 'Bid Type',
                    val: formData.bidType === 'hourly' ? 'Hourly Rate' : 'Fixed Price',
                    ok: true,
                  },
                  {
                    label: 'Delivery',
                    val: formData.deliveryTime?.value
                      ? `${formData.deliveryTime.value} ${formData.deliveryTime.unit}`
                      : 'Not set',
                    ok: !!formData.deliveryTime?.value,
                  },
                  {
                    label: 'Availability',
                    val: (formData.availability ?? 'Not set').replace(/-/g, ' '),
                    ok: !!formData.availability,
                  },
                  {
                    label: 'Milestones',
                    val: milestoneFields.length > 0
                      ? `${milestoneFields.length} milestone${milestoneFields.length !== 1 ? 's' : ''}`
                      : 'None',
                    ok: true,
                  },
                  {
                    label: 'Attachments',
                    val: attachments.length > 0
                      ? `${attachments.length} file${attachments.length !== 1 ? 's' : ''}`
                      : 'None',
                    ok: true,
                  },
                ].map(({ label, val, ok }) => (
                  <div key={label} className={cn(
                    'flex items-center justify-between py-2 px-3 rounded-lg',
                    colorClasses.bg.secondary,
                  )}>
                    <span className={cn('text-xs font-medium', colorClasses.text.muted)}>{label}</span>
                    <span className={cn(
                      'text-xs font-semibold capitalize',
                      ok ? colorClasses.text.primary : colorClasses.text.red,
                    )}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {validationErrors.length > 0 && <ValidationSummary errors={validationErrors} />}

            {/* Actions */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isCreating || saveState === 'saving'}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all',
                  colorClasses.border.gray200, colorClasses.text.primary, colorClasses.bg.secondary,
                  'hover:border-[#F1BB03] hover:text-[#F1BB03]',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                )}
              >
                {isCreating || saveState === 'saving'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> Save as Draft</>}
              </button>

              <button
                type="submit"
                onClick={() => setSubmitAttempted(true)}
                disabled={!canSubmit || submitMutation.isPending || isCreating}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold',
                  'shadow-lg shadow-[#F1BB03]/20 transition-all',
                  'bg-[#F1BB03] text-[#0A2540]',
                  'hover:brightness-105 active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {submitMutation.isPending || isCreating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  : <><Send className="w-4 h-4" /> Submit Proposal</>}
              </button>

              {!canSubmit && !submitAttempted && (
                <p className={cn('text-center text-xs', colorClasses.text.muted)}>
                  Complete all required fields to enable submission.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────── */}
        {step < 2 && (
          <div className="flex items-center gap-3 pt-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((p) => p - 1)}
                className={cn(
                  'flex items-center gap-1.5 px-5 py-3 rounded-xl border text-sm font-semibold transition-all',
                  colorClasses.bg.secondary, colorClasses.border.gray200, colorClasses.text.primary,
                  'hover:border-[#F1BB03] hover:text-[#F1BB03]',
                )}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setStep((p) => p + 1)}
              className={cn(
                'flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl text-sm font-bold transition-all flex-1',
                'bg-[#F1BB03] text-[#0A2540] hover:brightness-105 active:scale-[0.98]',
              )}
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </form>

      {/* Mobile sticky submit bar — only on step 2 */}
      {step === 2 && (
        <div className={cn(
          'fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 border-t backdrop-blur-md',
          colorClasses.bg.primary, colorClasses.border.gray200,
        )}>
          <div className={cn('flex-1 text-xs', colorClasses.text.muted)}>
            {saveState === 'saving'
              ? <span className={cn('inline-flex items-center gap-1', colorClasses.text.amber700)}><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>
              : saveState === 'saved'
              ? <span className={cn('inline-flex items-center gap-1', colorClasses.text.emerald700)}><CheckCircle2 className="w-3 h-3" /> Saved</span>
              : isDirty ? 'Unsaved changes' : 'Up to date'}
          </div>
          <button
            type="button"
            onClick={() => { setSubmitAttempted(true); handleSubmit(onSubmit)(); }}
            disabled={!canSubmit || submitMutation.isPending}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              'bg-[#F1BB03] text-[#0A2540] hover:brightness-105 active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {submitMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              : <><Send className="w-4 h-4" /> Submit</>}
          </button>
        </div>
      )}
    </div>
  );
}