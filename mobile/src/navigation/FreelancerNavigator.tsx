/**
 * navigation/FreelancerNavigator.tsx
 * Role: Freelancer — 5 main tabs + full stack.
 * Animated pill tab bar — pure react-native Animated, no reanimated.
 */

import React from 'react';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';

import { useThemeStore }                 from '../store/themeStore';
import { PillTabBar, PillTabMeta }       from './PillTabBar';
import {
  FreelancerMainTabParamList,
  FreelancerTendersTabParamList,
} from './types';

import SocialEntry                        from '../social/navigation/SocialEntry';
import { FreelancerDashboardScreen }      from '../screens/freelancer/DashboardScreen';
import { FreelancerProfileScreen }        from '../screens/freelancer/ProfileScreen';
import { FreelancerEditProfileScreen }    from '../screens/freelancer/EditProfileScreen';
import { FreelancerMoreScreen }           from '../screens/freelancer/MoreScreen';
import { PortfolioListScreen }            from '../screens/freelancer/PortfolioListScreen';
import { PortfolioDetailsScreen }         from '../screens/freelancer/PortfolioDetailsScreen';
import { AddPortfolioScreen, EditPortfolioScreen } from '../screens/freelancer/PortfolioFormScreens';
import { ServicesListScreen }             from '../screens/freelancer/ServicesListScreen';
import { CertificationsListScreen }       from '../screens/freelancer/CertificationsListScreen';
import { MyReviewsScreen }                from '../screens/freelancer/FreelancerMyReviewsScreen';
import { FreelancerMarketplaceScreen }    from '../screens/freelancer/FreelancerMarketplaceScreen';
import { FreelancerDetailScreen }         from '../screens/freelancer/FreelancerDetailScreen';
import { FreelancerShortlistScreen }      from '../screens/freelancer/FreelancerShortlistScreen';
import FreelancerBrowseTendersScreen      from '../screens/freelancer/tenders/FreelancerBrowseTendersScreen';
import FreelancerSavedTendersScreen       from '../screens/freelancer/tenders/FreelancerSavedTendersScreen';
import FreelancerTenderDetailScreen       from '../screens/freelancer/tenders/FreelancerTenderDetailScreen';
import { MyProposalsScreen }              from '../screens/freelancer/proposals/MyProposalsScreen';
import { ProposalDetailScreen }           from '../screens/freelancer/proposals/ProposalDetailScreen';
import { SubmitProposalScreen }           from '../screens/freelancer/proposals/SubmitProposalScreen';
import { VerificationStatusScreen }       from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }      from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen }                 from '../screens/shared/ReferralScreen';
import { ProductMarketplaceScreen }       from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen }           from '../screens/products/ProductDetailsScreen';

// ─── Param lists ──────────────────────────────────────────────────────────────
export type FreelancerStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  PortfolioList: undefined; PortfolioDetails: { itemId: string };
  AddPortfolio: undefined;  EditPortfolio: { itemId: string };
  ServicesList: undefined;  CertificationsList: undefined;
  MyReviews: undefined;
  FreelancerMarketplace: undefined; FreelancerDetail: { freelancerId: string }; FreelancerShortlist: undefined;
  FreelancerTenderDetail: { tenderId: string }; FreelancerSavedTenders: undefined; FreelancerBrowseTenders: undefined;
  MyProposals: undefined; ProposalDetail: { proposalId: string };
  SubmitProposal: { tenderId: string; tender: any };
  VerificationStatus: undefined; RequestVerification: undefined;
  Referral: undefined; Leaderboard: undefined;
  ProductMarketplace: undefined; ProductDetails: { productId: string };
};

export type FreelancerTendersStackParamList = {
  TendersTabs:            undefined;
  FreelancerTenderDetail: { tenderId: string };
  SubmitProposal:         { tenderId: string; tender: any };
  ProposalDetail:         { proposalId: string };
};

const MainTab       = createBottomTabNavigator<FreelancerMainTabParamList>();
const TendersTopTab = createMaterialTopTabNavigator<FreelancerTendersTabParamList>();
const TendersStack  = createNativeStackNavigator<FreelancerTendersStackParamList>();
const Stack         = createNativeStackNavigator<FreelancerStackParamList>();

// ─── Tab metadata ─────────────────────────────────────────────────────────────
const FL_META: Record<string, PillTabMeta> = {
  Home:    { icon: 'home-outline',          iconActive: 'home',          label: 'Home',    accentDark: '#60A5FA', accentLight: '#2563EB' },
  Tenders: { icon: 'document-text-outline', iconActive: 'document-text', label: 'Tenders', accentDark: '#34D399', accentLight: '#059669' },
  Social:  { icon: 'people-outline',        iconActive: 'people',        label: 'Social',  accentDark: '#D8B4FE', accentLight: '#7C3AED' },
  Profile: { icon: 'person-outline',        iconActive: 'person',        label: 'Profile', accentDark: '#F1BB03', accentLight: '#B45309' },
  More:    { icon: 'grid-outline',          iconActive: 'grid',           label: 'More',    accentDark: '#94A3B8', accentLight: '#64748B' },
};

