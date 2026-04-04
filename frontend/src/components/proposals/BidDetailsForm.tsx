// components/proposals/freelancer/BidDetailsForm.tsx
// ─── Sections fixed ────────────────────────────────────────────────────────
// B:  All hardcoded slate/indigo colors → colorClasses
// C:  useResponsive — mobile single-column grids, touch targets
// C-11: inputCls pattern with #F1BB03 focus ring
// C-12: No indigo on active states — gold/[#0A2540]
// E-1: Card-style bid type selector, enhanced availability cards,
//      proposed total summary line
// F:  No "any", cn() throughout
'use client';
import React from 'react';
import { Briefcase, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import type {
  Control, UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors,
} from 'react-hook-form';
import type { CreateProposalData, ProposalCurrency, ProposalAvailability } from '@/services/proposalService';

interface Props {
  control: Control<CreateProposalData>;
  register: UseFormRegister<CreateProposalData>;
  watch: UseFormWatch<CreateProposalData>;
  setValue: UseFormSetValue<CreateProposalData>;
  errors: FieldErrors<CreateProposalData>;
  tenderEngagementType?: string;
  tenderBudget?: { min: number; max: number; currency: string } | null;
}

const CURRENCIES: ProposalCurrency[] = ['ETB', 'USD', 'EUR', 'GBP'];
const DURATION_UNITS = ['hours', 'days', 'weeks', 'months'] as const;
type DurationUnit = typeof DURATION_UNITS[number];

const AVAILABILITIES: { value: ProposalAvailability; label: string; desc: string; icon: string }[] = [
  { value: 'full-time', label: 'Full-time', desc: '40 hrs / wk', icon: '⚡' },
  { value: 'part-time', label: 'Part-time', desc: '~20 hrs / wk', icon: '⏰' },
  { value: 'flexible', label: 'Flexible', desc: 'Hours vary', icon: '🌿' },
];

// C-11: standard input class
const inputCls = (hasError?: unknown) => cn(
  'w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-150',
  colorClasses.bg.primary,
  colorClasses.border.gray200,
  colorClasses.text.primary,
  'placeholder:text-[#A0A0A0] dark:placeholder:text-[#6B7280]',
  'focus:ring-2 focus:ring-[#F1BB03]/40 focus:border-[#F1BB03]',
  !!hasError && cn(colorClasses.bg.redLight, 'border-red-400'),
);

const fmt = (n: number) => new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(n);

export function BidDetailsForm({
  register, watch, setValue, errors,
  tenderEngagementType, tenderBudget,
}: Props) {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const bidType = watch('bidType') ?? 'fixed';
  const proposedAmt = watch('proposedAmount') ?? 0;
  const hourlyRate = watch('hourlyRate') ?? 0;
  const weeklyHrs = watch('estimatedWeeklyHours') ?? 0;
  const currency = watch('currency') ?? 'ETB';
  const availability = watch('availability');
  const deliveryVal = watch('deliveryTime.value') ?? 0;
  const deliveryUnit = (watch('deliveryTime.unit') ?? 'weeks') as DurationUnit;

  const canBeHourly = tenderEngagementType === 'hourly' || !tenderEngagementType;

  const isOutsideBudget = tenderBudget && proposedAmt > 0
    ? proposedAmt < tenderBudget.min || proposedAmt > tenderBudget.max
    : false;

  // E-1: proposed total summary
  const estimatedTotal = bidType === 'hourly' && hourlyRate > 0 && weeklyHrs > 0
    ? (() => {
      const unitToWeeks: Record<DurationUnit, number> = { hours: 1 / 40, days: 1 / 5, weeks: 1, months: 4 };
      return hourlyRate * weeklyHrs * (deliveryVal || 1) * (unitToWeeks[deliveryUnit] ?? 1);
    })()
    : proposedAmt;

  const showSummary = proposedAmt > 0 && deliveryVal > 0 && availability;

  return (
    <div className="space-y-6">

      {/* ── E-1: Card-style Bid Type Selector ──────────────────────────── */}
      {canBeHourly && (
        <div>
          <label className={cn('mb-2 block text-sm font-semibold', colorClasses.text.primary)}>
            Bid Type
          </label>
          <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
            {([
              { id: 'fixed', title: 'Fixed Price', desc: 'Pay once for the full project', icon: <Briefcase className="w-5 h-5" /> },
              { id: 'hourly', title: 'Hourly Rate', desc: 'Pay per hour tracked', icon: <Clock className="w-5 h-5" /> },
            ] as const).map(({ id, title, desc, icon }) => {
              const active = bidType === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setValue('bidType', id)}
                  className={cn(
                    'relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                    getTouchTargetSize('md'),
                    active
                      ? 'border-[#F1BB03] bg-[#FFFBEB] dark:bg-[#F1BB03]/10 ring-2 ring-[#F1BB03]/30'
                      : cn(colorClasses.bg.primary, colorClasses.border.gray200, 'hover:border-[#F1BB03]/50'),
                  )}
                >
                  <span className={cn('mt-0.5 shrink-0', active ? 'text-[#F1BB03]' : colorClasses.text.muted)}>
                    {icon}
                  </span>
                  <div>
                    <p className={cn('text-sm font-bold', active ? 'text-[#0A2540] dark:text-[#F1BB03]' : colorClasses.text.primary)}>
                      {title}
                    </p>
                    <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>{desc}</p>
                  </div>
                  {active && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1BB03] text-[#0A2540]">
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Amount + Currency ────────────────────────────────────────────── */}
      <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
        <div>
          <label className={cn('mb-1.5 block text-sm font-semibold', colorClasses.text.primary)}>
            {bidType === 'hourly' ? 'Hourly Rate' : 'Total Amount'}
            <span className={colorClasses.text.red}> *</span>
          </label>
          <input
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 9500"
            {...register('proposedAmount', {
              required: 'Amount is required',
              min: { value: 1, message: 'Must be > 0' },
              valueAsNumber: true,
            })}
            className={inputCls(errors.proposedAmount)}
          />
          {errors.proposedAmount && (
            <p className={cn('mt-1 text-xs', colorClasses.text.red)}>{errors.proposedAmount.message}</p>
          )}
        </div>

        {bidType === 'hourly' && (
          <div>
            <label className={cn('mb-1.5 block text-sm font-semibold', colorClasses.text.primary)}>
              Weekly Hours
            </label>
            <input
              type="number"
              min={1}
              max={80}
              placeholder="e.g. 40"
              {...register('estimatedWeeklyHours', { min: 1, max: 80, valueAsNumber: true })}
              className={inputCls(errors.estimatedWeeklyHours)}
            />
          </div>
        )}

        <div>
          <label className={cn('mb-1.5 block text-sm font-semibold', colorClasses.text.primary)}>Currency</label>
          <select {...register('currency')} className={inputCls()}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── Budget context banner ────────────────────────────────────────── */}
      {tenderBudget && (tenderBudget.min != null || tenderBudget.max != null) && (
        <div className={cn(
          'rounded-xl border px-4 py-3 text-sm',
          isOutsideBudget
            ? cn(colorClasses.bg.amberLight, colorClasses.border.amber, colorClasses.text.amber700)
            : cn(colorClasses.bg.secondary, colorClasses.border.gray200, colorClasses.text.secondary),
        )}>
          {isOutsideBudget ? '⚠ ' : ''}
          Client budget:{' '}
          <strong className={colorClasses.text.primary}>
            {tenderBudget.min != null ? fmt(tenderBudget.min) : '—'}–{tenderBudget.max != null ? fmt(tenderBudget.max) : '—'} {tenderBudget.currency ?? ''}
          </strong>
          {isOutsideBudget && ' · Your bid is outside this range.'}
        </div>
      )}

      {/* ── Delivery Time ────────────────────────────────────────────────── */}
      <div>
        <label className={cn('mb-1.5 block text-sm font-semibold', colorClasses.text.primary)}>
          Estimated Delivery <span className={colorClasses.text.red}>*</span>
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            min={1}
            placeholder="e.g. 8"
            {...register('deliveryTime.value', { required: true, min: 1, valueAsNumber: true })}
            className={cn(inputCls(errors.deliveryTime?.value), 'w-28')}
          />
          <select {...register('deliveryTime.unit', { required: true })} className={inputCls()}>
            {DURATION_UNITS.map((u) => (
              <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── E-1: Enhanced Availability Cards ─────────────────────────────── */}
      <div>
        <label className={cn('mb-2 block text-sm font-semibold', colorClasses.text.primary)}>
          Availability <span className={colorClasses.text.red}>*</span>
        </label>
        <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
          {AVAILABILITIES.map(({ value, label, desc, icon }) => {
            const active = availability === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue('availability', value)}
                className={cn(
                  'relative flex flex-col items-start rounded-xl border px-3 py-3 text-left transition-all',
                  getTouchTargetSize('md'),
                  active
                    ? 'border-[#F1BB03] bg-[#FFFBEB] dark:bg-[#F1BB03]/10 ring-2 ring-[#F1BB03]/30'
                    : cn(colorClasses.bg.primary, colorClasses.border.gray200, 'hover:border-[#F1BB03]/40'),
                )}
              >
                <div className="flex items-center gap-2 mb-1 w-full">
                  <span className="text-base">{icon}</span>
                  <p className={cn('text-sm font-semibold flex-1', active ? 'text-[#0A2540] dark:text-[#F1BB03]' : colorClasses.text.primary)}>
                    {label}
                  </p>
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Available now" />
                  )}
                </div>
                <p className={cn('text-xs', colorClasses.text.muted)}>{desc}</p>
              </button>
            );
          })}
        </div>
        {errors.availability && (
          <p className={cn('mt-1 text-xs', colorClasses.text.red)}>Availability is required.</p>
        )}
      </div>

      {/* ── Proposed Start Date ──────────────────────────────────────────── */}
      <div>
        <label className={cn('mb-1.5 block text-sm font-semibold', colorClasses.text.primary)}>
          Proposed Start Date{' '}
          <span className={cn('text-xs font-normal', colorClasses.text.muted)}>(optional)</span>
        </label>
        <input
          type="date"
          {...register('proposedStartDate')}
          className={inputCls()}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* ── E-1: Proposed Total Summary ─────────────────────────────────── */}
      {showSummary && (
        <div className={cn(
          'rounded-xl border px-4 py-3 flex items-center justify-between',
          colorClasses.bg.secondary, colorClasses.border.gray200,
        )}>
          <div>
            <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>
              Proposal Summary
            </p>
            <p className={cn('text-sm font-bold', colorClasses.text.primary)}>
              {currency} {fmt(estimatedTotal)} total
            </p>
          </div>
          <div className="text-right">
            <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>Delivery</p>
            <p className={cn('text-sm font-bold', colorClasses.text.primary)}>
              {deliveryVal} {deliveryUnit}
            </p>
          </div>
          <div className="text-right">
            <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>Availability</p>
            <p className={cn('text-sm font-semibold capitalize', colorClasses.text.secondary)}>
              {availability?.replace('-', ' ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}