/**
 * navigation/CandidateNavigator.tsx
 * Role: Candidate — 5 main tabs + full stack navigator.
 * Uses shared PillTabBar — zero react-native-reanimated.
 */

import React from 'react';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';

import { useThemeStore }                 from '../store/themeStore';
import { PillTabBar, PillTabMeta }       from './PillTabBar';
import {
  CandidateMainTabParamList,
  CandidateJobsTabParamList,
} from './types';

import SocialEntry                       from '../social/navigation/SocialEntry';
import { CandidateDashboardScreen }      from '../screens/candidate/Dashboardscreen';
import { CandidateProfileScreen }        from '../screens/candidate/ProfileScreen';
import { CandidateEditProfileScreen }    from '../screens/candidate/EditProfileScreen';
import { JobBrowseScreen }               from '../screens/candidate/JobBrowseScreen';
import { JobDetailScreen }               from '../screens/candidate/JobDetailScreen';
import { ApplyJobScreen }                from '../screens/candidate/ApplyJobScreen';
import { SavedJobsScreen }               from '../screens/candidate/SavedJobsScreen';
import { ApplicationTracker }            from '../screens/candidate/ApplicationTracker';
import { ApplicationDetailScreen }       from '../screens/candidate/ApplicationDetailsScreen';
import { CandidateMoreScreen }           from '../screens/candidate/MoreScreen';
import { CvTemplatesScreen }             from '../screens/candidate/cv-generator/CvTemplatesScreen';
import { CvPreviewScreen }               from '../screens/candidate/cv-generator/CvPreviewScreen';
import { GeneratedCVsScreen }            from '../screens/candidate/cv-generator/GeneratedCVsScreen';
import { VerificationStatusScreen }      from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }     from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen }                from '../screens/shared/ReferralScreen';
import { LeaderboardScreen }             from '../screens/shared/LeaderboardScreen';
import { ProductMarketplaceScreen }      from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }          from '../screens/products/ProductDetailsScreen';

// ─── Param lists ──────────────────────────────────────────────────────────────
export type CandidateStackParamList = {
  MainTabs:            undefined;
  Profile:             undefined;
  EditProfile:         undefined;
  JobList:             undefined;
  JobDetail:           { jobId: string };
  ApplyJob:            { jobId: string; jobTitle: string };
  SavedJobs:           undefined;
  ApplicationList:     undefined;
  ApplicationDetail:   { applicationId: string };
  CvTemplates:         undefined;
  CvPreview:           { templateId: string; templateName: string; regenerateCvId?: string };
  GeneratedCVs:        undefined;
  VerificationStatus:  undefined;
  RequestVerification: undefined;
  Referral:            undefined;
  Leaderboard:         undefined;
  ProductMarketplace:  undefined;
  ProductDetails:      { productId: string };
};

const MainTab    = createBottomTabNavigator<CandidateMainTabParamList>();
const JobsTopTab = createMaterialTopTabNavigator<CandidateJobsTabParamList>();
const Stack      = createNativeStackNavigator<CandidateStackParamList>();

// ─── Tab metadata ─────────────────────────────────────────────────────────────
const CANDIDATE_META: Record<string, PillTabMeta> = {
  Home:    { icon: 'home-outline',      iconActive: 'home',      label: 'Home',    accentDark: '#60A5FA', accentLight: '#2563EB' },
  Jobs:    { icon: 'briefcase-outline', iconActive: 'briefcase', label: 'Jobs',    accentDark: '#34D399', accentLight: '#059669' },
  Social:  { icon: 'globe-outline',     iconActive: 'globe',     label: 'Social',  accentDark: '#D8B4FE', accentLight: '#7C3AED' },
  Profile: { icon: 'person-outline',    iconActive: 'person',    label: 'Profile', accentDark: '#F1BB03', accentLight: '#B45309' },
  More:    { icon: 'grid-outline',      iconActive: 'grid',      label: 'More',    accentDark: '#94A3B8', accentLight: '#64748B' },
};

// ─── Jobs top-tab ─────────────────────────────────────────────────────────────
function CandidateJobsNavigator() {
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
      <JobsTopTab.Screen name="JobsList"     component={JobBrowseScreen}    options={{ title: 'Browse' }} />
      <JobsTopTab.Screen name="SavedJobs"    component={SavedJobsScreen}    options={{ title: 'Saved' }} />
      <JobsTopTab.Screen name="Applications" component={ApplicationTracker} options={{ title: 'Applied' }} />
    </JobsTopTab.Navigator>
  );
}

// Note: Social tab now uses SocialEntry instead of SocialNavigator
function CandidateSocialTab() {
  return <SocialEntry />;
}

// ─── Main tab navigator ───────────────────────────────────────────────────────
function CandidateTabNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);

  return (
    <MainTab.Navigator
      tabBar={({ state, navigation }) => (
        <PillTabBar
          routes={state.routes}
          activeIndex={state.index}
          isDark={isDark}
          meta={CANDIDATE_META}
          onPress={(name, key, focused) => {
            const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(name);
          }}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <MainTab.Screen name="Home"    component={CandidateDashboardScreen} />
      <MainTab.Screen name="Jobs"    component={CandidateJobsNavigator}   />
      <MainTab.Screen name="Social"  component={CandidateSocialTab}       />
      <MainTab.Screen name="Profile" component={CandidateProfileScreen}   />
      <MainTab.Screen name="More"    component={CandidateMoreScreen}      />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────────────────────
export default function CandidateNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs"            component={CandidateTabNavigator}    />
      <Stack.Screen name="EditProfile"         component={CandidateEditProfileScreen} />
      <Stack.Screen name="JobDetail"           component={JobDetailScreen}           />
      <Stack.Screen name="ApplyJob"            component={ApplyJobScreen}            />
      <Stack.Screen name="ApplicationDetail"   component={ApplicationDetailScreen}   />
      <Stack.Screen name="CvTemplates"         component={CvTemplatesScreen}         />
      <Stack.Screen name="CvPreview"           component={CvPreviewScreen}           />
      <Stack.Screen name="GeneratedCVs"        component={GeneratedCVsScreen}        />
      <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen}  />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
      <Stack.Screen name="Referral"            component={ReferralScreen}            />
      <Stack.Screen name="Leaderboard"         component={LeaderboardScreen}         />
      <Stack.Screen name="ProductMarketplace"  component={ProductMarketplaceScreen}  />
      <Stack.Screen name="ProductDetails"      component={ProductDetailsScreen}      />
    </Stack.Navigator>
  );
}