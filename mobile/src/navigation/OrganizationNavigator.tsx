// src/navigation/OrganizationNavigator.tsx
/**
 * Role: Organization — main tabs + full stack.
 * Uses shared PillTabBar matching Company's design language.
 * Tenders tab mounts TendersNavigator userRole="organization".
 */

import React from 'react';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';

import { useThemeStore }                 from '../store/themeStore';
import { PillTabBar, PillTabMeta }       from './PillTabBar';
import {
  OrganizationMainTabParamList,
  OrganizationJobsTabParamList,
  OrganizationProfileTabParamList,
} from './types';

import TendersNavigator                  from './TendersNavigator';
import PlaceholderScreen                 from '../screens/auth/PlaceholderScreen';

import { OrgJobsScreen }                 from '../screens/organization/OrgJobsScreen';
import { OrgJobCreateScreen }            from '../screens/organization/OrgJobCreateScreen';
import { FreelancerMarketplaceScreen }   from '../screens/freelancer/FreelancerMarketplaceScreen';
import { FreelancerDetailScreen }        from '../screens/freelancer/FreelancerDetailScreen';
import { FreelancerShortlistScreen }     from '../screens/freelancer/FreelancerShortlistScreen';
import { VerificationStatusScreen }      from '../screens/shared/VerificationStatusScreen';
import { RequestVerificationScreen }     from '../screens/shared/RequestVerificationScreen';
import { ReferralScreen }                from '../screens/shared/ReferralScreen';
import { ProductMarketplaceScreen }                                from '../screens/products/ProductMarketplaceScreen';
import { ProductDetailsScreen as PublicProductDetailsScreen }     from '../screens/products/ProductDetailsScreen';
import { EmployerApplicationsScreen }                              from '../screens/company/EmployerApplicationListScreen';
import { OrganizationProfileScreen }                              from '../screens/organization/ProfileScreen';

// ─── Proposal screens (org wrappers) ─────────────────────────────────────────
import {
  OrgTenderProposalsScreen,
  OrgProposalDetailScreen,
  OrgProposalStatsScreen,
} from '../screens/organization/proposals';

export type OrganizationStackParamList = {
  MainTabs: undefined;
  OrgProfile: undefined;
  EditProfile: undefined;
  OrgJobList:        undefined;
  OrgJobCreate:      undefined;
  OrgJobEdit:        { jobId: string };
  OrgJobDetail:      { jobId: string };
  OrgApplicants:     { jobId: string; jobTitle: string };
  ApplicationList:   { jobId: string; jobTitle: string };
  ApplicationDetail: { applicationId: string };
  FreelancerMarketplace: undefined;
  FreelancerDetail:      { freelancerId: string };
  FreelancerShortlist:   undefined;
  VerificationStatus:  undefined;
  RequestVerification: undefined;
  Referral:    undefined;
  Leaderboard: undefined;
  ProductMarketplace: undefined;
  ProductDetails:     { productId: string };
  // Proposal deep links
  TenderProposals: { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
  ProposalDetail:  { proposalId: string; tenderId: string; role: 'company' | 'organization' };
  ProposalStats:   { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
};

const MainTab       = createBottomTabNavigator<OrganizationMainTabParamList>();
const JobsTopTab    = createMaterialTopTabNavigator<OrganizationJobsTabParamList>();
const ProfileTopTab = createMaterialTopTabNavigator<OrganizationProfileTabParamList>();
const Stack         = createNativeStackNavigator<OrganizationStackParamList>();

// ─── Tab metadata ─────────────────────────────────────────────────────────────
const ORG_META: Record<string, PillTabMeta> = {
  Home:    { icon: 'home-outline',          iconActive: 'home',          label: 'Home',    accentDark: '#60A5FA', accentLight: '#2563EB' },
  Jobs:    { icon: 'briefcase-outline',     iconActive: 'briefcase',     label: 'Jobs',    accentDark: '#34D399', accentLight: '#059669' },
  Tenders: { icon: 'document-text-outline', iconActive: 'document-text', label: 'Tenders', accentDark: '#F1BB03', accentLight: '#B45309' },
  Profile: { icon: 'business-outline',      iconActive: 'business',      label: 'Profile', accentDark: '#FB923C', accentLight: '#EA580C' },
  More:    { icon: 'grid-outline',          iconActive: 'grid',           label: 'More',    accentDark: '#94A3B8', accentLight: '#64748B' },
};

// ─── Top-tab style helper ─────────────────────────────────────────────────────
function orgTopTabOpts(isDark: boolean) {
  return {
    tabBarActiveTintColor:   isDark ? '#FB923C' : '#EA580C',
    tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
    tabBarIndicatorStyle:    { backgroundColor: isDark ? '#FB923C' : '#EA580C', height: 3, borderRadius: 2 },
    tabBarStyle:             { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', elevation: 0, shadowOpacity: 0 },
    tabBarLabelStyle:        { fontSize: 12, fontWeight: '700' as const, textTransform: 'none' as const },
  };
}

// ─── Jobs top-tab ─────────────────────────────────────────────────────────────
function OrganizationJobsNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <JobsTopTab.Navigator screenOptions={orgTopTabOpts(isDark)}>
      <JobsTopTab.Screen 
        name="JobsList"        
        component={OrgJobsScreen}      
        options={{ title: 'Opportunities' }} 
      />
      <JobsTopTab.Screen 
        name="CreateJob"       
        component={OrgJobCreateScreen} 
        options={{ title: 'Post' }} 
      />
      <JobsTopTab.Screen 
        name="JobApplications" 
        component={PlaceholderScreen}  
        options={{ title: 'Applications' }} 
      />
      <JobsTopTab.Screen 
        name="BackToHome"      
        component={PlaceholderScreen}  
        options={{ tabBarItemStyle: { display: 'none' } }} 
      />
    </JobsTopTab.Navigator>
  );
}

// ─── Tenders tab ──────────────────────────────────────────────────────────────
function OrganizationTendersTab() {
  return <TendersNavigator userRole="organization" />;
}

// ─── Profile top-tab ─────────────────────────────────────────────────────────
function OrganizationProfileNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <ProfileTopTab.Navigator screenOptions={orgTopTabOpts(isDark)}>
      <ProfileTopTab.Screen 
        name="OrganizationProfile"    // ✅ Fixed: matches OrganizationProfileTabParamList
        component={OrganizationProfileScreen}   
        options={{ title: 'Profile' }} 
      />
      <ProfileTopTab.Screen 
        name="FreelanceMarketplace" 
        component={FreelancerMarketplaceScreen} 
        options={{ title: 'Marketplace' }} 
      />
      <ProfileTopTab.Screen 
        name="BackToHome"           
        component={PlaceholderScreen}           
        options={{ tabBarItemStyle: { display: 'none' } }} 
      />
    </ProfileTopTab.Navigator>
  );
}

