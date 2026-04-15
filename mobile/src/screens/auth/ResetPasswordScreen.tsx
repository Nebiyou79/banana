// src/screens/auth/ResetPasswordScreen.tsx

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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp }                 from '@react-navigation/native';
import { useForm, Controller }            from 'react-hook-form';
import { zodResolver }                    from '@hookform/resolvers/zod';
import { z }                              from 'zod';
import { Ionicons }                       from '@expo/vector-icons';

import { useTheme }           from '../../hooks/useTheme';
import { Input }              from '../../components/ui/Input';
import { Button }             from '../../components/ui/Button';
import { AuthHeader }         from '../../components/auth/AuthHeader';
import { FormError }          from '../../components/auth/FormError';
import { OtpInput }           from '../../components/auth/OtpInput';
import { PasswordStrength }   from '../../components/auth/PasswordStrength';
import { useVerifyResetOtp, useResetPassword } from '../../hooks/useAuth';
import type { AuthStackParamList }             from '../../navigation/AuthNavigator';

type Nav   = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type Route = RouteProp<AuthStackParamList, 'ResetPassword'>;

const pwSchema = z
  .object({
    newPassword:     z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });
type PwForm = z.infer<typeof pwSchema>;

export const ResetPasswordScreen: React.FC = () => {
  const { colors, type, spacing, radius, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { email }  = route.params;

  const [step, setStep]               = useState<1 | 2>(1);
  const [otp, setOtp]                 = useState('');
  const [otpError, setOtpError]       = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const verifyResetOtp = useVerifyResetOtp();
  const resetPassword  = useResetPassword();

  const { control, handleSubmit, watch } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const watchedPw = watch('newPassword');

  const handleVerifyOtp = () => {
    if (otp.length < 6) { setOtpError('Enter the complete 6-digit code'); return; }
    setOtpError('');
    verifyResetOtp.mutate({ email, otp }, { onSuccess: () => setStep(2) });
  };

  const onSubmitPassword = handleSubmit((data) =>
    resetPassword.mutate({ email, otp, newPassword: data.newPassword }),
  );

  const step1Error = otpError || (verifyResetOtp.error as any)?.response?.data?.message;
  const step2Error = (resetPassword.error as any)?.response?.data?.message;
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

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
        >
          {/* Back */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back-outline" size={22} color={colors.textPrimary} />
          </Pressable>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            {([1, 2] as const).map((s) => {
              const done   = step > s;
              const active = step === s;
              return (
                <View key={s} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor: done || active ? colors.accent : colors.bgSurface,
                        borderColor:     done || active ? colors.accent : colors.borderPrimary,
                        borderRadius:    radius.full,
                      },
                    ]}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : (
                      <Text
                        style={[
                          type.caption,
                          { color: active ? '#fff' : colors.textMuted, fontWeight: '700' },
                        ]}
                      >
                        {s}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      type.caption,
                      { color: active || done ? colors.accent : colors.textMuted, marginTop: 4 },
                    ]}
                  >
                    {s === 1 ? 'Verify code' : 'New password'}
                  </Text>
                </View>
              );
            })}

            {/* connector line */}
            <View
              style={[
                styles.stepLine,
                { backgroundColor: step === 2 ? colors.accent : colors.borderPrimary },
              ]}
            />
          </View>

          {/* ── Step 1: OTP ───────────────────────────────── */}
          {step === 1 && (
            <>
              <AuthHeader
                title="Enter reset code"
                subtitle={`Enter the 6-digit code sent to ${maskedEmail}`}
                showLogo={false}
              />

              <FormError message={step1Error} visible={!!step1Error} />

              <View style={styles.otpWrapper}>
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  error={step1Error}
                />
              </View>

              <Button
                title="Verify Code"
                onPress={handleVerifyOtp}
                loading={verifyResetOtp.isPending}
                disabled={otp.length < 6}
                fullWidth
                size="lg"
                style={{ marginTop: spacing['2xl'] }}
              />
            </>
          )}

          {/* ── Step 2: New Password ──────────────────────── */}
          {step === 2 && (
            <>
              <AuthHeader
                title="Set new password"
                subtitle="Choose a strong password for your account."
                showLogo={false}
              />

              <FormError message={step2Error} visible={!!step2Error} />

              <Controller
                control={control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      label="New Password"
                      placeholder="Minimum 8 characters"
                      value={field.value}
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                      secureTextEntry={!showPwd}
                      returnKeyType="next"
                      leftIcon={
                        <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                      }
                      rightIcon={
                        <Pressable onPress={() => setShowPwd((v) => !v)}>
                          <Ionicons
                            name={showPwd ? 'eye-off-outline' : 'eye-outline'}
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

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <Input
                    label="Confirm Password"
                    placeholder="Repeat your new password"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                    secureTextEntry={!showConfirm}
                    returnKeyType="done"
                    onSubmitEditing={onSubmitPassword}
                    leftIcon={
                      <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                    }
                    rightIcon={
                      <Pressable onPress={() => setShowConfirm((v) => !v)}>
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

              <Button
                title="Reset Password"
                onPress={onSubmitPassword}
                loading={resetPassword.isPending}
                fullWidth
                size="lg"
                style={{ marginTop: spacing.lg }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  scroll:     { flexGrow: 1, paddingTop: 16, paddingBottom: 40 },
  backBtn:    { marginBottom: 16 },

  stepRow:  {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'flex-start',
    gap:            32,
    marginBottom:   28,
    position:       'relative',
  },
  stepItem:  { alignItems: 'center' },
  stepDot:   {
    width:          30,
    height:         30,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  stepLine: {
    position:  'absolute',
    height:    1.5,
    width:     60,
    top:       15,
    left:      '50%',
    marginLeft:-30,
  },
  otpWrapper: { alignItems: 'center', marginTop: 8 },
});

export default ResetPasswordScreen;
