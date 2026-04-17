/**
 * navigation/freelancer/FreelancerNavigator.tsx
 * Role: Freelancer — 5 main tabs + full stack for all built screens.
 *
 * Tab structure:
 *   1. Home     → FreelancerDashboardScreen
 *   2. Tenders  → Top tabs: Browse | Saved | Proposals  (placeholders — not built yet)
 *   3. Social   → Shared SocialNavigator
 *   4. Profile  → FreelancerProfileScreen
 *   5. More     → FreelancerMoreScreen (stack with portfolio, services, certs, reviews, etc.)
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
  FreelancerMainTabParamList,
  FreelancerTendersTabParamList,
} from './types';

// ─── Shared ───────────────────────────────────────────────────
import SocialNavigator  from './SocialNavigator';
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
import { FreelancerMyReviewsScreen }      from '../screens/freelancer/FreelancerMyReviewsScreen';

// Freelancer Marketplace (company/org browses freelancers — freelancer can view own public listing)
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
  // Tabs
  MainTabs: undefined;

  // Profile
  EditProfile: undefined;

  // Portfolio
  PortfolioList:    undefined;
  PortfolioDetails: { itemId: string };
  AddPortfolio:     undefined;
  EditPortfolio:    { itemId: string };

  // Services & certs
  ServicesList:       undefined;
  CertificationsList: undefined;

  // Reviews
  MyReviews: undefined;

  // Freelancer Marketplace
  FreelancerMarketplace: undefined;
  FreelancerDetail:      { freelancerId: string };
  FreelancerShortlist:   undefined;

  // Verification
  VerificationStatus:  undefined;
  RequestVerification: undefined;

  // Referral
  Referral:    undefined;
  Leaderboard: undefined;

  // Products
  ProductMarketplace: undefined;
  ProductDetails:     { productId: string };
};

// ─── Navigators ───────────────────────────────────────────────
const MainTab       = createBottomTabNavigator<FreelancerMainTabParamList>();
const TendersTopTab = createMaterialTopTabNavigator<FreelancerTendersTabParamList>();
const Stack         = createNativeStackNavigator<FreelancerStackParamList>();

// ─── Tenders top-tab navigator (all placeholders — not built yet) ─
function FreelancerTendersNavigator() {
  const nav = useNavigation<any>();
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
      <TendersTopTab.Screen name="TendersList"   component={PlaceholderScreen} options={{ title: 'Tenders' }} />
      <TendersTopTab.Screen name="SavedTenders"  component={PlaceholderScreen} options={{ title: 'Saved' }} />
      <TendersTopTab.Screen name="Proposals"     component={PlaceholderScreen} options={{ title: 'Proposals' }} />
      <TendersTopTab.Screen
        name="BackToHome"
        component={FreelancerDashboardScreen}

      />
    </TendersTopTab.Navigator>
  );
}

// ─── Social wrapper ───────────────────────────────────────────
function FreelancerSocialNavigator() {
  return <SocialNavigator parentNavigationKey="Home" />;
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
        tabBarStyle:             { backgroundColor: colors.surface },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:    ['home-outline',          'home'],
            Tenders: ['document-text-outline', 'document-text'],
            Social:  ['globe-outline',         'globe'],
            Profile: ['person-outline',        'person'],
            More:    ['menu-outline',          'menu'],
          };
          const [outline, filled] = icons[route.name] ?? ['ellipse-outline', 'ellipse'];
          return <Ionicons name={(focused ? filled : outline) as any} size={size} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="Home"    component={FreelancerDashboardScreen} />
      <MainTab.Screen name="Tenders" component={FreelancerTendersNavigator} />
      <MainTab.Screen name="Social"  component={FreelancerSocialNavigator} />
      <MainTab.Screen name="Profile" component={FreelancerProfileScreen}   />
      <MainTab.Screen name="More"    component={FreelancerMoreScreen}       />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────
export default function FreelancerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tab root */}
      <Stack.Screen name="MainTabs" component={FreelancerTabNavigator} />

      {/* Profile */}
      <Stack.Screen name="EditProfile" component={FreelancerEditProfileScreen} />

      {/* Portfolio */}
      <Stack.Screen name="PortfolioList"    component={PortfolioListScreen}    />
      <Stack.Screen name="PortfolioDetails" component={PortfolioDetailsScreen} />
      <Stack.Screen name="AddPortfolio"     component={AddPortfolioScreen}     />
      <Stack.Screen name="EditPortfolio"    component={EditPortfolioScreen}    />

      {/* Services & Certs */}
      <Stack.Screen name="ServicesList"       component={ServicesListScreen}       />
      <Stack.Screen name="CertificationsList" component={CertificationsListScreen} />

      {/* Reviews */}
      <Stack.Screen name="MyReviews" component={FreelancerMyReviewsScreen} />

      {/* Freelancer Marketplace */}
      <Stack.Screen name="FreelancerMarketplace" component={(props : any) => <FreelancerMarketplaceScreen {...props} />}
       />
      <Stack.Screen name="FreelancerDetail"      component={FreelancerDetailScreen}      />
      <Stack.Screen name="FreelancerShortlist"   component={FreelancerShortlistScreen}   />

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