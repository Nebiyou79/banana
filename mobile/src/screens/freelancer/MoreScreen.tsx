/**
 * screens/freelancer/MoreScreen.tsx
 * Updated with proper verification integration
 */

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { FONT_SIZE } from '../../theme/tokens';
import { initials as getInitials } from '../../theme/text';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';
import { useLogout } from '../../hooks/useAuth';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';
import { useMyVerificationStatus } from '../../hooks/useVerification';
import { verificationService } from '../../services/verificationService';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  color: string;
  screen?: keyof FreelancerStackParamList;
  badge?: string;
  badgeColor?: string;
}

const MenuSection: React.FC<{
  title: string;
  items: MenuItem[];
  navigation: Nav;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ title, items, navigation, colors }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={[ms.secLabel, { color: colors.textMuted, fontSize: FONT_SIZE.xs }]}>
      {title.toUpperCase()}
    </Text>
    <View style={[ms.list, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={item.label}
          style={[
            ms.item,
            i < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
          ]}
          onPress={() => item.screen && navigation.navigate(item.screen as any)}
          activeOpacity={0.7}
        >
          <View style={[ms.icon, { backgroundColor: withAlpha(item.color, 0.10) }]}>
            <Ionicons name={item.icon} size={18} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: FONT_SIZE.base, fontWeight: '500' }}>
              {item.label}
            </Text>
            {item.sublabel && (
              <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs, marginTop: 1 }}>
                {item.sublabel}
              </Text>
            )}
          </View>
          {item.badge && (
            <View style={[ms.badge, { backgroundColor: withAlpha(item.badgeColor ?? item.color, 0.12) }]}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: item.badgeColor ?? item.color }}>
                {item.badge}
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export const FreelancerMoreScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const logout = useLogout();

  const { data: profile } = useProfile();
  const { data: verificationData } = useMyVerificationStatus();

  const avatarUrl = (profile as any)?.avatar?.secure_url ?? null;
  const userInitials = getInitials(user?.name ?? 'F');
  const vStatus = verificationData?.verificationStatus ?? 'none';
  const isVerified = vStatus === 'full';
  const isPartial = vStatus === 'partial';
  const badgeConfig = verificationService.getBadgeConfig(vStatus);

  const handleLogout = () =>
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout.mutate() },
    ]);

  const workSection: MenuItem[] = [
    { icon: 'images-outline', label: 'My Portfolio', sublabel: 'Manage projects & work samples', color: colors.freelancer, screen: 'PortfolioList' },
    { icon: 'briefcase-outline', label: 'My Services', sublabel: 'Manage offered services & pricing', color: colors.freelancer, screen: 'ServicesList' },
    { icon: 'ribbon-outline', label: 'Certifications', sublabel: 'Add professional credentials', color: colors.freelancer, screen: 'CertificationsList' },
    { icon: 'star-outline', label: 'My Reviews', sublabel: 'View ratings from clients', color: colors.warning, screen: 'MyReviews' },
  ];

  const marketplaceSection: MenuItem[] = [
    { icon: 'people-outline', label: 'Find Freelancers', sublabel: 'Browse the freelancer marketplace', color: colors.organization, screen: 'FreelancerMarketplace' },
  ];

  const verificationSection: MenuItem[] = [
    {
      icon: 'shield-checkmark-outline',
      label: 'Verification Status',
      sublabel: isVerified
        ? 'Fully verified ✓'
        : isPartial
        ? 'Partially verified — continue'
        : 'Get verified to build client trust',
      color: isVerified ? colors.freelancer : colors.warning,
      screen: 'RoleVerification',
      badge: isVerified ? 'Verified' : isPartial ? 'Partial' : 'Verify',
      badgeColor: isVerified ? colors.freelancer : colors.warning,
    },
    ...(!isVerified
      ? [{
          icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
          label: 'Request Verification',
          sublabel: 'Submit your verification documents',
          color: colors.primary,
          screen: 'RequestVerification' as keyof FreelancerStackParamList,
        }]
      : []),
  ];

  const rewardsSection: MenuItem[] = [
    { icon: 'gift-outline', label: 'Referrals & Rewards', sublabel: 'Invite friends, earn reward points', color: colors.warning, screen: 'Referral' },
    { icon: 'trophy-outline', label: 'Leaderboard', sublabel: 'See top referrers', color: colors.warning, screen: 'Leaderboard' },
  ];

  const shopSection: MenuItem[] = [
    { icon: 'storefront-outline', label: 'Product Marketplace', sublabel: 'Browse products & services', color: colors.primary, screen: 'ProductMarketplace' },
  ];

