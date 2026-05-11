// src/navigation/CandidateNavigator.tsx
/**
 * src/navigation/CandidateNavigator.tsx
 * Role: Candidate — 5 main tabs + full stack navigator.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../store/themeStore';
import { SimpleRoleTabBar } from './SimpleRoleTabBar';
import { CANDIDATE_TAB_META } from './roleAccents';
import type { CandidateMainTabParamList, CandidateJobsTabParamList } from './types';

import SocialEntry from '../social/navigation/SocialEntry';
import { CandidateDashboardScreen } from '../screens/candidate/Dashboardscreen';
import { CandidateProfileScreen } from '../screens/candidate/ProfileScreen';
import { CandidateEditProfileScreen } from '../screens/candidate/EditProfileScreen';
import { JobBrowseScreen } from '../screens/candidate/JobBrowseScreen';
import { JobDetailScreen } from '../screens/candidate/JobDetailScreen';
import { ApplyJobScreen } from '../screens/candidate/ApplyJobScreen';
import { SavedJobsScreen } from '../screens/candidate/SavedJobsScreen';
import { ApplicationTracker } from '../screens/candidate/ApplicationTracker';
import { ApplicationDetailScreen } from '../screens/candidate/ApplicationDetailsScreen';
import { CandidateMoreScreen } from '../screens/candidate/MoreScreen';
import { CvTemplatesScreen } from '../screens/candidate/cv-generator/CvTemplatesScreen';
import { CvPreviewScreen } from '../screens/candidate/cv-generator/CvPreviewScreen';
import { GeneratedCVsScreen } from '../screens/candidate/cv-generator/GeneratedCVsScreen';
import { VerificationStatusScreen } from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen } from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen } from '../screens/shared/ReferralScreen';
import { LeaderboardScreen } from '../screens/shared/LeaderboardScreen';
import { ProductMarketplaceScreen } from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen } from '../screens/products/ProductDetailsScreen';
import RoleVerificationScreen from '../screens/shared/RoleVerificationScreen';

export type CandidateStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  JobDetail: { jobId: string };
  ApplyJob: { jobId: string; jobTitle: string };
  ApplicationDetail: { applicationId: string };
  CvTemplates: undefined;
  CvPreview: { templateId: string; templateName: string; regenerateCvId?: string };
  GeneratedCVs: undefined;
  VerificationStatus: undefined;
  RequestVerification: undefined;
  RoleVerification: undefined;
  Referral: undefined;
  Leaderboard: undefined;
  ProductMarketplace: undefined;
  ProductDetails: { productId: string };
};

const MainTab = createBottomTabNavigator<CandidateMainTabParamList>();
const JobsTopTab = createMaterialTopTabNavigator<CandidateJobsTabParamList>();
const Stack = createNativeStackNavigator<CandidateStackParamList>();

function CandidateJobsNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const primary = isDark ? '#34D399' : '#059669';
  const muted = isDark ? '#64748B' : '#94A3B8';
  const surface = isDark ? '#1E293B' : '#FFFFFF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface }}>
      <JobsTopTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: primary,
          tabBarInactiveTintColor: muted,
          tabBarIndicatorStyle: { backgroundColor: primary, height: 3, borderRadius: 2 },
          tabBarStyle: { backgroundColor: surface, elevation: 0, shadowOpacity: 0 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '700', textTransform: 'none' },
        }}
      >
        <JobsTopTab.Screen name="JobsList" component={JobBrowseScreen} options={{ title: 'Browse' }} />
        <JobsTopTab.Screen name="SavedJobs" component={SavedJobsScreen} options={{ title: 'Saved' }} />
        <JobsTopTab.Screen name="Applications" component={ApplicationTracker} options={{ title: 'Applied' }} />
      </JobsTopTab.Navigator>
    </SafeAreaView>
  );
}

function CandidateTabNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);

  return (
    <MainTab.Navigator
      tabBar={({ state, navigation }) => {
        const currentRoute = state.routes[state.index]?.name;
        if (currentRoute === 'Social') return null;

        return (
          <SimpleRoleTabBar
            routes={state.routes}
            activeIndex={state.index}
            meta={CANDIDATE_TAB_META}
            onPress={(name, key, focused) => {
              const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(name);
            }}
          />
        );
      }}
      screenOptions={{ headerShown: false }}
    >
      <MainTab.Screen name="Home" component={CandidateDashboardScreen} />
      <MainTab.Screen name="Jobs" component={CandidateJobsNavigator} />
      <MainTab.Screen name="Social" component={SocialEntry} />
      <MainTab.Screen name="Profile" component={CandidateProfileScreen} />
      <MainTab.Screen name="More" component={CandidateMoreScreen} />
    </MainTab.Navigator>
  );
}

export default function CandidateNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={CandidateTabNavigator} />
      <Stack.Screen name="EditProfile" component={CandidateEditProfileScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="ApplyJob" component={ApplyJobScreen} />
      <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
      <Stack.Screen name="CvTemplates" component={CvTemplatesScreen} />
      <Stack.Screen name="CvPreview" component={CvPreviewScreen} />
      <Stack.Screen name="GeneratedCVs" component={GeneratedCVsScreen} />
      <Stack.Screen name="RoleVerification" component={RoleVerificationScreen} />
      <Stack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </Stack.Navigator>
  );
}