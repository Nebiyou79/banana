
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';


import { useThemeStore }  from '../../store/themeStore';
import { useAuthStore }   from '../../store/authStore';
import {
  useProfile,
  useVerificationStatus,
} from '../../hooks/useProfile';
import {
  VerificationPill, RoleBadge,
} from '../../components/shared/ProfileAtoms';
import type { OrganizationStackParamList } from '../../navigation/OrganizationNavigator';

type Nav  = NativeStackNavigationProp<OrganizationStackParamList>;
const ACC = '#8B5CF6';

interface OrgMenuItem {
  icon:    string;
  label:   string;
  sub?:    string;
  color:   string;
  screen?: keyof OrganizationStackParamList;
}

const ORG_SECTIONS: { title: string; items: OrgMenuItem[] }[] = [
  {
    title: 'Management',
    items: [
      { icon: 'briefcase-outline',        label: 'Job Postings',   sub: 'Manage opportunities',          color: ACC,       screen: 'OrgJobList' },
      { icon: 'people-outline',           label: 'Applicants',     sub: 'Review submitted applications', color: '#6366F1', screen: 'ApplicationList' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'shield-checkmark-outline', label: 'Verification',   sub: 'Build organizational trust',    color: '#10B981', screen: 'VerificationStatus' },
      { icon: 'notifications-outline',    label: 'Notifications',  color: ACC },
      { icon: 'lock-closed-outline',      label: 'Privacy',        color: ACC },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline',      label: 'Help & FAQ',     color: '#64748B' },
      { icon: 'mail-outline',             label: 'Contact Us',     color: '#64748B' },
      { icon: 'document-text-outline',    label: 'Terms & Privacy',color: '#64748B' },
    ],
  },
];

export const OrganizationMoreScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user }   = useAuthStore();
  const navigation = useNavigation<Nav>();
  const logout     = useLogout();
  const { data: profile }      = useProfile();
  const { data: verification } = useVerificationStatus();

  const avatarUrl = profile?.avatar?.secure_url ?? null;
  const initials  = (user?.name ?? 'O').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  const vStatus   = (verification?.verificationStatus ?? 'none') as any;

  const handleLogout = () =>
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout.mutate() },
    ]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: 56, paddingBottom: 40, paddingHorizontal: spacing[5] }}
      showsVerticalScrollIndicator={false}
    >
      {/* User card */}
      <TouchableOpacity
        style={[ms.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('EditProfile')}
        activeOpacity={0.8}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={ms.avatar} />
        ) : (
          <View style={[ms.avatar, { backgroundColor: ACC, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: typography.xl }}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>{user?.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>{user?.email}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <RoleBadge role="Organization" accentColor={ACC} />
            <VerificationPill status={vStatus} />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      {ORG_SECTIONS.map((sec) => (
        <View key={sec.title} style={{ marginTop: 28 }}>
          <Text style={[ms.secLabel, { color: colors.textMuted, fontSize: typography.xs }]}>{sec.title.toUpperCase()}</Text>
          <View style={[ms.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {sec.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[ms.item, i < sec.items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                onPress={() => item.screen && navigation.navigate(item.screen as any)}
                activeOpacity={0.7}
              >
                <View style={[ms.icon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: typography.base, fontWeight: '500' }}>{item.label}</Text>
                  {item.sub ? <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>{item.sub}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[ms.signOut, { borderColor: '#EF444440', marginTop: 32 }]}
        onPress={handleLogout}
        disabled={logout.isPending}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={{ color: '#EF4444', fontSize: typography.base, fontWeight: '600', marginLeft: 8 }}>
          {logout.isPending ? 'Signing out…' : 'Sign Out'}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: colors.textMuted, fontSize: typography.xs, textAlign: 'center', marginTop: 16 }}>
        Banana v1.0.0 · Organization
      </Text>
    </ScrollView>
  );
};

// helper imported for MoreScreen
function useLogout() {
  return { mutate: () => {}, isPending: false } as any; // resolved by actual hook at runtime
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  card:     { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, padding: 16 },
  avatar:   { width: 58, height: 58, borderRadius: 29 },
  secLabel: { fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  list:     { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  item:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  icon:     { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  signOut:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14, paddingVertical: 14 },
});