// src/screens/auth/RegisterScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';

import { useTheme }            from '../../hooks/useTheme';
import { Input }               from '../../components/ui/Input';
import { Button }              from '../../components/ui/Button';
import { AuthHeader }          from '../../components/auth/AuthHeader';
import { FormError }           from '../../components/auth/FormError';
import { PasswordStrength }    from '../../components/auth/PasswordStrength';
import { RoleCard }            from '../../components/auth/RoleCard';
import { useRegister }         from '../../hooks/useAuth';
import { ROLES }               from '../../constants/roles';
import type { Role }           from '../../constants/roles';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

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
    path:    ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;
type Nav      = NativeStackNavigationProp<AuthStackParamList>;

interface RoleOption {
  role:         Role;
  label:        string;
  description:  string;
  emoji:        string;
  icon:         string;
  primaryColor: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role:         ROLES.CANDIDATE,
    label:        'Job Seeker',
    description:  'Find jobs, apply, and grow your career',
    emoji:        '🎯',
    icon:         'briefcase-outline',
    primaryColor: '#3B82F6',
  },
  {
    role:         ROLES.FREELANCER,
    label:        'Freelancer',
    description:  'Showcase your skills and win freelance projects',
    emoji:        '💼',
    icon:         'laptop-outline',
    primaryColor: '#10B981',
  },
  {
    role:         ROLES.COMPANY,
    label:        'Company',
    description:  'Post jobs and hire great talent',
    emoji:        '🏢',
    icon:         'business-outline',
    primaryColor: '#F1BB03',
  },
  {
    role:         ROLES.ORGANIZATION,
    label:        'Organization',
    description:  'Post tenders and find professionals',
    emoji:        '🏛️',
    icon:         'people-outline',
    primaryColor: '#8B5CF6',
  },
];

export const RegisterScreen: React.FC = () => {
  const { colors, type, spacing, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const register   = useRegister();

  const [selectedRole, setSelectedRole] = useState<Role>(ROLES.CANDIDATE);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  const { control, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', password: '', confirmPassword: '', referralCode: '',
    },
  });

  const watchedPassword = watch('password');

  const onSubmit = handleSubmit((data) =>
    register.mutate({
      name:         data.name,
      email:        data.email,
      password:     data.password,
      role:         selectedRole,
      referralCode: data.referralCode?.trim() || undefined,
    }),
  );

  const apiError = (() => {
    const err = register.error as any;
    if (!err) return undefined;
    if (!err.response) return 'Cannot reach the server. Check your network.';
    return err.response?.data?.message ?? 'Registration failed. Please try again.';
  })();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bgPrimary }]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingHorizontal: spacing.screen },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back-outline" size={22} color={colors.textPrimary} />
          </Pressable>

          <AuthHeader
            title="Create account"
            subtitle="Join Banana and start your journey"
          />

          <FormError message={apiError} visible={!!apiError} />

          {/* ── Role picker ───────────────────────────────── */}
          <Text style={[type.label, { color: colors.textMuted, marginBottom: spacing.md }]}>
            I am joining as
          </Text>

          {ROLE_OPTIONS.map((item, i) => (
            <RoleCard
              key={item.role}
              role={item.role}
              label={item.label}
              description={item.description}
              emoji={item.emoji}
              icon={item.icon}
              primaryColor={item.primaryColor}
              selected={selectedRole === item.role}
              onPress={() => setSelectedRole(item.role)}
              index={i}
            />
          ))}

          <View style={[styles.divider, { backgroundColor: colors.borderPrimary, marginVertical: spacing.xl }]} />

          {/* ── Full Name ─────────────────────────────────── */}
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
                autoCapitalize="words"
                leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
              />
            )}
          />

          {/* ── Email ─────────────────────────────────────── */}
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

          {/* ── Password ──────────────────────────────────── */}
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
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  }
                />
                <PasswordStrength password={field.value} />
              </>
            )}
          />

          {/* ── Confirm Password ──────────────────────────── */}
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
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                rightIcon={
                  <Pressable
                    onPress={() => setShowConfirm((v) => !v)}
                    accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>
                }
              />
            )}
          />

          {/* ── Referral Code ─────────────────────────────── */}
          <Pressable
            onPress={() => setShowReferral((v) => !v)}
            style={styles.referralToggle}
            accessibilityLabel="Toggle referral code field"
          >
            <Ionicons
              name={showReferral ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={14}
              color={colors.accent}
            />
            <Text style={[type.bodySm, { color: colors.accent, fontWeight: '600' }]}>
              {showReferral ? 'Hide referral code' : 'Have a referral code?'}
            </Text>
          </Pressable>

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

          {/* ── Submit ────────────────────────────────────── */}
          <Button
            title="Create Account"
            onPress={onSubmit}
            loading={register.isPending}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.sm }}
          />

          {/* Terms */}
          <Text
            style={[
              type.caption,
              {
                color:           colors.textMuted,
                textAlign:       'center',
                marginTop:       spacing.lg,
                paddingHorizontal: spacing.md,
                lineHeight:      18,
              },
            ]}
          >
            By creating an account you agree to our{' '}
            <Text style={{ color: colors.accent }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: colors.accent }}>Privacy Policy</Text>.
          </Text>

          {/* Login link */}
          <View style={styles.bottomRow}>
            <Text style={[type.body, { color: colors.textMuted }]}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={[type.body, { color: colors.accent, fontWeight: '700' }]}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:           { flex: 1 },
  scroll:         { flexGrow: 1, paddingTop: 16, paddingBottom: 40 },
  backBtn:        { marginBottom: 20 },
  divider:        { height: 1 },
  referralToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 4 },
  bottomRow:      { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 8 },
});

export default RegisterScreen;
