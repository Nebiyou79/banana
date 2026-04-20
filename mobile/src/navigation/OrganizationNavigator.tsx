/**
 * navigation/organization/OrganizationNavigator.tsx
 * Role: Organization — 6 main tabs + full stack for all built screens.
 *
 * Tab structure:
 *   1. Home     → OrganizationDashboardScreen
 *   2. Jobs     → Top tabs: OrgJobsScreen | OrgJobCreate | Placeholder(Applications)
 *   3. Social   → Shared SocialNavigator
 *   4. Tenders  → Top tabs (all placeholders — not built yet)
 *   5. Profile  → Top tabs: OrgProfileScreen | FreelancerMarketplace
 *   6. More     → OrganizationMoreScreen (stack with all extra screens)
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';
import { useNavigation }                 from '@react-navigation/native';
import { Ionicons }                      from '@expo/vector-icons';
import { useThemeStore }                 from '../store/themeStore';

// ─── Types ────────────────────────────────────────────────────
import {
  OrganizationMainTabParamList,
  OrganizationJobsTabParamList,
  OrganizationTendersTabParamList,
  OrganizationProfileTabParamList,
} from './types';

// ─── Shared ───────────────────────────────────────────────────
import SocialNavigator   from './SocialNavigator';
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
import { EmployerApplicationsScreen } from '../screens/company/EmployerApplicationListScreen';

// ─── Param list ───────────────────────────────────────────────
export type OrganizationStackParamList = {
  // Tabs
  MainTabs: undefined;

  // Profile
  EditProfile: undefined;

  // Jobs
  OrgJobList:        undefined;
  OrgJobCreate:      undefined;
  OrgJobEdit:        { jobId: string };
  OrgJobDetail:      { jobId: string };
  OrgApplicants:     { jobId: string; jobTitle: string };
  ApplicationList:   { jobId: string; jobTitle: string };
  ApplicationDetail: { applicationId: string };

  // Freelancer Marketplace
  FreelancerMarketplace: undefined;
  FreelancerDetail:      { freelancerId: string };
  FreelancerShortlist:   undefined;

  // Verification
  VerificationStatus:  undefined;
  RequestVerification: undefined;

  // Referral
  Referral:    undefined;
  Leaderboard: undefined;

  // Products
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
  const nav = useNavigation<any>();
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
      <JobsTopTab.Screen name="JobsList"        component={OrgJobsScreen}     options={{ title: 'Opportunities' }} />
      <JobsTopTab.Screen name="CreateJob"       component={OrgJobCreateScreen} options={{ title: 'Post' }} />
      <JobsTopTab.Screen name="JobApplications" component={PlaceholderScreen}  options={{ title: 'Applications' }} />
      <JobsTopTab.Screen
        name="BackToHome"
        component={PlaceholderScreen}
        options={{
          title: '← Back',
        }}
      />
    </JobsTopTab.Navigator>
  );
}

// ─── Tenders top-tab navigator (all placeholders) ────────────
function OrganizationTendersNavigator() {
  const nav = useNavigation<any>();
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
      <TendersTopTab.Screen
        name="BackToHome"
        component={PlaceholderScreen}
        options={{
          title: '← Back',
        }}
      />
    </TendersTopTab.Navigator>
  );
}

// ─── Profile tab navigator ────────────────────────────────────
function OrganizationProfileNavigator() {
  const nav = useNavigation<any>();
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
      <ProfileTopTab.Screen name="OrganizationProfile" component={OrganizationProfileScreen}   options={{ title: 'Profile' }} />
      <ProfileTopTab.Screen
        name="FreelanceMarketplace"
        component={(props : any) => <FreelancerMarketplaceScreen {...props} />}
        options={{ title: 'Marketplace' }}
      />
      <ProfileTopTab.Screen
        name="BackToHome"
        component={PlaceholderScreen}
        options={{
          title: '← Back',
        }}
      />
    </ProfileTopTab.Navigator>
  );
}

// ─── Social wrapper ───────────────────────────────────────────
function OrganizationSocialNavigator() {
  return <SocialNavigator parentNavigationKey="Home" />;
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
        tabBarStyle:             { backgroundColor: colors.surface },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:    ['home-outline',          'home'],
            Jobs:    ['briefcase-outline',     'briefcase'],
            Social:  ['globe-outline',         'globe'],
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
      <MainTab.Screen name="Social"  component={OrganizationSocialNavigator}  />
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
      {/* Tab root */}
      <Stack.Screen name="MainTabs" component={OrganizationTabNavigator} />

      {/* Profile */}
      <Stack.Screen name="EditProfile" component={OrganizationEditProfileScreen} />

      {/* Jobs stack */}
      <Stack.Screen name="OrgJobList"    component={OrgJobsScreen}                  />
      <Stack.Screen name="OrgJobCreate"  component={OrgJobCreateScreen}             />
      <Stack.Screen name="OrgJobEdit"    component={OrgJobEditScreen}               />
      <Stack.Screen name="OrgJobDetail"  component={OrgJobDetail}                   />
      <Stack.Screen name="OrgApplicants" component={EmployerApplicationsScreen}  />
      <Stack.Screen name="ApplicationList"   component={EmployerApplicationsScreen}   />
      <Stack.Screen name="ApplicationDetail" component={EmployerApplicationDetailScreen} />

      {/* Freelancer Marketplace */}
      <Stack.Screen
        name="FreelancerMarketplace"
        component={(props : any) => <FreelancerMarketplaceScreen {...props} />}
      />
      <Stack.Screen name="FreelancerDetail"      component={FreelancerDetailScreen}      />
      <Stack.Screen name="FreelancerShortlist"   component={FreelancerShortlistScreen}   />

      {/* Verification */}
      <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen}  />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />

      {/* Referral */}
      <Stack.Screen name="Referral"    component={ReferralScreen}    />
      <Stack.Screen name="Leaderboard" component={PlaceholderScreen} />

      {/* Products */}
      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen}      />
      <Stack.Screen name="ProductDetails"     component={PublicProductDetailsScreen}    />
    </Stack.Navigator>
  );
}