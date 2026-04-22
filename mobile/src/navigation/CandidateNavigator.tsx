/**
 * navigation/CandidateNavigator.tsx
 * Role: Candidate — 5 main tabs + full stack navigator.
 *
 * Updated: LeaderboardScreen is now a real screen (not PlaceholderScreen).
 * DashboardScreen import updated to new file name.
 */

import React from 'react';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';
import { Ionicons }                      from '@expo/vector-icons';
import { useThemeStore }                 from '../store/themeStore';

// ─── Types ────────────────────────────────────────────────────────────────────
import {
  CandidateMainTabParamList,
  CandidateJobsTabParamList,
} from './types';

// ─── Shared ───────────────────────────────────────────────────────────────────
import SocialNavigator from '../social/navigation/SocialNavigator';

// ─── Candidate screens ────────────────────────────────────────────────────────
import { CandidateDashboardScreen }   from '../screens/candidate/Dashboardscreen';
import { CandidateProfileScreen }     from '../screens/candidate/ProfileScreen';
import { CandidateEditProfileScreen } from '../screens/candidate/EditProfileScreen';
import { JobBrowseScreen }            from '../screens/candidate/JobBrowseScreen';
import { JobDetailScreen }            from '../screens/candidate/JobDetailScreen';
import { ApplyJobScreen }             from '../screens/candidate/ApplyJobScreen';
import { SavedJobsScreen }            from '../screens/candidate/SavedJobsScreen';
import { ApplicationTracker }         from '../screens/candidate/ApplicationTracker';
import { ApplicationDetailScreen }    from '../screens/candidate/ApplicationDetailsScreen';
import { CandidateMoreScreen }        from '../screens/candidate/MoreScreen';

// CV Generator
import { CvTemplatesScreen }  from '../screens/candidate/cv-generator/CvTemplatesScreen';
import { CvPreviewScreen }    from '../screens/candidate/cv-generator/CvPreviewScreen';
import { GeneratedCVsScreen } from '../screens/candidate/cv-generator/GeneratedCVsScreen';

// Shared screens
import { VerificationStatusScreen }  from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen } from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen }            from '../screens/shared/ReferralScreen';
import { LeaderboardScreen }         from '../screens/shared/LeaderboardScreen';

// Products
import { ProductMarketplaceScreen } from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }     from '../screens/products/ProductDetailsScreen';

// ─── Param lists ──────────────────────────────────────────────────────────────
export type CandidateStackParamList = {
  // Tabs root
  MainTabs: undefined;

  // Profile
  Profile:     undefined;
  EditProfile: undefined;

  // Jobs
  JobList:           undefined;
  JobDetail:         { jobId: string };
  ApplyJob:          { jobId: string; jobTitle: string };
  SavedJobs:         undefined;
  ApplicationList:   undefined;
  ApplicationDetail: { applicationId: string };

  // CV Generator
  CvTemplates:  undefined;
  CvPreview:    { templateId: string; templateName: string; regenerateCvId?: string };
  GeneratedCVs: undefined;

  // Shared
  VerificationStatus:  undefined;
  RequestVerification: undefined;
  Referral:            undefined;
  Leaderboard:         undefined;

  // Products
  ProductMarketplace: undefined;
  ProductDetails:     { productId: string };
};

// ─── Navigators ───────────────────────────────────────────────────────────────
const MainTab    = createBottomTabNavigator<CandidateMainTabParamList>();
const JobsTopTab = createMaterialTopTabNavigator<CandidateJobsTabParamList>();
const Stack      = createNativeStackNavigator<CandidateStackParamList>();

// ─── Jobs top-tab navigator ───────────────────────────────────────────────────

function CandidateJobsNavigator() {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <JobsTopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIndicatorStyle:    { backgroundColor: colors.primary },
        tabBarStyle:             { backgroundColor: colors.surface ?? colors.secondary },
      }}
    >
      <JobsTopTab.Screen name="JobsList"     component={JobBrowseScreen}    options={{ title: 'Browse' }} />
      <JobsTopTab.Screen name="SavedJobs"    component={SavedJobsScreen}    options={{ title: 'Saved' }} />
      <JobsTopTab.Screen name="Applications" component={ApplicationTracker} options={{ title: 'Applied' }} />
    </JobsTopTab.Navigator>
  );
}

// ─── Social wrapper ───────────────────────────────────────────────────────────

function CandidateSocialNavigator() {
  return <SocialNavigator />;
}

// ─── Main tab bar ─────────────────────────────────────────────────────────────

function CandidateTabNavigator() {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle:             { backgroundColor: colors.surface ?? colors.secondary },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:    ['home-outline',      'home'],
            Jobs:    ['briefcase-outline', 'briefcase'],
            Social:  ['globe-outline',     'globe'],
            Profile: ['person-outline',    'person'],
            More:    ['menu-outline',      'menu'],
          };
          const [outline, filled] = icons[route.name] ?? ['ellipse-outline', 'ellipse'];
          return <Ionicons name={(focused ? filled : outline) as any} size={size} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="Home"    component={CandidateDashboardScreen} />
      <MainTab.Screen name="Jobs"    component={CandidateJobsNavigator}   />
      <MainTab.Screen name="Social"  component={CandidateSocialNavigator} />
      <MainTab.Screen name="Profile" component={CandidateProfileScreen}   />
      <MainTab.Screen name="More"    component={CandidateMoreScreen}      />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────────────────────

export default function CandidateNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs"   component={CandidateTabNavigator} />

      {/* Profile */}
      <Stack.Screen name="EditProfile" component={CandidateEditProfileScreen} />

      {/* Jobs */}
      <Stack.Screen name="JobDetail"         component={JobDetailScreen}         />
      <Stack.Screen name="ApplyJob"          component={ApplyJobScreen}          />
      <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />

      {/* CV Generator */}
      <Stack.Screen name="CvTemplates"  component={CvTemplatesScreen}  />
      <Stack.Screen name="CvPreview"    component={CvPreviewScreen}    />
      <Stack.Screen name="GeneratedCVs" component={GeneratedCVsScreen} />

      {/* Verification */}
      <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen}  />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />

      {/* Referral */}
      <Stack.Screen name="Referral"    component={ReferralScreen}    />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />

      {/* Products */}
      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
      <Stack.Screen name="ProductDetails"     component={ProductDetailsScreen}     />
    </Stack.Navigator>
  );
}