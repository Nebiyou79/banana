// src/screens/auth/ResetPasswordScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX: "Invalid or expired reset token"
//
// Root cause: The old code passed the raw OTP string as the `token` to
// resetPasswordWithToken(). The backend however generates a separate
// `PasswordReset` record on verifyResetOTP and returns a real `resetToken`.
// We must capture that token from Step-1's response and pass it in Step-2.
//
// Flow:
//  ForgotPassword → sends OTP email
//  Step 1 (this screen): verifyResetOtp({ email, otp })
//        ↳ backend returns { data: { resetToken, email } }
//        ↳ we store resetToken in state
//  Step 2: resetPasswordWithToken({ token: resetToken, password, confirmPassword })
//        ↳ backend looks up PasswordReset by token ← CORRECT
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar,
  TextInput, Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { OtpInput } from '../../components/auth/OtpInput';
import { PasswordStrength } from '../../components/auth/PasswordStrength';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/authService';

const NAVY    = '#050D1A';
const GOLD    = '#F1BB03';
const TPRI    = '#F8FAFC';
const TMUT    = '#64748B';
const BORDER  = 'rgba(255,255,255,0.10)';
const ERR     = '#EF4444';
const OK      = '#10B981';

type Nav   = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type Route = RouteProp<AuthStackParamList, 'ResetPassword'>;

const pwSchema = z.object({
  newPassword:     z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});
type PwForm = z.infer<typeof pwSchema>;

