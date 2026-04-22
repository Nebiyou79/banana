// src/screens/auth/RegisterScreen.tsx
// Premium dark-navy register with staggered animations

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
  Animated,
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

// ─── Constants ────────────────────────────────────────────────────────────────
const NAVY      = '#050D1A';
const NAVY3     = '#0F2040';
const GOLD      = '#F1BB03';
const TEXT_PRI  = '#F8FAFC';
const TEXT_MUT  = '#64748B';
const BORDER    = 'rgba(255,255,255,0.10)';
const INPUT_BG  = 'rgba(255,255,255,0.05)';
const ERROR     = '#EF4444';

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  referralCode:    z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;
type Nav = NativeStackNavigationProp<AuthStackParamList>;

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { role: ROLES.CANDIDATE,    label: 'Job Seeker',   desc: 'Find jobs & grow your career',      emoji: '🎯', color: '#3B82F6' },
  { role: ROLES.FREELANCER,   label: 'Freelancer',   desc: 'Win projects, showcase skills',      emoji: '💼', color: '#10B981' },
  { role: ROLES.COMPANY,      label: 'Company',       desc: 'Post jobs & hire great talent',      emoji: '🏢', color: '#F1BB03' },
  { role: ROLES.ORGANIZATION, label: 'Organization', desc: 'Post tenders, find professionals',   emoji: '🏛️', color: '#8B5CF6' },
] as const;

