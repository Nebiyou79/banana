// src/navigation/CompanyNavigator.tsx
// ─────────────────────────────────────────────────────────────────────────────
// UPDATED: CompanyStackParamList extended with all tender-screen routes so that
// screens pushed from inside TendersNavigator (e.g. OwnerBidDetail, MyBidDetail,
// BrowseProfessionalTenderDetail, etc.) can also be navigated to from
// the Company root stack when needed.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useThemeStore } from '../store/themeStore';
import { SimpleRoleTabBar, getSimpleTabBarHeight } from './SimpleRoleTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COMPANY_TAB_META } from './roleAccents';
import type {
  CompanyMainTabParamList,
  CompanyJobsTabParamList,
  CompanyProfileTabParamList,
} from './types';

import SocialEntry from '../social/navigation/SocialEntry';
import PlaceholderScreen from '../screens/auth/PlaceholderScreen';

// Dashboard & Profile
import { CompanyDashboardScreen } from '../screens/company/DashboardScreen';
import { CompanyProfileScreen } from '../screens/company/ProfileScreen';
import { CompanyEditProfileScreen } from '../screens/company/EditProfileScreen';
import { CompanyMoreScreen } from '../screens/company/MoreScreen';

// Jobs
import { JobManagementScreen } from '../screens/company/JobManagementScreen';
import { JobCreateScreen } from '../screens/company/JobCreateScreen';
import { JobEditScreen } from '../screens/company/JobEditScreen';
import { CompanyJobDetailScreen } from '../screens/company/CompanyJobDetailsScreen';
import { EmployerApplicationDetailScreen } from '../screens/company/EmployerApplicationDetailScreen';
import { EmployerApplicationsScreen } from '../screens/company/EmployerApplicationListScreen';

// Products
import { CompanyProductListScreen } from '../screens/company/CompanyProductListScreen';
import { CompanyProductDetailsScreen } from '../screens/company/CompanyProductDetailsScreen';
import { CreateProductScreen } from '../screens/company/CreateProductScreen';

// Freelancer marketplace
import { FreelancerMarketplaceScreen } from '../screens/freelancer/FreelancerMarketplaceScreen';
import { FreelancerDetailScreen } from '../screens/freelancer/FreelancerDetailScreen';
import { FreelancerShortlistScreen } from '../screens/freelancer/FreelancerShortlistScreen';

// Shared
import { VerificationStatusScreen } from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen } from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen } from '../screens/shared/ReferralScreen';
import { CompanyProfileSetupScreen } from '../screens/shared/ProfileSetupScreen';

// Product marketplace
import { ProductMarketplaceScreen } from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen } from '../screens/products/ProductDetailsScreen';
import { SavedProductsScreen } from '../screens/products/SavedProductsScreen';

// Tenders root
import TendersNavigator from './TendersNavigator';

// Gate hook
import { useCompanyProfileGate } from '../hooks/useProfileGate';
import RoleVerificationScreen from '../screens/shared/RoleVerificationScreen';

// Settings
import { PrivacySecurityScreen } from '../screens/settings/PrivacySecurityScreen';
import { HelpFAQScreen } from '../screens/settings/HelpFAQScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { NotificationPreferencesScreen } from '../screens/NotificationPreferencesScreen';
import { ContactUsScreen } from '../screens/settings/ContactUsScreen';
import { TermsPrivacyScreen } from '../screens/settings/TermsPrivacyScreen';

// ─────────────────────────────────────────────────────────────────────────────
//  Param list
// ─────────────────────────────────────────────────────────────────────────────

