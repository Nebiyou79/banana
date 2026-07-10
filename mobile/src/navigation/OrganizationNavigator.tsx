// src/navigation/OrganizationNavigator.tsx
// ─────────────────────────────────────────────────────────────────────────────
// UPDATED: OrganizationStackParamList extended with org-bid screens
// (OrgBidsDashboard, OrgIncomingBids, OrgBidDetail) and the full set of
// tender proposal screens. TendersNavigator is passed userRole="organization".
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
import { ORGANIZATION_TAB_META } from './roleAccents';
import type {
  OrganizationMainTabParamList,
  OrganizationJobsTabParamList,
  OrganizationProfileTabParamList,
} from './types';

import TendersNavigator from './TendersNavigator';
import { SocialEntry } from '../social/navigation';

// Jobs
import { OrgJobsScreen } from '../screens/organization/OrgJobsScreen';
import { OrgJobCreateScreen } from '../screens/organization/OrgJobCreateScreen';
import { OrgJobEditScreen } from '../screens/organization/OrgJobEditScreen';
import { OrgJobDetail } from '../screens/organization/OrgJobDetail';
import { EmployerApplicationsScreen } from '../screens/company/EmployerApplicationListScreen';
import { EmployerApplicationDetailScreen } from '../screens/company/EmployerApplicationDetailScreen';

// Profiles
import { OrganizationProfileScreen } from '../screens/organization/ProfileScreen';
import { OrganizationEditProfileScreen } from '../screens/organization/EditProfileScreen';
import { OrganizationProfileSetupScreen } from '../screens/shared/ProfileSetupScreen';
import { OrganizationDashboardScreen } from '../screens/organization/DashboardScreen';
import OrganizationMoreScreen from '../screens/organization/MoreScreen';

// Freelancer marketplace
import { FreelancerMarketplaceScreen } from '../screens/freelancer/FreelancerMarketplaceScreen';
import { FreelancerDetailScreen } from '../screens/freelancer/FreelancerDetailScreen';
import { FreelancerShortlistScreen } from '../screens/freelancer/FreelancerShortlistScreen';

// Shared
import { VerificationStatusScreen } from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen } from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen } from '../screens/shared/ReferralScreen';
import LeaderboardScreen from '../screens/shared/LeaderboardScreen';
import RoleVerificationScreen from '../screens/shared/RoleVerificationScreen';

// Product marketplace
import { ProductMarketplaceScreen } from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen } from '../screens/products/ProductDetailsScreen';

// Org proposal screens (from organization/proposals barrel)
import {
  OrgTenderProposalsScreen,
  OrgProposalDetailScreen,
  OrgProposalStatsScreen,
} from '../screens/organization/proposals';

// Org-specific bid screens
import { OrgBidDetailScreen } from '../screens/organization/bids/OrgBidDetailScreen';
import { OrgBidsDashboardScreen } from '../screens/organization/bids/OrgBidsDashboardScreen';
// OrgIncomingBidsScreen file is currently empty — fall back to IncomingBidsScreen
import { IncomingBidsScreen as OrgIncomingBidsScreen } from '../screens/company/bids/IncomingBidsScreen';

// Gate
import { useOrganizationProfileGate } from '../hooks/useProfileGate';

// Notifications & settings
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { NotificationPreferencesScreen } from '../screens/NotificationPreferencesScreen';
import { PrivacySecurityScreen } from '../screens/settings/PrivacySecurityScreen';
import { HelpFAQScreen } from '../screens/settings/HelpFAQScreen';
import { ContactUsScreen } from '../screens/settings/ContactUsScreen';
import { TermsPrivacyScreen } from '../screens/settings/TermsPrivacyScreen';

// ─────────────────────────────────────────────────────────────────────────────
//  Param list
// ─────────────────────────────────────────────────────────────────────────────

