// src/components/bids/FinancialBreakdownTable.tsx
import { useState, useCallback } from 'react';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import type { FinancialBreakdown, FinancialBreakdownItem } from '@/services/bidService';

// ─── Props (100% identical to previous interface) ──────────────────────────
interface FinancialBreakdownTableProps {
  breakdown: FinancialBreakdown;
  editable?: boolean;
  onChange?: (b: FinancialBreakdown) => void;
}

type Category = NonNullable<FinancialBreakdownItem['category']>;

const CATEGORIES: Category[] = ['labor', 'materials', 'logistics', 'overhead', 'tax', 'other'];

const categoryBadge: Record<Category, string> = {
  labor: `${colorClasses.bg.blueLight} ${colorClasses.text.blue600}`,
  materials: `${colorClasses.bg.tealLight} ${colorClasses.text.teal}`,
  logistics: `${colorClasses.bg.amberLight} ${colorClasses.text.amber700}`,
  overhead: `${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`,
  tax: `${colorClasses.bg.redLight} ${colorClasses.text.red}`,
  other: `${colorClasses.bg.grayLight} ${colorClasses.text.muted}`,
};

const categoryDotColors: Record<Category, string> = {
  labor: 'bg-blue-400',
  materials: 'bg-teal-400',
  logistics: 'bg-amber-400',
  overhead: 'bg-purple-400',
  tax: 'bg-red-400',
  other: 'bg-gray-400',
};

const fmt = (n?: number, currency = 'ETB') =>
  n != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n)
    : '—';

const blankItem = (): FinancialBreakdownItem => ({
  description: '',
  unit: '',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
  category: 'other',
});

