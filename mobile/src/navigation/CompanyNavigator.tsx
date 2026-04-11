import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

import { CompanyDashboardScreen }   from '../screens/company/DashboardScreen';
import { CompanyProfileScreen }     from '../screens/company/ProfileScreen';
import { CompanyMoreScreen }        from '../screens/company/MoreScreen';
import { CompanyEditProfileScreen } from '../screens/company/EditProfileScreen';

// Job screens
import {
  CompanyJobListScreen,
  CreateJobScreen,
  EditJobScreen,
  ApplicantListScreen,
} from '../screens/company/CompanyJobScreens';

// Product screens
import { CompanyProductListScreen } from '../screens/company/CompanyProductListScreen';
import { CreateProductScreen }      from '../screens/company/CreateProductScreen';
import { EditProductScreen }        from '../screens/company/EditProductScreen';
import { ProductMarketplaceScreen } from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }     from '../screens/products/ProductDetailsScreen';

// Shared screens
import { VerificationStatusScreen }  from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen } from '../screens/shared/RequestVerificationScreen';

export type CompanyTabParamList = {
  Dashboard:   undefined;
  Jobs:        undefined;   // ← NEW
  Products:    undefined;
  Profile:     undefined;
  More:        undefined;
};

export type CompanyStackParamList = {
  CompanyTabs:              undefined;
  EditProfile:              undefined;
  VerificationStatus:       undefined;
  RequestVerification:      undefined;
  // Jobs
  CompanyJobList:           undefined;
  CreateJob:                undefined;
  EditJob:                  { jobId: string };
  ApplicantList:            { jobId: string; jobTitle: string };
  CompanyApplicationDetails:{ applicationId: string };
  // Products
  CompanyProductList:       undefined;
  CreateProduct:            undefined;
  EditProduct:              { productId: string };
  ProductMarketplace:       undefined;
  ProductDetails:           { productId: string };
  // Freelancer marketplace (built in Prompt 03)
  FreelancerList:           undefined;
  FreelancerDetails:        { freelancerId: string };
  FreelancerReviews:        { freelancerId: string; name: string };
  FreelancerShortlist:      undefined;
  // Referral
  Referral:                 undefined;
  Leaderboard:              undefined;
};

const Tab   = createBottomTabNavigator<CompanyTabParamList>();
const Stack = createNativeStackNavigator<CompanyStackParamList>();

const ICONS: Record<string, [string, string]> = {
  Dashboard: ['briefcase',          'briefcase-outline'],
  Jobs:      ['document-text',      'document-text-outline'],   // ← NEW
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
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: 6, paddingTop: 6, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = ICONS[route.name] ?? ['circle', 'circle-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={CompanyDashboardScreen}  options={{ title: 'Home' }} />
<Tab.Screen name="Jobs"     component={(props: any) => <CompanyJobListScreen {...(props as any)} />} />
<Tab.Screen name="Products" component={(props: any) => <CompanyProductListScreen {...(props as any)} />} />
      <Tab.Screen name="Profile"   component={CompanyProfileScreen} />
      <Tab.Screen name="More"      component={CompanyMoreScreen} />
    </Tab.Navigator>
  );
};

export const CompanyNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CompanyTabs"          component={CompanyTabs} />
    <Stack.Screen name="EditProfile"          component={CompanyEditProfileScreen}  options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="VerificationStatus"   component={VerificationStatusScreen} />
    <Stack.Screen name="RequestVerification"  component={RequestVerificationScreen} />

    {/* Jobs */}
    <Stack.Screen name="CompanyJobList"        component={CompanyJobListScreen} />
    <Stack.Screen name="CreateJob"             component={CreateJobScreen}      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="EditJob"               component={EditJobScreen}        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="ApplicantList"         component={ApplicantListScreen} />
    {/* <Stack.Screen name="CompanyApplicationDetails" component={CompanyApplicationDetailsScreen} /> */}

    {/* Products */}
    <Stack.Screen name="CompanyProductList"    component={CompanyProductListScreen} />
    <Stack.Screen name="CreateProduct"         component={CreateProductScreen}  options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="EditProduct"           component={EditProductScreen}    options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="ProductMarketplace"    component={ProductMarketplaceScreen} />
    <Stack.Screen name="ProductDetails"        component={ProductDetailsScreen} />

    {/* Freelancer marketplace — uncomment when Prompt 03 module is built */}
    {/* <Stack.Screen name="FreelancerList"      component={FreelancerListScreen} /> */}
    {/* <Stack.Screen name="FreelancerDetails"   component={FreelancerDetailsScreen} /> */}
    {/* <Stack.Screen name="FreelancerReviews"   component={FreelancerReviewsScreen} /> */}
    {/* <Stack.Screen name="FreelancerShortlist" component={FreelancerShortlistScreen} /> */}

    {/* Referral — uncomment when Prompt 05 module is built */}
    {/* <Stack.Screen name="Referral"    component={ReferralScreen} /> */}
    {/* <Stack.Screen name="Leaderboard" component={LeaderboardScreen} /> */}
  </Stack.Navigator>
);