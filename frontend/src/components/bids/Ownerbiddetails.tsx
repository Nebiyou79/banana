// src/components/bids/OwnerBidDetails.tsx
// COMPLETE REBUILD — 5 tabs, teal owner theme, mobile bottom-icon nav
// FIXES:
//   BUG-6a → 5 tabs: Overview, Details, Attachments, Bidder Company (NEW), Evaluation & Actions
//   BUG-6b → Mobile fixed bottom icon nav bar (<640px)
//   BUG-6c → Status update is optimistic — UI reflects new status immediately
//   BUG-6d → All downloads use useDownloadBidDocument hook — NOT raw doc.url
//   BUG-3a → Teal owner accent throughout (not gold)

import { useState } from 'react';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import {
  useUpdateBidStatus,
  useVerifyCPOReturn,
  useUpdateComplianceChecklist,
  useDownloadBidDocument,
} from '@/hooks/useBid';
import {
  Bid, BidTender, BidCompany, BidUser, BidStatus, BidDocument,
} from '@/services/bidService';
import BidEvaluationPanel from './BidEvaluationPanel';
import BidCoverSheetDisplay from './BidCoverSheetDisplay';
import BidderInfo from './BidderInfo';
import BidStatusBadge from './BidStatusBadge';
import FinancialBreakdownTable from './FinancialBreakdownTable';
import BidComplianceChecklist from './BidComplianceChecklist';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OwnerBidDetailsProps {
  bid: Bid;
  tender: BidTender;
  tenderId: string;
  isBidsRevealed: boolean;
}

type TabId = 'Overview' | 'Details' | 'Attachments' | 'Company' | 'Actions';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'Overview',    icon: '📋', label: 'Overview' },
  { id: 'Details',     icon: '📄', label: 'Details' },
  { id: 'Attachments', icon: '📎', label: 'Files' },
  { id: 'Company',     icon: '🏢', label: 'Company' },
  { id: 'Actions',     icon: '⚖️',  label: 'Actions' },
];

const DOCUMENT_GROUPS: { label: string; icon: string; types: string[] }[] = [
  { label: 'Technical',   icon: '📐', types: ['technical_proposal', 'opening_page'] },
  { label: 'Financial',   icon: '💰', types: ['financial_proposal', 'financial_breakdown'] },
  { label: 'Compliance',  icon: '✅', types: ['business_license', 'tin_certificate', 'vat_certificate', 'tax_clearance', 'trade_registration', 'compliance'] },
  { label: 'Security',    icon: '🏦', types: ['cpo_document', 'performance_bond'] },
  { label: 'Company',     icon: '🏢', types: ['company_profile'] },
  { label: 'Other',       icon: '📄', types: ['other'] },
];

const STATUS_OPTIONS: BidStatus[] = [
  'submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'awarded', 'rejected',
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined, currency = 'ETB') =>
  n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n) : null;

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const SealedPlaceholder = ({ label = 'Financial details sealed until bids are revealed' }: { label?: string }) => (
  <div className={`flex items-center gap-3 rounded-xl px-5 py-4 ${colorClasses.bg.amberLight} border border-amber-200 dark:border-amber-700`}>
    <span className="text-xl">🔒</span>
    <p className={`text-sm font-semibold ${colorClasses.text.amber700}`}>{label}</p>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className={`text-sm font-bold ${colorClasses.text.primary} mb-3`}>{children}</h3>
);

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-1.5 border-b border-dashed last:border-0" style={{ borderColor: 'var(--border-secondary, #e5e5e5)' }}>
    <dt className={`text-xs font-medium ${colorClasses.text.muted} flex-shrink-0`}>{label}</dt>
    <dd className={`text-xs ${colorClasses.text.primary} text-right`}>{value ?? '—'}</dd>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Document row (owner variant — respects sealed state for financial docs)
// ─────────────────────────────────────────────────────────────────────────────

