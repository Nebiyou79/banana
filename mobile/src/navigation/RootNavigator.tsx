import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { authLogoutEvent } from '../lib/api';
import { AuthNavigator } from './AuthNavigator';
import { CandidateNavigator } from './CandidateNavigator';
import { FreelancerNavigator } from './FreelancerNavigator';
import { CompanyNavigator } from './CompanyNavigator';
import { OrganizationNavigator } from './OrganizationNavigator';

export type RootStackParamList = {
  Auth: undefined;
  CandidateRoot: undefined;
  FreelancerRoot: undefined;
  CompanyRoot: undefined;
  OrganizationRoot: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, role, logout } = useAuthStore();

  // Listen for 401 forced-logout events from API interceptor
  useEffect(() => {
    const unsub = authLogoutEvent.subscribe(() => logout());
    return unsub;
  }, [logout]);

  const getRoleNavigator = () => {
    switch (role) {
      case 'candidate':
        return <Stack.Screen name="CandidateRoot" component={CandidateNavigator} />;
      case 'freelancer':
        return <Stack.Screen name="FreelancerRoot" component={FreelancerNavigator} />;
      case 'company':
        return <Stack.Screen name="CompanyRoot" component={CompanyNavigator} />;
      case 'organization':
        return <Stack.Screen name="OrganizationRoot" component={OrganizationNavigator} />;
      default:
        return <Stack.Screen name="CandidateRoot" component={CandidateNavigator} />;
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        getRoleNavigator()
      )}
    </Stack.Navigator>
  );
};