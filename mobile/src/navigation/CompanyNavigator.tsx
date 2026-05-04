// src/navigation/CompanyNavigator.tsx
/**
 * Role: Company — 6 main tabs + full stack.
 * Uses shared PillTabBar with per-route accent colours.
 * Tenders tab mounts TendersNavigator (fully wired).
 */

import React from 'react';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';

import { useThemeStore }                 from '../store/themeStore';
import { PillTabBar, PillTabMeta }       from './PillTabBar';
import {
  CompanyMainTabParamList,
  CompanyJobsTabParamList,
  CompanyProfileTabParamList,
} from './types';

import TendersNavigator                              from './TendersNavigator';
import SocialEntry                                   from '../social/navigation/SocialEntry';
import PlaceholderScreen                             from '../screens/auth/PlaceholderScreen';

// Company screens
import { CompanyDashboardScreen }                    from '../screens/company/DashboardScreen';
import { CompanyProfileScreen }                      from '../screens/company/ProfileScreen';
import { CompanyEditProfileScreen }                  from '../screens/company/EditProfileScreen';
import { CompanyMoreScreen }                         from '../screens/company/MoreScreen';

import { JobManagementScreen }                       from '../screens/company/JobManagementScreen';
import { JobCreateScreen }                           from '../screens/company/JobCreateScreen';
import { JobEditScreen }                             from '../screens/company/JobEditScreen';
import { CompanyJobDetailScreen }                    from '../screens/company/CompanyJobDetailsScreen';
import { EmployerApplicationDetailScreen }           from '../screens/company/EmployerApplicationDetailScreen';
import { EmployerApplicationsScreen }                from '../screens/company/EmployerApplicationListScreen';

import { CompanyProductListScreen }                  from '../screens/company/CompanyProductListScreen';
import { CompanyProductDetailsScreen }               from '../screens/company/CompanyProductDetailsScreen';
import { CreateProductScreen }                       from '../screens/company/CreateProductScreen';
import { EditProductScreen }                         from '../screens/company/EditProductScreen';

import { FreelancerMarketplaceScreen }               from '../screens/freelancer/FreelancerMarketplaceScreen';
import { FreelancerDetailScreen }                    from '../screens/freelancer/FreelancerDetailScreen';
import { FreelancerShortlistScreen }                 from '../screens/freelancer/FreelancerShortlistScreen';

import { VerificationStatusScreen }                  from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }                 from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen }                            from '../screens/shared/ReferralScreen';

import { ProductMarketplaceScreen }                  from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }                      from '../screens/products/ProductDetailsScreen';
import { SavedProductsScreen }                       from '../screens/products/SavedProductsScreen';

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

// ─── Navigator factories ──────────────────────────────────────────────────────
const MainTab       = createBottomTabNavigator<CompanyMainTabParamList>();
const JobsTopTab    = createMaterialTopTabNavigator<CompanyJobsTabParamList>();
const ProfileTopTab = createMaterialTopTabNavigator<CompanyProfileTabParamList>();
const Stack         = createNativeStackNavigator<CompanyStackParamList>();

// ─── Tab metadata ─────────────────────────────────────────────────────────────
const COMPANY_META: Record<string, PillTabMeta> = {
  Home:    { icon: 'home-outline',          iconActive: 'home',          label: 'Home',    accentDark: '#60A5FA', accentLight: '#2563EB' },
  Jobs:    { icon: 'briefcase-outline',     iconActive: 'briefcase',     label: 'Jobs',    accentDark: '#34D399', accentLight: '#059669' },
  Social:  { icon: 'people-outline',        iconActive: 'people',        label: 'Social',  accentDark: '#D8B4FE', accentLight: '#7C3AED' },
  Tenders: { icon: 'document-text-outline', iconActive: 'document-text', label: 'Tenders', accentDark: '#F1BB03', accentLight: '#B45309' },
  Profile: { icon: 'business-outline',      iconActive: 'business',      label: 'Profile', accentDark: '#FDBA74', accentLight: '#EA580C' },
  More:    { icon: 'grid-outline',          iconActive: 'grid',           label: 'More',    accentDark: '#94A3B8', accentLight: '#64748B' },
};

// ─── Jobs top-tab navigator ───────────────────────────────────────────────────
function CompanyJobsNavigator() {
  const isDark  = useThemeStore((s) => s.theme.isDark);
  const primary = isDark ? '#34D399' : '#059669';
  const muted   = isDark ? '#64748B' : '#94A3B8';
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  return (
    <JobsTopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   primary,
        tabBarInactiveTintColor: muted,
        tabBarIndicatorStyle:    { backgroundColor: primary, height: 3, borderRadius: 2 },
        tabBarStyle:             { backgroundColor: surface, elevation: 0, shadowOpacity: 0 },
        tabBarLabelStyle:        { fontSize: 12, fontWeight: '700', textTransform: 'none' },
      }}
    >
      <JobsTopTab.Screen name="JobsList"        component={JobManagementScreen}        options={{ title: 'My Jobs' }} />
      <JobsTopTab.Screen name="CreateJob"       component={JobCreateScreen}            options={{ title: 'Post Job' }} />
      <JobsTopTab.Screen name="JobApplications" component={EmployerApplicationsScreen} options={{ title: 'Applications' }} />
      <JobsTopTab.Screen name="BackToHome"      component={CompanyDashboardScreen}     options={{ tabBarItemStyle: { display: 'none' } }} />
    </JobsTopTab.Navigator>
  );
}

function CompanyTendersTab() {
  return <TendersNavigator userRole="company" />;
}

// ─── Profile top-tab navigator ────────────────────────────────────────────────
function CompanyProfileNavigator() {
  const isDark  = useThemeStore((s) => s.theme.isDark);
  const primary = isDark ? '#FDBA74' : '#EA580C';
  const muted   = isDark ? '#64748B' : '#94A3B8';
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  return (
    <ProfileTopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   primary,
        tabBarInactiveTintColor: muted,
        tabBarIndicatorStyle:    { backgroundColor: primary, height: 3, borderRadius: 2 },
        tabBarStyle:             { backgroundColor: surface, elevation: 0, shadowOpacity: 0 },
        tabBarLabelStyle:        { fontSize: 12, fontWeight: '700', textTransform: 'none' },
      }}
    >
      <ProfileTopTab.Screen name="CompanyProfile"       component={CompanyProfileScreen}       options={{ title: 'Profile' }} />
      <ProfileTopTab.Screen name="Products"             component={(props: any) => <CompanyProductListScreen {...props} />} options={{ title: 'Products' }} />
      <ProfileTopTab.Screen name="FreelanceMarketplace" component={FreelancerMarketplaceScreen} options={{ title: 'Marketplace' }} />
      <ProfileTopTab.Screen name="BackToHome"           component={CompanyDashboardScreen}      options={{ tabBarItemStyle: { display: 'none' } }} />
    </ProfileTopTab.Navigator>
  );
}

// ─── Main tab bar ─────────────────────────────────────────────────────────────
function CompanyTabNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);

  return (
    <MainTab.Navigator
      tabBar={({ state, navigation }) => (
        <PillTabBar
          routes={state.routes}
          activeIndex={state.index}
          isDark={isDark}
          meta={COMPANY_META}
          onPress={(name, key, focused) => {
            const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(name);
            }
          }}
        />
      )}
      screenOptions={{ headerShown: false }}
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

// ─── Root stack ───────────────────────────────────────────────────────────────
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
      <Stack.Screen name="FreelancerMarketplace" component={(props: any) => <FreelancerMarketplaceScreen {...props} />} />
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