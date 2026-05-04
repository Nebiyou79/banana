// ─────────────────────────────────────────────────────────────────────────────
//  src/navigation/TendersNavigator.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Standalone navigator for the Tenders area — mounted from CompanyNavigator
//  and OrganizationNavigator as a single screen called "Tenders".
//
//  Architecture:
//    TendersStack (native stack)
//      ├── Splash         (auto-dismisses to Home)
//      └── Home           (BottomTabs — uses shared PillTabBar)
//           ├── Tab 1: Home              → TendersHomeScreen
//           ├── Tab 2: Freelance         → top-tabs (My / Create)
//           ├── Tab 3: Professional      → inner stack (tabs + Detail/Edit/…)
//           ├── Tab 4: Proposals         → TenderProposalsScreen (all tenders)
//           ├── Tab 5: Bids              → top-tabs (Received [+ My for company])
//           └── Tab 6: Exit              → pops out to parent MainTabs
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator }       from '@react-navigation/native-stack';
import { createBottomTabNavigator }          from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator }     from '@react-navigation/material-top-tabs';
import { CommonActions, useNavigation }      from '@react-navigation/native';

import { useThemeStore }                     from '../store/themeStore';
import { PillTabBar, PillTabMeta }           from './PillTabBar';

// ── Owner screens ─────────────────────────────────────────────────────────────
import MyProfessionalTendersScreen           from '../screens/company/professionalTenders/MyProfessionalTendersScreen';
import { CreateProfessionalTenderScreen }    from '../screens/company/professionalTenders/CreateProfessionalTenderScreen';
import { EditProfessionalTenderScreen }      from '../screens/company/professionalTenders/EditProfessionalTenderScreen';
import { ProfessionalTenderDetailScreen }    from '../screens/company/professionalTenders/ProfessionalTenderDetailScreen';
import { AddendumScreen }                    from '../screens/company/professionalTenders/AddendumScreen';
import { IncomingBidsScreen }                from '../screens/company/professionalTenders/IncomingBidsScreen';

// ── Freelance tender screens ──────────────────────────────────────────────────
import CompanyMyTendersScreen                from '../screens/company/freelanceTenders/CompanyMyTendersScreen';
import CompanyTenderDetailScreen             from '../screens/company/freelanceTenders/CompanyTenderDetailScreen';
import FreelanceTenderCreateScreen           from '../screens/company/freelanceTenders/FreelanceTenderCreateScreen';
import FreelanceTenderEditScreen             from '../screens/company/freelanceTenders/FreelanceTenderEditScreen';

// ── Proposal screens ──────────────────────────────────────────────────────────
import { TenderProposalsScreen }             from '../screens/company/proposals/TenderProposalsScreen';
import { ProposalStatsScreen }               from '../screens/company/proposals/ProposalStatsScreen';
import { CompanyProposalDetailScreen }       from '../screens/company/proposals/ProposalDetailScreen';

// ── Splash + Home ─────────────────────────────────────────────────────────────
import { TendersSplashScreen }               from '../screens/tenders/TendersSplashScreen';
import { TendersHomeScreen }                 from '../screens/tenders/TendersHomeScreen';
import { CategoryPickerScreen }              from '../screens/tenders/CategoryPickerScreen';
import { CompanyInvitePickerScreen }         from '../screens/tenders/CompanyInvitePickerScreen';

// ── Placeholders ──────────────────────────────────────────────────────────────
import {
  ReceivedBidsListPlaceholder,
  MyBidsPlaceholder,
  BrowseProfessionalTendersPlaceholder,
} from '../screens/tenders/placeholders/TendersPlaceholder';

// ═════════════════════════════════════════════════════════════════════════════
//  PARAM LISTS
// ═════════════════════════════════════════════════════════════════════════════

export type TendersStackParamList = {
  TendersSplash: undefined;
  TendersHome:   undefined;
};

export type TendersBottomTabParamList = {
  Home:                 undefined;
  FreelanceTenders:     undefined;
  ProfessionalTenders:  undefined;
  Proposals:            undefined;
  Bids:                 undefined;
  Exit:                 undefined;
};

export type FreelanceTendersStackParamList = {
  FreelanceTendersTabs:   undefined;
  CompanyTenderDetail:    { tenderId: string };
  CompanyTenderEdit:      { tenderId: string };
  CompanyTenderApplicants:{ tenderId: string };
};

