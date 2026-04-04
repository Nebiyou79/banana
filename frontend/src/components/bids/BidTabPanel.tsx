// src/components/bids/BidTabPanel.tsx
import { useState } from 'react';
import { colorClasses } from '@/utils/color';
import { Bid, BidTender } from '@/services/bidService';
import { useUpdateBidStatus, useVerifyCPOReturn } from '@/hooks/useBid';
import BidCoverSheetDisplay from './BidCoverSheetDisplay';
import BidDocumentList from './BidDocumentList';
import BidComplianceChecklist from './BidComplianceChecklist';
import BidEvaluationPanel from './BidEvaluationPanel';
import BidStatusCard from './BidStatusCard';
import FinancialBreakdownTable from './FinancialBreakdownTable';
import BidStatusBadge from './BidStatusBadge';
import type { BidStatus } from '@/services/bidService';

interface BidTabPanelProps {
  bid: Bid;
  tender: BidTender;
  tenderId: string;
  viewerRole: 'bidder' | 'owner';
  isBidsRevealed: boolean;
}

const TABS = ['Overview', 'Details', 'Attachments', 'Actions'] as const;
type Tab = (typeof TABS)[number];

const SealedPlaceholder = ({ label = 'Financial details sealed' }: { label?: string }) => (
  <div
    className={`flex items-center gap-2 rounded-xl px-5 py-4 ${colorClasses.bg.amberLight} border border-[#F59E0B]/30`}
  >
    <span className="text-xl">🔒</span>
    <p className={`text-sm font-semibold ${colorClasses.text.amber700}`}>{label}</p>
  </div>
);