// ─── Main tab bar ─────────────────────────────────────────────────────────────
function OrganizationTabNavigator() {
  const isDark = useThemeStore((s) => s.theme.isDark);

  return (
    <MainTab.Navigator
      tabBar={({ state, navigation }) => (
        <PillTabBar
          routes={state.routes}
          activeIndex={state.index}
          isDark={isDark}
          meta={ORG_META}
          onPress={(name, key, focused) => {
            const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(name);
          }}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <MainTab.Screen name="Home"    component={PlaceholderScreen}              />
      <MainTab.Screen name="Jobs"    component={OrganizationJobsNavigator}      />
      <MainTab.Screen name="Tenders" component={OrganizationTendersTab}         />
      <MainTab.Screen name="Profile" component={OrganizationProfileNavigator}   />
      <MainTab.Screen name="More"    component={PlaceholderScreen}              />
    </MainTab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────────────────────
export default function OrganizationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={OrganizationTabNavigator} />

      <Stack.Screen name="EditProfile"  component={PlaceholderScreen} />

      <Stack.Screen name="OrgJobList"        component={OrgJobsScreen}               />
      <Stack.Screen name="OrgJobCreate"      component={OrgJobCreateScreen}           />
      <Stack.Screen name="OrgJobEdit"        component={PlaceholderScreen}            />
      <Stack.Screen name="OrgJobDetail"      component={PlaceholderScreen}            />
      <Stack.Screen name="OrgApplicants"     component={PlaceholderScreen}            />
      <Stack.Screen name="ApplicationList"   component={EmployerApplicationsScreen}   />
      <Stack.Screen name="ApplicationDetail" component={PlaceholderScreen}            />

      <Stack.Screen name="FreelancerMarketplace" component={(props: any) => <FreelancerMarketplaceScreen {...props} />} />
      <Stack.Screen name="FreelancerDetail"    component={FreelancerDetailScreen}    />
      <Stack.Screen name="FreelancerShortlist" component={FreelancerShortlistScreen} />

      <Stack.Screen name="VerificationStatus"  component={VerificationStatusScreen}  />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />

      <Stack.Screen name="Referral"    component={ReferralScreen}    />
      <Stack.Screen name="Leaderboard" component={PlaceholderScreen} />

      <Stack.Screen name="ProductMarketplace" component={ProductMarketplaceScreen}       />
      <Stack.Screen name="ProductDetails"     component={PublicProductDetailsScreen}     />

      {/* Proposal deep links from outside Tenders tab */}
      <Stack.Screen name="TenderProposals" component={OrgTenderProposalsScreen} options={{ headerShown: true, title: 'Proposals' }} />
      <Stack.Screen name="ProposalDetail"  component={OrgProposalDetailScreen}  options={{ headerShown: true, title: 'Proposal Detail' }} />
      <Stack.Screen name="ProposalStats"   component={OrgProposalStatsScreen}   options={{ headerShown: true, title: 'Statistics' }} />
    </Stack.Navigator>
  );
}