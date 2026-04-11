import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

import { CandidateDashboardScreen }   from '../screens/candidate/Dashboardscreen';
import { CandidateProfileScreen }     from '../screens/candidate/ProfileScreen';
import { CandidateMoreScreen }        from '../screens/candidate/MoreScreen';
import { CandidateEditProfileScreen } from '../screens/candidate/EditProfileScreen';
import { JobListScreen, SavedJobsScreen, JobDetailsScreen, ApplyJobScreen } from '../screens/candidate/CandidateJobScreens';
import { ProductMarketplaceScreen }   from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }       from '../screens/products/ProductDetailsScreen';
import { VerificationStatusScreen }   from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }  from '../screens/shared/RequestVerificationScreen';

export type CandidateTabParamList = {
  Dashboard: undefined;
  Jobs:      undefined;
  Shop:      undefined;
  Profile:   undefined;
  More:      undefined;
};

export type CandidateStackParamList = {
  CandidateTabs:       undefined;
  EditProfile:         undefined;
  VerificationStatus:  undefined;
  RequestVerification: undefined;
  JobList:             undefined;
  JobDetails:          { jobId: string };
  SavedJobs:           undefined;
  ApplyJob:            { jobId: string; jobTitle: string };
  ApplicationList:     undefined;
  ApplicationDetails:  { applicationId: string };
  ProductMarketplace:  undefined;
  ProductDetails:      { productId: string };
  Referral:            undefined;
  Leaderboard:         undefined;
  CvTemplates:         undefined;
  CvPreview:           { templateId: string; templateName: string; regenerateCvId?: string };
  GeneratedCVs:        undefined;
};

const Tab   = createBottomTabNavigator<CandidateTabParamList>();
const Stack = createNativeStackNavigator<CandidateStackParamList>();

const ICONS: Record<string, [string, string]> = {
  Dashboard: ['grid',               'grid-outline'],
  Jobs:      ['briefcase',          'briefcase-outline'],
  Shop:      ['storefront',         'storefront-outline'],
  Profile:   ['person',             'person-outline'],
  More:      ['ellipsis-horizontal','ellipsis-horizontal-outline'],
};

const CandidateTabs: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: 6, paddingTop: 6, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = ICONS[route.name] ?? ['circle', 'circle-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={CandidateDashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Jobs"      component={(props: any) => <JobListScreen {...(props as any)} />}            options={{ title: 'Jobs' }} />
      <Tab.Screen name="Shop"      component={(props: any) => <ProductMarketplaceScreen {...(props as any)} />} options={{ title: 'Shop' }} />
      <Tab.Screen name="Profile"   component={CandidateProfileScreen} />
      <Tab.Screen name="More"      component={CandidateMoreScreen} />
    </Tab.Navigator>
  );
};

export const CandidateNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CandidateTabs"       component={CandidateTabs} />
    <Stack.Screen name="EditProfile"         component={CandidateEditProfileScreen}  options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen} />
    <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
    <Stack.Screen name="JobList"             component={JobListScreen} />
    <Stack.Screen name="SavedJobs"           component={SavedJobsScreen} />
    <Stack.Screen name="JobDetails"          component={JobDetailsScreen} />
    <Stack.Screen name="ApplyJob"            component={ApplyJobScreen}             options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="ProductMarketplace"  component={ProductMarketplaceScreen} />
    <Stack.Screen name="ProductDetails"      component={ProductDetailsScreen} />
    {/* Placeholders — fill in when Applications / CV / Promo modules are built */}
    {/* <Stack.Screen name="ApplicationList"    component={ApplicationListScreen} /> */}
    {/* <Stack.Screen name="ApplicationDetails" component={ApplicationDetailsScreen} /> */}
    {/* <Stack.Screen name="CvTemplates"        component={CvTemplatesScreen} /> */}
    {/* <Stack.Screen name="CvPreview"          component={CvPreviewScreen} /> */}
    {/* <Stack.Screen name="GeneratedCVs"       component={GeneratedCVsScreen} /> */}
    {/* <Stack.Screen name="Referral"           component={ReferralScreen} /> */}
    {/* <Stack.Screen name="Leaderboard"        component={LeaderboardScreen} /> */}
  </Stack.Navigator>
);