export type OrganizationStackParamList = {
  // Core
  OrganizationGate: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined;
  OrgProfile: undefined;
  EditProfile: undefined;
  RoleVerification: undefined;

  // Jobs
  OrgJobList: undefined;
  OrgJobCreate: undefined;
  OrgJobEdit: { jobId: string };
  OrgJobDetail: { jobId: string };
  OrgApplicants: { jobId: string; jobTitle: string };
  ApplicationList: { jobId: string; jobTitle: string };
  ApplicationDetail: { applicationId: string };

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

  // Proposal screens (pushed from Tenders or Organisation-specific screens)
  TenderProposals: { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
  ProposalDetail: { proposalId: string; tenderId: string; role: 'company' | 'organization' };
  ProposalStats: { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };

  // Org bid screens (accessible from root stack for deep links / dashboard shortcuts)
  OrgBidsDashboard: undefined;
  OrgIncomingBids: { tenderId: string };
  OrgBidDetail: { bidId: string; tenderId: string };

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

const MainTab = createBottomTabNavigator<OrganizationMainTabParamList>();
const JobsTopTab = createMaterialTopTabNavigator<OrganizationJobsTabParamList>();
const ProfileTopTab = createMaterialTopTabNavigator<OrganizationProfileTabParamList>();
const Stack = createNativeStackNavigator<OrganizationStackParamList>();

// ─────────────────────────────────────────────────────────────────────────────
//  Gate screen
// ─────────────────────────────────────────────────────────────────────────────

function OrganizationGateScreen() {
  const navigation = useNavigation<any>();
  const { hasProfile, isLoading } = useOrganizationProfileGate();

  useEffect(() => {
    if (!isLoading) {
      navigation.replace(hasProfile ? 'MainTabs' : 'ProfileSetup');
    }
  }, [isLoading, hasProfile, navigation]);

  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#8B5CF6" />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Top-tab style helper
// ─────────────────────────────────────────────────────────────────────────────

function orgTopTabOpts(isDark: boolean) {
  return {
    tabBarActiveTintColor: isDark ? '#FB923C' : '#EA580C',
    tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
    tabBarIndicatorStyle: { backgroundColor: isDark ? '#FB923C' : '#EA580C', height: 3, borderRadius: 2 },
    tabBarStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', elevation: 0, shadowOpacity: 0 },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '700' as const, textTransform: 'none' as const },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-navigators
// ─────────────────────────────────────────────────────────────────────────────

function OrganizationJobsNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }}>
      <JobsTopTab.Navigator screenOptions={orgTopTabOpts(isDark)}>
        <JobsTopTab.Screen name="JobsList"        component={OrgJobsScreen}             options={{ title: 'Opportunities' }} />
        <JobsTopTab.Screen name="CreateJob"       component={OrgJobCreateScreen}        options={{ title: 'Post' }} />
        <JobsTopTab.Screen name="JobApplications" component={EmployerApplicationsScreen} options={{ title: 'Applications' }} />
      </JobsTopTab.Navigator>
    </SafeAreaView>
  );
}

function OrganizationProfileNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }}>
      <ProfileTopTab.Navigator screenOptions={orgTopTabOpts(isDark)}>
        <ProfileTopTab.Screen name="OrganizationProfile"  component={OrganizationProfileScreen}   options={{ title: 'Profile' }} />
        <ProfileTopTab.Screen name="FreelanceMarketplace" component={FreelancerMarketplaceScreen} options={{ title: 'Marketplace' }} />
      </ProfileTopTab.Navigator>
    </SafeAreaView>
  );
}

function OrganizationTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <MainTab.Navigator
      tabBar={({ state, navigation }) => {
        const currentRoute = state.routes[state.index]?.name;
        if (currentRoute === 'Tenders') return null;
        return (
          <SimpleRoleTabBar
            routes={state.routes}
            activeIndex={state.index}
            meta={ORGANIZATION_TAB_META}
            onPress={(name, key, focused) => {
              const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(name);
            }}
          />
        );
      }}
      screenOptions={{ headerShown: false, tabBarStyle: { height: getSimpleTabBarHeight(insets) } }}
    >
      <MainTab.Screen name="Home"    component={OrganizationDashboardScreen} />
      <MainTab.Screen name="Jobs"    component={OrganizationJobsNavigator} />
      <MainTab.Screen name="Tenders" component={() => <TendersNavigator userRole="organization" />} />
      <MainTab.Screen name="Social"  component={SocialEntry} />
      <MainTab.Screen name="Profile" component={OrganizationProfileNavigator} />
      <MainTab.Screen name="More"    component={OrganizationMoreScreen} />
    </MainTab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Root stack
