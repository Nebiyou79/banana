/**
 * screens/candidate/MoreScreen.tsx
 *
 * Candidate "More" hub.
 * Updated: profile hero card matches DashboardScreen.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons }     from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useThemeStore }        from '../../store/themeStore';
import { useAuthStore }         from '../../store/authStore';
import { useProfile, useVerificationStatus } from '../../hooks/useProfile';
import { useLogout }            from '../../hooks/useAuth';
import type { CandidateStackParamList } from '../../navigation/CandidateNavigator';

type Nav = NativeStackNavigationProp<CandidateStackParamList>;

const ACCENT = '#F59E0B';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name?: string) =>
  (name ?? 'C')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// ─── Profile Hero Card (same design as Dashboard) ─────────────────────────────

interface HeroProps {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  completion?: number;
  onEdit: () => void;
  colors: any;
  typography: any;
}

const ProfileHeroCard: React.FC<HeroProps> = React.memo(
  ({ name, email, avatarUrl, completion = 0, onEdit, colors: c }) => (
    <TouchableOpacity
      onPress={onEdit}
      activeOpacity={0.85}
      style={[hero.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      {/* Avatar */}
      <View style={hero.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={hero.avatar} />
        ) : (
          <View style={[hero.avatarFallback, { backgroundColor: ACCENT }]}>
            <Text style={hero.initials}>{getInitials(name)}</Text>
          </View>
        )}
        <View style={[hero.onlineDot, { borderColor: c.card }]} />
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={[hero.name, { color: c.text }]} numberOfLines={1}>
          {name ?? 'Candidate'}
        </Text>
        <Text style={[hero.email, { color: c.textMuted }]} numberOfLines={1}>
          {email ?? ''}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <View style={[hero.rolePill, { backgroundColor: ACCENT + '18' }]}>
            <View style={[hero.roleDot, { backgroundColor: ACCENT }]} />
            <Text style={[hero.roleText, { color: ACCENT }]}>Candidate</Text>
          </View>
          <Text style={{ fontSize: 11, color: c.textMuted }}>{completion}% complete</Text>
        </View>
      </View>

      {/* Edit icon */}
      <View style={[hero.editBtn, { backgroundColor: c.background ?? c.bgPrimary }]}>
        <Ionicons name="pencil-outline" size={15} color={c.textMuted} />
      </View>
    </TouchableOpacity>
  ),
);

const hero = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 28,
  },
  avatarWrap:     { position: 'relative' },
  avatar:         { width: 60, height: 60, borderRadius: 30 },
  avatarFallback: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  initials:       { color: '#fff', fontWeight: '800', fontSize: 20 },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },
  name:     { fontSize: 16, fontWeight: '800' },
  email:    { fontSize: 12, marginTop: 2 },
  rolePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, gap: 4 },
  roleDot:  { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 11, fontWeight: '700' },
  editBtn:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});

// ─── Menu item shape ─────────────────────────────────────────────────────────

interface MenuItem {
  icon:      keyof typeof Ionicons.glyphMap;
  label:     string;
  sublabel?: string;
  color:     string;
  screen?:   keyof CandidateStackParamList;
  badge?:    string;
}

// ─── Section renderer ─────────────────────────────────────────────────────────

