/**
 * navigation/organization/OrganizationNavigator.tsx
 * Role: Organization — 6 main tabs + full stack for all built screens.
 */

import React from 'react';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';
import { Ionicons }                      from '@expo/vector-icons';
import { useThemeStore }                 from '../store/themeStore';

// ─── Types ────────────────────────────────────────────────────
import {
  OrganizationMainTabParamList,
  OrganizationJobsTabParamList,
  OrganizationTendersTabParamList,
  OrganizationProfileTabParamList,
} from './types';

// ─── Social (full stack entry) ────────────────────────────────
import SocialEntry       from '../social/navigation/SocialEntry';
import PlaceholderScreen from '../screens/auth/PlaceholderScreen';

// ─── Organization screens ─────────────────────────────────────
import { OrganizationDashboardScreen }      from '../screens/organization/DashboardScreen';
import { OrganizationProfileScreen }        from '../screens/organization/ProfileScreen';
import { OrganizationEditProfileScreen }    from '../screens/organization/EditProfileScreen';
import { OrganizationMoreScreen }           from '../screens/organization/MoreScreen';

// Jobs
import { OrgJobsScreen }                    from '../screens/organization/OrgJobsScreen';
import { OrgJobCreateScreen }               from '../screens/organization/OrgJobCreateScreen';
import { OrgJobEditScreen }                 from '../screens/organization/OrgJobEditScreen';
import { OrgJobDetail }                     from '../screens/organization/OrgJobDetail';
import { EmployerApplicationDetailScreen }  from '../screens/company/EmployerApplicationDetailScreen';

// Freelancer Marketplace
import { FreelancerMarketplaceScreen }      from '../screens/freelancer/FreelancerMarketplaceScreen';
import { FreelancerDetailScreen }           from '../screens/freelancer/FreelancerDetailScreen';
import { FreelancerShortlistScreen }        from '../screens/freelancer/FreelancerShortlistScreen';

// Shared screens
import { VerificationStatusScreen }         from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }        from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen }                   from '../screens/shared/ReferralScreen';

// Products
import { ProductMarketplaceScreen }         from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen as PublicProductDetailsScreen } from '../screens/products/ProductDetailsScreen';
import { EmployerApplicationsScreen }       from '../screens/company/EmployerApplicationListScreen';

// ─── Param list ───────────────────────────────────────────────
export type OrganizationStackParamList = {
  MainTabs: undefined;

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
const MainTab        = createBottomTabNavigator<OrganizationMainTabParamList>();
const JobsTopTab     = createMaterialTopTabNavigator<OrganizationJobsTabParamList>();
const TendersTopTab  = createMaterialTopTabNavigator<OrganizationTendersTabParamList>();
const ProfileTopTab  = createMaterialTopTabNavigator<OrganizationProfileTabParamList>();
const Stack          = createNativeStackNavigator<OrganizationStackParamList>();

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

// ─── Tenders top-tab navigator ────────────────────────────────
function OrganizationTendersNavigator() {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <TendersTopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIndicatorStyle:    { backgroundColor: colors.primary },
        tabBarStyle:             { backgroundColor: colors.surface },
      }}
    >
      <TendersTopTab.Screen name="TendersList" component={PlaceholderScreen} options={{ title: 'Tenders' }} />
      <TendersTopTab.Screen name="Bids"        component={PlaceholderScreen} options={{ title: 'Bids' }} />
      <TendersTopTab.Screen name="Proposals"   component={PlaceholderScreen} options={{ title: 'Proposals' }} />
      <TendersTopTab.Screen name="BackToHome"  component={PlaceholderScreen} options={{ title: '← Back' }} />
    </TendersTopTab.Navigator>
  );
}

// ─── Profile tab navigator ────────────────────────────────────
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
      <ProfileTopTab.Screen name="OrganizationProfile" component={OrganizationProfileScreen} options={{ title: 'Profile' }} />
      <ProfileTopTab.Screen
        name="FreelanceMarketplace"
        component={(props: any) => <FreelancerMarketplaceScreen {...props} />}
        options={{ title: 'Marketplace' }}
      />
      <ProfileTopTab.Screen name="BackToHome" component={PlaceholderScreen} options={{ title: '← Back' }} />
    </ProfileTopTab.Navigator>
  );
}

// ─── Main tab bar ─────────────────────────────────────────────
function OrganizationTabNavigator() {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle:
          route.name === 'Social'
            ? { display: 'none' }
            : { backgroundColor: colors.surface },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:    ['home-outline',          'home'],
            Jobs:    ['briefcase-outline',     'briefcase'],
            Social:  ['people-outline',        'people'],
            Tenders: ['document-text-outline', 'document-text'],
            Profile: ['business-outline',      'business'],
            More:    ['menu-outline',          'menu'],
          };
          const [outline, filled] = icons[route.name] ?? ['ellipse-outline', 'ellipse'];
          return <Ionicons name={(focused ? filled : outline) as any} size={size} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="Home"    component={OrganizationDashboardScreen}  />
      <MainTab.Screen name="Jobs"    component={OrganizationJobsNavigator}    />
      <MainTab.Screen name="Social"  component={SocialEntry}                  />
      <MainTab.Screen name="Tenders" component={OrganizationTendersNavigator} />
      <MainTab.Screen name="Profile" component={OrganizationProfileNavigator} />
      <MainTab.Screen name="More"    component={OrganizationMoreScreen}        />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────
export default function OrganizationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={OrganizationTabNavigator} />

      <Stack.Screen name="EditProfile" component={OrganizationEditProfileScreen} />

      <Stack.Screen name="OrgJobList"       component={OrgJobsScreen}                  />
      <Stack.Screen name="OrgJobCreate"     component={OrgJobCreateScreen}             />
      <Stack.Screen name="OrgJobEdit"       component={OrgJobEditScreen}               />
      <Stack.Screen name="OrgJobDetail"     component={OrgJobDetail}                   />
      <Stack.Screen name="OrgApplicants"    component={EmployerApplicationsScreen}     />
      <Stack.Screen name="ApplicationList"  component={EmployerApplicationsScreen}     />
      <Stack.Screen name="ApplicationDetail" component={EmployerApplicationDetailScreen} />

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

      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen}   />
      <Stack.Screen name="ProductDetails"     component={PublicProductDetailsScreen} />
    </Stack.Navigator>
  );
}