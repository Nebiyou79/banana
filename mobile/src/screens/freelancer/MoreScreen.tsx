import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import { useProfile, useFreelancerRoleProfile, useVerificationStatus } from '../../hooks/useProfile';
import { useLogout } from '../../hooks/useAuth';
import { freelancerService } from '../../services/freelancerService';
import { roleProfileService } from '../../services/roleProfileService';
import type { FreelancerStackParamList } from '../../navigation/RoleNavigators';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;


export const FreelancerMoreScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const logout = useLogout();
  const { data: profile } = useProfile();
  const { data: verification } = useVerificationStatus();
  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar;
  const initials  = (user?.name ?? 'F').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => Alert.alert('Sign Out', 'Sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: () => logout.mutate() },
  ]);

  const items = [
    { icon: 'briefcase-outline',        label: 'My Services',      color: '#10B981' },
    { icon: 'images-outline',           label: 'Portfolio',        color: '#10B981' },
    { icon: 'ribbon-outline',           label: 'Certifications',   color: '#10B981' },
    { icon: 'shield-checkmark-outline', label: 'Verification',     sublabel: verification?.verificationStatus === 'full' ? 'Verified ✓' : 'Get verified', color: '#10B981' },
    { icon: 'notifications-outline',    label: 'Notifications',    color: colors.primary },
    { icon: 'help-circle-outline',      label: 'Help & FAQ',       color: colors.primary },
    { icon: 'document-text-outline',    label: 'Terms & Privacy',  color: colors.primary },
  ];

  return (
    <ScrollView style={{ flex:1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing[5], paddingTop: 56 }} showsVerticalScrollIndicator={false}>
      <View style={[fs.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {avatarUrl ? <Image source={{ uri: avatarUrl }} style={fs.moreAvatar} /> : (
          <View style={[fs.moreAvatar, { backgroundColor: '#10B981', alignItems:'center', justifyContent:'center' }]}>
            <Text style={{ color:'#fff', fontWeight:'700', fontSize: typography.lg }}>{initials}</Text>
          </View>
        )}
        <View style={{ flex:1 }}>
          <Text style={{ color: colors.text, fontWeight:'700', fontSize: typography.base }}>{user?.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm }}>{user?.email}</Text>
          <View style={[fs.roleBadge, { backgroundColor: '#10B981' + '18' }]}>
            <Text style={{ color: '#10B981', fontSize: typography.xs, fontWeight:'600' }}>Freelancer</Text>
          </View>
        </View>
      </View>

      <View style={[fs.moreList, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 24 }]}>
        {items.map((item, i) => (
          <TouchableOpacity key={item.label} style={[fs.moreItem, i < items.length - 1 && { borderBottomWidth:1, borderBottomColor: colors.border }]}>
            <View style={[fs.moreIcon, { backgroundColor: item.color + '18' }]}>
              <Ionicons name={item.icon as any} size={18} color={item.color} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color: colors.text, fontSize: typography.base }}>{item.label}</Text>
              {(item as any).sublabel && <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>{(item as any).sublabel}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[fs.signOutBtn, { borderColor: '#EF4444' + '40' }]} onPress={handleLogout} disabled={logout.isPending}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={{ color:'#EF4444', fontSize: typography.base, fontWeight:'600', marginLeft:8 }}>
          {logout.isPending ? 'Signing out…' : 'Sign Out'}
        </Text>
      </TouchableOpacity>
      <Text style={{ color: colors.textMuted, fontSize: typography.xs, textAlign:'center', marginTop:16 }}>Banana v1.0.0 · Freelancer</Text>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const fs = StyleSheet.create({
  greeting:   { fontWeight:'500', marginBottom:2 },
  name:       { fontWeight:'800', marginBottom:20, letterSpacing:-0.5 },
  completionCard: { borderRadius:16, borderWidth:1, padding:16, marginBottom:24 },
  completionRow:  { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  barBg:      { height:6, borderRadius:99, overflow:'hidden', marginBottom:6 },
  barFill:    { height:6, borderRadius:99 },
  sectionTitle:{ fontWeight:'700', marginBottom:12 },
  statsRow:   { flexDirection:'row', gap:10 },
  statCard:   { flex:1, borderRadius:14, borderWidth:1, padding:14, alignItems:'center', gap:6 },
  statVal:    { fontWeight:'800', fontSize:22 },
  statLbl:    { fontSize:11, fontWeight:'500' },
  skillsWrap: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:       { borderRadius:99, borderWidth:1, paddingHorizontal:10, paddingVertical:4 },
  chipText:   { fontWeight:'600' },
  portfolioCard: { width:140, borderRadius:12, borderWidth:1, overflow:'hidden' },
  portfolioImg:  { width:'100%', height:90 },
  portfolioTitle:{ padding:8, fontWeight:'600' },
  coverBg:    { height:140, width:'100%' },
  avatarRow:  { flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', marginTop:-40, marginBottom:12 },
  avatarWrap: { width:84, height:84, borderRadius:42, borderWidth:3, overflow:'hidden' },
  avatar:     { width:'100%', height:'100%' },
  badge:      { position:'absolute', bottom:2, right:2, width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center' },
  editBtn:    { flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:8, borderRadius:99 },
  profileName:{ fontWeight:'800', marginBottom:4 },
  section:    { borderTopWidth:1, paddingTop:16, marginTop:16 },
  serviceRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderRadius:10, borderWidth:1, padding:12, marginBottom:8 },
  timelineItem:{ marginBottom:14 },
  modalHeader:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, borderBottomWidth:1, paddingTop:52 },
  modalTitle: { fontWeight:'700' },
  userCard:   { flexDirection:'row', alignItems:'center', gap:14, borderRadius:16, borderWidth:1, padding:16, marginBottom:24 },
  moreAvatar: { width:56, height:56, borderRadius:28 },
  roleBadge:  { marginTop:4, alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:2, borderRadius:99 },
  moreList:   { borderRadius:16, borderWidth:1, overflow:'hidden', marginBottom:24 },
  moreItem:   { flexDirection:'row', alignItems:'center', gap:12, padding:14 },
  moreIcon:   { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  signOutBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', borderWidth:1, borderRadius:14, paddingVertical:14, marginBottom:12 },
});
