// src/screens/auth/RegisterScreen.tsx
// MIGRATED: useTheme() only, AuthShell, spacing/radius tokens, Ionicons only, no emoji

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  TextInput, Animated, Image, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useRegister } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import type { Role } from '../../constants/roles';
import { AuthShell } from './_AuthShell';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  referralCode:    z.string().optional(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type FormData = z.infer<typeof schema>;

interface RoleCfg {
  role:    Role;
  label:   string;
  desc:    string;
  icon:    keyof typeof Ionicons.glyphMap;
  colorKey: 'candidate' | 'freelancer' | 'company' | 'organization';
}

const ROLES_CFG: RoleCfg[] = [
  { role: ROLES.CANDIDATE,    label: 'Job Seeker',   desc: 'Find jobs & grow',  icon: 'person-outline',   colorKey: 'candidate'    },
  { role: ROLES.FREELANCER,   label: 'Freelancer',   desc: 'Win projects',       icon: 'rocket-outline',   colorKey: 'freelancer'   },
  { role: ROLES.COMPANY,      label: 'Company',      desc: 'Post jobs & hire',   icon: 'business-outline', colorKey: 'company'      },
  { role: ROLES.ORGANIZATION, label: 'Organization', desc: 'Post tenders',       icon: 'people-outline',   colorKey: 'organization' },
] as const;

// ─── Field ────────────────────────────────────────────────────────────────────
const Field: React.FC<{
  ph: string; val: string; onChange: (v: string) => void;
  secure?: boolean; kbType?: any; autoCap?: any;
  left?: React.ReactNode; right?: React.ReactNode;
  err?: string; onSubmit?: () => void; returnKey?: any;
}> = ({ ph, val, onChange, secure, kbType, autoCap, left, right, err, onSubmit, returnKey }) => {
  const { colors: c, radius, spacing } = useTheme();
  const a  = useRef(new Animated.Value(0)).current;
  const bc = a.interpolate({ inputRange: [0, 1], outputRange: [err ? c.danger : c.inputBorder, err ? c.danger : c.primary] });

  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Animated.View style={[F.wrap, { backgroundColor: c.inputBg, borderColor: bc, borderRadius: radius.md }]}>
        {left  && <View style={{ marginRight: 10 }}>{left}</View>}
        <TextInput
          style={[F.inp, { color: c.text }]}
          placeholder={ph} placeholderTextColor={c.inputPlaceholder}
          value={val} onChangeText={onChange}
          secureTextEntry={secure} keyboardType={kbType ?? 'default'}
          autoCapitalize={autoCap ?? 'none'}
          onFocus={() => Animated.timing(a, { toValue: 1, duration: 180, useNativeDriver: false }).start()}
          onBlur ={() => Animated.timing(a, { toValue: 0, duration: 180, useNativeDriver: false }).start()}
          onSubmitEditing={onSubmit} returnKeyType={returnKey ?? 'next'}
        />
        {right && <View style={{ marginLeft: 10 }}>{right}</View>}
      </Animated.View>
      {err && <Text style={[F.err, { color: c.danger }]}>{err}</Text>}
    </View>
  );
};

