// src/screens/auth/LoginScreen.tsx
// MIGRATED: useTheme() only, AppHeader, AuthShell, spacing/radius tokens, Ionicons only

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  TextInput, Animated, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useLogin } from '../../hooks/useAuth';
import { AuthShell } from './_AuthShell';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

const emailSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type EmailForm = z.infer<typeof emailSchema>;

// ─── Input field ──────────────────────────────────────────────────────────────
const Field: React.FC<{
  ph: string; val: string; onChange: (v: string) => void;
  secure?: boolean; kbType?: any;
  left?: React.ReactNode; right?: React.ReactNode;
  err?: string; onSubmit?: () => void; returnKey?: any;
}> = ({ ph, val, onChange, secure, kbType, left, right, err, onSubmit, returnKey }) => {
  const { colors: c, radius, spacing } = useTheme();
  const a  = useRef(new Animated.Value(0)).current;
  const bc = a.interpolate({ inputRange: [0, 1], outputRange: [err ? c.danger : c.inputBorder, err ? c.danger : c.primary] });

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Animated.View style={[F.wrap, { backgroundColor: c.inputBg, borderColor: bc, borderRadius: radius.md }]}>
        {left  && <View style={F.side}>{left}</View>}
        <TextInput
          style={[F.inp, { color: c.text }]}
          placeholder={ph}
          placeholderTextColor={c.inputPlaceholder}
          value={val}
          onChangeText={onChange}
          secureTextEntry={secure}
          keyboardType={kbType ?? 'default'}
          autoCapitalize="none"
          onFocus={() => Animated.timing(a, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
          onBlur ={() => Animated.timing(a, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
          onSubmitEditing={onSubmit}
          returnKeyType={returnKey ?? 'done'}
        />
        {right && <View style={F.sideR}>{right}</View>}
      </Animated.View>
      {err && <Text style={[F.err, { color: c.danger }]}>{err}</Text>}
    </View>
  );
};

const F = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 16, height: 56 },
  side:  { marginRight: 10 },
  sideR: { marginLeft: 10 },
  inp:   { flex: 1, fontSize: 15, height: '100%' },
  err:   { fontSize: 12, marginTop: 4 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const login      = useLogin();
  const { colors: c, spacing, radius, type } = useTheme();

  const [tab,    setTab]    = useState<'email' | 'mobile'>('email');
  const [showPw, setShowPw] = useState(false);
  const tabA = useRef(new Animated.Value(0)).current;

  const tabLeft = tabA.interpolate({ inputRange: [0, 1], outputRange: ['2%', '52%'] });

  const switchTab = (t: 'email' | 'mobile') => {
    setTab(t);
    Animated.spring(tabA, { toValue: t === 'email' ? 0 : 1, useNativeDriver: false, tension: 60, friction: 8 }).start();
  };

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });
  const onEmailSubmit = emailForm.handleSubmit(d => login.mutate(d));

  const apiErr = (() => {
    const e = login.error as any;
    if (!e) return undefined;
    if (!e.response) return 'Cannot reach server.';
    return e.response?.data?.message ?? 'Login failed.';
  })();

  return (
    <AuthShell showBack={false}>
      {/* Logo */}
      <View style={S.logoWrap}>
        <View style={[S.logoGlow, { backgroundColor: withAlpha(c.primary, 0.10) }]} />
        <Image source={require('../../../assets/logo.png')} style={S.logoImg} resizeMode="contain" />
      </View>

      <Text style={[type.h1, { color: c.text, textAlign: 'center', fontWeight: '900', marginTop: spacing.sm }]}>
        Sign In to Banana
      </Text>
      <Text style={[type.bodySm, { color: c.textMuted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl }]}>
        Welcome back! Please enter your details.
      </Text>

      {/* Tab bar */}
      <View style={[S.tabBar, { backgroundColor: c.surface, borderRadius: radius.lg }]}>
        <Animated.View style={[S.tabSlider, { left: tabLeft, backgroundColor: c.primary, borderRadius: radius.md }]} />
        <Pressable style={S.tabBtn} onPress={() => switchTab('email')}>
          <Ionicons name="mail-outline" size={15} color={tab === 'email' ? c.bg : c.textMuted} />
          <Text style={[type.bodySm, { color: tab === 'email' ? c.bg : c.textMuted, fontWeight: '700' }]}>Email</Text>
        </Pressable>
        <Pressable style={S.tabBtn} onPress={() => switchTab('mobile')}>
          <Ionicons name="phone-portrait-outline" size={15} color={tab === 'mobile' ? c.bg : c.textMuted} />
          <Text style={[type.bodySm, { color: tab === 'mobile' ? c.bg : c.textMuted, fontWeight: '700' }]}>Mobile</Text>
        </Pressable>
      </View>

      {/* API error */}
      {apiErr && (
        <View style={[S.errBox, { backgroundColor: withAlpha(c.danger, 0.10), borderColor: c.danger, borderRadius: radius.md, marginTop: spacing.md }]}>
          <Ionicons name="alert-circle-outline" size={15} color={c.danger} />
          <Text style={[type.bodySm, { color: c.danger, flex: 1, marginLeft: spacing.sm }]}>{apiErr}</Text>
        </View>
      )}

      {/* Email form */}
      {tab === 'email' && (
        <View style={{ marginTop: spacing.lg }}>
          <Controller control={emailForm.control} name="email" render={({ field, fieldState }) => (
            <Field
              ph="Email address" val={field.value} onChange={field.onChange}
              kbType="email-address" err={fieldState.error?.message} returnKey="next"
              left={<Ionicons name="mail-outline" size={18} color={c.textMuted} />}
            />
          )} />
          <Controller control={emailForm.control} name="password" render={({ field, fieldState }) => (
            <Field
              ph="Password" val={field.value} onChange={field.onChange}
              secure={!showPw} err={fieldState.error?.message}
              onSubmit={onEmailSubmit} returnKey="done"
              left={<Ionicons name="lock-closed-outline" size={18} color={c.textMuted} />}
              right={
                <Pressable onPress={() => setShowPw(v => !v)} hitSlop={8}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.textMuted} />
                </Pressable>
              }
            />
          )} />
        </View>
      )}

      {/* Mobile tab placeholder */}
      {tab === 'mobile' && (
        <View style={[S.comingSoon, { backgroundColor: withAlpha(c.primary, 0.08), borderColor: withAlpha(c.primary, 0.25), borderRadius: radius.md, marginTop: spacing.lg }]}>
          <Ionicons name="time-outline" size={16} color={c.primary} />
          <Text style={[type.bodySm, { color: c.primary, flex: 1, marginLeft: spacing.sm }]}>
            Mobile login coming soon — use email for now.
          </Text>
        </View>
      )}

      {/* Forgot */}
      <Pressable
        onPress={() => navigation.navigate('ForgotPassword')}
        style={{ alignSelf: 'flex-end', marginBottom: spacing.md, marginTop: spacing.sm }}
        hitSlop={8}
      >
        <Text style={[type.bodySm, { color: c.primary, fontWeight: '600' }]}>Forgot your password?</Text>
      </Pressable>

      {/* CTA */}
      <Pressable
        style={({ pressed }) => [S.cta, { backgroundColor: c.primary, borderRadius: radius.md, opacity: pressed ? 0.88 : 1 }]}
        onPress={tab === 'email' ? onEmailSubmit : undefined}
        disabled={login.isPending}
        accessibilityRole="button"
      >
        <Text style={[S.ctaTxt, { color: c.bg }]}>
          {login.isPending ? 'Signing in…' : 'Sign In'}
        </Text>
      </Pressable>

      {/* Footer */}
      <View style={[S.footer, { marginTop: spacing.xl }]}>
        <Text style={[type.body, { color: c.textMuted }]}>New here?</Text>
        <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
          <Text style={[type.body, { color: c.primary, fontWeight: '700' }]}> Create Account</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
};

const S = StyleSheet.create({
  logoWrap: { alignItems: 'center', marginBottom: 8, position: 'relative' },
  logoGlow: { position: 'absolute', width: 130, height: 130, borderRadius: 65 },
  logoImg:  { width: 110, height: 110, zIndex: 1 },
  tabBar: {
    flexDirection: 'row', alignItems: 'center',
    height: 48, position: 'relative', padding: 4,
    marginBottom: 4,
  },
  tabSlider: { position: 'absolute', width: '46%', height: 40 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 },
  errBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderWidth: 1, padding: 12 },
  comingSoon: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, padding: 12 },
  cta: { height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaTxt: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
});

export default LoginScreen;