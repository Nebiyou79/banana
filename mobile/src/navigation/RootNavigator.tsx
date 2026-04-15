import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { authLogoutEvent } from '../lib/api';
import { AuthNavigator } from './AuthNavigator';
import { CandidateNavigator } from './CandidateNavigator';
import { FreelancerNavigator } from './FreelancerNavigator';
import { CompanyNavigator } from './CompanyNavigator';
import { OrganizationNavigator } from './OrganizationNavigator';
import PlaceholderScreen from '../screens/auth/PlaceholderScreen';

export type RootStackParamList = {
  Auth: undefined;
  CandidateRoot: undefined;
  FreelancerRoot: undefined;
  CompanyRoot: undefined;
  OrganizationRoot: undefined;
  Loading:undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();


export const RootNavigator: React.FC = () => {
  const { isAuthenticated, role, logout } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          {/* Always define these names so navigation.reset can find them */}
          {role === 'candidate' && (
            <Stack.Screen name="CandidateRoot" component={CandidateNavigator} />
          )}
          {role === 'company' && (
            <Stack.Screen name="CompanyRoot" component={CompanyNavigator} />
          )}
          {role === 'organization' && (
            <Stack.Screen name="OrganizationRoot" component={OrganizationNavigator} />
          )}
          {role === 'freelancer' && (
            <Stack.Screen name="FreelancerRoot" component={FreelancerNavigator} />
          )}
          
          {/* Fallback to prevent the Reset error if role is temporarily undefined */}
          <Stack.Screen name="Loading" component={PlaceholderScreen} /> 
        </>
      )}
    </Stack.Navigator>
  );
};