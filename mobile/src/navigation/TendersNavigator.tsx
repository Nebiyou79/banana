// ─────────────────────────────────────────────────────────────────────────────
//  src/navigation/TendersNavigator.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Standalone navigator for the Tenders area, mounted from CompanyNavigator
//  and OrganizationNavigator as a single screen called "Tenders".
//
//  Architecture:
//
//    TendersStack (native stack)
//      ├── Splash         (auto-dismisses to Home)
//      └── Home           (BottomTabs)
//           ├── Tab 1: Home              → TendersHomeScreen
//           ├── Tab 2: Freelance         → top-tabs (My / Create)
//           ├── Tab 3: Professional      → top-tabs (My / Create [+ Browse for company])
//           ├── Tab 4: Proposals         → single screen
//           ├── Tab 5: Bids              → top-tabs (Received [+ My for company])
//           └── Tab 6: More              → pops out to parent MainTabs
//
//  Each Tab also stacks deeper screens (Detail, Edit, Addendum, IncomingBids)
//  so they push on top of the bottom tabs without losing the tab bar.
//
//  Role differences are *only* in the Professional and Bids top-tabs.
//  Everything else is identical between company and organization.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../store/themeStore';

// ── Owner screens (Prompt 5) ────────────────────────────────────────────────
import MyProfessionalTendersScreen      from '../screens/company/professionalTenders/MyProfessionalTendersScreen';
import CreateProfessionalTenderScreen   from '../screens/company/professionalTenders/CreateProfessionalTenderScreen';
import EditProfessionalTenderScreen     from '../screens/company/professionalTenders/EditProfessionalTenderScreen';
import ProfessionalTenderDetailScreen   from '../screens/company/professionalTenders/ProfessionalTenderDetailScreen';
import AddendumScreen                   from '../screens/company/professionalTenders/AddendumScreen';
import IncomingBidsScreen               from '../screens/company/professionalTenders/IncomingBidsScreen';

// ── Splash + Home ───────────────────────────────────────────────────────────
import TendersSplashScreen              from '../screens/tenders/TendersSplashScreen';
import TendersHomeScreen                from '../screens/tenders/TendersHomeScreen';

// ── Placeholders for screens shipping in later prompts ──────────────────────
import {
  FreelanceTendersListPlaceholder,
  FreelanceTendersCreatePlaceholder,
  BrowseProfessionalTendersPlaceholder,
  ProposalsListPlaceholder,
  ReceivedBidsListPlaceholder,
  MyBidsPlaceholder,
} from '../screens/tenders/placeholders/TendersPlaceholder';

// ═════════════════════════════════════════════════════════════════════════════
//  PARAM LISTS  — exported for typed useNavigation in screens
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Outer stack — wraps the splash, the tab navigator, and any root-level
 * screens that should sit on top of the tab bar (currently none — every
 * detail/edit screen lives inside its parent tab's stack so the tab bar
 * stays visible).
 */
export type TendersStackParamList = {
  TendersSplash: undefined;
  TendersHome:   undefined;
};

/**
 * Bottom-tab param list. Each entry is itself a stack/top-tab navigator
 * (or a single screen for Proposals).
 */
export type TendersBottomTabParamList = {
  Home:                 undefined;
  FreelanceTenders:     undefined;
  ProfessionalTenders:  undefined;
  Proposals:            undefined;
  Bids:                 undefined;
  More:                 undefined;
};

// ── Tab 2: Freelance Tenders top-tabs ───────────────────────────────────────
export type FreelanceTendersTopTabParamList = {
  MyFreelanceTenders:     undefined;
  CreateFreelanceTender:  undefined;
};

// ── Tab 3: Professional Tenders top-tabs ────────────────────────────────────
//  Both: My + Create
//  Company adds: Browse
export type ProfessionalTendersTopTabParamList = {
  MyProfessionalTenders:      undefined;
  CreateProfessionalTender:   undefined;
  BrowseProfessionalTenders:  undefined;     // company only — hidden for org
};

// ── Tab 3 inner stack — wraps the top-tabs + detail/edit/addendum/bids ─────
export type ProfessionalTendersStackParamList = {
  ProfessionalTendersTabs:    undefined;     // the top-tabs themselves
  ProfessionalTenderDetail:   { tenderId: string };
  EditProfessionalTender:     { tenderId: string };
  AddendumScreen:             { tenderId: string };
  IncomingBids:               { tenderId: string };
};

// ── Tab 5: Bids top-tabs ────────────────────────────────────────────────────
//  Company: Received + My
//  Organization: Received only (rendered as a single screen instead of top-tabs)
export type BidsTopTabParamList = {
  ReceivedBids:  undefined;
  MyBids:        undefined;     // company only
};

// ═════════════════════════════════════════════════════════════════════════════
//  ROOT PROPS
// ═════════════════════════════════════════════════════════════════════════════

