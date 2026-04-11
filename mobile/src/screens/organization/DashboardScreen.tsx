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
// ─── Shared stat card ─────────────────────────────────────────────────────────

const StatTile: React.FC<{ label: string; value: number; icon: string; color: string }> = ({ label, value, icon, color }) => {
  const { theme } = useThemeStore();
  return (
    <View style={[cs.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[cs.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[cs.statVal, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[cs.statLbl, { color: theme.colors.textMuted }]}>{label}</Text>
    </View>
  );
};
export const OrganizationDashboardScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const { data: profile } = useProfile();
  const { data: stats, isLoading } = useQuery({ queryKey:['org','stats'], queryFn: organizationService.getDashboardStats, staleTime:5*60*1000 });
  const { data: jobs } = useQuery({ queryKey:['org','jobs'], queryFn: organizationService.getMyJobs, staleTime:5*60*1000 });
  const completion = profile?.profileCompletion?.percentage ?? 0;
  return (
    <ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{padding:spacing[5],paddingTop:56}} showsVerticalScrollIndicator={false}>
      <Text style={{color:colors.textMuted,fontWeight:'500',marginBottom:2,fontSize:typography.sm}}>Welcome back 👋</Text>
      <Text style={{color:colors.text,fontWeight:'800',fontSize:typography['2xl'],marginBottom:20,letterSpacing:-0.5}}>{user?.name}</Text>
      <View style={[cs.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
        <View style={cs.row}><Text style={{color:colors.text,fontWeight:'600'}}>Organization profile</Text><Text style={{color:O_ACCENT,fontWeight:'700'}}>{completion}%</Text></View>
        <View style={[cs.barBg,{backgroundColor:colors.border}]}><View style={[cs.barFill,{width:`${completion}%` as any,backgroundColor:O_ACCENT}]}/></View>
      </View>
      <Text style={{color:colors.text,fontWeight:'700',marginBottom:12,fontSize:typography.base}}>Overview</Text>
      {isLoading?<ActivityIndicator color={O_ACCENT} style={{marginVertical:20}}/>:(
        <View style={cs.statsRow}>
          <StatTile label="Jobs"         value={stats?.totalJobs??0}         icon="briefcase"      color={O_ACCENT}/>
          <StatTile label="Active"       value={stats?.activeJobs??0}        icon="radio-button-on" color="#10B981"/>
          <StatTile label="Applications" value={stats?.totalApplications??0} icon="document-text"  color="#F59E0B"/>
          <StatTile label="New"          value={stats?.newApplications??0}   icon="notifications"   color="#EF4444"/>
        </View>
      )}
      {(jobs?.length??0)>0&&(
        <>
          <Text style={{color:colors.text,fontWeight:'700',marginBottom:12,fontSize:typography.base,marginTop:20}}>Recent Postings</Text>
          {jobs!.slice(0,4).map((job)=>(
            <View key={job._id} style={[cs.jobRow,{backgroundColor:colors.surface,borderColor:colors.border}]}>
              <View style={{flex:1}}><Text style={{color:colors.text,fontWeight:'600',fontSize:typography.sm}}>{job.title}</Text></View>
              <View style={[cs.statusPill,{backgroundColor:job.status==='active'?'#10B981'+'18':colors.border}]}>
                <Text style={{color:job.status==='active'?'#10B981':colors.textMuted,fontSize:10,fontWeight:'600'}}>{job.status}</Text>
              </View>
            </View>
          ))}
        </>
      )}
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