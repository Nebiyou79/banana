// mobile/src/screens/company/freelanceTenders/FreelanceTenderCreateScreen.tsx
//
// FIX: FreelanceTenderFormShell is rendered inside the Freelance Tenders top-tab
// navigator (which itself lives inside the main Tenders bottom-tab navigator).
// Both navigators report their heights to React Navigation, so the screen
// content is already inset correctly. Any SafeAreaView with edges={['bottom']}
// inside FreelanceTenderFormShell would double-pad the footer.
//
// Action: this wrapper is a thin pass-through — the fix must be applied inside
// FreelanceTenderFormShell's own footer/SafeAreaView by using edges={['top']}
// or edges={[]} for its bottom area. This file intentionally has no SafeAreaView
// of its own so the shell component controls insets directly.

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