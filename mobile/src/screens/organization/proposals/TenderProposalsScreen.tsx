// src/screens/organization/proposals/TenderProposalsScreen.tsx
// Organization wrapper for TenderProposalsScreen

import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { TenderProposalsScreen } from '../../company/proposals/TenderProposalsScreen';

type RouteParams = {
  tenderId: string;
  tenderTitle: string;
};

export const OrgTenderProposalsScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const params = route.params as RouteParams;
  
  return (
    <TenderProposalsScreen 
      tenderId={params.tenderId}
      tenderTitle={params.tenderTitle}
      role="organization"
    />
  );
};

export default OrgTenderProposalsScreen;