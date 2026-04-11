// ── ProfileScreen ────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import { useProfile, useFreelancerRoleProfile, useVerificationStatus } from '../../hooks/useProfile';
import { roleProfileService } from '../../services/roleProfileService';
import { freelancerService } from '../../services/freelancerService';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;
const ACCENT = '#10B981';

export const FreelancerProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const { data: profile, isLoading } = useProfile();
  const { data: roleProfile } = useFreelancerRoleProfile();
  const { data: verification } = useVerificationStatus();
  const { data: services } = useQuery({ queryKey:['freelancer','services'], queryFn: freelancerService.getServices, staleTime:5*60*1000 });
  const { data: certs } = useQuery({ queryKey:['freelancer','certs'], queryFn: freelancerService.getCertifications, staleTime:5*60*1000 });

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar;
  const initials  = (user?.name ?? 'F').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0,2);

  if (isLoading) return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background}}><ActivityIndicator color={ACCENT}/></View>;

  return (
    <ScrollView style={{flex:1,backgroundColor:colors.background}} showsVerticalScrollIndicator={false}>
      <View style={[p.cover,{backgroundColor:ACCENT+'30'}]}>
        {profile?.cover?.secure_url && <Image source={{uri:profile.cover.secure_url}} style={StyleSheet.absoluteFillObject} resizeMode="cover"/>}
      </View>
      <View style={[p.avatarRow,{paddingHorizontal:spacing[5]}]}>
        <View style={[p.avatarWrap,{borderColor:colors.background}]}>
          {avatarUrl ? <Image source={{uri:avatarUrl}} style={p.avatar}/> :
            <View style={[p.avatar,{backgroundColor:ACCENT,alignItems:'center',justifyContent:'center'}]}><Text style={{color:'#fff',fontWeight:'800',fontSize:typography.xl}}>{initials}</Text></View>}
          {verification?.verificationStatus==='full'&&<View style={[p.badge,{backgroundColor:ACCENT}]}><Ionicons name="checkmark" size={10} color="#fff"/></View>}
        </View>
        <TouchableOpacity style={[p.editBtn,{backgroundColor:ACCENT}]} onPress={()=>navigation.navigate('EditProfile')}>
          <Ionicons name="pencil" size={14} color="#fff"/><Text style={{color:'#fff',fontWeight:'600',fontSize:typography.sm,marginLeft:4}}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={{paddingHorizontal:spacing[5],paddingBottom:40}}>
        <Text style={{color:colors.text,fontWeight:'800',fontSize:typography['2xl'],marginBottom:4}}>{user?.name}</Text>
        {profile?.headline&&<Text style={{color:colors.textMuted,fontSize:typography.base,marginBottom:6}}>{profile.headline}</Text>}
        {profile?.location&&<View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}><Ionicons name="location-outline" size={14} color={colors.textMuted}/><Text style={{color:colors.textMuted,fontSize:typography.sm,marginLeft:4}}>{profile.location}</Text></View>}

        {(services?.length??0)>0&&(
          <View style={[p.section,{borderColor:colors.border}]}>
            <Text style={[p.secTitle,{color:colors.text}]}>Services</Text>
            {services!.map((svc)=>(
              <View key={svc._id} style={[p.serviceRow,{backgroundColor:colors.surface,borderColor:colors.border}]}>
                <Text style={{color:colors.text,fontWeight:'600',fontSize:typography.sm}}>{svc.title}</Text>
                {svc.price&&<Text style={{color:ACCENT,fontWeight:'700',fontSize:typography.sm}}>${svc.price}{svc.priceType==='hourly'?'/hr':''}</Text>}
              </View>
            ))}
          </View>
        )}

        {(roleProfile?.skills?.length??0)>0&&(
          <View style={[p.section,{borderColor:colors.border}]}>
            <Text style={[p.secTitle,{color:colors.text}]}>Skills</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
              {roleProfile!.skills.map((sk)=>(
                <View key={sk} style={{borderRadius:99,borderWidth:1,paddingHorizontal:10,paddingVertical:4,backgroundColor:ACCENT+'18',borderColor:ACCENT+'40'}}>
                  <Text style={{color:ACCENT,fontSize:11,fontWeight:'600'}}>{sk}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(roleProfile?.experience?.length??0)>0&&(
          <View style={[p.section,{borderColor:colors.border}]}>
            <Text style={[p.secTitle,{color:colors.text}]}>Experience</Text>
            {roleProfile!.experience.map((exp,i)=>(
              <View key={i} style={{marginBottom:14}}>
                <Text style={{color:colors.text,fontWeight:'700',fontSize:typography.sm}}>{exp.title}</Text>
                <Text style={{color:ACCENT,fontWeight:'500',fontSize:typography.sm}}>{exp.company}</Text>
                <Text style={{color:colors.textMuted,fontSize:typography.xs}}>{roleProfileService.formatDateRange(exp.startDate,exp.endDate,exp.current)}</Text>
              </View>
            ))}
          </View>
        )}

        {(certs?.length??0)>0&&(
          <View style={[p.section,{borderColor:colors.border}]}>
            <Text style={[p.secTitle,{color:colors.text}]}>Certifications</Text>
            {certs!.map((c)=>(
              <View key={c._id} style={{marginBottom:14}}>
                <Text style={{color:colors.text,fontWeight:'700',fontSize:typography.sm}}>{c.name}</Text>
                <Text style={{color:colors.textMuted,fontSize:typography.xs}}>{c.issuer}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// ── EditProfileScreen ─────────────────────────────────────────────────────────
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useUpdateProfile } from '../../hooks/useProfile';
import { Input } from '../../components/ui/Input';

export const FreelancerEditProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { control, handleSubmit } = useForm({
    defaultValues: { headline:profile?.headline??'', bio:profile?.bio??'', location:profile?.location??'', phone:profile?.phone??'', website:profile?.website??'' },
  });
  const onSave = handleSubmit((data)=>updateProfile.mutate(data,{onSuccess:()=>navigation.goBack()}));

  return (
    <KeyboardAvoidingView style={{flex:1,backgroundColor:colors.background}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={[p.header,{backgroundColor:colors.surface,borderBottomColor:colors.border}]}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={p.iconBtn}><Ionicons name="close" size={24} color={colors.text}/></TouchableOpacity>
        <Text style={{color:colors.text,fontWeight:'700',fontSize:typography.lg}}>Edit Profile</Text>
        <TouchableOpacity onPress={onSave} disabled={updateProfile.isPending}>
          <Text style={{color:ACCENT,fontSize:typography.base,fontWeight:'700'}}>{updateProfile.isPending?'Saving…':'Save'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{padding:spacing[5]}} keyboardShouldPersistTaps="handled">
        <Controller control={control} name="headline" render={({field})=><Input label="Headline" placeholder="e.g. Full-Stack Developer" value={field.value} onChangeText={field.onChange}/>}/>
        <Controller control={control} name="bio"      render={({field})=><Input label="Bio" placeholder="Describe your expertise…" value={field.value} onChangeText={field.onChange} multiline numberOfLines={4}/>}/>
        <Controller control={control} name="location" render={({field})=><Input label="Location" placeholder="City, Country" value={field.value} onChangeText={field.onChange} leftIcon={<Ionicons name="location-outline" size={16} color={colors.textMuted}/>}/>}/>
        <Controller control={control} name="phone"    render={({field})=><Input label="Phone" placeholder="+1 555 000 0000" value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" leftIcon={<Ionicons name="call-outline" size={16} color={colors.textMuted}/>}/>}/>
        <Controller control={control} name="website"  render={({field})=><Input label="Website / Portfolio" placeholder="https://yourportfolio.com" value={field.value} onChangeText={field.onChange} keyboardType="url" autoCapitalize="none" leftIcon={<Ionicons name="globe-outline" size={16} color={colors.textMuted}/>}/>}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── MoreScreen ────────────────────────────────────────────────────────────────
import { Alert } from 'react-native';
import { useLogout } from '../../hooks/useAuth';

export const FreelancerMoreScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const logout = useLogout();
  const { data: profile } = useProfile();
  const { data: verification } = useVerificationStatus();
  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar;
  const initials  = (user?.name??'F').split(' ').map((x)=>x[0]).join('').toUpperCase().slice(0,2);
  const vStatus   = verification?.verificationStatus ?? 'none';

  const items = [
    { icon:'briefcase-outline',        label:'My Services',    color:ACCENT },
    { icon:'images-outline',           label:'Portfolio',      color:ACCENT },
    { icon:'ribbon-outline',           label:'Certifications', color:ACCENT },
    { icon:'shield-checkmark-outline', label:'Verification',   sublabel: vStatus==='full'?'Verified ✓':vStatus==='partial'?'Partially verified':'Get verified', color: vStatus==='full'?ACCENT:'#F59E0B', screen:'VerificationStatus' as const },
    { icon:'notifications-outline',    label:'Notifications',  color:colors.primary },
    { icon:'help-circle-outline',      label:'Help & FAQ',     color:colors.primary },
    { icon:'document-text-outline',    label:'Terms & Privacy',color:colors.primary },
  ];

  const handleLogout = ()=>Alert.alert('Sign Out','Sure?',[{text:'Cancel',style:'cancel'},{text:'Sign Out',style:'destructive',onPress:()=>logout.mutate()}]);

  return (
    <ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{padding:spacing[5],paddingTop:56}} showsVerticalScrollIndicator={false}>
      <View style={[m.userCard,{backgroundColor:colors.surface,borderColor:colors.border}]}>
        {avatarUrl?<Image source={{uri:avatarUrl}} style={m.avatar}/>:
          <View style={[m.avatar,{backgroundColor:ACCENT,alignItems:'center',justifyContent:'center'}]}><Text style={{color:'#fff',fontWeight:'700',fontSize:typography.lg}}>{initials}</Text></View>}
        <View style={{flex:1}}>
          <Text style={{color:colors.text,fontWeight:'700',fontSize:typography.base}}>{user?.name}</Text>
          <Text style={{color:colors.textMuted,fontSize:typography.sm}}>{user?.email}</Text>
          <View style={[m.badge,{backgroundColor:ACCENT+'18'}]}><Text style={{color:ACCENT,fontSize:typography.xs,fontWeight:'600'}}>Freelancer</Text></View>
        </View>
      </View>
      <View style={[m.list,{backgroundColor:colors.surface,borderColor:colors.border}]}>
        {items.map((item,i)=>(
          <TouchableOpacity key={item.label} style={[m.item,i<items.length-1&&{borderBottomWidth:1,borderBottomColor:colors.border}]}
            onPress={()=>(item as any).screen&&navigation.navigate((item as any).screen)}>
            <View style={[m.itemIcon,{backgroundColor:item.color+'18'}]}><Ionicons name={item.icon as any} size={18} color={item.color}/></View>
            <View style={{flex:1}}>
              <Text style={{color:colors.text,fontSize:typography.base}}>{item.label}</Text>
              {(item as any).sublabel&&<Text style={{color:colors.textMuted,fontSize:typography.xs}}>{(item as any).sublabel}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted}/>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[m.signOut,{borderColor:'#EF4444'+'40',marginTop:24}]} onPress={handleLogout} disabled={logout.isPending}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444"/>
        <Text style={{color:'#EF4444',fontSize:typography.base,fontWeight:'600',marginLeft:8}}>{logout.isPending?'Signing out…':'Sign Out'}</Text>
      </TouchableOpacity>
      <Text style={{color:colors.textMuted,fontSize:typography.xs,textAlign:'center',marginTop:16}}>Banana v1.0.0 · Freelancer</Text>
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const p = StyleSheet.create({
  cover:      {height:140},
  avatarRow:  {flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',marginTop:-40,marginBottom:12},
  avatarWrap: {width:84,height:84,borderRadius:42,borderWidth:3,overflow:'hidden'},
  avatar:     {width:'100%',height:'100%'},
  badge:      {position:'absolute',bottom:2,right:2,width:18,height:18,borderRadius:9,alignItems:'center',justifyContent:'center'},
  editBtn:    {flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingVertical:8,borderRadius:99},
  section:    {borderTopWidth:1,paddingTop:16,marginTop:16},
  secTitle:   {fontWeight:'700',marginBottom:10,fontSize:15},
  serviceRow: {flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderRadius:10,borderWidth:1,padding:12,marginBottom:8},
  header:     {flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,paddingTop:52,borderBottomWidth:1},
  iconBtn:    {width:36,height:36,alignItems:'center',justifyContent:'center'},
});
const m = StyleSheet.create({
  userCard: {flexDirection:'row',alignItems:'center',gap:14,borderRadius:16,borderWidth:1,padding:16,marginBottom:24},
  avatar:   {width:56,height:56,borderRadius:28},
  badge:    {marginTop:4,alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:2,borderRadius:99},
  list:     {borderRadius:16,borderWidth:1,overflow:'hidden',marginBottom:24},
  item:     {flexDirection:'row',alignItems:'center',gap:12,padding:14},
  itemIcon: {width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center'},
  signOut:  {flexDirection:'row',alignItems:'center',justifyContent:'center',borderWidth:1,borderRadius:14,paddingVertical:14},
});
