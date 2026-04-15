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
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';
import { useVerificationStatus } from '../../hooks/useProfile';
import { useLogout } from '../../hooks/useAuth';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;

// ─── Menu item type ───────────────────────────────────────────────────────────

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  color: string;
  screen?: keyof FreelancerStackParamList;
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
}

// ─── Section component ────────────────────────────────────────────────────────

const MenuSection: React.FC<{ title: string; items: MenuItem[] }> = ({ title, items }) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();

  return (
    <View style={{ marginBottom: spacing[5] }}>
      <Text style={[fs.sectionLabel, { color: colors.textMuted, fontSize: typography.xs }]}>
        {title}
      </Text>
      <View style={[fs.menuBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {items.map((item, i) => {
          const handlePress = () => {
            if (item.onPress) {
              item.onPress();
            } else if (item.screen) {
              // Type-safe navigation — screens without params
              navigation.navigate(item.screen as any);
            }
          };

          return (
            <TouchableOpacity
              key={item.label}
              onPress={handlePress}
              activeOpacity={0.7}
              style={[
                fs.menuItem,
                i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              {/* Icon */}
              <View style={[fs.menuIcon, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>

              {/* Labels */}
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

              {/* Badge */}
              {item.badge && (
                <View style={[fs.badge, { backgroundColor: (item.badgeColor ?? item.color) + '20' }]}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: item.badgeColor ?? item.color }}>
                    {item.badge}
                  </Text>
                </View>
              )}

              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const FreelancerMoreScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const logout = useLogout();

  const { data: profile } = useProfile();
  const { data: verification } = useVerificationStatus();

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar;
  const initials = (user?.name ?? 'F')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isVerified = verification?.verificationStatus === 'full';
  const isPartial  = verification?.verificationStatus === 'partial';

  const handleLogout = () =>
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout.mutate() },
    ]);

  // ── Menu sections ────────────────────────────────────────────────────────────

  const workSection: MenuItem[] = [
    {
      icon: 'images-outline',
      label: 'My Portfolio',
      sublabel: 'Manage projects & work samples',
      color: '#10B981',
      screen: 'PortfolioList',
    },
    {
      icon: 'briefcase-outline',
      label: 'My Services',
      sublabel: 'Manage offered services & pricing',
      color: '#10B981',
      screen: 'ServicesList',
    },
    {
      icon: 'ribbon-outline',
      label: 'Certifications',
      sublabel: 'Add professional credentials',
      color: '#10B981',
      screen: 'CertificationsList',
    },
  ];

  const profileSection: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      sublabel: 'Update your info & preferences',
      color: '#6366F1',
      screen: 'EditProfile',
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Verification',
      sublabel: isVerified
        ? 'Fully verified ✓'
        : isPartial
          ? 'Partially verified — continue'
          : 'Get verified to build trust',
      color: isVerified ? '#10B981' : '#F59E0B',
      screen: 'VerificationStatus',
      badge: isVerified ? 'Verified' : isPartial ? 'Partial' : 'Unverified',
      badgeColor: isVerified ? '#10B981' : isPartial ? '#F59E0B' : '#EF4444',
    },
    {
      icon: 'gift-outline',
      label: 'Referrals & Rewards',
      sublabel: 'Invite friends, earn points',
      color: '#F59E0B',
      screen: 'Referral',
    },
  ];

  const supportSection: MenuItem[] = [
    {
      icon: 'storefront-outline',
      label: 'Shop / Marketplace',
      sublabel: 'Browse products & services',
      color: colors.primary,
      screen: 'ProductMarketplace',
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      sublabel: 'Manage alerts & preferences',
      color: colors.primary,
      onPress: () => {
        // Placeholder — wire to NotificationsScreen when built
        Alert.alert('Coming Soon', 'Notifications screen is under construction.');
      },
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & FAQ',
      sublabel: 'Get support and answers',
      color: colors.primary,
      onPress: () => {
        Alert.alert('Coming Soon', 'Help center is under construction.');
      },
    },
    {
      icon: 'document-text-outline',
      label: 'Terms & Privacy',
      sublabel: 'Read our policies',
      color: colors.primary,
      onPress: () => {
        Alert.alert('Coming Soon', 'Terms & Privacy screen is under construction.');
      },
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing[4], paddingTop: 56, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── User Card ─────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => navigation.navigate('EditProfile')}
        activeOpacity={0.85}
        style={[fs.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={fs.avatar} />
        ) : (
          <View style={[fs.avatar, { backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: typography.lg }}>
              {initials}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }} numberOfLines={1}>
            {user?.name ?? 'Freelancer'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm, marginTop: 1 }} numberOfLines={1}>
            {user?.email ?? ''}
          </Text>
          <View style={[fs.rolePill, { backgroundColor: '#10B981' + '18', marginTop: 5 }]}>
            <View style={[fs.roleDot, { backgroundColor: '#10B981' }]} />
            <Text style={{ color: '#10B981', fontSize: typography.xs, fontWeight: '700' }}>
              Freelancer
            </Text>
          </View>
        </View>

        {/* Edit arrow */}
        <View style={[fs.editArrow, { backgroundColor: colors.background }]}>
          <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* ── Sections ──────────────────────────────────────────────── */}
      <MenuSection title="WORK"    items={workSection} />
      <MenuSection title="PROFILE" items={profileSection} />
      <MenuSection title="GENERAL" items={supportSection} />

      {/* ── Sign Out ──────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={handleLogout}
        disabled={logout.isPending}
        activeOpacity={0.8}
        style={[fs.signOutBtn, { borderColor: '#EF4444' + '40', backgroundColor: '#EF444408' }]}
      >
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={{ color: '#EF4444', fontSize: typography.base, fontWeight: '700', marginLeft: 8 }}>
          {logout.isPending ? 'Signing out…' : 'Sign Out'}
        </Text>
      </TouchableOpacity>

      {/* ── App version ───────────────────────────────────────────── */}
      <Text style={{ color: colors.textMuted, fontSize: typography.xs, textAlign: 'center', marginTop: 16 }}>
        Banana v1.0.0 · Freelancer
      </Text>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const fs = StyleSheet.create({
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    flexShrink: 0,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    gap: 4,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  editArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuBlock: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    marginRight: 4,
  },
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