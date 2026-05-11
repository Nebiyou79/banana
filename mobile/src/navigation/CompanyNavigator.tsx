// src/navigation/CompanyNavigator.tsx
/**
 * src/navigation/CompanyNavigator.tsx
 * Role: Company — 5 main tabs + full stack with gate screen.
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useThemeStore } from '../store/themeStore';
import { SimpleRoleTabBar } from './SimpleRoleTabBar';
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

// Tenders
import TendersNavigator from './TendersNavigator';

// Gate hook
import { useCompanyProfileGate } from '../hooks/useProfileGate';
import RoleVerificationScreen from '../screens/shared/RoleVerificationScreen';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type CompanyStackParamList = {
  CompanyGate: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined;
  EditProfile: undefined;
  CompanyJobList: undefined;
  CreateJob: undefined;
  JobEdit: { jobId: string };
  JobDetail: { jobId: string };
  RoleVerification: undefined;
  ApplicantManager: { jobId: string; jobTitle: string };
  ApplicantDetail: { applicationId: string; jobTitle: string };
  ApplicationList: { jobId: string; jobTitle: string };
  ApplicationDetail: { applicationId: string };
  CompanyProductList: undefined;
  CompanyProductDetails: { productId: string };
  CreateProduct: undefined;
  EditProduct: { productId: string };
  FreelancerMarketplace: undefined;
  FreelancerDetail: { freelancerId: string };
  FreelancerShortlist: undefined;
  VerificationStatus: undefined;
  RequestVerification: undefined;
  Referral: undefined;
  Leaderboard: undefined;
  ProductMarketplace: undefined;
  ProductDetails: { productId: string };
  SavedProducts: undefined;
};

// ─── Navigator factories ──────────────────────────────────────────────────────

const MainTab = createBottomTabNavigator<CompanyMainTabParamList>();
const JobsTopTab = createMaterialTopTabNavigator<CompanyJobsTabParamList>();
const ProfileTopTab = createMaterialTopTabNavigator<CompanyProfileTabParamList>();
const Stack = createNativeStackNavigator<CompanyStackParamList>();

// ─── Gate Screen ──────────────────────────────────────────────────────────────

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

// ─── Top-tab style helper ─────────────────────────────────────────────────────

function companyTopTabOpts(isDark: boolean) {
  return {
    tabBarActiveTintColor: isDark ? '#34D399' : '#059669',
    tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
    tabBarIndicatorStyle: { backgroundColor: isDark ? '#34D399' : '#059669', height: 3, borderRadius: 2 },
    tabBarStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', elevation: 0, shadowOpacity: 0 },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '700' as const, textTransform: 'none' as const },
  };
}

function companyProfileTopTabOpts(isDark: boolean) {
  return {
    tabBarActiveTintColor: isDark ? '#FDBA74' : '#EA580C',
    tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
    tabBarIndicatorStyle: { backgroundColor: isDark ? '#FDBA74' : '#EA580C', height: 3, borderRadius: 2 },
    tabBarStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', elevation: 0, shadowOpacity: 0 },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '700' as const, textTransform: 'none' as const },
  };
}

// ─── Jobs top-tab navigator ───────────────────────────────────────────────────

function CompanyJobsNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface }}>
      <JobsTopTab.Navigator screenOptions={companyTopTabOpts(isDark)}>
        <JobsTopTab.Screen name="JobsList" component={JobManagementScreen} options={{ title: 'My Jobs' }} />
        <JobsTopTab.Screen name="CreateJob" component={JobCreateScreen} options={{ title: 'Post Job' }} />
        <JobsTopTab.Screen name="JobApplications" component={EmployerApplicationsScreen} options={{ title: 'Applications' }} />
      </JobsTopTab.Navigator>
    </SafeAreaView>
  );
}

// ─── Profile top-tab navigator ────────────────────────────────────────────────

function CompanyProfileNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface }}>
      <ProfileTopTab.Navigator screenOptions={companyProfileTopTabOpts(isDark)}>
        <ProfileTopTab.Screen name="CompanyProfile" component={CompanyProfileScreen} options={{ title: 'Profile' }} />
        <ProfileTopTab.Screen name="Products" component={CompanyProductListScreen} options={{ title: 'Products' }} />
        <ProfileTopTab.Screen name="FreelanceMarketplace" component={FreelancerMarketplaceScreen} options={{ title: 'Marketplace' }} />
      </ProfileTopTab.Navigator>
    </SafeAreaView>
  );
}

// ─── Main tab bar ─────────────────────────────────────────────────────────────

function CompanyTabNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);

  return (
    <MainTab.Navigator
      tabBar={({ state, navigation }) => {
        const currentRoute = state.routes[state.index]?.name;
        // Hide the role tab bar when Social or Tenders is active
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
      screenOptions={{ headerShown: false }}
    >
      <MainTab.Screen name="Home" component={CompanyDashboardScreen} />
      <MainTab.Screen name="Jobs" component={CompanyJobsNavigator} />
      <MainTab.Screen name="Social" component={SocialEntry} />
      <MainTab.Screen name="Tenders" component={() => <TendersNavigator userRole="company" />} />
      <MainTab.Screen name="Profile" component={CompanyProfileNavigator} />
      <MainTab.Screen name="More" component={CompanyMoreScreen} />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────────────────────

export default function CompanyNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="CompanyGate"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="CompanyGate" component={CompanyGateScreen} />
      <Stack.Screen name="ProfileSetup" component={CompanyProfileSetupScreen} />
      <Stack.Screen name="MainTabs" component={CompanyTabNavigator} />
      <Stack.Screen name="EditProfile" component={CompanyEditProfileScreen} />
      <Stack.Screen name="CompanyJobList" component={JobManagementScreen} />
      <Stack.Screen name="CreateJob" component={JobCreateScreen} />
      <Stack.Screen name="JobEdit" component={JobEditScreen} />
      <Stack.Screen name="JobDetail" component={CompanyJobDetailScreen} />
      <Stack.Screen name="ApplicationList" component={EmployerApplicationsScreen} />
      <Stack.Screen name="ApplicationDetail" component={EmployerApplicationDetailScreen} />
      <Stack.Screen name="CompanyProductList" component={CompanyProductListScreen} />
      <Stack.Screen name="CompanyProductDetails" component={CompanyProductDetailsScreen} />
      <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
      <Stack.Screen name="RoleVerification" component={RoleVerificationScreen} />
      <Stack.Screen name="EditProduct" component={CompanyEditProfileScreen} />
      <Stack.Screen name="FreelancerMarketplace" component={FreelancerMarketplaceScreen} />
      <Stack.Screen name="FreelancerDetail" component={FreelancerDetailScreen} />
      <Stack.Screen name="FreelancerShortlist" component={FreelancerShortlistScreen} />
      <Stack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="Leaderboard" component={PlaceholderScreen} />
      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="SavedProducts" component={SavedProductsScreen} />
    </Stack.Navigator>
  );
}