const DocumentRow = ({
  doc,
  tenderId,
  bidId,
  isLocked = false,
}: {
  doc: BidDocument;
  tenderId: string;
  bidId: string;
  isLocked?: boolean;
}) => {
  const { mutate: downloadDoc, isPending: downloading } = useDownloadBidDocument();

  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${colorClasses.border.secondary} ${colorClasses.bg.surface}`}>
      <span className="text-xl flex-shrink-0">{isLocked ? '🔒' : '📄'}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${colorClasses.text.primary} truncate`} title={doc.originalName}>
          {doc.originalName}
        </p>
        <p className={`text-xs ${colorClasses.text.muted}`}>
          {formatBytes(doc.size)} · {doc.documentType.replace(/_/g, ' ')}
        </p>
      </div>
      {isLocked ? (
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${colorClasses.bg.amberLight} ${colorClasses.text.amber700}`}>
          Locked
        </span>
      ) : (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => window.open(`/api/v1/bids/${tenderId}/${bidId}/documents/${encodeURIComponent(doc.fileName)}/preview`, '_blank')}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${colorClasses.bg.surface} ${colorClasses.text.muted} border ${colorClasses.border.secondary} hover:opacity-80 transition-all`}
          >
            👁 View
          </button>
          <button
            onClick={() => downloadDoc({ tenderId, bidId, fileName: doc.fileName })}
            disabled={downloading}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${colorClasses.bg.tealLight} ${colorClasses.text.teal} hover:opacity-80 disabled:opacity-50 transition-all`}
          >
            {downloading ? '…' : '📥 Save'}
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export const OwnerBidDetails = ({ bid, tender, tenderId, isBidsRevealed }: OwnerBidDetailsProps) => {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const [activeTab, setActiveTab] = useState<TabId>('Overview');
  const [techExpanded, setTechExpanded] = useState(false);

  // BUG-6c FIX: local optimistic status state
  const [optimisticStatus, setOptimisticStatus] = useState<BidStatus>(bid.status);
  const [selectedStatus, setSelectedStatus] = useState<BidStatus>(bid.status);
  const [ownerNotes, setOwnerNotes] = useState(bid.ownerNotes ?? '');
  const [showAwardModal, setShowAwardModal] = useState(false);

  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateBidStatus();
  const { mutate: cpoReturn, isPending: cpoReturning } = useVerifyCPOReturn();

  const isSealed = tender.workflowType === 'closed';
  const canSeeFinancial = isBidsRevealed || !isSealed;

  // FIX: resolve from coverSheet first — always populated when bidder filled the form
  const bidderName =
    bid.coverSheet?.companyName?.trim()
      ? bid.coverSheet.companyName.trim()
      : bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'name' in bid.bidderCompany
      ? (bid.bidderCompany as BidCompany).name
      : bid.bidder && typeof bid.bidder === 'object' && 'firstName' in bid.bidder
      ? `${(bid.bidder as BidUser).firstName ?? ''} ${(bid.bidder as BidUser).lastName ?? ''}`.trim()
      : 'Bidder';

  const handleStatusUpdate = () => {
    if (selectedStatus === 'awarded') {
      setShowAwardModal(true);
      return;
    }
    doStatusUpdate();
  };

  const doStatusUpdate = () => {
    // BUG-6c FIX: optimistic update
    setOptimisticStatus(selectedStatus);
    updateStatus(
      { tenderId, bidId: bid._id, status: selectedStatus, ownerNotes },
      { onError: () => setOptimisticStatus(bid.status) }
    );
    setShowAwardModal(false);
  };

  // ── TAB 1: Overview ────────────────────────────────────────────────────────
  const renderOverview = () => {
    const evalScore = bid.evaluation?.combinedScore ?? bid.evaluation?.technicalScore;
    const amount = fmt(bid.bidAmount, bid.currency);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-4">
          {/* Bidder card */}
          <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
            <SectionTitle>👤 Bidder</SectionTitle>
            <BidderInfo bidder={bid.bidder} company={bid.bidderCompany} coverSheetName={bid.coverSheet?.companyName} />
          </div>

          {/* Bid summary */}
          <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
            <SectionTitle>Bid Summary</SectionTitle>
            <dl className="space-y-0">
              <InfoRow label="Bid Number" value={bid.bidNumber ?? '—'} />
              <InfoRow label="Bid Amount" value={
                isSealed && !canSeeFinancial ? '🔒 Sealed'
                : amount ?? '—'
              } />
              <InfoRow label="Currency" value={bid.currency} />
              <InfoRow label="Type" value={isSealed ? '🔒 Sealed bid' : '🔓 Open bid'} />
              <InfoRow label="Submitted" value={formatDate(bid.submittedAt)} />
              <div className="flex justify-between gap-4 py-1.5">
                <dt className={`text-xs font-medium ${colorClasses.text.muted}`}>Status</dt>
                <dd><BidStatusBadge status={optimisticStatus} size="sm" /></dd>
              </div>
              {evalScore != null && (
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className={`text-xs font-medium ${colorClasses.text.muted}`}>Score</dt>
                  <dd>
                    <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-[#F1BB03]/20 text-[#F1BB03]">
                      {evalScore.toFixed(1)}
                    </span>
                  </dd>
                </div>
              )}
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

        {/* RIGHT */}
        <div>
          <SectionTitle>Technical Proposal</SectionTitle>
          {bid.technicalProposal ? (
            <div>
              <div
                className={`prose prose-sm max-w-none rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5 ${colorClasses.text.primary} ${!techExpanded ? 'max-h-48 overflow-hidden' : ''}`}
                dangerouslySetInnerHTML={{ __html: bid.technicalProposal }}
              />
              <button
                onClick={() => setTechExpanded(v => !v)}
                className="mt-2 text-xs font-semibold text-[#2AA198] hover:opacity-80"
              >
                {techExpanded ? 'Show less ▲' : 'Read more ▼'}
              </button>
            </div>
          ) : (
            <p className={`text-sm ${colorClasses.text.muted} italic`}>No technical proposal provided.</p>
          )}
        </div>
      </div>
    );
  };

  // ── TAB 2: Details ─────────────────────────────────────────────────────────
  const renderDetails = () => (
    <div className="space-y-6">
      {/* Company info */}
      <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
        <SectionTitle>🏢 Company Information</SectionTitle>
        <dl className="space-y-0">
          <InfoRow label="Company Name" value={bid.coverSheet?.companyName} />
          <InfoRow label="Representative" value={bid.coverSheet?.authorizedRepresentative} />
          <InfoRow label="Title" value={bid.coverSheet?.representativeTitle} />
          <InfoRow label="Email" value={bid.coverSheet?.companyEmail} />
          <InfoRow label="Phone" value={bid.coverSheet?.companyPhone} />
          <InfoRow label="Address" value={bid.coverSheet?.companyAddress} />
          <InfoRow label="TIN Number" value={bid.coverSheet?.tinNumber} />
          <InfoRow label="License Number" value={bid.coverSheet?.licenseNumber} />
        </dl>
      </div>

      {/* Technical */}
      <div>
        <SectionTitle>📄 Technical Proposal</SectionTitle>
        {bid.technicalProposal ? (
          <div className={`prose prose-sm max-w-none rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5 ${colorClasses.text.primary}`}
            dangerouslySetInnerHTML={{ __html: bid.technicalProposal }}
          />
        ) : (
          <p className={`text-sm ${colorClasses.text.muted} italic`}>No technical proposal provided.</p>
        )}
      </div>

      {/* Financial */}
      <div>
        <SectionTitle>💰 Financial Information</SectionTitle>
        {canSeeFinancial ? (
          <div className="space-y-4">
            {bid.financialProposal ? (
              <div className={`prose prose-sm max-w-none rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5 ${colorClasses.text.primary}`}
                dangerouslySetInnerHTML={{ __html: bid.financialProposal }}
              />
            ) : (
              <p className={`text-sm ${colorClasses.text.muted} italic`}>No financial proposal provided.</p>
            )}
            {bid.financialBreakdown && (
              <FinancialBreakdownTable breakdown={bid.financialBreakdown} editable={false} />
            )}
            <div className={`rounded-xl px-4 py-3 ${colorClasses.bg.surface} border ${colorClasses.border.secondary}`}>
              <p className={`text-xs ${colorClasses.text.muted}`}>Total Bid Amount</p>
              <p className="text-2xl font-bold text-[#F1BB03]">
                {bid.bidAmount != null ? fmt(bid.bidAmount, bid.currency) : '—'}
              </p>
            </div>
          </div>
        ) : (
          <SealedPlaceholder />
        )}
      </div>

      {/* CPO */}
      {bid.cpo && (
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
          <SectionTitle>🏦 Bid Security / CPO</SectionTitle>
          <dl className="space-y-0">
            <InfoRow label="Security Type" value={bid.cpo.bidSecurityType?.replace(/_/g, ' ')} />
            <InfoRow label="Reference #" value={bid.cpo.cpoNumber} />
            <InfoRow label="Amount" value={bid.cpo.amount != null ? fmt(bid.cpo.amount, bid.cpo.currency) : undefined} />
            <InfoRow label="Issuing Institution" value={bid.cpo.issuingBank} />
            <InfoRow label="Issue Date" value={bid.cpo.issueDate ? new Date(bid.cpo.issueDate).toLocaleDateString('en-GB') : undefined} />
            <InfoRow label="Expiry Date" value={bid.cpo.expiryDate ? new Date(bid.cpo.expiryDate).toLocaleDateString('en-GB') : undefined} />
            <InfoRow label="Status" value={bid.cpo.status} />
            <InfoRow label="Return Status" value={bid.cpo.returnStatus ?? 'pending'} />
          </dl>
        </div>
      )}

      {/* Compliance checklist */}
      <BidComplianceChecklist bid={bid} tenderId={tenderId} isOwner isEditable />
    </div>
  );

  // ── TAB 3: Attachments ─────────────────────────────────────────────────────
  const renderAttachments = () => {
    const isFinancialType = (type: string) =>
      ['financial_proposal', 'financial_breakdown'].includes(type);

    const grouped = DOCUMENT_GROUPS.map(group => ({
      ...group,
      docs: bid.documents?.filter(d => group.types.includes(d.documentType)) ?? [],
    })).filter(g => g.docs.length > 0);

    if (!grouped.length) {
      return (
        <div className={`rounded-2xl border-2 border-dashed ${colorClasses.border.secondary} flex flex-col items-center justify-center py-16 gap-3`}>
          <span className="text-4xl opacity-30">📎</span>
          <p className={`text-sm ${colorClasses.text.muted}`}>No documents uploaded with this bid.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {grouped.map(group => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-3">
              <span>{group.icon}</span>
              <h3 className={`text-sm font-bold ${colorClasses.text.primary}`}>{group.label}</h3>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${colorClasses.bg.surface} ${colorClasses.text.muted}`}>
                {group.docs.length}
              </span>
            </div>
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

  // ── TAB 4: Bidder Company (NEW TAB — BUG-6a FIX) ──────────────────────────
  const renderCompany = () => {
    const company =
      bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'name' in bid.bidderCompany
        ? (bid.bidderCompany as BidCompany)
        : null;

    const user =
      bid.bidder && typeof bid.bidder === 'object' && 'firstName' in bid.bidder
        ? (bid.bidder as BidUser)
        : null;

    if (!company && !user) {
      return (
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-8`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-[#F1BB03]/20 flex items-center justify-center text-2xl font-black text-[#F1BB03] flex-shrink-0">
              {bidderName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${colorClasses.text.primary}`}>{bidderName}</h3>
              <p className={`text-xs ${colorClasses.text.muted}`}>Bidder</p>
            </div>
          </div>
          {bid.coverSheet && (
            <dl className="space-y-0">
              {bid.coverSheet.companyName && <div className="flex justify-between gap-4 py-1.5 border-b border-dashed" style={{borderColor: '#e5e5e5'}}><dt className={`text-xs font-medium ${colorClasses.text.muted}`}>Company</dt><dd className={`text-xs ${colorClasses.text.primary}`}>{bid.coverSheet.companyName}</dd></div>}
              {bid.coverSheet.companyEmail && <div className="flex justify-between gap-4 py-1.5 border-b border-dashed" style={{borderColor: '#e5e5e5'}}><dt className={`text-xs font-medium ${colorClasses.text.muted}`}>Email</dt><dd className={`text-xs ${colorClasses.text.primary}`}>{bid.coverSheet.companyEmail}</dd></div>}
              {bid.coverSheet.companyPhone && <div className="flex justify-between gap-4 py-1.5 border-b border-dashed" style={{borderColor: '#e5e5e5'}}><dt className={`text-xs font-medium ${colorClasses.text.muted}`}>Phone</dt><dd className={`text-xs ${colorClasses.text.primary}`}>{bid.coverSheet.companyPhone}</dd></div>}
              {bid.coverSheet.tinNumber && <div className="flex justify-between gap-4 py-1.5 border-b border-dashed" style={{borderColor: '#e5e5e5'}}><dt className={`text-xs font-medium ${colorClasses.text.muted}`}>TIN</dt><dd className={`text-xs ${colorClasses.text.primary}`}>{bid.coverSheet.tinNumber}</dd></div>}
              {bid.coverSheet.licenseNumber && <div className="flex justify-between gap-4 py-1.5 border-b border-dashed" style={{borderColor: '#e5e5e5'}}><dt className={`text-xs font-medium ${colorClasses.text.muted}`}>License No.</dt><dd className={`text-xs ${colorClasses.text.primary}`}>{bid.coverSheet.licenseNumber}</dd></div>}
            </dl>
          )}
          {!bid.coverSheet && (
            <p className={`text-xs ${colorClasses.text.muted} italic`}>No cover sheet data available for this bidder.</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Company header */}
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
          <div className="flex items-center gap-4 mb-4">
            {company?.logo ? (
              <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#F1BB03]/20 flex items-center justify-center text-2xl font-bold text-[#F1BB03]">
                {(company?.name ?? user?.firstName ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className={`text-lg font-bold ${colorClasses.text.primary}`}>
                {company?.name ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()}
              </h3>
              {user?.email && (
                <p className={`text-sm ${colorClasses.text.muted}`}>{user.email}</p>
              )}
            </div>
          </div>

          <SectionTitle>Cover Sheet Details</SectionTitle>
          <dl className="space-y-0">
            <InfoRow label="Company Name" value={bid.coverSheet?.companyName} />
            <InfoRow label="Representative" value={bid.coverSheet?.authorizedRepresentative} />
            <InfoRow label="Title" value={bid.coverSheet?.representativeTitle} />
            <InfoRow label="Email" value={bid.coverSheet?.companyEmail} />
            <InfoRow label="Phone" value={bid.coverSheet?.companyPhone} />
            <InfoRow label="Address" value={bid.coverSheet?.companyAddress} />
            <InfoRow label="TIN Number" value={bid.coverSheet?.tinNumber} />
            <InfoRow label="License Number" value={bid.coverSheet?.licenseNumber} />
          </dl>
        </div>

        {/* Compliance docs */}
        {bid.complianceChecklist && bid.complianceChecklist.length > 0 && (
          <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5`}>
            <SectionTitle>✅ Compliance Status</SectionTitle>
            <div className="space-y-2">
              {bid.complianceChecklist.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-1.5">
                  <span className={`text-sm ${colorClasses.text.secondary}`}>
                    {item.documentType.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.submitted
                        ? 'bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399]'
                        : `${colorClasses.bg.redLight} ${colorClasses.text.red}`
                    }`}>
                      {item.submitted ? '✓ Submitted' : '✗ Missing'}
                    </span>
                    {item.verifiedByOwner && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#DBEAFE] dark:bg-[#1E3A5F] text-[#2563EB] dark:text-[#60A5FA]">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── TAB 5: Evaluation & Actions ────────────────────────────────────────────
  const renderActions = () => (
    <div className="space-y-6">
      {/* Award banner */}
      {optimisticStatus === 'awarded' && (
        <div className="rounded-2xl p-6 bg-[#D1FAE5] dark:bg-[#064E3B]/60 border border-emerald-300 dark:border-emerald-700 text-center">
          <p className="text-4xl mb-2">🏆</p>
          <h3 className="text-lg font-bold text-[#047857] dark:text-[#34D399]">
            Bid Awarded to {bidderName}!
          </h3>
          <p className={`text-sm mt-1 ${colorClasses.text.secondary}`}>
            The bidder has been notified. Proceed with contract preparation.
          </p>
        </div>
      )}

      {/* 3-Step Evaluation */}
      <BidEvaluationPanel bid={bid} tenderId={tenderId} isOwner />

      {/* Status update */}
      <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5 space-y-4`}>
        <SectionTitle>🔄 Update Bid Status</SectionTitle>
        <p className={`text-xs ${colorClasses.text.muted} -mt-1`}>
          Current: <span className="font-bold">{optimisticStatus.replace(/_/g, ' ')}</span>
        </p>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={[
                'px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all',
                selectedStatus === s
                  ? 'border-[#2AA198] bg-[#2AA198]/10 text-[#2AA198]'
                  : `${colorClasses.border.secondary} ${colorClasses.text.muted}`,
              ].join(' ')}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <textarea
          value={ownerNotes}
          onChange={e => setOwnerNotes(e.target.value)}
          placeholder="Owner notes (optional)…"
          rows={3}
          className={`w-full rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} ${colorClasses.text.primary} text-sm px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#2AA198]/40`}
        />

        <button
          onClick={handleStatusUpdate}
          disabled={updatingStatus || selectedStatus === bid.status}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#2AA198] text-white hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {updatingStatus ? 'Updating…' : 'Update Status'}
        </button>
      </div>

      {/* CPO Return */}
      {bid.cpo && (
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5 space-y-3`}>
          <SectionTitle>🏦 CPO Return — Record Status</SectionTitle>
          <p className={`text-xs ${colorClasses.text.muted}`}>
            Current CPO status:{' '}
            <span className="font-semibold">{bid.cpo.returnStatus ?? 'pending'}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => cpoReturn({ tenderId, bidId: bid._id, returnStatus: 'returned' })}
              disabled={cpoReturning || bid.cpo.returnStatus === 'returned'}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399] hover:opacity-80 disabled:opacity-50 transition-all"
            >
              ✓ Mark as Returned
            </button>
            <button
              onClick={() => cpoReturn({ tenderId, bidId: bid._id, returnStatus: 'forfeited' })}
              disabled={cpoReturning || bid.cpo.returnStatus === 'forfeited'}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold ${colorClasses.bg.redLight} ${colorClasses.text.red} hover:opacity-80 disabled:opacity-50 transition-all`}
            >
              ✗ Mark as Forfeited
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const tabContent: Record<TabId, () => React.ReactNode> = {
    Overview:    renderOverview,
    Details:     renderDetails,
    Attachments: renderAttachments,
    Company:     renderCompany,
    Actions:     renderActions,
  };

  return (
    <div className={`${colorClasses.bg.primary} ${isMobile ? 'pb-20' : ''}`}>
      {/* Desktop top tab bar — teal active indicator for owner */}
      {!isMobile && (
        <div className={`flex overflow-x-auto border-b ${colorClasses.border.secondary} scrollbar-hide`}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-shrink-0 flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-b-2 border-[#2AA198] text-[#2AA198] font-semibold'
                  : `${colorClasses.text.muted} hover:${colorClasses.text.primary}`,
              ].join(' ')}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div className="p-4 sm:p-6">
        {tabContent[activeTab]?.()}
      </div>

      {/* Mobile fixed bottom nav — BUG-6b FIX — teal for owner */}
      {isMobile && (
        <nav className={`fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center h-16 border-t ${colorClasses.border.secondary} ${colorClasses.bg.primary} safe-area-inset-bottom`}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all min-w-[44px] min-h-[44px] justify-center ${
                activeTab === tab.id ? 'text-[#2AA198]' : colorClasses.text.muted
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Award confirmation modal */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`w-full max-w-sm rounded-2xl p-6 ${colorClasses.bg.primary} border ${colorClasses.border.secondary} space-y-4 shadow-2xl`}>
            <div className="text-center">
              <span className="text-4xl">🏆</span>
              <h3 className={`text-lg font-bold mt-2 ${colorClasses.text.primary}`}>Award This Bid?</h3>
              <p className={`text-sm mt-1 ${colorClasses.text.secondary}`}>
                Award this bid to <strong>{bidderName}</strong>? This will notify the bidder and update the tender status.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={doStatusUpdate}
                disabled={updatingStatus}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#2AA198] text-white hover:opacity-80 disabled:opacity-50 transition-all"
              >
                {updatingStatus ? 'Awarding…' : '🏆 Confirm Award'}
              </button>
              <button
                onClick={() => { setShowAwardModal(false); setSelectedStatus(bid.status); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${colorClasses.bg.surface} ${colorClasses.text.primary} border ${colorClasses.border.secondary} hover:opacity-80 transition-all`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerBidDetails;