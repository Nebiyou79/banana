/**
 * screens/candidate/MoreScreen.tsx
 * Updated with proper verification integration and role-specific screens
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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';
import { useLogout } from '../../hooks/useAuth';
import { initials } from '../../theme/text';
import type { CandidateStackParamList } from '../../navigation/CandidateNavigator';
import { useMyVerificationStatus } from '../../hooks/useVerification';
import { verificationService, getUserId } from '../../services/verificationService';

type Nav = NativeStackNavigationProp<CandidateStackParamList>;

// ─── Profile Hero Card ────────────────────────────────────────────────────────

interface HeroProps {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  completion?: number;
  onEdit: () => void;
  colors: any;
}

const ProfileHeroCard: React.FC<HeroProps> = React.memo(
  ({ name, email, avatarUrl, completion = 0, onEdit, colors: c }) => (
    <TouchableOpacity
      onPress={onEdit}
      activeOpacity={0.85}
      style={[hero.card, { backgroundColor: c.bgCard, borderColor: c.border }]}
    >
      {/* Avatar */}
      <View style={hero.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={hero.avatar} />
        ) : (
          <View style={[hero.avatarFallback, { backgroundColor: c.candidate }]}>
            <Text style={hero.initials}>{initials(name)}</Text>
          </View>
        )}
        <View style={[hero.onlineDot, { borderColor: c.bgCard }]} />
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
          <View style={[hero.rolePill, { backgroundColor: c.candidate + '18' }]}>
            <View style={[hero.roleDot, { backgroundColor: c.candidate }]} />
            <Text style={[hero.roleText, { color: c.candidate }]}>Candidate</Text>
          </View>
          <Text style={{ fontSize: 11, color: c.textMuted }}>{completion}% complete</Text>
        </View>
      </View>

      {/* Edit icon */}
      <View style={[hero.editBtn, { backgroundColor: c.bg }]}>
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
  avatarWrap: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarFallback: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '800', fontSize: 20 },
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
  name: { fontSize: 16, fontWeight: '800' },
  email: { fontSize: 12, marginTop: 2 },
  rolePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, gap: 4 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 11, fontWeight: '700' },
  editBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});

// ─── Menu item shape ──────────────────────────────────────────────────────────

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  color: string;
  screen?: keyof CandidateStackParamList;
  badge?: string;
  badgeColor?: string;
}

// ─── Section renderer ─────────────────────────────────────────────────────────

