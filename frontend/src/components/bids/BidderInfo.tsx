// src/components/bids/BidderInfo.tsx
// FIXES:
//   FIX-B1  Accepts optional coverSheetName prop — most reliable name source
//           when bidderCompany isn't populated.
//   FIX-B2  Resolution order: coverSheetName → populated company → populated user → skeleton
//   FIX-B3  Never shows "Unknown Bidder" when any name source is present.

import { colorClasses } from '@/utils/color';
import { Bid, BidCompany, BidUser } from '@/services/bidService';

interface BidderInfoProps {
  bidder: Bid['bidder'];
  company?: Bid['bidderCompany'];
  /** Highest-priority name source: bid.coverSheet.companyName */
  coverSheetName?: string;
  size?: 'sm' | 'md';
}

export const BidderInfo = ({ bidder, company, coverSheetName, size = 'md' }: BidderInfoProps) => {
  // Resolution order: coverSheet → populated company → populated user
  const isPopulatedCompany =
    company != null &&
    typeof company === 'object' &&
    'name' in company &&
    typeof (company as BidCompany).name === 'string' &&
    (company as BidCompany).name.trim().length > 0;

  const isPopulatedUser =
    bidder != null &&
    typeof bidder === 'object' &&
    'firstName' in bidder;

  // FIX-B2: coverSheetName is always reliable — use it first
  const name = coverSheetName?.trim()
    ? coverSheetName.trim()
    : isPopulatedCompany
    ? (company as BidCompany).name
    : isPopulatedUser
    ? `${(bidder as BidUser).firstName ?? ''} ${(bidder as BidUser).lastName ?? ''}`.trim() || 'Bidder'
    : null;

  // FIX-B3: only show skeleton when truly nothing is available
  const isUnresolvable = !name && (
    typeof bidder === 'string' ||
    (typeof company === 'string' && !isPopulatedUser)
  );

  if (isUnresolvable) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
        <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  const displayName = name ?? 'Bidder';
  const logo = isPopulatedCompany ? (company as BidCompany).logo ?? null : null;
  const avatarSize = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  const nameSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-2 min-w-0">
      {logo ? (
        <img
          src={logo}
          alt={displayName}
          className={`${avatarSize} rounded-xl object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700`}
        />
      ) : (
        <div className={`${avatarSize} rounded-xl bg-[#F1BB03]/20 flex items-center justify-center font-black text-[#F1BB03] flex-shrink-0`}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <span
        className={`${nameSize} font-bold ${colorClasses.text.primary} truncate`}
        title={displayName}
      >
        {displayName}
      </span>
    </div>
  );
};

export default BidderInfo;