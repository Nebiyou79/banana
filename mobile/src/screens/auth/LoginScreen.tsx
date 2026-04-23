// src/screens/auth/LoginScreen.tsx
// Real Banana logo · Email / Mobile tab · Ethiopia +251 · Animated entrance

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, TextInput,
  Animated, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const { width } = Dimensions.get('window');

const NAVY   = '#050D1A';
const NAVY3  = '#0F2040';
const GOLD   = '#F1BB03';
const TPRI   = '#F8FAFC';
const TMUT   = '#64748B';
const BORDER = 'rgba(255,255,255,0.10)';
const INBG   = 'rgba(255,255,255,0.05)';
const ERR    = '#EF4444';

// ─── Input component ──────────────────────────────────────────────────────────
const Field: React.FC<{
  ph: string; val: string; onChange: (v:string)=>void;
  secure?: boolean; kbType?: any; autoCap?: any;
  left?: React.ReactNode; right?: React.ReactNode;
  err?: string; onSubmit?: ()=>void; returnKey?: any;
}> = ({ph,val,onChange,secure,kbType,autoCap,left,right,err,onSubmit,returnKey}) => {
  const a = useRef(new Animated.Value(0)).current;
  const bc = a.interpolate({inputRange:[0,1],outputRange:[err?ERR:BORDER,err?ERR:GOLD]});
  return (
    <View style={{marginBottom:16}}>
      <Animated.View style={[F.wrap,{borderColor:bc}]}>
        {left  && <View style={F.side}>{left}</View>}
        <TextInput style={F.inp} placeholder={ph} placeholderTextColor={TMUT}
          value={val} onChangeText={onChange} secureTextEntry={secure}
          keyboardType={kbType??'default'} autoCapitalize={autoCap??'none'}
          onFocus={()=>Animated.timing(a,{toValue:1,duration:200,useNativeDriver:false}).start()}
          onBlur ={()=>Animated.timing(a,{toValue:0,duration:200,useNativeDriver:false}).start()}
          onSubmitEditing={onSubmit} returnKeyType={returnKey??'done'} />
        {right && <View style={F.sideR}>{right}</View>}
      </Animated.View>
      {err && <Text style={F.err}>{err}</Text>}
    </View>
  );
};
const F = StyleSheet.create({
  wrap: {flexDirection:'row',alignItems:'center',backgroundColor:INBG,borderWidth:1.5,borderRadius:14,paddingHorizontal:16,height:56},
  side: {marginRight:10}, sideR:{marginLeft:10},
  inp:  {flex:1,color:TPRI,fontSize:15,height:'100%'},
  err:  {color:ERR,fontSize:12,marginTop:4},
});

// ─── Schema ───────────────────────────────────────────────────────────────────
const emailSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6,'Password must be at least 6 characters'),
});
type EmailForm = z.infer<typeof emailSchema>;
type Nav = NativeStackNavigationProp<AuthStackParamList>;

