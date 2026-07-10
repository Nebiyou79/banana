// mobile/src/screens/company/freelanceTenders/FreelanceTenderEditScreen.tsx
//
// FIX: Same as FreelanceTenderCreateScreen — thin wrapper, no SafeAreaView.
// FreelanceTenderFormShell controls its own insets. The fix for its footer
// buttons must be applied inside FreelanceTenderFormShell: change any
// SafeAreaView that wraps the Cancel/Continue footer to use edges={['top']}
// or no bottom edge, since the navigator already provides the bottom offset.

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React from 'react';
import FreelanceTenderFormShell from '../../../components/freelanceTenders/FreelanceTenderForm/FreelanceTenderFormShell';

type RouteParams = { tenderId: string };

/**
 * Owner: Company / Organization
 * Route: FreelanceTenderEdit  { tenderId: string }
 * Renders the 5-step form in "edit" mode — pre-populates from API via tenderId.
 */
const FreelanceTenderEditScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ FreelanceTenderEdit: RouteParams }, 'FreelanceTenderEdit'>>();
  const { tenderId } = route.params;

  const handleSuccess = (id: string) => {
    navigation.replace('CompanyTenderDetail', { tenderId: id });
  };

  const handleCancel = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <FreelanceTenderFormShell
      tenderId={tenderId}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

export default FreelanceTenderEditScreen;