import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

import { OrganizationDashboardScreen }   from '../screens/organization/DashboardScreen';
import { OrganizationProfileScreen }     from '../screens/organization/ProfileScreen';
import { OrganizationMoreScreen }        from '../screens/organization/MoreScreen';
import { OrganizationEditProfileScreen } from '../screens/organization/EditProfileScreen';

// Job screens (company screens work for org too — role is checked inside)
import {
  CompanyJobListScreen,
  CreateJobScreen,
  EditJobScreen,
  ApplicantListScreen,
} from '../screens/company/CompanyJobScreens';

// Product / shared screens
import { ProductMarketplaceScreen }  from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }      from '../screens/products/ProductDetailsScreen';
import { VerificationStatusScreen }  from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen } from '../screens/shared/RequestVerificationScreen';

export type OrganizationTabParamList = {
  Dashboard: undefined;
  Jobs:      undefined;   // ← NEW
  Shop:      undefined;
  Profile:   undefined;
  More:      undefined;
};

export type OrganizationStackParamList = {
  OrganizationTabs:     undefined;
  EditProfile:          undefined;
  VerificationStatus:   undefined;
  RequestVerification:  undefined;
  // Jobs (same screens as company — logic branches on role inside)
  CompanyJobList:       undefined;
  CreateJob:            undefined;
  EditJob:              { jobId: string };
  ApplicantList:        { jobId: string; jobTitle: string };
  CompanyApplicationDetails: { applicationId: string };
  // Products
  ProductMarketplace:   undefined;
  ProductDetails:       { productId: string };
  // Referral
  Referral:             undefined;
  Leaderboard:          undefined;
};

const Tab   = createBottomTabNavigator<OrganizationTabParamList>();
const Stack = createNativeStackNavigator<OrganizationStackParamList>();

const ICONS: Record<string, [string, string]> = {
  Dashboard: ['people',             'people-outline'],
  Jobs:      ['document-text',      'document-text-outline'],   // ← NEW
  Shop:      ['storefront',         'storefront-outline'],
  Profile:   ['business',           'business-outline'],
  More:      ['ellipsis-horizontal','ellipsis-horizontal-outline'],
};

const OrganizationTabs: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#8B5CF6',
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: 6, paddingTop: 6, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = ICONS[route.name] ?? ['circle', 'circle-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={OrganizationDashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Jobs"      component={CompanyJobListScreen}         options={{ title: 'Postings' }} />
      <Tab.Screen name="Shop"      component={(props: any) => <ProductMarketplaceScreen {...(props as any)} />} options={{ title: 'Shop' }} />
      <Tab.Screen name="Profile"   component={OrganizationProfileScreen} />
      <Tab.Screen name="More"      component={OrganizationMoreScreen} />
    </Tab.Navigator>
  );
};

export const OrganizationNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrganizationTabs"     component={OrganizationTabs} />
    <Stack.Screen name="EditProfile"          component={OrganizationEditProfileScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="VerificationStatus"   component={VerificationStatusScreen} />
    <Stack.Screen name="RequestVerification"  component={RequestVerificationScreen} />

    {/* Jobs */}
    <Stack.Screen name="CompanyJobList"       component={CompanyJobListScreen} />
    <Stack.Screen name="CreateJob"            component={CreateJobScreen}  options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="EditJob"              component={EditJobScreen}    options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="ApplicantList"        component={ApplicantListScreen} />

    {/* Products */}
    <Stack.Screen name="ProductMarketplace"   component={ProductMarketplaceScreen} />
    <Stack.Screen name="ProductDetails"       component={ProductDetailsScreen} />

    {/* Referral — uncomment when Prompt 05 is built */}
    {/* <Stack.Screen name="Referral"    component={ReferralScreen} /> */}
    {/* <Stack.Screen name="Leaderboard" component={LeaderboardScreen} /> */}
  </Stack.Navigator>
);