// src/screens/auth/LoginScreen.tsx

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

import { useTheme }          from '../../hooks/useTheme';
import { Input }             from '../../components/ui/Input';
import { Button }            from '../../components/ui/Button';
import { AuthHeader }        from '../../components/auth/AuthHeader';
import { AuthDivider }       from '../../components/auth/AuthDivider';
import { FormError }         from '../../components/auth/FormError';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { useLogin }          from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;
type Nav      = NativeStackNavigationProp<AuthStackParamList>;

export const LoginScreen: React.FC = () => {
  const { colors, type, spacing, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const login      = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((data) => login.mutate(data));

  const apiError = (() => {
    const err = login.error as any;
    if (!err) return undefined;
    if (!err.response) return 'Cannot reach the server. Check your network.';
    return err.response?.data?.message ?? 'Login failed. Please try again.';
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
            { paddingHorizontal: spacing.screen, paddingVertical: spacing['3xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader
            title="Welcome back"
            subtitle="Sign in to your Banana account"
          />

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
                leftIcon={
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                }
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
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                }
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
            )}
          />

          {/* Forgot password */}
          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotRow}
            accessibilityLabel="Forgot your password?"
          >
            <Text style={[type.bodySm, { color: colors.accent, fontWeight: '600' }]}>
              Forgot your password?
            </Text>
          </Pressable>

          {/* Sign In */}
          <Button
            title="Sign In"
            onPress={onSubmit}
            loading={login.isPending}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.sm }}
          />

          <AuthDivider />
          <SocialAuthButtons />

          {/* Register link */}
          <View style={styles.bottomRow}>
            <Text style={[type.body, { color: colors.textMuted }]}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={[type.body, { color: colors.accent, fontWeight: '700' }]}>
                Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  scroll:    { flexGrow: 1, justifyContent: 'center' },
  forgotRow: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 12 },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
});

export default LoginScreen;
