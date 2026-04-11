import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import { useProfile, useVerificationStatus } from '../../hooks/useProfile';
import { useLogout } from '../../hooks/useAuth';
import type { CandidateStackParamList } from '../../navigation/CandidateNavigator';

type Nav = NativeStackNavigationProp<CandidateStackParamList>;
const ACCENT = '#F59E0B';

interface MoreItem {
  icon:      string;
  label:     string;
  sublabel?: string;
  color:     string;
  screen?:   keyof CandidateStackParamList;
}

export const CandidateMoreScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const logout = useLogout();
  const { data: profile } = useProfile();
  const { data: verification } = useVerificationStatus();

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar;
  const initials  = (user?.name ?? 'U').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  const vStatus   = verification?.verificationStatus ?? 'none';

  const sections: { title: string; items: MoreItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          icon: 'shield-checkmark-outline',
          label: 'Verification',
          sublabel: vStatus === 'full' ? 'Fully verified ✓' : vStatus === 'partial' ? 'Partially verified' : 'Get verified',
          color: vStatus === 'full' ? '#10B981' : ACCENT,
          screen: 'VerificationStatus',
        },
        { icon: 'notifications-outline', label: 'Notifications', color: ACCENT },
        { icon: 'lock-closed-outline',   label: 'Privacy',       color: ACCENT },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline',    label: 'Help & FAQ',      color: colors.primary },
        { icon: 'mail-outline',           label: 'Contact Us',      color: colors.primary },
        { icon: 'document-text-outline',  label: 'Terms & Privacy', color: colors.primary },
      ],
    },
  ];

  const handleLogout = () =>
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout.mutate() },
    ]);

  return (
    <ScrollView style={{ flex:1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing[5], paddingTop: 56 }} showsVerticalScrollIndicator={false}>
      {/* User card */}
      <View style={[s.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {avatarUrl
          ? <Image source={{ uri: avatarUrl }} style={s.avatar}/>
          : <View style={[s.avatar, { backgroundColor: ACCENT, alignItems:'center', justifyContent:'center' }]}><Text style={{ color:'#fff', fontWeight:'700', fontSize: typography.lg }}>{initials}</Text></View>
        }
        <View style={{ flex:1 }}>
          <Text style={{ color: colors.text, fontWeight:'700', fontSize: typography.base }}>{user?.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm }}>{user?.email}</Text>
          <View style={[s.roleBadge, { backgroundColor: ACCENT+'18' }]}>
            <Text style={{ color: ACCENT, fontSize: typography.xs, fontWeight:'600' }}>Candidate</Text>
          </View>
        </View>
      </View>

      {sections.map((sec) => (
        <View key={sec.title} style={{ marginBottom: 24 }}>
          <Text style={[s.secLabel, { color: colors.textMuted, fontSize: typography.xs }]}>{sec.title.toUpperCase()}</Text>
          <View style={[s.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {sec.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[s.item, i < sec.items.length - 1 && { borderBottomWidth:1, borderBottomColor: colors.border }]}
                onPress={() => item.screen && navigation.navigate(item.screen as any)}
              >
                <View style={[s.itemIcon, { backgroundColor: item.color+'18' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color}/>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ color: colors.text, fontSize: typography.base }}>{item.label}</Text>
                  {item.sublabel && <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>{item.sublabel}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted}/>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Sign out */}
      <TouchableOpacity style={[s.signOutBtn, { borderColor:'#EF4444'+'40' }]} onPress={handleLogout} disabled={logout.isPending}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444"/>
        <Text style={{ color:'#EF4444', fontSize: typography.base, fontWeight:'600', marginLeft:8 }}>
          {logout.isPending ? 'Signing out…' : 'Sign Out'}
        </Text>
      </TouchableOpacity>
      <Text style={{ color: colors.textMuted, fontSize: typography.xs, textAlign:'center', marginTop:16 }}>Banana v1.0.0 · Candidate</Text>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  userCard:   { flexDirection:'row', alignItems:'center', gap:14, borderRadius:16, borderWidth:1, padding:16, marginBottom:24 },
  avatar:     { width:56, height:56, borderRadius:28 },
  roleBadge:  { marginTop:4, alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:2, borderRadius:99 },
  secLabel:   { fontWeight:'700', letterSpacing:0.5, marginBottom:8 },
  list:       { borderRadius:16, borderWidth:1, overflow:'hidden' },
  item:       { flexDirection:'row', alignItems:'center', gap:12, padding:14 },
  itemIcon:   { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  signOutBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', borderWidth:1, borderRadius:14, paddingVertical:14, marginBottom:12 },
});