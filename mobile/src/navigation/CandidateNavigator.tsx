/**
 * mobile/src/navigation/CandidateNavigator.tsx
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

import { CandidateDashboardScreen }   from '../screens/candidate/Dashboardscreen';
import { CandidateProfileScreen }     from '../screens/candidate/ProfileScreen';
import { CandidateMoreScreen }        from '../screens/candidate/MoreScreen';
import { CandidateEditProfileScreen } from '../screens/candidate/EditProfileScreen';
import { JobBrowseScreen }            from '../screens/candidate/JobBrowseScreen';
import { SavedJobsScreen }            from '../screens/candidate/SavedJobsScreen';
import { ApplyJobScreen }             from '../screens/candidate/ApplyJobScreen';
import { ApplicationTracker }         from '../screens/candidate/ApplicationTracker';
import { ApplicationDetailScreen }    from '../screens/candidate/ApplicationDetailsScreen';
import { JobDetailScreen }           from '../screens/candidate/JobDetailsScreen';
import { ProductMarketplaceScreen }   from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }       from '../screens/products/ProductDetailsScreen';
import { VerificationStatusScreen }   from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }  from '../screens/shared/RequestVerificationScreen';

export type CandidateTabParamList = {
  Dashboard:    undefined;
  Jobs:         undefined;
  Applications: undefined;
  Shop:         undefined;
  More:         undefined;
};

export type CandidateStackParamList = {
  CandidateTabs:       undefined;
  Profile:         undefined;
  EditProfile:         undefined;
  VerificationStatus:  undefined;
  RequestVerification: undefined;
  JobList:             undefined;
  JobDetail:           { jobId: string };
  SavedJobs:           undefined;
  ApplyJob:            { jobId: string; jobTitle: string };
  ApplicationList:     undefined;
  ApplicationDetail:   { applicationId: string };
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
  Dashboard:    ['grid',               'grid-outline'],
  Jobs:         ['briefcase',          'briefcase-outline'],
  Applications: ['document-text',      'document-text-outline'],
  Shop:         ['storefront',         'storefront-outline'],
  More:         ['ellipsis-horizontal','ellipsis-horizontal-outline'],
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
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          paddingBottom: 6, paddingTop: 6, height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = ICONS[route.name] ?? ['circle', 'circle-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard"    component={CandidateDashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Jobs"         component={JobBrowseScreen}          options={{ title: 'Jobs' }} />
      <Tab.Screen name="Applications" component={ApplicationTracker}       options={{ title: 'Applied' }} />
      <Tab.Screen name="Shop"         component={(p: any) => <ProductMarketplaceScreen {...p} />} options={{ title: 'Shop' }} />
      <Tab.Screen name="More"         component={CandidateMoreScreen} />
    </Tab.Navigator>
  );
};

export const CandidateNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CandidateTabs"       component={CandidateTabs} />
        <Stack.Screen name="Profile"         component={CandidateProfileScreen}/>
    <Stack.Screen name="EditProfile"         component={CandidateEditProfileScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen} />
    <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
    <Stack.Screen name="JobList"             component={JobBrowseScreen} />
    <Stack.Screen name="JobDetail"           component={JobDetailScreen} />
    <Stack.Screen name="SavedJobs"           component={SavedJobsScreen} />
    <Stack.Screen name="ApplyJob"            component={ApplyJobScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="ApplicationList"     component={ApplicationTracker} />
    <Stack.Screen name="ApplicationDetail"   component={ApplicationDetailScreen} />
    <Stack.Screen name="ProductMarketplace"  component={ProductMarketplaceScreen} />
    <Stack.Screen name="ProductDetails"      component={ProductDetailsScreen} />
  </Stack.Navigator>
);