// ─── PremiumInput ─────────────────────────────────────────────────────────────
const PremiumInput: React.FC<{
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  error?: string;
  onSubmitEditing?: () => void;
  returnKeyType?: any;
}> = ({ placeholder, value, onChangeText, secureTextEntry, keyboardType,
        autoCapitalize, leftSlot, rightSlot, error, onSubmitEditing, returnKeyType }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? ERROR : BORDER, error ? ERROR : GOLD],
  });
  return (
    <View style={{ marginBottom: 14 }}>
      <Animated.View style={[pStyles.wrap, { borderColor }]}>
        {leftSlot && <View style={{ marginRight: 10 }}>{leftSlot}</View>}
        <TextInput
          style={pStyles.input}
          placeholder={placeholder}
          placeholderTextColor={TEXT_MUT}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={() => Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
          onBlur={() => Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType ?? 'next'}
        />
        {rightSlot && <View style={{ marginLeft: 10 }}>{rightSlot}</View>}
      </Animated.View>
      {error && <Text style={pStyles.err}>{error}</Text>}
    </View>
  );
};
const pStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, height: 54 },
  input: { flex: 1, color: TEXT_PRI, fontSize: 15 },
  err: { color: ERROR, fontSize: 12, marginTop: 4 },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const register   = useRegister();

  const [selectedRole, setSelectedRole] = useState<Role>(ROLES.CANDIDATE);
  const [showPw, setShowPw]             = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim   = useRef(new Animated.Value(0)).current;
  const rolesAnim  = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(rolesAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }),
      ]),
    ]).start();
  }, []);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', referralCode: '' },
  });

  const onSubmit = handleSubmit(data =>
    register.mutate({
      name: data.name, email: data.email, password: data.password,
      role: selectedRole, referralCode: data.referralCode?.trim() || undefined,
    }),
  );

  const apiError = (() => {
    const err = register.error as any;
    if (!err) return undefined;
    if (!err.response) return 'Cannot reach the server.';
    return err.response?.data?.message ?? 'Registration failed.';
  })();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* BG decorations */}
      <View style={[styles.bgDot, { top: -60, right: -60, backgroundColor: GOLD }]} />
      <View style={[styles.bgDot, { width: 180, height: 180, bottom: -50, left: -50, backgroundColor: '#8B5CF6' }]} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <View style={styles.backCircle}>
                <Ionicons name="arrow-back" size={18} color={TEXT_PRI} />
              </View>
            </Pressable>

            {/* Header */}
            <Animated.View style={{ opacity: headerAnim, marginBottom: 24 }}>
              <Text style={styles.title}>Join Banana</Text>
              <Text style={styles.subtitle}>Create your account and start your journey</Text>
            </Animated.View>

            {/* Role pills */}
            <Animated.View style={{ opacity: formAnim, transform: [{ translateY: rolesAnim }], marginBottom: 24 }}>
              <Text style={styles.sectionLabel}>I AM JOINING AS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                {ROLE_OPTIONS.map(item => {
                  const active = selectedRole === item.role;
                  return (
                    <Pressable
                      key={item.role}
                      onPress={() => setSelectedRole(item.role as Role)}
                      style={[
                        styles.rolePill,
                        { borderColor: active ? item.color : BORDER, backgroundColor: active ? `${item.color}18` : INPUT_BG },
                      ]}
                    >
                      <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                      <View>
                        <Text style={[styles.roleLabel, { color: active ? item.color : TEXT_PRI }]}>{item.label}</Text>
                        <Text style={styles.roleDesc}>{item.desc}</Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={18} color={item.color} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            {/* Error */}
            {apiError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={15} color={ERROR} />
                <Text style={{ color: ERROR, fontSize: 13, flex: 1 }}>{apiError}</Text>
              </View>
            )}

            {/* Form */}
            <Animated.View style={{ opacity: formAnim }}>
              <Text style={styles.sectionLabel}>YOUR DETAILS</Text>

              <Controller control={control} name="name"
                render={({ field, fieldState }) => (
                  <PremiumInput placeholder="Full Name" value={field.value} onChangeText={field.onChange}
                    autoCapitalize="words" error={fieldState.error?.message}
                    leftSlot={<Ionicons name="person-outline" size={18} color={TEXT_MUT} />} />
                )}
              />
              <Controller control={control} name="email"
                render={({ field, fieldState }) => (
                  <PremiumInput placeholder="Email address" value={field.value} onChangeText={field.onChange}
                    keyboardType="email-address" error={fieldState.error?.message}
                    leftSlot={<Ionicons name="mail-outline" size={18} color={TEXT_MUT} />} />
                )}
              />
              <Controller control={control} name="password"
                render={({ field, fieldState }) => (
                  <PremiumInput placeholder="Password (min 8 characters)" value={field.value} onChangeText={field.onChange}
                    secureTextEntry={!showPw} error={fieldState.error?.message}
                    leftSlot={<Ionicons name="lock-closed-outline" size={18} color={TEXT_MUT} />}
                    rightSlot={<Pressable onPress={() => setShowPw(v => !v)}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT_MUT} /></Pressable>} />
                )}
              />
              <Controller control={control} name="confirmPassword"
                render={({ field, fieldState }) => (
                  <PremiumInput placeholder="Confirm Password" value={field.value} onChangeText={field.onChange}
                    secureTextEntry={!showConfirm} error={fieldState.error?.message}
                    leftSlot={<Ionicons name="lock-closed-outline" size={18} color={TEXT_MUT} />}
                    rightSlot={<Pressable onPress={() => setShowConfirm(v => !v)}><Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT_MUT} /></Pressable>}
                    returnKeyType="done" onSubmitEditing={onSubmit} />
                )}
              />

              {/* Referral toggle */}
              <Pressable onPress={() => setShowReferral(v => !v)} style={styles.referralToggle}>
                <Ionicons name={showReferral ? 'chevron-up' : 'chevron-down'} size={14} color={GOLD} />
                <Text style={{ color: GOLD, fontSize: 13, fontWeight: '600' }}>
                  {showReferral ? 'Hide referral code' : 'Have a referral code?'}
                </Text>
              </Pressable>

              {showReferral && (
                <Controller control={control} name="referralCode"
                  render={({ field }) => (
                    <PremiumInput placeholder="Referral Code (optional)" value={field.value ?? ''} onChangeText={field.onChange}
                      autoCapitalize="characters"
                      leftSlot={<Ionicons name="gift-outline" size={18} color={TEXT_MUT} />} />
                  )}
                />
              )}

              {/* CTA */}
              <Pressable
                style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.88 : 1 }]}
                onPress={onSubmit}
                disabled={register.isPending}
              >
                <Text style={styles.ctaText}>{register.isPending ? 'Creating Account…' : 'Create Account'}</Text>
              </Pressable>

              <Text style={styles.termsText}>
                By creating an account you agree to our{' '}
                <Text style={{ color: GOLD }}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={{ color: GOLD }}>Privacy Policy</Text>.
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
                <Text style={{ color: TEXT_MUT, fontSize: 14 }}>Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>Sign In</Text>
                </Pressable>
              </View>
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
  bgDot:  { position: 'absolute', width: 220, height: 220, borderRadius: 999, opacity: 0.07 },

  backBtn:    { marginBottom: 20 },
  backCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },

  title:    { fontSize: 32, fontWeight: '900', color: TEXT_PRI, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: TEXT_MUT, marginTop: 6 },

  sectionLabel: { fontSize: 11, color: TEXT_MUT, letterSpacing: 1.2, marginBottom: 12, textTransform: 'uppercase' },

  rolePill:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, minWidth: 180 },
  roleLabel: { fontSize: 13, fontWeight: '700' },
  roleDesc:  { fontSize: 11, color: TEXT_MUT, marginTop: 1 },

  errorBanner: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(239,68,68,0.10)', borderColor: ERROR, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },

  referralToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },

  cta:     { backgroundColor: GOLD, borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  ctaText: { color: NAVY, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  termsText: { color: TEXT_MUT, fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 18 },
});

export default RegisterScreen;