// ─── Shared input ─────────────────────────────────────────────────────────────
const Inp: React.FC<{
  ph: string; val: string; onChange: (v: string) => void;
  secure?: boolean; left?: React.ReactNode; right?: React.ReactNode;
  err?: string; onSubmit?: () => void;
}> = ({ ph, val, onChange, secure, left, right, err, onSubmit }) => {
  const a = useRef(new Animated.Value(0)).current;
  const bc = a.interpolate({ inputRange:[0,1], outputRange:[err ? ERR : BORDER, err ? ERR : GOLD] });
  return (
    <View style={{ marginBottom: 14 }}>
      <Animated.View style={[IS.wrap, { borderColor: bc }]}>
        {left  && <View style={{ marginRight: 10 }}>{left}</View>}
        <TextInput
          style={IS.inp} placeholder={ph} placeholderTextColor={TMUT}
          value={val} onChangeText={onChange} secureTextEntry={secure}
          onFocus={() => Animated.timing(a,{toValue:1,duration:180,useNativeDriver:false}).start()}
          onBlur ={() => Animated.timing(a,{toValue:0,duration:180,useNativeDriver:false}).start()}
          onSubmitEditing={onSubmit}
        />
        {right && <View style={{ marginLeft: 10 }}>{right}</View>}
      </Animated.View>
      {err && <Text style={IS.err}>{err}</Text>}
    </View>
  );
};
const IS = StyleSheet.create({
  wrap: { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.05)', borderWidth:1.5, borderRadius:14, paddingHorizontal:16, height:54 },
  inp:  { flex:1, color:TPRI, fontSize:15 },
  err:  { color:ERR, fontSize:12, marginTop:4 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export const ResetPasswordScreen: React.FC = () => {
  const nav   = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;
  const { showError, showSuccess } = useToast();

  const [step,         setStep]         = useState<1|2>(1);
  const [otp,          setOtp]          = useState('');
  const [otpErr,       setOtpErr]       = useState('');
  const [resetToken,   setResetToken]   = useState('');  // ← CRITICAL: stores the PasswordReset token
  const [busy1,        setBusy1]        = useState(false);
  const [busy2,        setBusy2]        = useState(false);
  const [showPw,       setShowPw]       = useState(false);
  const [showCfm,      setShowCfm]      = useState(false);

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  const runIn = () => {
    fade.setValue(0); slide.setValue(24);
    Animated.parallel([
      Animated.timing(fade,  { toValue:1, duration:450, useNativeDriver:true }),
      Animated.spring(slide, { toValue:0, tension:55, friction:8, useNativeDriver:true }),
    ]).start();
  };

  useEffect(() => { runIn(); }, [step]);

  const transitionTo = (next: 1|2) => {
    Animated.timing(fade, { toValue:0, duration:150, useNativeDriver:true }).start(() => setStep(next));
  };

  const { control, handleSubmit } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
    defaultValues: { newPassword:'', confirmPassword:'' },
  });

  // ── STEP 1 ────────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (otp.length < 6) { setOtpErr('Enter the 6-digit code'); return; }
    setOtpErr('');
    setBusy1(true);
    try {
      const res = await authService.verifyResetOtp({ email, otp });
      if (res.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);  // ← Store the real PasswordReset token
        transitionTo(2);
      } else {
        setOtpErr(res.message || 'Invalid or expired OTP');
      }
    } catch (e: any) {
      setOtpErr(e?.response?.data?.message ?? e?.message ?? 'Verification failed');
    } finally {
      setBusy1(false);
    }
  };

  // ── STEP 2 ────────────────────────────────────────────────────────────────
  const handleReset = handleSubmit(async (data) => {
    if (!resetToken) {
      showError('Session expired — please start over.');
      nav.goBack();
      return;
    }
    setBusy2(true);
    try {
      // Uses resetToken (NOT the OTP) — matches backend PasswordReset.token lookup
      const res = await authService.resetPasswordWithToken({
        token:           resetToken,
        password:        data.newPassword,
        confirmPassword: data.newPassword,
      });
      if (res.success) {
        showSuccess('Password reset! You can now sign in.');
        nav.reset({ index:0, routes:[{ name:'Login' }] });
      } else {
        showError(res.message || 'Reset failed');
      }
    } catch (e: any) {
      showError(e?.response?.data?.message ?? e?.message ?? 'Reset failed');
    } finally {
      setBusy2(false);
    }
  });

  const masked = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={S.blob1} /><View style={S.blob2} />

      <SafeAreaView style={{ flex:1 }} edges={['top','bottom']}>
        <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':'height'}>
          <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Back */}
            <Pressable onPress={() => nav.goBack()} style={S.backBtn}>
              <View style={S.backCircle}><Ionicons name="arrow-back" size={18} color={TPRI} /></View>
            </Pressable>

            {/* Logo */}
            <View style={S.logoWrap}>
              <View style={S.logoGlow} />
              <Image source={require('../../../assets/logo.png')} style={S.logoImg} resizeMode="contain" />
            </View>

            {/* Step pills */}
            <View style={S.steps}>
              {([1,2] as const).map(s => {
                const done = step > s; const act = step === s;
                return (
                  <View key={s} style={S.stepCol}>
                    <View style={[S.stepDot,{
                      backgroundColor: done ? OK : act ? GOLD : 'rgba(255,255,255,0.07)',
                      borderColor: done ? OK : act ? GOLD : BORDER,
                    }]}>
                      {done
                        ? <Ionicons name="checkmark" size={14} color="#fff" />
                        : <Text style={[S.stepN,{color: act?NAVY:TMUT}]}>{s}</Text>
                      }
                    </View>
                    <Text style={[S.stepLbl,{color: (act||done)?GOLD:TMUT}]}>
                      {s===1?'Verify OTP':'New password'}
                    </Text>
                  </View>
                );
              })}
              <View style={[S.stepLine,{backgroundColor: step===2?OK:BORDER}]} />
            </View>

            {/* Content */}
            <Animated.View style={{ opacity:fade, transform:[{translateY:slide}] }}>

              {/* ─── STEP 1 ─── */}
              {step===1 && <>
                <View style={S.iconWrap}>
                  <View style={[S.iconHalo,{backgroundColor:GOLD}]} />
                  <Text style={S.icon}>📬</Text>
                </View>
                <Text style={S.title}>Enter Reset Code</Text>
                <Text style={S.sub}>6-digit code sent to{'\n'}<Text style={{color:GOLD,fontWeight:'700'}}>{masked}</Text></Text>

                {!!otpErr && (
                  <View style={S.errBox}>
                    <Ionicons name="alert-circle-outline" size={15} color={ERR} />
                    <Text style={{color:ERR,fontSize:13,flex:1}}>{otpErr}</Text>
                  </View>
                )}

                <View style={S.otpWrap}>
                  <OtpInput length={6} value={otp} onChange={setOtp} error={otpErr} />
                </View>

                <Pressable
                  style={({pressed}) => [S.cta,{opacity:pressed||busy1||otp.length<6?0.7:1}]}
                  onPress={handleVerify} disabled={busy1||otp.length<6}
                >
                  <Text style={S.ctaTxt}>{busy1?'Verifying…':'Verify Code'}</Text>
                </Pressable>

                <Pressable onPress={() => nav.goBack()} style={S.link}>
                  <Ionicons name="arrow-back-outline" size={14} color={GOLD} />
                  <Text style={S.linkTxt}>Try a different email</Text>
                </Pressable>
              </>}

              {/* ─── STEP 2 ─── */}
              {step===2 && <>
                <View style={S.iconWrap}>
                  <View style={[S.iconHalo,{backgroundColor:OK}]} />
                  <Text style={S.icon}>🔒</Text>
                </View>
                <Text style={S.title}>Set New Password</Text>
                <Text style={S.sub}>Choose a strong password you haven't used before.</Text>

                <Controller control={control} name="newPassword" render={({field,fieldState}) => (<>
                  <Inp ph="New Password" val={field.value} onChange={field.onChange}
                    secure={!showPw} err={fieldState.error?.message}
                    left={<Ionicons name="lock-closed-outline" size={18} color={TMUT} />}
                    right={<Pressable onPress={()=>setShowPw(v=>!v)}><Ionicons name={showPw?'eye-off-outline':'eye-outline'} size={18} color={TMUT} /></Pressable>}
                  />
                  <PasswordStrength password={field.value} />
                </>)} />

                <Controller control={control} name="confirmPassword" render={({field,fieldState}) => (
                  <Inp ph="Confirm New Password" val={field.value} onChange={field.onChange}
                    secure={!showCfm} err={fieldState.error?.message} onSubmit={handleReset}
                    left={<Ionicons name="lock-closed-outline" size={18} color={TMUT} />}
                    right={<Pressable onPress={()=>setShowCfm(v=>!v)}><Ionicons name={showCfm?'eye-off-outline':'eye-outline'} size={18} color={TMUT} /></Pressable>}
                  />
                )} />

                <Pressable
                  style={({pressed}) => [S.cta,{marginTop:8,opacity:pressed||busy2?0.88:1}]}
                  onPress={handleReset} disabled={busy2}
                >
                  <Text style={S.ctaTxt}>{busy2?'Resetting…':'Reset Password'}</Text>
                </Pressable>
              </>}

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const S = StyleSheet.create({
  root:  { flex:1, backgroundColor:NAVY },
  scroll:{ flexGrow:1, paddingHorizontal:24, paddingTop:16, paddingBottom:48 },
  blob1: { position:'absolute', width:260, height:260, borderRadius:999, top:-80, right:-80, backgroundColor:GOLD, opacity:0.05 },
  blob2: { position:'absolute', width:180, height:180, borderRadius:999, bottom:-60, left:-60, backgroundColor:'#3B82F6', opacity:0.05 },

  backBtn:    { marginBottom:20 },
  backCircle: { width:40, height:40, borderRadius:12, backgroundColor:'rgba(255,255,255,0.07)', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:BORDER },

  logoWrap: { alignItems:'center', marginBottom:28, position:'relative' },
  logoGlow: { position:'absolute', width:100, height:100, borderRadius:50, backgroundColor:GOLD, opacity:0.08, shadowColor:GOLD, shadowOffset:{width:0,height:0}, shadowOpacity:1, shadowRadius:30, elevation:20 },
  logoImg:  { width:80, height:80, zIndex:1 },

  steps:     { flexDirection:'row', justifyContent:'center', alignItems:'flex-start', gap:52, marginBottom:32, position:'relative' },
  stepCol:   { alignItems:'center', zIndex:1 },
  stepDot:   { width:32, height:32, borderRadius:16, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  stepN:     { fontSize:14, fontWeight:'700' },
  stepLbl:   { fontSize:11, marginTop:6, fontWeight:'600', letterSpacing:0.3 },
  stepLine:  { position:'absolute', height:2, width:80, top:15, left:'50%', marginLeft:-40, borderRadius:1 },

  iconWrap: { alignItems:'center', marginBottom:16, position:'relative' },
  iconHalo: { position:'absolute', width:100, height:100, borderRadius:50, opacity:0.12 },
  icon:     { fontSize:52, zIndex:1 },

  title: { fontSize:26, fontWeight:'900', color:TPRI, marginBottom:8 },
  sub:   { fontSize:14, color:TMUT, marginBottom:24, lineHeight:22 },

  errBox: { flexDirection:'row', gap:8, alignItems:'flex-start', backgroundColor:'rgba(239,68,68,0.10)', borderColor:ERR, borderWidth:1, borderRadius:10, padding:12, marginBottom:16 },
  otpWrap:{ alignItems:'center', marginBottom:28 },

  cta:    { backgroundColor:GOLD, borderRadius:16, height:56, alignItems:'center', justifyContent:'center', shadowColor:GOLD, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:16, elevation:8 },
  ctaTxt: { color:NAVY, fontSize:16, fontWeight:'800', letterSpacing:0.3 },

  link:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, marginTop:20 },
  linkTxt: { color:GOLD, fontSize:13, fontWeight:'600' },
});

export default ResetPasswordScreen;