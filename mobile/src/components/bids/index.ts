// src/components/bids/index.ts
// Barrel export for all bid components
// ─────────────────────────────────────────────────────────────────────────────

// Card components
export { BidCard } from './BidCard';
export { MyBidCard } from './MyBidCard'; // if created
export { OpenBidCard } from './OpenBidCard'; // if created
export { SealedBidCard } from './SealedBidCard'; // if created

// Form components
export { BidForm } from './BidForm';
export { BidCoverSheetForm } from './BidCoverSheetForm';
export { BidTechnicalProposalForm } from './BidTechnicalProposalForm';
export { BidFinancialBreakdownForm } from './BidFinancialBreakdownForm';
export { BidCPOForm } from './BidCPOForm';
export { BidDocumentUploadSection } from './BidDocumentUploadSection';
export { BidReviewStep } from './BidReviewStep';

// Display components
export { BidCoverSheetDisplay } from './BidCoverSheetDisplay';
export { BidFinancialBreakdownDisplay } from './BidFinancialBreakdownDisplay';
export { BidDocumentList } from './BidDocumentList';
export { BidStatusBadge } from './BidStatusBadge';
export { BidStatusTimeline } from './BidStatusTimeline';
// export { BidStatusCard } from './BidStatusCard'; // if created
export { BidSealedIndicator } from './BidSealedIndicator';

// Owner components
export { BidComplianceChecklist } from './BidComplianceChecklist';
export { BidEvaluationPanel } from './BidEvaluationPanel';
export { BidHeader } from './BidHeader';
export { BidderInfo } from './BidderInfo';
export { BidTabBar } from './BidTabBar';

// Utility components
export { BidEmptyState } from './BidEmptyState';
export { BidSkeleton } from './BidSkeleton';

// Types (re-export from types)
export type { CoverSheetFormValues } from './BidCoverSheetForm';
export type { TechnicalProposalFormValues } from './BidTechnicalProposalForm';
export type { LineItemDraft } from './BidFinancialBreakdownForm';
export type { CPOFormValues } from './BidCPOForm';
export type { FileEntry, DocSlot, PickedFile } from './BidDocumentUploadSection';
export { draftToLineItem, lineItemToDraft, emptyDraft } from './BidFinancialBreakdownForm';
export { DEFAULT_SLOTS } from './BidDocumentUploadSection';