// src/components/bids/BidCoverSheetDisplay.tsx
import { colorClasses } from '@/utils/color';
import { BidCoverSheet } from '@/services/bidService';

interface BidCoverSheetDisplayProps {
  coverSheet: BidCoverSheet;
  isSealed?: boolean;
}

const Field = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className={`p-3 rounded-lg ${colorClasses.bg.surface}`}>
    <p className={`text-xs font-medium uppercase tracking-wide ${colorClasses.text.muted} mb-1`}>
      {label}
    </p>
    <p className={`text-sm font-semibold ${colorClasses.text.primary} break-words`}>{value}</p>
  </div>
);

export const BidCoverSheetDisplay = ({
  coverSheet,
  isSealed = false,
}: BidCoverSheetDisplayProps) => {
  const formatDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const formatCurrency = (value: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

  return (
    <div className={`rounded-2xl overflow-hidden border ${colorClasses.border.secondary} shadow-sm`}>
      {/* Header */}
      <div className="bg-[#0A2540] dark:bg-[#0A2540] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📄</span>
          <div>
            <h3 className="text-white font-bold text-sm">Bid Cover Sheet — Official Declaration</h3>
            <p className="text-white/60 text-xs mt-0.5">Submitted bid details and representative information</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={`${colorClasses.bg.primary} p-5`}>
        {/* Two-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Company Name" value={coverSheet.companyName} />
          <Field label="Authorized Representative" value={coverSheet.authorizedRepresentative} />
          <Field label="Title" value={coverSheet.representativeTitle ?? '—'} />
          <Field label="Company Email" value={coverSheet.companyEmail} />
          <Field label="Company Phone" value={coverSheet.companyPhone} />
          <Field label="Company Address" value={coverSheet.companyAddress ?? '—'} />
          <Field label="TIN Number" value={coverSheet.tinNumber ?? '—'} />
          <Field label="License Number" value={coverSheet.licenseNumber ?? '—'} />

          {/* Total Bid Value — spans full width, gold highlight */}
          <div className={`sm:col-span-2 p-4 rounded-xl border-2 border-[#F1BB03]/40 ${colorClasses.bg.surface}`}>
            <p className={`text-xs font-medium uppercase tracking-wide ${colorClasses.text.muted} mb-1`}>
              Total Bid Value
            </p>
            {isSealed ? (
              <p className="text-2xl font-bold text-[#B45309] dark:text-[#FCD34D]">
                🔒 Sealed
              </p>
            ) : (
              <p className="text-2xl font-bold text-[#F1BB03]">
                {formatCurrency(coverSheet.totalBidValue, coverSheet.currency)}
              </p>
            )}
          </div>

          <Field label="Currency" value={coverSheet.currency} />
          <Field
            label="Bid Validity Period"
            value={
              coverSheet.bidValidityPeriod ? `${coverSheet.bidValidityPeriod} days` : '—'
            }
          />
        </div>

        {/* Declaration status */}
        <div
          className={`mt-4 flex items-center gap-3 rounded-xl px-4 py-3 ${
            coverSheet.declarationAccepted
              ? 'bg-[#D1FAE5] dark:bg-[#064E3B]'
              : 'bg-[#FEE2E2] dark:bg-[#7F1D1D]'
          }`}
        >
          {coverSheet.declarationAccepted ? (
            <>
              <span className="text-lg text-[#059669] dark:text-[#34D399]">✓</span>
              <p className="text-sm font-medium text-[#047857] dark:text-[#34D399]">
                Declaration accepted
                {coverSheet.declarationAcceptedAt && (
                  <span className="font-normal opacity-80">
                    {' '}
                    on {formatDate(coverSheet.declarationAcceptedAt)}
                  </span>
                )}
              </p>
            </>
          ) : (
            <>
              <span className="text-lg text-[#EF4444]">✗</span>
              <p className="text-sm font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                Declaration not accepted
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BidCoverSheetDisplay;
