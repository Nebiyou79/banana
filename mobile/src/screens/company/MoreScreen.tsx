/**
 * mobile/src/screens/company/MoreScreen.tsx
 *
 * Fixes:
 *  - Company own products → 'CompanyProductList' (not 'Products' or 'ProductList')
 *  - Public marketplace   → 'ProductMarketplace'
 *  - Saved products       → 'SavedProducts'
 *  - All other existing menu items preserved
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
import { useThemeStore }                from '../../store/themeStore';
import { useAuthStore }                 from '../../store/authStore';
import { useProfile, useVerificationStatus } from '../../hooks/useProfile';
import { useLogout }                    from '../../hooks/useAuth';
import type { CompanyStackParamList }   from '../../navigation/CompanyNavigator';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

const ACCENT = '#3B82F6';

interface MenuItem {
  icon:       keyof typeof Ionicons.glyphMap;
  label:      string;
  sublabel?:  string;
  color:      string;
  screen?:    keyof CompanyStackParamList;
  badge?:     string;
  badgeColor?: string;
}

// ── Section component ──────────────────────────────────────────────────────────

const MenuSection: React.FC<{
  title:      string;
  items:      MenuItem[];
  navigation: Nav;
}> = ({ title, items, navigation }) => {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;

  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={[
          ms.secLabel,
          { color: colors.textMuted, fontSize: typography.xs },
        ]}
      >
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          ms.list,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
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
            <View
              style={[ms.icon, { backgroundColor: item.color + '18' }]}
            >
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: typography.base,
                  fontWeight: '500',
                }}
              >
                {item.label}
              </Text>
              {item.sublabel ? (
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: typography.xs,
                    marginTop: 1,
                  }}
                >
                  {item.sublabel}
                </Text>
              ) : null}
            </View>

            {item.badge ? (
              <View
                style={[
                  ms.badge,
                  { backgroundColor: item.badgeColor ?? ACCENT },
                ]}
              >
                <Text style={ms.badgeTxt}>{item.badge}</Text>
              </View>
            ) : null}

            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ── Screen ─────────────────────────────────────────────────────────────────────

export const CompanyMoreScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { theme }  = useThemeStore();
  const { colors, typography } = theme;
  const { user }   = useAuthStore();
  const logout     = useLogout();

  const { data: profile }      = useProfile();
  const { data: verification } = useVerificationStatus();

  const verificationBadge =
    verification === 'verified'
      ? undefined
      : verification === 'pending'
      ? 'Pending'
      : 'Verify';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout.mutate(),
      },
    ]);
  };

  // ── Menu data ────────────────────────────────────────────────────────────────

  const talentItems: MenuItem[] = [
    {
      icon:     'people-outline',
      label:    'Hire Freelancers',
      sublabel: 'Browse the freelancer marketplace',
      color:    '#8B5CF6',
      screen:   'FreelancerMarketplace',
    },
    {
      icon:     'bookmark-outline',
      label:    'Shortlist',
      sublabel: 'Your saved freelancers',
      color:    '#EC4899',
      screen:   'FreelancerShortlist',
    },
  ];

  // ── Product items — fixed route names ────────────────────────────────────────
  const productItems: MenuItem[] = [
    {
      icon:     'cube-outline',
      label:    'My Products',
      sublabel: 'Manage your product catalogue',
      color:    '#F59E0B',
      // ← Fixed: was 'Products' or 'ProductList' — now the correct registered route
      screen:   'CompanyProductList',
    },
    {
      icon:     'storefront-outline',
      label:    'Product Marketplace',
      sublabel: 'Browse all available products',
      color:    '#10B981',
      // ← Correct registered route for public marketplace
      screen:   'ProductMarketplace',
    },
    {
      icon:     'bookmark-outline',
      label:    'Saved Products',
      sublabel: 'Products you bookmarked',
      color:    '#3B82F6',
      // ← Correct registered route
      screen:   'SavedProducts',
    },
  ];

  const verificationItems: MenuItem[] = [
    {
      icon:      'shield-checkmark-outline',
      label:     'Verification',
      sublabel:  'View your verification status',
      color:     '#22C55E',
      screen:    'VerificationStatus',
      badge:     verificationBadge,
      badgeColor: '#F59E0B',
    },
    ...(verification !== 'approved'
      ? [{
          icon:    'document-text-outline' as keyof typeof Ionicons.glyphMap,
          label:   'Request Verification',
          color:   '#6366F1',
          screen:  'RequestVerification' as keyof CompanyStackParamList,
        }]
      : []),
  ];

  const rewardsItems: MenuItem[] = [
    {
      icon:   'gift-outline',
      label:  'Referrals & Rewards',
      color:  '#F97316',
      screen: 'Referral',
    },
    {
      icon:   'trophy-outline',
      label:  'Leaderboard',
      color:  '#EAB308',
      screen: 'Leaderboard',
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile card */}
      <TouchableOpacity
        onPress={() => navigation.navigate('EditProfile')}
        style={[
          ms.profileCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        activeOpacity={0.8}
      >
        <View
          style={[ms.avatar, { backgroundColor: ACCENT + '20' }]}
        >
          {profile?.avatar?.secure_url ? (
            <Image
              source={{ uri: profile.avatar.secure_url }}
              style={ms.avatarImg}
            />
          ) : (
            <Ionicons name="business" size={24} color={ACCENT} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: typography.lg,
              fontWeight: '700',
            }}
          >
            {user?.name ?? 'Company'}
          </Text>
          <Text
            style={{ color: colors.textMuted, fontSize: typography.sm }}
          >
            {user?.email ?? ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={{ height: 20 }} />

      <MenuSection
        title="Talent"
        items={talentItems}
        navigation={navigation}
      />
      <MenuSection
        title="Products"
        items={productItems}
        navigation={navigation}
      />
      <MenuSection
        title="Verification"
        items={verificationItems}
        navigation={navigation}
      />
      <MenuSection
        title="Rewards"
        items={rewardsItems}
        navigation={navigation}
      />

      {/* Sign out */}
      <TouchableOpacity
        onPress={handleLogout}
        style={[
          ms.signOutBtn,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={{ color: '#EF4444', fontSize: typography.base, fontWeight: '600' }}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const ms = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  secLabel: {
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  list: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 4,
  },
  badgeTxt: { fontSize: 10, fontWeight: '700', color: '#fff' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
});
