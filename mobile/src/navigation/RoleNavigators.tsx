import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

// ─── Freelancer ───────────────────────────────────────────────────────────────
import { FreelancerDashboardScreen }   from '../screens/freelancer/DashboardScreen';
import { FreelancerProfileScreen }     from '../screens/freelancer/ProfileScreen';
import { FreelancerEditProfileScreen } from '../screens/freelancer/EditProfileScreen';
import { FreelancerMoreScreen }        from '../screens/freelancer/MoreScreen';

// ─── Company ──────────────────────────────────────────────────────────────────
import { CompanyDashboardScreen }   from '../screens/company/DashboardScreen';
import { CompanyProfileScreen }     from '../screens/company/ProfileScreen';
import { CompanyEditProfileScreen } from '../screens/company/EditProfileScreen';
import { CompanyMoreScreen }        from '../screens/company/MoreScreen';

// ─── Organization ─────────────────────────────────────────────────────────────
import { OrganizationDashboardScreen }   from '../screens/organization/DashboardScreen';
import { OrganizationProfileScreen }     from '../screens/organization/ProfileScreen';
import { OrganizationEditProfileScreen } from '../screens/organization/EditProfileScreen';
import { OrganizationMoreScreen }        from '../screens/organization/MoreScreen';

// ─── Helper: build tab icons map ─────────────────────────────────────────────

type TabIconMap = Record<string, [string, string]>;

const useTabBar = () => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return {
    screenOptions: (route: any, iconMap: TabIconMap) => ({
      headerShown: false,
      tabBarActiveTintColor:   colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor:  colors.border,
        paddingBottom: 6,
        paddingTop: 6,
        height: 60,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
      tabBarIcon: ({ focused, color, size }: any) => {
        const [active, inactive] = iconMap[route.name] ?? ['circle', 'circle-outline'];
        return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
      },
    }),
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// FREELANCER
// ═══════════════════════════════════════════════════════════════════════════════

export type FreelancerTabParamList   = { Dashboard: undefined; Profile: undefined; More: undefined };
export type FreelancerStackParamList = { FreelancerTabs: undefined; EditProfile: undefined };

const FreelancerTab   = createBottomTabNavigator<FreelancerTabParamList>();
const FreelancerStack = createNativeStackNavigator<FreelancerStackParamList>();

const FREELANCER_ICONS: TabIconMap = {
  Dashboard: ['grid',         'grid-outline'],
  Profile:   ['person',       'person-outline'],
  More:      ['ellipsis-horizontal', 'ellipsis-horizontal-outline'],
};

const FreelancerTabs: React.FC = () => {
  const { screenOptions } = useTabBar();
  return (
    <FreelancerTab.Navigator screenOptions={({ route }) => screenOptions(route, FREELANCER_ICONS)}>
      <FreelancerTab.Screen name="Dashboard" component={FreelancerDashboardScreen} options={{ title: 'Home' }} />
      <FreelancerTab.Screen name="Profile"   component={FreelancerProfileScreen} />
      <FreelancerTab.Screen name="More"      component={FreelancerMoreScreen} />
    </FreelancerTab.Navigator>
  );
};

export const FreelancerNavigator: React.FC = () => (
  <FreelancerStack.Navigator screenOptions={{ headerShown: false }}>
    <FreelancerStack.Screen name="FreelancerTabs" component={FreelancerTabs} />
    <FreelancerStack.Screen
      name="EditProfile"
      component={FreelancerEditProfileScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
    />
  </FreelancerStack.Navigator>
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY
// ═══════════════════════════════════════════════════════════════════════════════

export type CompanyTabParamList   = { Dashboard: undefined; Profile: undefined; More: undefined };
export type CompanyStackParamList = { CompanyTabs: undefined; EditProfile: undefined };

const CompanyTab   = createBottomTabNavigator<CompanyTabParamList>();
const CompanyStack = createNativeStackNavigator<CompanyStackParamList>();

const COMPANY_ICONS: TabIconMap = {
  Dashboard: ['briefcase',    'briefcase-outline'],
  Profile:   ['business',     'business-outline'],
  More:      ['ellipsis-horizontal', 'ellipsis-horizontal-outline'],
};

const CompanyTabs: React.FC = () => {
  const { screenOptions } = useTabBar();
  return (
    <CompanyTab.Navigator screenOptions={({ route }) => screenOptions(route, COMPANY_ICONS)}>
      <CompanyTab.Screen name="Dashboard" component={CompanyDashboardScreen} options={{ title: 'Home' }} />
      <CompanyTab.Screen name="Profile"   component={CompanyProfileScreen} />
      <CompanyTab.Screen name="More"      component={CompanyMoreScreen} />
    </CompanyTab.Navigator>
  );
};

export const CompanyNavigator: React.FC = () => (
  <CompanyStack.Navigator screenOptions={{ headerShown: false }}>
    <CompanyStack.Screen name="CompanyTabs" component={CompanyTabs} />
    <CompanyStack.Screen
      name="EditProfile"
      component={CompanyEditProfileScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
    />
  </CompanyStack.Navigator>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export type OrganizationTabParamList   = { Dashboard: undefined; Profile: undefined; More: undefined };
export type OrganizationStackParamList = { OrganizationTabs: undefined; EditProfile: undefined };

const OrganizationTab   = createBottomTabNavigator<OrganizationTabParamList>();
const OrganizationStack = createNativeStackNavigator<OrganizationStackParamList>();

const ORG_ICONS: TabIconMap = {
  Dashboard: ['people',   'people-outline'],
  Profile:   ['business', 'business-outline'],
  More:      ['ellipsis-horizontal', 'ellipsis-horizontal-outline'],
};

const OrganizationTabs: React.FC = () => {
  const { screenOptions } = useTabBar();
  return (
    <OrganizationTab.Navigator screenOptions={({ route }) => screenOptions(route, ORG_ICONS)}>
      <OrganizationTab.Screen name="Dashboard" component={OrganizationDashboardScreen} options={{ title: 'Home' }} />
      <OrganizationTab.Screen name="Profile"   component={OrganizationProfileScreen} />
      <OrganizationTab.Screen name="More"      component={OrganizationMoreScreen} />
    </OrganizationTab.Navigator>
  );
};

export const OrganizationNavigator: React.FC = () => (
  <OrganizationStack.Navigator screenOptions={{ headerShown: false }}>
    <OrganizationStack.Screen name="OrganizationTabs" component={OrganizationTabs} />
    <OrganizationStack.Screen
      name="EditProfile"
      component={OrganizationEditProfileScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
    />
  </OrganizationStack.Navigator>
);