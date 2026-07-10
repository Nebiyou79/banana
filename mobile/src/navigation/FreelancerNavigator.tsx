/**
 * src/navigation/FreelancerNavigator.tsx
 * Role: Freelancer — 5 main tabs + full stack.
 * 
 * Updated: Replaced PillTabBar with SimpleRoleTabBar for Tenders bottom tabs
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../store/themeStore';
import { SimpleRoleTabBar } from './SimpleRoleTabBar';
import { FREELANCER_TAB_META } from './roleAccents';
import type {
  FreelancerMainTabParamList,
} from './types';

import type { PillTabMeta } from './PillTabBar';

import SocialEntry from '../social/navigation/SocialEntry';
import { FreelancerDashboardScreen } from '../screens/freelancer/DashboardScreen';
import { FreelancerProfileScreen } from '../screens/freelancer/ProfileScreen';
import { FreelancerEditProfileScreen } from '../screens/freelancer/EditProfileScreen';
import { FreelancerMoreScreen } from '../screens/freelancer/MoreScreen';
import { PortfolioListScreen } from '../screens/freelancer/PortfolioListScreen';
import { PortfolioDetailsScreen } from '../screens/freelancer/PortfolioDetailsScreen';
import {
  AddPortfolioScreen,
  EditPortfolioScreen,
} from '../screens/freelancer/PortfolioFormScreens';
import { ServicesListScreen } from '../screens/freelancer/ServicesListScreen';
import { CertificationsListScreen } from '../screens/freelancer/CertificationsListScreen';
import { MyReviewsScreen } from '../screens/freelancer/FreelancerMyReviewsScreen';
import { FreelancerMarketplaceScreen } from '../screens/freelancer/FreelancerMarketplaceScreen';
import { FreelancerDetailScreen } from '../screens/freelancer/FreelancerDetailScreen';
import { FreelancerShortlistScreen } from '../screens/freelancer/FreelancerShortlistScreen';
import FreelancerBrowseTendersScreen from '../screens/freelancer/tenders/FreelancerBrowseTendersScreen';
import FreelancerSavedTendersScreen from '../screens/freelancer/tenders/FreelancerSavedTendersScreen';
import FreelancerTenderDetailScreen from '../screens/freelancer/tenders/FreelancerTenderDetailScreen';
import { MyProposalsScreen } from '../screens/freelancer/proposals/MyProposalsScreen';
import { SubmitProposalScreen } from '../screens/freelancer/proposals/SubmitProposalScreen';
import { VerificationStatusScreen } from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen } from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen } from '../screens/shared/ReferralScreen';
import { ProductMarketplaceScreen } from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen } from '../screens/products/ProductDetailsScreen';
import ProposalDetailScreen from '../screens/freelancer/proposals/ProposalDetailScreen';
import RoleVerificationScreen from '../screens/shared/RoleVerificationScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { NotificationPreferencesScreen } from '../screens/NotificationPreferencesScreen';
import { HelpFAQScreen } from '../screens/settings/HelpFAQScreen';
import { PrivacySecurityScreen } from '../screens/settings/PrivacySecurityScreen';
import { ContactUsScreen } from '../screens/settings/ContactUsScreen';
import { TermsPrivacyScreen } from '../screens/settings/TermsPrivacyScreen';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type FreelancerStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  PortfolioList: undefined;
  PortfolioDetails: { itemId: string };
  AddPortfolio: undefined;
  EditPortfolio: { itemId: string };
  ServicesList: undefined;
  CertificationsList: undefined;
  MyReviews: undefined;
  FreelancerMarketplace: undefined;
  FreelancerDetail: { freelancerId: string };
  FreelancerShortlist: undefined;
    RoleVerification: undefined;
     NotificationPreferences: undefined;
  Notifications: undefined;// ⚙️ SETTINGS ROUTES
  PrivacySecurity: undefined;
  HelpFAQ: undefined;
  // Tender detail screens pushed from the Tenders inner stack:
  FreelancerTenderDetail: { tenderId: string };
  SubmitProposal: { tenderId: string; tender: unknown };
  ProposalDetail: { proposalId: string };
  VerificationStatus: undefined;
  RequestVerification: undefined;
  Referral: undefined;
  Leaderboard: undefined;
  ProductMarketplace: undefined;
  ProductDetails: { productId: string };
    ContactUs: undefined; // ✅ Added
  TermsPrivacy: undefined; // ✅ Added
};

export type FreelancerTendersTabParamList = {
  Back: undefined;
  BrowseTenders: undefined;
  SavedTenders: undefined;
  Proposals: undefined;
};

export type FreelancerTendersStackParamList = {
  TendersBottomTabs: undefined;
  FreelancerTenderDetail: { tenderId: string };
  SubmitProposal: { tenderId: string; tender: unknown };
  ProposalDetail: { proposalId: string };
};

// ─── Navigator factories ──────────────────────────────────────────────────────

const MainTab = createBottomTabNavigator<FreelancerMainTabParamList>();
const TendersBottomTab = createBottomTabNavigator<FreelancerTendersTabParamList>();
const TendersStack = createNativeStackNavigator<FreelancerTendersStackParamList>();
const Stack = createNativeStackNavigator<FreelancerStackParamList>();

// ─── Tenders tab metadata for SimpleRoleTabBar ──────────────────────────────

const FREELANCER_TENDERS_META: Record<string, PillTabMeta> = {
  Back: {
    icon: 'arrow-back-outline',
    iconActive: 'arrow-back',
    label: 'Back',
    accentDark: '#64748B',
    accentLight: '#475569',
  },
  BrowseTenders: {
    icon: 'search-outline',
    iconActive: 'search',
    label: 'Browse',
    accentDark: '#34D399',
    accentLight: '#059669',
  },
  SavedTenders: {
    icon: 'bookmark-outline',
    iconActive: 'bookmark',
    label: 'Saved',
    accentDark: '#F1BB03',
    accentLight: '#B45309',
  },
  Proposals: {
    icon: 'document-text-outline',
    iconActive: 'document-text',
    label: 'Proposals',
    accentDark: '#D8B4FE',
    accentLight: '#7C3AED',
  },
};

// ─── Tenders bottom tabs ──────────────────────────────────────────────────────

function TendersBackPlaceholder() {
  return null;
}

function FreelancerTendersBottomTabs() {
  const isDark = useThemeStore((s) => s.theme.isDark);

  return (
    <TendersBottomTab.Navigator
      initialRouteName="BrowseTenders"
      tabBar={({ state, navigation }) => (
        <SimpleRoleTabBar
          routes={state.routes}
          activeIndex={state.index}
          meta={FREELANCER_TENDERS_META}
          onPress={(name, key, focused) => {
            if (name === 'Back') {
              // Return to the parent role tab navigator
              navigation.getParent()?.goBack();
              return;
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(name);
            }
          }}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <TendersBottomTab.Screen name="Back" component={TendersBackPlaceholder} />
      <TendersBottomTab.Screen name="BrowseTenders" component={FreelancerBrowseTendersScreen} />
      <TendersBottomTab.Screen name="SavedTenders" component={FreelancerSavedTendersScreen} />
      <TendersBottomTab.Screen name="Proposals" component={MyProposalsScreen} />
    </TendersBottomTab.Navigator>
  );
}

// ─── Tenders inner stack ──────────────────────────────────────────────────────

function FreelancerTendersNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';

  return (
    <TendersStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: surface },
        headerTintColor: textColor,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <TendersStack.Screen
        name="TendersBottomTabs"
        component={FreelancerTendersBottomTabs}
        options={{ headerShown: false }}
      />
      <TendersStack.Screen
        name="FreelancerTenderDetail"
        component={FreelancerTenderDetailScreen}
        options={{ title: 'Tender Details' }}
      />
      <TendersStack.Screen
        name="SubmitProposal"
        component={SubmitProposalScreen}
        options={{ title: 'Apply to Tender' }}
      />
      <TendersStack.Screen
        name="ProposalDetail"
        component={ProposalDetailScreen}
        options={{ title: 'My Proposal' }}
      />
    </TendersStack.Navigator>
  );
}

// ─── Main tab navigator ───────────────────────────────────────────────────────

function FreelancerTabNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);

  return (
    <MainTab.Navigator
      tabBar={({ state, navigation }) => {
        const currentRoute = state.routes[state.index]?.name;
        if (currentRoute === 'Social' || currentRoute === 'Tenders') return null;

        return (
          <SimpleRoleTabBar
            routes={state.routes}
            activeIndex={state.index}
            meta={FREELANCER_TAB_META}
            onPress={(name, key, focused) => {
              const event = navigation.emit({
                type: 'tabPress',
                target: key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(name);
              }
            }}
          />
        );
      }}
      screenOptions={{ headerShown: false }}
    >
      <MainTab.Screen name="Home" component={FreelancerDashboardScreen} />
      <MainTab.Screen name="Tenders" component={FreelancerTendersNavigator} />
      <MainTab.Screen name="Social" component={SocialEntry} />
      <MainTab.Screen name="Profile" component={FreelancerProfileScreen} />
      <MainTab.Screen name="More" component={FreelancerMoreScreen} />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────────────────────

export default function FreelancerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={FreelancerTabNavigator} />
      <Stack.Screen name="EditProfile" component={FreelancerEditProfileScreen} />
      <Stack.Screen name="PortfolioList" component={PortfolioListScreen} />
      <Stack.Screen name="PortfolioDetails" component={PortfolioDetailsScreen} />
      <Stack.Screen name="AddPortfolio" component={AddPortfolioScreen} />
      <Stack.Screen name="EditPortfolio" component={EditPortfolioScreen} />
      <Stack.Screen name="ServicesList" component={ServicesListScreen} />
      <Stack.Screen name="CertificationsList" component={CertificationsListScreen} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
      <Stack.Screen name="FreelancerMarketplace" component={FreelancerMarketplaceScreen} />
      <Stack.Screen name="FreelancerDetail" component={FreelancerDetailScreen} />
      <Stack.Screen name="FreelancerShortlist" component={FreelancerShortlistScreen} />
 {/* 🔔 NOTIFICATION SCREENS */}
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Notifications',
        }}
      />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{
          headerShown: true,
          headerTitle: 'Notification Settings',
        }}
      />
            {/* ⚙️ SETTINGS SCREENS */}
{/* ⚙️ SETTINGS SCREENS */}
<Stack.Screen
  name="PrivacySecurity"
  component={PrivacySecurityScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="HelpFAQ"
  component={HelpFAQScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="ContactUs"
  component={ContactUsScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="TermsPrivacy"
  component={TermsPrivacyScreen}
  options={{ headerShown: false }}
/>
      <Stack.Screen
        name="FreelancerTenderDetail"
        component={FreelancerTenderDetailScreen}
        options={{ headerShown: true, title: 'Tender Details' }}
      />
      <Stack.Screen
        name="SubmitProposal"
        component={SubmitProposalScreen}
        options={{ headerShown: true, title: 'Apply to Tender' }}
      />
      <Stack.Screen
        name="ProposalDetail"
        component={ProposalDetailScreen}
        options={{ headerShown: true, title: 'My Proposal' }}
      />
      <Stack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
      <Stack.Screen name="RoleVerification" component={RoleVerificationScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </Stack.Navigator>
  );
}