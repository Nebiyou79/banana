// src/screens/auth/RegisterScreen.tsx
// Real Banana logo · dark navy · staggered entrance animation · role pills

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, TextInput,
  Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useRegister } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import type { Role } from '../../constants/roles';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const NAVY   = '#050D1A';
const NAVY3  = '#0F2040';
const GOLD   = '#F1BB03';
const TPRI   = '#F8FAFC';
const TMUT   = '#64748B';
const BORDER = 'rgba(255,255,255,0.10)';
const INBG   = 'rgba(255,255,255,0.05)';
const ERR    = '#EF4444';

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  name:            z.string().min(2,'Name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(8,'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1,'Please confirm your password'),
  referralCode:    z.string().optional(),
}).refine(d=>d.password===d.confirmPassword,{message:'Passwords do not match',path:['confirmPassword']});
type FormData = z.infer<typeof schema>;
type Nav = NativeStackNavigationProp<AuthStackParamList>;

// ─── Role options ─────────────────────────────────────────────────────────────
const ROLES_CFG = [
  { role:ROLES.CANDIDATE,    label:'Job Seeker',   desc:'Find jobs & grow',        emoji:'🎯', color:'#3B82F6' },
  { role:ROLES.FREELANCER,   label:'Freelancer',   desc:'Win projects',             emoji:'💼', color:'#10B981' },
  { role:ROLES.COMPANY,      label:'Company',      desc:'Post jobs & hire',         emoji:'🏢', color:'#F1BB03' },
  { role:ROLES.ORGANIZATION, label:'Organization', desc:'Post tenders',             emoji:'🏛️', color:'#8B5CF6' },
] as const;

