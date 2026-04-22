/**
 * screens/freelancer/MoreScreen.tsx
 * Updated to include MyReviews and use correct types.
 */
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useThemeStore }                     from '../../store/themeStore';
import { useAuthStore }                      from '../../store/authStore';
import { useProfile, useVerificationStatus } from '../../hooks/useProfile';
import { useLogout }                         from '../../hooks/useAuth';
import type { FreelancerStackParamList }     from '../../navigation/FreelancerNavigator';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;

const ACCENT = '#10B981';

interface MenuItem {
  icon:       keyof typeof Ionicons.glyphMap;
  label:      string;
  sublabel?:  string;
  color:      string;
  screen?:    keyof FreelancerStackParamList;
  badge?:     string;
  badgeColor?: string;
}

const MenuSection: React.FC<{
  title:      string;
  items:      MenuItem[];
  navigation: Nav;
}> = ({ title, items, navigation }) => {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={[ms.secLabel, { color: colors.textMuted, fontSize: typography.xs }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[ms.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
            <View style={[ms.icon, { backgroundColor: item.color + '18' }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: typography.base, fontWeight: '500' }}>
                {item.label}
              </Text>
              {item.sublabel && (
                <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginTop: 1 }}>
                  {item.sublabel}
                </Text>
              )}
            </View>
            {item.badge && (
              <View style={[ms.badge, { backgroundColor: (item.badgeColor ?? item.color) + '20' }]}>
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
};

export const FreelancerMoreScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user }   = useAuthStore();
  const navigation = useNavigation<Nav>();
  const logout     = useLogout();

  const { data: profile }      = useProfile();
  const { data: verification } = useVerificationStatus();

  const avatarUrl  = (profile as any)?.avatar?.secure_url ?? null;
  const initials   = (user?.name ?? 'F').split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
  const vStatus    = verification?.verificationStatus ?? 'none';
  const isVerified = vStatus === 'full';
  const isPartial  = vStatus === 'partial';

  const handleLogout = () =>
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout.mutate() },
    ]);

  const workSection: MenuItem[] = [
    { icon: 'images-outline', label: 'My Portfolio',     sublabel: 'Manage projects & work samples', color: ACCENT,    screen: 'PortfolioList' },
    { icon: 'briefcase-outline', label: 'My Services',   sublabel: 'Manage offered services & pricing', color: ACCENT, screen: 'ServicesList' },
    { icon: 'ribbon-outline', label: 'Certifications',   sublabel: 'Add professional credentials',    color: ACCENT,   screen: 'CertificationsList' },
    { icon: 'star-outline',   label: 'My Reviews',       sublabel: 'View ratings from clients',        color: '#F59E0B', screen: 'MyReviews' },
  ];

  const marketplaceSection: MenuItem[] = [
    { icon: 'people-outline', label: 'Find Freelancers', sublabel: 'Browse the freelancer marketplace', color: '#6366F1', screen: 'FreelancerMarketplace' },
  ];

  const verificationSection: MenuItem[] = [
    {
      icon: 'shield-checkmark-outline',
      label: 'Verification',
      sublabel: isVerified ? 'Fully verified ✓' : isPartial ? 'Partially verified — continue' : 'Get verified to build client trust',
      color: isVerified ? ACCENT : '#F59E0B',
      screen: 'VerificationStatus',
      badge: isVerified ? 'Verified' : isPartial ? 'Partial' : undefined,
      badgeColor: isVerified ? ACCENT : '#F59E0B',
    },
  ];

  const rewardsSection: MenuItem[] = [
    { icon: 'gift-outline',   label: 'Referrals & Rewards', sublabel: 'Invite friends, earn reward points', color: '#F59E0B', screen: 'Referral' },
    { icon: 'trophy-outline', label: 'Leaderboard',         sublabel: 'See top referrers',                  color: '#F59E0B', screen: 'Leaderboard' },
  ];

  const shopSection: MenuItem[] = [
    { icon: 'storefront-outline', label: 'Product Marketplace', sublabel: 'Browse products & services', color: colors.primary, screen: 'ProductMarketplace' },
  ];

  const accountSection: MenuItem[] = [
    { icon: 'notifications-outline', label: 'Notifications',     color: colors.primary },
    { icon: 'lock-closed-outline',   label: 'Privacy & Security', color: colors.primary },
  ];

  const supportSection: MenuItem[] = [
    { icon: 'help-circle-outline',   label: 'Help & FAQ',      color: '#64748B' },
    { icon: 'mail-outline',          label: 'Contact Us',      color: '#64748B' },
    { icon: 'document-text-outline', label: 'Terms & Privacy', color: '#64748B' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing[4], paddingTop: 56, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* User card */}
      <TouchableOpacity
        onPress={() => navigation.navigate('EditProfile')}
        activeOpacity={0.85}
        style={[ms.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={ms.avatar} />
        ) : (
          <View style={[ms.avatar, { backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: typography.lg }}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }} numberOfLines={1}>
            {user?.name ?? 'Freelancer'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm, marginTop: 1 }} numberOfLines={1}>
            {user?.email ?? ''}
          </Text>
          <View style={[ms.rolePill, { backgroundColor: ACCENT + '18', marginTop: 4 }]}>
            <View style={[ms.roleDot, { backgroundColor: ACCENT }]} />
            <Text style={{ color: ACCENT, fontSize: typography.xs, fontWeight: '700' }}>Freelancer</Text>
          </View>
        </View>
        <View style={[ms.editArrow, { backgroundColor: colors.background }]}>
          <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      <MenuSection title="Work"         items={workSection}         navigation={navigation} />
      <MenuSection title="Marketplace"  items={marketplaceSection}  navigation={navigation} />
      <MenuSection title="Verification" items={verificationSection} navigation={navigation} />
      <MenuSection title="Rewards"      items={rewardsSection}      navigation={navigation} />
      <MenuSection title="Shop"         items={shopSection}         navigation={navigation} />
      <MenuSection title="Account"      items={accountSection}      navigation={navigation} />
      <MenuSection title="Support"      items={supportSection}      navigation={navigation} />

      {/* Sign out */}
      <TouchableOpacity
        onPress={handleLogout}
        disabled={logout.isPending}
        activeOpacity={0.8}
        style={[ms.signOutBtn, { borderColor: '#EF444440', backgroundColor: '#EF444408' }]}
      >
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={{ color: '#EF4444', fontSize: typography.base, fontWeight: '700', marginLeft: 8 }}>
          {logout.isPending ? 'Signing out…' : 'Sign Out'}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: colors.textMuted, fontSize: typography.xs, textAlign: 'center', marginTop: 16 }}>
        Banana v1.0.0 · Freelancer
      </Text>
    </ScrollView>
  );
};

export default FreelancerMoreScreen;

const ms = StyleSheet.create({
  userCard:   { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 28 },
  avatar:     { width: 56, height: 56, borderRadius: 28, flexShrink: 0 },
  rolePill:   { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, gap: 4 },
  roleDot:    { width: 6, height: 6, borderRadius: 3 },
  editArrow:  { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  secLabel:   { fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  list:       { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  item:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  icon:       { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, marginRight: 4 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
});