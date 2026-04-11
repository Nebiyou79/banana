import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import { useProfile, useCompanyRoleProfile, useVerificationStatus } from '../../hooks/useProfile';
import { useUpdateProfile } from '../../hooks/useProfile';
import { useLogout } from '../../hooks/useAuth';
import { companyService } from '../../services/companyService';
import { Input } from '../../components/ui/Input';
import type { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type CompanyNav = NativeStackNavigationProp<CompanyStackParamList>;
const C_ACCENT = '#3B82F6';

export const CompanyEditProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<CompanyNav>();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { control, handleSubmit } = useForm({ defaultValues:{ headline:profile?.headline??'', bio:profile?.bio??'', location:profile?.location??'', phone:profile?.phone??'', website:profile?.website??'' } });
  const onSave = handleSubmit((data)=>updateProfile.mutate(data,{onSuccess:()=>navigation.goBack()}));
  return (
    <KeyboardAvoidingView style={{flex:1,backgroundColor:colors.background}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={[cs.header,{backgroundColor:colors.surface,borderBottomColor:colors.border}]}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={cs.iconBtn}><Ionicons name="close" size={24} color={colors.text}/></TouchableOpacity>
        <Text style={{color:colors.text,fontWeight:'700',fontSize:typography.lg}}>Edit Company Profile</Text>
        <TouchableOpacity onPress={onSave} disabled={updateProfile.isPending}><Text style={{color:C_ACCENT,fontSize:typography.base,fontWeight:'700'}}>{updateProfile.isPending?'Saving…':'Save'}</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{padding:spacing[5]}} keyboardShouldPersistTaps="handled">
        <Controller control={control} name="headline" render={({field})=><Input label="Tagline" placeholder="e.g. Leading SaaS Company" value={field.value} onChangeText={field.onChange}/>}/>
        <Controller control={control} name="bio"      render={({field})=><Input label="Description" placeholder="About your company…" value={field.value} onChangeText={field.onChange} multiline numberOfLines={4}/>}/>
        <Controller control={control} name="location" render={({field})=><Input label="Headquarters" placeholder="City, Country" value={field.value} onChangeText={field.onChange} leftIcon={<Ionicons name="location-outline" size={16} color={colors.textMuted}/>}/>}/>
        <Controller control={control} name="phone"    render={({field})=><Input label="Phone" placeholder="+1 555 000 0000" value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" leftIcon={<Ionicons name="call-outline" size={16} color={colors.textMuted}/>}/>}/>
        <Controller control={control} name="website"  render={({field})=><Input label="Website" placeholder="https://yourcompany.com" value={field.value} onChangeText={field.onChange} keyboardType="url" autoCapitalize="none" leftIcon={<Ionicons name="globe-outline" size={16} color={colors.textMuted}/>}/>}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
// ─── Styles ───────────────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  card:       {borderRadius:16,borderWidth:1,padding:16,marginBottom:24},
  row:        {flexDirection:'row',justifyContent:'space-between',marginBottom:8},
  barBg:      {height:6,borderRadius:99,overflow:'hidden'},
  barFill:    {height:6,borderRadius:99},
  statsRow:   {flexDirection:'row',gap:10,flexWrap:'wrap'},
  statCard:   {flex:1,minWidth:'44%',borderRadius:14,borderWidth:1,padding:14,alignItems:'center',gap:6},
  statIcon:   {width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center'},
  statVal:    {fontWeight:'800',fontSize:22},
  statLbl:    {fontSize:11,fontWeight:'500'},
  jobRow:     {flexDirection:'row',alignItems:'center',borderRadius:12,borderWidth:1,padding:12,marginBottom:8},
  statusPill: {borderRadius:99,paddingHorizontal:8,paddingVertical:3},
  cover:      {height:140},
  avatarRow:  {flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',marginTop:-40,marginBottom:12},
  avatarWrap: {width:84,height:84,borderRadius:42,borderWidth:3,overflow:'hidden'},
  avatar:     {width:'100%',height:'100%'},
  badge:      {position:'absolute',bottom:2,right:2,width:18,height:18,borderRadius:9,alignItems:'center',justifyContent:'center'},
  editBtn:    {flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingVertical:8,borderRadius:99},
  section:    {borderTopWidth:1,paddingTop:16,marginTop:16},
  secTitle:   {fontWeight:'700',marginBottom:10,fontSize:15},
  header:     {flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,paddingTop:52,borderBottomWidth:1},
  iconBtn:    {width:36,height:36,alignItems:'center',justifyContent:'center'},
  userCard:   {flexDirection:'row',alignItems:'center',gap:14,borderRadius:16,borderWidth:1,padding:16,marginBottom:24},
  moreAvatar: {width:56,height:56,borderRadius:28},
  roleBadge:  {marginTop:4,alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:2,borderRadius:99},
  moreList:   {borderRadius:16,borderWidth:1,overflow:'hidden',marginBottom:24},
  moreItem:   {flexDirection:'row',alignItems:'center',gap:12,padding:14},
  moreIcon:   {width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center'},
  signOut:    {flexDirection:'row',alignItems:'center',justifyContent:'center',borderWidth:1,borderRadius:14,paddingVertical:14},
});;