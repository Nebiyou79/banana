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


export const CompanyProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<CompanyNav>();
  const { data: profile, isLoading } = useProfile();
  const { data: roleProfile } = useCompanyRoleProfile();
  const { data: verification } = useVerificationStatus();
  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar;
  const initials  = (user?.name??'C').split(' ').map((p)=>p[0]).join('').toUpperCase().slice(0,2);
  if (isLoading) return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background}}><ActivityIndicator color={C_ACCENT}/></View>;
  return (
    <ScrollView style={{flex:1,backgroundColor:colors.background}} showsVerticalScrollIndicator={false}>
      <View style={[cs.cover,{backgroundColor:C_ACCENT+'30'}]}>
        {profile?.cover?.secure_url&&<Image source={{uri:profile.cover.secure_url}} style={StyleSheet.absoluteFillObject} resizeMode="cover"/>}
      </View>
      <View style={[cs.avatarRow,{paddingHorizontal:spacing[5]}]}>
        <View style={[cs.avatarWrap,{borderColor:colors.background}]}>
          {avatarUrl?<Image source={{uri:avatarUrl}} style={cs.avatar}/>:
            <View style={[cs.avatar,{backgroundColor:C_ACCENT,alignItems:'center',justifyContent:'center'}]}><Text style={{color:'#fff',fontWeight:'800',fontSize:typography.xl}}>{initials}</Text></View>}
          {verification?.verificationStatus==='full'&&<View style={[cs.badge,{backgroundColor:C_ACCENT}]}><Ionicons name="checkmark" size={10} color="#fff"/></View>}
        </View>
        <TouchableOpacity style={[cs.editBtn,{backgroundColor:C_ACCENT}]} onPress={()=>navigation.navigate('EditProfile')}>
          <Ionicons name="pencil" size={14} color="#fff"/><Text style={{color:'#fff',fontWeight:'600',fontSize:typography.sm,marginLeft:4}}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={{paddingHorizontal:spacing[5],paddingBottom:40}}>
        <Text style={{color:colors.text,fontWeight:'800',fontSize:typography['2xl'],marginBottom:4}}>{user?.name}</Text>
        {profile?.headline&&<Text style={{color:colors.textMuted,fontSize:typography.base,marginBottom:6}}>{profile.headline}</Text>}
        {roleProfile?.companyInfo?.industry&&<View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}><Ionicons name="business-outline" size={14} color={colors.textMuted}/><Text style={{color:colors.textMuted,fontSize:typography.sm,marginLeft:4}}>{roleProfile.companyInfo.industry}</Text></View>}
        {profile?.bio&&<View style={[cs.section,{borderColor:colors.border}]}><Text style={cs.secTitle}>About</Text><Text style={{color:colors.textMuted,fontSize:typography.sm,lineHeight:20}}>{profile.bio}</Text></View>}
        {roleProfile?.mission&&<View style={[cs.section,{borderColor:colors.border}]}><Text style={cs.secTitle}>Mission</Text><Text style={{color:colors.textMuted,fontSize:typography.sm,lineHeight:20}}>{roleProfile.mission}</Text></View>}
        {(roleProfile?.specialties?.length??0)>0&&(
          <View style={[cs.section,{borderColor:colors.border}]}>
            <Text style={cs.secTitle}>Specialties</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
              {roleProfile!.specialties.map((sp)=>(
                <View key={sp} style={{borderRadius:99,borderWidth:1,paddingHorizontal:10,paddingVertical:4,backgroundColor:C_ACCENT+'18',borderColor:C_ACCENT+'40'}}><Text style={{color:C_ACCENT,fontSize:11,fontWeight:'600'}}>{sp}</Text></View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
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
});