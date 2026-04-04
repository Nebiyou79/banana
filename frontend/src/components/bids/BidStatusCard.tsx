// src/components/bids/BidStatusCard.tsx
import { colorClasses } from '@/utils/color';
import { Bid, BidStatus, BidTender } from '@/services/bidService';
import { useWithdrawBid } from '@/hooks/useBid';

interface BidStatusCardProps {
  bid: Bid;
  tender: BidTender;
  tenderId: string;
  onWithdraw?: () => void;
  onUpdate?: () => void;
}

const fmt = (n: number | null, currency = 'ETB') =>
  n != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
    : null;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

type StatusStyle = {
  wrapper: string;
  icon: string;
  title: string;
  message: string;
  gradient?: string;
};

const statusStyles: Record<BidStatus, StatusStyle> = {
  submitted: {
    wrapper: 'border-amber-200 dark:border-amber-800',
    icon: '⏳',
    title: 'Bid Submitted',
    message: 'Your bid is submitted. Awaiting review by the tender owner.',
  },
  under_review: {
    wrapper: 'border-blue-300 dark:border-blue-700',
    icon: '🔍',
    title: 'Under Review',
    message: 'Your bid is currently being reviewed. You may not withdraw at this stage.',
  },
  shortlisted: {
    wrapper: 'border-teal-400 dark:border-teal-600',
    icon: '⭐',
    title: 'Shortlisted',
    message: 'Congratulations! You have been shortlisted. Awaiting the final decision.',
  },
  interview_scheduled: {
    wrapper: 'border-purple-400 dark:border-purple-700',
    icon: '📅',
    title: 'Interview Scheduled',
    message: 'An interview has been scheduled. Please check for further details below.',
  },
  awarded: {
    wrapper: 'border-[#F1BB03]',
    icon: '🏆',
    title: 'Bid Awarded!',
    message: 'Congratulations! Your bid has been awarded. Please prepare the performance bond.',
    gradient: 'bg-gradient-to-r from-[#F1BB03]/20 to-[#F1BB03]/5',
  },
  rejected: {
    wrapper: 'border-dashed border-gray-300 dark:border-gray-700',
    icon: '📋',
    title: 'Not Selected',
    message: 'Thank you for participating. Your bid was not selected this time.',
  },
  withdrawn: {
    wrapper: 'border-dashed border-gray-300 dark:border-gray-700',
    icon: '↩',
    title: 'Bid Withdrawn',
    message: '',
  },
};

export const BidStatusCard = ({
  bid,
  tender,
  tenderId,
  onWithdraw,
  onUpdate,
}: BidStatusCardProps) => {
  const { mutate: withdraw, isPending: withdrawing } = useWithdrawBid();
  const style = statusStyles[bid.status];

  const isBeforeDeadline =
    tender.deadline ? new Date(tender.deadline) > new Date() : false;

  const canWithdraw =
    bid.status === 'submitted' && isBeforeDeadline;

  const canUpdate = bid.status === 'submitted' && isBeforeDeadline;

  const isSealed = tender.workflowType === 'closed';
  const amount = fmt(bid.bidAmount, bid.currency);

  const handleWithdraw = () => {
    withdraw(
      { tenderId, bidId: bid._id },
      {
        onSuccess: () => {
          onWithdraw?.();
        },
      }
    );
  };

  return (
    <div
      className={[
        'rounded-2xl border-2 overflow-hidden transition-all',
        colorClasses.bg.primary,
        style.wrapper,
      ].join(' ')}
    >
      {/* Awarded gradient header */}
      {bid.status === 'awarded' && (
        <div className="bg-gradient-to-r from-[#F1BB03] to-[#D99E00] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-[#0A2540] font-bold text-lg">Your Bid Has Been Awarded!</p>
              <p className="text-[#0A2540]/70 text-sm">
                Tender: {tender.title}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 space-y-3">
        {/* Icon + title + message */}
        {bid.status !== 'awarded' && (
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">{style.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${colorClasses.text.primary}`}>{style.title}</p>
              <p className={`text-sm ${colorClasses.text.muted} mt-0.5`}>
                {bid.status === 'withdrawn'
                  ? `You withdrew this bid on ${formatDate(bid.updatedAt)}.`
                  : style.message}
              </p>
            </div>
          </div>
        )}

        {/* Awarded body */}
        {bid.status === 'awarded' && (
          <div
            className={`rounded-xl px-4 py-3 ${colorClasses.bg.surface} flex items-center justify-between`}
          >
            <p className={`text-sm ${colorClasses.text.muted}`}>⚠ Performance bond required</p>
          </div>
        )}

        {/* Bid amount */}
        {bid.status !== 'withdrawn' && bid.status !== 'rejected' && (
          <div
            className={`rounded-xl px-4 py-3 border ${colorClasses.border.secondary} ${colorClasses.bg.surface} flex items-center justify-between`}
          >
            <span className={`text-xs font-medium ${colorClasses.text.muted}`}>Bid Amount</span>
            {isSealed && bid.bidAmount == null ? (
              <span className="text-sm font-semibold text-[#B45309] dark:text-[#FCD34D]">
                🔒 Sealed
              </span>
            ) : (
              <span className="text-lg font-bold text-[#F1BB03]">{amount ?? '—'}</span>
            )}
          </div>
        )}

        {/* Owner notes (rejection notes, interview notes) */}
        {bid.ownerNotes && (
          <div
            className={`rounded-xl px-4 py-3 border ${colorClasses.border.secondary} ${colorClasses.bg.surface}`}
          >
            <p className={`text-xs font-medium ${colorClasses.text.muted} mb-1`}>Note from Owner</p>
            <p className={`text-sm ${colorClasses.text.secondary}`}>{bid.ownerNotes}</p>
          </div>
        )}

        {/* Actions */}
        {(canWithdraw || canUpdate) && (
          <div className="flex gap-2 pt-1">
            {canUpdate && onUpdate && (
              <button
                onClick={onUpdate}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 ${colorClasses.border.goldenMustard} text-[#F1BB03] hover:bg-[#F1BB03]/10 transition-all`}
              >
                ✏ Update Bid
              </button>
            )}
            {canWithdraw && (
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold ${colorClasses.bg.redLight} ${colorClasses.text.red} hover:opacity-80 disabled:opacity-50 transition-all`}
              >
                {withdrawing ? 'Withdrawing…' : '↩ Withdraw Bid'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BidStatusCard;