export interface TendersNavigatorProps {
  /** Drives the role-conditional sub-navigators (Professional, Bids). */
  userRole: 'company' | 'organization';
}

// ═════════════════════════════════════════════════════════════════════════════
//  NAVIGATORS
// ═════════════════════════════════════════════════════════════════════════════

const Stack             = createNativeStackNavigator<TendersStackParamList>();
const BottomTab         = createBottomTabNavigator<TendersBottomTabParamList>();
const FreelanceTopTab   = createMaterialTopTabNavigator<FreelanceTendersTopTabParamList>();
const ProfessionalTopTab = createMaterialTopTabNavigator<ProfessionalTendersTopTabParamList>();
const ProfessionalStack = createNativeStackNavigator<ProfessionalTendersStackParamList>();
const BidsTopTab        = createMaterialTopTabNavigator<BidsTopTabParamList>();

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 2 — FREELANCE TENDERS (top-tabs: My / Create)
// ═════════════════════════════════════════════════════════════════════════════

const FreelanceTendersTopTabs: React.FC = () => {
  const { colors } = useThemeStore((s) => s.theme);
  return (
    <FreelanceTopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIndicatorStyle:    { backgroundColor: colors.primary, height: 2.5 },
        tabBarStyle:             { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0 },
        tabBarLabelStyle:        { fontSize: 12, fontWeight: '700', textTransform: 'none' },
      }}
    >
      <FreelanceTopTab.Screen
        name="MyFreelanceTenders"
        component={FreelanceTendersListPlaceholder}
        options={{ title: 'My Freelance' }}
      />
      <FreelanceTopTab.Screen
        name="CreateFreelanceTender"
        component={FreelanceTendersCreatePlaceholder}
        options={{ title: 'Create' }}
      />
    </FreelanceTopTab.Navigator>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 3 — PROFESSIONAL TENDERS
//   Top-tabs are role-conditional: 3 for company (My / Create / Browse),
//   2 for organization (My / Create).
//   Wrapped in a native stack so detail/edit/addendum/bids screens can push
//   on top while the bottom tab bar stays visible.
// ═════════════════════════════════════════════════════════════════════════════

const buildProfessionalTopTabs = (userRole: 'company' | 'organization') => {
  const ProfessionalTendersTopTabs: React.FC = () => {
    const { colors } = useThemeStore((s) => s.theme);
    return (
      <ProfessionalTopTab.Navigator
        screenOptions={{
          tabBarActiveTintColor:   colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarIndicatorStyle:    { backgroundColor: colors.primary, height: 2.5 },
          tabBarStyle:             { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0 },
          tabBarLabelStyle:        { fontSize: 12, fontWeight: '700', textTransform: 'none' },
          tabBarScrollEnabled:     userRole === 'company',
        }}
      >
        <ProfessionalTopTab.Screen
          name="MyProfessionalTenders"
          component={MyProfessionalTendersScreen}
          options={{ title: 'My Tenders' }}
        />
        <ProfessionalTopTab.Screen
          name="CreateProfessionalTender"
          component={CreateProfessionalTenderScreen}
          options={{ title: 'Create' }}
        />
        {userRole === 'company' && (
          <ProfessionalTopTab.Screen
            name="BrowseProfessionalTenders"
            component={BrowseProfessionalTendersPlaceholder}
            options={{ title: 'Browse' }}
          />
        )}
      </ProfessionalTopTab.Navigator>
    );
  };
  return ProfessionalTendersTopTabs;
};

const buildProfessionalStack = (userRole: 'company' | 'organization') => {
  const TopTabs = buildProfessionalTopTabs(userRole);
  const ProfessionalTendersInner: React.FC = () => {
    const { colors } = useThemeStore((s) => s.theme);
    return (
      <ProfessionalStack.Navigator
        screenOptions={{
          headerStyle:      { backgroundColor: colors.surface },
          headerTintColor:  colors.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <ProfessionalStack.Screen
          name="ProfessionalTendersTabs"
          component={TopTabs}
          options={{ headerShown: false }}
        />
        <ProfessionalStack.Screen
          name="ProfessionalTenderDetail"
          component={ProfessionalTenderDetailScreen}
          options={{ title: 'Tender Details' }}
        />
        <ProfessionalStack.Screen
          name="EditProfessionalTender"
          component={EditProfessionalTenderScreen}
          options={{ title: 'Edit Tender' }}
        />
        <ProfessionalStack.Screen
          name="AddendumScreen"
          component={AddendumScreen}
          options={{ title: 'Addenda' }}
        />
        <ProfessionalStack.Screen
          name="IncomingBids"
          component={IncomingBidsScreen}
          options={{ title: 'Incoming Bids' }}
        />
      </ProfessionalStack.Navigator>
    );
  };
  return ProfessionalTendersInner;
};

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 5 — BIDS  (role-conditional)
//   Company: top-tabs (Received / My)
//   Organization: a single screen (no top-tabs at all)
// ═════════════════════════════════════════════════════════════════════════════

const BidsCompanyTopTabs: React.FC = () => {
  const { colors } = useThemeStore((s) => s.theme);
  return (
    <BidsTopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIndicatorStyle:    { backgroundColor: colors.primary, height: 2.5 },
        tabBarStyle:             { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0 },
        tabBarLabelStyle:        { fontSize: 12, fontWeight: '700', textTransform: 'none' },
      }}
    >
      <BidsTopTab.Screen
        name="ReceivedBids"
        component={ReceivedBidsListPlaceholder}
        options={{ title: 'Received' }}
      />
      <BidsTopTab.Screen
        name="MyBids"
        component={MyBidsPlaceholder}
        options={{ title: 'My Bids' }}
      />
    </BidsTopTab.Navigator>
  );
};