// src/screens/freelancer/MoreScreen.tsx (UPDATED)
// Update accountSection and supportSection with proper navigation

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
    label: 'Privacy & Security', 
    sublabel: 'Manage your privacy and security settings',
    color: colors.primary,
    screen: 'PrivacySecurity', // ✅ Added
  },
];

const supportSection: MenuItem[] = [
  { 
    icon: 'help-circle-outline', 
    label: 'Help & FAQ', 
    sublabel: 'Get answers to common questions',
    color: colors.textMuted,
    screen: 'HelpFAQ', // ✅ Added
  },
  { 
    icon: 'mail-outline', 
    label: 'Contact Us', 
    sublabel: 'Reach out to our support team',
    color: colors.textMuted,
  },
  { 
    icon: 'document-text-outline', 
    label: 'Terms & Privacy', 
    sublabel: 'Read our terms and privacy policy',
    color: colors.textMuted,
  },
];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing.lg,
        paddingTop: insets.top + spacing.lg,
        paddingBottom: insets.bottom + spacing.xl,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* User card */}
      <TouchableOpacity
        onPress={() => navigation.navigate('EditProfile')}
        activeOpacity={0.85}
        style={[ms.userCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={ms.avatar} />
        ) : (
          <View style={[ms.avatar, { backgroundColor: colors.freelancer, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: FONT_SIZE.lg }}>{userInitials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.base }} numberOfLines={1}>
            {user?.name ?? 'Freelancer'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.sm, marginTop: 1 }} numberOfLines={1}>
            {user?.email ?? ''}
          </Text>
          <View style={[ms.rolePill, { backgroundColor: withAlpha(colors.freelancer, 0.10), marginTop: 4 }]}>
            <View style={[ms.roleDot, { backgroundColor: colors.freelancer }]} />
            <Text style={{ color: colors.freelancer, fontSize: FONT_SIZE.xs, fontWeight: '700' }}>Freelancer</Text>
          </View>
        </View>
        <View style={[ms.editArrow, { backgroundColor: colors.bg }]}>
          <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Verification Banner */}
      {!isVerified && (
        <TouchableOpacity
          onPress={() => navigation.navigate('RoleVerification')}
          style={[styles.verifyBanner, { backgroundColor: badgeConfig.bgColor, borderColor: badgeConfig.color, marginBottom: 20 }]}
        >
          <Ionicons name={badgeConfig.icon} size={24} color={badgeConfig.color} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: '700', color: badgeConfig.color }}>
              {badgeConfig.label}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Complete verification to get 3x more project invites
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={badgeConfig.color} />
        </TouchableOpacity>
      )}

      {/* Menu Sections */}
      <MenuSection title="Work" items={workSection} navigation={navigation} colors={colors} />
      <MenuSection title="Marketplace" items={marketplaceSection} navigation={navigation} colors={colors} />
      <MenuSection title="Verification" items={verificationSection} navigation={navigation} colors={colors} />
      <MenuSection title="Rewards" items={rewardsSection} navigation={navigation} colors={colors} />
      <MenuSection title="Shop" items={shopSection} navigation={navigation} colors={colors} />
      <MenuSection title="Account" items={accountSection} navigation={navigation} colors={colors} />
      <MenuSection title="Support" items={supportSection} navigation={navigation} colors={colors} />

      {/* Sign out */}
      <TouchableOpacity
        onPress={handleLogout}
        disabled={logout.isPending}
        activeOpacity={0.8}
        style={[ms.signOutBtn, { borderColor: withAlpha(colors.danger, 0.25), backgroundColor: withAlpha(colors.danger, 0.04) }]}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={{ color: colors.danger, fontSize: FONT_SIZE.base, fontWeight: '700', marginLeft: 8 }}>
          {logout.isPending ? 'Signing out…' : 'Sign Out'}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs, textAlign: 'center', marginTop: 16 }}>
        Banana v1.0.0 · Freelancer
      </Text>
    </ScrollView>
  );
};

export default FreelancerMoreScreen;

const ms = StyleSheet.create({
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 28 },
  avatar: { width: 56, height: 56, borderRadius: 28, flexShrink: 0 },
  rolePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, gap: 4 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  editArrow: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  secLabel: { fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  list: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  icon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, marginRight: 4 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
});

const styles = StyleSheet.create({
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
});