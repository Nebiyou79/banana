// src/components/bids/SealedBidBanner.tsx
import { useEffect, useState } from 'react';

interface SealedBidBannerProps {
  workflowType: 'open' | 'closed';
  isRevealed: boolean;
  deadline: string;
  revealDate?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

const calculateTimeLeft = (targetDate: string): TimeLeft => {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, isPast: false };
};

export const SealedBidBanner = ({
  workflowType,
  isRevealed,
  deadline,
  revealDate,
}: SealedBidBannerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(revealDate ?? deadline)
  );

  useEffect(() => {
    if (workflowType !== 'closed' || isRevealed) return;

    const target = revealDate ?? deadline;
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(target));
    }, 1000);

    return () => clearInterval(timer);
  }, [workflowType, isRevealed, deadline, revealDate]);

  // Open tenders: no banner
  if (workflowType !== 'closed') return null;

  // Sealed + REVEALED
  if (isRevealed) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[#10B981]/40 bg-[#D1FAE5] dark:bg-[#064E3B] px-4 py-3">
        <span className="text-xl leading-none mt-0.5">🔓</span>
        <div>
          <p className="text-sm font-semibold text-[#047857] dark:text-[#34D399]">
            Bids have been revealed
          </p>
          <p className="text-xs text-[#065F46] dark:text-[#6EE7B7] mt-0.5">
            All submitted bids are now visible. Evaluation may begin.
          </p>
        </div>
      </div>
    );
  }

  // Sealed + NOT YET REVEALED
  const { days, hours, minutes, seconds, isPast } = timeLeft;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7] dark:bg-[#78350F] px-4 py-3">
      <span className="text-xl leading-none mt-0.5">🔒</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#B45309] dark:text-[#FCD34D]">
          This is a sealed tender
        </p>
        <p className="text-xs text-[#92400E] dark:text-[#FDE68A] mt-0.5">
          Bids are encrypted until the owner reveals them after the deadline.
        </p>
        {!isPast ? (
          <p className="text-xs font-medium text-[#92400E] dark:text-[#FDE68A] mt-2">
            Bids open in:{' '}
            <span className="font-bold">
              {days > 0 && `${days}d `}
              {hours > 0 && `${hours}h `}
              {minutes}m {seconds}s
            </span>
          </p>
        ) : (
          <p className="text-xs font-medium text-[#92400E] dark:text-[#FDE68A] mt-2">
            Deadline passed — awaiting owner to reveal bids.
          </p>
        )}
      </div>
    </div>
  );
};

export default SealedBidBanner;
