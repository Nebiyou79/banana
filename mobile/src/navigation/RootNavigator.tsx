/**
 * src/navigation/RootNavigator.tsx
 *
 * NavigationContainer belongs in App.tsx, NOT here.
 * This file exports only the stack + linkingConfig.
 *
 * Fix: All role screens are always mounted. The conditional logic only
 * controls which screen is focused via navigation state, avoiding
 * RESET action errors when auth state changes.
 */

import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { LinkingOptions } from '@react-navigation/native';

import { useAuthStore } from '../store/authStore';
import { authLogoutEvent } from '../lib/api';
import { AuthNavigator } from './AuthNavigator';
import CandidateNavigator from './CandidateNavigator';
import FreelancerNavigator from './FreelancerNavigator';
import CompanyNavigator from './CompanyNavigator';
import OrganizationNavigator from './OrganizationNavigator';
import PlaceholderScreen from '../screens/auth/PlaceholderScreen';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  CandidateRoot: undefined;
  FreelancerRoot: undefined;
  CompanyRoot: undefined;
  OrganizationRoot: undefined;
  Loading: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Deep-link config (pass to NavigationContainer in App.tsx) ────────────────

export const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: ['bananalink://', 'https://app.bananalink.io'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
      CandidateRoot: {
        screens: {
          MainTabs: {
            screens: {
              Social: {
                screens: {
                  SocialTabs: { screens: { Posts: 'feed' } },
                  PublicProfile: 'profile/:userId',
                  Chat: 'chat/:conversationId',
                },
              },
              Jobs: { screens: { JobsList: 'jobs' } },
            },
          },
          JobDetail: 'job/:jobId',
        },
      },
      FreelancerRoot: {
        screens: {
          MainTabs: {
            screens: {
              Social: {
                screens: {
                  PublicProfile: 'profile/:userId',
                  Chat: 'chat/:conversationId',
                },
              },
            },
          },
          FreelancerTenderDetail: 'tender/:tenderId',
        },
      },
      CompanyRoot: {
        screens: {
          MainTabs: {
            screens: {
              Social: {
                screens: {
                  PublicProfile: 'profile/:userId',
                  Chat: 'chat/:conversationId',
                },
              },
            },
          },
          JobDetail: 'job/:jobId',
        },
      },
      OrganizationRoot: {
        screens: {
          MainTabs: {
            screens: {
              Social: {
                screens: {
                  PublicProfile: 'profile/:userId',
                  Chat: 'chat/:conversationId',
                },
              },
            },
          },
          OrgJobDetail: 'job/:jobId',
        },
      },
    },
  },
};

// ─── Root navigator ───────────────────────────────────────────────────────────
//
// All role screens are always mounted to avoid RESET actions failing when
// the role changes. The initial route is driven by auth/role state but
// never unmounts screens conditionally.

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, role, logout } = useAuthStore();

  // Force logout on server-side 401 / token revocation
  useEffect(() => {
    const unsub = authLogoutEvent.subscribe(() => {
      logout();
    });
    return () => unsub();
  }, [logout]);

  // Determine the initial route based on auth state
  const initialRoute = !isAuthenticated
    ? 'Auth'
    : role === 'candidate'
    ? 'CandidateRoot'
    : role === 'freelancer'
    ? 'FreelancerRoot'
    : role === 'company'
    ? 'CompanyRoot'
    : role === 'organization'
    ? 'OrganizationRoot'
    : 'Loading';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute as keyof RootStackParamList}
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="CandidateRoot" component={CandidateNavigator} />
      <Stack.Screen name="FreelancerRoot" component={FreelancerNavigator} />
      <Stack.Screen name="CompanyRoot" component={CompanyNavigator} />
      <Stack.Screen name="OrganizationRoot" component={OrganizationNavigator} />
      <Stack.Screen name="Loading" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
};