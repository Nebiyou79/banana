// src/screens/auth/OtpVerifyScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme }         from '../../hooks/useTheme';
import { Button }           from '../../components/ui/Button';
import { AuthHeader }       from '../../components/auth/AuthHeader';
import { OtpInput }         from '../../components/auth/OtpInput';
import { FormError }        from '../../components/auth/FormError';
import { useVerifyOtp, useResendOtp } from '../../hooks/useAuth';
import type { AuthStackParamList }    from '../../navigation/AuthNavigator';

type Nav   = NativeStackNavigationProp<AuthStackParamList, 'OtpVerify'>;
type Route = RouteProp<AuthStackParamList, 'OtpVerify'>;

const COUNTDOWN_SECONDS = 60;

export const OtpVerifyScreen: React.FC = () => {
  const { colors, type, spacing, radius, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { email }  = route.params;

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
      onSuccess: () => {
        setOtp('');
        startTimer();
      },
    });
  };

  const apiError    = (verifyOtp.error as any)?.response?.data?.message;
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bgPrimary }]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
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

        <AuthHeader
          title="Check your email"
          subtitle={`We sent a 6-digit code to\n${maskedEmail}`}
          showLogo={false}
        />

        <FormError message={apiError} visible={!!apiError} />

        {/* OTP boxes */}
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
          fullWidth
          size="lg"
          style={{ marginTop: spacing['2xl'] }}
        />

        {/* Resend row */}
        <View style={styles.resendRow}>
          {canResend ? (
            <Pressable
              onPress={handleResend}
              disabled={resendOtp.isPending}
              accessibilityLabel="Resend OTP code"
            >
              <Text
                style={[
                  type.bodySm,
                  {
                    color:      colors.accent,
                    fontWeight: '700',
                    textDecorationLine: 'underline',
                    opacity:    resendOtp.isPending ? 0.5 : 1,
                  },
                ]}
              >
                {resendOtp.isPending ? 'Sending…' : 'Resend OTP'}
              </Text>
            </Pressable>
          ) : (
            <Text style={[type.bodySm, { color: colors.textMuted }]}>
              Resend in{' '}
              <Text style={{ color: colors.accent, fontWeight: '700' }}>
                {seconds}s
              </Text>
            </Text>
          )}
        </View>

        {/* Help callout */}
        <View
          style={[
            styles.helpBox,
            {
              backgroundColor: colors.infoBg,
              borderRadius:    radius.md,
              padding:         spacing.md,
              marginTop:       spacing['2xl'],
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={colors.info}
          />
          <Text style={[type.caption, { color: colors.info, flex: 1 }]}>
            Check your spam folder if you don't see the email. The code expires in 10 minutes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  scroll:     { flexGrow: 1, paddingTop: 16, paddingBottom: 40 },
  backBtn:    { marginBottom: 24 },
  otpWrapper: { alignItems: 'center', marginTop: 8 },
  resendRow:  { alignItems: 'center', marginTop: 20 },
  helpBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});

export default OtpVerifyScreen;
