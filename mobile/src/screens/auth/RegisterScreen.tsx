import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { FormError } from '../../components/auth/FormError';
import { PasswordStrength } from '../../components/auth/PasswordStrength';
import { useRegister } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { ROLES } from '../../constants/roles';
import type { Role } from '../../constants/roles';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    name:            z.string().min(2, 'Name must be at least 2 characters'),
    email:           z.string().email('Enter a valid email address'),
    password:        z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    referralCode:    z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;
type Nav = NativeStackNavigationProp<AuthStackParamList>;

// ─── Selectable roles ─────────────────────────────────────────────────────────

const SELECTABLE_ROLES: { role: Role; label: string; emoji: string; color: string }[] = [
  { role: ROLES.CANDIDATE,    label: 'Job Seeker',   emoji: '🎯', color: '#2563EB' },
  { role: ROLES.FREELANCER,   label: 'Freelancer',   emoji: '💼', color: '#7C3AED' },
  { role: ROLES.COMPANY,      label: 'Company',      emoji: '🏢', color: '#059669' },
  { role: ROLES.ORGANIZATION, label: 'Organization', emoji: '🏛️', color: '#DC2626' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export const RegisterScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const register = useRegister();

  const [selectedRole, setSelectedRole] = useState<Role>(ROLES.CANDIDATE);
  const [showPassword,  setShowPassword]  = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [showReferral,  setShowReferral]  = useState(false);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', password: '', confirmPassword: '', referralCode: '',
    },
  });

  const onSubmit = handleSubmit((data) => {
    register.mutate({
      name:         data.name,
      email:        data.email,
      password:     data.password,
      // NOTE: confirmPassword is handled inside authService.register()
      // It sends both password and confirmPassword to satisfy backend validation.
      role:         selectedRole,
      referralCode: data.referralCode?.trim() || undefined,
    });
  });

  // ── Error extraction ──────────────────────────────────────────────────────
  const apiError = (() => {
    const err = register.error as any;
    if (!err) return undefined;
    if (!err.response) return 'Cannot reach the server. Check your network or API URL.';
    return err.response?.data?.message ?? 'Registration failed. Please try again.';
  })();

  const activeRole = SELECTABLE_ROLES.find((r) => r.role === selectedRole)!;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: 40, paddingTop: spacing[5] }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={{ marginBottom: 16 }} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </TouchableOpacity>

        <AuthHeader
          title="Create account"
          subtitle="Join Banana and start your journey"
        />

        {/* API error */}
        <FormError message={apiError} visible={!!apiError} />

        {/* ── Role picker ──────────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.text, fontSize: typography.sm }]}>
          I am joining as
        </Text>
        <View style={s.roleRow}>
          {SELECTABLE_ROLES.map((item) => {
            const isActive = selectedRole === item.role;
            return (
              <TouchableOpacity
                key={item.role}
                onPress={() => setSelectedRole(item.role)}
                activeOpacity={0.8}
                style={[
                  s.roleChip,
                  {
                    backgroundColor: isActive ? item.color + '15' : colors.surface,
                    borderColor:     isActive ? item.color : colors.border,
                    borderWidth:     isActive ? 2 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
                <Text
                  style={{
                    color:      isActive ? item.color : colors.textMuted,
                    fontWeight: isActive ? '700' : '500',
                    fontSize:   typography.xs,
                    marginLeft: 4,
                  }}
                >
                  {item.label}
                </Text>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={14} color={item.color} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={{ color: colors.textMuted, fontSize: typography.xs, textAlign: 'center', marginBottom: 20 }}>
          Registering as: {activeRole.emoji} {activeRole.label}
        </Text>

        {/* ── Full Name ─────────────────────────────────────────────────────── */}
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              returnKeyType="next"
              leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
            />
          )}
        />

        {/* ── Email ─────────────────────────────────────────────────────────── */}
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              label="Email address"
              placeholder="you@example.com"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
            />
          )}
        />

        {/* ── Password ──────────────────────────────────────────────────────── */}
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <>
              <Input
                label="Password"
                placeholder="Minimum 8 characters"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                }
              />
              <PasswordStrength password={field.value} />
            </>
          )}
        />

        {/* ── Confirm Password ──────────────────────────────────────────────── */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Input
              label="Confirm Password"
              placeholder="Repeat your password"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              secureTextEntry={!showConfirm}
              returnKeyType="next"
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              }
            />
          )}
        />

        {/* ── Referral code ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={s.referralToggle}
          onPress={() => setShowReferral((v) => !v)}
        >
          <Ionicons
            name={showReferral ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={14}
            color={colors.primary}
          />
          <Text style={{ color: colors.primary, fontSize: typography.sm, fontWeight: '600', marginLeft: 4 }}>
            {showReferral ? 'Hide referral code' : 'Have a referral code?'}
          </Text>
        </TouchableOpacity>

        {showReferral && (
          <Controller
            control={control}
            name="referralCode"
            render={({ field }) => (
              <Input
                label="Referral Code (optional)"
                placeholder="e.g. BANANA-ABC123"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                autoCapitalize="characters"
                leftIcon={<Ionicons name="gift-outline" size={18} color={colors.textMuted} />}
              />
            )}
          />
        )}

        {/* ── Submit ────────────────────────────────────────────────────────── */}
        <Button
          title="Create Account"
          onPress={onSubmit}
          loading={register.isPending}
          fullWidth
          size="lg"
          style={{ marginTop: 8 }}
        />

        {/* Terms */}
        <Text style={[s.terms, { color: colors.textMuted, fontSize: typography.xs }]}>
          By creating an account you agree to our{' '}
          <Text style={{ color: colors.primary }}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={{ color: colors.primary }}>Privacy Policy</Text>.
        </Text>

        {/* Login link */}
        <View style={s.bottomRow}>
          <Text style={{ color: colors.textMuted, fontSize: typography.base }}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: colors.primary, fontSize: typography.base, fontWeight: '700' }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  sectionLabel:   { fontWeight: '600', marginBottom: 10 },
  roleRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  roleChip:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 99, minWidth: '47%', justifyContent: 'center' },
  referralToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 4 },
  terms:          { textAlign: 'center', lineHeight: 18, marginTop: 16, paddingHorizontal: 8 },
  bottomRow:      { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 8 },
});