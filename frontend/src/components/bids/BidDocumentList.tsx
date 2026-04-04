// src/components/bids/BidDocumentList.tsx
import { colorClasses } from '@/utils/color';
import { BidDocument, BidDocumentType } from '@/services/bidService';
import { useDownloadBidDocument } from '@/hooks/useBid';

interface BidDocumentListProps {
  documents: BidDocument[];
  tenderId: string;
  bidId: string;
  canDownload?: boolean;
  isSealed?: boolean;
  isBidsRevealed?: boolean;
}

const FINANCIAL_TYPES: BidDocumentType[] = ['financial_proposal', 'financial_breakdown'];

const docTypeIcon: Record<string, string> = {
  technical_proposal: '📋',
  financial_proposal: '💰',
  financial_breakdown: '💰',
  company_profile: '🏢',
  cpo_document: '🏦',
  compliance: '✅',
  business_license: '✅',
  tin_certificate: '✅',
  vat_certificate: '✅',
  tax_clearance: '✅',
  trade_registration: '✅',
  opening_page: '📋',
  performance_bond: '🏦',
  other: '📄',
};

const docTypeLabel: Record<string, string> = {
  technical_proposal: 'Technical Proposal',
  financial_proposal: 'Financial Proposal',
  financial_breakdown: 'Financial Breakdown',
  company_profile: 'Company Profile',
  cpo_document: 'CPO Document',
  compliance: 'Compliance',
  business_license: 'Business License',
  tin_certificate: 'TIN Certificate',
  vat_certificate: 'VAT Certificate',
  tax_clearance: 'Tax Clearance',
  trade_registration: 'Trade Registration',
  opening_page: 'Opening Page',
  performance_bond: 'Performance Bond',
  other: 'Document',
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export const BidDocumentList = ({
  documents,
  tenderId,
  bidId,
  canDownload = true,
  isSealed = false,
  isBidsRevealed = false,
}: BidDocumentListProps) => {
  const { mutate: download, isPending, variables: downloadingVars } = useDownloadBidDocument();

  if (!documents || documents.length === 0) {
    return (
      <div
        className={`rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} px-6 py-8 text-center`}
      >
        <p className={`${colorClasses.text.muted} text-sm`}>No documents uploaded.</p>
      </div>
    );
  }

  const isFinancialLocked = (doc: BidDocument) =>
    isSealed &&
    !isBidsRevealed &&
    FINANCIAL_TYPES.includes(doc.documentType as BidDocumentType);

  return (
    <ul className="space-y-2">
      {documents.map((doc) => {
        const locked = isFinancialLocked(doc);
        const isDownloading =
          isPending && (downloadingVars as { fileName: string })?.fileName === doc.fileName;

        return (
          <li
            key={doc._id}
            className={`flex items-center gap-3 rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} px-4 py-3 transition-all hover:shadow-sm`}
          >
            {/* Icon */}
            <span className="text-2xl leading-none shrink-0">
              {docTypeIcon[doc.documentType] ?? '📄'}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className={`${colorClasses.text.primary} text-sm font-medium truncate`}
                title={doc.originalName}
              >
                {doc.originalName}
              </p>
              <p className={`${colorClasses.text.muted} text-xs mt-0.5`}>
                {docTypeLabel[doc.documentType] ?? 'Document'} •{' '}
                {formatBytes(doc.size)} • {formatDate(doc.uploadedAt)}
              </p>
            </div>

            {/* Action */}
            {locked ? (
              <span className="flex items-center gap-1 text-xs font-medium text-[#B45309] dark:text-[#FCD34D] bg-[#FEF3C7] dark:bg-[#78350F] px-3 py-1.5 rounded-lg whitespace-nowrap">
                🔒 Locked until reveal
              </span>
            ) : canDownload ? (
              <button
                onClick={() =>
                  download({ tenderId, bidId, fileName: doc.fileName })
                }
                disabled={isDownloading}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap
                  ${colorClasses.bg.blueLight} ${colorClasses.text.blue600}
                  hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isDownloading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Downloading…
                  </>
                ) : (
                  <>⬇ Download</>
                )}
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
};

export default BidDocumentList;
