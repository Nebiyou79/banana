// src/navigation/TendersNavigator.tsx
/**
 * src/navigation/TendersNavigator.tsx
 *
 * FIX: Professional Tenders now has its own fully isolated navigator stack.
 * When the "Pro" tab is pressed from the main Tenders bottom tabs, the app
 * pushes a NEW stack screen (CompanyProfTendersEntry / OrgProfTendersEntry)
 * that contains its own bottom tab navigator. Tabs within that navigator
 * only navigate within themselves; the "Back" tab calls navigation.goBack()
 * to pop back to the main Tenders home — NOT navigate() which was causing
 * the jump back to the outer role navigator.
 *
 * A ProfessionalTendersSplashScreen is shown when entering Pro Tenders.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useThemeStore } from '../store/themeStore';

// ── Owner: professional tender screens ───────────────────────────────────────
import MyProfessionalTendersScreen from '../screens/company/professionalTenders/MyProfessionalTendersScreen';
import { CreateProfessionalTenderScreen } from '../screens/company/professionalTenders/CreateProfessionalTenderScreen';
import { EditProfessionalTenderScreen } from '../screens/company/professionalTenders/EditProfessionalTenderScreen';
import { AddendumScreen } from '../screens/company/professionalTenders/AddendumScreen';
import ProfessionalTenderDetailScreen from '../screens/company/professionalTenders/ProfessionalTenderDetailScreen';

// ── Owner: incoming bids on their own professional tenders ────────────────────
import { IncomingBidsScreen } from '../screens/company/bids/IncomingBidsScreen';
import { OwnerBidDetailScreen } from '../screens/company/bids/OwnerBidDetailScreen';

// ── Bidder: browse & bid on professional tenders (company only) ───────────────
import { MyBidsScreen } from '../screens/company/bids/MyBidsScreen';
import { MyBidDetailScreen } from '../screens/company/bids/MyBidDetailScreen';
import BrowseProfessionalTendersScreen from '../screens/company/professionalTenders/BrowseProfessionalTendersScreen';
import BrowseProfessionalTenderDetailScreen from '../screens/company/professionalTenders/BrowseProfessionalTenderDetailScreen';
import SavedTendersScreen from '../screens/company/professionalTenders/SavedTendersScreen';
import SubmitBidScreen from '../screens/company/bids/SubmitBidScreen';

// ── Freelance tender screens ──────────────────────────────────────────────────
import CompanyMyTendersScreen from '../screens/company/freelanceTenders/CompanyMyTendersScreen';
import CompanyTenderDetailScreen from '../screens/company/freelanceTenders/CompanyTenderDetailScreen';
import FreelanceTenderCreateScreen from '../screens/company/freelanceTenders/FreelanceTenderCreateScreen';
import FreelanceTenderEditScreen from '../screens/company/freelanceTenders/FreelanceTenderEditScreen';

// ── Proposal screens (received on freelance tenders) ─────────────────────────
import { TenderProposalsScreen } from '../screens/company/proposals/TenderProposalsScreen';
import { ProposalStatsScreen } from '../screens/company/proposals/ProposalStatsScreen';
import { CompanyProposalDetailScreen } from '../screens/company/proposals/ProposalDetailScreen';

// ── Splash + Home ─────────────────────────────────────────────────────────────
import { TendersSplashScreen } from '../screens/tenders/TendersSplashScreen';
import { TendersHomeScreen } from '../screens/tenders/TendersHomeScreen';
import { CategoryPickerScreen } from '../screens/tenders/CategoryPickerScreen';
import { CompanyInvitePickerScreen } from '../screens/tenders/CompanyInvitePickerScreen';

import { TendersPlaceholder } from '../screens/tenders/placeholders/TendersPlaceholder';

// ═════════════════════════════════════════════════════════════════════════════
//  PARAM LISTS
// ═════════════════════════════════════════════════════════════════════════════

export type TendersStackParamList = {
  TendersSplash: undefined;
  TendersHome: undefined;
};

export type TendersBottomTabParamList = {
  Home: undefined;
  FreelanceTenders: undefined;
  ProfessionalTenders: undefined;
  Proposals: undefined;
  Bids: undefined;
  Back: undefined;
};

// ── Freelance tenders ─────────────────────────────────────────────────────────
export type FreelanceTendersTopTabParamList = {
  MyFreelanceTenders: undefined;
  CreateFreelanceTender: undefined;
};

export type FreelanceTendersStackParamList = {
  FreelanceTendersTabs: undefined;
  CompanyTenderDetail: { tenderId: string };
  CompanyTenderEdit: { tenderId: string };
  CompanyTenderApplicants: { tenderId: string };
};

// ── Professional Tenders entry stacks ────────────────────────────────────────
// Each role has:  ProfSplash → ProfBottomTabs  (+ detail screens)

export type CompanyProfTendersEntryStackParamList = {
  ProfSplash: undefined;
  ProfBottomTabs: undefined;
  ProfessionalTenderDetail: { tenderId: string };
  EditProfessionalTender: { tenderId: string };
  AddendumScreen: { tenderId: string };
  IncomingBids: { tenderId: string };
  OwnerBidDetail: { bidId: string; tenderId: string };
  BrowseProfessionalTenderDetail: { tenderId: string };
  SubmitBid: { tenderId: string };
  ProposalStats: { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
  TenderProposals: { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
  ProposalDetail: { proposalId: string; tenderId: string; role: 'company' | 'organization' };
  CategoryPicker: { current?: string; onPick: (v: string) => void };
  CompanyInvitePicker: { selectedIds: string[]; onPick: (ids: string[]) => void };
};

export type OrgProfTendersEntryStackParamList = {
  ProfSplash: undefined;
  ProfBottomTabs: undefined;
  ProfessionalTenderDetail: { tenderId: string };
  EditProfessionalTender: { tenderId: string };
  AddendumScreen: { tenderId: string };
  IncomingBids: { tenderId: string };
  OwnerBidDetail: { bidId: string; tenderId: string };
  ProposalStats: { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
  TenderProposals: { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
  ProposalDetail: { proposalId: string; tenderId: string; role: 'company' | 'organization' };
  CategoryPicker: { current?: string; onPick: (v: string) => void };
  CompanyInvitePicker: { selectedIds: string[]; onPick: (ids: string[]) => void };
};

// ── Professional Tenders bottom tab param lists ───────────────────────────────
export type CompanyProfTendersBottomTabParamList = {
  MyProfTenders: undefined;
  CreateProfTender: undefined;
  BrowseProfTenders: undefined;
  SavedProfTenders: undefined;
  ProfBack: undefined;
};

export type OrgProfTendersBottomTabParamList = {
  MyProfTenders: undefined;
  CreateProfTender: undefined;
  SavedProfTenders: undefined;
  ProfBack: undefined;
};

// ── Proposals ─────────────────────────────────────────────────────────────────
export type ProposalsStackParamList = {
  ProposalsList: undefined;
  TenderProposals: { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
  ProposalDetail: { proposalId: string; tenderId: string; role: 'company' | 'organization' };
  ProposalStats: { tenderId: string; tenderTitle: string; role: 'company' | 'organization' };
};

// ── Bids ──────────────────────────────────────────────────────────────────────
export type CompanyBidsTopTabParamList = {
  ReceivedBids: undefined;
  MyBids: undefined;
};

export type CompanyBidsStackParamList = {
  BidsTabs: undefined;
  IncomingBidsDetail: { tenderId: string };
  OwnerBidDetail: { bidId: string; tenderId: string };
  MyBidDetail: { bidId: string; tenderId: string };
};

export interface TendersNavigatorProps {
  userRole: 'company' | 'organization';
}

// ═════════════════════════════════════════════════════════════════════════════
//  NAVIGATOR FACTORIES
// ═════════════════════════════════════════════════════════════════════════════

const Stack = createNativeStackNavigator<TendersStackParamList>();

// Main Tenders bottom tabs (Home / Freelance / Pro / Proposals / Bids / Back)
const BottomTab = createBottomTabNavigator<TendersBottomTabParamList>();

const FreelanceTopTab = createMaterialTopTabNavigator<FreelanceTendersTopTabParamList>();
const FreelanceStack = createNativeStackNavigator<FreelanceTendersStackParamList>();

// Isolated Professional Tenders entry stacks (one per role)
const CompanyProfEntryStack = createNativeStackNavigator<CompanyProfTendersEntryStackParamList>();
const OrgProfEntryStack = createNativeStackNavigator<OrgProfTendersEntryStackParamList>();

// Isolated Professional Tenders bottom tabs (one per role)
const CompanyProfBottomTab = createBottomTabNavigator<CompanyProfTendersBottomTabParamList>();
const OrgProfBottomTab = createBottomTabNavigator<OrgProfTendersBottomTabParamList>();

const ProposalsStack = createNativeStackNavigator<ProposalsStackParamList>();

const CompanyBidsTopTab = createMaterialTopTabNavigator<CompanyBidsTopTabParamList>();
const CompanyBidsStack = createNativeStackNavigator<CompanyBidsStackParamList>();

// ═════════════════════════════════════════════════════════════════════════════
//  STYLE HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function topTabScreenOptions(isDark: boolean) {
  const primary = isDark ? '#F1BB03' : '#B45309';
  const muted = isDark ? '#64748B' : '#94A3B8';
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  return {
    tabBarActiveTintColor: primary,
    tabBarInactiveTintColor: muted,
    tabBarIndicatorStyle: { backgroundColor: primary, height: 3, borderRadius: 2 },
    tabBarStyle: { backgroundColor: surface, elevation: 0, shadowOpacity: 0 },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '700' as const, textTransform: 'none' as const },
    tabBarScrollEnabled: true,
  };
}

function stackScreenOptions(isDark: boolean) {
  return {
    headerStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
    headerTintColor: isDark ? '#F1F5F9' : '#0F172A',
    headerTitleStyle: { fontWeight: '700' as const },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  PROFESSIONAL TENDERS SPLASH SCREEN
// ═════════════════════════════════════════════════════════════════════════════

function ProfessionalTendersSplashScreen() {
  const navigation = useNavigation<any>();
  const isDark = useThemeStore((s) => s.theme.isDark);

  // Animations
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer loop
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Entrance sequence
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // PRO badge bounces
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Subtitle fades
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Hold briefly then navigate
      Animated.delay(900),
    ]).start(() => {
      navigation.replace('ProfBottomTabs');
    });
  }, []);

  const bgColor = isDark ? '#0A0F1E' : '#F8FAFF';
  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const gold = '#F1BB03';
  const goldDark = '#B45309';
  const goldActive = isDark ? gold : goldDark;

  return (
    <View style={[splashStyles.container, { backgroundColor: bgColor }]}>
      {/* Radial glow behind logo */}
      <View style={splashStyles.glowRing} />

      {/* Logo */}
      <Animated.View
        style={[
          splashStyles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={[splashStyles.logoCard, { backgroundColor: cardBg }]}>
          <Image
            source={require('../../assets/tenderlogo.png')}
            style={splashStyles.logo}
            resizeMode="contain"
          />
        </View>

        {/* PRO badge */}
        <Animated.View
          style={[
            splashStyles.proBadge,
            { backgroundColor: goldActive, transform: [{ scale: badgeScale }] },
          ]}
        >
          <Text style={splashStyles.proBadgeText}>PRO</Text>
        </Animated.View>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        style={[
          splashStyles.title,
          {
            color: isDark ? '#F1F5F9' : '#0F172A',
            opacity: titleOpacity,
            transform: [{ translateY: titleY }],
          },
        ]}
      >
        Professional Tenders
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text
        style={[
          splashStyles.subtitle,
          {
            color: isDark ? '#94A3B8' : '#64748B',
            opacity: subtitleOpacity,
          },
        ]}
      >
        Enterprise-grade procurement,{'\n'}bids & contracts
      </Animated.Text>

      {/* Divider line with gold */}
      <Animated.View
        style={[
          splashStyles.divider,
          { backgroundColor: goldActive, opacity: subtitleOpacity },
        ]}
      />

      {/* Feature pills */}
      <Animated.View style={[splashStyles.pillRow, { opacity: subtitleOpacity }]}>
        {['Tenders', 'Bids', 'Addenda', 'Stats'].map((label) => (
          <View
            key={label}
            style={[
              splashStyles.pill,
              {
                backgroundColor: isDark
                  ? 'rgba(241,187,3,0.15)'
                  : 'rgba(180,83,9,0.08)',
                borderColor: isDark
                  ? 'rgba(241,187,3,0.3)'
                  : 'rgba(180,83,9,0.2)',
              },
            ]}
          >
            <Text style={[splashStyles.pillText, { color: goldActive }]}>
              {label}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  glowRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(241,187,3,0.06)',
    top: '30%',
    alignSelf: 'center',
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 28,
  },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F1BB03',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    width: 72,
    height: 72,
  },
  proBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  divider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    marginBottom: 20,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

// ═════════════════════════════════════════════════════════════════════════════
//  SIMPLE TAB BAR
// ═════════════════════════════════════════════════════════════════════════════

interface TabConfig {
  icon: string;
  iconActive: string;
  label: string;
  accentDark: string;
  accentLight: string;
}

const MAIN_TAB_CONFIG: Record<string, TabConfig> = {
  Home: { icon: 'home-outline', iconActive: 'home', label: 'Home', accentDark: '#60A5FA', accentLight: '#2563EB' },
  FreelanceTenders: { icon: 'people-outline', iconActive: 'people', label: 'Freelance', accentDark: '#34D399', accentLight: '#059669' },
  ProfessionalTenders: { icon: 'briefcase-outline', iconActive: 'briefcase', label: 'Pro', accentDark: '#F1BB03', accentLight: '#B45309' },
  Proposals: { icon: 'document-text-outline', iconActive: 'document-text', label: 'Proposals', accentDark: '#D8B4FE', accentLight: '#7C3AED' },
  Bids: { icon: 'trending-up-outline', iconActive: 'trending-up', label: 'Bids', accentDark: '#FDBA74', accentLight: '#EA580C' },
  Back: { icon: 'arrow-back-outline', iconActive: 'arrow-back', label: 'Back', accentDark: '#64748B', accentLight: '#475569' },
};

const PROF_TAB_CONFIG: Record<string, TabConfig> = {
  MyProfTenders: { icon: 'briefcase-outline', iconActive: 'briefcase', label: 'My Tenders', accentDark: '#34D399', accentLight: '#059669' },
  CreateProfTender: { icon: 'add-circle-outline', iconActive: 'add-circle', label: 'Create', accentDark: '#60A5FA', accentLight: '#2563EB' },
  BrowseProfTenders: { icon: 'search-outline', iconActive: 'search', label: 'Browse', accentDark: '#F1BB03', accentLight: '#B45309' },
  SavedProfTenders: { icon: 'bookmark-outline', iconActive: 'bookmark', label: 'Saved', accentDark: '#D8B4FE', accentLight: '#7C3AED' },
  ProfBack: { icon: 'arrow-back-outline', iconActive: 'arrow-back', label: 'Back', accentDark: '#64748B', accentLight: '#475569' },
};

/**
 * Generic tab bar. Pass the correct configMap for the navigator.
 */
function makeTabBar(
  configMap: Record<string, TabConfig>,
  onBack?: () => void,
) {
  return function TabBarComponent({ state, navigation }: any) {
    const isDark = useThemeStore((s) => s.theme.isDark);
    const insets = useSafeAreaInsets();

    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          paddingTop: 8,
          paddingBottom: insets.bottom + 4,
        }}
      >
        {state.routes.map((route: any, idx: number) => {
          const focused = state.index === idx;
          const config = configMap[route.name];
          if (!config) return null;
          const accent = isDark ? config.accentDark : config.accentLight;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                if (route.name === 'Back' || route.name === 'ProfBack') {
                  if (onBack) {
                    onBack();
                  } else {
                    navigation.goBack();
                  }
                  return;
                }
                if (!focused) navigation.navigate(route.name);
              }}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={config.label}
            >
              <Ionicons
                name={(focused ? config.iconActive : config.icon) as any}
                size={22}
                color={focused ? accent : isDark ? '#64748B' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: focused ? accent : isDark ? '#64748B' : '#94A3B8',
                    fontWeight: focused ? '700' : '500',
                  },
                ]}
              >
                {config.label}
              </Text>
              {focused && (
                <View
                  style={[styles.activeDot, { backgroundColor: accent }]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };
}

const styles = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
    minHeight: 52,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
});

// ═════════════════════════════════════════════════════════════════════════════
//  NAMED WRAPPERS
// ═════════════════════════════════════════════════════════════════════════════

function TendersBackPlaceholder() { return null; }
function TendersHomeCompany() { return <TendersHomeScreen userRole="company" />; }
function TendersHomeOrg() { return <TendersHomeScreen userRole="organization" />; }

function AllProposalsPlaceholder() {
  return (
    <TendersPlaceholder
      title="All Proposals"
      description="View proposals across all your freelance tenders in one place."
      icon="documents-outline"
      module="Proposals Module"
    />
  );
}

function OrgReceivedBidsTab() {
  return (
    <TendersPlaceholder
      title="Received Bids"
      description="Bids submitted on your professional tenders appear here."
      icon="trending-up-outline"
      module="Bids Module"
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 1 — FREELANCE TENDERS
// ═════════════════════════════════════════════════════════════════════════════

function FreelanceTendersTopTabs() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface }}>
      <FreelanceTopTab.Navigator screenOptions={topTabScreenOptions(isDark)}>
        <FreelanceTopTab.Screen name="MyFreelanceTenders" component={CompanyMyTendersScreen} options={{ title: 'My Tenders' }} />
        <FreelanceTopTab.Screen name="CreateFreelanceTender" component={FreelanceTenderCreateScreen} options={{ title: 'Create' }} />
      </FreelanceTopTab.Navigator>
    </SafeAreaView>
  );
}