const MenuSection: React.FC<{
  title: string;
  items: MenuItem[];
  navigation: Nav;
}> = ({ title, items, navigation }) => {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={[ms.secLabel, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[ms.list, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
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
              <View style={[ms.badge, { backgroundColor: (item.badgeColor ?? item.color) + '20' }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: item.badgeColor ?? item.color }}>
                  {item.badge}
                </Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export const CandidateMoreScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const logout = useLogout();

  const { data: profile } = useProfile();
  const { data: verificationData } = useMyVerificationStatus();

  const avatarUrl = profile?.avatar?.secure_url ?? null;
  const completion = profile?.profileCompletion?.percentage ?? 0;

  const vStatus = verificationData?.verificationStatus ?? 'none';
  const isVerified = vStatus === 'full';
  const isPartial = vStatus === 'partial';
  const badgeConfig = verificationService.getBadgeConfig(vStatus);

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
      label: 'Verification Status',
      sublabel: isVerified
        ? 'Fully verified ✓'
        : isPartial
        ? 'Partially verified — complete remaining steps'
        : 'Get verified to boost trust with employers',
      color: isVerified ? '#10B981' : isPartial ? '#F59E0B' : colors.warning,
      screen: 'RoleVerification',
      badge: isVerified ? 'Verified' : isPartial ? 'Partial' : 'Verify',
      badgeColor: isVerified ? '#10B981' : '#F59E0B',
    },
    ...(!isVerified
      ? [{
          icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
          label: 'Request Verification',
          sublabel: 'Submit your verification documents',
          color: colors.primary,
          screen: 'RequestVerification' as keyof CandidateStackParamList,
        }]
      : []),
  ];

  const rewardsSection: MenuItem[] = [
    {
      icon: 'gift-outline',
      label: 'Referrals and Rewards',
      sublabel: 'Invite friends, earn reward points',
      color: '#F59E0B',
      screen: 'Referral',
    },
    {
      icon: 'trophy-outline',
      label: 'Leaderboard',
      sublabel: 'See top referrers',
      color: '#F59E0B',
      screen: 'Leaderboard',
    },
  ];

  const shopSection: MenuItem[] = [
    {
      icon: 'storefront-outline',
      label: 'Product Marketplace',
      sublabel: 'Browse products and services',
      color: '#10B981',
      screen: 'ProductMarketplace',
    },
  ];

// src/screens/candidate/MoreScreen.tsx (UPDATED)
// Add the missing screen navigations for notifications and settings

// Update the accountSection to include proper navigation:
const accountSection: MenuItem[] = [
  {
    icon: 'notifications-outline',
    label: 'Notifications',
    sublabel: 'View all your notifications',
    color: colors.primary,
    screen: 'Notifications', // ✅ Added
  },
  {
    icon: 'settings-outline',
    label: 'Notification Preferences',
    sublabel: 'Manage alerts and preferences',
    color: colors.primary,
    screen: 'NotificationPreferences', // ✅ Added
  },
  {
    icon: 'lock-closed-outline',
    label: 'Privacy and Security',
    sublabel: 'Manage your privacy and security settings',
    color: colors.primary,
    screen: 'PrivacySecurity', // ✅ Added
  },
];

// Update the supportSection to include proper navigation:
const supportSection: MenuItem[] = [
  { 
    icon: 'help-circle-outline', 
    label: 'Help and FAQ', 
    sublabel: 'Get answers to common questions',
    color: colors.textMuted,
    screen: 'HelpFAQ', // ✅ Added
  },
  { 
    icon: 'mail-outline', 
    label: 'Contact Us', 
    sublabel: 'Reach out to our support team',
    color: colors.textMuted,
    // No screen - will use Linking
  },
  { 
    icon: 'document-text-outline', 
    label: 'Terms and Privacy', 
    sublabel: 'Read our terms and privacy policy',
    color: colors.textMuted,
    // No screen - will use WebView or Linking
  },
];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
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
      />

      {/* ── Verification Badge Banner ────────────────────── */}
      {!isVerified && (
        <TouchableOpacity
          onPress={() => navigation.navigate('RoleVerification')}
          style={[styles.verifyBanner, { backgroundColor: badgeConfig.bgColor, borderColor: badgeConfig.color }]}
        >
          <Ionicons name={badgeConfig.icon} size={24} color={badgeConfig.color} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: '700', color: badgeConfig.color }}>
              {badgeConfig.label}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Complete your verification to unlock more opportunities
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={badgeConfig.color} />
        </TouchableOpacity>
      )}

      {/* ── Menu sections ────────────────────────────────── */}
      <MenuSection title="CV Tools" items={cvSection} navigation={navigation} />
      <MenuSection title="Verification" items={verificationSection} navigation={navigation} />
      <MenuSection title="Rewards" items={rewardsSection} navigation={navigation} />
      <MenuSection title="Marketplace" items={shopSection} navigation={navigation} />
      <MenuSection title="Account" items={accountSection} navigation={navigation} />
      <MenuSection title="Support" items={supportSection} navigation={navigation} />

      {/* ── Sign out ──────────────────────────────────────── */}
      <TouchableOpacity
        onPress={handleLogout}
        disabled={logout.isPending}
        activeOpacity={0.8}
        style={[ms.signOutBtn, { borderColor: colors.danger + '40', backgroundColor: colors.danger + '08' }]}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={{ color: colors.danger, fontSize: 14, fontWeight: '700', marginLeft: 8 }}>
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

const ms = StyleSheet.create({
  secLabel: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  list: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  icon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, marginRight: 4 },
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

const styles = StyleSheet.create({
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
});