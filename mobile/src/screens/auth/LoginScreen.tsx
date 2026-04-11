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
import { AuthDivider, FormError } from '../../components/auth/AuthDivider';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { useLogin } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;
type Nav = NativeStackNavigationProp<AuthStackParamList>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export const LoginScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((data) => login.mutate(data));

  // ── Error extraction ──────────────────────────────────────────────────────
  // login.error comes from Axios. Two cases:
  //   1. Network error (no .response) → phone can't reach the server
  //   2. Backend 4xx/5xx → .response.data.message contains the reason
  const apiError = (() => {
    const err = login.error as any;
    if (!err) return undefined;
    if (!err.response) return 'Cannot reach the server. Check your network or API URL in .env';
    return err.response?.data?.message ?? 'Login failed. Please try again.';
  })();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.scroll, { padding: spacing[5] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader
          title="Welcome back"
          subtitle="Sign in to your Banana account"
        />

        {/* API error banner — visible prop prevents hidden-error bug */}
        <FormError message={apiError} visible={!!apiError} />

        {/* Email */}
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

        {/* Password */}
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              label="Password"
              placeholder="Enter your password"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
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
          )}
        />

        {/* Forgot password */}
        <TouchableOpacity
          style={s.forgotRow}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={{ color: colors.primary, fontSize: typography.sm, fontWeight: '600' }}>
            Forgot your password?
          </Text>
        </TouchableOpacity>

        {/* Sign In */}
        <Button
          title="Sign In"
          onPress={onSubmit}
          loading={login.isPending}
          fullWidth
          size="lg"
        />

        <AuthDivider />
        <SocialAuthButtons />

        {/* Register link */}
        <View style={s.bottomRow}>
          <Text style={{ color: colors.textMuted, fontSize: typography.base }}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={{ color: colors.primary, fontSize: typography.base, fontWeight: '700' }}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  scroll:    { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 8, marginTop: -4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
});