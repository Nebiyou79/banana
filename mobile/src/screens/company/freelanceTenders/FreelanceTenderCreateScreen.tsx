// mobile/src/screens/company/freelanceTenders/FreelanceTenderCreateScreen.tsx

import { useNavigation } from '@react-navigation/native';
import React from 'react';
import FreelanceTenderFormShell from '../../../components/freelanceTenders/FreelanceTenderForm/FreelanceTenderFormShell';

/**
 * Owner: Company / Organization
 * Route: FreelanceTenderCreate (no params)
 * Renders the 5-step form in "create" mode.
 * On success navigates back to MyTenders list.
 */
const FreelanceTenderCreateScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleSuccess = (_id: string) => {
    // Pop back to MyTenders; the list will refetch via invalidation.
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CompanyMyTenders');
    }
  };

  const handleCancel = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <FreelanceTenderFormShell
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

export default FreelanceTenderCreateScreen;