// Organizations get a single screen — same as ReceivedBids but without
// the top-tab chrome.  This is intentionally redundant; making it explicit
// keeps the role split readable.
const BidsOrganizationSingle: React.FC = () => <ReceivedBidsListPlaceholder />;

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 6 — MORE / BACK
//   This tab doesn't actually mount a screen.  When the user taps it, we
//   intercept via `tabPress` listener and CommonActions.navigate up to the
//   parent navigator's MainTabs.  We render an empty View as a fallback in
//   case the listener fails.
// ═════════════════════════════════════════════════════════════════════════════

const MoreFallback: React.FC = () => {
  const { colors } = useThemeStore((s) => s.theme);
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />;
};

// ═════════════════════════════════════════════════════════════════════════════
//  BOTTOM TABS — composed from the above
// ═════════════════════════════════════════════════════════════════════════════

const buildBottomTabs = (userRole: 'company' | 'organization') => {
  const ProfessionalInner = buildProfessionalStack(userRole);

  const BottomTabs: React.FC = () => {
    const { colors } = useThemeStore((s) => s.theme);
    const navigation = useNavigation<any>();

    /**
     * Pops the user out of the Tenders area entirely, back to the parent
     * (CompanyNavigator / OrganizationNavigator) MainTabs stack. Robust to
     * being invoked from any tab.
     */
    const popToMainTabs = useCallback(() => {
      navigation.dispatch(
        CommonActions.navigate({ name: 'MainTabs' }),
      );
    }, [navigation]);

    return (
      <BottomTab.Navigator
        screenOptions={({ route }: { route: any }) => ({
          headerShown: false,
          tabBarActiveTintColor:   colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: -2 },
          tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
            const iconMap: Record<keyof TendersBottomTabParamList, [string, string]> = {
              Home:                ['home-outline',          'home'],
              FreelanceTenders:    ['people-outline',        'people'],
              ProfessionalTenders: ['briefcase-outline',     'briefcase'],
              Proposals:           ['documents-outline',     'documents'],
              Bids:                ['inbox-outline',         'inbox'],
              More:                ['exit-outline',          'exit'],
            };
            const [outline, filled] = iconMap[route.name as keyof TendersBottomTabParamList] ?? ['ellipse-outline', 'ellipse'];
            return <Ionicons name={(focused ? filled : outline) as any} size={size} color={color} />;
          },
        })}
      >
        <BottomTab.Screen
          name="Home"
          options={{ title: 'Home' }}
        >
          {() => <TendersHomeScreen userRole={userRole} />}
        </BottomTab.Screen>

        <BottomTab.Screen
          name="FreelanceTenders"
          component={FreelanceTendersTopTabs}
          options={{ title: 'Freelance' }}
        />

        <BottomTab.Screen
          name="ProfessionalTenders"
          component={ProfessionalInner}
          options={{ title: 'Professional' }}
        />

        <BottomTab.Screen
          name="Proposals"
          component={ProposalsListPlaceholder}
          options={{ title: 'Proposals' }}
        />

        <BottomTab.Screen
          name="Bids"
          component={userRole === 'company' ? BidsCompanyTopTabs : BidsOrganizationSingle}
          options={{ title: 'Bids' }}
        />

        <BottomTab.Screen
          name="More"
          component={MoreFallback}
          options={{ title: 'Exit' }}
          listeners={{
            tabPress: (e: any) => {
              // Intercept — never actually navigate to the empty tab screen
              e.preventDefault();
              popToMainTabs();
            },
          }}
        />
      </BottomTab.Navigator>
    );
  };

  return BottomTabs;
};

// ═════════════════════════════════════════════════════════════════════════════
//  ROOT — Splash → BottomTabs
// ═════════════════════════════════════════════════════════════════════════════

const TendersNavigator: React.FC<TendersNavigatorProps> = ({ userRole }) => {
  const BottomTabsForRole = buildBottomTabs(userRole);

  return (
    <Stack.Navigator
      initialRouteName="TendersSplash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="TendersSplash" component={TendersSplashScreen} />
      <Stack.Screen name="TendersHome"   component={BottomTabsForRole} />
    </Stack.Navigator>
  );
};

export default TendersNavigator;