export type CompanyStackParamList = {
  // Core
  CompanyGate: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined;
  EditProfile: undefined;
  RoleVerification: undefined;

  // Jobs
  CompanyJobList: undefined;
  CreateJob: undefined;
  JobEdit: { jobId: string };
  JobDetail: { jobId: string };
  ApplicantManager: { jobId: string; jobTitle: string };
  ApplicantDetail: { applicationId: string; jobTitle: string };
  ApplicationList: { jobId: string; jobTitle: string };
  ApplicationDetail: { applicationId: string };

  // Products
  CompanyProductList: undefined;
  CompanyProductDetails: { productId: string };
  CreateProduct: undefined;
  EditProduct: { productId: string };

  // Freelancer marketplace
  FreelancerMarketplace: undefined;
  FreelancerDetail: { freelancerId: string };
  FreelancerShortlist: undefined;

  // Verification / referral
  VerificationStatus: undefined;
  RequestVerification: undefined;
  Referral: undefined;
  Leaderboard: undefined;

  // Product marketplace
  ProductMarketplace: undefined;
  ProductDetails: { productId: string };
  SavedProducts: undefined;

  // Notifications & settings
  Notifications: undefined;
  NotificationPreferences: undefined;
  PrivacySecurity: undefined;
  HelpFAQ: undefined;
  ContactUs: undefined;
  TermsPrivacy: undefined;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Navigator instances
// ─────────────────────────────────────────────────────────────────────────────

const MainTab = createBottomTabNavigator<CompanyMainTabParamList>();
const JobsTopTab = createMaterialTopTabNavigator<CompanyJobsTabParamList>();
const ProfileTopTab = createMaterialTopTabNavigator<CompanyProfileTabParamList>();
const Stack = createNativeStackNavigator<CompanyStackParamList>();

// ─────────────────────────────────────────────────────────────────────────────
//  Gate screen
// ─────────────────────────────────────────────────────────────────────────────

function CompanyGateScreen() {
  const navigation = useNavigation<any>();
  const { hasProfile, isLoading } = useCompanyProfileGate();

  useEffect(() => {
    if (!isLoading) {
      navigation.replace(hasProfile ? 'MainTabs' : 'ProfileSetup');
    }
  }, [isLoading, hasProfile, navigation]);

  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Top-tab style helpers
// ─────────────────────────────────────────────────────────────────────────────

function companyTopTabOpts(isDark: boolean) {
  return {
    tabBarActiveTintColor: isDark ? '#34D399' : '#059669',
    tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
    tabBarIndicatorStyle: { backgroundColor: isDark ? '#34D399' : '#059669', height: 3, borderRadius: 2 },
    tabBarStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', elevation: 0, shadowOpacity: 0, paddingTop: 0 },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '700' as const, textTransform: 'none' as const },
  };
}

function companyProfileTopTabOpts(isDark: boolean) {
  return {
    tabBarActiveTintColor: isDark ? '#FDBA74' : '#EA580C',
    tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
    tabBarIndicatorStyle: { backgroundColor: isDark ? '#FDBA74' : '#EA580C', height: 3, borderRadius: 2 },
    tabBarStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', elevation: 0, shadowOpacity: 0, paddingTop: 0 },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '700' as const, textTransform: 'none' as const },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-navigators
// ─────────────────────────────────────────────────────────────────────────────

function CompanyJobsNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }} edges={['top']}>
      <JobsTopTab.Navigator screenOptions={companyTopTabOpts(isDark)}>
        <JobsTopTab.Screen name="JobsList"        component={JobManagementScreen}      options={{ title: 'My Jobs' }} />
        <JobsTopTab.Screen name="CreateJob"       component={JobCreateScreen}          options={{ title: 'Post Job' }} />
        <JobsTopTab.Screen name="JobApplications" component={EmployerApplicationsScreen} options={{ title: 'Applications' }} />
      </JobsTopTab.Navigator>
    </SafeAreaView>
  );
}

function CompanyProfileNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }} edges={['top']}>
      <ProfileTopTab.Navigator screenOptions={companyProfileTopTabOpts(isDark)}>
        <ProfileTopTab.Screen name="CompanyProfile"       component={CompanyProfileScreen}      options={{ title: 'Profile' }} />
        <ProfileTopTab.Screen name="Products"             component={CompanyProductListScreen}  options={{ title: 'Products' }} />
        <ProfileTopTab.Screen name="FreelanceMarketplace" component={FreelancerMarketplaceScreen} options={{ title: 'Marketplace' }} />
      </ProfileTopTab.Navigator>
    </SafeAreaView>
  );
}

function CompanyTabNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const insets = useSafeAreaInsets();

  return (
    <MainTab.Navigator
      tabBar={({ state, navigation }) => {
        const currentRoute = state.routes[state.index]?.name;
        if (currentRoute === 'Social' || currentRoute === 'Tenders') return null;
        return (
          <SimpleRoleTabBar
            routes={state.routes}
            activeIndex={state.index}
            meta={COMPANY_TAB_META}
            onPress={(name, key, focused) => {
              const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(name);
            }}
          />
        );
      }}
      screenOptions={{ headerShown: false, tabBarStyle: { height: getSimpleTabBarHeight(insets) } }}
    >
      <MainTab.Screen name="Home"    component={CompanyDashboardScreen} />
      <MainTab.Screen name="Jobs"    component={CompanyJobsNavigator} />
      <MainTab.Screen name="Social"  component={SocialEntry} />
      <MainTab.Screen name="Tenders" component={() => <TendersNavigator userRole="company" />} />
      <MainTab.Screen name="Profile" component={CompanyProfileNavigator} />
      <MainTab.Screen name="More"    component={CompanyMoreScreen} />
    </MainTab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Root stack
// ─────────────────────────────────────────────────────────────────────────────

export default function CompanyNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);

  return (
    <Stack.Navigator
      initialRouteName="CompanyGate"
      screenOptions={{ headerShown: false, contentStyle: { paddingTop: 0 } }}
    >
      {/* Core */}
      <Stack.Screen name="CompanyGate"   component={CompanyGateScreen} />
      <Stack.Screen name="ProfileSetup"  component={CompanyProfileSetupScreen} />
      <Stack.Screen name="MainTabs"      component={CompanyTabNavigator} />
      <Stack.Screen name="EditProfile"   component={CompanyEditProfileScreen} />
      <Stack.Screen name="RoleVerification" component={RoleVerificationScreen} />

      {/* Jobs */}
      <Stack.Screen name="CompanyJobList"    component={JobManagementScreen} />
      <Stack.Screen name="CreateJob"         component={JobCreateScreen} />
      <Stack.Screen name="JobEdit"           component={JobEditScreen} />
      <Stack.Screen name="JobDetail"         component={CompanyJobDetailScreen} />
      <Stack.Screen name="ApplicationList"   component={EmployerApplicationsScreen} />
      <Stack.Screen name="ApplicationDetail" component={EmployerApplicationDetailScreen} />

      {/* Products */}
      <Stack.Screen name="CompanyProductList"    component={CompanyProductListScreen} />
      <Stack.Screen name="CompanyProductDetails" component={CompanyProductDetailsScreen} />
      <Stack.Screen name="CreateProduct"         component={CreateProductScreen} />
      <Stack.Screen name="EditProduct"           component={CompanyEditProfileScreen} />

      {/* Freelancer marketplace */}
      <Stack.Screen name="FreelancerMarketplace" component={FreelancerMarketplaceScreen} />
      <Stack.Screen name="FreelancerDetail"      component={FreelancerDetailScreen} />
      <Stack.Screen name="FreelancerShortlist"   component={FreelancerShortlistScreen} />

      {/* Verification / referral */}
      <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen} />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
      <Stack.Screen name="Referral"            component={ReferralScreen} />
      <Stack.Screen name="Leaderboard"         component={PlaceholderScreen} />

      {/* Product marketplace */}
      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
      <Stack.Screen name="ProductDetails"     component={ProductDetailsScreen} />
      <Stack.Screen name="SavedProducts"      component={SavedProductsScreen} />

      {/* Notifications */}
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Notifications',
          headerTintColor: isDark ? '#FFFFFF' : '#0A2540',
          headerStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{
          headerShown: true,
          headerTitle: 'Notification Settings',
          headerTintColor: isDark ? '#FFFFFF' : '#0A2540',
          headerStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
        }}
      />

      {/* Settings */}
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HelpFAQ"         component={HelpFAQScreen}         options={{ headerShown: false }} />
      <Stack.Screen name="ContactUs"       component={ContactUsScreen}       options={{ headerShown: false }} />
      <Stack.Screen name="TermsPrivacy"    component={TermsPrivacyScreen}    options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}