// ─── Tenders top-tab + inner stack ───────────────────────────────────────────
function FreelancerTendersTopTabs() {
  const isDark  = useThemeStore((s) => s.theme.isDark);
  const primary = isDark ? '#34D399' : '#059669';
  const muted   = isDark ? '#64748B' : '#94A3B8';
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  return (
    <TendersTopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   primary,
        tabBarInactiveTintColor: muted,
        tabBarIndicatorStyle:    { backgroundColor: primary, height: 3, borderRadius: 2 },
        tabBarStyle:             { backgroundColor: surface, elevation: 0, shadowOpacity: 0 },
        tabBarLabelStyle:        { fontSize: 12, fontWeight: '700', textTransform: 'none' },
      }}
    >
      <TendersTopTab.Screen name="TendersList"  component={FreelancerBrowseTendersScreen} options={{ title: 'Browse' }} />
      <TendersTopTab.Screen name="SavedTenders" component={FreelancerSavedTendersScreen}  options={{ title: 'Saved' }} />
      <TendersTopTab.Screen name="Proposals"    component={MyProposalsScreen}             options={{ title: 'My Proposals' }} />
    </TendersTopTab.Navigator>
  );
}

function FreelancerTendersNavigatorInner() {
  const isDark    = useThemeStore((s) => s.theme.isDark);
  const surface   = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  return (
    <TendersStack.Navigator
      screenOptions={{ headerStyle: { backgroundColor: surface }, headerTintColor: textColor, headerTitleStyle: { fontWeight: '700' } }}
    >
      <TendersStack.Screen name="TendersTabs"            component={FreelancerTendersTopTabs}    options={{ headerShown: false }} />
      <TendersStack.Screen name="FreelancerTenderDetail" component={FreelancerTenderDetailScreen} options={{ title: 'Tender Details' }} />
      <TendersStack.Screen name="SubmitProposal"         component={SubmitProposalScreen}         options={{ title: 'Apply to Tender' }} />
      <TendersStack.Screen name="ProposalDetail"         component={ProposalDetailScreen}         options={{ title: 'My Proposal' }} />
    </TendersStack.Navigator>
  );
}

// ─── Main tab navigator ───────────────────────────────────────────────────────
function FreelancerTabNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <MainTab.Navigator
      tabBar={({ state, navigation }) => (
        <PillTabBar
          routes={state.routes}
          activeIndex={state.index}
          isDark={isDark}
          meta={FL_META}
          onPress={(name, key, focused) => {
            const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(name);
          }}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <MainTab.Screen name="Home"    component={FreelancerDashboardScreen}       />
      <MainTab.Screen name="Tenders" component={FreelancerTendersNavigatorInner} />
      <MainTab.Screen name="Social"  component={SocialEntry}                     />
      <MainTab.Screen name="Profile" component={FreelancerProfileScreen}         />
      <MainTab.Screen name="More"    component={FreelancerMoreScreen}            />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────────────────────
export default function FreelancerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs"   component={FreelancerTabNavigator} />
      <Stack.Screen name="EditProfile" component={FreelancerEditProfileScreen} />
      <Stack.Screen name="PortfolioList"    component={PortfolioListScreen}    />
      <Stack.Screen name="PortfolioDetails" component={PortfolioDetailsScreen} />
      <Stack.Screen name="AddPortfolio"     component={AddPortfolioScreen}     />
      <Stack.Screen name="EditPortfolio"    component={EditPortfolioScreen}    />
      <Stack.Screen name="ServicesList"       component={ServicesListScreen}       />
      <Stack.Screen name="CertificationsList" component={CertificationsListScreen} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
      <Stack.Screen name="FreelancerMarketplace" component={(props: any) => <FreelancerMarketplaceScreen {...props} />} />
      <Stack.Screen name="FreelancerDetail"    component={FreelancerDetailScreen}    />
      <Stack.Screen name="FreelancerShortlist" component={FreelancerShortlistScreen} />
      <Stack.Screen name="FreelancerTenderDetail"  component={FreelancerTenderDetailScreen}  />
      <Stack.Screen name="FreelancerSavedTenders"  component={FreelancerSavedTendersScreen}  />
      <Stack.Screen name="FreelancerBrowseTenders" component={FreelancerBrowseTendersScreen} />
      <Stack.Screen name="MyProposals"   component={MyProposalsScreen}   />
      <Stack.Screen name="ProposalDetail" component={ProposalDetailScreen} />
      <Stack.Screen name="SubmitProposal" component={SubmitProposalScreen} />
      <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen}  />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen} />
      <Stack.Screen name="ProductDetails"     component={ProductDetailsScreen}     />
    </Stack.Navigator>
  );
}