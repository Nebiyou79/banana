/**
 * navigation/company/CompanyNavigator.tsx
 * Role: Company — 6 main tabs + full stack for all built screens.
 *
 * Tab structure:
 *   1. Home     → CompanyDashboardScreen
 *   2. Jobs     → Top tabs: JobManagement | JobCreate | EmployerApplicationList
 *   3. Social   → Shared SocialNavigator
 *   4. Tenders  → 3-level nested (all placeholders — Tenders/Bids not built yet)
 *   5. Profile  → Top tabs: CompanyProfile | CompanyProductList | FreelancerMarketplace
 *   6. More     → CompanyMoreScreen (stack with all extra screens)
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
  CompanyMainTabParamList,
  CompanyJobsTabParamList,
  CompanyTendersTabParamList,
  CompanyTendersInnerStackParamList,
  CompanyBidsInnerStackParamList,
  CompanyProfileTabParamList,
} from './types';

// ─── Shared ───────────────────────────────────────────────────
import SocialNavigator  from './SocialNavigator';
import PlaceholderScreen from '../screens/auth/PlaceholderScreen';

// ─── Company screens ──────────────────────────────────────────
import { CompanyDashboardScreen }             from '../screens/company/DashboardScreen';
import { CompanyProfileScreen }               from '../screens/company/ProfileScreen';
import { CompanyEditProfileScreen }           from '../screens/company/EditProfileScreen';
import { CompanyMoreScreen }                  from '../screens/company/MoreScreen';

// Jobs
import { JobManagementScreen }                from '../screens/company/JobManagementScreen';
import { JobCreateScreen }                    from '../screens/company/JobCreateScreen';
import { JobEditScreen }                      from '../screens/company/JobEditScreen';
import { CompanyJobDetailScreen }                   from '../screens/company/CompanyJobDetailsScreen';
import { EmployerApplicationListScreen }      from '../screens/company/EmployerApplicationListScreen';
import { EmployerApplicationDetailScreen }    from '../screens/company/EmployerApplicationDetailScreen';

// Products
import { CompanyProductListScreen }    from '../screens/company/CompanyProductListScreen';
import { CompanyProductDetailsScreen } from '../screens/company/ComapnyProductDetailsScreen';
import { CreateProductScreen }         from '../screens/company/CreateProductScreen';
import { EditProductScreen }           from '../screens/company/EditProductScreen';
// Freelancer Marketplace
import { FreelancerMarketplaceScreen }        from '../screens/freelancer/FreelancerMarketplaceScreen';
import { FreelancerDetailScreen }             from '../screens/freelancer/FreelancerDetailScreen';
import { FreelancerShortlistScreen }          from '../screens/freelancer/FreelancerShortlistScreen';

// Shared screens
import { VerificationStatusScreen }           from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }          from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen }                     from '../screens/shared/ReferralScreen';

// Public Products (browsing)
import { ProductMarketplaceScreen }           from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen } from '../screens/products/ProductDetailsScreen';
import { SavedProductsScreen } from '../screens/products/SavedProductsScreen';

// ─── Param list ───────────────────────────────────────────────
export type CompanyStackParamList = {
  // Tabs
  MainTabs: undefined;

  // Company Profile
  Profile:     undefined;
  EditProfile: undefined;

  // Jobs
  CompanyJobList:    undefined;
  CreateJob:         undefined;
  JobEdit:           { jobId: string };
  JobDetail:         { jobId: string };
  ApplicantManager:  { jobId: string; jobTitle: string };
  ApplicantDetail:   { applicationId: string; jobTitle: string };
  ApplicationList:   { jobId: string; jobTitle: string };
  ApplicationDetail: { applicationId: string };

  // Products (own)
  CompanyProductList: undefined;
  ProductDetails:     { productId: string };
  CreateProduct:      undefined;
  EditProduct:        { productId: string };

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

  // Public Product Marketplace
  ProductMarketplace: undefined;
  SavedProducts: undefined;
};

// ─── Navigators ───────────────────────────────────────────────
const MainTab           = createBottomTabNavigator<CompanyMainTabParamList>();
const JobsTopTab        = createMaterialTopTabNavigator<CompanyJobsTabParamList>();
const TendersTopTab     = createMaterialTopTabNavigator<CompanyTendersTabParamList>();
const TendersInnerStack = createNativeStackNavigator<CompanyTendersInnerStackParamList>();
const BidsInnerStack    = createNativeStackNavigator<CompanyBidsInnerStackParamList>();
const ProfileTopTab     = createMaterialTopTabNavigator<CompanyProfileTabParamList>();
const Stack             = createNativeStackNavigator<CompanyStackParamList>();

// ─── Jobs top-tab navigator ───────────────────────────────────
function CompanyJobsNavigator() {
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
      <JobsTopTab.Screen name="JobsList"       component={JobManagementScreen}         options={{ title: 'My Jobs' }} />
      <JobsTopTab.Screen name="CreateJob"      component={JobCreateScreen}             options={{ title: 'Post Job' }} />
      <JobsTopTab.Screen name="JobApplications" component={PlaceholderScreen}          options={{ title: 'Applications' }} />
      <JobsTopTab.Screen
        name="BackToHome"
        component={CompanyDashboardScreen}
      />
    </JobsTopTab.Navigator>
  );
}

// ─── Tenders inner stack ──────────────────────────────────────
function CompanyTendersInnerNavigator() {
  const nav = useNavigation<any>();
  return (
    <TendersInnerStack.Navigator screenOptions={{ headerShown: true }}>
      <TendersInnerStack.Screen name="MyFreelanceTenders"  component={PlaceholderScreen} options={{ title: 'My Freelance Tenders' }} />
      <TendersInnerStack.Screen name="ProfessionalTenders" component={PlaceholderScreen} options={{ title: 'Professional Tenders' }} />
      <TendersInnerStack.Screen name="BrowseTenders"       component={PlaceholderScreen} options={{ title: 'Browse Tenders' }} />
      <TendersInnerStack.Screen name="SavedTenders"        component={PlaceholderScreen} options={{ title: 'Saved Tenders' }} />
      <TendersInnerStack.Screen name="Invitations"         component={PlaceholderScreen} options={{ title: 'Invitations' }} />
      <TendersInnerStack.Screen
        name="BackToTenders"
        component={PlaceholderScreen}
        options={{
          title: '← Tenders',
          headerLeft: () => (
            <TouchableOpacity onPress={() => nav.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#3B82F6" />
            </TouchableOpacity>
          ),
        }}
      />
    </TendersInnerStack.Navigator>
  );
}

// ─── Bids inner stack ─────────────────────────────────────────
function CompanyBidsInnerNavigator() {
  const nav = useNavigation<any>();
  return (
    <BidsInnerStack.Navigator screenOptions={{ headerShown: true }}>
      <BidsInnerStack.Screen name="MyBids"       component={PlaceholderScreen} options={{ title: 'My Bids' }} />
      <BidsInnerStack.Screen name="ReceivedBids" component={PlaceholderScreen} options={{ title: 'Received Bids' }} />
      <BidsInnerStack.Screen
        name="BackToTenders"
        component={PlaceholderScreen}
        options={{
          title: '← Back',
          headerLeft: () => (
            <TouchableOpacity onPress={() => nav.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#3B82F6" />
            </TouchableOpacity>
          ),
        }}
      />
    </BidsInnerStack.Navigator>
  );
}

// ─── Tenders top-level tab ────────────────────────────────────
function CompanyTendersNavigator() {
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
        tabBarScrollEnabled:     true,
      }}
    >
      <TendersTopTab.Screen name="TenderDashboard" component={PlaceholderScreen}                options={{ title: 'Dashboard' }} />
      <TendersTopTab.Screen name="Tenders"         component={CompanyTendersInnerNavigator}     options={{ title: 'Tenders' }} />
      <TendersTopTab.Screen name="Bids"            component={CompanyBidsInnerNavigator}        options={{ title: 'Bids' }} />
      <TendersTopTab.Screen name="Proposals"       component={PlaceholderScreen}                options={{ title: 'Proposals' }} />
      <TendersTopTab.Screen
        name="BackToHome"
        component={CompanyDashboardScreen}
      />
    </TendersTopTab.Navigator>
  );
}

// ─── Profile tab navigator ────────────────────────────────────
function CompanyProfileNavigator() {
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
      <ProfileTopTab.Screen name="CompanyProfile"      component={CompanyProfileScreen}       options={{ title: 'Profile' }} />
      <ProfileTopTab.Screen name="Products"            component={(props : any) => <CompanyProductListScreen {...props} />} />
      <ProfileTopTab.Screen name="FreelanceMarketplace" component={FreelancerMarketplaceScreen} options={{ title: 'Marketplace' }} />
      <ProfileTopTab.Screen
        name="BackToHome"
        component={CompanyDashboardScreen}
      />
    </ProfileTopTab.Navigator>
  );
}

// ─── Social wrapper ───────────────────────────────────────────
function CompanySocialNavigator() {
  return <SocialNavigator parentNavigationKey="Home" />;
}

// ─── Main tab bar ─────────────────────────────────────────────
function CompanyTabNavigator() {
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
      <MainTab.Screen name="Home"    component={CompanyDashboardScreen}  />
      <MainTab.Screen name="Jobs"    component={CompanyJobsNavigator}    />
      <MainTab.Screen name="Social"  component={CompanySocialNavigator}  />
      <MainTab.Screen name="Tenders" component={CompanyTendersNavigator} />
      <MainTab.Screen name="Profile" component={CompanyProfileNavigator} />
      <MainTab.Screen name="More"    component={CompanyMoreScreen}        />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────
export default function CompanyNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tab root */}
      <Stack.Screen name="MainTabs" component={CompanyTabNavigator} />

      {/* Profile */}
      <Stack.Screen name="EditProfile" component={CompanyEditProfileScreen} />

      {/* Jobs stack */}
      <Stack.Screen name="CompanyJobList"  component={JobManagementScreen}          />
      <Stack.Screen name="CreateJob"       component={JobCreateScreen}              />
      <Stack.Screen name="JobEdit"         component={JobEditScreen}                />
      <Stack.Screen name="JobDetail"       component={CompanyJobDetailScreen}             />
      <Stack.Screen name="ApplicationList"  component={EmployerApplicationListScreen} />
      <Stack.Screen name="ApplicationDetail" component={EmployerApplicationDetailScreen} />

      {/* Products (own) */}
    <Stack.Screen name="CompanyProductList" component={CompanyProductListScreen} />
    <Stack.Screen name="ProductDetails"     component={CompanyProductDetailsScreen} />
    <Stack.Screen name="CreateProduct"      component={CreateProductScreen} />
    <Stack.Screen name="EditProduct"        component={EditProductScreen} />

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

      {/* Public Product Marketplace */}
      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
    </Stack.Navigator>
  );
}