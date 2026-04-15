/**
 * mobile/src/navigation/OrganizationNavigator.tsx
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

import { OrganizationDashboardScreen }     from '../screens/organization/DashboardScreen';
import { OrganizationProfileScreen }       from '../screens/organization/ProfileScreen';
import { OrganizationMoreScreen }          from '../screens/organization/MoreScreen';
import { OrganizationEditProfileScreen }   from '../screens/organization/EditProfileScreen';
import { OrgJobsScreen }                   from '../screens/organization/OrgJobsScreen';
import { OrgJobDetail }                    from '../screens/organization/OrgJobDetail';
import { OrgJobCreateScreen }              from '../screens/organization/OrgJobCreateScreen';
import { OrgJobEditScreen }                from '../screens/organization/OrgJobEditScreen';
import { EmployerApplicationListScreen }   from '../screens/company/EmployerApplicationListScreen';
import { EmployerApplicationDetailScreen } from '../screens/company/EmployerApplicationDetailScreen';
import { ProductMarketplaceScreen }        from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }            from '../screens/products/ProductDetailsScreen';
import { VerificationStatusScreen }        from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }       from '../screens/shared/RequestVerificationScreen';

export type OrganizationTabParamList = {
  Dashboard: undefined;
  Jobs:      undefined;
  Shop:      undefined;
  Profile:   undefined;
  More:      undefined;
};

export type OrganizationStackParamList = {
  OrganizationTabs:    undefined;
  EditProfile:         undefined;
  VerificationStatus:  undefined;
  RequestVerification: undefined;
  // Jobs
  OrgJobList:          undefined;
  OrgJobDetail:        { jobId: string };
  OrgJobCreate:        undefined;
  OrgJobEdit:          { jobId: string };
  // Applications — shared screens, org-role-aware
  ApplicationList:     { jobId: string; jobTitle: string };
  ApplicationDetail:   { applicationId: string };
  // Shop
  ProductMarketplace:  undefined;
  ProductDetails:      { productId: string };
  Referral:            undefined;
  Leaderboard:         undefined;
};

const Tab   = createBottomTabNavigator<OrganizationTabParamList>();
const Stack = createNativeStackNavigator<OrganizationStackParamList>();

const ICONS: Record<string, [string, string]> = {
  Dashboard: ['people',             'people-outline'],
  Jobs:      ['document-text',      'document-text-outline'],
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
      <Tab.Screen name="Dashboard" component={OrganizationDashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Jobs"      component={OrgJobsScreen}               options={{ title: 'Postings' }} />
      <Tab.Screen name="Shop"      component={(p: any) => <ProductMarketplaceScreen {...p} />} options={{ title: 'Shop' }} />
      <Tab.Screen name="Profile"   component={OrganizationProfileScreen} />
      <Tab.Screen name="More"      component={OrganizationMoreScreen} />
    </Tab.Navigator>
  );
};

export const OrganizationNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrganizationTabs"    component={OrganizationTabs} />
    <Stack.Screen name="EditProfile"         component={OrganizationEditProfileScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen} />
    <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
    {/* Jobs */}
    <Stack.Screen name="OrgJobList"          component={OrgJobsScreen} />
    <Stack.Screen name="OrgJobDetail"        component={OrgJobDetail} />
    <Stack.Screen name="OrgJobCreate"        component={OrgJobCreateScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="OrgJobEdit"          component={OrgJobEditScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    {/* Applications */}
    <Stack.Screen name="ApplicationList"     component={EmployerApplicationListScreen} />
    <Stack.Screen name="ApplicationDetail"   component={EmployerApplicationDetailScreen} />
    {/* Shop */}
    <Stack.Screen name="ProductMarketplace"  component={ProductMarketplaceScreen} />
    <Stack.Screen name="ProductDetails"      component={ProductDetailsScreen} />
  </Stack.Navigator>
);