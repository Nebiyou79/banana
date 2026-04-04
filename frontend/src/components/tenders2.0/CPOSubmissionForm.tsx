// src/components/tender/professional/CPOSubmissionForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProfessionalTender, useSubmitCPO, useCPOSubmissions, useVerifyCPO } from '@/hooks/useProfessionalTender';
import { colorClasses } from '@/utils/color';
import type { ProfessionalTender, ProfessionalTenderCPO } from '@/types/tender.types';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

const isExpiringSoon = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
};

const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    verified: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize
        ${map[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface CPOFormFields {
  cpoNumber: string;
  amount: number;
  currency: 'ETB' | 'USD' | 'EUR';
  issuingBank: string;
  issueDate: string;
  expiryDate: string;
  document: FileList;
}

interface CPOSubmissionFormProps {
  tenderId: string;
  onSuccess?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  existingCPO?: ProfessionalTenderCPO;
}

// ─────────────────────────────────────────────
// CPOSubmissionForm
// ─────────────────────────────────────────────
export const CPOSubmissionForm: React.FC<CPOSubmissionFormProps> = ({
  tenderId,
  onSuccess,
  isOpen = true,
  onClose = () => {},
  existingCPO,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CPOFormFields>({
    defaultValues: { currency: 'ETB' },
  });

  const { mutate: submitCPO, isPending } = useSubmitCPO();

  if (!isOpen) return null;

  const isRejected = existingCPO?.status === 'rejected';
  const hasExisting = !!existingCPO && !isRejected;

  const onSubmit = (data: CPOFormFields) => {
    const file = data.document?.[0];
    if (!file) return;

    submitCPO(
      {
        id: tender._id,
        data: {
          cpoNumber: data.cpoNumber,
          amount: data.amount,
          currency: data.currency,
          issuingBank: data.issuingBank,
          issueDate: data.issueDate,
          expiryDate: data.expiryDate,
        },
        file,
      },
      { onSuccess: onClose }
    );
  };

  const today = new Date().toISOString().split('T')[0];
  const issueDate = watch('issueDate');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative z-10 w-full max-w-lg rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]
          ${colorClasses.bg.white}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${colorClasses.border.gray200}`}>
          <div>
            <h2 className={`text-lg font-bold ${colorClasses.text.primary}`}>
              {hasExisting ? 'CPO Submission' : 'Submit CPO'}
            </h2>
            <p className={`text-sm ${colorClasses.text.muted}`}>
              Call for Prequalification document
            </p>
          </div>
          <button onClick={onClose} className={`p-2 hover:opacity-70 ${colorClasses.text.muted}`}>
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Info Banner */}
          <div className={`rounded-lg border p-4 ${colorClasses.bg.blueLight} border-blue-300`}>
            <p className="text-sm font-semibold text-blue-800 mb-1">CPO Requirement</p>
            <p className="text-sm text-blue-700">
              A Certified Payment Order (CPO) is required as bid security. Required amount:{' '}
              <strong>
                {formatCurrency(
                  tender.procurement?.bidSecurityAmount ?? 0,
                  tender.procurement?.bidSecurityCurrency ?? 'ETB'
                )}
              </strong>
            </p>
          </div>

          {/* Rejection reason */}
          {isRejected && (existingCPO as any)?.rejectionReason && (
            <div className={`rounded-lg border p-4 ${colorClasses.bg.redLight} border-red-300`}>
              <p className={`text-sm font-semibold ${colorClasses.text.error}`}>Rejection Reason</p>
              <p className={`mt-1 text-sm ${colorClasses.text.error}`}>
                {(existingCPO as any).rejectionReason}
              </p>
              <p className={`mt-2 text-xs ${colorClasses.text.muted}`}>
                Please correct the issue and resubmit.
              </p>
            </div>
          )}

          {/* Read-only existing CPO view */}
          {hasExisting ? (
            <div className="space-y-3">
              <StatusBadge status={existingCPO!.status} />
              {([
                ['CPO Number', existingCPO!.cpoNumber],
                ['Amount', formatCurrency(existingCPO!.amount ?? 0, existingCPO!.currency ?? 'ETB')],
                ['Issuing Bank', existingCPO!.issuingBank ?? '—'],
                ['Issue Date', existingCPO!.issueDate ? formatDate(existingCPO!.issueDate) : '—'],
                ['Expiry Date', existingCPO!.expiryDate ? formatDate(existingCPO!.expiryDate) : '—'],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className={colorClasses.text.muted}>{label}</span>
                  <span className={`font-medium ${colorClasses.text.primary}`}>{value}</span>
                </div>
              ))}
              {(existingCPO as any).documentUrl && (
                <a
                  href={(existingCPO as any).documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:opacity-70"
                >
                  📎 View Document
                </a>
              )}
            </div>
          ) : (
            /* Form for new / re-submission */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* CPO Number */}
              <div className="space-y-1.5">
                <label className={`block text-sm font-semibold ${colorClasses.text.primary}`}>
                  CPO Number <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('cpoNumber', { required: 'CPO number is required' })}
                  onChange={(e) =>
                    setValue('cpoNumber', e.target.value.toUpperCase(), { shouldValidate: true })
                  }
                  placeholder="e.g. CPO-2024-00123"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm uppercase outline-none focus:ring-2
                    focus:ring-[#FFD700] focus:border-[#FFD700]
                    ${colorClasses.border.gray300} ${colorClasses.bg.white} ${colorClasses.text.primary}`}
                />
                {errors.cpoNumber && (
                  <p className={`text-xs ${colorClasses.text.error}`}>{errors.cpoNumber.message}</p>
                )}
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={`block text-sm font-semibold ${colorClasses.text.primary}`}>
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { required: 'Amount required', min: { value: 0.01, message: 'Must be > 0' } })}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2
                      focus:ring-[#FFD700] focus:border-[#FFD700]
                      ${colorClasses.border.gray300} ${colorClasses.bg.white} ${colorClasses.text.primary}`}
                  />
                  {errors.amount && (
                    <p className={`text-xs ${colorClasses.text.error}`}>{errors.amount.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className={`block text-sm font-semibold ${colorClasses.text.primary}`}>
                    Currency
                  </label>
                  <select
                    {...register('currency')}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2
                      focus:ring-[#FFD700] focus:border-[#FFD700]
                      ${colorClasses.border.gray300} ${colorClasses.bg.white} ${colorClasses.text.primary}`}
                  >
                    <option value="ETB">ETB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Issuing Bank */}
              <div className="space-y-1.5">
                <label className={`block text-sm font-semibold ${colorClasses.text.primary}`}>
                  Issuing Bank <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('issuingBank', { required: 'Bank name is required' })}
                  placeholder="e.g. Commercial Bank of Ethiopia"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2
                    focus:ring-[#FFD700] focus:border-[#FFD700]
                    ${colorClasses.border.gray300} ${colorClasses.bg.white} ${colorClasses.text.primary}`}
                />
                {errors.issuingBank && (
                  <p className={`text-xs ${colorClasses.text.error}`}>{errors.issuingBank.message}</p>
                )}
              </div>

              {/* Issue Date + Expiry Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={`block text-sm font-semibold ${colorClasses.text.primary}`}>
                    Issue Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    max={today}
                    {...register('issueDate', {
                      required: 'Issue date required',
                      validate: (v) => !v || v <= today || 'Cannot be in the future',
                    })}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2
                      focus:ring-[#FFD700] focus:border-[#FFD700]
                      ${colorClasses.border.gray300} ${colorClasses.bg.white} ${colorClasses.text.primary}`}
                  />
                  {errors.issueDate && (
                    <p className={`text-xs ${colorClasses.text.error}`}>{errors.issueDate.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className={`block text-sm font-semibold ${colorClasses.text.primary}`}>
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={issueDate || today}
                    {...register('expiryDate', {
                      required: 'Expiry date required',
                      validate: (v) => !v || !issueDate || v > issueDate || 'Must be after issue date',
                    })}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2
                      focus:ring-[#FFD700] focus:border-[#FFD700]
                      ${colorClasses.border.gray300} ${colorClasses.bg.white} ${colorClasses.text.primary}`}
                  />
                  {errors.expiryDate && (
                    <p className={`text-xs ${colorClasses.text.error}`}>{errors.expiryDate.message}</p>
                  )}
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-1.5">
                <label className={`block text-sm font-semibold ${colorClasses.text.primary}`}>
                  CPO Document <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  {...register('document', { required: 'Document is required' })}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm
                    ${colorClasses.border.gray300} ${colorClasses.bg.secondary} ${colorClasses.text.primary}
                    file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1 file:text-xs file:font-semibold
                    file:bg-[#FFD700] file:text-[#0A2540] file:cursor-pointer`}
                />
                {errors.document && (
                  <p className={`text-xs ${colorClasses.text.error}`}>{errors.document.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded-lg border px-5 py-2.5 text-sm font-medium hover:opacity-70
                    ${colorClasses.border.gray300} ${colorClasses.text.primary}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`rounded-lg px-5 py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-50
                    ${colorClasses.bg.darkNavy} ${colorClasses.text.inverse}`}
                >
                  {isPending ? 'Submitting…' : isRejected ? 'Resubmit CPO' : 'Submit CPO'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CPOSubmissionsList (Owner View)
// ─────────────────────────────────────────────
interface VerifyRowState {
  status: 'verified' | 'rejected' | '';
  notes: string;
}

interface CPOSubmissionsListProps {
  tenderId: string;
}

export const CPOSubmissionsList: React.FC<CPOSubmissionsListProps> = ({ tenderId }) => {
  const { data: submissions, isLoading } = useCPOSubmissions(tenderId);
  const { mutate: verifyCPO, isPending } = useVerifyCPO();

  const [rowStates, setRowStates] = useState<Record<string, VerifyRowState>>({});

  const getRowState = (id: string): VerifyRowState =>
    rowStates[id] ?? { status: '', notes: '' };

  const setRowField = (id: string, field: keyof VerifyRowState, value: string) =>
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...getRowState(id), [field]: value },
    }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#FFD700] border-t-transparent" />
      </div>
    );
  }

  if (!submissions?.length) {
    return (
      <div className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed py-12 text-center ${colorClasses.border.gray300}`}>
        <span className="text-3xl">📂</span>
        <p className={`font-semibold ${colorClasses.text.primary}`}>No CPO submissions yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className={colorClasses.bg.secondary}>
          <tr>
            {['Company', 'CPO Number', 'Amount', 'Bank', 'Expires', 'Status', 'Document', 'Action'].map((h) => (
              <th
                key={h}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${colorClasses.text.muted}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y divide-gray-100 ${colorClasses.bg.white}`}>
          {submissions.map((cpo) => {
            const row = getRowState(cpo._id);
            const expiryDate = cpo.expiryDate ?? '';
            const expiringSoon = expiryDate ? isExpiringSoon(expiryDate) : false;
            const expired = expiryDate ? isExpired(expiryDate) : false;
            const company = (cpo as any).company as { name?: string } | undefined;

            return (
              <tr key={cpo._id} className="align-top">
                {/* Company */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold
                        ${colorClasses.bg.darkNavy} ${colorClasses.text.inverse}`}
                    >
                      {company?.name?.charAt(0) ?? '?'}
                    </div>
                    <span className={`font-medium ${colorClasses.text.primary}`}>
                      {company?.name ?? '—'}
                    </span>
                  </div>
                </td>

                {/* CPO Number */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`max-w-[90px] truncate font-mono text-xs ${colorClasses.text.primary}`}
                      title={cpo.cpoNumber}
                    >
                      {cpo.cpoNumber}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(cpo.cpoNumber)}
                      className={`text-xs hover:opacity-70 ${colorClasses.text.muted}`}
                      title="Copy"
                    >
                      📋
                    </button>
                  </div>
                </td>

                {/* Amount */}
                <td className={`px-4 py-3 font-medium ${colorClasses.text.primary}`}>
                  {formatCurrency(cpo.amount, cpo.currency)}
                </td>

                {/* Bank */}
                <td className={`px-4 py-3 ${colorClasses.text.secondary}`}>{cpo.issuingBank}</td>

                {/* Expires */}
                <td className="px-4 py-3">
                  <span
                    className={
                      expired
                        ? 'text-red-600 font-semibold'
                        : expiringSoon
                          ? 'text-amber-600 font-semibold'
                          : colorClasses.text.secondary
                    }
                  >
                    {expiryDate ? formatDate(expiryDate) : '—'}
                    {expiringSoon && !expired && ' ⚠️'}
                    {expired && ' ✗'}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge status={cpo.status} />
                </td>

                {/* Document */}
                <td className="px-4 py-3">
                  {(cpo as any).documentUrl ? (
                    <a
                      href={(cpo as any).documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:opacity-70 text-xs font-medium"
                    >
                      📎 Download
                    </a>
                  ) : (
                    <span className={colorClasses.text.muted}>—</span>
                  )}
                </td>

                {/* Action */}
                <td className="px-4 py-3">
                  <div className="space-y-1.5 min-w-[160px]">
                    <select
                      value={row.status}
                      onChange={(e) => setRowField(cpo._id, 'status', e.target.value)}
                      className={`w-full rounded-md border px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#FFD700]
                        ${colorClasses.border.gray300} ${colorClasses.bg.white} ${colorClasses.text.primary}`}
                    >
                      <option value="">— Select action —</option>
                      <option value="verified">Verify</option>
                      <option value="rejected">Reject</option>
                    </select>

                    {row.status === 'rejected' && (
                      <textarea
                        rows={2}
                        placeholder="Rejection reason…"
                        value={row.notes}
                        onChange={(e) => setRowField(cpo._id, 'notes', e.target.value)}
                        className={`w-full resize-none rounded-md border px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#FFD700]
                          ${colorClasses.border.gray300} ${colorClasses.bg.white} ${colorClasses.text.primary}`}
                      />
                    )}

                    <button
                      disabled={!row.status || isPending}
                      onClick={() =>
                        verifyCPO({
                          id: tenderId,
                          cpoId: cpo._id,
                          status: row.status as 'verified' | 'rejected',
                          notes: row.notes || undefined,
                        })
                      }
                      className={`w-full rounded-md py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40
                        ${colorClasses.bg.darkNavy} ${colorClasses.text.inverse}`}
                    >
                      Save
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};