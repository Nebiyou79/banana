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

export const OrganizationMoreScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<OrgNav>();
  const logout = useLogout();
  const { data: profile } = useProfile();
  const { data: verification } = useVerificationStatus();
  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar;
  const initials  = (user?.name??'O').split(' ').map((x)=>x[0]).join('').toUpperCase().slice(0,2);
  const vStatus   = verification?.verificationStatus ?? 'none';
  const items = [
    { icon:'briefcase-outline', label:'Job Postings', color:O_ACCENT },
    { icon:'people-outline',    label:'Applicants',   color:O_ACCENT },
    { icon:'shield-checkmark-outline', label:'Verification', sublabel:vStatus==='full'?'Verified ✓':vStatus==='partial'?'Partially verified':'Get verified', color:vStatus==='full'?'#10B981':O_ACCENT, screen:'VerificationStatus' as const },
    { icon:'notifications-outline', label:'Notifications', color:colors.primary },
    { icon:'help-circle-outline',   label:'Help & FAQ',     color:colors.primary },
    { icon:'document-text-outline', label:'Terms & Privacy',color:colors.primary },
  ];
  const handleLogout = ()=>Alert.alert('Sign Out','Sure?',[{text:'Cancel',style:'cancel'},{text:'Sign Out',style:'destructive',onPress:()=>logout.mutate()}]);
  return (
    <ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{padding:spacing[5],paddingTop:56}} showsVerticalScrollIndicator={false}>
      <View style={[cs.userCard,{backgroundColor:colors.surface,borderColor:colors.border}]}>
        {avatarUrl?<Image source={{uri:avatarUrl}} style={cs.moreAvatar}/>:
          <View style={[cs.moreAvatar,{backgroundColor:O_ACCENT,alignItems:'center',justifyContent:'center'}]}><Text style={{color:'#fff',fontWeight:'700',fontSize:typography.lg}}>{initials}</Text></View>}
        <View style={{flex:1}}>
          <Text style={{color:colors.text,fontWeight:'700',fontSize:typography.base}}>{user?.name}</Text>
          <Text style={{color:colors.textMuted,fontSize:typography.sm}}>{user?.email}</Text>
          <View style={[cs.roleBadge,{backgroundColor:O_ACCENT+'18'}]}><Text style={{color:O_ACCENT,fontSize:typography.xs,fontWeight:'600'}}>Organization</Text></View>
        </View>
      </View>
      <View style={[cs.moreList,{backgroundColor:colors.surface,borderColor:colors.border}]}>
        {items.map((item,i)=>(
          <TouchableOpacity key={item.label} style={[cs.moreItem,i<items.length-1&&{borderBottomWidth:1,borderBottomColor:colors.border}]}
            onPress={()=>(item as any).screen&&navigation.navigate((item as any).screen)}>
            <View style={[cs.moreIcon,{backgroundColor:item.color+'18'}]}><Ionicons name={item.icon as any} size={18} color={item.color}/></View>
            <View style={{flex:1}}>
              <Text style={{color:colors.text,fontSize:typography.base}}>{item.label}</Text>
              {(item as any).sublabel&&<Text style={{color:colors.textMuted,fontSize:typography.xs}}>{(item as any).sublabel}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted}/>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[cs.signOut,{borderColor:'#EF4444'+'40'}]} onPress={handleLogout} disabled={logout.isPending}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444"/>
        <Text style={{color:'#EF4444',fontSize:typography.base,fontWeight:'600',marginLeft:8}}>{logout.isPending?'Signing out…':'Sign Out'}</Text>
      </TouchableOpacity>
      <Text style={{color:colors.textMuted,fontSize:typography.xs,textAlign:'center',marginTop:16}}>Banana v1.0.0 · Organization</Text>
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