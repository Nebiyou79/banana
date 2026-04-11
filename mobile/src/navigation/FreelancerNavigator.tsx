import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

import { FreelancerDashboardScreen }    from '../screens/freelancer/DashboardScreen';
import { FreelancerProfileScreen }      from '../screens/freelancer/ProfileScreen';
import { FreelancerMoreScreen }         from '../screens/freelancer/MoreScreen';
import { FreelancerEditProfileScreen }  from '../screens/freelancer/EditProfileScreen';

// Product / shared screens
import { ProductMarketplaceScreen }   from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }       from '../screens/products/ProductDetailsScreen';
import { VerificationStatusScreen }   from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }  from '../screens/shared/RequestVerificationScreen';

export type FreelancerTabParamList = {
  Dashboard: undefined;
  Shop:      undefined;
  Profile:   undefined;
  More:      undefined;
};

export type FreelancerStackParamList = {
  FreelancerTabs:       undefined;
  EditProfile:          undefined;
  VerificationStatus:   undefined;
  RequestVerification:  undefined;
  // Portfolio (Prompt 03)
  PortfolioList:        undefined;
  PortfolioDetails:     { itemId: string };
  AddPortfolio:         undefined;
  EditPortfolio:        { itemId: string };
  // Services (Prompt 03)
  ServicesList:         undefined;
  AddService:           undefined;
  EditService:          { serviceId: string };
  // Certifications (Prompt 03)
  CertificationsList:   undefined;
  AddCertification:     undefined;
  EditCertification:    { certId: string };
  // Products
  ProductMarketplace:   undefined;
  ProductDetails:       { productId: string };
  // Referral (Prompt 05)
  Referral:             undefined;
  Leaderboard:          undefined;
};

const Tab   = createBottomTabNavigator<FreelancerTabParamList>();
const Stack = createNativeStackNavigator<FreelancerStackParamList>();

const ICONS: Record<string, [string, string]> = {
  Dashboard: ['grid',               'grid-outline'],
  Shop:      ['storefront',         'storefront-outline'],
  Profile:   ['person',             'person-outline'],
  More:      ['ellipsis-horizontal','ellipsis-horizontal-outline'],
};

const FreelancerTabs: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#10B981',
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: 6, paddingTop: 6, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = ICONS[route.name] ?? ['circle', 'circle-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={FreelancerDashboardScreen}  options={{ title: 'Home' }} />
      <Tab.Screen name="Shop"      component={(props: any) => <ProductMarketplaceScreen {...(props as any)} />} options={{ title: 'Shop' }} />
      <Tab.Screen name="Profile"   component={FreelancerProfileScreen} />
      <Tab.Screen name="More"      component={FreelancerMoreScreen} />
    </Tab.Navigator>
  );
};

export const FreelancerNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FreelancerTabs"       component={FreelancerTabs} />
    <Stack.Screen name="EditProfile"          component={FreelancerEditProfileScreen}  options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    <Stack.Screen name="VerificationStatus"   component={VerificationStatusScreen} />
    <Stack.Screen name="RequestVerification"  component={RequestVerificationScreen} />
    <Stack.Screen name="ProductMarketplace"   component={ProductMarketplaceScreen} />
    <Stack.Screen name="ProductDetails"       component={ProductDetailsScreen} />

    {/* Freelancer self-management — uncomment when Prompt 03 is built */}
    {/* <Stack.Screen name="PortfolioList"       component={PortfolioListScreen} /> */}
    {/* <Stack.Screen name="PortfolioDetails"    component={PortfolioDetailsScreen} /> */}
    {/* <Stack.Screen name="AddPortfolio"        component={AddPortfolioScreen} /> */}
    {/* <Stack.Screen name="EditPortfolio"       component={EditPortfolioScreen} /> */}
    {/* <Stack.Screen name="ServicesList"        component={ServicesListScreen} /> */}
    {/* <Stack.Screen name="AddService"          component={AddServiceScreen} /> */}
    {/* <Stack.Screen name="EditService"         component={EditServiceScreen} /> */}
    {/* <Stack.Screen name="CertificationsList"  component={CertificationsListScreen} /> */}
    {/* <Stack.Screen name="AddCertification"    component={AddCertificationScreen} /> */}
    {/* <Stack.Screen name="EditCertification"   component={EditCertificationScreen} /> */}

    {/* Referral — uncomment when Prompt 05 is built */}
    {/* <Stack.Screen name="Referral"    component={ReferralScreen} /> */}
    {/* <Stack.Screen name="Leaderboard" component={LeaderboardScreen} /> */}
  </Stack.Navigator>
);