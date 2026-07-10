// src/navigation/CandidateNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

import { NotificationsScreen } from '../screens/NotificationsScreen';
import { NotificationPreferencesScreen } from '../screens/NotificationPreferencesScreen';

import { PrivacySecurityScreen } from '../screens/settings/PrivacySecurityScreen';
import { HelpFAQScreen } from '../screens/settings/HelpFAQScreen';
import JobsNearMeScreen from '../screens/candidate/JobsNearMeScreen';

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
  Notifications: undefined;
  NotificationPreferences: undefined;
  PrivacySecurity: undefined;
  HelpFAQ: undefined;
  ContactUs: undefined;
  TermsPrivacy: undefined;
};

const MainTab = createBottomTabNavigator<CandidateMainTabParamList>();
const JobsTopTab = createMaterialTopTabNavigator<CandidateJobsTabParamList>();
const Stack = createNativeStackNavigator<CandidateStackParamList>();

// 🎯 FIXED: Removed SafeAreaView wrapper - screens handle their own safe area
// This prevents double spacing
function CandidateJobsNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  
  const primary = isDark ? '#34D399' : '#059669';
  const muted = isDark ? '#64748B' : '#94A3B8';
  const surface = isDark ? '#1E293B' : '#FFFFFF';

  const tabIcons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
    JobsList: { active: 'briefcase', inactive: 'briefcase-outline' },
    SavedJobs: { active: 'bookmark', inactive: 'bookmark-outline' },
    NearMeJobs: { active: 'location', inactive: 'location-outline' },
    Applications: { active: 'document-text', inactive: 'document-text-outline' },
  };

  return (
    <View style={{ flex: 1, backgroundColor: surface }}>
      <JobsTopTab.Navigator
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: primary,
          tabBarInactiveTintColor: muted,
          tabBarIndicatorStyle: { 
            backgroundColor: primary, 
            height: 3, 
            borderRadius: 2 
          },
          tabBarStyle: { 
            backgroundColor: surface, 
            elevation: 0, 
            shadowOpacity: 0,
            borderBottomWidth: 0,
            // 🎯 FIXED: Ensure tab bar doesn't have extra padding
            paddingTop: 0,
          },
          tabBarShowLabel: false,
          tabBarIcon: ({ focused, color }) => {
            const icons = tabIcons[route.name];
            const iconName = focused ? icons.active : icons.inactive;
            return <Ionicons name={iconName} size={22} color={color} />;
          },
          tabBarItemStyle: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
          },
          tabBarPressColor: isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(5, 150, 105, 0.1)',
          tabBarAndroidRipple: { 
            borderless: true, 
            color: isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(5, 150, 105, 0.1)' 
          },
          // 🎯 FIXED: Explicitly set content container style
          tabBarContentContainerStyle: {
            height: 50,
          },
        })}
      >
        <JobsTopTab.Screen 
          name="JobsList" 
          component={JobBrowseScreen} 
        />
        <JobsTopTab.Screen 
          name="SavedJobs" 
          component={SavedJobsScreen} 
        />
        <JobsTopTab.Screen 
          name="NearMeJobs" 
          component={JobsNearMeScreen} 
        />
        <JobsTopTab.Screen 
          name="Applications" 
          component={ApplicationTracker} 
        />
      </JobsTopTab.Navigator>
    </View>
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
      screenOptions={{ 
        headerShown: false,
      }}
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
  const isDark = useThemeStore((s) => s.theme.isDark);

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { paddingTop: 0 },
      }}
    >
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

        <Stack.Screen
          name="PrivacySecurity"
          component={PrivacySecurityScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HelpFAQ"
          component={HelpFAQScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
  );
}