export const BidTabPanel = ({
  bid,
  tender,
  tenderId,
  viewerRole,
  isBidsRevealed,
}: BidTabPanelProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [ownerNotes, setOwnerNotes] = useState(bid.ownerNotes ?? '');
  const [selectedStatus, setSelectedStatus] = useState<BidStatus>(bid.status);

  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateBidStatus();
  const { mutate: cpoReturn, isPending: cpoReturning } = useVerifyCPOReturn();

  const isSealed = tender.workflowType === 'closed';
  const isOwner = viewerRole === 'owner';

  // Financial content visible when: own bid | owner after reveal | open tender
  const canSeeFinancial =
    viewerRole === 'bidder' || (isOwner && isBidsRevealed) || !isSealed;

  const STATUS_OPTIONS: BidStatus[] = [
    'submitted',
    'under_review',
    'shortlisted',
    'interview_scheduled',
    'awarded',
    'rejected',
  ];

  return (
    <div className={`${colorClasses.bg.primary} rounded-2xl overflow-hidden`}>
      {/* Tab Bar */}
      <div
        className={`flex overflow-x-auto border-b ${colorClasses.border.secondary} scrollbar-hide`}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'shrink-0 px-5 py-3.5 text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab
                ? `border-b-2 border-[#F1BB03] ${colorClasses.text.primary} font-semibold`
                : `${colorClasses.text.muted} hover:${colorClasses.text.primary}`,
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {/* ── TAB 1: Overview ─────────────────────────────────────────── */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Bid summary + cover sheet */}
            <div className="space-y-4">
              {/* Bid summary card */}
              <div
                className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5 space-y-3`}
              >
                <h3 className={`text-sm font-bold ${colorClasses.text.primary}`}>Bid Summary</h3>
                <dl className="space-y-2 text-sm">
                  {[
                    { label: 'Bid Number', value: bid.bidNumber ?? '—' },
                    {
                      label: 'Bid Amount',
                      value:
                        canSeeFinancial && bid.bidAmount != null
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: bid.currency,
                            }).format(bid.bidAmount)
                          : isSealed && !isBidsRevealed
                          ? '🔒 Sealed'
                          : '—',
                    },
                    { label: 'Currency', value: bid.currency },
                    {
                      label: 'Type',
                      value: isSealed ? '🔒 Sealed bid' : '🔓 Open bid',
                    },
                    {
                      label: 'Submitted',
                      value: new Date(bid.submittedAt).toLocaleString('en-GB'),
                    },
                    { label: 'Status', value: <BidStatusBadge status={bid.status} size="sm" /> },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className={`${colorClasses.text.muted} font-medium shrink-0`}>
                        {label}
                      </dt>
                      <dd className={`${colorClasses.text.primary} text-right`}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Cover sheet (sealed tenders) or sealed placeholder */}
              {isSealed ? (
                canSeeFinancial && bid.coverSheet ? (
                  <BidCoverSheetDisplay coverSheet={bid.coverSheet} isSealed={!isBidsRevealed} />
                ) : (
                  <SealedPlaceholder />
                )
              ) : bid.coverSheet ? (
                <BidCoverSheetDisplay coverSheet={bid.coverSheet} />
              ) : null}
            </div>

            {/* RIGHT: Technical proposal */}
            <div>
              <h3 className={`text-sm font-bold ${colorClasses.text.primary} mb-3`}>
                Technical Proposal
              </h3>
              {bid.technicalProposal ? (
                <div
                  className={`prose prose-sm max-w-none rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5 ${colorClasses.text.primary}`}
                  dangerouslySetInnerHTML={{ __html: bid.technicalProposal }}
                />
              ) : (
                <p className={`text-sm ${colorClasses.text.muted} italic`}>
                  No technical proposal provided.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: Details ──────────────────────────────────────────── */}
        {activeTab === 'Details' && (
          <div className="space-y-6">
            {/* Financial proposal */}
            <div>
              <h3 className={`text-sm font-bold ${colorClasses.text.primary} mb-3`}>
                Financial Proposal
              </h3>
              {canSeeFinancial ? (
                bid.financialProposal ? (
                  <div
                    className={`prose prose-sm max-w-none rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-5 ${colorClasses.text.primary}`}
                    dangerouslySetInnerHTML={{ __html: bid.financialProposal }}
                  />
                ) : (
                  <p className={`text-sm ${colorClasses.text.muted} italic`}>
                    No financial proposal provided.
                  </p>
                )
              ) : (
                <SealedPlaceholder label="Financial proposal sealed until bids are revealed" />
              )}
            </div>

            {/* Financial breakdown */}
            {bid.financialBreakdown && (
              <div>
                {canSeeFinancial ? (
                  <FinancialBreakdownTable breakdown={bid.financialBreakdown} editable={false} />
                ) : (
                  <SealedPlaceholder label="Financial breakdown sealed until bids are revealed" />
                )}
              </div>
            )}

            {/* Compliance checklist */}
            <BidComplianceChecklist
              bid={bid}
              tenderId={tenderId}
              isOwner={isOwner}
              isEditable={isOwner}
            />
          </div>
        )}

        {/* ── TAB 3: Attachments ──────────────────────────────────────── */}
        {activeTab === 'Attachments' && (
          <div className="space-y-4">
            <h3 className={`text-sm font-bold ${colorClasses.text.primary} mb-2`}>
              Uploaded Documents
            </h3>
            <BidDocumentList
              documents={bid.documents}
              tenderId={tenderId}
              bidId={bid._id}
              canDownload
              isSealed={isSealed}
              isBidsRevealed={isBidsRevealed}
            />
          </div>
        )}

        {/* ── TAB 4: Actions ──────────────────────────────────────────── */}
        {activeTab === 'Actions' && (
          <div className="space-y-6">
            {viewerRole === 'bidder' ? (
              /* BIDDER ACTIONS */
              <BidStatusCard
                bid={bid}
                tender={tender}
                tenderId={tenderId}
              />
            ) : (
              /* OWNER ACTIONS */
              <div className="space-y-6">
                {/* Evaluation panel */}
                <BidEvaluationPanel bid={bid} tenderId={tenderId} isOwner={isOwner} />

                {/* Status update */}
                <div
                  className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} p-5 space-y-4`}
                >
                  <h3 className={`text-sm font-bold ${colorClasses.text.primary}`}>
                    Update Bid Status
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={[
                          'px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all',
                          selectedStatus === s
                            ? 'border-[#F1BB03] bg-[#F1BB03]/10 text-[#F1BB03]'
                            : `${colorClasses.border.secondary} ${colorClasses.text.muted}`,
                        ].join(' ')}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={ownerNotes}
                    onChange={(e) => setOwnerNotes(e.target.value)}
                    placeholder="Owner notes (optional)…"
                    rows={3}
                    className={`w-full rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40`}
                  />

                  <button
                    onClick={() =>
                      updateStatus({
                        tenderId,
                        bidId: bid._id,
                        status: selectedStatus,
                        ownerNotes,
                      })
                    }
                    disabled={updatingStatus || selectedStatus === bid.status}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#F1BB03] text-[#0A2540] hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {updatingStatus ? 'Updating…' : 'Update Status'}
                  </button>
                </div>

                {/* CPO Return (if CPO is on the bid) */}
                {bid.cpo && (
                  <div
                    className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} p-5 space-y-3`}
                  >
                    <h3 className={`text-sm font-bold ${colorClasses.text.primary}`}>
                      🏦 CPO Return — Record Status
                    </h3>
                    <p className={`text-xs ${colorClasses.text.muted}`}>
                      Current CPO status:{' '}
                      <span className="font-semibold">{bid.cpo.returnStatus ?? 'pending'}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          cpoReturn({ tenderId, bidId: bid._id, returnStatus: 'returned' })
                        }
                        disabled={cpoReturning || bid.cpo.returnStatus === 'returned'}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399] hover:opacity-80 disabled:opacity-50 transition-all"
                      >
                        ✓ Mark as Returned
                      </button>
                      <button
                        onClick={() =>
                          cpoReturn({ tenderId, bidId: bid._id, returnStatus: 'forfeited' })
                        }
                        disabled={cpoReturning || bid.cpo.returnStatus === 'forfeited'}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold ${colorClasses.bg.redLight} ${colorClasses.text.red} hover:opacity-80 disabled:opacity-50 transition-all`}
                      >
                        ✗ Mark as Forfeited
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BidTabPanel;
