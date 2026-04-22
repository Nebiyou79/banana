// src/screens/auth/ResetPasswordScreen.tsx
// Step 1: Enter OTP → Step 2: New password → Navigate to Login on success

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar,
  TextInput, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useVerifyResetOtp, useResetPassword } from '../../hooks/useAuth';
import { OtpInput } from '../../components/auth/OtpInput';
import { PasswordStrength } from '../../components/auth/PasswordStrength';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const NAVY     = '#050D1A';
const GOLD     = '#F1BB03';
const TEXT_PRI = '#F8FAFC';
const TEXT_MUT = '#64748B';
const BORDER   = 'rgba(255,255,255,0.10)';
const ERROR    = '#EF4444';

type Nav   = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type Route = RouteProp<AuthStackParamList, 'ResetPassword'>;

const pwSchema = z.object({
  newPassword:     z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});
type PwForm = z.infer<typeof pwSchema>;

const PremiumInput: React.FC<{
  placeholder: string; value: string; onChangeText: (t: string) => void;
  secureTextEntry?: boolean; leftSlot?: React.ReactNode; rightSlot?: React.ReactNode;
  error?: string; onSubmitEditing?: () => void;
}> = ({ placeholder, value, onChangeText, secureTextEntry, leftSlot, rightSlot, error, onSubmitEditing }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const borderColor = anim.interpolate({ inputRange:[0,1], outputRange:[error ? ERROR : BORDER, error ? ERROR : GOLD] });
  return (
    <View style={{ marginBottom: 14 }}>
      <Animated.View style={[pStyles.wrap, { borderColor }]}>
        {leftSlot && <View style={{marginRight:10}}>{leftSlot}</View>}
        <TextInput style={pStyles.input} placeholder={placeholder} placeholderTextColor={TEXT_MUT}
          value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry}
          onFocus={() => Animated.timing(anim,{toValue:1,duration:200,useNativeDriver:false}).start()}
          onBlur={() => Animated.timing(anim,{toValue:0,duration:200,useNativeDriver:false}).start()}
          onSubmitEditing={onSubmitEditing} />
        {rightSlot && <View style={{marginLeft:10}}>{rightSlot}</View>}
      </Animated.View>
      {error && <Text style={pStyles.err}>{error}</Text>}
    </View>
  );
};
const pStyles = StyleSheet.create({
  wrap: { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.05)', borderWidth:1.5, borderRadius:14, paddingHorizontal:16, height:54 },
  input: { flex:1, color:TEXT_PRI, fontSize:15 },
  err: { color:ERROR, fontSize:12, marginTop:4 },
});

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { email }  = route.params;

  const [step, setStep]             = useState<1|2>(1);
  const [otp, setOtp]               = useState('');
  const [otpError, setOtpError]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const verifyResetOtp = useVerifyResetOtp();
  const resetPassword  = useResetPassword();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }),
    ]).start();
  }, [step]);

  const animateStep = (nextStep: 1|2) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      slideAnim.setValue(20);
      fadeAnim.setValue(0);
    });
  };

  const { control, handleSubmit, watch } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const handleVerifyOtp = () => {
    if (otp.length < 6) { setOtpError('Enter the complete 6-digit code'); return; }
    setOtpError('');
    verifyResetOtp.mutate({ email, otp }, { onSuccess: () => animateStep(2) });
  };

  const onSubmitPassword = handleSubmit(data =>
    resetPassword.mutate({ email, otp, newPassword: data.newPassword }),
  );

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  const step1Error  = otpError || (verifyResetOtp.error as any)?.response?.data?.message;
  const step2Error  = (resetPassword.error as any)?.response?.data?.message;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={[styles.bgDot]} />

      <SafeAreaView style={{ flex: 1 }} edges={['top','bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Back */}
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <View style={styles.backCircle}>
                <Ionicons name="arrow-back" size={18} color={TEXT_PRI} />
              </View>
            </Pressable>

            {/* Step indicator */}
            <View style={styles.stepRow}>
              {([1, 2] as const).map(s => {
                const done   = step > s;
                const active = step === s;
                return (
                  <View key={s} style={styles.stepItem}>
                    <View style={[styles.stepDot, { backgroundColor: done || active ? GOLD : 'rgba(255,255,255,0.08)', borderColor: done || active ? GOLD : BORDER }]}>
                      {done
                        ? <Ionicons name="checkmark" size={14} color={NAVY} />
                        : <Text style={[styles.stepNum, { color: active ? NAVY : TEXT_MUT }]}>{s}</Text>
                      }
                    </View>
                    <Text style={[styles.stepLabel, { color: active || done ? GOLD : TEXT_MUT }]}>
                      {s === 1 ? 'Verify code' : 'New password'}
                    </Text>
                  </View>
                );
              })}
              <View style={[styles.stepLine, { backgroundColor: step === 2 ? GOLD : BORDER }]} />
            </View>

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* ── Step 1: OTP ── */}
              {step === 1 && (
                <>
                  <View style={styles.iconWrap}>
                    <View style={styles.iconHalo} />
                    <Text style={{ fontSize: 52 }}>📧</Text>
                  </View>
                  <Text style={styles.title}>Check your email</Text>
                  <Text style={styles.subtitle}>Enter the 6-digit code sent to {maskedEmail}</Text>

                  {step1Error && (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle-outline" size={15} color={ERROR} />
                      <Text style={{ color: ERROR, fontSize: 13, flex: 1 }}>{step1Error}</Text>
                    </View>
                  )}

                  <View style={styles.otpWrapper}>
                    <OtpInput length={6} value={otp} onChange={setOtp} error={step1Error} />
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.cta, { opacity: pressed || otp.length < 6 ? 0.7 : 1 }]}
                    onPress={handleVerifyOtp}
                    disabled={verifyResetOtp.isPending || otp.length < 6}
                  >
                    <Text style={styles.ctaText}>{verifyResetOtp.isPending ? 'Verifying…' : 'Verify Code'}</Text>
                  </Pressable>
                </>
              )}

              {/* ── Step 2: New Password ── */}
              {step === 2 && (
                <>
                  <View style={styles.iconWrap}>
                    <View style={[styles.iconHalo, { backgroundColor: '#10B981' }]} />
                    <Text style={{ fontSize: 52 }}>🔒</Text>
                  </View>
                  <Text style={styles.title}>Set New Password</Text>
                  <Text style={styles.subtitle}>Choose a strong password for your account.</Text>

                  {step2Error && (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle-outline" size={15} color={ERROR} />
                      <Text style={{ color: ERROR, fontSize: 13, flex: 1 }}>{step2Error}</Text>
                    </View>
                  )}

                  <Controller control={control} name="newPassword"
                    render={({ field, fieldState }) => (
                      <>
                        <PremiumInput placeholder="New Password" value={field.value} onChangeText={field.onChange}
                          secureTextEntry={!showPw} error={fieldState.error?.message}
                          leftSlot={<Ionicons name="lock-closed-outline" size={18} color={TEXT_MUT} />}
                          rightSlot={<Pressable onPress={() => setShowPw(v => !v)}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT_MUT} /></Pressable>} />
                        <PasswordStrength password={field.value} />
                      </>
                    )}
                  />

                  <Controller control={control} name="confirmPassword"
                    render={({ field, fieldState }) => (
                      <PremiumInput placeholder="Confirm New Password" value={field.value} onChangeText={field.onChange}
                        secureTextEntry={!showConfirm} error={fieldState.error?.message}
                        leftSlot={<Ionicons name="lock-closed-outline" size={18} color={TEXT_MUT} />}
                        rightSlot={<Pressable onPress={() => setShowConfirm(v => !v)}><Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT_MUT} /></Pressable>}
                        onSubmitEditing={onSubmitPassword} />
                    )}
                  />

                  <Pressable
                    style={({ pressed }) => [styles.cta, { marginTop: 8, opacity: pressed ? 0.88 : 1 }]}
                    onPress={onSubmitPassword}
                    disabled={resetPassword.isPending}
                  >
                    <Text style={styles.ctaText}>{resetPassword.isPending ? 'Resetting…' : 'Reset Password'}</Text>
                  </Pressable>
                </>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: NAVY },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  bgDot:  { position: 'absolute', width: 220, height: 220, borderRadius: 999, top: -60, right: -60, backgroundColor: GOLD, opacity: 0.06 },

  backBtn:    { marginBottom: 20 },
  backCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },

  stepRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 32, marginBottom: 28, position: 'relative' },
  stepItem: { alignItems: 'center' },
  stepDot:  { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepNum:  { fontSize: 13, fontWeight: '700' },
  stepLabel:{ fontSize: 11, marginTop: 5, fontWeight: '600' },
  stepLine: { position: 'absolute', height: 1.5, width: 60, top: 15, left: '50%', marginLeft: -30 },

  iconWrap: { alignItems: 'center', marginBottom: 20, position: 'relative' },
  iconHalo: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: GOLD, opacity: 0.10, shadowColor: GOLD, shadowOffset:{width:0,height:0}, shadowOpacity:0.8, shadowRadius:30, elevation:15 },

  title:    { fontSize: 26, fontWeight: '900', color: TEXT_PRI, marginBottom: 8 },
  subtitle: { fontSize: 14, color: TEXT_MUT, marginBottom: 24, lineHeight: 22 },

  errorBanner: { flexDirection:'row', gap:8, alignItems:'flex-start', backgroundColor:'rgba(239,68,68,0.10)', borderColor:ERROR, borderWidth:1, borderRadius:10, padding:12, marginBottom:16 },
  otpWrapper:  { alignItems: 'center', marginBottom: 28 },

  cta:     { backgroundColor: GOLD, borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', shadowColor: GOLD, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:16, elevation:8 },
  ctaText: { color: NAVY, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});

export default ResetPasswordScreen;