const MenuSection: React.FC<{
  title: string;
  items: MenuItem[];
  navigation: Nav;
}> = ({ title, items, navigation }) => {
  const { theme } = useThemeStore();
  const { colors } = theme;

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={[ms.secLabel, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[ms.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[
              ms.item,
              i < items.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={() => item.screen && navigation.navigate(item.screen as any)}
            activeOpacity={0.7}
          >
            <View style={[ms.icon, { backgroundColor: item.color + '18' }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
                {item.label}
              </Text>
              {item.sublabel ? (
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>
                  {item.sublabel}
                </Text>
              ) : null}
            </View>
            {item.badge ? (
              <View style={[ms.badge, { backgroundColor: ACCENT + '20' }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: ACCENT }}>{item.badge}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export const CandidateMoreScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors } = theme;
  const { user }   = useAuthStore();
  const navigation = useNavigation<Nav>();
  const logout     = useLogout();

  const { data: profile }      = useProfile();
  const { data: verification } = useVerificationStatus();

  const avatarUrl  = profile?.avatar?.secure_url ?? null;
  const completion = profile?.profileCompletion?.percentage ?? 0;

  const vStatus    = verification?.verificationStatus ?? 'none';
  const isVerified = vStatus === 'full';
  const isPartial  = vStatus === 'partial';

  const handleLogout = () =>
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout.mutate() },
    ]);

  // ── Menu sections ─────────────────────────────────────────────────────────

  const cvSection: MenuItem[] = [
    {
      icon: 'document-text-outline',
      label: 'CV Generator',
      sublabel: 'Generate a professional CV from your profile',
      color: '#6366F1',
      screen: 'CvTemplates',
    },
    {
      icon: 'albums-outline',
      label: 'My Generated CVs',
      sublabel: 'View, download or regenerate CVs',
      color: '#6366F1',
      screen: 'GeneratedCVs',
    },
  ];

  const verificationSection: MenuItem[] = [
    {
      icon: 'shield-checkmark-outline',
      label: 'Verification',
      sublabel: isVerified
        ? 'Fully verified ✓'
        : isPartial
        ? 'Partially verified — continue'
        : 'Get verified to boost trust',
      color: isVerified ? '#10B981' : ACCENT,
      screen: 'VerificationStatus',
      badge: isVerified ? 'Verified' : isPartial ? 'Partial' : undefined,
    },
  ];

  const rewardsSection: MenuItem[] = [
    {
      icon: 'gift-outline',
      label: 'Referrals & Rewards',
      sublabel: 'Invite friends, earn reward points',
      color: ACCENT,
      screen: 'Referral',
    },
    {
      icon: 'trophy-outline',
      label: 'Leaderboard',
      sublabel: 'See top referrers',
      color: ACCENT,
      screen: 'Leaderboard',
    },
  ];

  const shopSection: MenuItem[] = [
    {
      icon: 'storefront-outline',
      label: 'Product Marketplace',
      sublabel: 'Browse products & services',
      color: '#10B981',
      screen: 'ProductMarketplace',
    },
  ];

  const accountSection: MenuItem[] = [
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      sublabel: 'Manage alerts & preferences',
      color: colors.primary,
    },
    {
      icon: 'lock-closed-outline',
      label: 'Privacy & Security',
      color: colors.primary,
    },
  ];

  const supportSection: MenuItem[] = [
    { icon: 'help-circle-outline',  label: 'Help & FAQ',       color: '#64748B' },
    { icon: 'mail-outline',         label: 'Contact Us',        color: '#64748B' },
    { icon: 'document-text-outline',label: 'Terms & Privacy',   color: '#64748B' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.banana ?? colors.background }}
      contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile hero card ────────────────────────────── */}
      <ProfileHeroCard
        name={user?.name}
        email={user?.email}
        avatarUrl={avatarUrl}
        completion={completion}
        onEdit={() => navigation.navigate('EditProfile')}
        colors={colors}
        typography={null}
      />

      {/* ── Menu sections ────────────────────────────────── */}
      <MenuSection title="CV Tools"     items={cvSection}           navigation={navigation} />
      <MenuSection title="Verification" items={verificationSection} navigation={navigation} />
      <MenuSection title="Rewards"      items={rewardsSection}      navigation={navigation} />
      <MenuSection title="Marketplace"  items={shopSection}         navigation={navigation} />
      <MenuSection title="Account"      items={accountSection}      navigation={navigation} />
      <MenuSection title="Support"      items={supportSection}      navigation={navigation} />

      {/* ── Sign out ──────────────────────────────────────── */}
      <TouchableOpacity
        onPress={handleLogout}
        disabled={logout.isPending}
        activeOpacity={0.8}
        style={[ms.signOutBtn, { borderColor: '#EF444440', backgroundColor: '#EF444408' }]}
      >
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '700', marginLeft: 8 }}>
          {logout.isPending ? 'Signing out…' : 'Sign Out'}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 16 }}>
        v1.0.0 · Candidate
      </Text>
    </ScrollView>
  );
};

export default CandidateMoreScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  secLabel: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  list:     { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  item:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  icon:     { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, marginRight: 4 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
});