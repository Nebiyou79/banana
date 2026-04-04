// src/components/bids/BidderDetails.tsx
// ══════════════════════════════════════════════════════════════════════
// FIXES in this version:
//   FIX-D1  t.deadline crash: bid.tender can be a string or BidTender;
//           the component receives a separate `tender` prop (BidTender)
//           for the header — we use that for Tender tab, NOT bid.tender.
//   FIX-D2  Details tab: company info read from bid.coverSheet (always
//           populated when form was filled) + technical proposal.
//   FIX-D3  Attachments tab: mobile-responsive grid with icons, names,
//           sizes; attractive even on small screens.
//   FIX-D4  Tender tab: uses the `tender` prop (BidTender) safely, not
//           bid.tender which may be a string.
//   FIX-D5  Gold (#F1BB03) tab indicator for bidder persona throughout.
// ══════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useRouter } from 'next/router';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { useWithdrawBid, useDownloadBidDocument } from '@/hooks/useBid';
import { Bid, BidTender, BidDocument } from '@/services/bidService';
import BidCoverSheetDisplay from './BidCoverSheetDisplay';
import BidStatusBadge from './BidStatusBadge';
import FinancialBreakdownTable from './FinancialBreakdownTable';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BidderDetailsProps {
  bid: Bid;
  tender: BidTender;          // always a BidTender object — never a string
  tenderId: string;
  isBidsRevealed: boolean;
}

type TabId = 'Overview' | 'Details' | 'Attachments' | 'Tender' | 'Status';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'Overview',    icon: '📋', label: 'Overview' },
  { id: 'Details',     icon: '📄', label: 'Details' },
  { id: 'Attachments', icon: '📎', label: 'Files' },
  { id: 'Tender',      icon: '🏢', label: 'Tender' },
  { id: 'Status',      icon: '⏳', label: 'Status' },
];

const DOCUMENT_GROUPS: { label: string; icon: string; types: string[] }[] = [
  { label: 'Technical',  icon: '📐', types: ['technical_proposal', 'opening_page'] },
  { label: 'Financial',  icon: '💰', types: ['financial_proposal', 'financial_breakdown'] },
  { label: 'Compliance', icon: '✅', types: ['business_license', 'tin_certificate', 'vat_certificate', 'tax_clearance', 'trade_registration', 'compliance'] },
  { label: 'Security',   icon: '🏦', types: ['cpo_document', 'performance_bond'] },
  { label: 'Company',    icon: '🏢', types: ['company_profile'] },
  { label: 'Other',      icon: '📄', types: ['other'] },
];

const STATUS_DESCRIPTIONS: Record<string, { icon: string; title: string; description: string; next: string }> = {
  submitted:           { icon: '📤', title: 'Submitted',           description: 'Your bid has been received and is awaiting review.',              next: 'The tender owner will review your bid and update its status.' },
  under_review:        { icon: '🔍', title: 'Under Review',        description: 'The tender owner is currently reviewing your bid.',              next: 'You may be contacted for clarifications.' },
  shortlisted:         { icon: '⭐', title: 'Shortlisted',         description: 'Congratulations! Your bid has been shortlisted.',               next: 'The owner may schedule an interview or request more documentation.' },
  interview_scheduled: { icon: '📅', title: 'Interview Scheduled', description: 'An interview has been scheduled with the tender owner.',         next: 'Check your email for scheduling details.' },
  awarded:             { icon: '🏆', title: 'Awarded',             description: 'Congratulations! Your bid has been awarded the contract.',       next: 'The tender owner will contact you for contract signing.' },
  rejected:            { icon: '❌', title: 'Not Selected',        description: 'Your bid was not selected for this tender.',                    next: 'Keep bidding on other tenders — each bid strengthens your track record.' },
  withdrawn:           { icon: '↩',  title: 'Withdrawn',           description: 'You have withdrawn this bid.',                                  next: 'You can submit a new bid if the tender is still accepting bids.' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined, currency = 'ETB') =>
  n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n) : null;

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const formatBytes = (bytes: number) => {
  if (bytes < 1024)          return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// ─── Shared sub-components ────────────────────────────────────────────────────

const SealedPlaceholder = ({ label = 'Financial details sealed' }: { label?: string }) => (
  <div className={`flex items-center gap-3 rounded-xl px-5 py-4 ${colorClasses.bg.amberLight} border border-amber-200 dark:border-amber-700`}>
    <span className="text-xl">🔒</span>
    <p className={`text-sm font-semibold ${colorClasses.text.amber700}`}>{label}</p>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className={`text-sm font-bold ${colorClasses.text.primary} mb-3 flex items-center gap-1.5`}>{children}</h3>
);

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className={`flex justify-between gap-4 py-2 border-b border-dashed last:border-0 ${colorClasses.border.secondary}`}>
    <dt className={`text-xs font-medium ${colorClasses.text.muted} flex-shrink-0`}>{label}</dt>
    <dd className={`text-xs ${colorClasses.text.primary} text-right font-medium`}>{value ?? '—'}</dd>
  </div>
);

