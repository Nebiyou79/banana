// components/proposals/freelancer/MilestoneBuilder.tsx
// ─── Sections fixed ────────────────────────────────────────────────────────
// B:  All hardcoded slate/indigo colors → colorClasses
// C:  useResponsive — mobile full-width fields
// C-11: inputCls with #F1BB03 focus ring
// C-12: Toggle uses bg-[#F1BB03] (Banana gold) not indigo
// E-2: Drag-to-reorder with drag handle, gold numbered circles,
//      milestone % auto-calculation, visual timeline footer
// F:  No "any" — typed ProposalMilestone
'use client';
import React, { useState, useRef } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import type { UseFieldArrayReturn, FieldErrors } from 'react-hook-form';
import type { CreateProposalData, ProposalMilestone } from '@/services/proposalService';

type MilestoneFields = UseFieldArrayReturn<CreateProposalData, 'milestones'>;

interface Props {
  fields: MilestoneFields['fields'];
  append: MilestoneFields['append'];
  remove: MilestoneFields['remove'];
  update: MilestoneFields['update'];
  proposedAmount: number;
  currency: string;
  errors: FieldErrors<CreateProposalData>;
}

const DURATION_UNITS = ['days', 'weeks', 'months'] as const;
const TOLERANCE = 0.05;

const fmt = (n: number, c: string) =>
  new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(n) + ` ${c}`;

// C-11: inputCls
const inputCls = (hasError?: boolean) => cn(
  'w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-150',
  colorClasses.bg.primary,
  colorClasses.border.gray200,
  colorClasses.text.primary,
  'placeholder:text-[#A0A0A0] dark:placeholder:text-[#6B7280]',
  'focus:ring-2 focus:ring-[#F1BB03]/40 focus:border-[#F1BB03]',
  hasError && cn(colorClasses.bg.redLight, 'border-red-400'),
);

// Type the field properly
type MilestoneField = ProposalMilestone & { id: string };

