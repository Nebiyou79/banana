/**
 * navigation/candidate/CandidateNavigator.tsx
 * Role: Candidate — 5 main tabs + full stack navigator for all built screens.
 *
 * Tab structure:
 *   1. Home        → CandidateDashboardScreen
 *   2. Jobs        → Top tabs: JobBrowse | SavedJobs | ApplicationTracker
 *   3. Social      → Shared SocialNavigator (all placeholders)
 *   4. Profile     → CandidateProfileScreen
 *   5. More        → CandidateMoreScreen  (stack with all extra screens)
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';
import { useNavigation }                 from '@react-navigation/native';
import { Ionicons }                      from '@expo/vector-icons';
import { useThemeStore }                 from '../store/themeStore';

// ─── Types ────────────────────────────────────────────────────
import {
  CandidateMainTabParamList,
  CandidateJobsTabParamList,
} from './types';

// ─── Shared ───────────────────────────────────────────────────
import SocialNavigator  from '../social/navigation/SocialNavigator';
import PlaceholderScreen from '../screens/auth/PlaceholderScreen';

// ─── Candidate screens ────────────────────────────────────────
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

// Products
import { ProductMarketplaceScreen }  from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }      from '../screens/products/ProductDetailsScreen';

// ─── Param lists ──────────────────────────────────────────────
export type CandidateStackParamList = {
  // Tabs
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

// ─── Navigators ───────────────────────────────────────────────
const MainTab    = createBottomTabNavigator<CandidateMainTabParamList>();
const JobsTopTab = createMaterialTopTabNavigator<CandidateJobsTabParamList>();
const Stack      = createNativeStackNavigator<CandidateStackParamList>();

// ─── Jobs top-tab navigator ───────────────────────────────────
function CandidateJobsNavigator() {
  const nav = useNavigation<any>();
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
      <JobsTopTab.Screen name="JobsList"     component={JobBrowseScreen}       options={{ title: 'Browse' }} />
      <JobsTopTab.Screen name="SavedJobs"    component={SavedJobsScreen}       options={{ title: 'Saved' }} />
      <JobsTopTab.Screen name="Applications" component={ApplicationTracker}    options={{ title: 'Applied' }} />
      {/* Removed BackToHome tab as tabBarButton is not supported in MaterialTopTabNavigator */}
    </JobsTopTab.Navigator>
  );
}

// ─── Social wrapper ───────────────────────────────────────────
function CandidateSocialNavigator() {
  return <SocialNavigator />;
}

// ─── Main tab bar ─────────────────────────────────────────────
function CandidateTabNavigator() {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle:             { backgroundColor: colors.surface },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:    ['home-outline',       'home'],
            Jobs:    ['briefcase-outline',  'briefcase'],
            Social:  ['globe-outline',      'globe'],
            Profile: ['person-outline',     'person'],
            More:    ['menu-outline',       'menu'],
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
      <MainTab.Screen name="More"    component={CandidateMoreScreen}       />
    </MainTab.Navigator>
  );
}

// ─── Root stack (handles all push screens) ────────────────────
export default function CandidateNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tab root */}
      <Stack.Screen name="MainTabs" component={CandidateTabNavigator} />

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
      <Stack.Screen name="Leaderboard" component={PlaceholderScreen} />

      {/* Products */}
      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
      <Stack.Screen name="ProductDetails"     component={ProductDetailsScreen}     />
    </Stack.Navigator>
  );
}