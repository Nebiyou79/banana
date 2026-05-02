// mobile/src/screens/company/freelanceTenders/FreelanceTenderEditScreen.tsx

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
    // Navigate to the detail screen to see the updated tender.
    navigation.replace('FreelanceTenderDetail', { tenderId: id });
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