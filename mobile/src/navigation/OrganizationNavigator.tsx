// src/navigation/OrganizationNavigator.tsx
/**
 * src/navigation/OrganizationNavigator.tsx
 * Role: Organization — 5 main tabs + full stack with gate screen.
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
import { ORGANIZATION_TAB_META } from './roleAccents';
import type {
  OrganizationMainTabParamList,
  OrganizationJobsTabParamList,
  OrganizationProfileTabParamList,
} from './types';

import TendersNavigator from './TendersNavigator';
import PlaceholderScreen from '../screens/auth/PlaceholderScreen';

import { OrgJobsScreen } from '../screens/organization/OrgJobsScreen';
import { OrgJobCreateScreen } from '../screens/organization/OrgJobCreateScreen';
import { FreelancerMarketplaceScreen } from '../screens/freelancer/FreelancerMarketplaceScreen';
import { FreelancerDetailScreen } from '../screens/freelancer/FreelancerDetailScreen';
import { FreelancerShortlistScreen } from '../screens/freelancer/FreelancerShortlistScreen';
import { VerificationStatusScreen } from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen } from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen } from '../screens/shared/ReferralScreen';
import { ProductMarketplaceScreen } from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen } from '../screens/products/ProductDetailsScreen';
import { EmployerApplicationsScreen } from '../screens/company/EmployerApplicationListScreen';
import { OrganizationProfileScreen } from '../screens/organization/ProfileScreen';
import { OrganizationProfileSetupScreen } from '../screens/shared/ProfileSetupScreen';

import {
  OrgTenderProposalsScreen,
  OrgProposalDetailScreen,
  OrgProposalStatsScreen,
} from '../screens/organization/proposals';

import { useOrganizationProfileGate } from '../hooks/useProfileGate';
import { OrganizationEditProfileScreen } from '../screens/organization/EditProfileScreen';
import { EmployerApplicationDetailScreen } from '../screens/company/EmployerApplicationDetailScreen';
import { OrgJobEditScreen } from '../screens/organization/OrgJobEditScreen';
import { OrgJobDetail } from '../screens/organization/OrgJobDetail';
import { ApplicantManager } from '../screens/company/ApplicantManager';
import LeaderboardScreen from '../screens/shared/LeaderboardScreen';
import OrganizationMoreScreen from '../screens/organization/MoreScreen';
import { SocialEntry } from '../social/navigation';
import RoleVerificationScreen from '../screens/shared/RoleVerificationScreen';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type OrganizationStackParamList = {
  OrganizationGate: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined;
  OrgProfile: undefined;
  EditProfile: undefined;
  OrgJobList: undefined;
  OrgJobCreate: undefined;
  OrgJobEdit: { jobId: string };
    RoleVerification: undefined;

  OrgJobDetail: { jobId: string };
  OrgApplicants: { jobId: string; jobTitle: string };
  ApplicationList: { jobId: string; jobTitle: string };
  ApplicationDetail: { applicationId: string };
  FreelancerMarketplace: undefined;
  FreelancerDetail: { freelancerId: string };
  FreelancerShortlist: undefined;
  VerificationStatus: undefined;
  RequestVerification: undefined;
  Referral: undefined;
  Leaderboard: undefined;
  ProductMarketplace: undefined;
  ProductDetails: { productId: string };
  TenderProposals: { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
  ProposalDetail: { proposalId: string; tenderId: string; role: 'company' | 'organization' };
  ProposalStats: { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
};

// ─── Navigator factories ──────────────────────────────────────────────────────

const MainTab = createBottomTabNavigator<OrganizationMainTabParamList>();
const JobsTopTab = createMaterialTopTabNavigator<OrganizationJobsTabParamList>();
const ProfileTopTab = createMaterialTopTabNavigator<OrganizationProfileTabParamList>();
const Stack = createNativeStackNavigator<OrganizationStackParamList>();

// ─── Gate Screen ──────────────────────────────────────────────────────────────

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

// ─── Top-tab style helper ─────────────────────────────────────────────────────

function orgTopTabOpts(isDark: boolean) {
  return {
    tabBarActiveTintColor: isDark ? '#FB923C' : '#EA580C',
    tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
    tabBarIndicatorStyle: { backgroundColor: isDark ? '#FB923C' : '#EA580C', height: 3, borderRadius: 2 },
    tabBarStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', elevation: 0, shadowOpacity: 0 },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '700' as const, textTransform: 'none' as const },
  };
}

// ─── Tenders wrapper ──────────────────────────────────────────────────────────

function OrganizationTendersTab() {
  return <TendersNavigator userRole="organization" />;
}

// ─── Jobs top-tab ─────────────────────────────────────────────────────────────

function OrganizationJobsNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface }}>
      <JobsTopTab.Navigator screenOptions={orgTopTabOpts(isDark)}>
        <JobsTopTab.Screen name="JobsList" component={OrgJobsScreen} options={{ title: 'Opportunities' }} />
        <JobsTopTab.Screen name="CreateJob" component={OrgJobCreateScreen} options={{ title: 'Post' }} />
        <JobsTopTab.Screen name="JobApplications" component={PlaceholderScreen} options={{ title: 'Applications' }} />
      </JobsTopTab.Navigator>
    </SafeAreaView>
  );
}

// ─── Profile top-tab ─────────────────────────────────────────────────────────

function OrganizationProfileNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface }}>
      <ProfileTopTab.Navigator screenOptions={orgTopTabOpts(isDark)}>
        <ProfileTopTab.Screen name="OrganizationProfile" component={OrganizationProfileScreen} options={{ title: 'Profile' }} />
        <ProfileTopTab.Screen name="FreelanceMarketplace" component={FreelancerMarketplaceScreen} options={{ title: 'Marketplace' }} />
      </ProfileTopTab.Navigator>
    </SafeAreaView>
  );
}

// ─── Main tab bar ─────────────────────────────────────────────────────────────

function OrganizationTabNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);

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
      screenOptions={{ headerShown: false }}
    >
      <MainTab.Screen name="Home" component={PlaceholderScreen} />
      <MainTab.Screen name="Jobs" component={OrganizationJobsNavigator} />
      <MainTab.Screen name="Tenders" component={OrganizationTendersTab} />
      <MainTab.Screen name="Social" component={SocialEntry} />
      <MainTab.Screen name="Profile" component={OrganizationProfileNavigator} />
      <MainTab.Screen name="More" component={OrganizationMoreScreen} />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────────────────────

export default function OrganizationNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="OrganizationGate"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="OrganizationGate" component={OrganizationGateScreen} />
      <Stack.Screen name="ProfileSetup" component={OrganizationProfileSetupScreen} />
      <Stack.Screen name="MainTabs" component={OrganizationTabNavigator} />
      <Stack.Screen name="EditProfile" component={OrganizationEditProfileScreen} />
      <Stack.Screen name="OrgJobList" component={OrgJobsScreen} />
      <Stack.Screen name="OrgJobCreate" component={OrgJobCreateScreen} />
      <Stack.Screen name="OrgJobEdit" component={OrgJobEditScreen} />
      <Stack.Screen name="OrgJobDetail" component={OrgJobDetail} />
      <Stack.Screen name="OrgApplicants" component={ApplicantManager} />
      <Stack.Screen name="ApplicationList" component={EmployerApplicationsScreen} />
      <Stack.Screen name="ApplicationDetail" component={EmployerApplicationDetailScreen} />
      <Stack.Screen name="FreelancerMarketplace" component={FreelancerMarketplaceScreen} />
      <Stack.Screen name="FreelancerDetail" component={FreelancerDetailScreen} />
      <Stack.Screen name="FreelancerShortlist" component={FreelancerShortlistScreen} />
      <Stack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
      <Stack.Screen name="RoleVerification" component={RoleVerificationScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="TenderProposals" component={OrgTenderProposalsScreen} options={{ headerShown: true, title: 'Proposals' }} />
      <Stack.Screen name="ProposalDetail" component={OrgProposalDetailScreen} options={{ headerShown: true, title: 'Proposal Detail' }} />
      <Stack.Screen name="ProposalStats" component={OrgProposalStatsScreen} options={{ headerShown: true, title: 'Statistics' }} />
    </Stack.Navigator>
  );
}