// ─── Screen ───────────────────────────────────────────────────────────────────
export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const login      = useLogin();

  const [tab,      setTab]      = useState<'email'|'mobile'>('email');
  const [showPw,   setShowPw]   = useState(false);
  const [mobileV,  setMobileV]  = useState('');
  const [pwV,      setPwV]      = useState('');

  // Entrance
  const fadeA  = useRef(new Animated.Value(0)).current;
  const slideA = useRef(new Animated.Value(32)).current;
  const tabA   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeA,  {toValue:1,duration:600,useNativeDriver:true}),
      Animated.spring(slideA, {toValue:0,tension:50,friction:8,useNativeDriver:true}),
    ]).start();
  }, []);

  const tabLeft = tabA.interpolate({inputRange:[0,1],outputRange:['2%','52%']});

  const switchTab = (t:'email'|'mobile') => {
    setTab(t);
    Animated.spring(tabA,{toValue:t==='email'?0:1,useNativeDriver:false,tension:60,friction:8}).start();
  };

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues:{email:'',password:''},
  });
  const onEmailSubmit = emailForm.handleSubmit(d => login.mutate(d));

  const apiErr = (() => {
    const e = login.error as any;
    if (!e) return undefined;
    if (!e.response) return 'Cannot reach server.';
    return e.response?.data?.message ?? 'Login failed.';
  })();

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      {/* BG blobs */}
      <View style={[S.blob,{top:-80,right:-80,backgroundColor:GOLD,opacity:0.07}]} />
      <View style={[S.blob,{width:200,height:200,bottom:-60,left:-60,backgroundColor:'#3B82F6',opacity:0.06}]} />

      <SafeAreaView style={{flex:1}} edges={['top','bottom']}>
        <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
          <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            <Animated.View style={{opacity:fadeA,transform:[{translateY:slideA}],alignItems:'center'}}>
              {/* Real logo */}
              <View style={S.logoWrap}>
                <View style={S.logoGlow} />
                <Image source={require('../../../assets/logo.png')} style={S.logoImg} resizeMode="contain" />
              </View>

              <Text style={S.headline}>Sign In to Banana</Text>
              <Text style={S.sub}>Welcome back! Please enter your details.</Text>

              {/* Tab */}
              <View style={S.tabBar}>
                <Animated.View style={[S.tabSlider,{left:tabLeft}]} />
                <Pressable style={S.tabBtn} onPress={()=>switchTab('email')}>
                  <Text style={[S.tabTxt, tab==='email' && S.tabTxtActive]}>📧 Email</Text>
                </Pressable>
                <Pressable style={S.tabBtn} onPress={()=>switchTab('mobile')}>
                  <Text style={[S.tabTxt, tab==='mobile' && S.tabTxtActive]}>📱 Mobile</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* API Error */}
            {apiErr && (
              <View style={S.errBox}>
                <Ionicons name="alert-circle-outline" size={15} color={ERR} />
                <Text style={{color:ERR,fontSize:13,flex:1}}>{apiErr}</Text>
              </View>
            )}

            {/* ─── Email form ─── */}
            {tab==='email' && (
              <Animated.View style={{opacity:fadeA}}>
                <Controller control={emailForm.control} name="email"
                  render={({field,fieldState}) => (
                    <Field ph="Email address" val={field.value} onChange={field.onChange}
                      kbType="email-address" err={fieldState.error?.message} returnKey="next"
                      left={<Ionicons name="mail-outline" size={18} color={TMUT} />} />
                  )}
                />
                <Controller control={emailForm.control} name="password"
                  render={({field,fieldState}) => (
                    <Field ph="Password" val={field.value} onChange={field.onChange}
                      secure={!showPw} err={fieldState.error?.message}
                      onSubmit={onEmailSubmit} returnKey="done"
                      left={<Ionicons name="lock-closed-outline" size={18} color={TMUT} />}
                      right={<Pressable onPress={()=>setShowPw(v=>!v)}><Ionicons name={showPw?'eye-off-outline':'eye-outline'} size={18} color={TMUT} /></Pressable>}
                    />
                  )}
                />
              </Animated.View>
            )}

            {/* ─── Mobile form ─── */}
            {tab==='mobile' && (
              <Animated.View style={{opacity:fadeA}}>
                <Text style={S.fieldLabel}>Phone Number</Text>
                <View style={[F.wrap,{borderColor:BORDER,marginBottom:16}]}>
                  <View style={S.countryWrap}>
                    <Text style={{fontSize:18}}>🇪🇹</Text>
                    <Text style={S.countryCode}>+251</Text>
                    <Ionicons name="chevron-down" size={12} color={TMUT} />
                  </View>
                  <View style={S.phoneDivider} />
                  <TextInput style={[F.inp,{paddingLeft:8}]} placeholder="9X XXX XXXX"
                    placeholderTextColor={TMUT} value={mobileV} onChangeText={setMobileV} keyboardType="phone-pad" />
                  <Ionicons name="call-outline" size={18} color={TMUT} />
                </View>
                <Field ph="Password" val={pwV} onChange={setPwV} secure={!showPw}
                  left={<Ionicons name="lock-closed-outline" size={18} color={TMUT} />}
                  right={<Pressable onPress={()=>setShowPw(v=>!v)}><Ionicons name={showPw?'eye-off-outline':'eye-outline'} size={18} color={TMUT} /></Pressable>} />
                <View style={S.comingSoon}>
                  <Ionicons name="time-outline" size={14} color={GOLD} />
                  <Text style={{color:GOLD,fontSize:12,flex:1}}>Mobile login coming soon — use email for now.</Text>
                </View>
              </Animated.View>
            )}

            {/* Forgot */}
            <Pressable onPress={()=>navigation.navigate('ForgotPassword')} style={{alignSelf:'flex-end',marginBottom:12}}>
              <Text style={{color:GOLD,fontSize:13,fontWeight:'600'}}>Forgot your password?</Text>
            </Pressable>

            {/* CTA */}
            <Pressable
              style={({pressed})=>[S.cta,{opacity:pressed?0.88:1}]}
              onPress={tab==='email'?onEmailSubmit:undefined}
              disabled={login.isPending}
            >
              <Text style={S.ctaTxt}>{login.isPending?'Signing in…':'Sign In'}</Text>
            </Pressable>

            {/* Footer */}
            <View style={{flexDirection:'row',justifyContent:'center',marginTop:24,gap:4}}>
              <Text style={{color:TMUT,fontSize:14}}>New here?</Text>
              <Pressable onPress={()=>navigation.navigate('Register')}>
                <Text style={{color:GOLD,fontSize:14,fontWeight:'700'}}>Create Account</Text>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const S = StyleSheet.create({
  root:  {flex:1,backgroundColor:NAVY},
  scroll:{flexGrow:1,paddingHorizontal:24,paddingTop:16,paddingBottom:40},
  blob:  {position:'absolute',width:260,height:260,borderRadius:999},

  // Logo
  logoWrap: {alignItems:'center',marginBottom:8,marginTop:12,position:'relative'},
  logoGlow: {position:'absolute',width:130,height:130,borderRadius:65,backgroundColor:GOLD,opacity:0.10,shadowColor:GOLD,shadowOffset:{width:0,height:0},shadowOpacity:1,shadowRadius:40,elevation:20},
  logoImg:  {width:110,height:110,zIndex:1},

  headline: {fontSize:24,fontWeight:'900',color:TPRI,marginTop:8,letterSpacing:-0.3},
  sub:      {fontSize:14,color:TMUT,marginTop:4,marginBottom:24},

  // Tab
  tabBar:     {width:'100%',height:48,backgroundColor:NAVY3,borderRadius:14,flexDirection:'row',alignItems:'center',marginBottom:24,position:'relative',padding:4},
  tabSlider:  {position:'absolute',width:'46%',height:40,backgroundColor:GOLD,borderRadius:11},
  tabBtn:     {flex:1,alignItems:'center',justifyContent:'center',zIndex:1},
  tabTxt:     {fontSize:14,color:TMUT,fontWeight:'600'},
  tabTxtActive:{color:NAVY},

  // Error
  errBox: {flexDirection:'row',gap:8,alignItems:'flex-start',backgroundColor:'rgba(239,68,68,0.10)',borderColor:ERR,borderWidth:1,borderRadius:10,padding:12,marginBottom:16},

  // Mobile
  fieldLabel:  {color:'rgba(248,250,252,0.6)',fontSize:12,marginBottom:6,letterSpacing:0.5},
  countryWrap: {flexDirection:'row',alignItems:'center',gap:4},
  countryCode: {color:TPRI,fontSize:14,fontWeight:'600'},
  phoneDivider:{width:1,height:24,backgroundColor:BORDER,marginHorizontal:10},
  comingSoon:  {flexDirection:'row',gap:8,alignItems:'flex-start',backgroundColor:'rgba(241,187,3,0.08)',borderColor:'rgba(241,187,3,0.25)',borderWidth:1,borderRadius:10,padding:12,marginBottom:8},

  // CTA
  cta:    {backgroundColor:GOLD,borderRadius:16,height:56,alignItems:'center',justifyContent:'center',shadowColor:GOLD,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:16,elevation:8},
  ctaTxt: {color:NAVY,fontSize:16,fontWeight:'800',letterSpacing:0.3},
});

export default LoginScreen;