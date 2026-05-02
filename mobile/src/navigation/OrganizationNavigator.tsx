// src/navigation/OrganizationNavigator.tsx
/**
 * navigation/OrganizationNavigator.tsx
 * Role: Organization — main tabs + full stack for all built screens.
 *
 * 🆕 The Tenders tab now mounts <TendersNavigator userRole="organization" />.
 *    Organizations see a smaller surface than companies: the Professional
 *    top-tabs are 2 (My / Create — no Browse), and the Bids tab is a single
 *    Received-Bids screen with no top-tabs.
 */

import React from 'react';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';
import { Ionicons }                      from '@expo/vector-icons';
import { useThemeStore }                 from '../store/themeStore';

// ─── Param-list types ────────────────────────────────────────
import {
  OrganizationMainTabParamList,
  OrganizationJobsTabParamList,
  OrganizationProfileTabParamList,
} from './types';

// ─── New tenders navigator (replaces the old Tenders top-tabs) ────
import TendersNavigator from './TendersNavigator';

// ─── Placeholders ─────────────────────────────────────────────
import PlaceholderScreen from '../screens/auth/PlaceholderScreen';

// ─── Organization screens ─────────────────────────────────────
import { OrgJobsScreen }                      from '../screens/organization/OrgJobsScreen';
import { OrgJobCreateScreen }                 from '../screens/organization/OrgJobCreateScreen';

// Freelancer Marketplace
import { FreelancerMarketplaceScreen }        from '../screens/freelancer/FreelancerMarketplaceScreen';
import { FreelancerDetailScreen }             from '../screens/freelancer/FreelancerDetailScreen';
import { FreelancerShortlistScreen }          from '../screens/freelancer/FreelancerShortlistScreen';

// Shared screens
import { VerificationStatusScreen }           from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }          from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen }                     from '../screens/shared/ReferralScreen';

// Products
import { ProductMarketplaceScreen }                                from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen as PublicProductDetailsScreen }     from '../screens/products/ProductDetailsScreen';
import { EmployerApplicationsScreen }                              from '../screens/company/EmployerApplicationListScreen';
import { OrganizationProfileScreen } from '../screens/organization/ProfileScreen';

// ─── Param list ───────────────────────────────────────────────
//  Tender deep-links live inside TendersNavigator's stacks — see the
//  CompanyNavigator file header for the cross-stack navigate() pattern.
export type OrganizationStackParamList = {
  MainTabs: undefined;
OrgProfile: undefined;
  EditProfile: undefined;

  OrgJobList:        undefined;
  OrgJobCreate:      undefined;
  OrgJobEdit:        { jobId: string };
  OrgJobDetail:      { jobId: string };
  OrgApplicants:     { jobId: string; jobTitle: string };
  ApplicationList:   { jobId: string; jobTitle: string };
  ApplicationDetail: { applicationId: string };

  FreelancerMarketplace: undefined;
  FreelancerDetail:      { freelancerId: string };
  FreelancerShortlist:   undefined;

  VerificationStatus:  undefined;
  RequestVerification: undefined;

  Referral:    undefined;
  Leaderboard: undefined;

  ProductMarketplace: undefined;
  ProductDetails:     { productId: string };
};

// ─── Navigators ───────────────────────────────────────────────
const MainTab       = createBottomTabNavigator<OrganizationMainTabParamList>();
const JobsTopTab    = createMaterialTopTabNavigator<OrganizationJobsTabParamList>();
const ProfileTopTab = createMaterialTopTabNavigator<OrganizationProfileTabParamList>();
const Stack         = createNativeStackNavigator<OrganizationStackParamList>();

