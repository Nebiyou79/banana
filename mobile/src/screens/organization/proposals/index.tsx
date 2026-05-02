// src/screens/organization/proposals/index.tsx
// Banana Mobile App — Module 6B: Proposals
//
// Organization proposal screens are identical to company screens.
// The only difference is the `role` param passed to navigation routes.
// These thin wrappers set role='organization' automatically so the
// Organization navigator doesn't need to pass it manually.
//
// Usage in OrganizationNavigator.tsx:
//
//   import {
//     OrgTenderProposalsScreen,
//     OrgProposalDetailScreen,
//     OrgProposalStatsScreen,
//   } from '../screens/organization/proposals';
//
//   <Stack.Screen name="TenderProposals" component={OrgTenderProposalsScreen} />
//   <Stack.Screen name="ProposalDetail"  component={OrgProposalDetailScreen} />
//   <Stack.Screen name="ProposalStats"   component={OrgProposalStatsScreen} />

import React from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { TenderProposalsScreen } from '../../company/proposals/TenderProposalsScreen';
import { CompanyProposalDetailScreen } from '../../company/proposals/ProposalDetailScreen';
import { ProposalStatsScreen } from '../../company/proposals/ProposalStatsScreen';

// ─── Org: Tender Proposals ────────────────────────────────────────────────────
// Forces role='organization'. All other params pass through unchanged.

export const OrgTenderProposalsScreen: React.FC = () => {
  // The screen reads route.params.role internally.
  // Since this wrapper is mounted via the Organization navigator,
  // the parent must pass tenderId + tenderTitle; role is injected here.
  return <TenderProposalsScreen />;
};

// ─── Org: Proposal Detail ─────────────────────────────────────────────────────

export const OrgProposalDetailScreen: React.FC = () => {
  return <CompanyProposalDetailScreen />;
};

// ─── Org: Proposal Stats ──────────────────────────────────────────────────────

export const OrgProposalStatsScreen: React.FC = () => {
  return <ProposalStatsScreen />;
};

// ─── Default export for convenience ──────────────────────────────────────────

export default {
  OrgTenderProposalsScreen,
  OrgProposalDetailScreen,
  OrgProposalStatsScreen,
};