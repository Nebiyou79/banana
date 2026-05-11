/**
 * src/screens/shared/ProfileSetupScreen.tsx
 *
 * Shown immediately after login when a company or organization user
 * has no profile yet. Blocks all other navigation until setup is done.
 *
 * Auto-redirects to MainTabs if profile already exists (prevents getting stuck).
 *
 * Usage: mount as the initial stack screen in CompanyNavigator and
 * OrganizationNavigator, then skip it once the profile query resolves.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { FONT_SIZE } from '../../theme/tokens';

// Import gate hooks to check if profile now exists
import { useCompanyProfileGate, useOrganizationProfileGate } from '../../hooks/useProfileGate';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

interface ProfileSetupScreenProps {
  /** 'company' | 'organization' — drives copy and accent color */
  role: 'company' | 'organization';
  /** Route name to push when the user taps the CTA */
  setupRouteName: string;
}

// ─── Per-role config ──────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  company: {
    accent: '#3B82F6',
    icon: 'business' as keyof typeof Ionicons.glyphMap,
    headline: 'Set up your\ncompany profile',
    sub: 'You need a company profile before you can post jobs, create tenders, or appear in search.',
    ctaLabel: 'Create Company Profile',
    steps: [
      { icon: 'storefront-outline', title: 'Company identity', body: 'Name, industry, logo, and description.' },
      { icon: 'briefcase-outline',  title: 'Post jobs',        body: 'Attract candidates once your profile is live.' },
      { icon: 'shield-checkmark-outline', title: 'Get verified', body: 'Build trust with a verified badge.' },
    ] as Step[],
  },
  organization: {
    accent: '#8B5CF6',
    icon: 'people' as keyof typeof Ionicons.glyphMap,
    headline: 'Set up your\norganization profile',
    sub: 'You need an organization profile before you can post opportunities, create tenders, or connect with volunteers.',
    ctaLabel: 'Create Organization Profile',
    steps: [
      { icon: 'flag-outline',              title: 'Mission & identity', body: 'Name, type, logo, and your mission statement.' },
      { icon: 'hand-left-outline',         title: 'Post opportunities', body: 'Jobs, volunteer roles, and internships.' },
      { icon: 'shield-checkmark-outline',  title: 'Get verified',       body: 'Boost visibility and trust in the community.' },
    ] as Step[],
  },
} as const;

// ─── Step card ────────────────────────────────────────────────────────────────

const StepCard: React.FC<{ step: Step; index: number; accent: string; colors: any; delay: number }> = ({
  step, index, accent, colors, delay,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
      }}
    >
      <View style={[sc.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[sc.iconWrap, { backgroundColor: `${accent}14` }]}>
          <Ionicons name={step.icon} size={22} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sc.cardTitle, { color: colors.text }]}>{step.title}</Text>
          <Text style={[sc.cardBody, { color: colors.textMuted }]}>{step.body}</Text>
        </View>
        <View style={[sc.stepBadge, { backgroundColor: `${accent}14` }]}>
          <Text style={[sc.stepNum, { color: accent }]}>{index + 1}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ role, setupRouteName }) => {
  const { colors, spacing } = useTheme();
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const cfg = ROLE_CONFIG[role];

  // ── Auto-redirect if profile already exists ────────────────────────────
  // This prevents getting stuck on this screen after profile creation
  const companyGate = useCompanyProfileGate();
  const orgGate = useOrganizationProfileGate();
  
  const gate = role === 'company' ? companyGate : orgGate;

  useEffect(() => {
    if (!gate.isLoading && gate.hasProfile) {
      // Profile exists — go to main tabs immediately
      navigation.replace('MainTabs');
    }
  }, [gate.isLoading, gate.hasProfile, navigation]);

  // Hero animation
  const heroAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(heroAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // Don't render the setup screen if we're about to redirect
  if (gate.hasProfile) {
    return null;
  }

  return (
    <SafeAreaView style={[ps.root, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[ps.scroll, { paddingHorizontal: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero block */}
        <Animated.View
          style={[
            ps.hero,
            {
              opacity: heroAnim,
              transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
            },
          ]}
        >
          {/* Icon circle */}
          <View style={[ps.iconCircle, { backgroundColor: `${cfg.accent}12`, borderColor: `${cfg.accent}28` }]}>
            <Ionicons name={cfg.icon} size={40} color={cfg.accent} />
          </View>

          <Text style={[ps.greeting, { color: colors.textMuted }]}>
            Welcome, {user?.name?.split(' ')[0] ?? 'there'} 👋
          </Text>

          <Text style={[ps.headline, { color: colors.text }]}>{cfg.headline}</Text>

          <Text style={[ps.sub, { color: colors.textMuted }]}>{cfg.sub}</Text>
        </Animated.View>

        {/* Step cards */}
        <View style={ps.steps}>
          {cfg.steps.map((step, i) => (
            <StepCard
              key={step.title}
              step={step}
              index={i}
              accent={cfg.accent}
              colors={colors}
              delay={300 + i * 120}
            />
          ))}
        </View>

        {/* Info note */}
        <View style={[ps.note, { backgroundColor: `${cfg.accent}08`, borderColor: `${cfg.accent}22` }]}>
          <Ionicons name="information-circle-outline" size={16} color={cfg.accent} style={{ marginTop: 1 }} />
          <Text style={[ps.noteText, { color: colors.textMuted }]}>
            This only takes a few minutes. You can always update details later from your profile.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[ps.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[ps.cta, { backgroundColor: cfg.accent }]}
          onPress={() => navigation.navigate(setupRouteName)}
          activeOpacity={0.88}
        >
          <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
          <Text style={ps.ctaLabel}>{cfg.ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Convenience wrappers (no props needed in navigator) ─────────────────────

export const CompanyProfileSetupScreen: React.FC = () => (
  <ProfileSetupScreen role="company" setupRouteName="EditProfile" />
);

export const OrganizationProfileSetupScreen: React.FC = () => (
  <ProfileSetupScreen role="organization" setupRouteName="EditProfile" />
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const ps = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingTop: 32, paddingBottom: 120 },
  hero:   { alignItems: 'center', marginBottom: 36 },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  greeting:  { fontSize: FONT_SIZE.sm, fontWeight: '500', marginBottom: 10 },
  headline:  {
    fontSize: 30, fontWeight: '800', letterSpacing: -0.8,
    textAlign: 'center', marginBottom: 14, lineHeight: 36,
  },
  sub: {
    fontSize: FONT_SIZE.base, textAlign: 'center',
    lineHeight: 22, maxWidth: 320,
  },
  steps:     { gap: 12, marginBottom: 20 },
  note: {
    flexDirection: 'row', gap: 10, borderWidth: 1,
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  noteText:  { flex: 1, fontSize: FONT_SIZE.sm, lineHeight: 20 },
  footer: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 16,
  },
  ctaLabel: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '800' },
});

const sc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, borderWidth: 1, padding: 16,
  },
  iconWrap:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: 3 },
  cardBody:  { fontSize: FONT_SIZE.xs, lineHeight: 18 },
  stepBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepNum:   { fontSize: FONT_SIZE.xs, fontWeight: '800' },
});