// src/navigation/CompanyNavigator.tsx
/**
 * navigation/CompanyNavigator.tsx
 * Role: Company — 6 main tabs + full stack for all built screens.
 *
 * 🆕 The Tenders tab now mounts the new <TendersNavigator userRole="company" />
 *    instead of the old top-tab Dashboard/Tenders/Bids/Proposals stack.
 *    The new flow has its own Splash → Home → 6 bottom tabs.
 */

import React from 'react';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';
import { Ionicons }                      from '@expo/vector-icons';
import { useThemeStore }                 from '../store/themeStore';

// ─── Param-list types ────────────────────────────────────────
import {
  CompanyMainTabParamList,
  CompanyJobsTabParamList,
  CompanyProfileTabParamList,
} from './types';

// ─── New tenders navigator (replaces the old Tenders top-tabs) ────
import TendersNavigator from './TendersNavigator';

// ─── Social (full stack entry) ────────────────────────────────
import SocialEntry       from '../social/navigation/SocialEntry';
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
import { CompanyJobDetailScreen }             from '../screens/company/CompanyJobDetailsScreen';
import { EmployerApplicationDetailScreen }    from '../screens/company/EmployerApplicationDetailScreen';
import { EmployerApplicationsScreen }         from '../screens/company/EmployerApplicationListScreen';

// Products
import { CompanyProductListScreen }    from '../screens/company/CompanyProductListScreen';
import { CompanyProductDetailsScreen } from '../screens/company/CompanyProductDetailsScreen';
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

// Public Products
import { ProductMarketplaceScreen }           from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }               from '../screens/products/ProductDetailsScreen';
import { SavedProductsScreen }                from '../screens/products/SavedProductsScreen';

// ─── Param list ───────────────────────────────────────────────
//  Note: tender-specific deep-link entries (ProfessionalTenderDetail, etc.)
//  are NOT here — they live inside TendersNavigator's own stacks. Anywhere
//  outside the Tenders tab that needs to jump to a tender should call:
//    navigation.navigate('MainTabs', {
//      screen: 'Tenders',
//      params: {
//        screen: 'TendersHome',
//        params: {
//          screen: 'ProfessionalTenders',
//          params: {
//            screen: 'ProfessionalTenderDetail',
//            params: { tenderId },
//          },
//        },
//      },
//    });
export type CompanyStackParamList = {
  MainTabs: undefined;

  Profile:     undefined;
  EditProfile: undefined;

  CompanyJobList:    undefined;
  CreateJob:         undefined;
  JobEdit:           { jobId: string };
  JobDetail:         { jobId: string };
  ApplicantManager:  { jobId: string; jobTitle: string };
  ApplicantDetail:   { applicationId: string; jobTitle: string };
  ApplicationList:   { jobId: string; jobTitle: string };
  ApplicationDetail: { applicationId: string };

  CompanyProductList:    undefined;
  CompanyProductDetails: { productId: string };
  CreateProduct:         undefined;
  EditProduct:           { productId: string };

  FreelancerMarketplace: undefined;
  FreelancerDetail:      { freelancerId: string };
  FreelancerShortlist:   undefined;

  VerificationStatus:  undefined;
  RequestVerification: undefined;

  Referral:    undefined;
  Leaderboard: undefined;

  ProductMarketplace: undefined;
  ProductDetails:     { productId: string };
  SavedProducts:      undefined;
};

// ─── Navigators ───────────────────────────────────────────────
const MainTab       = createBottomTabNavigator<CompanyMainTabParamList>();
const JobsTopTab    = createMaterialTopTabNavigator<CompanyJobsTabParamList>();
const ProfileTopTab = createMaterialTopTabNavigator<CompanyProfileTabParamList>();
const Stack         = createNativeStackNavigator<CompanyStackParamList>();

// ─── Jobs top-tab navigator ───────────────────────────────────
function CompanyJobsNavigator() {
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
      <JobsTopTab.Screen name="JobsList"        component={JobManagementScreen}        options={{ title: 'My Jobs' }} />
      <JobsTopTab.Screen name="CreateJob"       component={JobCreateScreen}            options={{ title: 'Post Job' }} />
      <JobsTopTab.Screen name="JobApplications" component={EmployerApplicationsScreen} options={{ title: 'Applications' }} />
      <JobsTopTab.Screen name="BackToHome"      component={CompanyDashboardScreen} />
    </JobsTopTab.Navigator>
  );
}

// ─── Tenders tab — NEW: mounts TendersNavigator ──────────────
//  Replaces the old CompanyTendersNavigator (top-tabs +
//  CompanyTendersInnerNavigator + CompanyBidsInnerNavigator) entirely.
function CompanyTendersTab() {
  return <TendersNavigator userRole="company" />;
}

// ─── Profile tab navigator ────────────────────────────────────
function CompanyProfileNavigator() {
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
      <ProfileTopTab.Screen name="CompanyProfile"      component={CompanyProfileScreen}                  options={{ title: 'Profile' }} />
      <ProfileTopTab.Screen
        name="Products"
        component={(props: any) => <CompanyProductListScreen {...props} />}
        options={{ title: 'Products' }}
      />
      <ProfileTopTab.Screen name="FreelanceMarketplace" component={FreelancerMarketplaceScreen}          options={{ title: 'Marketplace' }} />
      <ProfileTopTab.Screen name="BackToHome"           component={CompanyDashboardScreen} />
    </ProfileTopTab.Navigator>
  );
}

// ─── Main tab bar ─────────────────────────────────────────────
function CompanyTabNavigator() {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <MainTab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle:
          // The Social and Tenders tabs each manage their own chrome —
          // hide the parent tab bar to avoid double bars.
          route.name === 'Social' || route.name === 'Tenders'
            ? { display: 'none' }
            : { backgroundColor: colors.surface },
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
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
      <MainTab.Screen name="Home"    component={CompanyDashboardScreen}  />
      <MainTab.Screen name="Jobs"    component={CompanyJobsNavigator}    />
      <MainTab.Screen name="Social"  component={SocialEntry}             />
      <MainTab.Screen name="Tenders" component={CompanyTendersTab}       />
      <MainTab.Screen name="Profile" component={CompanyProfileNavigator} />
      <MainTab.Screen name="More"    component={CompanyMoreScreen}       />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────
export default function CompanyNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={CompanyTabNavigator} />

      <Stack.Screen name="EditProfile" component={CompanyEditProfileScreen} />

      <Stack.Screen name="CompanyJobList"    component={JobManagementScreen}             />
      <Stack.Screen name="CreateJob"         component={JobCreateScreen}                 />
      <Stack.Screen name="JobEdit"           component={JobEditScreen}                   />
      <Stack.Screen name="JobDetail"         component={CompanyJobDetailScreen}          />
      <Stack.Screen name="ApplicationList"   component={EmployerApplicationsScreen}      />
      <Stack.Screen name="ApplicationDetail" component={EmployerApplicationDetailScreen} />

      <Stack.Screen name="CompanyProductList"    component={CompanyProductListScreen}    />
      <Stack.Screen name="CompanyProductDetails" component={CompanyProductDetailsScreen} />
      <Stack.Screen name="CreateProduct"         component={CreateProductScreen}         />
      <Stack.Screen name="EditProduct"           component={EditProductScreen}           />

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

      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
      <Stack.Screen name="ProductDetails"     component={ProductDetailsScreen}     />
      <Stack.Screen name="SavedProducts"      component={SavedProductsScreen}      />
    </Stack.Navigator>
  );
}
