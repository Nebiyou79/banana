import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

// ─── Existing screens ─────────────────────────────────────────────────────────
import { FreelancerDashboardScreen }   from '../screens/freelancer/DashboardScreen';
import { FreelancerProfileScreen }     from '../screens/freelancer/ProfileScreen';
import { FreelancerMoreScreen }        from '../screens/freelancer/MoreScreen';
import { FreelancerEditProfileScreen } from '../screens/freelancer/EditProfileScreen';

// ─── NEW: Portfolio ───────────────────────────────────────────────────────────
import { PortfolioListScreen }    from '../screens/freelancer/PortfolioListScreen';
import { PortfolioDetailsScreen } from '../screens/freelancer/PortfolioDetailsScreen';
import { AddPortfolioScreen, EditPortfolioScreen } from '../screens/freelancer/PortfolioFormScreens';

// ─── NEW: Services ────────────────────────────────────────────────────────────
import { ServicesListScreen } from '../screens/freelancer/ServicesListScreen';

// ─── NEW: Certifications ──────────────────────────────────────────────────────
import { CertificationsListScreen } from '../screens/freelancer/CertificationsListScreen';

// ─── Shared / Product screens ─────────────────────────────────────────────────
import { ProductMarketplaceScreen } from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }     from '../screens/products/ProductDetailsScreen';
import { VerificationStatusScreen } from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen }           from '../screens/shared/ReferralScreen';

// ─── Param Lists ──────────────────────────────────────────────────────────────

export type FreelancerTabParamList = {
  Dashboard:  undefined;
  Shop:       undefined;
  Profile:    undefined;
  More:       undefined;
};

export type FreelancerStackParamList = {
  // Root tabs
  FreelancerTabs:       undefined;

  // Profile
  EditProfile:          undefined;

  // Verification
  VerificationStatus:   undefined;
  RequestVerification:  undefined;

  // Portfolio
  PortfolioList:        undefined;
  PortfolioDetails:     { itemId: string };
  AddPortfolio:         undefined;
  EditPortfolio:        { itemId: string };

  // Services
  ServicesList:         undefined;

  // Certifications
  CertificationsList:   undefined;

  // Products
  ProductMarketplace:   undefined;
  ProductDetails:       { productId: string };

  // Referral / Leaderboard
  Referral:             undefined;
  Leaderboard:          undefined;
};

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

const Tab   = createBottomTabNavigator<FreelancerTabParamList>();
const Stack = createNativeStackNavigator<FreelancerStackParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, [IoniconName, IoniconName]> = {
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
        headerShown:           false,
        tabBarActiveTintColor:   '#10B981',
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          paddingBottom:   6,
          paddingTop:      6,
          height:          60,
          elevation:       8,
          shadowColor:     '#000',
          shadowOpacity:   0.08,
          shadowRadius:    8,
          shadowOffset:    { width: 0, height: -2 },
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name] ?? ['circle', 'circle-outline'];
          return (
            <Ionicons
              name={(focused ? active : inactive) as IoniconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={FreelancerDashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Shop"
        component={ProductMarketplaceScreen as React.ComponentType<object>}
        options={{ title: 'Shop' }}
      />
      <Tab.Screen
        name="Profile"
        component={FreelancerProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Tab.Screen
        name="More"
        component={FreelancerMoreScreen}
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
  );
};

// ─── Root Stack Navigator ─────────────────────────────────────────────────────

export const FreelancerNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* ── Root tabs ───────────────────────────────────────────── */}
    <Stack.Screen
      name="FreelancerTabs"
      component={FreelancerTabs}
    />

    {/* ── Profile ─────────────────────────────────────────────── */}
    <Stack.Screen
      name="EditProfile"
      component={FreelancerEditProfileScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
    />

    {/* ── Verification ────────────────────────────────────────── */}
    <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen} />
    <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />

    {/* ── Portfolio ───────────────────────────────────────────── */}
    <Stack.Screen
      name="PortfolioList"
      component={PortfolioListScreen}
    />
    <Stack.Screen
      name="PortfolioDetails"
      component={PortfolioDetailsScreen}
    />
    <Stack.Screen
      name="AddPortfolio"
      component={AddPortfolioScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
    />
    <Stack.Screen
      name="EditPortfolio"
      component={EditPortfolioScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
    />

    {/* ── Services ────────────────────────────────────────────── */}
    <Stack.Screen
      name="ServicesList"
      component={ServicesListScreen}
    />

    {/* ── Certifications ──────────────────────────────────────── */}
    <Stack.Screen
      name="CertificationsList"
      component={CertificationsListScreen}
    />

    {/* ── Products ────────────────────────────────────────────── */}
    <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
    <Stack.Screen name="ProductDetails"     component={ProductDetailsScreen} />

    {/* ── Referral ────────────────────────────────────────────── */}
    <Stack.Screen name="Referral" component={ReferralScreen} />
  </Stack.Navigator>
);