const F = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 16, height: 54 },
  inp:  { flex: 1, fontSize: 15 },
  err:  { fontSize: 12, marginTop: 4 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const register   = useRegister();
  const { colors: c, spacing, radius, type } = useTheme();

  const [role,    setRole]    = useState<Role>(ROLES.CANDIDATE);
  const [showPw,  setShowPw]  = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [showRef, setShowRef] = useState(false);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', referralCode: '' },
  });

  const onSubmit = handleSubmit(d =>
    register.mutate({ name: d.name, email: d.email, password: d.password, role, referralCode: d.referralCode?.trim() || undefined })
  );

  const apiErr = (() => {
    const e = register.error as any;
    if (!e) return undefined;
    if (!e.response) return 'Cannot reach the server.';
    return e.response?.data?.message ?? 'Registration failed.';
  })();

  return (
    <AuthShell>
      {/* Logo row */}
      <View style={S.logoRow}>
        <View style={[S.logoGlow, { backgroundColor: withAlpha(c.primary, 0.08) }]} />
        <Image source={require('../../../assets/logo.png')} style={S.logoImg} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={[type.h2, { color: c.text, fontWeight: '900' }]}>Join Banana</Text>
          <Text style={[type.bodySm, { color: c.textMuted, marginTop: 2 }]}>Start your professional journey</Text>
        </View>
      </View>

      {/* Role pills */}
      <Text style={[S.sectionLbl, { color: c.textMuted }]}>I AM JOINING AS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4, marginBottom: spacing.lg }}>
        {ROLES_CFG.map(item => {
          const active  = role === item.role;
          const accent  = c[item.colorKey];
          return (
            <Pressable
              key={item.role}
              onPress={() => setRole(item.role as Role)}
              style={[
                S.pill,
                {
                  borderColor:     active ? accent : c.border,
                  backgroundColor: active ? withAlpha(accent, 0.10) : c.inputBg,
                  borderRadius:    radius.lg,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Ionicons name={item.icon} size={20} color={active ? accent : c.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={[type.bodySm, { color: active ? accent : c.text, fontWeight: '700' }]}>{item.label}</Text>
                <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{item.desc}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={18} color={accent} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* API error */}
      {apiErr && (
        <View style={[S.errBox, { backgroundColor: withAlpha(c.danger, 0.10), borderColor: c.danger, borderRadius: radius.md, marginBottom: spacing.md }]}>
          <Ionicons name="alert-circle-outline" size={15} color={c.danger} />
          <Text style={[type.bodySm, { color: c.danger, flex: 1, marginLeft: spacing.sm }]}>{apiErr}</Text>
        </View>
      )}

      {/* Form */}
      <Text style={[S.sectionLbl, { color: c.textMuted }]}>YOUR DETAILS</Text>

      <Controller control={control} name="name" render={({ field, fieldState }) => (
        <Field ph="Full Name" val={field.value} onChange={field.onChange}
          autoCap="words" err={fieldState.error?.message}
          left={<Ionicons name="person-outline" size={18} color={c.textMuted} />}
        />
      )} />
      <Controller control={control} name="email" render={({ field, fieldState }) => (
        <Field ph="Email address" val={field.value} onChange={field.onChange}
          kbType="email-address" err={fieldState.error?.message}
          left={<Ionicons name="mail-outline" size={18} color={c.textMuted} />}
        />
      )} />
      <Controller control={control} name="password" render={({ field, fieldState }) => (
        <Field ph="Password (min 8 chars)" val={field.value} onChange={field.onChange}
          secure={!showPw} err={fieldState.error?.message}
          left={<Ionicons name="lock-closed-outline" size={18} color={c.textMuted} />}
          right={<Pressable onPress={() => setShowPw(v => !v)} hitSlop={8}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.textMuted} /></Pressable>}
        />
      )} />
      <Controller control={control} name="confirmPassword" render={({ field, fieldState }) => (
        <Field ph="Confirm Password" val={field.value} onChange={field.onChange}
          secure={!showCfm} err={fieldState.error?.message}
          returnKey="done" onSubmit={onSubmit}
          left={<Ionicons name="lock-closed-outline" size={18} color={c.textMuted} />}
          right={<Pressable onPress={() => setShowCfm(v => !v)} hitSlop={8}><Ionicons name={showCfm ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.textMuted} /></Pressable>}
        />
      )} />

      {/* Referral toggle */}
      <Pressable onPress={() => setShowRef(v => !v)} style={S.refToggle} hitSlop={8}>
        <Ionicons name={showRef ? 'chevron-up' : 'chevron-down'} size={14} color={c.primary} />
        <Text style={[type.bodySm, { color: c.primary, fontWeight: '600' }]}>
          {showRef ? 'Hide referral code' : 'Have a referral code?'}
        </Text>
      </Pressable>
      {showRef && (
        <Controller control={control} name="referralCode" render={({ field }) => (
          <Field ph="Referral Code (optional)" val={field.value ?? ''} onChange={field.onChange}
            autoCap="characters"
            left={<Ionicons name="gift-outline" size={18} color={c.textMuted} />}
          />
        )} />
      )}

      {/* CTA */}
      <Pressable
        style={({ pressed }) => [S.cta, { backgroundColor: c.primary, borderRadius: radius.md, opacity: pressed ? 0.88 : 1, marginTop: spacing.sm }]}
        onPress={onSubmit}
        disabled={register.isPending}
        accessibilityRole="button"
      >
        <Text style={[S.ctaTxt, { color: c.bg }]}>
          {register.isPending ? 'Creating Account…' : 'Create Account'}
        </Text>
      </Pressable>

      <Text style={[type.caption, { color: c.textMuted, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 }]}>
        By creating an account you agree to our{' '}
        <Text style={{ color: c.primary }}>Terms of Service</Text>
        {' '}and{' '}
        <Text style={{ color: c.primary }}>Privacy Policy</Text>.
      </Text>

      <View style={[S.footer, { marginTop: spacing.lg }]}>
        <Text style={[type.body, { color: c.textMuted }]}>Already have an account?</Text>
        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Text style={[type.body, { color: c.primary, fontWeight: '700' }]}> Sign In</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
};

const S = StyleSheet.create({
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  logoGlow:   { position: 'absolute', width: 90, height: 90, borderRadius: 45 },
  logoImg:    { width: 70, height: 70, zIndex: 1 },
  sectionLbl: { fontSize: 11, letterSpacing: 1.2, marginBottom: 12, textTransform: 'uppercase' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, minWidth: 175 },
  errBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderWidth: 1, padding: 12 },
  refToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cta:     { height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaTxt:  { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  footer:  { flexDirection: 'row', justifyContent: 'center' },
});

export default RegisterScreen;