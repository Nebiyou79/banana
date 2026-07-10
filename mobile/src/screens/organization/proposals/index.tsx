// src/screens/organization/proposals/index.tsx
// Banana Mobile App — Module 6B: Proposals
//
// Organization proposal screens are identical to company screens.
// The only difference is the `role` param passed to navigation routes.

import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { TenderProposalsScreen } from '../../company/proposals/TenderProposalsScreen';
import { CompanyProposalDetailScreen } from '../../company/proposals/ProposalDetailScreen';
import { ProposalStatsScreen } from '../../company/proposals/ProposalStatsScreen';

// ─── Route param types ───────────────────────────────────────────────────────

type TenderProposalsParams = {
  tenderId: string;
  tenderTitle: string;
};

type ProposalDetailParams = {
  proposalId: string;
  tenderId: string;
};

type ProposalStatsParams = {
  tenderId: string;
  tenderTitle: string;
};

// ─── Org: Tender Proposals ────────────────────────────────────────────────────
// Wraps TenderProposalsScreen and injects role='organization' into route.params

export const OrgTenderProposalsScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: TenderProposalsParams }, 'params'>>();
  
  // Create a modified route object with role injected
  const modifiedRoute = {
    ...route,
    params: {
      ...route.params,
      role: 'organization' as const,
    },
  };
  
  // @ts-ignore - We're intentionally passing a modified route
  return <TenderProposalsScreen route={modifiedRoute} />;
};

// ─── Org: Proposal Detail ─────────────────────────────────────────────────────

export const OrgProposalDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: ProposalDetailParams }, 'params'>>();
  
  // Create a modified route object with role injected
  const modifiedRoute = {
    ...route,
    params: {
      ...route.params,
      role: 'organization' as const,
    },
  };
  
  // @ts-ignore - We're intentionally passing a modified route
  return <CompanyProposalDetailScreen route={modifiedRoute} />;
};

// ─── Org: Proposal Stats ──────────────────────────────────────────────────────

export const OrgProposalStatsScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: ProposalStatsParams }, 'params'>>();
  
  // Create a modified route object with role injected
  const modifiedRoute = {
    ...route,
    params: {
      ...route.params,
      role: 'organization' as const,
    },
  };
  
  // @ts-ignore - We're intentionally passing a modified route
  return <ProposalStatsScreen route={modifiedRoute} />;
};

// ─── Default export for convenience ──────────────────────────────────────────

export default {
  OrgTenderProposalsScreen,
  OrgProposalDetailScreen,
  OrgProposalStatsScreen,
};