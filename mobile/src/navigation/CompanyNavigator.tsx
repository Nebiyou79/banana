/**
 * mobile/src/navigation/CompanyNavigator.tsx
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

import { CompanyDashboardScreen }        from '../screens/company/DashboardScreen';
import { CompanyProfileScreen }          from '../screens/company/ProfileScreen';
import { CompanyMoreScreen }             from '../screens/company/MoreScreen';
import { CompanyEditProfileScreen }      from '../screens/company/EditProfileScreen';
import { JobManagementScreen }           from '../screens/company/JobManagementScreen';
import { JobCreateScreen }               from '../screens/company/JobCreateScreen';
import { JobEditScreen }                 from '../screens/company/JobEditScreen';
import { CompanyJobDetail }              from '../screens/company/CompanyJobDetailsScreen';
import { EmployerApplicationListScreen } from '../screens/company/EmployerApplicationListScreen';
import { EmployerApplicationDetailScreen } from '../screens/company/EmployerApplicationDetailScreen';
import { CompanyProductListScreen }      from '../screens/company/CompanyProductListScreen';
import { CreateProductScreen }           from '../screens/company/CreateProductScreen';
import { EditProductScreen }             from '../screens/company/EditProductScreen';
import { ProductMarketplaceScreen }      from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }          from '../screens/products/ProductDetailsScreen';
import { VerificationStatusScreen }      from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }     from '../screens/shared/RequestVerificationScreen';

export type CompanyTabParamList = {
  Dashboard: undefined;
  Jobs:      undefined;
  Products:  undefined;
  Profile:   undefined;
  More:      undefined;
};

export type CompanyStackParamList = {
  CompanyTabs:               undefined;
  EditProfile:               undefined;
  VerificationStatus:        undefined;
  RequestVerification:       undefined;
  // Jobs
  CompanyJobList:            undefined;
  JobDetail:                 { jobId: string };
  CreateJob:                 undefined;
  EditJob:                   { jobId: string };
  // Applications
  ApplicationList:           { jobId: string; jobTitle: string };
  ApplicationDetail:         { applicationId: string };
  // Products
  CompanyProductList:        undefined;
  CreateProduct:             undefined;
  EditProduct:               { productId: string };
  ProductMarketplace:        undefined;
  ProductDetails:            { productId: string };
  Referral:                  undefined;
  Leaderboard:               undefined;
};

const Tab   = createBottomTabNavigator<CompanyTabParamList>();
const Stack = createNativeStackNavigator<CompanyStackParamList>();

const ICONS: Record<string, [string, string]> = {
  Dashboard: ['briefcase',          'briefcase-outline'],
  Jobs:      ['document-text',      'document-text-outline'],
  Products:  ['cube',               'cube-outline'],
  Profile:   ['business',           'business-outline'],
  More:      ['ellipsis-horizontal','ellipsis-horizontal-outline'],
};

const CompanyTabs: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#3B82F6',
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
      <Tab.Screen name="Dashboard" component={CompanyDashboardScreen}  options={{ title: 'Home' }} />
      <Tab.Screen name="Jobs"      component={JobManagementScreen}     options={{ title: 'Jobs' }} />
      <Tab.Screen name="Products"  component={(p: any) => <CompanyProductListScreen {...p} />} />
      <Tab.Screen name="Profile"   component={CompanyProfileScreen} />
      <Tab.Screen name="More"      component={CompanyMoreScreen} />
    </Tab.Navigator>
  );
};

export const CompanyNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CompanyTabs"         component={CompanyTabs} />
    <Stack.Screen name="EditProfile"         component={CompanyEditProfileScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen} />
    <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
    {/* Jobs */}
    <Stack.Screen name="CompanyJobList"      component={JobManagementScreen} />
    <Stack.Screen name="JobDetail"           component={CompanyJobDetail} />
    <Stack.Screen name="CreateJob"           component={JobCreateScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="EditJob"             component={JobEditScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    {/* Applications */}
    <Stack.Screen name="ApplicationList"     component={EmployerApplicationListScreen} />
    <Stack.Screen name="ApplicationDetail"   component={EmployerApplicationDetailScreen} />
    {/* Products */}
    <Stack.Screen name="CompanyProductList"  component={CompanyProductListScreen} />
    <Stack.Screen name="CreateProduct"       component={CreateProductScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="EditProduct"         component={EditProductScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="ProductMarketplace"  component={ProductMarketplaceScreen} />
    <Stack.Screen name="ProductDetails"      component={ProductDetailsScreen} />
  </Stack.Navigator>
);