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

import { KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useUpdateProfile } from '../../hooks/useProfile';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const FreelancerEditProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const { control, handleSubmit } = useForm({
    defaultValues: {
      headline: profile?.headline ?? '',
      bio:      profile?.bio      ?? '',
      location: profile?.location ?? '',
      phone:    profile?.phone    ?? '',
      website:  profile?.website  ?? '',
    },
  });

  const onSave = handleSubmit((data) => {
    updateProfile.mutate(data, { onSuccess: () => navigation.goBack() });
  });

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[fs.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[fs.modalTitle, { color: colors.text, fontSize: typography.lg }]}>Edit Profile</Text>
        <TouchableOpacity onPress={onSave} disabled={updateProfile.isPending}>
          <Text style={{ color: '#10B981', fontSize: typography.base, fontWeight:'700' }}>
            {updateProfile.isPending ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing[5] }} keyboardShouldPersistTaps="handled">
        <Controller control={control} name="headline" render={({ field }) => <Input label="Headline" placeholder="e.g. Full-Stack Developer" value={field.value} onChangeText={field.onChange} />} />
        <Controller control={control} name="bio"      render={({ field }) => <Input label="Bio" placeholder="Describe your expertise…" value={field.value} onChangeText={field.onChange} multiline numberOfLines={4} />} />
        <Controller control={control} name="location" render={({ field }) => <Input label="Location" placeholder="City, Country" value={field.value} onChangeText={field.onChange} leftIcon={<Ionicons name="location-outline" size={16} color={colors.textMuted}/>}/>} />
        <Controller control={control} name="phone"    render={({ field }) => <Input label="Phone" placeholder="+1 555 000 0000" value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" leftIcon={<Ionicons name="call-outline" size={16} color={colors.textMuted}/>}/>} />
        <Controller control={control} name="website"  render={({ field }) => <Input label="Website / Portfolio" placeholder="https://yourportfolio.com" value={field.value} onChangeText={field.onChange} keyboardType="url" autoCapitalize="none" leftIcon={<Ionicons name="globe-outline" size={16} color={colors.textMuted}/>}/>} />
      </ScrollView>
    </KeyboardAvoidingView>
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