// ─── Shared input ─────────────────────────────────────────────────────────────
const Field: React.FC<{
  ph:string; val:string; onChange:(v:string)=>void;
  secure?:boolean; kbType?:any; autoCap?:any;
  left?:React.ReactNode; right?:React.ReactNode;
  err?:string; onSubmit?:()=>void; returnKey?:any;
}> = ({ph,val,onChange,secure,kbType,autoCap,left,right,err,onSubmit,returnKey}) => {
  const a = useRef(new Animated.Value(0)).current;
  const bc = a.interpolate({inputRange:[0,1],outputRange:[err?ERR:BORDER,err?ERR:GOLD]});
  return (
    <View style={{marginBottom:14}}>
      <Animated.View style={[F.wrap,{borderColor:bc}]}>
        {left  && <View style={{marginRight:10}}>{left}</View>}
        <TextInput style={F.inp} placeholder={ph} placeholderTextColor={TMUT}
          value={val} onChangeText={onChange} secureTextEntry={secure}
          keyboardType={kbType??'default'} autoCapitalize={autoCap??'none'}
          onFocus={()=>Animated.timing(a,{toValue:1,duration:180,useNativeDriver:false}).start()}
          onBlur ={()=>Animated.timing(a,{toValue:0,duration:180,useNativeDriver:false}).start()}
          onSubmitEditing={onSubmit} returnKeyType={returnKey??'next'} />
        {right && <View style={{marginLeft:10}}>{right}</View>}
      </Animated.View>
      {err && <Text style={F.err}>{err}</Text>}
    </View>
  );
};
const F = StyleSheet.create({
  wrap: {flexDirection:'row',alignItems:'center',backgroundColor:INBG,borderWidth:1.5,borderRadius:14,paddingHorizontal:16,height:54},
  inp:  {flex:1,color:TPRI,fontSize:15},
  err:  {color:ERR,fontSize:12,marginTop:4},
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export const RegisterScreen: React.FC = () => {
  const nav      = useNavigation<Nav>();
  const register = useRegister();

  const [role,       setRole]       = useState<Role>(ROLES.CANDIDATE);
  const [showPw,     setShowPw]     = useState(false);
  const [showCfm,    setShowCfm]    = useState(false);
  const [showRef,    setShowRef]    = useState(false);

  const headerA = useRef(new Animated.Value(0)).current;
  const formA   = useRef(new Animated.Value(0)).current;
  const rolesY  = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerA, {toValue:1,duration:450,useNativeDriver:true}),
      Animated.parallel([
        Animated.timing(formA,  {toValue:1,duration:400,useNativeDriver:true}),
        Animated.spring(rolesY, {toValue:0,tension:50,friction:8,useNativeDriver:true}),
      ]),
    ]).start();
  }, []);

  const {control,handleSubmit} = useForm<FormData>({
    resolver:zodResolver(schema),
    defaultValues:{name:'',email:'',password:'',confirmPassword:'',referralCode:''},
  });

  const onSubmit = handleSubmit(d =>
    register.mutate({name:d.name,email:d.email,password:d.password,role,referralCode:d.referralCode?.trim()||undefined})
  );

  const apiErr = (() => {
    const e = register.error as any;
    if (!e) return undefined;
    if (!e.response) return 'Cannot reach the server.';
    return e.response?.data?.message ?? 'Registration failed.';
  })();

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={[S.blob,{top:-60,right:-60,backgroundColor:GOLD}]} />
      <View style={[S.blob,{width:180,height:180,bottom:-50,left:-50,backgroundColor:'#8B5CF6'}]} />

      <SafeAreaView style={{flex:1}} edges={['top','bottom']}>
        <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
          <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Back */}
            <Pressable onPress={()=>nav.goBack()} style={S.backBtn}>
              <View style={S.backCircle}><Ionicons name="arrow-back" size={18} color={TPRI} /></View>
            </Pressable>

            {/* Header with real logo */}
            <Animated.View style={{opacity:headerA,marginBottom:20}}>
              <View style={S.logoRow}>
                <View style={S.logoGlow} />
                <Image source={require('../../../assets/logo.png')} style={S.logoImg} resizeMode="contain" />
                <View style={S.logoTextWrap}>
                  <Text style={S.logoTitle}>Join Banana</Text>
                  <Text style={S.logoSub}>Start your professional journey</Text>
                </View>
              </View>
            </Animated.View>

            {/* Role pills */}
            <Animated.View style={{opacity:formA,transform:[{translateY:rolesY}],marginBottom:20}}>
              <Text style={S.sectionLbl}>I AM JOINING AS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10,paddingBottom:4}}>
                {ROLES_CFG.map(item => {
                  const active = role===item.role;
                  return (
                    <Pressable key={item.role} onPress={()=>setRole(item.role as Role)}
                      style={[S.pill,{borderColor:active?item.color:BORDER,backgroundColor:active?`${item.color}18`:INBG}]}>
                      <Text style={{fontSize:18}}>{item.emoji}</Text>
                      <View style={{flex:1}}>
                        <Text style={[S.pillLabel,{color:active?item.color:TPRI}]}>{item.label}</Text>
                        <Text style={S.pillDesc}>{item.desc}</Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={18} color={item.color} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            {/* Error */}
            {apiErr && (
              <View style={S.errBox}>
                <Ionicons name="alert-circle-outline" size={15} color={ERR} />
                <Text style={{color:ERR,fontSize:13,flex:1}}>{apiErr}</Text>
              </View>
            )}

            {/* Form */}
            <Animated.View style={{opacity:formA}}>
              <Text style={S.sectionLbl}>YOUR DETAILS</Text>

              <Controller control={control} name="name" render={({field,fieldState})=>(
                <Field ph="Full Name" val={field.value} onChange={field.onChange}
                  autoCap="words" err={fieldState.error?.message}
                  left={<Ionicons name="person-outline" size={18} color={TMUT} />} />
              )} />
              <Controller control={control} name="email" render={({field,fieldState})=>(
                <Field ph="Email address" val={field.value} onChange={field.onChange}
                  kbType="email-address" err={fieldState.error?.message}
                  left={<Ionicons name="mail-outline" size={18} color={TMUT} />} />
              )} />
              <Controller control={control} name="password" render={({field,fieldState})=>(
                <Field ph="Password (min 8 chars)" val={field.value} onChange={field.onChange}
                  secure={!showPw} err={fieldState.error?.message}
                  left={<Ionicons name="lock-closed-outline" size={18} color={TMUT} />}
                  right={<Pressable onPress={()=>setShowPw(v=>!v)}><Ionicons name={showPw?'eye-off-outline':'eye-outline'} size={18} color={TMUT} /></Pressable>} />
              )} />
              <Controller control={control} name="confirmPassword" render={({field,fieldState})=>(
                <Field ph="Confirm Password" val={field.value} onChange={field.onChange}
                  secure={!showCfm} err={fieldState.error?.message}
                  returnKey="done" onSubmit={onSubmit}
                  left={<Ionicons name="lock-closed-outline" size={18} color={TMUT} />}
                  right={<Pressable onPress={()=>setShowCfm(v=>!v)}><Ionicons name={showCfm?'eye-off-outline':'eye-outline'} size={18} color={TMUT} /></Pressable>} />
              )} />

              {/* Referral */}
              <Pressable onPress={()=>setShowRef(v=>!v)} style={S.refToggle}>
                <Ionicons name={showRef?'chevron-up':'chevron-down'} size={14} color={GOLD} />
                <Text style={{color:GOLD,fontSize:13,fontWeight:'600'}}>
                  {showRef?'Hide referral code':'Have a referral code?'}
                </Text>
              </Pressable>
              {showRef && (
                <Controller control={control} name="referralCode" render={({field})=>(
                  <Field ph="Referral Code (optional)" val={field.value??''} onChange={field.onChange}
                    autoCap="characters"
                    left={<Ionicons name="gift-outline" size={18} color={TMUT} />} />
                )} />
              )}

              {/* CTA */}
              <Pressable
                style={({pressed})=>[S.cta,{opacity:pressed?0.88:1}]}
                onPress={onSubmit} disabled={register.isPending}
              >
                <Text style={S.ctaTxt}>{register.isPending?'Creating Account…':'Create Account'}</Text>
              </Pressable>

              <Text style={S.terms}>
                By creating an account you agree to our{' '}
                <Text style={{color:GOLD}}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={{color:GOLD}}>Privacy Policy</Text>.
              </Text>

              <View style={{flexDirection:'row',justifyContent:'center',marginTop:16,gap:4}}>
                <Text style={{color:TMUT,fontSize:14}}>Already have an account?</Text>
                <Pressable onPress={()=>nav.navigate('Login')}>
                  <Text style={{color:GOLD,fontSize:14,fontWeight:'700'}}>Sign In</Text>
                </Pressable>
              </View>
            </Animated.View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const S = StyleSheet.create({
  root:  {flex:1,backgroundColor:NAVY},
  scroll:{flexGrow:1,paddingHorizontal:24,paddingTop:16,paddingBottom:48},
  blob:  {position:'absolute',width:220,height:220,borderRadius:999,opacity:0.07},

  backBtn:    {marginBottom:16},
  backCircle: {width:40,height:40,borderRadius:12,backgroundColor:'rgba(255,255,255,0.07)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:BORDER},

  // Logo row header
  logoRow:     {flexDirection:'row',alignItems:'center',gap:16},
  logoGlow:    {position:'absolute',width:90,height:90,borderRadius:45,backgroundColor:GOLD,opacity:0.08,shadowColor:GOLD,shadowOffset:{width:0,height:0},shadowOpacity:1,shadowRadius:30,elevation:20},
  logoImg:     {width:70,height:70,zIndex:1},
  logoTextWrap:{flex:1},
  logoTitle:   {fontSize:24,fontWeight:'900',color:TPRI,letterSpacing:-0.3},
  logoSub:     {fontSize:13,color:TMUT,marginTop:2},

  sectionLbl: {fontSize:11,color:TMUT,letterSpacing:1.2,marginBottom:12,textTransform:'uppercase'},

  // Role pills
  pill:      {flexDirection:'row',alignItems:'center',gap:10,borderWidth:1.5,borderRadius:14,paddingHorizontal:14,paddingVertical:12,minWidth:175},
  pillLabel: {fontSize:13,fontWeight:'700'},
  pillDesc:  {fontSize:11,color:TMUT,marginTop:1},

  errBox: {flexDirection:'row',gap:8,alignItems:'flex-start',backgroundColor:'rgba(239,68,68,0.10)',borderColor:ERR,borderWidth:1,borderRadius:10,padding:12,marginBottom:16},

  refToggle: {flexDirection:'row',alignItems:'center',gap:6,marginBottom:10},

  cta:    {backgroundColor:GOLD,borderRadius:16,height:56,alignItems:'center',justifyContent:'center',marginTop:8,shadowColor:GOLD,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:16,elevation:8},
  ctaTxt: {color:NAVY,fontSize:16,fontWeight:'800',letterSpacing:0.3},

  terms: {color:TMUT,fontSize:12,textAlign:'center',marginTop:14,lineHeight:18},
});

export default RegisterScreen;