// ─────────────────────────────────────────────────────────────────────────────

export default function OrganizationNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);

  return (
    <Stack.Navigator initialRouteName="OrganizationGate" screenOptions={{ headerShown: false }}>
      {/* Core */}
      <Stack.Screen name="OrganizationGate" component={OrganizationGateScreen} />
      <Stack.Screen name="ProfileSetup"     component={OrganizationProfileSetupScreen} />
      <Stack.Screen name="MainTabs"         component={OrganizationTabNavigator} />
      <Stack.Screen name="EditProfile"      component={OrganizationEditProfileScreen} />
      <Stack.Screen name="RoleVerification" component={RoleVerificationScreen} />

      {/* Jobs */}
      <Stack.Screen name="OrgJobList"        component={OrgJobsScreen} />
      <Stack.Screen name="OrgJobCreate"      component={OrgJobCreateScreen} />
      <Stack.Screen name="OrgJobEdit"        component={OrgJobEditScreen} />
      <Stack.Screen name="OrgJobDetail"      component={OrgJobDetail} />
      <Stack.Screen name="OrgApplicants"     component={EmployerApplicationsScreen} />
      <Stack.Screen name="ApplicationList"   component={EmployerApplicationsScreen} />
      <Stack.Screen name="ApplicationDetail" component={EmployerApplicationDetailScreen} />

      {/* Freelancer marketplace */}
      <Stack.Screen name="FreelancerMarketplace" component={FreelancerMarketplaceScreen} />
      <Stack.Screen name="FreelancerDetail"      component={FreelancerDetailScreen} />
      <Stack.Screen name="FreelancerShortlist"   component={FreelancerShortlistScreen} />

      {/* Verification / referral */}
      <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen} />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
      <Stack.Screen name="Referral"            component={ReferralScreen} />
      <Stack.Screen name="Leaderboard"         component={LeaderboardScreen} />

      {/* Product marketplace */}
      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
      <Stack.Screen name="ProductDetails"     component={ProductDetailsScreen} />

      {/* Proposal screens – also accessible from Organisation-level shortcuts */}
      <Stack.Screen name="TenderProposals" component={OrgTenderProposalsScreen} options={{ headerShown: true, title: 'Proposals' }} />
      <Stack.Screen name="ProposalDetail"  component={OrgProposalDetailScreen}  options={{ headerShown: true, title: 'Proposal Detail' }} />
      <Stack.Screen name="ProposalStats"   component={OrgProposalStatsScreen}   options={{ headerShown: true, title: 'Statistics' }} />

      {/* Org bid screens */}
      <Stack.Screen name="OrgBidsDashboard" component={OrgBidsDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OrgIncomingBids"  component={OrgIncomingBidsScreen}  options={{ headerShown: true, title: 'Incoming Bids' }} />
      <Stack.Screen name="OrgBidDetail"     component={OrgBidDetailScreen}     options={{ headerShown: true, title: 'Bid Detail' }} />

      {/* Notifications */}
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, headerTitle: 'Notifications', headerTintColor: isDark ? '#FFFFFF' : '#0A2540', headerStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' } }}
      />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ headerShown: true, headerTitle: 'Notification Settings', headerTintColor: isDark ? '#FFFFFF' : '#0A2540', headerStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' } }}
      />

      {/* Settings */}
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HelpFAQ"         component={HelpFAQScreen}         options={{ headerShown: false }} />
      <Stack.Screen name="ContactUs"       component={ContactUsScreen}       options={{ headerShown: false }} />
      <Stack.Screen name="TermsPrivacy"    component={TermsPrivacyScreen}    options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}