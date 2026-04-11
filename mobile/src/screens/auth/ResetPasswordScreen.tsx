import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { FormError } from '../../components/auth/AuthDivider';
import { OtpInput } from '../../components/auth/OtpInput';
import { PasswordStrength } from '../../components/auth/PasswordStrength';
import { useVerifyResetOtp, useResetPassword } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav   = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type Route = RouteProp<AuthStackParamList, 'ResetPassword'>;

const newPasswordSchema = z.object({
  newPassword:     z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type PasswordForm = z.infer<typeof newPasswordSchema>;

export const ResetPasswordScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { email }  = route.params;

  const [step, setStep]           = useState<1 | 2>(1);
  const [otp, setOtp]             = useState('');
  const [otpError, setOtpError]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const verifyResetOtp = useVerifyResetOtp();
  const resetPassword  = useResetPassword();

  const { control, handleSubmit, watch } = useForm<PasswordForm>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const passwordValue = watch('newPassword');

  // Step 1: verify OTP
  const handleVerifyOtp = () => {
    if (otp.length < 6) { setOtpError('Enter the complete 6-digit code'); return; }
    setOtpError('');
    verifyResetOtp.mutate(
      { email, otp },
      { onSuccess: () => setStep(2) },
    );
  };

  // Step 2: set new password
  const onSubmitPassword = handleSubmit((data) => {
    resetPassword.mutate({ email, otp, newPassword: data.newPassword });
  });

  const step1Error = otpError || (verifyResetOtp.error as any)?.response?.data?.message;
  const step2Error = (resetPassword.error as any)?.response?.data?.message;

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { padding: spacing[6] }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {[1, 2].map((s) => (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  { backgroundColor: step >= s ? colors.primary : colors.borderLight },
                ]}
              >
                <Text style={[styles.stepNum, { color: step >= s ? '#fff' : colors.textMuted }]}>
                  {s}
                </Text>
              </View>
              <Text style={[styles.stepLabel, { color: step >= s ? colors.primary : colors.textMuted, fontSize: typography.xs }]}>
                {s === 1 ? 'Verify code' : 'New password'}
              </Text>
            </View>
          ))}
          <View style={[styles.stepLine, { backgroundColor: step >= 2 ? colors.primary : colors.borderLight }]} />
        </View>

        {/* ── Step 1: Enter OTP ─────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <AuthHeader
              title="Enter reset code"
              subtitle={`Enter the 6-digit code we sent to ${maskedEmail}`}
              showLogo={false}
            />
            <FormError message={step1Error} />
            <View style={styles.otpWrapper}>
              <OtpInput length={6} value={otp} onChange={setOtp} />
            </View>
            <Button
              title="Verify Code"
              onPress={handleVerifyOtp}
              loading={verifyResetOtp.isPending}
              disabled={otp.length < 6}
              fullWidth size="lg"
              style={{ marginTop: 28 }}
            />
          </>
        )}

        {/* ── Step 2: New Password ───────────────────────────────────────── */}
        {step === 2 && (
          <>
            <AuthHeader
              title="Set new password"
              subtitle="Choose a strong password for your account."
              showLogo={false}
            />
            <FormError message={step2Error} />

            <Controller control={control} name="newPassword"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    label="New Password" placeholder="Minimum 8 characters"
                    value={field.value} onChangeText={field.onChange}
                    error={fieldState.error?.message}
                    secureTextEntry={!showPwd} returnKeyType="next"
                    leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPwd((v) => !v)}>
                        <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    }
                  />
                  <PasswordStrength password={field.value} />
                </>
              )}
            />

            <Controller control={control} name="confirmPassword"
              render={({ field, fieldState }) => (
                <Input
                  label="Confirm Password" placeholder="Repeat your new password"
                  value={field.value} onChangeText={field.onChange}
                  error={fieldState.error?.message}
                  secureTextEntry={!showConfirm} returnKeyType="done"
                  onSubmitEditing={onSubmitPassword}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                      <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  }
                />
              )}
            />

            <Button
              title="Reset Password"
              onPress={onSubmitPassword}
              loading={resetPassword.isPending}
              fullWidth size="lg"
              style={{ marginTop: 16 }}
              leftIcon={<Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll:     { flexGrow: 1 },
  backBtn:    { marginBottom: 16 },
  stepRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28, position: 'relative' },
  stepItem:   { alignItems: 'center', gap: 4 },
  stepDot:    { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  stepNum:    { fontWeight: '700', fontSize: 13 },
  stepLabel:  { fontWeight: '600' },
  stepLine:   { position: 'absolute', height: 2, width: 60, top: 14 },
  otpWrapper: { alignItems: 'center', marginTop: 8 },
});