export function MilestoneBuilder({
  fields, append, remove, update, proposedAmount, currency, errors,
}: Props) {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const [enabled, setEnabled] = useState(fields.length > 0);
  // E-2: drag state
  const dragIndex = useRef<number | null>(null);
  const overIndex = useRef<number | null>(null);

  const milestoneTotal = (fields as MilestoneField[]).reduce((s, f) => s + (f.amount ?? 0), 0);
  const diff = Math.abs(milestoneTotal - proposedAmount);
  const isMatch = proposedAmount === 0 || diff / proposedAmount <= TOLERANCE;

  const handleAdd = () => {
    append({
      title: '',
      description: '',
      amount: 0,
      duration: 1,
      durationUnit: 'weeks',
      order: fields.length,
    });
  };

  const handleToggle = () => {
    if (enabled) {
      for (let i = fields.length - 1; i >= 0; i--) remove(i);
    }
    setEnabled((p) => !p);
  };

  // E-2: drag handlers
  const onDragStart = (i: number) => { dragIndex.current = i; };
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    overIndex.current = i;
  };
  const onDrop = () => {
    const from = dragIndex.current;
    const to = overIndex.current;
    if (from === null || to === null || from === to) return;

    // Reorder: snapshot all fields, move from→to, re-update via remove+append
    const snapshot = (fields as MilestoneField[]).map((f) => ({ ...f }));
    const [moved] = snapshot.splice(from, 1);
    snapshot.splice(to, 0, moved);

    // Remove all from end, re-append in new order
    for (let i = fields.length - 1; i >= 0; i--) remove(i);
    snapshot.forEach((m, idx) => append({ ...m, order: idx }));

    dragIndex.current = null;
    overIndex.current = null;
  };

  // E-2: percentage of total for a milestone amount
  const pctOf = (amount: number) =>
    proposedAmount > 0 ? Math.round((amount / proposedAmount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* ── Toggle ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>Payment Milestones</p>
          <p className={cn('text-xs', colorClasses.text.muted)}>Break your payment into stages</p>
        </div>
        {/* C-12: gold toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40 focus:ring-offset-1',
            enabled ? 'bg-[#F1BB03]' : colorClasses.bg.gray200,
          )}
        >
          <span className={cn(
            'inline-block h-4 w-4 rounded-full shadow-sm transition-transform',
            enabled ? 'translate-x-6 bg-[#0A2540]' : 'translate-x-1 bg-white',
          )} />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3">
          {(fields as MilestoneField[]).map((field, i) => (
            <div
              key={field.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={onDrop}
              className={cn(
                'rounded-xl border p-4 transition-all',
                colorClasses.bg.secondary,
                colorClasses.border.gray200,
              )}
            >
              {/* Card header: drag handle + gold number + remove */}
              <div className="mb-3 flex items-center gap-2">
                {/* E-2: drag handle */}
                <GripVertical
                  className={cn('w-4 h-4 shrink-0 cursor-grab', colorClasses.text.muted)}
                  aria-label="Drag to reorder"
                />
                {/* E-2: gold numbered circle */}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F1BB03] text-[#0A2540] text-[10px] font-bold shrink-0">
                  {i + 1}
                </span>
                <p className={cn('text-xs font-semibold flex-1', colorClasses.text.secondary)}>
                  Milestone {i + 1}
                  {field.amount > 0 && proposedAmount > 0 && (
                    <span className={cn('ml-2 text-[10px] font-normal', colorClasses.text.muted)}>
                      ({pctOf(field.amount)}% of total)
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className={cn('flex items-center gap-1 text-xs transition-colors', colorClasses.text.red, getTouchTargetSize('sm'))}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>

              <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                {/* Title */}
                <div className="col-span-full">
                  <input
                    placeholder="Milestone title *"
                    defaultValue={field.title}
                    onChange={(e) => update(i, { ...field, title: e.target.value })}
                    className={inputCls()}
                  />
                </div>
                {/* Description */}
                <div className="col-span-full">
                  <textarea
                    rows={2}
                    placeholder="Description (optional)"
                    defaultValue={field.description}
                    onChange={(e) => update(i, { ...field, description: e.target.value })}
                    className={cn(inputCls(), 'resize-none')}
                  />
                </div>
                {/* Amount */}
                <div>
                  <input
                    type="number"
                    min={0}
                    placeholder={`Amount (${currency})`}
                    defaultValue={field.amount || ''}
                    onChange={(e) => update(i, { ...field, amount: parseFloat(e.target.value) || 0 })}
                    className={inputCls()}
                  />
                </div>
                {/* Duration */}
                <div className={cn('flex gap-2', isMobile ? 'w-full' : '')}>
                  <input
                    type="number"
                    min={1}
                    placeholder="Duration"
                    defaultValue={field.duration || ''}
                    onChange={(e) => update(i, { ...field, duration: parseInt(e.target.value) || 1 })}
                    className={cn(inputCls(), 'w-24 shrink-0')}
                  />
                  <select
                    defaultValue={field.durationUnit ?? 'weeks'}
                    onChange={(e) => update(i, { ...field, durationUnit: e.target.value as ProposalMilestone['durationUnit'] })}
                    className={cn(inputCls(), 'flex-1')}
                  >
                    {DURATION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* Add button */}
          <button
            type="button"
            onClick={handleAdd}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3',
              'text-sm font-medium transition-colors',
              colorClasses.border.gray200, colorClasses.text.muted,
              'hover:border-[#F1BB03] hover:text-[#F1BB03]',
              getTouchTargetSize('md'),
            )}
          >
            <Plus className="w-4 h-4" /> Add Milestone
          </button>

          {/* E-2: Footer total with color-coded match */}
          {fields.length > 0 && (
            <div className={cn(
              'flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold',
              isMatch
                ? cn(colorClasses.bg.emeraldLight, colorClasses.text.emerald700)
                : cn(colorClasses.bg.redLight, colorClasses.text.red),
            )}>
              <span>Milestone total: {fmt(milestoneTotal, currency)}</span>
              <span className="flex items-center gap-1">
                Your bid: {fmt(proposedAmount, currency)}
                {isMatch ? ' ✓' : ' ⚠ Must match within 5%'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}