function FreelanceTendersInner() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <FreelanceStack.Navigator screenOptions={stackScreenOptions(isDark)}>
      <FreelanceStack.Screen name="FreelanceTendersTabs" component={FreelanceTendersTopTabs} options={{ headerShown: false }} />
      <FreelanceStack.Screen name="CompanyTenderDetail" component={CompanyTenderDetailScreen} options={{ title: 'Tender Details' }} />
      <FreelanceStack.Screen name="CompanyTenderEdit" component={FreelanceTenderEditScreen} options={{ title: 'Edit Tender' }} />
      <FreelanceStack.Screen name="CompanyTenderApplicants" component={CompanyTenderDetailScreen} options={{ title: 'Applicants' }} />
    </FreelanceStack.Navigator>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 2 — PROFESSIONAL TENDERS
//  Each role's entry is a fully self-contained stack:
//    ProfSplash (auto-navigates) → ProfBottomTabs → detail screens
//  The ProfBack tab calls navigation.goBack() on this stack, returning to
//  the main Tenders bottom tabs — NOT to the outer role navigator.
// ═════════════════════════════════════════════════════════════════════════════

// ── Company ───────────────────────────────────────────────────────────────────

const CompanyProfTabBar = makeTabBar(PROF_TAB_CONFIG);

function CompanyProfBottomTabs() {
  return (
    <CompanyProfBottomTab.Navigator
      initialRouteName="MyProfTenders"
      tabBar={(props) => <CompanyProfTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <CompanyProfBottomTab.Screen name="MyProfTenders" component={MyProfessionalTendersScreen} />
      <CompanyProfBottomTab.Screen name="CreateProfTender" component={CreateProfessionalTenderScreen} />
      <CompanyProfBottomTab.Screen name="BrowseProfTenders" component={BrowseProfessionalTendersScreen} />
      <CompanyProfBottomTab.Screen name="SavedProfTenders" component={SavedTendersScreen} />
      <CompanyProfBottomTab.Screen name="ProfBack" component={TendersBackPlaceholder} />
    </CompanyProfBottomTab.Navigator>
  );
}

/**
 * Isolated entry stack for Company Professional Tenders.
 * Rendered as a screen inside the main Tenders BottomTab navigator.
 * ProfSplash auto-replaces itself with ProfBottomTabs.
 * ProfBack calls navigation.goBack() on this stack → returns to main Tenders tabs.
 */
function CompanyProfessionalTendersEntry() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <CompanyProfEntryStack.Navigator
      initialRouteName="ProfSplash"
      screenOptions={{ headerShown: false }}
    >
      <CompanyProfEntryStack.Screen
        name="ProfSplash"
        component={ProfessionalTendersSplashScreen}
      />
      <CompanyProfEntryStack.Screen
        name="ProfBottomTabs"
        component={CompanyProfBottomTabs}
      />
      <CompanyProfEntryStack.Screen
        name="ProfessionalTenderDetail"
        component={ProfessionalTenderDetailScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Tender Details', headerShown: true }}
      />
      <CompanyProfEntryStack.Screen
        name="EditProfessionalTender"
        component={EditProfessionalTenderScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Edit Tender', headerShown: true }}
      />
      <CompanyProfEntryStack.Screen
        name="AddendumScreen"
        component={AddendumScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Addenda', headerShown: true }}
      />
      <CompanyProfEntryStack.Screen
        name="IncomingBids"
        component={IncomingBidsScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Incoming Bids', headerShown: true }}
      />
      <CompanyProfEntryStack.Screen
        name="OwnerBidDetail"
        component={OwnerBidDetailScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Bid Detail', headerShown: true }}
      />
      <CompanyProfEntryStack.Screen
        name="BrowseProfessionalTenderDetail"
        component={BrowseProfessionalTenderDetailScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Tender Details', headerShown: true }}
      />
      <CompanyProfEntryStack.Screen
        name="SubmitBid"
        component={SubmitBidScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Submit Bid', headerShown: true }}
      />
      <CompanyProfEntryStack.Screen
        name="ProposalStats"
        component={ProposalStatsScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Proposal Statistics', headerShown: true }}
      />
      <CompanyProfEntryStack.Screen
        name="TenderProposals"
        component={TenderProposalsScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Proposals', headerShown: true }}
      />
      <CompanyProfEntryStack.Screen
        name="ProposalDetail"
        component={CompanyProposalDetailScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Proposal Detail', headerShown: true }}
      />
      <CompanyProfEntryStack.Screen
        name="CategoryPicker"
        component={CategoryPickerScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Choose Category', presentation: 'modal', headerShown: true }}
      />
      <CompanyProfEntryStack.Screen
        name="CompanyInvitePicker"
        component={CompanyInvitePickerScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Invite Companies', presentation: 'modal', headerShown: true }}
      />
    </CompanyProfEntryStack.Navigator>
  );
}

// ── Organization ──────────────────────────────────────────────────────────────

// Org has no BrowseProfTenders — reuse same PROF_TAB_CONFIG but only register relevant screens
const OrgProfTabBar = makeTabBar(PROF_TAB_CONFIG);

function OrgProfBottomTabs() {
  return (
    <OrgProfBottomTab.Navigator
      initialRouteName="MyProfTenders"
      tabBar={(props) => <OrgProfTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <OrgProfBottomTab.Screen name="MyProfTenders" component={MyProfessionalTendersScreen} />
      <OrgProfBottomTab.Screen name="CreateProfTender" component={CreateProfessionalTenderScreen} />
      <OrgProfBottomTab.Screen name="SavedProfTenders" component={SavedTendersScreen} />
      <OrgProfBottomTab.Screen name="ProfBack" component={TendersBackPlaceholder} />
    </OrgProfBottomTab.Navigator>
  );
}

/**
 * Isolated entry stack for Organization Professional Tenders.
 */
function OrgProfessionalTendersEntry() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <OrgProfEntryStack.Navigator
      initialRouteName="ProfSplash"
      screenOptions={{ headerShown: false }}
    >
      <OrgProfEntryStack.Screen
        name="ProfSplash"
        component={ProfessionalTendersSplashScreen}
      />
      <OrgProfEntryStack.Screen
        name="ProfBottomTabs"
        component={OrgProfBottomTabs}
      />
      <OrgProfEntryStack.Screen
        name="ProfessionalTenderDetail"
        component={ProfessionalTenderDetailScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Tender Details', headerShown: true }}
      />
      <OrgProfEntryStack.Screen
        name="EditProfessionalTender"
        component={EditProfessionalTenderScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Edit Tender', headerShown: true }}
      />
      <OrgProfEntryStack.Screen
        name="AddendumScreen"
        component={AddendumScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Addenda', headerShown: true }}
      />
      <OrgProfEntryStack.Screen
        name="IncomingBids"
        component={IncomingBidsScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Incoming Bids', headerShown: true }}
      />
      <OrgProfEntryStack.Screen
        name="OwnerBidDetail"
        component={OwnerBidDetailScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Bid Detail', headerShown: true }}
      />
      <OrgProfEntryStack.Screen
        name="ProposalStats"
        component={ProposalStatsScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Proposal Statistics', headerShown: true }}
      />
      <OrgProfEntryStack.Screen
        name="TenderProposals"
        component={TenderProposalsScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Proposals', headerShown: true }}
      />
      <OrgProfEntryStack.Screen
        name="ProposalDetail"
        component={CompanyProposalDetailScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Proposal Detail', headerShown: true }}
      />
      <OrgProfEntryStack.Screen
        name="CategoryPicker"
        component={CategoryPickerScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Choose Category', presentation: 'modal', headerShown: true }}
      />
      <OrgProfEntryStack.Screen
        name="CompanyInvitePicker"
        component={CompanyInvitePickerScreen}
        options={{ ...stackScreenOptions(isDark), title: 'Invite Companies', presentation: 'modal', headerShown: true }}
      />
    </OrgProfEntryStack.Navigator>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 3 — PROPOSALS
// ═════════════════════════════════════════════════════════════════════════════

function ProposalsInner() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <ProposalsStack.Navigator screenOptions={stackScreenOptions(isDark)}>
      <ProposalsStack.Screen name="ProposalsList" component={AllProposalsPlaceholder} options={{ headerShown: false }} />
      <ProposalsStack.Screen name="TenderProposals" component={TenderProposalsScreen} options={{ title: 'Proposals' }} />
      <ProposalsStack.Screen name="ProposalDetail" component={CompanyProposalDetailScreen} options={{ title: 'Proposal Detail' }} />
      <ProposalsStack.Screen name="ProposalStats" component={ProposalStatsScreen} options={{ title: 'Statistics' }} />
    </ProposalsStack.Navigator>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB 4 — BIDS (COMPANY ONLY)
// ═════════════════════════════════════════════════════════════════════════════

function ReceivedBidsEntryScreen() {
  return <MyProfessionalTendersScreen />;
}

function CompanyBidsTopTabs() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const surface = isDark ? '#1E293B' : '#FFFFFF';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface }}>
      <CompanyBidsTopTab.Navigator screenOptions={topTabScreenOptions(isDark)}>
        <CompanyBidsTopTab.Screen name="ReceivedBids" component={ReceivedBidsEntryScreen} options={{ title: 'Received' }} />
        <CompanyBidsTopTab.Screen name="MyBids" component={MyBidsScreen} options={{ title: 'My Bids' }} />
      </CompanyBidsTopTab.Navigator>
    </SafeAreaView>
  );
}

function CompanyBidsInner() {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <CompanyBidsStack.Navigator screenOptions={stackScreenOptions(isDark)}>
      <CompanyBidsStack.Screen name="BidsTabs" component={CompanyBidsTopTabs} options={{ headerShown: false }} />
      <CompanyBidsStack.Screen name="IncomingBidsDetail" component={IncomingBidsScreen} options={{ title: 'Incoming Bids' }} />
      <CompanyBidsStack.Screen name="OwnerBidDetail" component={OwnerBidDetailScreen} options={{ title: 'Bid Detail' }} />
      <CompanyBidsStack.Screen name="MyBidDetail" component={MyBidDetailScreen} options={{ title: 'My Bid' }} />
    </CompanyBidsStack.Navigator>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN TENDERS BOTTOM TAB SETS
// ═════════════════════════════════════════════════════════════════════════════

const MainTendersTabBar = makeTabBar(MAIN_TAB_CONFIG);

function CompanyBottomTabs() {
  return (
    <BottomTab.Navigator
      tabBar={(props) => <MainTendersTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <BottomTab.Screen name="Home" component={TendersHomeCompany} />
      <BottomTab.Screen name="FreelanceTenders" component={FreelanceTendersInner} />
      {/*
        ProfessionalTenders now renders CompanyProfessionalTendersEntry which is a
        fully isolated stack. Navigating between tabs inside that stack does NOT
        affect this BottomTab navigator at all.
      */}
      <BottomTab.Screen name="ProfessionalTenders" component={CompanyProfessionalTendersEntry} />
      <BottomTab.Screen name="Proposals" component={ProposalsInner} />
      <BottomTab.Screen name="Bids" component={CompanyBidsInner} />
      <BottomTab.Screen name="Back" component={TendersBackPlaceholder} />
    </BottomTab.Navigator>
  );
}

function OrgBottomTabs() {
  return (
    <BottomTab.Navigator
      tabBar={(props) => <MainTendersTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <BottomTab.Screen name="Home" component={TendersHomeOrg} />
      <BottomTab.Screen name="FreelanceTenders" component={FreelanceTendersInner} />
      <BottomTab.Screen name="ProfessionalTenders" component={OrgProfessionalTendersEntry} />
      <BottomTab.Screen name="Proposals" component={ProposalsInner} />
      <BottomTab.Screen name="Bids" component={OrgReceivedBidsTab} />
      <BottomTab.Screen name="Back" component={TendersBackPlaceholder} />
    </BottomTab.Navigator>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  ROOT WRAPPERS & EXPORT
// ═════════════════════════════════════════════════════════════════════════════

function CompanyTendersHome() { return <CompanyBottomTabs />; }
function OrgTendersHome() { return <OrgBottomTabs />; }

const TendersNavigator: React.FC<TendersNavigatorProps> = ({ userRole }) => {
  const HomeComponent = userRole === 'company' ? CompanyTendersHome : OrgTendersHome;
  return (
    <Stack.Navigator initialRouteName="TendersSplash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TendersSplash" component={TendersSplashScreen} />
      <Stack.Screen name="TendersHome" component={HomeComponent} />
    </Stack.Navigator>
  );
};

export default TendersNavigator;