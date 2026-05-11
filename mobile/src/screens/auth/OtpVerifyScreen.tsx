// src/screens/auth/OtpVerifyScreen.tsx
// MIGRATED: useTheme() only, AuthShell, AppHeader, spacing/radius tokens, Ionicons only

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { Button }        from '../../components/ui/Button';
import { AuthHeader }    from '../../components/auth/AuthHeader';
import { OtpInput }      from '../../components/auth/OtpInput';
import { FormError }     from '../../components/auth/FormError';
import { useVerifyOtp, useResendOtp } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AuthShell } from './_AuthShell';

type Nav   = NativeStackNavigationProp<AuthStackParamList, 'OtpVerify'>;
type Route = RouteProp<AuthStackParamList, 'OtpVerify'>;

const COUNTDOWN_SECONDS = 60;

export const OtpVerifyScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { email }  = route.params;
  const { colors: c, spacing, radius, type } = useTheme();

  const [otp, setOtp]             = useState('');
  const [seconds, setSeconds]     = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  const startTimer = () => {
    setSeconds(COUNTDOWN_SECONDS);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(timerRef.current!); setCanResend(true); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleVerify = () => {
    if (otp.length < 6) return;
    verifyOtp.mutate({ email, otp });
  };

  const handleResend = () => {
    resendOtp.mutate(email, {
      onSuccess: () => { setOtp(''); startTimer(); },
    });
  };

  const apiError    = (verifyOtp.error as any)?.response?.data?.message;
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <AuthShell>
      <AuthHeader
        title="Check your email"
        subtitle={`We sent a 6-digit code to\n${maskedEmail}`}
        showLogo={false}
      />

      <FormError message={apiError} visible={!!apiError} />

      {/* OTP boxes */}
      <View style={[S.otpWrapper, { marginTop: spacing.sm }]}>
        <OtpInput length={6} value={otp} onChange={setOtp} error={apiError} />
      </View>

      <Button
        onPress={handleVerify}
        loading={verifyOtp.isPending}
        disabled={otp.length < 6}
        fullWidth
        size="lg"
        style={{ marginTop: spacing.xl }}
label="Verify"/>

      {/* Resend row */}
      <View style={[S.resendRow, { marginTop: spacing.lg }]}>
        {canResend ? (
          <Pressable onPress={handleResend} disabled={resendOtp.isPending} hitSlop={8} accessibilityLabel="Resend OTP code">
            <Text style={[type.bodySm, {
              color:               c.primary,
              fontWeight:          '700',
              textDecorationLine:  'underline',
              opacity:             resendOtp.isPending ? 0.5 : 1,
            }]}>
              {resendOtp.isPending ? 'Sending…' : 'Resend OTP'}
            </Text>
          </Pressable>
        ) : (
          <Text style={[type.bodySm, { color: c.textMuted }]}>
            Resend in <Text style={{ color: c.primary, fontWeight: '700' }}>{seconds}s</Text>
          </Text>
        )}
      </View>

      {/* Help callout */}
      <View style={[S.helpBox, {
        backgroundColor: c.infoBg,
        borderRadius:    radius.md,
        padding:         spacing.md,
        marginTop:       spacing.xl,
      }]}>
        <Ionicons name="information-circle-outline" size={16} color={c.info} />
        <Text style={[type.caption, { color: c.info, flex: 1, marginLeft: spacing.sm }]}>
          Check your spam folder if you don't see the email. The code expires in 10 minutes.
        </Text>
      </View>
    </AuthShell>
  );
};

const S = StyleSheet.create({
  otpWrapper: { alignItems: 'center' },
  resendRow:  { alignItems: 'center' },
  helpBox:    { flexDirection: 'row', alignItems: 'flex-start' },
});

export default OtpVerifyScreen;