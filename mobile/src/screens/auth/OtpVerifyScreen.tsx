import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Button } from '../../components/ui/Button';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { OtpInput } from '../../components/auth/OtpInput';
import { FormError } from '../../components/auth/AuthDivider';
import { useVerifyOtp, useResendOtp } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav   = NativeStackNavigationProp<AuthStackParamList, 'OtpVerify'>;
type Route = RouteProp<AuthStackParamList, 'OtpVerify'>;

const COUNTDOWN_SECONDS = 60;

export const OtpVerifyScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;

  const [otp, setOtp]             = useState('');
  const [seconds, setSeconds]     = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  // Countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const resetTimer = () => {
    setSeconds(COUNTDOWN_SECONDS);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleVerify = () => {
    if (otp.length < 6) return;
    verifyOtp.mutate({ email, otp });
  };

  const handleResend = () => {
    resendOtp.mutate(email, {
      onSuccess: () => {
        setOtp('');
        resetTimer();
      },
    });
  };

  const apiError = (verifyOtp.error as any)?.response?.data?.message;
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { padding: spacing[6] }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </TouchableOpacity>

        <AuthHeader
          title="Verify your email"
          subtitle={`We sent a 6-digit code to\n${maskedEmail}`}
          showLogo={false}
        />

        <FormError message={apiError} />

        <View style={styles.otpWrapper}>
          <OtpInput
            length={6}
            value={otp}
            onChange={setOtp}
            error={apiError}
          />
        </View>

        <Button
          title="Verify"
          onPress={handleVerify}
          loading={verifyOtp.isPending}
          disabled={otp.length < 6}
          fullWidth size="lg"
          style={{ marginTop: 28 }}
        />

        {/* Resend */}
        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={resendOtp.isPending}>
              <Text style={[styles.resendActive, { color: colors.primary, fontSize: typography.sm }]}>
                {resendOtp.isPending ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.resendTimer, { color: colors.textMuted, fontSize: typography.sm }]}>
              Resend in{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {seconds}s
              </Text>
            </Text>
          )}
        </View>

        {/* Help */}
        <View style={[styles.helpBox, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.lg }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.helpText, { color: colors.primary, fontSize: typography.xs }]}>
            Check your spam folder if you don't see the email. The code expires in 10 minutes.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1 },
  scroll:     { flexGrow: 1 },
  backBtn:    { marginBottom: 24 },
  otpWrapper: { alignItems: 'center', marginTop: 8 },
  resendRow:  { alignItems: 'center', marginTop: 20 },
  resendActive: { fontWeight: '700', textDecorationLine: 'underline' },
  resendTimer: {},
  helpBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, marginTop: 28 },
  helpText: { flex: 1, lineHeight: 16 },
});