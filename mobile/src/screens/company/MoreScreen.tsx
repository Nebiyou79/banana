/**
 * src/screens/company/MoreScreen.tsx
 * Updated with proper verification integration
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
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';
import { useLogout } from '../../hooks/useAuth';
import type { CompanyStackParamList } from '../../navigation/CompanyNavigator';
import { FONT_SIZE } from '../../theme/tokens';
import { useMyVerificationStatus } from '../../hooks/useVerification';
import { verificationService } from '../../services/verificationService';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

// ── Types ─────────────────────────────────────────────────────────────────────

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  iconColor: string;
  iconBg: string;
  screen?: keyof CompanyStackParamList;
  badge?: string;
  badgeColor?: string;
  danger?: boolean;
}

// ── Menu row ──────────────────────────────────────────────────────────────────

const MenuRow: React.FC<{
  item: MenuItem;
  isLast: boolean;
  onPress: () => void;
  colors: any;
}> = ({ item, isLast, onPress, colors }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[
      mr.row,
      !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    ]}
  >
    <View style={[mr.iconBubble, { backgroundColor: item.iconBg }]}>
      <Ionicons name={item.icon} size={18} color={item.iconColor} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={[mr.label, { color: item.danger ? colors.danger : colors.text }]}>
        {item.label}
      </Text>
      {item.sublabel ? (
        <Text style={[mr.sublabel, { color: colors.textMuted }]}>
          {item.sublabel}
        </Text>
      ) : null}
    </View>

    {item.badge ? (
      <View style={[mr.badge, { backgroundColor: item.badgeColor ?? colors.primary }]}>
        <Text style={[mr.badgeText, { color: colors.textInverse }]}>{item.badge}</Text>
      </View>
    ) : null}

    <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
  </TouchableOpacity>
);

const mr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: FONT_SIZE.base ?? 14, fontWeight: '500' },
  sublabel: { fontSize: 12, marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginRight: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
});

// ── Section wrapper ───────────────────────────────────────────────────────────

const MenuSection: React.FC<{
  title: string;
  items: MenuItem[];
  navigation: Nav;
  colors: any;
}> = ({ title, items, navigation, colors }) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={[ms.sectionLabel, { color: colors.textMuted }]}>{title}</Text>
    <View style={[ms.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {items.map((item, i) => (
        <MenuRow
          key={item.label}
          item={item}
          isLast={i === items.length - 1}
          onPress={() => item.screen && navigation.navigate(item.screen as any)}
          colors={colors}
        />
      ))}
    </View>
  </View>
);

const ms = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export const CompanyMoreScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const logout = useLogout();

  const { data: profile } = useProfile();
  const { data: verificationData } = useMyVerificationStatus();

  const vStatus = verificationData?.verificationStatus ?? 'none';
  const isVerified = vStatus === 'full';
  const isPartial = vStatus === 'partial';
  const badgeConfig = verificationService.getBadgeConfig(vStatus);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout.mutate() },
    ]);
  };

  // ── Menu config ─────────────────────────────────────────────────────────────

  const talentItems: MenuItem[] = [
    {
      icon: 'people-outline',
      label: 'Hire Freelancers',
      sublabel: 'Browse the freelancer marketplace',
      iconColor: colors.organization ?? '#7C3AED',
      iconBg: `${colors.organization ?? '#7C3AED'}18`,
      screen: 'FreelancerMarketplace',
    },
    {
      icon: 'bookmark-outline',
      label: 'Shortlist',
      sublabel: 'Your saved freelancers',
      iconColor: colors.freelancer ?? '#0D9488',
      iconBg: `${colors.freelancer ?? '#0D9488'}18`,
      screen: 'FreelancerShortlist',
    },
  ];

  const productItems: MenuItem[] = [
    {
      icon: 'cube-outline',
      label: 'My Products',
      sublabel: 'Manage your product catalogue',
      iconColor: colors.warning ?? '#F59E0B',
      iconBg: `${colors.warning ?? '#F59E0B'}18`,
      screen: 'CompanyProductList',
    },
    {
      icon: 'storefront-outline',
      label: 'Product Marketplace',
      sublabel: 'Browse all available products',
      iconColor: colors.success ?? '#10B981',
      iconBg: `${colors.success ?? '#10B981'}18`,
      screen: 'ProductMarketplace',
    },
    {
      icon: 'bookmark-outline',
      label: 'Saved Products',
      sublabel: 'Products you bookmarked',
      iconColor: colors.info ?? '#3B82F6',
      iconBg: `${colors.info ?? '#3B82F6'}18`,
      screen: 'SavedProducts',
    },
  ];

  const verificationItems: MenuItem[] = [
    {
      icon: 'shield-checkmark-outline',
      label: 'Verification Status',
      sublabel: isVerified
        ? 'Your company is fully verified ✓'
        : isPartial
        ? 'Partially verified — complete remaining steps'
        : 'Get verified to build trust with freelancers',
      iconColor: isVerified ? (colors.success ?? '#10B981') : (colors.warning ?? '#F59E0B'),
      iconBg: isVerified ? `${colors.success ?? '#10B981'}18` : `${colors.warning ?? '#F59E0B'}18`,
      screen: 'RoleVerification',
      badge: isVerified ? 'Verified' : isPartial ? 'Partial' : 'Verify',
      badgeColor: isVerified ? colors.success : colors.warning,
    },
    ...(!isVerified
      ? [{
          icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
          label: 'Request Verification',
          sublabel: 'Submit your verification documents',
          iconColor: colors.primary,
          iconBg: `${colors.primary}18`,
          screen: 'RequestVerification' as keyof CompanyStackParamList,
        }]
      : []),
  ];

  const rewardsItems: MenuItem[] = [
    {
      icon: 'gift-outline',
      label: 'Referrals & Rewards',
      sublabel: 'Invite others and earn rewards',
      iconColor: colors.danger ?? '#EF4444',
      iconBg: `${colors.danger ?? '#EF4444'}18`,
      screen: 'Referral',
    },
    {
      icon: 'trophy-outline',
      label: 'Leaderboard',
      sublabel: 'See where your company ranks',
      iconColor: colors.warning ?? '#F59E0B',
      iconBg: `${colors.warning ?? '#F59E0B'}18`,
      screen: 'Leaderboard',
    },
  ];

  const avatarUri = profile?.avatar?.secure_url;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[s.topHeader, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[s.topHeaderTitle, { color: colors.text }]}>More</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {/* ── Profile card ──────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => navigation.navigate('EditProfile')}
          style={[s.profileCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          activeOpacity={0.8}
        >
          <View style={[s.avatar, { backgroundColor: `${colors.primary}20` }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.avatarImg} />
            ) : (
              <Ionicons name="business" size={22} color={colors.primary} />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[s.profileName, { color: colors.text }]} numberOfLines={1}>
              {user?.name ?? 'Company'}
            </Text>
            <Text style={[s.profileEmail, { color: colors.textMuted }]} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
          </View>

          <View style={[s.editPill, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
            <Text style={[s.editPillText, { color: colors.primary }]}>Edit</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 16 }} />

        {/* ── Verification Banner ───────────────────────────────────────── */}
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
                Complete verification to access premium features
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={badgeConfig.color} />
          </TouchableOpacity>
        )}

        {/* ── Sections ──────────────────────────────────────────────────── */}
        <MenuSection title="Talent" items={talentItems} navigation={navigation} colors={colors} />
        <MenuSection title="Products" items={productItems} navigation={navigation} colors={colors} />
        <MenuSection title="Verification" items={verificationItems} navigation={navigation} colors={colors} />
        <MenuSection title="Rewards" items={rewardsItems} navigation={navigation} colors={colors} />

        {/* ── Sign out ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[s.signOutBtn, { backgroundColor: colors.bgCard, borderColor: `${colors.danger}40` }]}
          activeOpacity={0.75}
        >
          <View style={[s.signOutIcon, { backgroundColor: `${colors.danger}15` }]}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          </View>
          <Text style={[s.signOutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[s.version, { color: colors.textMuted }]}>v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1 },
  topHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
    justifyContent: 'center',
  },
  topHeaderTitle: {
    fontSize: FONT_SIZE.lg ?? 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  profileName: { fontSize: FONT_SIZE.md ?? 16, fontWeight: '700' },
  profileEmail: { fontSize: 13, marginTop: 1 },
  editPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  editPillText: { fontSize: 13, fontWeight: '700' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  signOutIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: FONT_SIZE.base ?? 14,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
  },
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

export default CompanyMoreScreen;