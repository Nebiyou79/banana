// src/screens/auth/ResetPasswordScreen.tsx
// MIGRATED: useTheme() only, AuthShell, spacing/radius tokens, Ionicons only
// BUG FIX preserved: verifyResetOtp returns resetToken, not OTP — used in step 2

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  TextInput, Animated, Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { OtpInput } from '../../components/auth/OtpInput';
import { PasswordStrength } from '../../components/auth/PasswordStrength';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/authService';
import { AuthShell } from './_AuthShell';

type Nav   = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type Route = RouteProp<AuthStackParamList, 'ResetPassword'>;

const pwSchema = z.object({
  newPassword:     z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});
type PwForm = z.infer<typeof pwSchema>;

// ─── Input ────────────────────────────────────────────────────────────────────
const Inp: React.FC<{
  ph: string; val: string; onChange: (v: string) => void;
  secure?: boolean; left?: React.ReactNode; right?: React.ReactNode;
  err?: string; onSubmit?: () => void;
}> = ({ ph, val, onChange, secure, left, right, err, onSubmit }) => {
  const { colors: c, radius, spacing } = useTheme();
  const a  = useRef(new Animated.Value(0)).current;
  const bc = a.interpolate({ inputRange: [0, 1], outputRange: [err ? c.danger : c.inputBorder, err ? c.danger : c.primary] });

  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Animated.View style={[IS.wrap, { backgroundColor: c.inputBg, borderColor: bc, borderRadius: radius.md }]}>
        {left  && <View style={{ marginRight: 10 }}>{left}</View>}
        <TextInput
          style={[IS.inp, { color: c.text }]}
          placeholder={ph} placeholderTextColor={c.inputPlaceholder}
          value={val} onChangeText={onChange} secureTextEntry={secure}
          onFocus={() => Animated.timing(a, { toValue: 1, duration: 180, useNativeDriver: false }).start()}
          onBlur ={() => Animated.timing(a, { toValue: 0, duration: 180, useNativeDriver: false }).start()}
          onSubmitEditing={onSubmit}
        />
        {right && <View style={{ marginLeft: 10 }}>{right}</View>}
      </Animated.View>
      {err && <Text style={[IS.err, { color: c.danger }]}>{err}</Text>}
    </View>
  );
};
const IS = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 16, height: 54 },
  inp:  { flex: 1, fontSize: 15 },
  err:  { fontSize: 12, marginTop: 4 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export const ResetPasswordScreen: React.FC = () => {
  const nav   = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;
  const { showError, showSuccess } = useToast();
  const { colors: c, spacing, radius, type } = useTheme();

  const [step,       setStep]       = useState<1 | 2>(1);
  const [otp,        setOtp]        = useState('');
  const [otpErr,     setOtpErr]     = useState('');
  const [resetToken, setResetToken] = useState('');
  const [busy1,      setBusy1]      = useState(false);
  const [busy2,      setBusy2]      = useState(false);
  const [showPw,     setShowPw]     = useState(false);
  const [showCfm,    setShowCfm]    = useState(false);

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  const runIn = () => {
    fade.setValue(0); slide.setValue(24);
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => { runIn(); }, [step]);

  const transitionTo = (next: 1 | 2) => {
    Animated.timing(fade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setStep(next));
  };

  const { control, handleSubmit } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const handleVerify = async () => {
    if (otp.length < 6) { setOtpErr('Enter the 6-digit code'); return; }
    setOtpErr('');
    setBusy1(true);
    try {
      const res = await authService.verifyResetOtp({ email, otp });
      if (res.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
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

  const handleReset = handleSubmit(async (data) => {
    if (!resetToken) { showError('Session expired — please start over.'); nav.goBack(); return; }
    setBusy2(true);
    try {
      const res = await authService.resetPasswordWithToken({
        token: resetToken, password: data.newPassword, confirmPassword: data.newPassword,
      });
      if (res.success) {
        showSuccess('Password reset! You can now sign in.');
        nav.reset({ index: 0, routes: [{ name: 'Login' }] });
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
  const OK = c.success;

  return (
    <AuthShell>
      {/* Logo */}
      <View style={[S.logoWrap, { marginBottom: spacing.xl }]}>
        <View style={[S.logoGlow, { backgroundColor: withAlpha(c.primary, 0.08) }]} />
        <Image source={require('../../../assets/logo.png')} style={S.logoImg} resizeMode="contain" />
      </View>

      {/* Step pills */}
      <View style={[S.steps, { marginBottom: spacing.xl }]}>
        {([1, 2] as const).map(s => {
          const done = step > s; const act = step === s;
          return (
            <View key={s} style={S.stepCol}>
              <View style={[S.stepDot, {
                backgroundColor: done ? OK : act ? c.primary : withAlpha(c.text, 0.07),
                borderColor:     done ? OK : act ? c.primary : c.border,
              }]}>
                {done
                  ? <Ionicons name="checkmark" size={14} color={c.textInverse} />
                  : <Text style={[S.stepN, { color: act ? c.bg : c.textMuted }]}>{s}</Text>
                }
              </View>
              <Text style={[S.stepLbl, { color: (act || done) ? c.primary : c.textMuted }]}>
                {s === 1 ? 'Verify OTP' : 'New password'}
              </Text>
            </View>
          );
        })}
        <View style={[S.stepLine, { backgroundColor: step === 2 ? OK : c.border }]} />
      </View>

      {/* Content */}
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
        {step === 1 && (
          <>
            <View style={[S.iconWrap, { marginBottom: spacing.md }]}>
              <View style={[S.iconHalo, { backgroundColor: withAlpha(c.primary, 0.10) }]} />
              <Ionicons name="mail-open-outline" size={52} color={c.primary} />
            </View>
            <Text style={[type.h1, { color: c.text, marginBottom: spacing.sm }]}>Enter Reset Code</Text>
            <Text style={[type.body, { color: c.textMuted, marginBottom: spacing.xl, lineHeight: 22 }]}>
              6-digit code sent to{'\n'}
              <Text style={{ color: c.primary, fontWeight: '700' }}>{masked}</Text>
            </Text>

            {!!otpErr && (
              <View style={[S.errBox, { backgroundColor: withAlpha(c.danger, 0.10), borderColor: c.danger, borderRadius: radius.md, marginBottom: spacing.md }]}>
                <Ionicons name="alert-circle-outline" size={15} color={c.danger} />
                <Text style={[type.bodySm, { color: c.danger, flex: 1, marginLeft: spacing.sm }]}>{otpErr}</Text>
              </View>
            )}

            <View style={[S.otpWrap, { marginBottom: spacing.xl }]}>
              <OtpInput length={6} value={otp} onChange={setOtp} error={otpErr} />
            </View>

            <Pressable
              style={({ pressed }) => [S.cta, { backgroundColor: c.primary, borderRadius: radius.md, opacity: pressed || busy1 || otp.length < 6 ? 0.7 : 1 }]}
              onPress={handleVerify}
              disabled={busy1 || otp.length < 6}
            >
              <Text style={[S.ctaTxt, { color: c.bg }]}>{busy1 ? 'Verifying…' : 'Verify Code'}</Text>
            </Pressable>

            <Pressable onPress={() => nav.goBack()} style={[S.link, { marginTop: spacing.xl }]} hitSlop={8}>
              <Ionicons name="arrow-back-outline" size={14} color={c.primary} />
              <Text style={[type.bodySm, { color: c.primary, fontWeight: '600' }]}>Try a different email</Text>
            </Pressable>
          </>
        )}

        {step === 2 && (
          <>
            <View style={[S.iconWrap, { marginBottom: spacing.md }]}>
              <View style={[S.iconHalo, { backgroundColor: withAlpha(OK, 0.10) }]} />
              <Ionicons name="lock-closed-outline" size={52} color={OK} />
            </View>
            <Text style={[type.h1, { color: c.text, marginBottom: spacing.sm }]}>Set New Password</Text>
            <Text style={[type.body, { color: c.textMuted, marginBottom: spacing.xl }]}>
              Choose a strong password you haven't used before.
            </Text>

            <Controller control={control} name="newPassword" render={({ field, fieldState }) => (<>
              <Inp ph="New Password" val={field.value} onChange={field.onChange}
                secure={!showPw} err={fieldState.error?.message}
                left={<Ionicons name="lock-closed-outline" size={18} color={c.textMuted} />}
                right={<Pressable onPress={() => setShowPw(v => !v)} hitSlop={8}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.textMuted} /></Pressable>}
              />
              <PasswordStrength password={field.value} />
            </>)} />

            <Controller control={control} name="confirmPassword" render={({ field, fieldState }) => (
              <Inp ph="Confirm New Password" val={field.value} onChange={field.onChange}
                secure={!showCfm} err={fieldState.error?.message} onSubmit={handleReset}
                left={<Ionicons name="lock-closed-outline" size={18} color={c.textMuted} />}
                right={<Pressable onPress={() => setShowCfm(v => !v)} hitSlop={8}><Ionicons name={showCfm ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.textMuted} /></Pressable>}
              />
            )} />

            <Pressable
              style={({ pressed }) => [S.cta, { backgroundColor: c.primary, borderRadius: radius.md, opacity: pressed || busy2 ? 0.88 : 1, marginTop: spacing.sm }]}
              onPress={handleReset}
              disabled={busy2}
            >
              <Text style={[S.ctaTxt, { color: c.bg }]}>{busy2 ? 'Resetting…' : 'Reset Password'}</Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </AuthShell>
  );
};

const S = StyleSheet.create({
  logoWrap:  { alignItems: 'center', position: 'relative' },
  logoGlow:  { position: 'absolute', width: 100, height: 100, borderRadius: 50 },
  logoImg:   { width: 80, height: 80, zIndex: 1 },
  steps:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 52, position: 'relative' },
  stepCol:   { alignItems: 'center', zIndex: 1 },
  stepDot:   { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepN:     { fontSize: 14, fontWeight: '700' },
  stepLbl:   { fontSize: 11, marginTop: 6, fontWeight: '600', letterSpacing: 0.3 },
  stepLine:  { position: 'absolute', height: 2, width: 80, top: 15, left: '50%', marginLeft: -40, borderRadius: 1 },
  iconWrap:  { alignItems: 'center', position: 'relative' },
  iconHalo:  { position: 'absolute', width: 100, height: 100, borderRadius: 50 },
  errBox:    { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderWidth: 1, padding: 12 },
  otpWrap:   { alignItems: 'center' },
  cta:       { height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaTxt:    { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  link:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});

export default ResetPasswordScreen;