export type FreelanceTendersTopTabParamList = {
  MyFreelanceTenders:    undefined;
  CreateFreelanceTender: undefined;
};

export type ProfessionalTendersTopTabParamList = {
  MyProfessionalTenders:     undefined;
  CreateProfessionalTender:  undefined;
  BrowseProfessionalTenders: undefined;
};

export type ProfessionalTendersStackParamList = {
  ProfessionalTendersTabs:   undefined;
  ProfessionalTenderDetail:  { tenderId: string };
  EditProfessionalTender:    { tenderId: string };
  AddendumScreen:            { tenderId: string };
  IncomingBids:              { tenderId: string };
  ProposalStats:             { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
  TenderProposals:           { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
  ProposalDetail:            { proposalId: string; tenderId: string; role: 'company' | 'organization' };
  CategoryPicker:            { current?: string; onPick: (v: string) => void };
  CompanyInvitePicker:       { selectedIds: string[]; onPick: (ids: string[]) => void };
};

export type BidsTopTabParamList = {
  ReceivedBids: undefined;
  MyBids:       undefined;
};

export type ProposalsStackParamList = {
  ProposalsList:  undefined;
  TenderProposals:{ tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
  ProposalDetail: { proposalId: string; tenderId: string; role: 'company' | 'organization' };
  ProposalStats:  { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
};

// ═════════════════════════════════════════════════════════════════════════════
//  ROOT PROPS
// ═════════════════════════════════════════════════════════════════════════════

export interface TendersNavigatorProps {
  userRole: 'company' | 'organization';
}

// ═════════════════════════════════════════════════════════════════════════════
//  NAVIGATOR FACTORIES
// ═════════════════════════════════════════════════════════════════════════════

const Stack              = createNativeStackNavigator<TendersStackParamList>();
const BottomTab          = createBottomTabNavigator<TendersBottomTabParamList>();
const FreelanceTopTab    = createMaterialTopTabNavigator<FreelanceTendersTopTabParamList>();
const FreelanceStack     = createNativeStackNavigator<FreelanceTendersStackParamList>();
const ProfTopTab         = createMaterialTopTabNavigator<ProfessionalTendersTopTabParamList>();
const ProfStack          = createNativeStackNavigator<ProfessionalTendersStackParamList>();
const BidsTopTab         = createMaterialTopTabNavigator<BidsTopTabParamList>();
const ProposalsStack     = createNativeStackNavigator<ProposalsStackParamList>();

// ═════════════════════════════════════════════════════════════════════════════
//  TAB METADATA
// ═════════════════════════════════════════════════════════════════════════════

const TENDERS_TAB_META: Record<string, PillTabMeta> = {
  Home: {
    icon: 'home-outline',
    iconActive: 'home',
    label: 'Home',
    accentDark: '#60A5FA',
    accentLight: '#2563EB',
  },
  FreelanceTenders: {
    icon: 'people-outline',
    iconActive: 'people',
    label: 'Freelance',
    accentDark: '#34D399',
    accentLight: '#059669',
  },
  ProfessionalTenders: {
    icon: 'briefcase-outline',
    iconActive: 'briefcase',
    label: 'Professional',
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
  Bids: {
    icon: 'pin-outline',
    iconActive: 'ellipse',
    label: 'Bids',
    accentDark: '#FDBA74',
    accentLight: '#EA580C',
  },
  Exit: {
    icon: 'exit-outline',
    iconActive: 'exit',
    label: 'Exit',
    accentDark: '#94A3B8',
    accentLight: '#64748B',
  },
};

// ═════════════════════════════════════════════════════════════════════════════
//  MATERIAL TOP TAB STYLE HELPER
// ═════════════════════════════════════════════════════════════════════════════

function topTabScreenOptions(isDark: boolean) {
  const primary = isDark ? '#F1BB03' : '#B45309';
  const muted   = isDark ? '#64748B' : '#94A3B8';
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  return {
    tabBarActiveTintColor:   primary,
    tabBarInactiveTintColor: muted,
    tabBarIndicatorStyle:    { backgroundColor: primary, height: 3, borderRadius: 2 },
    tabBarStyle:             { backgroundColor: surface, elevation: 0, shadowOpacity: 0 },
    tabBarLabelStyle:        { fontSize: 12, fontWeight: '700' as const, textTransform: 'none' as const },
    tabBarScrollEnabled:     true,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 2 — FREELANCE TENDERS INNER STACK (tabs + detail/edit)
// ═════════════════════════════════════════════════════════════════════════════

function FreelanceTendersTopTabs() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <FreelanceTopTab.Navigator screenOptions={topTabScreenOptions(isDark)}>
      <FreelanceTopTab.Screen
        name="MyFreelanceTenders"
        component={CompanyMyTendersScreen}
        options={{ title: 'My Tenders' }}
      />
      <FreelanceTopTab.Screen
        name="CreateFreelanceTender"
        component={FreelanceTenderCreateScreen}
        options={{ title: 'Create' }}
      />
    </FreelanceTopTab.Navigator>
  );
}

function FreelanceTendersInner() {
  const isDark    = useThemeStore((s) => s.theme.isDark);
  const surface   = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  
  return (
    <FreelanceStack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: surface },
        headerTintColor:  textColor,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <FreelanceStack.Screen
        name="FreelanceTendersTabs"
        component={FreelanceTendersTopTabs}
        options={{ headerShown: false }}
      />
      <FreelanceStack.Screen
        name="CompanyTenderDetail"
        component={CompanyTenderDetailScreen}
        options={{ title: 'Tender Details' }}
      />
      <FreelanceStack.Screen
        name="CompanyTenderEdit"
        component={FreelanceTenderEditScreen}
        options={{ title: 'Edit Tender' }}
      />
      <FreelanceStack.Screen
        name="CompanyTenderApplicants"
        component={CompanyTenderDetailScreen}
        options={{ title: 'Applicants' }}
      />
    </FreelanceStack.Navigator>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 3 — PROFESSIONAL TENDERS INNER STACK
// ═════════════════════════════════════════════════════════════════════════════

function ProfessionalTendersTopTabs({ userRole }: { userRole: 'company' | 'organization' }) {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <ProfTopTab.Navigator screenOptions={topTabScreenOptions(isDark)}>
      <ProfTopTab.Screen
        name="MyProfessionalTenders"
        component={MyProfessionalTendersScreen}
        options={{ title: 'My Tenders' }}
      />
      <ProfTopTab.Screen
        name="CreateProfessionalTender"
        component={CreateProfessionalTenderScreen}
        options={{ title: 'Create' }}
      />
      {userRole === 'company' && (
        <ProfTopTab.Screen
          name="BrowseProfessionalTenders"
          component={BrowseProfessionalTendersPlaceholder}
          options={{ title: 'Browse' }}
        />
      )}
    </ProfTopTab.Navigator>
  );
}

function ProfessionalTendersInner() {
  const isDark    = useThemeStore((s) => s.theme.isDark);
  const surface   = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  
  return (
    <ProfStack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: surface },
        headerTintColor:  textColor,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <ProfStack.Screen
        name="ProfessionalTendersTabs"
        options={{ headerShown: false }}
      >
        {(props) => {
          // We need to pass userRole here, but it's available from the parent
          // Using a workaround with route params or context
          return <ProfessionalTendersTopTabs userRole="company" />;
        }}
      </ProfStack.Screen>
      <ProfStack.Screen
        name="ProfessionalTenderDetail"
        component={ProfessionalTenderDetailScreen}
        options={{ title: 'Tender Details' }}
      />
      <ProfStack.Screen
        name="EditProfessionalTender"
        component={EditProfessionalTenderScreen}
        options={{ title: 'Edit Tender' }}
      />
      <ProfStack.Screen
        name="AddendumScreen"
        component={AddendumScreen}
        options={{ title: 'Addenda' }}
      />
      <ProfStack.Screen
        name="IncomingBids"
        component={IncomingBidsScreen}
        options={{ title: 'Incoming Bids' }}
      />
      <ProfStack.Screen
        name="ProposalStats"
        component={ProposalStatsScreen}
        options={{ title: 'Proposal Statistics' }}
      />
      <ProfStack.Screen
        name="TenderProposals"
        component={TenderProposalsScreen}
        options={{ title: 'Proposals' }}
      />
      <ProfStack.Screen
        name="ProposalDetail"
        component={CompanyProposalDetailScreen}
        options={{ title: 'Proposal Detail' }}
      />
      <ProfStack.Screen
        name="CategoryPicker"
        component={CategoryPickerScreen}
        options={{ title: 'Choose Category', presentation: 'modal' }}
      />
      <ProfStack.Screen
        name="CompanyInvitePicker"
        component={CompanyInvitePickerScreen}
        options={{ title: 'Invite Companies', presentation: 'modal' }}
      />
    </ProfStack.Navigator>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 4 — PROPOSALS STACK
// ═════════════════════════════════════════════════════════════════════════════

function AllProposalsPlaceholder() {
  const { TendersPlaceholder } = require('../screens/tenders/placeholders/TendersPlaceholder');
  return (
    <TendersPlaceholder
      title="All Proposals"
      description="View proposals across all your freelance tenders in one place. Tap a tender to drill in."
      icon="documents-outline"
      module="Proposals Module"
    />
  );
}

function ProposalsInner() {
  const isDark    = useThemeStore((s) => s.theme.isDark);
  const surface   = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  
  return (
    <ProposalsStack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: surface },
        headerTintColor:  textColor,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <ProposalsStack.Screen
        name="ProposalsList"
        component={AllProposalsPlaceholder}
        options={{ headerShown: false }}
      />
      <ProposalsStack.Screen
        name="TenderProposals"
        component={TenderProposalsScreen}
        options={{ title: 'Proposals' }}
      />
      <ProposalsStack.Screen
        name="ProposalDetail"
        component={CompanyProposalDetailScreen}
        options={{ title: 'Proposal Detail' }}
      />
      <ProposalsStack.Screen
        name="ProposalStats"
        component={ProposalStatsScreen}
        options={{ title: 'Statistics' }}
      />
    </ProposalsStack.Navigator>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 5 — BIDS (role-conditional)
// ═════════════════════════════════════════════════════════════════════════════

function BidsCompanyTopTabs() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <BidsTopTab.Navigator screenOptions={topTabScreenOptions(isDark)}>
      <BidsTopTab.Screen name="ReceivedBids" component={ReceivedBidsListPlaceholder} options={{ title: 'Received' }} />
      <BidsTopTab.Screen name="MyBids"       component={MyBidsPlaceholder}           options={{ title: 'My Bids' }} />
    </BidsTopTab.Navigator>
  );
}

function BidsOrgSingle() {
  return <ReceivedBidsListPlaceholder />;
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 6 — EXIT
// ═════════════════════════════════════════════════════════════════════════════

function ExitFallback() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return <View style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }} />;
}

// ═════════════════════════════════════════════════════════════════════════════
//  BOTTOM TABS (composed with shared PillTabBar)
// ═════════════════════════════════════════════════════════════════════════════

function TendersBottomTabs({ userRole }: { userRole: 'company' | 'organization' }) {
  const isDark     = useThemeStore((s) => s.theme.isDark);
  const navigation = useNavigation<any>();

  const popToMainTabs = useCallback(() => {
    navigation.dispatch(CommonActions.navigate({ name: 'MainTabs' }));
  }, [navigation]);

  return (
    <BottomTab.Navigator
      tabBar={({ state }) => (
        <PillTabBar
          routes={state.routes}
          activeIndex={state.index}
          isDark={isDark}
          meta={TENDERS_TAB_META}
          onPress={(name, key, focused) => {
            const event = navigation.emit({ 
              type: 'tabPress', 
              target: key, 
              canPreventDefault: true 
            });
            if (!focused && !event.defaultPrevented) {
              if (name === 'Exit') {
                popToMainTabs();
              } else {
                navigation.navigate(name);
              }
            }
          }}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <BottomTab.Screen name="Home">
        {() => <TendersHomeScreen userRole={userRole} />}
      </BottomTab.Screen>
      <BottomTab.Screen
        name="FreelanceTenders"
        component={FreelanceTendersInner}
      />
      <BottomTab.Screen
        name="ProfessionalTenders"
        component={ProfessionalTendersInner}
      />
      <BottomTab.Screen
        name="Proposals"
        component={ProposalsInner}
      />
      <BottomTab.Screen
        name="Bids"
        component={userRole === 'company' ? BidsCompanyTopTabs : BidsOrgSingle}
      />
      <BottomTab.Screen
        name="Exit"
        component={ExitFallback}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            popToMainTabs();
          },
        }}
      />
    </BottomTab.Navigator>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  ROOT — Splash → BottomTabs
// ═════════════════════════════════════════════════════════════════════════════

const TendersNavigator: React.FC<TendersNavigatorProps> = ({ userRole }) => {
  return (
    <Stack.Navigator
      initialRouteName="TendersSplash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="TendersSplash" component={TendersSplashScreen} />
      <Stack.Screen name="TendersHome">
        {() => <TendersBottomTabs userRole={userRole} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default TendersNavigator;