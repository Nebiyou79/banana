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
import { useOrganizationRoleProfile } from '../../hooks/useProfile';
import { organizationService } from '../../services/organizationService';
import type { OrganizationStackParamList } from '../../navigation/OrganizationNavigator';

type OrgNav = NativeStackNavigationProp<OrganizationStackParamList>;
const O_ACCENT = '#8B5CF6';


export const OrganizationProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<OrgNav>();
  const { data: profile, isLoading } = useProfile();
  const { data: roleProfile } = useOrganizationRoleProfile();
  const { data: verification } = useVerificationStatus();
  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar;
  const initials  = (user?.name??'O').split(' ').map((p)=>p[0]).join('').toUpperCase().slice(0,2);
  if (isLoading) return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background}}><ActivityIndicator color={O_ACCENT}/></View>;
  return (
    <ScrollView style={{flex:1,backgroundColor:colors.background}} showsVerticalScrollIndicator={false}>
      <View style={[cs.cover,{backgroundColor:O_ACCENT+'30'}]}>
        {profile?.cover?.secure_url&&<Image source={{uri:profile.cover.secure_url}} style={StyleSheet.absoluteFillObject} resizeMode="cover"/>}
      </View>
      <View style={[cs.avatarRow,{paddingHorizontal:spacing[5]}]}>
        <View style={[cs.avatarWrap,{borderColor:colors.background}]}>
          {avatarUrl?<Image source={{uri:avatarUrl}} style={cs.avatar}/>:
            <View style={[cs.avatar,{backgroundColor:O_ACCENT,alignItems:'center',justifyContent:'center'}]}><Text style={{color:'#fff',fontWeight:'800',fontSize:typography.xl}}>{initials}</Text></View>}
          {verification?.verificationStatus==='full'&&<View style={[cs.badge,{backgroundColor:O_ACCENT}]}><Ionicons name="checkmark" size={10} color="#fff"/></View>}
        </View>
        <TouchableOpacity style={[cs.editBtn,{backgroundColor:O_ACCENT}]} onPress={()=>navigation.navigate('EditProfile')}>
          <Ionicons name="pencil" size={14} color="#fff"/><Text style={{color:'#fff',fontWeight:'600',fontSize:typography.sm,marginLeft:4}}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={{paddingHorizontal:spacing[5],paddingBottom:40}}>
        <Text style={{color:colors.text,fontWeight:'800',fontSize:typography['2xl'],marginBottom:4}}>{user?.name}</Text>
        {profile?.headline&&<Text style={{color:colors.textMuted,fontSize:typography.base,marginBottom:6}}>{profile.headline}</Text>}
        {profile?.bio&&<View style={[cs.section,{borderColor:colors.border}]}><Text style={cs.secTitle}>About</Text><Text style={{color:colors.textMuted,fontSize:typography.sm,lineHeight:20}}>{profile.bio}</Text></View>}
        {roleProfile?.mission&&<View style={[cs.section,{borderColor:colors.border}]}><Text style={cs.secTitle}>Mission</Text><Text style={{color:colors.textMuted,fontSize:typography.sm,lineHeight:20}}>{roleProfile.mission}</Text></View>}
        {(roleProfile?.values?.length??0)>0&&(
          <View style={[cs.section,{borderColor:colors.border}]}>
            <Text style={cs.secTitle}>Values</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
              {roleProfile!.values.map((v)=>(
                <View key={v} style={{borderRadius:99,borderWidth:1,paddingHorizontal:10,paddingVertical:4,backgroundColor:O_ACCENT+'18',borderColor:O_ACCENT+'40'}}><Text style={{color:O_ACCENT,fontSize:11,fontWeight:'600'}}>{v}</Text></View>
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