// ─── Document Row (FIX-D3: mobile-attractive) ─────────────────────────────────

const DocumentRow = ({ doc, tenderId, bidId, isLocked = false }: {
  doc: BidDocument; tenderId: string; bidId: string; isLocked?: boolean;
}) => {
  const { mutate: downloadDoc, isPending: downloading } = useDownloadBidDocument();

  const ext = doc.originalName.split('.').pop()?.toUpperCase() ?? 'FILE';
  const extColors: Record<string, string> = {
    PDF: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    DOCX: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    DOC: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    XLSX: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    XLS: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    JPG: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    PNG: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  };
  const extColor = isLocked ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : (extColors[ext] ?? `${colorClasses.bg.surface} ${colorClasses.text.muted}`);

  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 sm:px-4 py-3 border transition-all ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${!isLocked ? 'hover:shadow-sm' : 'opacity-70'}`}>
      {/* File type badge */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0 ${extColor}`}>
        {isLocked ? '🔒' : ext.slice(0, 4)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${colorClasses.text.primary} truncate`} title={doc.originalName}>
          {doc.originalName}
        </p>
        <p className={`text-xs ${colorClasses.text.muted} mt-0.5`}>
          {doc.documentType.replace(/_/g, ' ')} · {formatBytes(doc.size)}
        </p>
      </div>

      {/* Actions */}
      {isLocked ? (
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${colorClasses.bg.amberLight} ${colorClasses.text.amber700}`}>
          Locked
        </span>
      ) : (
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => window.open(`/api/v1/bids/${tenderId}/${bidId}/documents/${encodeURIComponent(doc.fileName)}/preview`, '_blank')}
            className={`hidden sm:flex text-xs font-semibold px-2.5 py-1.5 rounded-lg ${colorClasses.bg.primary} ${colorClasses.text.muted} border ${colorClasses.border.secondary} hover:opacity-80 transition-all items-center gap-1`}
          >
            👁
          </button>
          <button
            onClick={() => downloadDoc({ tenderId, bidId, fileName: doc.fileName })}
            disabled={downloading}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${colorClasses.bg.blueLight} ${colorClasses.text.blue600} hover:opacity-80 disabled:opacity-50 transition-all flex items-center gap-1`}
          >
            {downloading ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : '📥'}
            <span className="hidden sm:inline">{downloading ? 'Saving…' : 'Save'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const BidderDetails = ({ bid, tender, tenderId, isBidsRevealed }: BidderDetailsProps) => {
  const router = useRouter();
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const [activeTab, setActiveTab]             = useState<TabId>('Overview');
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [techExpanded, setTechExpanded]       = useState(false);

  const { mutate: withdrawBid, isPending: withdrawing } = useWithdrawBid();

  const isSealed = tender.workflowType === 'closed';
  const canSeeFinancial = !isSealed || isBidsRevealed;
  const statusInfo = STATUS_DESCRIPTIONS[bid.status];

  // ── TAB 1: Overview ────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
      {/* LEFT */}
      <div className="space-y-4">
        {/* Status card */}
        {statusInfo && (
          <div className={`rounded-2xl p-5 border ${colorClasses.border.secondary} ${
            bid.status === 'awarded' ? 'bg-[#D1FAE5] dark:bg-[#064E3B]/50'
            : bid.status === 'rejected' ? colorClasses.bg.redLight
            : colorClasses.bg.surface
          }`}>
            <div className="flex items-start gap-4">
              <span className="text-4xl leading-none flex-shrink-0">{statusInfo.icon}</span>
              <div>
                <h3 className={`text-base font-bold mb-1 ${
                  bid.status === 'awarded' ? 'text-[#047857] dark:text-[#34D399]'
                  : bid.status === 'rejected' ? colorClasses.text.red
                  : colorClasses.text.primary
                }`}>{statusInfo.title}</h3>
                <p className={`text-sm mb-2 ${colorClasses.text.secondary}`}>{statusInfo.description}</p>
                <p className={`text-xs font-medium ${colorClasses.text.muted}`}>→ {statusInfo.next}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bid summary */}
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
          <SectionTitle>Your Bid Summary</SectionTitle>
          <dl className="space-y-0">
            <InfoRow label="Bid Number"  value={bid.bidNumber ?? '—'} />
            <InfoRow label="Bid Amount"  value={
              isSealed && bid.bidAmount == null ? '🔒 Sealed'
              : canSeeFinancial && bid.bidAmount != null ? fmt(bid.bidAmount, bid.currency)
              : '—'
            } />
            <InfoRow label="Currency"    value={bid.currency} />
            <InfoRow label="Type"        value={isSealed ? '🔒 Sealed bid' : '🔓 Open bid'} />
            <InfoRow label="Submitted"   value={formatDate(bid.submittedAt)} />
            <div className={`flex justify-between gap-4 py-2 border-b border-dashed last:border-0 ${colorClasses.border.secondary}`}>
              <dt className={`text-xs font-medium ${colorClasses.text.muted}`}>Status</dt>
              <dd><BidStatusBadge status={bid.status} size="sm" /></dd>
            </div>
          </dl>
        </div>

        {/* Cover sheet */}
        {isSealed
          ? (canSeeFinancial && bid.coverSheet
              ? <BidCoverSheetDisplay coverSheet={bid.coverSheet} isSealed={!isBidsRevealed} />
              : <SealedPlaceholder />)
          : (bid.coverSheet ? <BidCoverSheetDisplay coverSheet={bid.coverSheet} /> : null)
        }
      </div>

      {/* RIGHT — Technical proposal preview */}
      <div>
        <SectionTitle>📄 Technical Proposal</SectionTitle>
        {bid.technicalProposal ? (
          <div>
            <div
              className={`rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5 ${colorClasses.text.primary} text-sm leading-relaxed ${!techExpanded ? 'max-h-56 overflow-hidden relative' : ''}`}
              dangerouslySetInnerHTML={{ __html: bid.technicalProposal }}
            />
            {!techExpanded && (
              <div className={`relative -mt-10 h-10 bg-gradient-to-t from-white dark:from-[#0A2540]`} />
            )}
            <button
              onClick={() => setTechExpanded(v => !v)}
              className="mt-2 text-xs font-semibold text-[#F1BB03] hover:opacity-80 transition-opacity"
            >
              {techExpanded ? 'Show less ▲' : 'Read more ▼'}
            </button>
          </div>
        ) : (
          /* FIX-D2: Show cover sheet company name as a hint when technical proposal missing */
          <div className={`rounded-xl border-2 border-dashed ${colorClasses.border.secondary} flex flex-col items-center justify-center py-12 gap-2`}>
            <span className="text-3xl opacity-30">📄</span>
            <p className={`text-sm ${colorClasses.text.muted} italic text-center`}>
              No written technical proposal was provided with this bid.
            </p>
            {bid.documents?.some(d => d.documentType === 'technical_proposal') && (
              <p className={`text-xs ${colorClasses.text.muted} text-center`}>
                See the <button onClick={() => setActiveTab('Attachments')} className="text-[#F1BB03] font-semibold underline">Files tab</button> for uploaded technical documents.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── TAB 2: Details ─────────────────────────────────────────────────────────
  const renderDetails = () => {
    // FIX-D2: read company info from coverSheet, which is always filled when form is submitted
    const cs = bid.coverSheet;
    const hasCompanyInfo = cs && (cs.companyName || cs.companyEmail || cs.companyPhone);

    return (
      <div className="space-y-5 sm:space-y-6">
        {/* A — Company Information from cover sheet */}
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
          <SectionTitle>🏢 Company Information</SectionTitle>
          {hasCompanyInfo ? (
            <dl className="space-y-0">
              <InfoRow label="Company Name"   value={cs?.companyName} />
              <InfoRow label="Representative" value={cs?.authorizedRepresentative} />
              <InfoRow label="Title"          value={cs?.representativeTitle} />
              <InfoRow label="Email"          value={cs?.companyEmail} />
              <InfoRow label="Phone"          value={cs?.companyPhone} />
              <InfoRow label="Address"        value={cs?.companyAddress} />
              <InfoRow label="TIN Number"     value={cs?.tinNumber} />
              <InfoRow label="License No."    value={cs?.licenseNumber} />
              <InfoRow label="Bid Validity"   value={cs?.bidValidityPeriod ? `${cs.bidValidityPeriod} days` : undefined} />
            </dl>
          ) : (
            <p className={`text-sm ${colorClasses.text.muted} italic`}>
              No company cover sheet was submitted with this bid.
            </p>
          )}
        </div>

        {/* B — Technical Proposal (full) */}
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
          <SectionTitle>📄 Technical Proposal</SectionTitle>
          {bid.technicalProposal ? (
            <div
              className={`prose prose-sm max-w-none ${colorClasses.text.primary}`}
              dangerouslySetInnerHTML={{ __html: bid.technicalProposal }}
            />
          ) : (
            <div className={`flex flex-col items-center py-8 gap-2`}>
              <span className="text-3xl opacity-30">📄</span>
              <p className={`text-sm ${colorClasses.text.muted} italic`}>No written technical proposal provided.</p>
              {bid.documents?.some(d => d.documentType === 'technical_proposal') && (
                <p className={`text-xs ${colorClasses.text.muted}`}>
                  Check the <button onClick={() => setActiveTab('Attachments')} className="text-[#F1BB03] font-semibold underline">Files tab</button> for the uploaded document.
                </p>
              )}
            </div>
          )}
        </div>

        {/* C — Financial */}
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
          <SectionTitle>💰 Financial Information</SectionTitle>
          {canSeeFinancial ? (
            <div className="space-y-4">
              {bid.financialProposal ? (
                <div
                  className={`prose prose-sm max-w-none ${colorClasses.text.primary}`}
                  dangerouslySetInnerHTML={{ __html: bid.financialProposal }}
                />
              ) : (
                <p className={`text-sm ${colorClasses.text.muted} italic`}>No financial proposal narrative provided.</p>
              )}
              {bid.financialBreakdown && bid.financialBreakdown.items && bid.financialBreakdown.items.length > 0 && (
                <FinancialBreakdownTable breakdown={bid.financialBreakdown} editable={false} />
              )}
              <div className={`rounded-xl px-4 py-3 border-l-4 border-[#F1BB03] ${colorClasses.bg.surface}`}>
                <p className={`text-xs ${colorClasses.text.muted} mb-0.5`}>Total Bid Amount</p>
                <p className="text-2xl font-black text-[#F1BB03]">
                  {bid.bidAmount != null ? fmt(bid.bidAmount, bid.currency) : '—'}
                </p>
              </div>
            </div>
          ) : (
            <SealedPlaceholder label="Financial information is sealed until bids are revealed" />
          )}
        </div>

        {/* D — CPO / Bid Security */}
        {bid.cpo && (
          <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
            <SectionTitle>🏦 Bid Security / CPO</SectionTitle>
            <dl className="space-y-0">
              <InfoRow label="Security Type"     value={bid.cpo.bidSecurityType?.replace(/_/g, ' ')} />
              <InfoRow label="Reference Number"  value={bid.cpo.cpoNumber} />
              <InfoRow label="Amount"            value={bid.cpo.amount != null ? fmt(bid.cpo.amount, bid.cpo.currency) : undefined} />
              <InfoRow label="Issuing Institution" value={bid.cpo.issuingBank} />
              <InfoRow label="Issue Date"        value={bid.cpo.issueDate ? new Date(bid.cpo.issueDate).toLocaleDateString('en-GB') : undefined} />
              <InfoRow label="Expiry Date"       value={bid.cpo.expiryDate ? new Date(bid.cpo.expiryDate).toLocaleDateString('en-GB') : undefined} />
              <InfoRow label="Status"            value={bid.cpo.status} />
              <InfoRow label="Return Status"     value={bid.cpo.returnStatus ?? 'pending'} />
            </dl>
          </div>
        )}
      </div>
    );
  };

  // ── TAB 3: Attachments (FIX-D3: mobile-attractive) ─────────────────────────
  const renderAttachments = () => {
    const isFinancialType = (type: string) => ['financial_proposal', 'financial_breakdown'].includes(type);
    const docs = bid.documents ?? [];

    const grouped = DOCUMENT_GROUPS.map(group => ({
      ...group,
      docs: docs.filter(d => group.types.includes(d.documentType)),
    })).filter(g => g.docs.length > 0);

    if (!grouped.length) {
      return (
        <div className={`rounded-2xl border-2 border-dashed ${colorClasses.border.secondary} flex flex-col items-center justify-center py-16 gap-3`}>
          <span className="text-5xl opacity-20">📎</span>
          <p className={`text-sm font-semibold ${colorClasses.text.muted}`}>No files uploaded with this bid</p>
          <p className={`text-xs ${colorClasses.text.muted} text-center max-w-xs`}>
            Documents are attached during bid submission. If you expected files, they may not have uploaded successfully.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* Summary strip */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${colorClasses.bg.surface} border ${colorClasses.border.secondary}`}>
          <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>
            {docs.length} file{docs.length !== 1 ? 's' : ''} attached
          </p>
          <span className={`text-xs px-2.5 py-1 rounded-full ${colorClasses.bg.tealLight} ${colorClasses.text.teal} font-semibold`}>
            {grouped.length} group{grouped.length !== 1 ? 's' : ''}
          </span>
        </div>

        {grouped.map(group => (
          <div key={group.label}>
            {/* Group header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{group.icon}</span>
              <h3 className={`text-sm font-bold ${colorClasses.text.primary}`}>{group.label}</h3>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${colorClasses.bg.secondary} ${colorClasses.text.muted} font-semibold`}>
                {group.docs.length}
              </span>
            </div>

            {/* Document rows */}
            <div className="space-y-2">
              {group.docs.map(doc => (
                <DocumentRow
                  key={doc._id}
                  doc={doc}
                  tenderId={tenderId}
                  bidId={bid._id}
                  isLocked={isSealed && !isBidsRevealed && isFinancialType(doc.documentType)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── TAB 4: Tender Info (FIX-D4: uses `tender` prop, NOT bid.tender) ─────────
  const renderTenderInfo = () => {
    // FIX-D1: use the `tender` prop (guaranteed BidTender) instead of bid.tender (may be string)
    const t = tender;
    const deadlineDate   = t.deadline ? new Date(t.deadline) : null;
    const isPastDeadline = deadlineDate ? deadlineDate < new Date() : false;

    return (
      <div className="space-y-4">
        {/* Tender card */}
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className={`text-lg font-bold ${colorClasses.text.primary}`}>{t.title}</h2>
              {t.referenceNumber && (
                <p className={`text-xs font-mono ${colorClasses.text.muted} mt-0.5`}>Ref: {t.referenceNumber}</p>
              )}
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              t.workflowType === 'closed'
                ? `${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`
                : `${colorClasses.bg.tealLight} ${colorClasses.text.teal}`
            }`}>
              {t.workflowType === 'closed' ? '🔒 Sealed Tender' : '🔓 Open Tender'}
            </span>
          </div>

          <dl className="space-y-0">
            <InfoRow label="Tender Status" value={t.status} />
            <InfoRow label="Deadline"      value={deadlineDate ? deadlineDate.toLocaleString('en-GB') : '—'} />
            <InfoRow label="Deadline Status" value={
              <span className={isPastDeadline ? colorClasses.text.red : 'text-[#047857] dark:text-[#34D399]'}>
                {isPastDeadline ? '⏰ Passed' : '✅ Open'}
              </span>
            } />
          </dl>
        </div>

        {/* Summary of this bid against this tender */}
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
          <SectionTitle>📊 Your Bid Summary for this Tender</SectionTitle>
          <dl className="space-y-0">
            <InfoRow label="Bid Number" value={bid.bidNumber} />
            <InfoRow label="Status"     value={<BidStatusBadge status={bid.status} size="sm" />} />
            <InfoRow label="Submitted"  value={formatDate(bid.submittedAt)} />
            {canSeeFinancial && bid.bidAmount != null && (
              <InfoRow label="Your Bid Amount" value={
                <span className="font-black text-[#F1BB03]">{fmt(bid.bidAmount, bid.currency)}</span>
              } />
            )}
          </dl>
        </div>

        <button
          onClick={() => router.push(`/dashboard/company/tenders/tenders/${t._id}`)}
          className={`w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all ${colorClasses.border.secondary} ${colorClasses.text.primary} ${colorClasses.bg.surface} hover:border-[#F1BB03] hover:text-[#F1BB03]`}
        >
          View Full Tender Page →
        </button>
      </div>
    );
  };

  // ── TAB 5: Status & Actions ─────────────────────────────────────────────────
  const renderStatus = () => {
    const statusOrder: typeof bid.status[] = ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'awarded'];
    const currentIdx = statusOrder.indexOf(bid.status as typeof statusOrder[number]);

    return (
      <div className="space-y-5 sm:space-y-6">
        {bid.status === 'awarded' && (
          <div className="rounded-2xl p-6 bg-[#D1FAE5] dark:bg-[#064E3B]/60 border border-emerald-300 dark:border-emerald-700 text-center">
            <p className="text-5xl mb-3">🏆</p>
            <h3 className="text-xl font-black text-[#047857] dark:text-[#34D399]">Bid Awarded!</h3>
            <p className={`text-sm mt-1 ${colorClasses.text.secondary}`}>
              Congratulations! The tender owner will contact you to proceed with contract signing.
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
          <SectionTitle>📊 Status Timeline</SectionTitle>
          <div className="space-y-0">
            {statusOrder.map((s, i) => {
              const info      = STATUS_DESCRIPTIONS[s];
              const isPast    = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={s} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                      isPast    ? 'bg-[#2AA198] text-white shadow-sm'
                      : isCurrent ? 'bg-[#F1BB03] text-[#0A2540] shadow-md ring-4 ring-[#F1BB03]/20'
                      : `${colorClasses.bg.secondary} ${colorClasses.text.muted} border ${colorClasses.border.secondary}`
                    }`}>
                      {isPast ? '✓' : info?.icon ?? '○'}
                    </div>
                    {i < statusOrder.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 rounded-full ${isPast ? 'bg-[#2AA198]' : colorClasses.bg.secondary}`} />
                    )}
                  </div>
                  <div className="pb-4 pt-1">
                    <p className={`text-sm font-bold ${isCurrent ? 'text-[#F1BB03]' : isPast ? colorClasses.text.secondary : colorClasses.text.muted}`}>
                      {info?.title ?? s.replace(/_/g, ' ')}
                    </p>
                    {isCurrent && (
                      <p className={`text-xs ${colorClasses.text.muted} mt-0.5 max-w-xs`}>{info?.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {bid.ownerNotes && (
          <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
            <SectionTitle>📝 Notes from Tender Owner</SectionTitle>
            <p className={`text-sm ${colorClasses.text.secondary} whitespace-pre-wrap`}>{bid.ownerNotes}</p>
          </div>
        )}

        {bid.status !== 'withdrawn' && bid.status !== 'awarded' && bid.status !== 'rejected' && (
          <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5 space-y-3`}>
            <SectionTitle>⚙️ Actions</SectionTitle>
            {!showWithdrawConfirm ? (
              <button
                onClick={() => setShowWithdrawConfirm(true)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${colorClasses.bg.redLight} ${colorClasses.text.red} border-transparent hover:opacity-80`}
              >
                Withdraw Bid
              </button>
            ) : (
              <div className={`rounded-xl p-4 ${colorClasses.bg.redLight} border border-red-200 dark:border-red-700 space-y-3`}>
                <p className={`text-sm font-semibold ${colorClasses.text.red}`}>
                  Are you sure? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => withdrawBid({ tenderId, bidId: bid._id }, { onSuccess: () => router.back() })}
                    disabled={withdrawing}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold ${colorClasses.bg.redLight} ${colorClasses.text.red} border ${colorClasses.border.secondary} hover:opacity-80 disabled:opacity-50`}
                  >
                    {withdrawing ? 'Withdrawing…' : 'Yes, Withdraw'}
                  </button>
                  <button
                    onClick={() => setShowWithdrawConfirm(false)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold ${colorClasses.bg.surface} ${colorClasses.text.primary} border ${colorClasses.border.secondary} hover:opacity-80`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const tabContent: Record<TabId, () => React.ReactNode> = {
    Overview:    renderOverview,
    Details:     renderDetails,
    Attachments: renderAttachments,
    Tender:      renderTenderInfo,
    Status:      renderStatus,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`${colorClasses.bg.primary} ${isMobile ? 'pb-20' : ''}`}>

      {/* Desktop top tab bar — gold active indicator (bidder persona) */}
      {!isMobile && (
        <div className={`flex overflow-x-auto border-b ${colorClasses.border.secondary} scrollbar-hide`}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-shrink-0 flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all whitespace-nowrap relative',
                activeTab === tab.id
                  ? 'text-[#F1BB03] font-bold'
                  : `${colorClasses.text.muted} hover:text-[#F1BB03]/70`,
              ].join(' ')}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F1BB03] rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-6">
        {tabContent[activeTab]?.()}
      </div>

      {/* Mobile bottom nav — gold active (bidder persona) */}
      {isMobile && (
        <nav className={`fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center h-16 border-t ${colorClasses.border.secondary} ${colorClasses.bg.primary} safe-area-inset-bottom shadow-2xl`}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[44px] min-h-[44px] justify-center relative ${
                activeTab === tab.id ? 'text-[#F1BB03]' : colorClasses.text.muted
              }`}
            >
              {activeTab === tab.id && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#F1BB03] rounded-full" />
              )}
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default BidderDetails;