// ─── TotalRow helper ────────────────────────────────────────────────────────
const TotalRow = ({
  label,
  value,
  currency,
  bold = false,
  isNegative = false,
}: {
  label: string;
  value: number;
  currency: string;
  bold?: boolean;
  isNegative?: boolean;
}) => (
  <div className="flex justify-between w-full sm:w-72">
    <span className={bold ? `font-bold ${colorClasses.text.primary}` : colorClasses.text.muted}>{label}</span>
    <span className={`font-${bold ? 'bold' : 'medium'} ${isNegative ? 'text-[#EF4444]' : bold ? 'text-[#F1BB03] text-xl' : colorClasses.text.primary}`}>
      {isNegative ? '−' : ''}{fmt(Math.abs(value), currency)}
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
export const FinancialBreakdownTable = ({
  breakdown,
  editable = false,
  onChange,
}: FinancialBreakdownTableProps) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  // ── Local state (performance: only emit to parent onBlur / structural changes) ──
  const [items, setItems] = useState<FinancialBreakdownItem[]>(breakdown.items ?? []);
  const [vatPct, setVatPct] = useState(breakdown.vatPercentage ?? 15);
  const [discount, setDiscount] = useState(breakdown.discount ?? 0);
  const [paymentTerms, setPaymentTerms] = useState(breakdown.paymentTerms ?? '');

  const currency = breakdown.currency ?? 'ETB';

  // Derived totals
  const subtotal = items.reduce((s, i) => s + (i.totalPrice ?? 0), 0);
  const vatAmount = subtotal * (vatPct / 100);
  const totalWithVAT = subtotal + vatAmount - discount;

  // Emit to parent — called only on blur or structural changes
  const emit = useCallback(
    (nextItems: FinancialBreakdownItem[], nextVat = vatPct, nextDiscount = discount, nextTerms = paymentTerms) => {
      onChange?.({
        ...breakdown,
        items: nextItems,
        subtotal: nextItems.reduce((s, i) => s + i.totalPrice, 0),
        vatPercentage: nextVat,
        vatAmount: nextItems.reduce((s, i) => s + i.totalPrice, 0) * (nextVat / 100),
        discount: nextDiscount,
        totalWithVAT:
          nextItems.reduce((s, i) => s + i.totalPrice, 0) * (1 + nextVat / 100) - nextDiscount,
        paymentTerms: nextTerms,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vatPct, discount, paymentTerms, onChange, breakdown]
  );

  // Local update — does NOT call emit
  const updateItemLocal = (index: number, patch: Partial<FinancialBreakdownItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        if ('quantity' in patch || 'unitPrice' in patch) {
          next.totalPrice = (next.quantity ?? 0) * (next.unitPrice ?? 0);
        }
        return next;
      })
    );
  };

  // Immediate structural update — DOES call emit
  const updateItemAndEmit = (index: number, patch: Partial<FinancialBreakdownItem>) => {
    setItems((prev) => {
      const updated = prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        if ('quantity' in patch || 'unitPrice' in patch) {
          next.totalPrice = (next.quantity ?? 0) * (next.unitPrice ?? 0);
        }
        return next;
      });
      emit(updated);
      return updated;
    });
  };

  // ── FIX #2: type="button" + stopPropagation on Add/Remove ──────────────
  const addRow = () => {
    const updated = [...items, blankItem()];
    setItems(updated);
    emit(updated);
  };

  const removeRow = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    emit(updated);
  };

  // ─── Shared input cell class (spreadsheet style) ────────────────────────
  const inputCellClass = [
    'w-full bg-transparent border-0 border-b-2 border-transparent',
    'focus:border-[#F1BB03] focus:outline-none px-1 py-0.5 text-xs',
    colorClasses.text.primary,
    'transition-colors',
  ].join(' ');

  const footerInputClass = [
    'rounded-lg border text-xs px-2 py-1',
    colorClasses.border.secondary,
    colorClasses.bg.surface,
    colorClasses.text.primary,
    'focus:outline-none focus:ring-1 focus:ring-[#F1BB03]/40',
  ].join(' ');

  // ═══════════════════════════════════════════════════════════════════════
  // READ-ONLY MODE
  // ═══════════════════════════════════════════════════════════════════════
  if (!editable) {
    return (
      <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${colorClasses.border.secondary} ${colorClasses.bg.surface}`}>
          <h3 className={`text-sm font-bold ${colorClasses.text.primary}`}>💰 Financial Breakdown</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${colorClasses.bg.surface} text-xs uppercase`}>
                {['Description', 'Category', 'Qty', 'Unit', 'Unit Price', 'Total'].map((h) => (
                  <th key={h} className={`px-4 py-3 text-left font-semibold ${colorClasses.text.muted}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${colorClasses.border.secondary}`}>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-4 py-8 text-center text-sm ${colorClasses.text.muted}`}>
                    No line items
                  </td>
                </tr>
              ) : (
                items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className={`px-4 py-3 ${colorClasses.text.primary} font-medium`}>{item.description}</td>
                    <td className="px-4 py-3">
                      {item.category && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryBadge[item.category]}`}>
                          {item.category}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${colorClasses.text.secondary}`}>{item.quantity ?? '—'}</td>
                    <td className={`px-4 py-3 ${colorClasses.text.secondary}`}>{item.unit ?? '—'}</td>
                    <td className={`px-4 py-3 ${colorClasses.text.secondary}`}>{fmt(item.unitPrice, currency)}</td>
                    <td className={`px-4 py-3 font-semibold ${colorClasses.text.primary}`}>{fmt(item.totalPrice, currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              {[
                { label: 'Subtotal', value: subtotal },
                { label: `VAT (${vatPct}%)`, value: vatAmount },
                ...(discount > 0 ? [{ label: 'Discount', value: -discount, neg: true }] : []),
                { label: 'Total with VAT', value: totalWithVAT, bold: true },
              ].map((row) => (
                <tr key={row.label} className={`${colorClasses.bg.surface} border-t ${colorClasses.border.secondary}`}>
                  <td colSpan={5} className={`px-4 py-2.5 text-right text-sm ${row.bold ? `font-bold ${colorClasses.text.primary}` : colorClasses.text.muted}`}>
                    {row.label}
                  </td>
                  <td className={`px-4 py-2.5 text-sm font-bold ${row.bold ? 'text-[#F1BB03]' : colorClasses.text.primary}`}>
                    {fmt(Math.abs(row.value), currency)}
                  </td>
                </tr>
              ))}
            </tfoot>
          </table>
        </div>

        {paymentTerms && (
          <div className={`px-5 py-3 border-t ${colorClasses.border.secondary}`}>
            <p className={`text-xs ${colorClasses.text.muted}`}>
              <span className="font-semibold">Payment Terms:</span> {paymentTerms}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EDITABLE MODE
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} overflow-hidden`}>

      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-3.5 border-b ${colorClasses.border.secondary} ${colorClasses.bg.surface} sticky top-0 z-10`}>
        <div>
          <h3 className={`text-sm font-bold ${colorClasses.text.primary}`}>💰 Financial Breakdown</h3>
          <p className={`text-xs ${colorClasses.text.muted} mt-0.5`}>
            {items.length} line item{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* FIX #1 & #2: type="button" MANDATORY — prevents form submission */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); addRow(); }}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg bg-[#F1BB03] text-[#0A2540] hover:opacity-80 active:scale-95 transition-all ${getTouchTargetSize('sm')}`}
        >
          + Add Row
        </button>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <span className="text-4xl">📋</span>
          <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>No line items yet</p>
          <p className={`text-xs ${colorClasses.text.muted}`}>Click &quot;+ Add Row&quot; to start building your quote</p>
        </div>
      )}

      {/* Mobile: card layout */}
      {isMobile && items.length > 0 && (
        <div className="p-3 space-y-3">
          {items.map((item, i) => (
            <div key={i} className={`group rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-4 space-y-3`}>
              {/* Row 1: description + delete */}
              <div className="flex items-start gap-2">
                <input
                  className={`flex-1 text-sm font-medium border rounded-lg px-2 py-1.5 ${colorClasses.border.secondary} ${colorClasses.bg.primary} ${colorClasses.text.primary} focus:outline-none focus:ring-1 focus:ring-[#F1BB03]/40`}
                  value={item.description}
                  onChange={(e) => updateItemLocal(i, { description: e.target.value })}
                  onBlur={() => emit(items)}
                  placeholder="Description"
                  aria-label="Item description"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeRow(i); }}
                  className={`text-[#EF4444] hover:opacity-70 flex items-center justify-center ${getTouchTargetSize('sm')}`}
                  aria-label="Remove row"
                >
                  ✕
                </button>
              </div>
              {/* Row 2: category + qty + unit */}
              <div className="flex gap-2">
                <select
                  value={item.category ?? 'other'}
                  onChange={(e) => updateItemAndEmit(i, { category: e.target.value as Category })}
                  className={`flex-1 text-xs rounded-lg border px-2 py-1.5 ${colorClasses.border.secondary} ${colorClasses.bg.primary} ${colorClasses.text.primary} focus:outline-none`}
                  aria-label="Category"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="number"
                  className={`w-16 text-xs rounded-lg border px-2 py-1.5 ${colorClasses.border.secondary} ${colorClasses.bg.primary} ${colorClasses.text.primary} focus:outline-none`}
                  value={item.quantity ?? ''}
                  onChange={(e) => updateItemLocal(i, { quantity: Number(e.target.value) })}
                  onBlur={() => emit(items)}
                  placeholder="Qty"
                  aria-label="Quantity"
                />
                <input
                  className={`w-16 text-xs rounded-lg border px-2 py-1.5 ${colorClasses.border.secondary} ${colorClasses.bg.primary} ${colorClasses.text.primary} focus:outline-none`}
                  value={item.unit ?? ''}
                  onChange={(e) => updateItemLocal(i, { unit: e.target.value })}
                  onBlur={() => emit(items)}
                  placeholder="unit"
                  aria-label="Unit"
                />
              </div>
              {/* Row 3: unit price → total */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${colorClasses.text.muted}`}>@</span>
                  <input
                    type="number"
                    className={`w-28 text-xs rounded-lg border px-2 py-1.5 ${colorClasses.border.secondary} ${colorClasses.bg.primary} ${colorClasses.text.primary} focus:outline-none`}
                    value={item.unitPrice ?? ''}
                    onChange={(e) => updateItemLocal(i, { unitPrice: Number(e.target.value) })}
                    onBlur={() => emit(items)}
                    placeholder="Unit price"
                    aria-label="Unit price"
                  />
                </div>
                <span className={`text-sm font-bold ${colorClasses.text.primary}`}>
                  = {fmt(item.totalPrice, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop/Tablet: table layout */}
      {!isMobile && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`${colorClasses.bg.surface} uppercase`}>
                {['Description', 'Category', 'Qty', 'Unit', 'Unit Price', 'Total', ''].map((h) => (
                  <th key={h} className={`px-3 py-2 text-left font-semibold ${colorClasses.text.muted}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${colorClasses.border.secondary}`}>
              {items.map((item, i) => (
                <tr key={i} className={`group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors`}>
                  <td className="px-2 py-2 min-w-[180px]">
                    <input
                      className={inputCellClass}
                      value={item.description}
                      onChange={(e) => updateItemLocal(i, { description: e.target.value })}
                      onBlur={() => emit(items)}
                      placeholder="Description"
                      aria-label="Item description"
                    />
                  </td>
                  <td className="px-2 py-2 min-w-[110px]">
                    <div className="relative flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${categoryDotColors[item.category ?? 'other']}`} />
                      <select
                        value={item.category ?? 'other'}
                        onChange={(e) => updateItemAndEmit(i, { category: e.target.value as Category })}
                        className={`${inputCellClass} appearance-none cursor-pointer`}
                        aria-label="Category"
                      >
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-2 py-2 w-16">
                    <input
                      type="number"
                      className={inputCellClass}
                      value={item.quantity ?? ''}
                      onChange={(e) => updateItemLocal(i, { quantity: Number(e.target.value) })}
                      onBlur={() => emit(items)}
                      aria-label="Quantity"
                    />
                  </td>
                  <td className="px-2 py-2 w-16">
                    <input
                      className={inputCellClass}
                      value={item.unit ?? ''}
                      onChange={(e) => updateItemLocal(i, { unit: e.target.value })}
                      onBlur={() => emit(items)}
                      placeholder="pcs"
                      aria-label="Unit"
                    />
                  </td>
                  <td className="px-2 py-2 w-28">
                    <input
                      type="number"
                      className={inputCellClass}
                      value={item.unitPrice ?? ''}
                      onChange={(e) => updateItemLocal(i, { unitPrice: Number(e.target.value) })}
                      onBlur={() => emit(items)}
                      aria-label="Unit price"
                    />
                  </td>
                  <td className={`px-3 py-2 font-semibold ${colorClasses.text.primary} w-28 whitespace-nowrap text-right`}>
                    {fmt(item.totalPrice, currency)}
                  </td>
                  <td className="px-2 py-2 w-10">
                    {/* FIX #2: type="button" — prevents triggering form onSubmit */}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeRow(i); }}
                      className={`text-[#EF4444] hover:opacity-70 transition-opacity opacity-0 group-hover:opacity-100 leading-none ${getTouchTargetSize('sm')}`}
                      aria-label="Remove row"
                      title="Remove row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {(items.length > 0 || editable) && (
        <div className={`px-5 py-5 border-t ${colorClasses.border.secondary} ${colorClasses.bg.surface} rounded-b-2xl`}>
          {/* VAT + Discount controls */}
          <div className="flex flex-wrap gap-4 mb-4">
            <label className={`flex items-center gap-2 text-xs ${colorClasses.text.muted}`}>
              VAT %
              <input
                type="number"
                value={vatPct}
                onChange={(e) => setVatPct(Number(e.target.value))}
                onBlur={() => emit(items, vatPct, discount, paymentTerms)}
                className={`w-16 ${footerInputClass}`}
                aria-label="VAT percentage"
              />
            </label>
            <label className={`flex items-center gap-2 text-xs ${colorClasses.text.muted}`}>
              Discount
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                onBlur={() => emit(items, vatPct, discount, paymentTerms)}
                className={`w-20 ${footerInputClass}`}
                aria-label="Discount amount"
              />
            </label>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end gap-1.5 text-sm">
            <TotalRow label="Subtotal" value={subtotal} currency={currency} />
            <TotalRow label={`VAT (${vatPct}%)`} value={vatAmount} currency={currency} />
            {discount > 0 && (
              <TotalRow label="Discount" value={discount} currency={currency} isNegative />
            )}
            <div className={`w-full sm:w-72 pt-2 mt-1 border-t ${colorClasses.border.secondary}`}>
              <TotalRow label="Total with VAT" value={totalWithVAT} currency={currency} bold />
            </div>
          </div>

          {/* Payment terms */}
          <div className={`flex items-center gap-2 text-xs mt-4 pt-4 border-t ${colorClasses.border.secondary}`}>
            <span className={`shrink-0 ${colorClasses.text.muted}`}>Payment Terms:</span>
            <input
              className={`flex-1 ${footerInputClass} focus:ring-1 focus:ring-[#F1BB03]/40`}
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              onBlur={() => emit(items, vatPct, discount, paymentTerms)}
              placeholder="e.g. Net 30 days"
              aria-label="Payment terms"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialBreakdownTable;