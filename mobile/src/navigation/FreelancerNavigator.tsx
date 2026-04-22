/**
 * navigation/freelancer/FreelancerNavigator.tsx
 * Role: Freelancer — 5 main tabs + full stack for all built screens.
 */

import React from 'react';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';
import { Ionicons }                      from '@expo/vector-icons';
import { useThemeStore }                 from '../store/themeStore';

// ─── Types ────────────────────────────────────────────────────
import {
  FreelancerMainTabParamList,
  FreelancerTendersTabParamList,
} from './types';

// ─── Social (full stack entry) ────────────────────────────────
import SocialEntry       from '../social/navigation/SocialEntry';
import PlaceholderScreen from '../screens/auth/PlaceholderScreen';

// ─── Freelancer screens ───────────────────────────────────────
import { FreelancerDashboardScreen }      from '../screens/freelancer/DashboardScreen';
import { FreelancerProfileScreen }        from '../screens/freelancer/ProfileScreen';
import { FreelancerEditProfileScreen }    from '../screens/freelancer/EditProfileScreen';
import { FreelancerMoreScreen }           from '../screens/freelancer/MoreScreen';

// Portfolio
import { PortfolioListScreen }            from '../screens/freelancer/PortfolioListScreen';
import { PortfolioDetailsScreen }         from '../screens/freelancer/PortfolioDetailsScreen';
import { AddPortfolioScreen, EditPortfolioScreen } from '../screens/freelancer/PortfolioFormScreens';

// Services & Certs
import { ServicesListScreen }             from '../screens/freelancer/ServicesListScreen';
import { CertificationsListScreen }       from '../screens/freelancer/CertificationsListScreen';

// Reviews
import { MyReviewsScreen }      from '../screens/freelancer/FreelancerMyReviewsScreen';

// Freelancer Marketplace
import { FreelancerMarketplaceScreen }    from '../screens/freelancer/FreelancerMarketplaceScreen';
import { FreelancerDetailScreen }         from '../screens/freelancer/FreelancerDetailScreen';
import { FreelancerShortlistScreen }      from '../screens/freelancer/FreelancerShortlistScreen';

// Shared screens
import { VerificationStatusScreen }       from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }      from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen }                 from '../screens/shared/ReferralScreen';

// Products
import { ProductMarketplaceScreen }       from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }           from '../screens/products/ProductDetailsScreen';

// ─── Param list ───────────────────────────────────────────────
export type FreelancerStackParamList = {
  MainTabs: undefined;

  EditProfile: undefined;

  PortfolioList:    undefined;
  PortfolioDetails: { itemId: string };
  AddPortfolio:     undefined;
  EditPortfolio:    { itemId: string };

  ServicesList:       undefined;
  CertificationsList: undefined;

  MyReviews: undefined;

  FreelancerMarketplace: undefined;
  FreelancerDetail:      { freelancerId: string };
  FreelancerShortlist:   undefined;

  VerificationStatus:  undefined;
  RequestVerification: undefined;

  Referral:    undefined;
  Leaderboard: undefined;

  ProductMarketplace: undefined;
  ProductDetails:     { productId: string };
};

// ─── Navigators ───────────────────────────────────────────────
const MainTab       = createBottomTabNavigator<FreelancerMainTabParamList>();
const TendersTopTab = createMaterialTopTabNavigator<FreelancerTendersTabParamList>();
const Stack         = createNativeStackNavigator<FreelancerStackParamList>();

// ─── Tenders top-tab navigator ────────────────────────────────
function FreelancerTendersNavigator() {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <TendersTopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIndicatorStyle:    { backgroundColor: colors.primary },
        tabBarStyle:             { backgroundColor: colors.surface },
      }}
    >
      <TendersTopTab.Screen name="TendersList"  component={PlaceholderScreen} options={{ title: 'Tenders' }} />
      <TendersTopTab.Screen name="SavedTenders" component={PlaceholderScreen} options={{ title: 'Saved' }} />
      <TendersTopTab.Screen name="Proposals"    component={PlaceholderScreen} options={{ title: 'Proposals' }} />
      <TendersTopTab.Screen name="BackToHome"   component={FreelancerDashboardScreen} />
    </TendersTopTab.Navigator>
  );
}

// ─── Main tab bar ─────────────────────────────────────────────
function FreelancerTabNavigator() {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle:
          route.name === 'Social'
            ? { display: 'none' }
            : { backgroundColor: colors.surface },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:    ['home-outline',          'home'],
            Tenders: ['document-text-outline', 'document-text'],
            Social:  ['people-outline',        'people'],
            Profile: ['person-outline',        'person'],
            More:    ['menu-outline',          'menu'],
          };
          const [outline, filled] = icons[route.name] ?? ['ellipse-outline', 'ellipse'];
          return <Ionicons name={(focused ? filled : outline) as any} size={size} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="Home"    component={FreelancerDashboardScreen}  />
      <MainTab.Screen name="Tenders" component={FreelancerTendersNavigator} />
      <MainTab.Screen name="Social"  component={SocialEntry}                />
      <MainTab.Screen name="Profile" component={FreelancerProfileScreen}    />
      <MainTab.Screen name="More"    component={FreelancerMoreScreen}        />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────
export default function FreelancerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={FreelancerTabNavigator} />

      <Stack.Screen name="EditProfile" component={FreelancerEditProfileScreen} />

      <Stack.Screen name="PortfolioList"    component={PortfolioListScreen}    />
      <Stack.Screen name="PortfolioDetails" component={PortfolioDetailsScreen} />
      <Stack.Screen name="AddPortfolio"     component={AddPortfolioScreen}     />
      <Stack.Screen name="EditPortfolio"    component={EditPortfolioScreen}    />

      <Stack.Screen name="ServicesList"       component={ServicesListScreen}       />
      <Stack.Screen name="CertificationsList" component={CertificationsListScreen} />

      <Stack.Screen name="MyReviews" component={MyReviewsScreen} />

      <Stack.Screen
        name="FreelancerMarketplace"
        component={(props: any) => <FreelancerMarketplaceScreen {...props} />}
      />
      <Stack.Screen name="FreelancerDetail"    component={FreelancerDetailScreen}    />
      <Stack.Screen name="FreelancerShortlist" component={FreelancerShortlistScreen} />

      <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen}  />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />

      <Stack.Screen name="Referral"    component={ReferralScreen}    />
      <Stack.Screen name="Leaderboard" component={PlaceholderScreen} />

      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
      <Stack.Screen name="ProductDetails"     component={ProductDetailsScreen}     />
    </Stack.Navigator>
  );
}