// ─── Jobs top-tab navigator ───────────────────────────────────
function OrganizationJobsNavigator() {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <JobsTopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIndicatorStyle:    { backgroundColor: colors.primary },
        tabBarStyle:             { backgroundColor: colors.surface },
      }}
    >
      <JobsTopTab.Screen name="JobsList"        component={OrgJobsScreen}      options={{ title: 'Opportunities' }} />
      <JobsTopTab.Screen name="CreateJob"       component={OrgJobCreateScreen} options={{ title: 'Post' }} />
      <JobsTopTab.Screen name="JobApplications" component={PlaceholderScreen}  options={{ title: 'Applications' }} />
      <JobsTopTab.Screen name="BackToHome"      component={PlaceholderScreen}  options={{ title: '← Back' }} />
    </JobsTopTab.Navigator>
  );
}

// ─── Tenders tab — NEW: mounts TendersNavigator ──────────────
//  Replaces the old OrganizationTendersNavigator entirely.
function OrganizationTendersTab() {
  return <TendersNavigator userRole="organization" />;
}

// ─── Profile top-tab navigator ────────────────────────────────
function OrganizationProfileNavigator() {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <ProfileTopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIndicatorStyle:    { backgroundColor: colors.primary },
        tabBarStyle:             { backgroundColor: colors.surface },
      }}
    >
      <ProfileTopTab.Screen name="OrgProfile"           component={OrganizationProfileScreen}            options={{ title: 'Profile' }} />
      <ProfileTopTab.Screen name="FreelanceMarketplace" component={FreelancerMarketplaceScreen}  options={{ title: 'Marketplace' }} />
      <ProfileTopTab.Screen name="BackToHome"           component={PlaceholderScreen} />
    </ProfileTopTab.Navigator>
  );
}

// ─── Main tab bar ─────────────────────────────────────────────
function OrganizationTabNavigator() {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <MainTab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Tenders manages its own chrome — hide the parent tab bar to avoid
        // showing two bottom bars at once.
        tabBarStyle:
          route.name === 'Tenders'
            ? { display: 'none' }
            : { backgroundColor: colors.surface },
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          const icons: Record<string, [string, string]> = {
            Home:    ['home-outline',          'home'],
            Jobs:    ['briefcase-outline',     'briefcase'],
            Tenders: ['document-text-outline', 'document-text'],
            Profile: ['business-outline',      'business'],
            More:    ['menu-outline',          'menu'],
          };
          const [outline, filled] = icons[route.name] ?? ['ellipse-outline', 'ellipse'];
          return <Ionicons name={(focused ? filled : outline) as any} size={size} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="Home"    component={PlaceholderScreen}            />
      <MainTab.Screen name="Jobs"    component={OrganizationJobsNavigator}    />
      <MainTab.Screen name="Tenders" component={OrganizationTendersTab}       />
      <MainTab.Screen name="Profile" component={OrganizationProfileNavigator} />
      <MainTab.Screen name="More"    component={PlaceholderScreen}            />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────
export default function OrganizationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={OrganizationTabNavigator} />

      <Stack.Screen name="EditProfile" component={PlaceholderScreen} />

      <Stack.Screen name="OrgJobList"        component={OrgJobsScreen}                />
      <Stack.Screen name="OrgJobCreate"      component={OrgJobCreateScreen}            />
      <Stack.Screen name="OrgJobEdit"        component={PlaceholderScreen}            />
      <Stack.Screen name="OrgJobDetail"      component={PlaceholderScreen}            />
      <Stack.Screen name="OrgApplicants"     component={PlaceholderScreen}            />
      <Stack.Screen name="ApplicationList"   component={EmployerApplicationsScreen}   />
      <Stack.Screen name="ApplicationDetail" component={PlaceholderScreen}            />

      <Stack.Screen
        name="FreelancerMarketplace"
        component={(props: any) => <FreelancerMarketplaceScreen {...props} />}
      />
      <Stack.Screen name="FreelancerDetail"    component={FreelancerDetailScreen}    />
      <Stack.Screen name="FreelancerShortlist" component={FreelancerShortlistScreen} />

      <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen}  />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />

      <Stack.Screen name="Referral"    component={ReferralScreen}    />
      <Stack.Screen name="Leaderboard" component={PlaceholderScreen} />

      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen}        />
      <Stack.Screen name="ProductDetails"     component={PublicProductDetailsScreen}      />
    </Stack.Navigator>
  );
}
